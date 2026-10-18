import { Check } from 'lucide-react'

/**
 * Aviso curto de confirmação. Vive em uma região `aria-live` para que
 * leitores de tela também recebam a confirmação.
 */
export function Toast({ message }: { message: string | null }) {
  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      className="pointer-events-none fixed inset-x-0 top-20 z-45 flex justify-center px-4"
    >
      {message && (
        <p className="anim-fade-up flex items-center gap-2.5 rounded-full border border-white/10 bg-coal-3/95 px-4 py-2.5 text-[0.82rem] font-semibold text-cream shadow-lift backdrop-blur-sm">
          <span aria-hidden="true" className="grid size-5 place-items-center rounded-full bg-ember text-white">
            <Check size={12} strokeWidth={3} />
          </span>
          {message}
        </p>
      )}
    </div>
  )
}
