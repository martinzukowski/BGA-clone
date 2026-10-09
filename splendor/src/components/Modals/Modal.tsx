import { useEffect, type ReactNode } from 'react'

interface ModalProps {
  open: boolean
  title: string
  subtitle?: string
  children: ReactNode
  /** Omit to make the dialog non-dismissable (used for required decisions). */
  onClose?: () => void
  width?: string
}

export function Modal({ open, title, subtitle, children, onClose, width = 'max-w-2xl' }: ModalProps) {
  useEffect(() => {
    if (!open || !onClose) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-felt-900/80 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={onClose ? (e) => e.target === e.currentTarget && onClose() : undefined}
    >
      <div
        className={`anim-rise w-full ${width} max-h-[88vh] overflow-y-auto rounded-2xl border border-felt-500 bg-felt-800 p-6 shadow-[0_30px_80px_rgba(0,0,0,0.7)]`}
      >
        <header className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl text-brass-400">{title}</h2>
            {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
          </div>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="rounded-lg border border-felt-500 px-2.5 py-1 text-sm text-muted transition hover:border-brass-500 hover:text-brass-400"
            >
              ✕
            </button>
          )}
        </header>
        {children}
      </div>
    </div>
  )
}
