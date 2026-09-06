import type { CardProps } from "./ui/index.js"
import { Card, CardBody, CardHeader, Divider, Input, Switch, Tooltip } from "./ui/index.js"
import { verifyExpiration, verifyManageUrl } from "../utils/utils.js"
import { verifyName, verifyPassword } from "../../shared/verify.js"
import type { NameAvailability } from "../utils/useNameAvailability.js"
import React from "react"
import { CheckIcon, InfoIcon, QuestionMarkCircleIcon, SpinnerIcon, XIcon } from "./icons.js"
import { cardOverrides, inputOverrides, switchOverrides, tst } from "../utils/overrides.js"
import { PASTE_NAME_LEN, PRIVATE_PASTE_NAME_LEN } from "../../shared/constants.js"
import { useT } from "../i18n/LocaleContext.js"
import { format } from "../i18n/interpolate.js"
import type { Messages } from "../i18n/translations/en.js"

export type UploadKind = "short" | "long" | "custom" | "manage"

export interface PasteSetting {
  uploadKind: UploadKind
  expiration: string
  password: string
  name: string
  manageUrl: string

  doEncrypt: boolean
  burnAfterRead: boolean
}

interface PasteSettingPanelProps extends CardProps {
  setting: PasteSetting
  onSettingChange: (setting: PasteSetting) => void
  config: Env
  nameAvailability: NameAvailability
  footer?: React.ReactNode
}

function urlKindOptions(t: Messages): { value: UploadKind; label: string }[] {
  return [
    { value: "short", label: t.settings.kindShort },
    { value: "long", label: t.settings.kindLong },
    { value: "custom", label: t.settings.kindCustom },
    { value: "manage", label: t.settings.kindManage },
  ]
}

function urlKindDescription(t: Messages, kind: UploadKind): string {
  switch (kind) {
    case "short":
      return format(t.settings.kindShortDesc, { n: PASTE_NAME_LEN })
    case "long":
      return format(t.settings.kindLongDesc, { n: PRIVATE_PASTE_NAME_LEN })
    case "custom":
      return t.settings.kindCustomDesc
    case "manage":
      return t.settings.kindManageDesc
  }
}

function urlKindExample(kind: UploadKind, deployUrl: string): string | null {
  switch (kind) {
    case "short":
      return `${deployUrl}/BxWH`
    case "long":
      return `${deployUrl}/5HQWYNmjA4h44SmybeThXXAm`
    case "custom":
      return `${deployUrl}/~stocking`
    case "manage":
      return null
  }
}

interface CustomNameUI {
  isInvalid: boolean
  errorMessage?: string
  warningMessage?: string
  successMessage?: string
  description?: string
  endContent: React.ReactNode
}

function customNameUI(t: Messages, name: string, availability: NameAvailability): CustomNameUI {
  const [ok, msg] = verifyName(name, t)
  if (!ok) return { isInvalid: true, errorMessage: msg, endContent: null }

  switch (availability.status) {
    case "idle": // debouncing — treat as checking for the user
    case "checking":
      return {
        isInvalid: false,
        description: t.settings.checkingAvailability,
        endContent: <SpinnerIcon className="size-4 text-default-400" aria-label={t.settings.checkingAvailability} />,
      }
    case "available":
      return {
        isInvalid: false,
        successMessage: t.settings.nameAvailable,
        endContent: <CheckIcon className="size-4 text-success" aria-label={t.settings.nameAvailableAria} />,
      }
    case "taken":
      return {
        isInvalid: true,
        errorMessage: t.settings.nameTaken,
        endContent: <XIcon className="size-4 text-danger" aria-label={t.settings.nameTakenAria} />,
      }
    case "error":
      return {
        isInvalid: false,
        warningMessage: format(t.settings.availabilityUnknown, { message: availability.message }),
        endContent: (
          <QuestionMarkCircleIcon className="size-4 text-yellow-600" aria-label={t.settings.availabilityUnknownAria} />
        ),
      }
  }
}

export function PanelSettingsPanel({
  setting,
  onSettingChange,
  config,
  nameAvailability,
  footer,
  ...rest
}: PasteSettingPanelProps) {
  const t = useT()
  const urlKindOpts = urlKindOptions(t)
  return (
    <Card aria-label={t.settings.ariaLabel} classNames={cardOverrides} {...rest}>
      <CardHeader className="text-2xl pl-4 pb-2">{t.settings.title}</CardHeader>
      <Divider className={tst} />
      <CardBody>
        <div className="gap-4 flex flex-row">
          <Input
            type="text"
            label={t.settings.expiration}
            classNames={{
              base: "basis-40",
              ...inputOverrides,
            }}
            defaultValue="7d"
            value={setting.expiration}
            isRequired
            onValueChange={(e) => onSettingChange({ ...setting, expiration: e })}
            isInvalid={!verifyExpiration(setting.expiration, config, t)[0]}
            errorMessage={verifyExpiration(setting.expiration, config, t)[1]}
            description={verifyExpiration(setting.expiration, config, t)[1]}
          />
          <Input
            type="password"
            label={t.settings.password}
            labelExtra={
              <Tooltip content={<div className="px-1 py-1 text-small max-w-[18rem]">{t.settings.passwordHint}</div>}>
                <button
                  type="button"
                  aria-label={t.settings.passwordHintAria}
                  className="inline-flex items-center ml-1 text-default-400 hover:text-default-600 focus:outline-none focus-visible:ring-1 focus-visible:ring-default-400 rounded"
                >
                  <InfoIcon className="size-3" />
                </button>
              </Tooltip>
            }
            value={setting.password}
            onValueChange={(p) => onSettingChange({ ...setting, password: p })}
            isClearable
            classNames={{
              base: "flex-1",
              ...inputOverrides,
            }}
            placeholder={t.settings.passwordPlaceholder}
            isInvalid={!verifyPassword(setting.password, t)[0]}
            errorMessage={verifyPassword(setting.password, t)[1]}
          />
        </div>
        <Divider className={`my-4 ${tst}`} />
        <div className="pl-1">
          <div className="flex flex-row items-center flex-wrap gap-x-2 gap-y-2 text-sm">
            <span className="text-default-700">{t.settings.urlKindLabel}</span>
            <div
              role="radiogroup"
              aria-label={t.settings.urlKindAria}
              className="inline-flex rounded-lg border border-default-200 bg-default-100"
            >
              {urlKindOpts.map((opt, idx) => {
                const selected = setting.uploadKind === opt.value
                const isFirst = idx === 0
                const isLast = idx === urlKindOpts.length - 1
                return (
                  <Tooltip
                    key={opt.value}
                    content={
                      <div className="px-1 py-1 text-small max-w-[22rem]">
                        <div>{urlKindDescription(t, opt.value)}</div>
                        {urlKindExample(opt.value, config.DEPLOY_URL) && (
                          <div className="mt-1 font-mono text-xs opacity-80 break-all">
                            e.g. {urlKindExample(opt.value, config.DEPLOY_URL)}
                          </div>
                        )}
                      </div>
                    }
                  >
                    <button
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      onClick={() => onSettingChange({ ...setting, uploadKind: opt.value })}
                      className={
                        `px-3 py-1 cursor-pointer ${tst} ` +
                        (isFirst ? "rounded-l-lg " : "border-l border-default-200 ") +
                        (isLast ? "rounded-r-lg " : "") +
                        (selected ? "bg-primary-50 text-primary font-medium" : "text-default-600 hover:bg-default-200")
                      }
                    >
                      {opt.label}
                    </button>
                  </Tooltip>
                )
              })}
            </div>
          </div>

          {setting.uploadKind === "custom" &&
            (() => {
              const ui = customNameUI(t, setting.name, nameAvailability)
              return (
                <Input
                  value={setting.name}
                  onValueChange={(n) => onSettingChange({ ...setting, name: n })}
                  type="text"
                  className="mt-2"
                  isInvalid={ui.isInvalid}
                  errorMessage={ui.errorMessage}
                  warningMessage={ui.warningMessage}
                  successMessage={ui.successMessage}
                  description={ui.description}
                  startContent={
                    <div className="pointer-events-none flex items-center">
                      <span className="text-default-500 text-sm w-max">{`${config.DEPLOY_URL}/~`}</span>
                    </div>
                  }
                  endContent={ui.endContent}
                />
              )
            })()}
          {setting.uploadKind === "manage" && (
            <Input
              value={setting.manageUrl}
              onValueChange={(m) => onSettingChange({ ...setting, manageUrl: m })}
              type="text"
              className="mt-2"
              isInvalid={!verifyManageUrl(setting.manageUrl, config, t)[0]}
              errorMessage={verifyManageUrl(setting.manageUrl, config, t)[1]}
              placeholder={t.settings.manageUrlPlaceholder}
            />
          )}
        </div>
        <Divider className={`my-4 ${tst}`} />
        <div className="pl-1 flex flex-row items-center">
          <Switch
            classNames={switchOverrides}
            isSelected={setting.doEncrypt}
            onValueChange={(v) => onSettingChange({ ...setting, doEncrypt: v })}
          >
            {t.settings.clientSideEncryption}
          </Switch>
          <Tooltip
            content={
              <div className="px-1 py-2 max-w-[20rem]">
                <h3 className="text-normal font-bold mb-2">{t.settings.encryptionTooltipTitle}</h3>
                <div className="text-small">{t.settings.encryptionTooltipBody1}</div>
                <div className="text-small mt-2 text-yellow-600">{t.settings.encryptionTooltipBody2}</div>
              </div>
            }
          >
            <button
              type="button"
              aria-label={t.settings.encryptionHintAria}
              className="inline-flex items-center ml-2 text-default-500 hover:text-default-700 focus:outline-none focus-visible:ring-1 focus-visible:ring-default-400 rounded"
            >
              <InfoIcon className="size-3.5" />
            </button>
          </Tooltip>
        </div>
        <div className="pl-1 flex flex-row items-center mt-3">
          <Switch
            classNames={switchOverrides}
            isSelected={setting.burnAfterRead}
            onValueChange={(v) => onSettingChange({ ...setting, burnAfterRead: v })}
          >
            {t.settings.burnAfterRead}
          </Switch>
          <Tooltip
            content={<div className="px-1 py-1 text-small max-w-[20rem]">{t.settings.burnAfterReadTooltip}</div>}
          >
            <button
              type="button"
              aria-label={t.settings.burnAfterReadHintAria}
              className="inline-flex items-center ml-2 text-default-500 hover:text-default-700 focus:outline-none focus-visible:ring-1 focus-visible:ring-default-400 rounded"
            >
              <InfoIcon className="size-3.5" />
            </button>
          </Tooltip>
        </div>
      </CardBody>
      {footer}
    </Card>
  )
}
