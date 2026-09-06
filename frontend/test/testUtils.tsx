import type { ReactElement, ReactNode } from "react"
import { vi } from "vitest"
import { render, type RenderResult } from "@testing-library/react"
import { LocaleProvider } from "../i18n/LocaleContext.js"

// Every page/component under test calls useT()/useLocale(), so it must be mounted under a
// LocaleProvider — same as the real render/index.tsx and render/display.tsx entry points.
function LocaleWrapper({ children }: { children: ReactNode }) {
  return <LocaleProvider>{children}</LocaleProvider>
}

export function renderWithLocale(ui: ReactElement): RenderResult {
  return render(ui, { wrapper: LocaleWrapper })
}

export function stubBrowerFunctions() {
  vi.stubGlobal("matchMedia", (_query: string): MediaQueryList => {
    return {
      matches: false,
      addListener(_callback: ((this: MediaQueryList, ev: MediaQueryListEvent) => unknown) | null) {
        // Mock implementation
      },
      addEventListener(_name: string, _listener: EventListenerOrEventListenerObject) {
        // Mock implementation
      },
      removeEventListener(_name: string, _listener: EventListenerOrEventListenerObject) {
        // Mock implementation
      },
    } as MediaQueryList
  })

  class ResizeObserver {
    observe() {
      // Mock implementation
    }
    unobserve() {
      // Mock implementation
    }
    disconnect() {
      // Mock implementation
    }
  }
  vi.stubGlobal("ResizeObserver", ResizeObserver)
}

export function unStubBrowerFunctions() {
  vi.resetAllMocks()
  vi.unstubAllGlobals()
}
