import { hydrateRoot, createRoot } from "react-dom/client"
import React from "react"
import { PasteBin } from "../PasteBin.js"
import { HljsProvider } from "../../utils/highlight-client.js"
import { LocaleProvider } from "../../i18n/LocaleContext.js"
import { isSupportedLocale } from "../../../shared/i18n/locales.js"

const rootElement = document.getElementById("root")!
const config = __WRANGLER_CONFIG__

// Check if this is an SSR-rendered page
const isSSR = rootElement.hasChildNodes()

// The server picks a locale from Accept-Language and renders <html lang="...">
// accordingly (see worker/pages/index.ts). Reusing that same attribute here — instead of
// re-deriving the locale from navigator.language — guarantees this first client render
// reproduces the SSR'd HTML exactly; anything else risks a hydration mismatch.
const htmlLang = document.documentElement.lang
const initialLocale = isSSR && isSupportedLocale(htmlLang) ? htmlLang : undefined

const tree = (
  <React.StrictMode>
    <LocaleProvider initialLocale={initialLocale}>
      <HljsProvider>
        <PasteBin config={config} />
      </HljsProvider>
    </LocaleProvider>
  </React.StrictMode>
)

if (isSSR) {
  hydrateRoot(rootElement, tree)
} else {
  // CSR (admin URL or SSR failed)
  createRoot(rootElement).render(tree)
}
