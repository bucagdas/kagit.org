import { escapeHtml } from "../common.js"

// AI crawlers and answer engines follow the same `User-agent: *` rules as everyone else here
// (see /llms.txt for the structured summary aimed at them) — the goal is to be findable and
// citable in AI answers, not just traditional search. Individual paste pages are disallowed:
// they're ephemeral, user-generated content, not something the service wants indexed.
export function renderRobotsTxt(env: Env): string {
  return `# See /llms.txt for a structured overview of this site for AI agents and answer engines.
User-agent: *
Allow: /$
Allow: /doc
Allow: /assets/
Allow: /favicon.ico
Allow: /favicon.svg
Allow: /index.md
Allow: /llms.txt
Disallow: /

Sitemap: ${env.DEPLOY_URL}/sitemap.xml
`
}

const SITEMAP_PATHS = ["/", "/doc/api", "/doc/curl", "/doc/skill", "/doc/tos"]

export function renderSitemapXml(env: Env): string {
  const urls = SITEMAP_PATHS.map((p) => `  <url><loc>${escapeHtml(env.DEPLOY_URL + p)}</loc></url>`).join("\n")
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`
}

export function renderLlmsTxt(env: Env): string {
  const title = env.INDEX_PAGE_TITLE
  return `# ${title}

> ${title} is a pastebin (text/file sharing) service running on Cloudflare Workers. Share text or files via a short URL, with optional client-side encryption, burn-after-read, Markdown rendering, and a URL shortener.

${title} is a fork of [pastebin-worker](https://github.com/SharzyL/pastebin-worker), self-hostable on your own Cloudflare account and domain.

## Docs

- [HTTP API reference](${env.DEPLOY_URL}/doc/api): full HTTP API for uploading, updating, and deleting content programmatically.
- [curl usage guide](${env.DEPLOY_URL}/doc/curl): quick examples for using the service from the command line with curl.
- [AI agent skill](${env.DEPLOY_URL}/doc/skill): a compact packaging of the API meant to be given directly to a coding agent so it can upload, fetch, and manage content.
- [Terms of service](${env.DEPLOY_URL}/doc/tos)

## Notes for AI agents and answer engines

- Individual content pages (short URLs, custom names) are ephemeral, user-generated content, not intended to be indexed or cited as sourced content.
- The homepage and the docs above describe the service itself and are safe to cite.
`
}
