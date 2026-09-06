import React, { useId, useState, useRef, useEffect } from "react"

interface TriggerProps {
  onMouseEnter?: () => void
  onMouseLeave?: () => void
  onFocus?: () => void
  onBlur?: () => void
  "aria-describedby"?: string
}

export interface TooltipProps {
  content: React.ReactNode
  children: React.ReactElement<TriggerProps>
}

export function Tooltip({ content, children }: TooltipProps) {
  const [show, setShow] = useState(false)
  const [position, setPosition] = useState<"top" | "bottom">("top")
  const [align, setAlign] = useState<"center" | "left" | "right">("center")
  const tooltipRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  // useId() must still be called unconditionally (rules of hooks), but its value is only
  // ever applied to the DOM after mount. This app's SSR (react-dom/server.edge, streamed
  // from a Worker) and its client hydration were producing different ids for the very
  // first useId() call on the page — root cause unconfirmed, but since this id only serves
  // aria-describedby (accessibility, not layout or behavior), deferring it sidesteps the
  // mismatch entirely instead of depending on cross-request useId() stability here.
  const generatedId = useId()
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    setMounted(true)
  }, [])
  const tooltipId = mounted ? `tooltip-${generatedId}` : undefined

  useEffect(() => {
    if (show && tooltipRef.current && containerRef.current) {
      const tooltipRect = tooltipRef.current.getBoundingClientRect()
      const containerRect = containerRef.current.getBoundingClientRect()

      // Check vertical position
      if (containerRect.top - tooltipRect.height - 8 < 0) {
        setPosition("bottom")
      } else {
        setPosition("top")
      }

      // Check horizontal position
      const centerX = containerRect.left + containerRect.width / 2
      const tooltipHalfWidth = tooltipRect.width / 2

      if (centerX - tooltipHalfWidth < 0) {
        setAlign("left")
      } else if (centerX + tooltipHalfWidth > window.innerWidth) {
        setAlign("right")
      } else {
        setAlign("center")
      }
    }
  }, [show])

  // Compose aria-describedby with whatever the child already had so we don't clobber.
  const existingDescribedBy = children.props["aria-describedby"]
  const describedBy = existingDescribedBy ? `${existingDescribedBy} ${tooltipId}` : tooltipId

  return (
    <div
      ref={containerRef}
      className={`relative inline-flex translate-y-[0.05em] ${show ? "z-50" : ""}`}
      onKeyDown={(e) => {
        if (e.key === "Escape" && show) {
          setShow(false)
        }
      }}
    >
      {React.cloneElement(children, {
        onMouseEnter: () => setShow(true),
        onMouseLeave: () => setShow(false),
        onFocus: () => setShow(true),
        onBlur: () => setShow(false),
        "aria-describedby": describedBy,
      })}
      {show && (
        <div
          ref={tooltipRef}
          id={tooltipId}
          role="tooltip"
          className={`absolute z-50 px-2 py-1 text-sm bg-gray-800 text-white rounded shadow-lg w-max pointer-events-none ${
            position === "top" ? "bottom-full mb-2" : "top-full mt-2"
          } ${align === "center" ? "left-1/2 -translate-x-1/2" : align === "left" ? "left-0" : "right-0"}`}
        >
          {content}
        </div>
      )}
    </div>
  )
}
