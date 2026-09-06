import { MAX_PASSWD_LEN, MIN_PASSWD_LEN, NAME_REGEX } from "./constants.js"
import { parseExpiration, parseExpirationReadable } from "./parsers.js"
import type { Messages } from "../frontend/i18n/translations/en.js"

export type VerifyResult = [ok: true, message: string] | [ok: false, error: string]

export function isLegalUrl(url: string): boolean {
  return URL.canParse(url)
}

// `t` is optional and omitted by backend callers (worker/handlers/handleWrite.ts validates
// the same way for its HTTP error responses, which stay English per doc/api.md) — only the
// frontend UI passes it, to localize the same validation for on-page hints.
export function verifyPassword(password: string, t?: Messages): VerifyResult {
  if (password === "") {
    return [true, ""]
  } else if (password.length < MIN_PASSWD_LEN) {
    return [
      false,
      t
        ? t.validation.passwordTooShort
            .replace("{len}", String(password.length))
            .replace("{min}", String(MIN_PASSWD_LEN))
        : `Password too short (${password.length} < ${MIN_PASSWD_LEN})`,
    ]
  } else if (password.length > MAX_PASSWD_LEN) {
    return [
      false,
      t
        ? t.validation.passwordTooLong
            .replace("{len}", String(password.length))
            .replace("{max}", String(MAX_PASSWD_LEN))
        : `Password too long (${password.length} > ${MAX_PASSWD_LEN})`,
    ]
  } else if (password.includes("\n")) {
    return [false, t ? t.validation.passwordNewline : "Password should not contain newlines"]
  }
  return [true, ""]
}

export function verifyName(name: string, t?: Messages): VerifyResult {
  if (name.length < 3) {
    return [false, t ? t.validation.nameTooShort : "Name should have at least 3 characters"]
  } else if (!NAME_REGEX.test(name)) {
    return [false, t ? t.validation.nameInvalidChars : `Name ${name} not satisfying regexp ${NAME_REGEX}`]
  }
  return [true, ""]
}

export function verifyExpiration(expiration: string, maxExpirationSeconds: number, t?: Messages): VerifyResult {
  const parsed = parseExpiration(expiration)
  if (parsed === null) {
    return [
      false,
      t
        ? t.validation.invalidExpiration.replace("{expiration}", expiration)
        : `‘${expiration}’ is not a valid expiration specification`,
    ]
  }
  if (parsed > maxExpirationSeconds) {
    const readable = parseExpirationReadable(`${maxExpirationSeconds}s`, t)!
    return [
      false,
      t ? t.validation.exceedMaxExpiration.replace("{readable}", readable) : `Exceed max expiration (${readable})`,
    ]
  }
  const readable = parseExpirationReadable(expiration, t)!
  return [true, t ? t.validation.expiresIn.replace("{readable}", readable) : `Expires in ${readable}`]
}
