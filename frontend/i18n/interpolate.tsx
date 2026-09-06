import type { ReactNode } from "react"
import React from "react"

// Splits a template like "use {curl} or {api}" on {token} placeholders and substitutes
// each with a string or React node. Needed because word order around links/values
// differs across languages — string concatenation in JSX would break that.
export function interpolate(template: string, values: Record<string, ReactNode>): ReactNode {
  const parts = template.split(/(\{[a-zA-Z0-9_]+\})/g)
  return parts.map((part, i) => {
    const match = /^\{([a-zA-Z0-9_]+)\}$/.exec(part)
    if (!match) return part.length ? <React.Fragment key={i}>{part}</React.Fragment> : null
    const key = match[1]
    return <React.Fragment key={i}>{values[key] ?? part}</React.Fragment>
  })
}

// Plain-string version for cases with no React nodes to embed (titles, aria-labels, etc).
export function format(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{([a-zA-Z0-9_]+)\}/g, (full, key: string) => (key in values ? String(values[key]) : full))
}
