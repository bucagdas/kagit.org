import { renderToReadableStream } from "react-dom/server.edge"
import React from "react"
import { PasteBin } from "../../frontend/pages/PasteBin.js"
import { LocaleProvider } from "../../frontend/i18n/LocaleContext.js"
import { HljsHookProvider, LanguagesProvider } from "../../frontend/utils/highlight.js"
import { resolveLocaleFromAcceptLanguage } from "../../shared/i18n/locales.js"
import { decode, escapeHtml } from "../common.js"
import manifest from "../../dist/frontend/.vite/ssr-manifest.json"
import { PASSWD_SEP } from "../../shared/constants.js"
import { getAssetPaths, renderCssLinks, renderSeoHeadTags, DARK_MODE_SCRIPT, FONT_LINK_TAGS } from "../ssrUtils.js"

export async function renderIndexPage(
  env: Env,
  pathname: string,
  acceptLanguage: string | null,
): Promise<string | null> {
  // Admin URLs (containing password separator) skip SSR because they need client-side fetch
  if (pathname.includes(PASSWD_SEP)) {
    return null
  }

  const locale = resolveLocaleFromAcceptLanguage(acceptLanguage)

  // Build React element
  const config: Env = {
    DEPLOY_URL: env.DEPLOY_URL,
    REPO: env.REPO,
    MAX_EXPIRATION: env.MAX_EXPIRATION,
    DEFAULT_EXPIRATION: env.DEFAULT_EXPIRATION,
    INDEX_PAGE_TITLE: env.INDEX_PAGE_TITLE,
  } as Env

  // The client wraps the same tree in <HljsProvider> (see render/index.tsx), which nests
  // two extra context-provider fibers (HljsHookProvider, LanguagesProvider) around PasteBin.
  // useId()'s ids are derived from tree position, so mirroring that nesting here — even
  // with the same no-highlighting-on-server behavior the bare default context already gave
  // — is required for every id generated inside PasteBin to match between SSR and hydration.
  const reactElement = React.createElement(
    React.StrictMode,
    null,
    React.createElement(LocaleProvider, {
      initialLocale: locale,
      children: React.createElement(HljsHookProvider, {
        value: () => undefined,
        children: React.createElement(LanguagesProvider, {
          value: [],
          children: React.createElement(PasteBin, { config }),
        }),
      }),
    }),
  )

  // Render to HTML stream
  const stream = await renderToReadableStream(reactElement)
  const reader = stream.getReader() as ReadableStreamDefaultReader<Uint8Array>
  let html = ""
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    html += decode(value.buffer as ArrayBuffer)
  }

  // Get resource paths from manifest
  const { jsFile, cssPaths } = getAssetPaths(manifest, "index.html")

  // Generate complete HTML
  return `<!doctype html>
<html lang="${locale}">
<head>
<meta charset="UTF-8" />
<link rel="icon" href="/favicon.svg" type="image/svg+xml" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${escapeHtml(env.INDEX_PAGE_TITLE)}</title>
${renderSeoHeadTags(env, locale)}
${FONT_LINK_TAGS}
${renderCssLinks(cssPaths)}
<script>
${DARK_MODE_SCRIPT}
</script>
</head>
<body>
<div id="root">${html}</div>
<script type="module" src="/${jsFile}"></script>
</body>
</html>`
}
