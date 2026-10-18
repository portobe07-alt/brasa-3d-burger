import { ArrowLeft, ShoppingBag, X } from 'lucide-react'
import { useCart } from '../hooks/useCart'
import { formatBRL } from '../utils/currency'
import { CartItemRow } from './CartItem'
import { Overlay } from './Overlay'
import { Button, IconButton } from './ui'

/** Painel lateral do carrinho. */
export function CartDrawer({
  open,
  onClose,
  onCheckout,
}: {
  open: boolean
  onClose: () => void
  onCheckout: () => void
}) {
  const cart = useCart()
  const titleId = 'carrinho-titulo'

  return (
    <Overlay open={open} onClose={onClose} labelledBy={titleId} align="right">
      <div className="grain flex h-dvh w-full flex-col border-l border-white/10 bg-coal-2">
        <header className="flex shrink-0 items-center justify-between gap-4 border-b border-white/8 px-5 py-4">
          <div>
            <h2 id={titleId} className="text-xl leading-none">
              Seu pedido
            </h2>
            <p className="mt-1 text-[0.72rem] text-ash">
              {cart.count === 0
                ? 'Nenhum item ainda'
                : `${cart.count} ${cart.count === 1 ? 'item' : 'itens'}`}
            </p>
          </div>
          <IconButton label="Fechar carrinho" variant="ghost" onClick={onClose}>
            <X size={20} aria-hidden="true" />
          </IconButton>
        </header>

        {cart.items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-5 px-8 text-center">
            <span
              aria-hidden="true"
              className="grid size-16 place-items-center rounded-full border border-white/10 bg-coal text-ash"
            >
              <ShoppingBag size={26} />
            </span>
            <div>
              <p className="text-[0.95rem] font-semibold text-cream">Seu carrinho está vazio</p>
              <p className="mt-1.5 text-[0.84rem] leading-relaxed text-ash">
                Escolha um hambúrguer no cardápio para começar o pedido.
              </p>
            </div>
            <Button variant="secondary" onClick={onClose}>
              <ArrowLeft size={15} aria-hidden="true" />
              Voltar ao cardápio
            </Button>
          </div>
        ) : (
          <>
            <ul
              aria-label="Itens do carrinho"
              className="thin-scrollbar flex flex-1 flex-col gap-3 overflow-y-auto overscroll-contain p-4"
            >
              {cart.items.map((item) => (
                <CartItemRow
                  key={item.key}
                  item={item}
                  onIncrement={cart.increment}
                  onDecrement={cart.decrement}
                  onRemove={cart.removeItem}
                />
              ))}
            </ul>

            <footer className="shrink-0 border-t border-white/8 bg-coal/95 px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur-sm">
              <dl className="mb-4 flex items-baseline justify-between gap-4">
                <dt className="text-[0.7rem] font-bold tracking-[0.18em] text-ash uppercase">Subtotal</dt>
                <dd className="tnum text-2xl font-extrabold text-cream">{formatBRL(cart.subtotal)}</dd>
              </dl>
              <p className="mb-4 text-[0.72rem] leading-relaxed text-ash">
                Taxas de entrega e formas de pagamento ainda não estão configuradas nesta demonstração.
              </p>
              <div className="flex flex-col gap-2">
                <Button size="lg" block onClick={onCheckout}>
                  Finalizar pedido
                </Button>
                <Button variant="ghost" block onClick={onClose}>
                  <ArrowLeft size={15} aria-hidden="true" />
                  Voltar ao cardápio
                </Button>
              </div>
            </footer>
          </>
        )}
      </div>
    </Overlay>
  )
}
