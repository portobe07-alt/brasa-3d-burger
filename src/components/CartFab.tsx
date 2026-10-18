import { ShoppingBag } from 'lucide-react'
import { useCart } from '../hooks/useCart'
import { formatBRL } from '../utils/currency'

/**
 * Barra flutuante do carrinho no celular.
 *
 * Garante que o pedido fique sempre a um toque, sem precisar voltar ao topo
 * da página. Só aparece quando há itens.
 */
export function CartFab({ onOpen, hidden }: { onOpen: () => void; hidden: boolean }) {
  const cart = useCart()
  if (cart.count === 0 || hidden) return null

  return (
    <div className="fixed inset-x-0 bottom-0 z-30 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:hidden">
      <button
        type="button"
        onClick={onOpen}
        className="anim-fade-up flex w-full items-center justify-between gap-3 rounded-full bg-ember px-5 py-3.5 shadow-ember transition-transform duration-200 active:scale-[0.98]"
        aria-label={`Abrir carrinho com ${cart.count} ${cart.count === 1 ? 'item' : 'itens'}, subtotal ${formatBRL(cart.subtotal)}`}
      >
        <span className="flex items-center gap-2.5 text-[0.78rem] font-bold tracking-[0.1em] text-white uppercase">
          <ShoppingBag size={17} aria-hidden="true" />
          Ver pedido
          <span className="tnum grid min-w-5 place-items-center rounded-full bg-black/25 px-1.5 py-0.5 text-[0.66rem] leading-none">
            {cart.count}
          </span>
        </span>
        <span className="tnum text-[0.95rem] font-extrabold text-white">{formatBRL(cart.subtotal)}</span>
      </button>
    </div>
  )
}
