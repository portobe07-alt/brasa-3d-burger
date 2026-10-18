import { useEffect, useRef, type ReactNode } from 'react'
import { useBodyScrollLock } from '../hooks/useEnvironment'

/**
 * Base dos painéis sobrepostos (detalhes do produto, carrinho, checkout).
 *
 * Cuida do que é fácil esquecer: fundo escurecido, fechar com Escape, travar a
 * rolagem da página, mover o foco para dentro ao abrir, mantê-lo preso
 * enquanto estiver aberto e devolvê-lo ao elemento de origem ao fechar.
 */
export function Overlay({
  open,
  onClose,
  labelledBy,
  children,
  align = 'center',
}: {
  open: boolean
  onClose: () => void
  /** Id do elemento que dá nome acessível ao painel. */
  labelledBy: string
  children: ReactNode
  /** `center` para o modal de produto, `right` para o painel lateral. */
  align?: 'center' | 'right'
}) {
  const panelRef = useRef<HTMLDivElement>(null)
  const restoreFocusTo = useRef<HTMLElement | null>(null)

  useBodyScrollLock(open)

  // Guarda o elemento com foco e o devolve ao fechar.
  useEffect(() => {
    if (!open) return
    restoreFocusTo.current = document.activeElement as HTMLElement | null
    const panel = panelRef.current
    const firstFocusable = panel?.querySelector<HTMLElement>(
      'button:not([disabled]), [href], input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])',
    )
    ;(firstFocusable ?? panel)?.focus()

    return () => restoreFocusTo.current?.focus?.()
  }, [open])

  // Escape fecha; Tab circula dentro do painel.
  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation()
        onClose()
        return
      }
      if (event.key !== 'Tab') return

      const panel = panelRef.current
      if (!panel) return
      const focusable = [
        ...panel.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      ].filter((element) => element.offsetParent !== null || element === document.activeElement)

      if (focusable.length === 0) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]

      if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      } else if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown, true)
    return () => document.removeEventListener('keydown', onKeyDown, true)
  }, [open, onClose])

  if (!open) return null

  const placement =
    align === 'right' ? 'items-stretch justify-end' : 'items-end justify-center sm:items-center'

  return (
    <div className={`fixed inset-0 z-50 flex ${placement}`} role="presentation">
      {/* Fundo: clicar fora fecha o painel. */}
      <button
        type="button"
        aria-label="Fechar"
        tabIndex={-1}
        onClick={onClose}
        className="anim-fade absolute inset-0 cursor-default bg-black/75 backdrop-blur-sm"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        tabIndex={-1}
        className={`relative flex max-h-dvh w-full outline-none ${
          align === 'right' ? 'anim-slide-right max-w-md' : 'anim-fade-up max-w-5xl'
        }`}
      >
        {children}
      </div>
    </div>
  )
}
