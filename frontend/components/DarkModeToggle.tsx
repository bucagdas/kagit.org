import type { JSX } from "react"
import React, { useEffect, useState, useSyncExternalStore } from "react"
import type { ButtonProps } from "./ui/index.js"
import { Button, Tooltip } from "./ui/index.js"

import { ComputerIcon, MoonIcon, SunIcon } from "./icons.js"
import { tst } from "../utils/overrides.js"
import { useT } from "../i18n/LocaleContext.js"
import { format } from "../i18n/interpolate.js"

const modeSelections = ["system", "light", "dark"]
type ModeSelection = (typeof modeSelections)[number]
const icons: Record<ModeSelection, JSX.Element> = {
  system: <ComputerIcon className="size-6 inline" />,
  light: <SunIcon className="size-6 inline" />,
  dark: <MoonIcon className="size-6 inline" />,
}

export function useDarkModeSelection(): [
  boolean,
  ModeSelection | undefined,
  React.Dispatch<React.SetStateAction<ModeSelection | undefined>>,
] {
  const [modeSelection, setModeSelection] = useState<ModeSelection | undefined>(() => {
    try {
      const item = localStorage.getItem("darkModeSelect")
      if (item && modeSelections.includes(item)) return item
    } catch {
      // localStorage can be unavailable (private browsing, sandboxed iframe, some test envs)
    }
    return "system"
  })

  const isSystemDark = useSyncExternalStore<boolean>(
    (callBack) => {
      const mql = window.matchMedia("(prefers-color-scheme: dark)")
      mql.addEventListener("change", callBack)
      return () => {
        mql.removeEventListener("change", callBack)
      }
    },
    () => {
      return window.matchMedia("(prefers-color-scheme: dark)").matches
    },
    () => false,
  )

  useEffect(() => {
    if (modeSelection) {
      try {
        localStorage.setItem("darkModeSelect", modeSelection)
      } catch {
        // ignore
      }
    }
  }, [modeSelection])

  const isDark = modeSelection === undefined || modeSelection === "system" ? isSystemDark : modeSelection === "dark"

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.remove("light")
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
      document.documentElement.classList.add("light")
    }
  }, [isDark])

  return [isDark, modeSelection, setModeSelection]
}

interface MyComponentProps extends ButtonProps {
  modeSelection: ModeSelection | undefined
  setModeSelection: React.Dispatch<React.SetStateAction<ModeSelection | undefined>>
}

export function DarkModeToggle({ modeSelection, setModeSelection, className, ...rest }: MyComponentProps) {
  // Same element tree on every render, mounted or not — see the comment on LanguageToggle
  // for why branching to a different subtree here caused a production hydration mismatch.
  const [mounted, setMounted] = useState(false)
  const t = useT()

  useEffect(() => {
    setMounted(true)
  }, [])

  const currentMode = modeSelection || "system"
  const modeLabels: Record<ModeSelection, string> = {
    system: t.common.modeSystem,
    light: t.common.modeLight,
    dark: t.common.modeDark,
  }

  return (
    <Tooltip content={format(t.common.toggleDarkMode, { mode: modeLabels[currentMode] })}>
      <Button
        isIconOnly
        size="sm"
        variant="light"
        className={`${tst}` + " " + className}
        aria-label={t.common.toggleDarkModeAria}
        onPress={() => {
          if (!mounted) return
          const newSelected = modeSelections[(modeSelections.indexOf(currentMode) + 1) % modeSelections.length]
          setModeSelection(newSelected)
        }}
        style={mounted ? undefined : { visibility: "hidden" }}
        {...rest}
      >
        {mounted ? icons[currentMode] : icons.system}
      </Button>
    </Tooltip>
  )
}
