import { Button, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader } from "./ui/index.js"
import type { ModalProps } from "./ui/index.js"
import { useState } from "react"
import { ErrorWithTitle } from "../utils/errors.js"
import { useT } from "../i18n/LocaleContext.js"

export interface ErrorState {
  title: string
  content: string
  isOpen: boolean
}

type ErrorModalProps = Partial<Omit<ModalProps, "children" | "isOpen" | "onClose">>

export function useErrorModal() {
  const t = useT()
  const [errorState, setErrorState] = useState<ErrorState>({ isOpen: false, content: "", title: "" })

  function showModal(title: string, content: string) {
    setErrorState({ title, content, isOpen: true })
  }

  async function handleFailedResp(defaultTitle: string, resp: Response) {
    const statusText = resp.statusText === "error" ? t.common.unknownError : resp.statusText
    const errText = (await resp.text()) || statusText
    showModal(defaultTitle, errText)
  }

  function handleError(defaultTitle: string, error: Error) {
    console.error(error)
    if (error instanceof ErrorWithTitle) {
      showModal(error.title, error.message)
    } else {
      showModal(defaultTitle, error.message)
    }
  }

  const ErrorModal = ({ ...rest }: ErrorModalProps) => {
    const onClose = () => {
      setErrorState({ isOpen: false, content: "", title: "" })
    }
    return (
      <Modal isOpen={errorState.isOpen} onClose={onClose} {...rest}>
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">{errorState.title}</ModalHeader>
          <ModalBody>
            <p>{errorState.content}</p>
          </ModalBody>
          <ModalFooter>
            <Button variant="solid" onPress={onClose}>
              {t.common.close}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    )
  }

  return { ErrorModal, showModal, errorState, handleError, handleFailedResp }
}
