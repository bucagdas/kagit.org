import { hydrateRoot } from "react-dom/client"
import React from "react"
import { DisplayPaste } from "../DisplayPaste.js"
import { HljsProvider } from "../../utils/highlight-client.js"
import { LocaleProvider } from "../../i18n/LocaleContext.js"
import { isSupportedLocale } from "../../../shared/i18n/locales.js"

const rootElement = document.getElementById("root")!
const config = __WRANGLER_CONFIG__

// See render/index.tsx: reuse the server-picked <html lang> so the first client render
// matches the SSR'd HTML byte-for-byte and hydration doesn't warn about a text mismatch.
const htmlLang = document.documentElement.lang
const initialLocale = window.__PASTE_DATA__ && isSupportedLocale(htmlLang) ? htmlLang : undefined

const tree = (
  <React.StrictMode>
    <LocaleProvider initialLocale={initialLocale}>
      <HljsProvider>
        <DisplayPaste config={config} />
      </HljsProvider>
    </LocaleProvider>
  </React.StrictMode>
)

if (window.__PASTE_DATA__) {
  hydrateRoot(rootElement, tree)
} else {
  const { createRoot } = await import("react-dom/client")
  createRoot(rootElement).render(tree)
}
