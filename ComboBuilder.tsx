import { useMemo, useState } from 'react'
import { Check, ShoppingBag, X } from 'lucide-react'
import { DRINKS } from '../data/drinks'
import { PRODUCTS } from '../data/products'
import { FRIES_SIZES, FRIES_VARIANTS, friesPrice } from '../data/sides'
import type { CartLineContent, Doneness } from '../types/cart'
import { DEFAULT_DONENESS, DONENESS_OPTIONS } from '../types/cart'
import type { DrinkId, FriesSize, FriesVariantId } from '../types/catalog'
import { formatBRL } from '../utils/currency'
import { COMBO_DISCOUNT, EMPTY_CUSTOMIZATION, lineUnitPrice } from '../utils/pricing'
import { DrinkIllustration } from './DrinkIllustration'
import { FriesIllustration } from './FriesIllustration'
import { Overlay } from './Overlay'
import { ProductThumb } from './ProductThumb'
import { Badge, Button, IconButton, Rule } from './ui'

/**
 * Montagem de combo: um hambúrguer, uma porção de batata e uma bebida.
 *
 * Sobre o preço: nenhum valor promocional foi definido para combos, então o
 * total é a SOMA dos itens escolhidos — nenhum desconto é inventado. Quando o
 * restaurante definir a política, basta ajustar `COMBO_DISCOUNT` em
 * `utils/pricing.ts`; a economia passa a aparecer aqui automaticamente.
 *
 * O combo entra no carrinho como uma linha única que carrega os três itens,
 * para o cliente entender exatamente o que está comprando.
 */
function OptionTile({
  selected,
  onClick,
  children,
  label,
}: {
  selected: boolean
  onClick: () => void
  children: React.ReactNode
  label: string
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      aria-label={label}
      onClick={onClick}
      className={[
        'relative flex flex-col items-center gap-2 rounded-xl border p-3 text-center transition-all duration-200',
        selected
          ? 'border-ember/60 bg-ember/10 text-cream'
          : 'border-white/10 bg-coal text-ash hover:border-white/25 hover:text-cream',
      ].join(' ')}
    >
      {selected && (
        <span
          aria-hidden="true"
          className="absolute top-2 right-2 grid size-4 place-items-center rounded-full bg-ember text-white"
        >
          <Check size={10} strokeWidth={3.5} />
        </span>
      )}
      {children}
    </button>
  )
}

export function ComboBuilder({
  open,
  onClose,
  onAdd,
}: {
  open: boolean
  onClose: () => void
  onAdd: (content: CartLineContent) => void
}) {
  const [productId, setProductId] = useState(PRODUCTS[0]?.id ?? '')
  const [doneness, setDoneness] = useState<Doneness>(DEFAULT_DONENESS)
  const [variantId, setVariantId] = useState<FriesVariantId>('tradicional')
  const [size, setSize] = useState<FriesSize>('M')
  const [drinkId, setDrinkId] = useState<DrinkId>(DRINKS[0]?.id ?? 'agua')

  const product = PRODUCTS.find((entry) => entry.id === productId)
  const supportsDoneness = product?.supportsDoneness ?? false

  const content = useMemo<CartLineContent>(
    () => ({
      kind: 'combo',
      burger: {
        productId,
        customization: EMPTY_CUSTOMIZATION,
        doneness: supportsDoneness ? doneness : null,
      },
      fries: { variantId, size },
      drink: { drinkId },
    }),
    [productId, supportsDoneness, doneness, variantId, size, drinkId],
  )

  const drink = DRINKS.find((entry) => entry.id === drinkId)
  const parts = {
    burger: product?.price ?? 0,
    fries: friesPrice(variantId, size),
    drink: drink?.price ?? 0,
  }
  const total = lineUnitPrice(content)
  const titleId = 'combo-titulo'

  return (
    <Overlay open={open} onClose={onClose} labelledBy={titleId}>
      <div className="grain flex max-h-dvh w-full max-w-4xl flex-col overflow-hidden rounded-t-card border border-white/10 bg-coal-2 sm:rounded-card">
        <header className="flex shrink-0 items-start justify-between gap-4 border-b border-white/8 px-5 py-4 sm:px-7">
          <div>
            <h2 id={titleId} className="text-2xl leading-none">
              Monte seu combo
            </h2>
            <p className="mt-1.5 text-[0.72rem] text-ash">
              Um hambúrguer, uma batata e uma bebida.
            </p>
          </div>
          <IconButton label="Fechar montagem de combo" variant="ghost" onClick={onClose}>
            <X size={20} aria-hidden="true" />
          </IconButton>
        </header>

        <div className="thin-scrollbar flex-1 overflow-y-auto overscroll-contain px-5 py-6 sm:px-7">
          <div className="flex flex-col gap-8">
            {/* ----------------------- 1. Hambúrguer ----------------------- */}
            <section>
              <h3 className="mb-3 text-[0.82rem] tracking-[0.14em]">1. Escolha o hambúrguer</h3>
              <div role="radiogroup" aria-label="Hambúrguer do combo" className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                {PRODUCTS.map((entry) => (
                  <OptionTile
                    key={entry.id}
                    selected={entry.id === productId}
                    onClick={() => setProductId(entry.id)}
                    label={`${entry.name}, ${formatBRL(entry.price)}`}
                  >
                    <span className="flex h-16 w-full items-center justify-center">
                      <ProductThumb
                        content={{
                          kind: 'burger',
                          burger: { productId: entry.id, customization: EMPTY_CUSTOMIZATION, doneness: null },
                        }}
                        className="h-full w-full"
                      />
                    </span>
                    <span className="text-[0.74rem] leading-tight font-semibold">{entry.name}</span>
                    <span className="tnum text-[0.7rem]">{formatBRL(entry.price)}</span>
                  </OptionTile>
                ))}
              </div>

              {supportsDoneness && (
                <div className="mt-4">
                  <p className="mb-2 text-[0.74rem] text-ash">Ponto da carne (não altera o preço)</p>
                  <div role="radiogroup" aria-label="Ponto da carne do combo" className="flex flex-wrap gap-2">
                    {DONENESS_OPTIONS.map((option) => (
                      <button
                        key={option.id}
                        type="button"
                        role="radio"
                        aria-checked={option.id === doneness}
                        onClick={() => setDoneness(option.id)}
                        className={[
                          'rounded-full border px-3.5 py-1.5 text-[0.74rem] font-semibold transition-all duration-200',
                          option.id === doneness
                            ? 'border-ember/60 bg-ember/10 text-cream'
                            : 'border-white/10 text-ash hover:border-white/25 hover:text-cream',
                        ].join(' ')}
                      >
                        {option.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </section>

            <Rule />

            {/* ------------------------- 2. Batata ------------------------- */}
            <section>
              <h3 className="mb-3 text-[0.82rem] tracking-[0.14em]">2. Escolha a batata</h3>
              <div role="radiogroup" aria-label="Batata do combo" className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {FRIES_VARIANTS.map((variant) => (
                  <OptionTile
                    key={variant.id}
                    selected={variant.id === variantId}
                    onClick={() => setVariantId(variant.id)}
                    label={`${variant.name}, ${formatBRL(friesPrice(variant.id, size))}`}
                  >
                    <span className="flex h-16 w-full items-center justify-center">
                      <FriesIllustration variantId={variant.id} className="h-full w-auto" />
                    </span>
                    <span className="text-[0.74rem] leading-tight font-semibold">{variant.name}</span>
                    <span className="tnum text-[0.7rem]">{formatBRL(friesPrice(variant.id, size))}</span>
                  </OptionTile>
                ))}
              </div>

              <div className="mt-4">
                <p className="mb-2 text-[0.74rem] text-ash">Tamanho</p>
                <div role="radiogroup" aria-label="Tamanho da batata do combo" className="flex flex-wrap gap-2">
                  {FRIES_SIZES.map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      role="radio"
                      aria-checked={option.id === size}
                      onClick={() => setSize(option.id)}
                      className={[
                        'tnum rounded-full border px-4 py-1.5 text-[0.74rem] font-semibold transition-all duration-200',
                        option.id === size
                          ? 'border-ember/60 bg-ember/10 text-cream'
                          : 'border-white/10 text-ash hover:border-white/25 hover:text-cream',
                      ].join(' ')}
                    >
                      {option.name} · {formatBRL(friesPrice(variantId, option.id))}
                    </button>
                  ))}
                </div>
              </div>
            </section>

            <Rule />

            {/* ------------------------- 3. Bebida ------------------------- */}
            <section>
              <h3 className="mb-3 text-[0.82rem] tracking-[0.14em]">3. Escolha a bebida</h3>
              <div role="radiogroup" aria-label="Bebida do combo" className="grid grid-cols-3 gap-3 sm:grid-cols-7">
                {DRINKS.map((entry) => (
                  <OptionTile
                    key={entry.id}
                    selected={entry.id === drinkId}
                    onClick={() => setDrinkId(entry.id)}
                    label={`${entry.name}, ${formatBRL(entry.price)}`}
                  >
                    <span className="flex h-14 w-full items-center justify-center">
                      <DrinkIllustration drinkId={entry.id} className="h-full w-auto" />
                    </span>
                    <span className="text-[0.7rem] leading-tight font-semibold">{entry.name}</span>
                    <span className="tnum text-[0.68rem]">{formatBRL(entry.price)}</span>
                  </OptionTile>
                ))}
              </div>
            </section>
          </div>
        </div>

        {/* --------------------------- Resumo --------------------------- */}
        <footer className="shrink-0 border-t border-white/8 bg-coal/95 px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur-sm sm:px-7">
          <dl className="mb-3 flex flex-wrap items-center gap-x-5 gap-y-1 text-[0.76rem]">
            <div className="flex gap-2">
              <dt className="text-ash">Hambúrguer</dt>
              <dd className="tnum text-cream/90">{formatBRL(parts.burger)}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="text-ash">Batata</dt>
              <dd className="tnum text-cream/90">{formatBRL(parts.fries)}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="text-ash">Bebida</dt>
              <dd className="tnum text-cream/90">{formatBRL(parts.drink)}</dd>
            </div>
            {COMBO_DISCOUNT > 0 ? (
              <Badge tone="positive">Economia de {formatBRL(COMBO_DISCOUNT)}</Badge>
            ) : (
              <Badge tone="muted">Soma dos itens — sem desconto configurado</Badge>
            )}
          </dl>

          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-[0.66rem] font-bold tracking-[0.18em] text-ash uppercase">Total do combo</p>
              <p className="tnum text-2xl font-extrabold text-cream">{formatBRL(total)}</p>
            </div>
            <Button
              size="lg"
              className="flex-1 whitespace-nowrap sm:flex-none"
              onClick={() => {
                onAdd(content)
                onClose()
              }}
            >
              <ShoppingBag size={17} aria-hidden="true" />
              Adicionar combo
            </Button>
          </div>
        </footer>
      </div>
    </Overlay>
  )
}
