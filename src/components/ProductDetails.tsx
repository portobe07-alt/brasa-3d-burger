import { useEffect, useMemo, useState } from 'react'
import { ShoppingBag, X } from 'lucide-react'
import type { Product } from '../types/product'
import type { Customization, Doneness } from '../types/cart'
import { DEFAULT_DONENESS } from '../types/cart'
import { formatBRL } from '../utils/currency'
import { buildIngredientDisplay, resolveComposition } from '../utils/composition'
import { EMPTY_CUSTOMIZATION, addonsTotal, unitPrice } from '../utils/pricing'
import { Burger3DViewer } from './Burger3DViewer'
import { BurgerCustomizer } from './BurgerCustomizer'
import { IngredientList } from './IngredientList'
import { Overlay } from './Overlay'
import { Badge, Button, IconButton, Rule } from './ui'

/**
 * Detalhes do produto, em painel sobreposto amplo no desktop e em folha de
 * tela cheia no celular.
 *
 * O preço exibido é sempre recalculado a partir da personalização atual, pela
 * mesma função usada pelo carrinho (`utils/pricing`).
 */
export function ProductDetails({
  product,
  open,
  onClose,
  onAddToCart,
}: {
  product: Product | null
  open: boolean
  onClose: () => void
  onAddToCart: (
    product: Product,
    customization: Customization,
    quantity: number,
    doneness: Doneness | null,
  ) => void
}) {
  const [customization, setCustomization] = useState<Customization>(EMPTY_CUSTOMIZATION)
  const [quantity, setQuantity] = useState(1)
  const [highlightedId, setHighlightedId] = useState<string | null>(null)
  // Ponto da carne e a vista exclusiva da carne, que é só de pré-visualização:
  // sair dela preserva a escolha.
  const [doneness, setDoneness] = useState<Doneness>(DEFAULT_DONENESS)
  const [meatPreview, setMeatPreview] = useState(false)

  // Abrir outro produto recomeça com a composição original.
  useEffect(() => {
    setCustomization(EMPTY_CUSTOMIZATION)
    setQuantity(1)
    setHighlightedId(null)
    setDoneness(DEFAULT_DONENESS)
    setMeatPreview(false)
  }, [product?.id])

  // A lista de ingredientes sai da mesma composição que alimenta a cena 3D,
  // então o que está escrito e o que está desenhado nunca divergem.
  const ingredientEntries = useMemo(
    () =>
      product
        ? buildIngredientDisplay(product, customization, resolveComposition(product, customization))
        : [],
    [product, customization],
  )

  const totals = useMemo(() => {
    if (!product) return { unit: 0, addons: 0, line: 0 }
    const unit = unitPrice(product, customization)
    return { unit, addons: addonsTotal(customization), line: unit * quantity }
  }, [product, customization, quantity])

  if (!product) return null

  const supportsDoneness = product.supportsDoneness
  const titleId = `produto-${product.id}-titulo`
  const isSellable = product.availability === 'available'

  return (
    <Overlay open={open} onClose={onClose} labelledBy={titleId}>
      <div className="grain flex max-h-dvh w-full flex-col overflow-hidden rounded-t-card border border-white/10 bg-coal-2 sm:rounded-card">
        {/* ------------------------------ Topo ------------------------------ */}
        <header className="flex shrink-0 items-start justify-between gap-4 border-b border-white/8 bg-coal-2/95 px-5 py-4 backdrop-blur-sm sm:px-7">
          <div className="min-w-0">
            <h2 id={titleId} className="truncate text-2xl leading-none sm:text-3xl">
              {product.name}
            </h2>
            <p className="mt-1.5 flex flex-wrap items-center gap-2 text-[0.72rem] text-ash">
              <span className="tnum font-bold text-ember-soft">{formatBRL(product.price)}</span>
              {product.proteinWeight && (
                <>
                  <span aria-hidden="true">·</span>
                  <span>Proteína {product.proteinWeight}</span>
                </>
              )}
              {product.availability === 'sold-out' && <Badge tone="muted">Esgotado hoje</Badge>}
              {product.availability === 'coming-soon' && <Badge tone="info">Em breve</Badge>}
            </p>
          </div>
          <IconButton label="Fechar detalhes do produto" variant="ghost" onClick={onClose}>
            <X size={20} aria-hidden="true" />
          </IconButton>
        </header>

        {/* ----------------------------- Conteúdo ----------------------------- */}
        <div className="thin-scrollbar flex-1 overflow-y-auto overscroll-contain">
          <div className="grid grid-cols-1 gap-8 p-5 sm:p-7 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-10">
            {/* Coluna visual */}
            <div className="flex flex-col gap-6">
              <Burger3DViewer
                product={product}
                customization={customization}
                highlightedId={highlightedId}
                meatFocus={supportsDoneness && meatPreview ? doneness : null}
              />

              <div>
                <h3 className="mb-2 text-[0.82rem] tracking-[0.14em]">Sobre este hambúrguer</h3>
                <p className="text-pretty text-[0.9rem] leading-relaxed text-cream/80">
                  {product.description}
                </p>
              </div>

              <div>
                <header className="mb-2 flex items-baseline justify-between gap-3">
                  <h3 className="text-[0.82rem] tracking-[0.14em]">Ingredientes</h3>
                  <span className="text-[0.68rem] text-ash">De baixo para cima</span>
                </header>
                <IngredientList
                  entries={ingredientEntries}
                  highlightedId={highlightedId}
                  onHighlight={setHighlightedId}
                />
              </div>
            </div>

            {/* Coluna de personalização */}
            <div className="flex flex-col gap-7">
              <BurgerCustomizer
                product={product}
                customization={customization}
                onChange={setCustomization}
                quantity={quantity}
                onQuantityChange={setQuantity}
                onHighlight={setHighlightedId}
                doneness={supportsDoneness ? doneness : null}
                onDonenessChange={setDoneness}
                onDonenessPreview={setMeatPreview}
                meatPreview={supportsDoneness && meatPreview}
              />

              <Rule />

              {/* Resumo do preço, derivado dos dados do item. */}
              <dl className="flex flex-col gap-2 text-[0.84rem]">
                <div className="flex justify-between gap-4">
                  <dt className="text-ash">Preço base</dt>
                  <dd className="tnum text-cream/90">{formatBRL(product.price)}</dd>
                </div>
                {totals.addons > 0 && (
                  <div className="flex justify-between gap-4">
                    <dt className="text-ash">Adicionais</dt>
                    <dd className="tnum text-cream/90">{formatBRL(totals.addons)}</dd>
                  </div>
                )}
                <div className="flex justify-between gap-4">
                  <dt className="text-ash">Unidade personalizada</dt>
                  <dd className="tnum text-cream/90">{formatBRL(totals.unit)}</dd>
                </div>
              </dl>
            </div>
          </div>
        </div>

        {/* ------------------------- Barra de ação ------------------------- */}
        <footer className="shrink-0 border-t border-white/8 bg-coal/95 px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur-sm sm:px-7">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-[0.66rem] font-bold tracking-[0.18em] text-ash uppercase">
                Total {quantity > 1 ? `· ${quantity} unidades` : ''}
              </p>
              <p className="tnum text-2xl font-extrabold text-cream">{formatBRL(totals.line)}</p>
            </div>
            <Button
              size="lg"
              disabled={!isSellable}
              onClick={() => {
                onAddToCart(product, customization, quantity, supportsDoneness ? doneness : null)
                onClose()
              }}
              className="flex-1 whitespace-nowrap sm:flex-none"
            >
              <ShoppingBag size={17} aria-hidden="true" />
              {isSellable ? 'Adicionar ao carrinho' : 'Indisponível'}
            </Button>
          </div>
        </footer>
      </div>
    </Overlay>
  )
}
