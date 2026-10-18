import { useMemo, useState } from 'react'
import { ArrowLeft, Check, Copy, Info, QrCode, Store, Truck, X } from 'lucide-react'
import { STORE, hasOrderChannel } from '../data/store'
import { useCart } from '../hooks/useCart'
import type { FulfillmentMode } from '../types/cart'
import { formatBRL } from '../utils/currency'
import { readAccessContext } from '../utils/accessContext'
import { buildOrderPayload, buildWhatsAppUrl, formatOrderAsText } from '../utils/order'
import { Overlay } from './Overlay'
import { Badge, Button, IconButton, Rule } from './ui'

/**
 * Revisão do pedido.
 *
 * O modo demonstrativo é explícito: sem WhatsApp nem API de pedidos
 * configurados em `data/store.ts`, nada é enviado e a interface diz isso. A
 * ação que existe de verdade é copiar o resumo, e ela é anunciada como tal.
 */
export function Checkout({
  open,
  onClose,
  onBackToCart,
}: {
  open: boolean
  onClose: () => void
  onBackToCart: () => void
}) {
  const cart = useCart()
  const [fulfillment, setFulfillment] = useState<FulfillmentMode>('pickup')
  const [notes, setNotes] = useState('')
  const [copied, setCopied] = useState(false)

  // A URL só é lida uma vez: a mesa não muda durante a sessão.
  const access = useMemo(() => readAccessContext(), [])
  const payload = useMemo(
    () => buildOrderPayload(cart.items, fulfillment, notes, access),
    [cart.items, fulfillment, notes, access],
  )
  const whatsappUrl = buildWhatsAppUrl(payload)
  const channelReady = hasOrderChannel()
  const titleId = 'checkout-titulo'

  const copySummary = async () => {
    const text = formatOrderAsText(payload)
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2400)
    } catch (error) {
      console.warn('[Brasa3D] Não foi possível copiar o resumo:', error)
      window.prompt('Copie o resumo do pedido:', text)
    }
  }

  return (
    <Overlay open={open} onClose={onClose} labelledBy={titleId}>
      <div className="grain flex max-h-dvh w-full max-w-2xl flex-col overflow-hidden rounded-t-card border border-white/10 bg-coal-2 sm:rounded-card">
        <header className="flex shrink-0 items-start justify-between gap-4 border-b border-white/8 px-5 py-4 sm:px-7">
          <div>
            <h2 id={titleId} className="text-2xl leading-none">
              Revisão do pedido
            </h2>
            <p className="mt-1.5 text-[0.72rem] text-ash">
              Confira os itens antes de concluir.
            </p>
          </div>
          <IconButton label="Fechar revisão do pedido" variant="ghost" onClick={onClose}>
            <X size={20} aria-hidden="true" />
          </IconButton>
        </header>

        <div className="thin-scrollbar flex-1 overflow-y-auto overscroll-contain px-5 py-6 sm:px-7">
          {payload.lines.length === 0 ? (
            <div className="flex flex-col items-center gap-5 py-10 text-center">
              <p className="text-[0.95rem] font-semibold text-cream">Não há itens para revisar</p>
              <Button variant="secondary" onClick={onBackToCart}>
                <ArrowLeft size={15} aria-hidden="true" />
                Voltar ao cardápio
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-7">
              {/* ----------------------------- Itens ----------------------------- */}
              <section>
                <h3 className="mb-3 text-[0.82rem] tracking-[0.14em]">Itens</h3>
                <ul className="flex flex-col divide-y divide-white/8">
                  {payload.lines.map((line, index) => (
                    <li key={`${line.kind}-${line.title}-${index}`} className="flex gap-3 py-3">
                      <span className="tnum mt-0.5 shrink-0 rounded-md bg-coal-3 px-2 py-0.5 text-[0.78rem] font-bold text-cream">
                        {line.quantity}×
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-[0.92rem] font-semibold text-cream">{line.title}</p>
                        {line.details.map((detail, detailIndex) => (
                          <p
                            key={`${detail}-${detailIndex}`}
                            className={`text-[0.74rem] whitespace-pre ${
                              detail.trimStart().startsWith('+') ? 'text-ember-soft' : 'text-ash'
                            }`}
                          >
                            {detail}
                          </p>
                        ))}
                        <p className="tnum mt-1 text-[0.72rem] text-ash">
                          {formatBRL(line.unitPrice)} por unidade
                        </p>
                      </div>
                      <span className="tnum shrink-0 text-[0.95rem] font-extrabold text-cream">
                        {formatBRL(line.lineTotal)}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>

              {payload.table && (
                <div className="flex items-start gap-3 rounded-xl border border-white/10 bg-coal p-4">
                  <QrCode size={17} className="mt-0.5 shrink-0 text-ember-soft" aria-hidden="true" />
                  <div className="text-[0.8rem] leading-relaxed">
                    <p className="font-semibold text-cream">Mesa {payload.table}</p>
                    <p className="mt-0.5 text-ash">
                      Identificada pelo acesso ao cardápio. Isso não abre comanda nem envia o pedido para a
                      cozinha — serve para acompanhar o resumo quando houver integração.
                    </p>
                  </div>
                </div>
              )}

              {/* --------------------------- Retirada ---------------------------- */}
              <section>
                <header className="mb-1 flex items-baseline justify-between gap-3">
                  <h3 className="text-[0.82rem] tracking-[0.14em]">Como receber</h3>
                  <Badge tone="muted">Opções demonstrativas</Badge>
                </header>
                <p className="mb-3 text-[0.78rem] leading-relaxed text-ash">
                  Endereço de retirada, região de entrega e prazos ainda não foram configurados.
                </p>
                <div
                  role="radiogroup"
                  aria-label="Como receber o pedido"
                  className="grid grid-cols-1 gap-2 sm:grid-cols-2"
                >
                  {(
                    [
                      { mode: 'pickup' as const, label: 'Retirada no balcão', icon: Store },
                      { mode: 'delivery' as const, label: 'Entrega', icon: Truck },
                    ] satisfies { mode: FulfillmentMode; label: string; icon: typeof Store }[]
                  ).map(({ mode, label, icon: Icon }) => {
                    const selected = fulfillment === mode
                    return (
                      <button
                        key={mode}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        onClick={() => setFulfillment(mode)}
                        className={[
                          'flex items-center gap-3 rounded-xl border px-4 py-3.5 text-left transition-all duration-200',
                          selected
                            ? 'border-ember/60 bg-ember/10 text-cream'
                            : 'border-white/10 bg-coal text-ash hover:border-white/25 hover:text-cream',
                        ].join(' ')}
                      >
                        <Icon size={18} aria-hidden="true" className={selected ? 'text-ember-soft' : ''} />
                        <span className="text-[0.86rem] font-semibold">{label}</span>
                      </button>
                    )
                  })}
                </div>
                {fulfillment === 'delivery' && STORE.deliveryFee === null && (
                  <p className="mt-2.5 text-[0.74rem] leading-relaxed text-ash">
                    A taxa de entrega não está configurada, por isso não entra no total abaixo.
                  </p>
                )}
              </section>

              {/* -------------------------- Observações -------------------------- */}
              <section>
                <label htmlFor="checkout-observacoes" className="mb-2 block text-[0.82rem] tracking-[0.14em] uppercase">
                  Observações
                </label>
                <textarea
                  id="checkout-observacoes"
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  rows={3}
                  maxLength={400}
                  placeholder="Ponto da carne, embalagens separadas, alguma restrição alimentar…"
                  className="w-full resize-y rounded-xl border border-white/12 bg-coal px-4 py-3 text-[0.88rem] text-cream placeholder:text-ash/60 focus:border-ember/60 focus:outline-none"
                />
                <p className="tnum mt-1.5 text-right text-[0.68rem] text-ash">{notes.length}/400</p>
              </section>

              <Rule />

              {/* ----------------------------- Total ----------------------------- */}
              <section>
                <dl className="flex flex-col gap-2 text-[0.88rem]">
                  <div className="flex justify-between gap-4">
                    <dt className="text-ash">Subtotal</dt>
                    <dd className="tnum text-cream/90">{formatBRL(payload.subtotal)}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-ash">Entrega</dt>
                    <dd className="text-ash">
                      {payload.deliveryFee === null ? 'Não configurada' : formatBRL(payload.deliveryFee)}
                    </dd>
                  </div>
                  <Rule className="my-1" />
                  <div className="flex items-baseline justify-between gap-4">
                    <dt className="text-[0.72rem] font-bold tracking-[0.18em] text-ash uppercase">Total</dt>
                    <dd className="tnum text-3xl font-extrabold text-cream">{formatBRL(payload.total)}</dd>
                  </div>
                </dl>
              </section>

              {/* ------------------------ Modo demonstrativo ------------------------ */}
              <div className="flex gap-3 rounded-xl border border-sky-400/20 bg-sky-500/8 p-4">
                <Info size={17} className="mt-0.5 shrink-0 text-sky-300" aria-hidden="true" />
                <div className="text-[0.8rem] leading-relaxed text-cream/85">
                  <p className="font-semibold text-cream">Finalização em modo demonstrativo</p>
                  <p className="mt-1 text-ash">
                    {channelReady
                      ? 'Um canal de pedidos está configurado e o resumo abaixo será enviado por ele.'
                      : 'Nenhum canal de pedidos está configurado, então este pedido não será enviado a ninguém. Você pode copiar o resumo e enviá-lo por conta própria. Para habilitar o envio, preencha o WhatsApp ou a URL da API em src/data/store.ts.'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {payload.lines.length > 0 && (
          <footer className="shrink-0 border-t border-white/8 bg-coal/95 px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur-sm sm:px-7">
            <div className="flex flex-col gap-2 sm:flex-row-reverse sm:items-center">
              {whatsappUrl ? (
                <Button
                  size="lg"
                  className="flex-1"
                  onClick={() => window.open(whatsappUrl, '_blank', 'noopener,noreferrer')}
                >
                  Enviar pedido pelo WhatsApp
                </Button>
              ) : (
                <Button size="lg" className="flex-1" onClick={copySummary}>
                  {copied ? <Check size={17} aria-hidden="true" /> : <Copy size={17} aria-hidden="true" />}
                  {copied ? 'Resumo copiado' : 'Copiar resumo do pedido'}
                </Button>
              )}
              <Button variant="ghost" size="lg" onClick={onBackToCart}>
                <ArrowLeft size={16} aria-hidden="true" />
                Voltar ao carrinho
              </Button>
            </div>
            <p aria-live="polite" className="sr-only">
              {copied ? 'Resumo do pedido copiado para a área de transferência.' : ''}
            </p>
          </footer>
        )}
      </div>
    </Overlay>
  )
}
