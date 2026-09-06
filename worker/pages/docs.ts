import { makeMarkdown } from "./markdown.js"

import tosMd from "../../doc/tos.md"
import apiMd from "../../doc/api.md"
import curlMd from "../../doc/curl.md"
import skillMd from "../../doc/skill.md"
import indexMd from "../../doc/index.md"

function renderTemplate(template: string, env: Env): string {
  return template
    .replaceAll("{{BASE_URL}}", env.DEPLOY_URL)
    .replaceAll("{{REPO}}", env.REPO)
    .replaceAll("{{TOS_MAINTAINER}}", env.TOS_MAINTAINER)
    .replaceAll("{{TOS_MAIL}}", env.TOS_MAIL)
    .replaceAll("{{DEFAULT_EXPIRATION}}", env.DEFAULT_EXPIRATION)
    .replaceAll("{{MAX_EXPIRATION}}", env.MAX_EXPIRATION)
    .replaceAll("{{R2_MAX_ALLOWED}}", env.R2_MAX_ALLOWED)
}

export function getDocMarkdown(path: string, env: Env): string | null {
  if (path === "/doc/tos" || path === "/doc/tos.html") {
    return renderTemplate(tosMd, env)
  } else if (path === "/doc/api" || path === "/doc/api.html") {
    return renderTemplate(apiMd, env)
  } else if (path === "/doc/curl" || path === "/doc/curl.html") {
    return renderTemplate(curlMd, env)
  } else if (path === "/doc/skill" || path === "/doc/skill.html") {
    return renderTemplate(skillMd, env)
  } else {
    return null
  }
}

export function getCurlIndexMarkdown(env: Env): string {
  return renderTemplate(indexMd, env)
}

const FRONTMATTER_RE = /^---\r?\n([\s\S]*?)\r?\n---\r?\n/

// doc/skill.md's frontmatter is the Claude Skill format (name/description) and is kept intact
// in its raw .md response for that reason. Its `description` also happens to double as a good
// HTML meta description — reuse it rather than falling back to whatever text follows the H1.
function frontmatterDescription(md: string): string | undefined {
  const description = /^description:\s*(.+)$/m.exec(FRONTMATTER_RE.exec(md)?.[1] ?? "")?.[1]
  return description?.trim().replace(/^["']|["']$/g, "")
}

export function renderDocAsHtml(md: string, canonicalUrl?: string): string {
  return makeMarkdown(md.replace(FRONTMATTER_RE, ""), canonicalUrl, frontmatterDescription(md))
}
