import { useEffect, useRef, useState } from "react"
import type { ButtonProps } from "./ui/index.js"
import { Button, Tooltip } from "./ui/index.js"
import { GlobeIcon } from "./icons.js"
import { tst } from "../utils/overrides.js"
import { useLocale } from "../i18n/LocaleContext.js"
import { LOCALE_LABELS, SUPPORTED_LOCALES } from "../../shared/i18n/locales.js"
import { format } from "../i18n/interpolate.js"

type MyComponentProps = ButtonProps

export function LanguageToggle({ className, ...rest }: MyComponentProps) {
  const { selection, setSelection, t } = useLocale()
  // Same element tree on every render, mounted or not — only `style`/interactivity
  // change. Branching to a *different* subtree per `mounted` (as an earlier version
  // of this component and DarkModeToggle both did) shifts every later useId()-bearing
  // node's tree position between the server's render and the client's first hydration
  // pass, which is what produced the "Hydration failed" (React #418) React was logging
  // on every page load in production.
  const [mounted, setMounted] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!isOpen) return
    const onClickAway = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setIsOpen(false)
    }
    document.addEventListener("mousedown", onClickAway)
    return () => document.removeEventListener("mousedown", onClickAway)
  }, [isOpen])

  const currentLabel = selection === "system" ? t.common.langSystem : LOCALE_LABELS[selection]
  const ariaLabel = format(t.common.toggleLanguage, { lang: currentLabel })

  return (
    <div ref={rootRef} className="relative">
      <Tooltip content={ariaLabel}>
        <Button
          isIconOnly
          size="sm"
          variant="light"
          className={`${tst}` + " " + className}
          aria-label={ariaLabel}
          onPress={() => mounted && setIsOpen((v) => !v)}
          style={mounted ? undefined : { visibility: "hidden" }}
          {...rest}
        >
          <GlobeIcon className="size-6" />
        </Button>
      </Tooltip>
      {mounted && isOpen && (
        <div
          className={`absolute right-0 z-10 mt-1 bg-content1 border border-default-200 rounded-lg shadow-medium overflow-hidden ${tst}`}
        >
          <button
            type="button"
            onClick={() => {
              setSelection("system")
              setIsOpen(false)
            }}
            className={`w-full px-3 py-2 text-left text-sm whitespace-nowrap hover:bg-default-100 ${
              selection === "system" ? "font-medium text-primary" : ""
            }`}
          >
            {t.common.langSystem}
          </button>
          {SUPPORTED_LOCALES.map((locale) => (
            <button
              key={locale}
              type="button"
              onClick={() => {
                setSelection(locale)
                setIsOpen(false)
              }}
              className={`w-full px-3 py-2 text-left text-sm whitespace-nowrap hover:bg-default-100 ${
                selection === locale ? "font-medium text-primary" : ""
              }`}
            >
              {LOCALE_LABELS[locale]}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
