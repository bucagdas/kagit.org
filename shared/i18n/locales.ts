// Locale resolution shared between the edge SSR render (worker/pages/*.ts, reading the
// request's Accept-Language header) and the client (reading navigator.languages). Both
// sides must resolve the same way so a hydrated client render matches its SSR'd HTML.

export const SUPPORTED_LOCALES = ["en", "tr", "de", "az"] as const
export type Locale = (typeof SUPPORTED_LOCALES)[number]
export const DEFAULT_LOCALE: Locale = "en"

export const LOCALE_LABELS: Record<Locale, string> = {
  en: "English",
  tr: "Türkçe",
  de: "Deutsch",
  az: "Azərbaycanca",
}

export function isSupportedLocale(value: string): value is Locale {
  return (SUPPORTED_LOCALES as readonly string[]).includes(value)
}

function baseTag(tag: string): string {
  return tag.trim().split(/[-_]/)[0].toLowerCase()
}

// Picks the first supported locale from a list of BCP-47-ish language tags, in order
// of preference (already sorted by caller if relevant).
function firstSupported(tags: readonly string[]): Locale | null {
  for (const tag of tags) {
    const base = baseTag(tag)
    if (isSupportedLocale(base)) return base
  }
  return null
}

// Parses an `Accept-Language` header value (e.g. "tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7")
// into tags ordered by descending quality.
export function parseAcceptLanguage(header: string): string[] {
  return header
    .split(",")
    .map((part) => {
      const [tagRaw, ...paramsRaw] = part.trim().split(";")
      const qParam = paramsRaw.find((p) => p.trim().startsWith("q="))
      const q = qParam ? parseFloat(qParam.trim().slice(2)) : 1
      return { tag: tagRaw.trim(), q: Number.isFinite(q) ? q : 1 }
    })
    .filter((entry) => entry.tag.length > 0)
    .sort((a, b) => b.q - a.q)
    .map((entry) => entry.tag)
}

export function resolveLocaleFromAcceptLanguage(header: string | null | undefined): Locale {
  if (!header) return DEFAULT_LOCALE
  return firstSupported(parseAcceptLanguage(header)) ?? DEFAULT_LOCALE
}

export function resolveLocaleFromNavigatorLanguages(languages: readonly string[]): Locale {
  return firstSupported(languages) ?? DEFAULT_LOCALE
}
