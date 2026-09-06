import { createRoot } from "react-dom/client"
import React from "react"
import { DisplayPaste } from "../DisplayPaste.js"
import { HljsProvider } from "../../utils/highlight-client.js"
import { LocaleProvider } from "../../i18n/LocaleContext.js"

const rootElement = document.getElementById("root")!
const config = __WRANGLER_CONFIG__

// See render/index.tsx for why this always does a fresh client render instead of
// hydrateRoot(): hydrating against the SSR markup was reliably logging "Hydration failed"
// (React #418) and sometimes left part of the tree rendered in the wrong language. Clearing
// #root and rendering fresh sidesteps that; window.__PASTE_DATA__ (a separate embedded
// <script>, untouched by this) still lets DisplayPaste skip its own network fetch either way.
rootElement.innerHTML = ""

const tree = (
  <React.StrictMode>
    <LocaleProvider>
      <HljsProvider>
        <DisplayPaste config={config} />
      </HljsProvider>
    </LocaleProvider>
  </React.StrictMode>
)

createRoot(rootElement).render(tree)
