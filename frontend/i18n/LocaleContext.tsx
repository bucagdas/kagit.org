import React, { createContext, useContext, useEffect, useState } from "react"
import type { Locale } from "../../shared/i18n/locales.js"
import {
  DEFAULT_LOCALE,
  SUPPORTED_LOCALES,
  isSupportedLocale,
  resolveLocaleFromNavigatorLanguages,
} from "../../shared/i18n/locales.js"
import { en } from "./translations/en.js"
import { tr } from "./translations/tr.js"
import { de } from "./translations/de.js"
import { az } from "./translations/az.js"
import type { Messages } from "./translations/en.js"

const dictionaries: Record<Locale, Messages> = { en, tr, de, az }

export type LocaleSelection = "system" | Locale
const LOCALE_STORAGE_KEY = "localeSelect"

interface LocaleContextValue {
  locale: Locale
  selection: LocaleSelection
  setSelection: (s: LocaleSelection) => void
  t: Messages
}

const LocaleContext = createContext<LocaleContextValue | null>(null)

// localStorage can throw (Safari private browsing, sandboxed iframes, or — as in this
// project's test environment — a jsdom/Node setup where the global isn't wired up), so
// every access here is defensive; a failure just means no persisted preference.
function readStoredSelection(): LocaleSelection | null {
  try {
    const stored = localStorage.getItem(LOCALE_STORAGE_KEY)
    if (stored && (stored === "system" || isSupportedLocale(stored))) return stored
  } catch {
    // ignore
  }
  return null
}

function writeStoredSelection(selection: LocaleSelection) {
  try {
    localStorage.setItem(LOCALE_STORAGE_KEY, selection)
  } catch {
    // ignore
  }
}

export function LocaleProvider({
  children,
  // Pass the locale the server resolved via Accept-Language and rendered the SSR HTML
  // with, read back off <html lang> before hydration (see render/index.tsx and
  // render/display.tsx). The first client render MUST reproduce it exactly, or React's
  // hydration will complain about (and may misrender) a client/server text mismatch. A
  // stored preference or navigator.language is only applied afterwards, in an effect —
  // safe, since that happens after the hydration commit.
  initialLocale,
}: {
  children: React.ReactNode
  initialLocale?: Locale
}) {
  const [selection, setSelectionState] = useState<LocaleSelection>(() => {
    if (initialLocale) return initialLocale
    return readStoredSelection() ?? "system"
  })

  useEffect(() => {
    if (initialLocale) {
      const stored = readStoredSelection()
      if (stored && stored !== initialLocale) setSelectionState(stored)
    }
    // Only ever reconcile once, right after the SSR-matching first paint.
  }, [])

  useEffect(() => {
    writeStoredSelection(selection)
  }, [selection])

  const locale: Locale =
    selection === "system"
      ? typeof navigator !== "undefined"
        ? resolveLocaleFromNavigatorLanguages(navigator.languages || [navigator.language])
        : DEFAULT_LOCALE
      : selection

  useEffect(() => {
    document.documentElement.lang = locale
  }, [locale])

  const value: LocaleContextValue = { locale, selection, setSelection: setSelectionState, t: dictionaries[locale] }
  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
}

export function useLocale(): LocaleContextValue {
  const ctx = useContext(LocaleContext)
  if (!ctx) throw new Error("useLocale must be used within a LocaleProvider")
  return ctx
}

// Shorthand for the common case of just needing the message dictionary.
export function useT(): Messages {
  return useLocale().t
}

export { SUPPORTED_LOCALES }
export type { Locale, Messages }
