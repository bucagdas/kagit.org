import { escapeHtml } from "./common.js"
import type { Locale } from "../shared/i18n/locales.js"

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

const OG_LOCALE_BY_LOCALE: Record<Locale, string> = {
  en: "en_US",
  tr: "tr_TR",
  de: "de_DE",
  az: "az_AZ",
}

// Deliberately separate from the app's own i18n Messages: this is search/social metadata,
// never rendered in the UI, and needs to read as an actual pitch with real keywords (pastebin,
// short link, encryption, curl/API) rather than the one-line tagline that used to double as
// both. Both suffixes are appended straight to env.INDEX_PAGE_TITLE, so a fork that renames the
// site (wrangler.toml's INDEX_PAGE_TITLE) still gets a correctly-branded title/description.
const SEO_TITLE_SUFFIX_BY_LOCALE: Record<Locale, string> = {
  en: " - Free Pastebin for Text, Code & Files",
  tr: " - Ücretsiz Pastebin: Metin, Kod ve Dosya Paylaşımı",
  de: " - Kostenloser Pastebin für Text, Code & Dateien",
  az: " - Pulsuz Pastebin: Mətn, Kod və Fayl Paylaşımı",
}

const SEO_DESCRIPTION_SUFFIX_BY_LOCALE: Record<Locale, string> = {
  en: ": share text, code, and files via a short link, for free. Client-side encryption, burn-after-read, Markdown rendering, and a curl-friendly HTTP API.",
  tr: ": metin, kod ve dosyalarınızı kısa bir bağlantıyla ücretsiz paylaşın. İstemci taraflı şifreleme, okunduktan sonra silme, Markdown render, curl ve HTTP API desteği.",
  de: ": Text, Code und Dateien kostenlos über einen Kurzlink teilen. Clientseitige Verschlüsselung, Löschen nach dem Lesen, Markdown-Rendering, curl-freundliche HTTP-API.",
  az: ": mətn, kod və faylları qısa keçidlə pulsuz paylaşın. Client tərəfli şifrələmə, oxunduqdan sonra silmə, Markdown render, curl-dostu HTTP API.",
}

// Shared SEO/social head tags for the index page, used by both the SSR render (worker/pages/index.ts)
// and its CSR fallback (worker/handlers/handleRead.ts) — this is the only place that builds
// <title>/description/OG/Twitter/JSON-LD for that page, so the two callers can't drift out of
// sync the way they did when each kept its own copy of the <title> tag. `noIndex` is set for the
// admin/manage URL shell, which robots.txt already disallows crawling — this is defense in depth
// in case a manage link (which carries a paste's password) ever gets fetched or linked from
// somewhere unexpected.
export function renderSeoHeadTags(env: Env, locale: Locale, opts: { noIndex?: boolean } = {}): string {
  const siteName = escapeHtml(env.INDEX_PAGE_TITLE)
  const seoTitleRaw = `${env.INDEX_PAGE_TITLE}${SEO_TITLE_SUFFIX_BY_LOCALE[locale]}`
  const seoTitle = escapeHtml(seoTitleRaw)
  const descriptionRaw = `${env.INDEX_PAGE_TITLE}${SEO_DESCRIPTION_SUFFIX_BY_LOCALE[locale]}`
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
  return `<title>${seoTitle}</title>
${robotsTag}<meta name="description" content="${description}">
<link rel="canonical" href="${escapeHtml(url)}">
<meta property="og:type" content="website">
<meta property="og:title" content="${seoTitle}">
<meta property="og:description" content="${description}">
<meta property="og:url" content="${escapeHtml(url)}">
<meta property="og:site_name" content="${siteName}">
<meta property="og:locale" content="${OG_LOCALE_BY_LOCALE[locale]}">
<meta name="twitter:card" content="summary">
<meta name="twitter:title" content="${seoTitle}">
<meta name="twitter:description" content="${description}">
<script type="application/ld+json">${ldJson}</script>`
}
