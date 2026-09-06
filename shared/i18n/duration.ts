import type { Messages } from "../../frontend/i18n/translations/en.js"

type DurationUnit = "second" | "minute" | "hour" | "day"

// English pluralization rule (num > 1 => plural) also happens to be correct for German;
// tr/az put the same word in both slots, so the branch is a no-op for them.
export function formatDurationUnit(t: Messages, num: number, unit: DurationUnit): string {
  const key = `${unit}${num > 1 ? "Other" : "One"}` as const
  return `${num} ${t.duration[key]}`
}
