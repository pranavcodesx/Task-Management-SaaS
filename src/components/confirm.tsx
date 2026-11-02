import { useCallback, useRef, useState, type ReactNode } from 'react'
import { Modal } from './ui'

type Options = { title: string; message: ReactNode; confirmLabel?: string; danger?: boolean }

/** Promise-based confirm dialog that works well on touch devices (no window.confirm). */
export function useConfirm() {
  const [opts, setOpts] = useState<Options | null>(null)
  const resolver = useRef<((ok: boolean) => void) | null>(null)

  const confirm = useCallback(
    (o: Options) =>
      new Promise<boolean>((resolve) => {
        resolver.current = resolve
        setOpts(o)
      }),
    [],
  )

  const close = useCallback((ok: boolean) => {
    resolver.current?.(ok)
    resolver.current = null
    setOpts(null)
  }, [])

  const dialog = (
    <Modal
      open={Boolean(opts)}
      title={opts?.title ?? ''}
      onClose={() => close(false)}
      footer={
        <>
          <button type="button" className="btn btn-ghost" onClick={() => close(false)}>
            Cancel
          </button>
          <button type="button" className={`btn ${opts?.danger === false ? 'btn-primary' : 'btn-danger'}`} onClick={() => close(true)}>
            {opts?.confirmLabel ?? 'Delete'}
          </button>
        </>
      }
    >
      <p className="text-sm leading-6 text-muted">{opts?.message}</p>
    </Modal>
  )

  return { confirm, dialog }
}
