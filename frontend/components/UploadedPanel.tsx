import type React from "react"
import { useState } from "react"

import type { CardProps } from "./ui/index.js"
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  CircularProgress,
  Divider,
  Input,
  Tooltip,
  mergeClasses,
} from "./ui/index.js"

import type { PasteResponse } from "../../shared/interfaces.js"
import { tst } from "../utils/overrides.js"
import type { UploadProgress } from "../utils/uploader.js"
import { formatSize } from "../utils/utils.js"
import { CopyWidget } from "./CopyWidget.js"
import { ChevronDownIcon, InfoIcon } from "./icons.js"
import { useT } from "../i18n/LocaleContext.js"
import { interpolate, format } from "../i18n/interpolate.js"
import type { Messages } from "../i18n/translations/en.js"

interface UploadedPanelProps extends CardProps {
  isLoading: boolean
  loadingProgress?: UploadProgress
  onCancel?: () => void
  pasteResponse?: PasteResponse
  encryptionKey?: string
  highlightLang?: string
  isUrlPaste?: boolean
}

function withPathPrefix(url: string, prefix: string): string {
  const u = new URL(url)
  u.pathname = prefix + u.pathname
  return u.toString()
}

function makeDecryptionUrl(url: string, key?: string): string {
  const base = withPathPrefix(url, "/d")
  return key ? `${base}#${key}` : base
}

function rawUrlFlags(t: Messages): { syntax: string; desc: string }[] {
  return [
    { syntax: "?mime=…", desc: t.uploaded.rawFlagMime },
    { syntax: "?a", desc: t.uploaded.rawFlagAttachment },
    { syntax: ".png", desc: t.uploaded.rawFlagExt },
    { syntax: "/foo.txt", desc: t.uploaded.rawFlagFilename },
  ]
}

function displayUrlFlags(t: Messages): { syntax: string; desc: string }[] {
  return [
    { syntax: "?lang=js", desc: t.uploaded.displayFlagLang },
    { syntax: "/foo.txt", desc: t.uploaded.displayFlagFilename },
  ]
}

function InfoTooltip({ children }: { children: React.ReactNode }) {
  const t = useT()
  return (
    <Tooltip content={<div className="px-1 py-1 text-small max-w-[22rem]">{children}</div>}>
      <button
        type="button"
        aria-label={t.common.moreInformation}
        className="inline-flex items-center ml-1 text-default-400 hover:text-default-600 focus:outline-none focus-visible:ring-1 focus-visible:ring-default-400 rounded"
      >
        <InfoIcon className="size-3" />
      </button>
    </Tooltip>
  )
}

function UrlTooltip({ desc, flags }: { desc?: React.ReactNode; flags?: { syntax: string; desc: string }[] }) {
  const t = useT()
  return (
    <InfoTooltip>
      {desc && <div className={flags ? "mb-2" : ""}>{desc}</div>}
      {flags && (
        <>
          <div className="font-medium mb-1">{t.uploaded.optionsLabel}</div>
          <div className="flex flex-col gap-1">
            {flags.map((f) => (
              <div key={f.syntax} className="flex flex-row gap-2 items-baseline">
                <code className="font-mono text-xs whitespace-nowrap">{f.syntax}</code>
                <span className="text-xs opacity-80">{f.desc}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </InfoTooltip>
  )
}

export function UploadedPanel({
  isLoading,
  loadingProgress,
  onCancel,
  pasteResponse,
  className,
  encryptionKey,
  highlightLang,
  isUrlPaste,
  ...rest
}: UploadedPanelProps) {
  const t = useT()
  const copyWidgetClassNames = `${tst}`
  const inputProps = {
    readOnly: true,
    className: "mb-2",
  }
  const [moreOpen, setMoreOpen] = useState<boolean>(false)

  const isEncrypted = Boolean(encryptionKey)
  const isMarkdown = highlightLang === "markdown"

  const urlInput = (label: string, value: string, labelExtra?: React.ReactNode) => (
    <Input
      {...inputProps}
      label={label}
      labelExtra={labelExtra}
      value={value}
      endContent={<CopyWidget className={copyWidgetClassNames} getCopyContent={() => value} />}
    />
  )

  const markdownUrlField = (pasteResponse: PasteResponse) =>
    urlInput(
      t.uploaded.markdownUrl,
      withPathPrefix(pasteResponse.url, "/a"),
      <InfoTooltip>{t.uploaded.markdownUrlDesc}</InfoTooltip>,
    )

  return (
    <Card classNames={mergeClasses({ base: tst }, { base: className })} {...rest}>
      <CardHeader className="text-2xl pl-4 pb-2">{t.uploaded.title}</CardHeader>
      <Divider />
      <CardBody>
        {pasteResponse?.burnAfterRead && !isLoading && (
          <div className="mb-3 px-3 py-2 rounded-lg bg-warning-50 text-warning-700 text-sm">
            {t.uploaded.burnAfterReadNotice}
          </div>
        )}
        {isLoading ? (
          <div className="w-full flex flex-col items-center justify-center gap-2 py-4">
            <CircularProgress
              aria-label={t.common.loading}
              value={loadingProgress ? (100 * loadingProgress.doneBytes) / Math.max(loadingProgress.totalBytes, 1) : 50}
            />
            {loadingProgress && (
              <span className="text-sm text-foreground-500 tabular-nums">
                {format(t.uploaded.uploadProgress, {
                  done: formatSize(loadingProgress.doneBytes),
                  total: formatSize(loadingProgress.totalBytes),
                })}
              </span>
            )}
            {onCancel && (
              <Button size="sm" variant="ghost" onPress={onCancel} className="mt-1">
                {t.uploaded.cancel}
              </Button>
            )}
          </div>
        ) : (
          pasteResponse && (
            <>
              <Input
                {...inputProps}
                label={t.uploaded.displayUrl}
                labelExtra={
                  <UrlTooltip
                    desc={
                      <>
                        {t.uploaded.displayUrlDesc}
                        {encryptionKey &&
                          interpolate(t.uploaded.displayUrlEncryptedAddendum, {
                            hash: <code className="font-mono">#</code>,
                          })}
                      </>
                    }
                    flags={displayUrlFlags(t)}
                  />
                }
                color={encryptionKey ? "success" : "default"}
                className="mb-2"
                value={makeDecryptionUrl(pasteResponse.url, encryptionKey)}
                endContent={
                  <CopyWidget
                    className={encryptionKey ? `${copyWidgetClassNames} hover:bg-success-100` : copyWidgetClassNames}
                    getCopyContent={() => makeDecryptionUrl(pasteResponse.url, encryptionKey)}
                  />
                }
              />
              {isMarkdown && !isEncrypted && markdownUrlField(pasteResponse)}
              {urlInput(
                t.uploaded.rawUrl,
                pasteResponse.url,
                <UrlTooltip
                  desc={encryptionKey ? t.uploaded.rawUrlDescEncrypted : t.uploaded.rawUrlDescPlain}
                  flags={rawUrlFlags(t)}
                />,
              )}
              {urlInput(
                t.uploaded.manageUrl,
                pasteResponse.manageUrl,
                <InfoTooltip>{t.uploaded.manageUrlDesc}</InfoTooltip>,
              )}
              <Input
                {...inputProps}
                label={t.uploaded.expiration}
                value={new Date(pasteResponse.expireAt).toLocaleString()}
              />

              <button
                type="button"
                onClick={() => setMoreOpen((v) => !v)}
                aria-expanded={moreOpen}
                aria-controls="uploaded-paste-more"
                className={
                  `mt-1 mb-2 flex flex-row items-center gap-1 text-sm text-foreground-500 cursor-pointer ` +
                  `hover:text-foreground-700 select-none focus:outline-none focus-visible:ring-1 focus-visible:ring-default-400 rounded ${tst}`
                }
              >
                <ChevronDownIcon aria-hidden="true" className={`w-4 h-4 ${tst} ${moreOpen ? "" : "-rotate-90"}`} />
                <span>{t.uploaded.more}</span>
              </button>

              {moreOpen && (
                <div id="uploaded-paste-more">
                  {!isEncrypted && !isMarkdown && markdownUrlField(pasteResponse)}
                  {!isEncrypted &&
                    isUrlPaste &&
                    urlInput(
                      t.uploaded.shortenerUrl,
                      withPathPrefix(pasteResponse.url, "/u"),
                      <InfoTooltip>{t.uploaded.shortenerUrlDesc}</InfoTooltip>,
                    )}
                  {urlInput(
                    t.uploaded.metadataUrl,
                    withPathPrefix(pasteResponse.url, "/m"),
                    <InfoTooltip>{t.uploaded.metadataUrlDesc}</InfoTooltip>,
                  )}
                </div>
              )}
            </>
          )
        )}
      </CardBody>
    </Card>
  )
}
