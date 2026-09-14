/**
 * The shared dialog frame: a marble plate on a dimmed board, with a gold rule
 * under the title. Everything modal in the game uses it, so dialogs never look
 * like stray browser chrome.
 */

import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { LaurelRule } from '../ui/Icons';

export interface ModalProps {
  open: boolean;
  title: string;
  subtitle?: string;
  onClose?(): void;
  width?: number;
  children: React.ReactNode;
  footer?: React.ReactNode;
  /** Blocks the backdrop click and hides the ✕. */
  insistent?: boolean;
}

export function Modal({
  open,
  title,
  subtitle,
  onClose,
  width = 560,
  children,
  footer,
  insistent = false,
}: ModalProps) {
  useEffect(() => {
    if (!open || insistent || !onClose) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, insistent, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 grid place-items-center p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.16 }}
        >
          <div
            className="absolute inset-0"
            style={{ background: 'radial-gradient(120% 90% at 50% 40%, rgb(12 10 8 / .72), rgb(8 7 6 / .9))' }}
            onClick={insistent ? undefined : onClose}
          />

          <motion.div
            initial={{ scale: 0.94, y: 18, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.96, y: 10, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 340, damping: 30 }}
            className="surface-parchment frame-stone relative flex max-h-[88vh] flex-col overflow-hidden rounded-lg"
            style={{ width, maxWidth: '94vw' }}
            role="dialog"
            aria-modal="true"
            aria-label={title}
          >
            <div className="px-6 pb-3 pt-5 text-center">
              <h2 className="t-display text-[24px] leading-tight text-ink-800">{title}</h2>
              {subtitle && <p className="mt-1 text-[13px] italic text-ink-500">{subtitle}</p>}
              <div className="mt-2 flex justify-center">
                <LaurelRule width={Math.min(width - 80, 260)} />
              </div>
            </div>

            <div className="scroll-slim min-h-0 flex-1 overflow-y-auto px-6 pb-4">{children}</div>

            {footer && (
              <div
                className="flex items-center justify-end gap-2 px-6 py-3"
                style={{
                  background: 'linear-gradient(180deg, rgb(90 68 38 / .08), rgb(90 68 38 / .18))',
                  borderTop: '1px solid rgb(184 145 47 / .35)',
                }}
              >
                {footer}
              </div>
            )}

            {!insistent && onClose && (
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="absolute right-3 top-3 grid h-7 w-7 place-items-center rounded-full text-ink-500 transition hover:bg-ink-800/10 hover:text-ink-800"
              >
                ✕
              </button>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
