import { PASSWD_SEP } from "./constants.js"
import type { Messages } from "../frontend/i18n/translations/en.js"
import { formatDurationUnit } from "./i18n/duration.js"

export class ParseError extends Error {
  constructor(msg: string) {
    super(msg)
  }
}

export function parseSize(sizeStr: string): number | null {
  sizeStr = sizeStr.trim()
  const SIZE_REGEX = /^\d+(\.\d+)?\s*[KMG]?$/
  if (!SIZE_REGEX.test(sizeStr)) {
    return null
  }

  let sizeBytes = parseFloat(sizeStr)
  const lastChar = sizeStr[sizeStr.length - 1]
  if (lastChar === "K") sizeBytes *= 1024
  else if (lastChar === "M") sizeBytes *= 1024 * 1024
  else if (lastChar === "G") sizeBytes *= 1024 * 1024 * 1024
  return sizeBytes
}

export function parseExpiration(expirationStr: string): number | null {
  expirationStr = expirationStr.trim()
  const EXPIRE_REGEX = /^\d+(\.\d+)?\s*[smhd]?$/
  if (!EXPIRE_REGEX.test(expirationStr)) {
    return null
  }

  let expirationSeconds = parseFloat(expirationStr)
  const lastChar = expirationStr[expirationStr.length - 1]
  if (lastChar === "m") expirationSeconds *= 60
  else if (lastChar === "h") expirationSeconds *= 3600
  else if (lastChar === "d") expirationSeconds *= 3600 * 24
  return expirationSeconds
}

// `t` is optional and omitted by backend/API callers (worker/handlers/handleWrite.ts's error
// responses stay English, matching doc/api.md) — only the frontend UI passes it, to localize
// the same reading for on-page hints.
export function parseExpirationReadable(expirationStr: string, t?: Messages): string | null {
  expirationStr = expirationStr.trim()
  const EXPIRE_REGEX = /^\d+(\.\d+)?\s*[smhd]?$/
  if (!EXPIRE_REGEX.test(expirationStr)) {
    return null
  }

  const num = parseFloat(expirationStr)
  const lastChar = expirationStr[expirationStr.length - 1]
  const unit = lastChar === "m" ? "minute" : lastChar === "h" ? "hour" : lastChar === "d" ? "day" : "second"
  if (t) return formatDurationUnit(t, num, unit)
  return `${num} ${unit}${num > 1 ? "s" : ""}`
}

export interface ParsedPath {
  name: string
  role?: string
  password?: string
  ext?: string
  filename?: string
}

export function parsePath(pathname: string): ParsedPath {
  pathname = pathname.slice(1) // strip the leading slash

  let role: string | undefined,
    ext: string | undefined,
    filename: string | undefined,
    passwd: string | undefined,
    short: string | undefined

  // extract and remove role
  if (pathname[1] === "/") {
    role = pathname[0]
    pathname = pathname.slice(2)
  }

  // extract and remove filename
  const startOfFilename = pathname.lastIndexOf("/")
  if (startOfFilename >= 0) {
    filename = decodeURIComponent(pathname.slice(startOfFilename + 1))
    pathname = pathname.slice(0, startOfFilename)
  }

  // if having filename, parse ext from filename, else from remaining pathname
  if (filename) {
    const startOfExt = filename.indexOf(".")
    if (startOfExt >= 0) {
      ext = filename.slice(startOfExt)
    }
  } else {
    const startOfExt = pathname.indexOf(".")
    if (startOfExt >= 0) {
      ext = pathname.slice(startOfExt)
      pathname = pathname.slice(0, startOfExt)
    }
  }

  const endOfShort = pathname.indexOf(PASSWD_SEP)
  if (endOfShort < 0) {
    short = pathname
    passwd = undefined
  } else {
    short = pathname.slice(0, endOfShort)
    passwd = pathname.slice(endOfShort + 1)
  }

  if (!short) {
    throw new ParseError(`invalid path: paste name is empty`)
  }

  return { role, name: short, password: passwd, ext, filename }
}

export function parseFilenameFromContentDisposition(contentDisposition: string): string | undefined {
  let filename: string | undefined = undefined

  const filenameStarRegex = /filename\*=UTF-8''([^;]*)/i
  const filenameStarMatch = filenameStarRegex.exec(contentDisposition)

  if (filenameStarMatch?.[1]) {
    filename = decodeURIComponent(filenameStarMatch[1])
  }

  if (!filename) {
    const filenameRegex = /filename="([^"]*)"/i
    const filenameMatch = filenameRegex.exec(contentDisposition)

    if (filenameMatch?.[1]) {
      filename = filenameMatch[1]
    }
  }

  return filename
}
