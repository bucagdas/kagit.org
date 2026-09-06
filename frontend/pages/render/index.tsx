import { createRoot } from "react-dom/client"
import React from "react"
import { PasteBin } from "../PasteBin.js"
import { HljsProvider } from "../../utils/highlight-client.js"
import { LocaleProvider } from "../../i18n/LocaleContext.js"

const rootElement = document.getElementById("root")!
const config = __WRANGLER_CONFIG__

// This used to hydrateRoot() against the server-rendered markup, pinning the client's
// initial locale to the SSR-resolved one (read off <html lang>) so the first render would
// reproduce the SSR output exactly. In production that hydration reliably still logged
// "Hydration failed" (React #418) on every load, and — worse — some subtrees (the paste
// editor's toolbar, expiration copy) ended up rendered in the wrong language once React
// discarded and regenerated them to recover. Root cause not resolved; the admin-URL flow
// below (plain createRoot, no hydration at all) was confirmed to always render correctly,
// so every load now takes that same path: clear whatever the server sent and do a fresh
// client render. This gives up SSR's faster first paint for this page in exchange for
// actually-correct content — worth revisiting once the hydration bug itself is found.
rootElement.innerHTML = ""

const tree = (
  <React.StrictMode>
    <LocaleProvider>
      <HljsProvider>
        <PasteBin config={config} />
      </HljsProvider>
    </LocaleProvider>
  </React.StrictMode>
)

createRoot(rootElement).render(tree)
