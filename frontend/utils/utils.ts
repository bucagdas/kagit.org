import { PASSWD_SEP } from "../../shared/constants.js"
import { parseExpiration, parseExpirationReadable, parseSize } from "../../shared/parsers.js"
import { verifyExpiration as verifyExpirationShared } from "../../shared/verify.js"
import type { Messages } from "../i18n/translations/en.js"

export function getMaxExpirationSeconds(config: Env): number {
  return parseExpiration(config.MAX_EXPIRATION)!
}

export function getMaxExpirationReadable(config: Env, t?: Messages): string {
  return parseExpirationReadable(config.MAX_EXPIRATION, t)!
}

export { ErrorWithTitle } from "./errors.js"

export function verifyFileSize(size: number, config: Env, t?: Messages): [boolean, string] {
  const max = parseSize(config.R2_MAX_ALLOWED)
  if (max === null || size <= max) return [true, ""]
  return [
    false,
    t
      ? t.validation.fileTooLarge.replace("{size}", formatSize(size)).replace("{max}", formatSize(max))
      : `File too large (${formatSize(size)} > ${formatSize(max)})`,
  ]
}

export function formatSize(size: number): string {
  if (!size) return "0"
  if (size < 1024) {
    return `${size} Bytes`
  } else if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(2)} KB`
  } else if (size < 1024 * 1024 * 1024) {
    return `${(size / 1024 / 1024).toFixed(2)} MB`
  } else {
    return `${(size / 1024 / 1024 / 1024).toFixed(2)} GB`
  }
}

export function verifyExpiration(expiration: string, config: Env, t?: Messages): [boolean, string] {
  return verifyExpirationShared(expiration, getMaxExpirationSeconds(config), t)
}

export function verifyManageUrl(url: string, config: Env, t?: Messages): [boolean, string] {
  try {
    const url_parsed = new URL(url)
    if (url_parsed.origin !== config.DEPLOY_URL) {
      return [
        false,
        t
          ? t.validation.urlShouldStartWith.replace("{url}", config.DEPLOY_URL)
          : `URL should starts with ${config.DEPLOY_URL}`,
      ]
    } else if (!url_parsed.pathname.includes(PASSWD_SEP)) {
      return [false, t ? t.validation.urlShouldContainColon : `URL should contain a colon`]
    } else {
      return [true, ""]
    }
  } catch (e) {
    if (e instanceof TypeError) {
      return [false, t ? t.validation.invalidUrl : "Invalid URL"]
    } else {
      throw e
    }
  }
}
