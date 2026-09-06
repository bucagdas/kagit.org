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

  if (!mounted) {
    return (
      <Button
        isIconOnly
        size="sm"
        variant="light"
        className={`${tst}` + " " + className}
        aria-label={format(t.common.toggleLanguage, { lang: currentLabel })}
        style={{ visibility: "hidden" }}
        {...rest}
      >
        <GlobeIcon className="size-6" />
      </Button>
    )
  }

  return (
    <div ref={rootRef} className="relative">
      <Tooltip content={format(t.common.toggleLanguage, { lang: currentLabel })}>
        <Button
          isIconOnly
          size="sm"
          variant="light"
          className={`${tst}` + " " + className}
          aria-label={format(t.common.toggleLanguage, { lang: currentLabel })}
          onPress={() => setIsOpen((v) => !v)}
          {...rest}
        >
          <GlobeIcon className="size-6" />
        </Button>
      </Tooltip>
      {isOpen && (
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
