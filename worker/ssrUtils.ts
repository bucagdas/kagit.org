import { escapeHtml } from "./common.js"
import type { Locale } from "../shared/i18n/locales.js"
import { en } from "../frontend/i18n/translations/en.js"
import { tr } from "../frontend/i18n/translations/tr.js"
import { de } from "../frontend/i18n/translations/de.js"
import { az } from "../frontend/i18n/translations/az.js"

// Slim per-entry asset map produced by the `ssr-manifest` Vite plugin in
// frontend/vite.config.js. Importing the full Vite manifest pulls every chunk
// (one per highlight.js language) into the worker bundle, which we don't want.
export interface SsrAssetPaths {
  jsFile: string
  // ALL transitively-reached CSS chunk paths for this entry, not just one —
  // an entry like index.html now reaches both a Tailwind/component-styles
  // chunk and a highlight-theme chunk through different transitive imports.
  cssPaths: string[]
}

export type SsrManifest = Record<string, SsrAssetPaths>

export function getAssetPaths(manifest: SsrManifest, entryKey: string): SsrAssetPaths {
  return manifest[entryKey] ?? { jsFile: `assets/${entryKey.replace(".html", ".js")}`, cssPaths: ["assets/style.css"] }
}

export function renderCssLinks(cssPaths: readonly string[]): string {
  return cssPaths.map((p) => `<link rel="stylesheet" href="/${p}">`).join("")
}

// Karla is the brand's UI typeface (see frontend/style.css's --font-sans); load it explicitly
// since "Karla" alone in a font-family list silently falls back to the system font in any
// browser that doesn't happen to have it installed.
export const FONT_LINK_TAGS = `<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Karla:ital,wght@0,400;0,500;0,700;1,400&display=swap" rel="stylesheet">`

export const DARK_MODE_SCRIPT = `(function() {
  const stored = localStorage.getItem('darkModeSelect') || 'system';
  const isDark = stored === 'dark' || (stored === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  const root = document.documentElement;
  root.classList.add(isDark ? 'dark' : 'light');
  root.style.colorScheme = isDark ? 'dark' : 'light';
})();`

export const MAX_SSR_FILE_SIZE = 1024 * 1024 // 1MB

const TAGLINE_BY_LOCALE: Record<Locale, string> = {
  en: en.pasteBin.tagline,
  tr: tr.pasteBin.tagline,
  de: de.pasteBin.tagline,
  az: az.pasteBin.tagline,
}

const OG_LOCALE_BY_LOCALE: Record<Locale, string> = {
  en: "en_US",
  tr: "tr_TR",
  de: "de_DE",
  az: "az_AZ",
}

// Shared SEO/social head tags for the index page, used by both the SSR render (worker/pages/index.ts)
// and its CSR fallback (worker/handlers/handleRead.ts). `noIndex` is set for the admin/manage URL
// shell, which robots.txt already disallows crawling — this is defense in depth in case a manage
// link (which carries a paste's password) ever gets fetched or linked from somewhere unexpected.
export function renderSeoHeadTags(env: Env, locale: Locale, opts: { noIndex?: boolean } = {}): string {
  const title = escapeHtml(env.INDEX_PAGE_TITLE)
  const descriptionRaw = TAGLINE_BY_LOCALE[locale]
  const description = escapeHtml(descriptionRaw)
  const url = `${env.DEPLOY_URL}/`
  const robotsTag = opts.noIndex ? `<meta name="robots" content="noindex">\n` : ""
  const ldJson = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: env.INDEX_PAGE_TITLE,
    url,
    description: descriptionRaw,
    applicationCategory: "UtilitiesApplication",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  })
  return `${robotsTag}<meta name="description" content="${description}">
<link rel="canonical" href="${escapeHtml(url)}">
<meta property="og:type" content="website">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${description}">
<meta property="og:url" content="${escapeHtml(url)}">
<meta property="og:site_name" content="${title}">
<meta property="og:locale" content="${OG_LOCALE_BY_LOCALE[locale]}">
<meta name="twitter:card" content="summary">
<meta name="twitter:title" content="${title}">
<meta name="twitter:description" content="${description}">
<script type="application/ld+json">${ldJson}</script>`
}
