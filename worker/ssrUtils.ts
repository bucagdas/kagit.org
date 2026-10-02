import { escapeHtml } from "./common.js"
import type { Locale } from "../shared/i18n/locales.js"
import { LOCALE_PATHS, SUPPORTED_LOCALES } from "../shared/i18n/locales.js"
import { en, type Messages } from "../frontend/i18n/translations/en.js"
import { tr } from "../frontend/i18n/translations/tr.js"
import { de } from "../frontend/i18n/translations/de.js"
import { az } from "../frontend/i18n/translations/az.js"

// Plain-object translation dictionaries (no React/DOM dependency), reused here to build
// FAQPage JSON-LD that always says exactly what the visible on-page FAQ says — see
// frontend/pages/PasteBin.tsx, the only other reader of `faq.*`. Keeping one copy avoids
// the structured data silently drifting from the page content search engines can see,
// which defeats the point of marking it up.
const FAQ_BY_LOCALE: Record<Locale, Messages["faq"]> = {
  en: en.faq,
  tr: tr.faq,
  de: de.faq,
  az: az.faq,
}

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
// never rendered in the UI, and needs to read as an actual pitch with real keywords rather
// than the one-line tagline that used to double as both. Both suffixes are appended straight
// to env.INDEX_PAGE_TITLE, so a fork that renames the site (wrangler.toml's INDEX_PAGE_TITLE)
// still gets a correctly-branded title/description.
//
// Keyword choices here are grounded in actual competitor titles for this niche, not guessed:
// "pastebin alternative" (en), "pastebin alternatifi" (tr, matching PastePot/KodYapıştır/
// lock.pub's own TR-market titles), "Pastebin-Alternative" (de) are all phrases real
// competitors already rank their own <title> on, and "open-source"/"self-hostable" is a real
// differentiator most closed competitors (incl. pastebin.com itself) can't claim.
const SEO_TITLE_SUFFIX_BY_LOCALE: Record<Locale, string> = {
  en: " - Free, Open-Source Pastebin Alternative",
  tr: " - Ücretsiz Pastebin Alternatifi: Metin, Kod, Dosya Paylaş",
  de: " - Kostenlose Open-Source Pastebin-Alternative",
  az: " - Pulsuz, Açıq Mənbəli Pastebin Alternativi",
}

const SEO_DESCRIPTION_SUFFIX_BY_LOCALE: Record<Locale, string> = {
  en: ": share text, code, and files via a short link, for free. A privacy-focused pastebin alternative with client-side encryption, burn-after-read, Markdown rendering, and a curl-friendly HTTP API.",
  tr: ": metin, kod ve dosyalarınızı kısa bir bağlantıyla ücretsiz paylaşın. Pastebin alternatifi; şifreli paylaşım, okuduktan sonra silme (burn after read), Markdown render, curl ve HTTP API desteği.",
  de: ": Text, Code und Dateien kostenlos über einen Kurzlink teilen. Datenschutzfreundliche Pastebin-Alternative mit clientseitiger Verschlüsselung, Löschen nach dem Lesen, Markdown-Rendering und curl-freundlicher HTTP-API.",
  az: ": mətn, kod və faylları qısa keçidlə pulsuz paylaşın. Məxfiliyə fokuslanmış pastebin alternativi; client tərəfli şifrələmə, oxuduqdan sonra silmə, Markdown render, curl-dostu HTTP API.",
}

// Shared SEO/social head tags for the index page, used by both the SSR render (worker/pages/index.ts)
// and its CSR fallback (worker/handlers/handleRead.ts) — this is the only place that builds
// <title>/description/OG/Twitter/JSON-LD for that page, so the two callers can't drift out of
// sync the way they did when each kept its own copy of the <title> tag. `noIndex` is set for the
// admin/manage URL shell, which robots.txt already disallows crawling — this is defense in depth
// in case a manage link (which carries a paste's password) ever gets fetched or linked from
// somewhere unexpected.
// A locale's own crawlable URL, per LOCALE_PATHS (en lives at the bare root).
function localeUrl(env: Env, locale: Locale): string {
  const path = LOCALE_PATHS[locale]
  return path ? `${env.DEPLOY_URL}${path}` : `${env.DEPLOY_URL}/`
}

export function renderSeoHeadTags(env: Env, locale: Locale, opts: { noIndex?: boolean } = {}): string {
  const siteName = escapeHtml(env.INDEX_PAGE_TITLE)
  const seoTitleRaw = `${env.INDEX_PAGE_TITLE}${SEO_TITLE_SUFFIX_BY_LOCALE[locale]}`
  const seoTitle = escapeHtml(seoTitleRaw)
  const descriptionRaw = `${env.INDEX_PAGE_TITLE}${SEO_DESCRIPTION_SUFFIX_BY_LOCALE[locale]}`
  const description = escapeHtml(descriptionRaw)
  const url = localeUrl(env, locale)
  const robotsTag = opts.noIndex ? `<meta name="robots" content="noindex">\n` : ""

  // Reciprocal hreflang: every locale's URL lists every locale (itself included — a missing
  // self-reference, per Google's docs, can get the whole set ignored), plus one x-default
  // pointing at the (English) root for visitors whose language isn't in SUPPORTED_LOCALES.
  const hreflangTags = SUPPORTED_LOCALES.map(
    (loc) => `<link rel="alternate" hreflang="${loc}" href="${escapeHtml(localeUrl(env, loc))}">`,
  )
    .concat(`<link rel="alternate" hreflang="x-default" href="${escapeHtml(localeUrl(env, "en"))}">`)
    .join("\n")

  const faq = FAQ_BY_LOCALE[locale]
  const faqEntries: [string, string][] = [
    [faq.q1, faq.a1],
    [faq.q2, faq.a2],
    [faq.q3, faq.a3],
    [faq.q4, faq.a4],
    [faq.q5, faq.a5],
    [faq.q6, faq.a6],
  ]

  // @graph stacks WebApplication (what the service is) with FAQPage (the visible FAQ in
  // frontend/pages/PasteBin.tsx, mirrored here so the structured data can never drift from
  // what's actually on the page) — this is the single highest-impact piece of markup for
  // getting quoted in AI answer engines (Google AI Overviews pulls FAQPage directly), and it
  // also earns classic FAQ rich results in regular search.
  const ldJson = JSON.stringify({
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebApplication",
        name: env.INDEX_PAGE_TITLE,
        url,
        description: descriptionRaw,
        applicationCategory: "UtilitiesApplication",
        inLanguage: locale,
        offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
      },
      {
        "@type": "FAQPage",
        inLanguage: locale,
        mainEntity: faqEntries.map(([question, answer]) => ({
          "@type": "Question",
          name: question,
          acceptedAnswer: { "@type": "Answer", text: answer },
        })),
      },
    ],
  })
  return `<title>${seoTitle}</title>
${robotsTag}<meta name="description" content="${description}">
<link rel="canonical" href="${escapeHtml(url)}">
${hreflangTags}
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
