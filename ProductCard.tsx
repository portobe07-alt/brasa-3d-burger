import { Box, ShoppingBag } from 'lucide-react'
import type { Product } from '../types/product'
import { formatBRL } from '../utils/currency'
import { BurgerIllustration } from './BurgerIllustration'
import { Badge, Button } from './ui'

/**
 * Card de produto do cardápio.
 *
 * A imagem é a ilustração vetorial em camadas, de propósito: montar cinco
 * cenas WebGL na grade pesaria no celular sem necessidade. O modelo 3D é
 * construído ao abrir o produto.
 */
export function ProductCard({
  product,
  onExplore,
  onQuickAdd,
}: {
  product: Product
  onExplore: (product: Product) => void
  onQuickAdd: (product: Product) => void
}) {
  const isSellable = product.availability === 'available'

  return (
    <article className="group grain relative flex flex-col overflow-hidden rounded-card border border-white/8 bg-coal-2 transition-all duration-300 ease-[var(--ease-brasa)] hover:-translate-y-1 hover:border-white/18 hover:shadow-lift">
      {/* ----------------------------- Visual ----------------------------- */}
      <div className="relative aspect-5/4 w-full shrink-0 overflow-hidden bg-coal">
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_35%,rgba(232,117,50,0.2),transparent_62%)]"
        />
        <div className="absolute inset-0 flex items-center justify-center p-5">
          {product.imagePath ? (
            <img
              src={product.imagePath}
              alt={`Fotografia do hambúrguer ${product.name}.`}
              className="max-h-full max-w-full object-contain transition-transform duration-500 ease-[var(--ease-brasa)] group-hover:scale-[1.04]"
              loading="lazy"
            />
          ) : (
            <BurgerIllustration
              ingredients={product.ingredients}
              seed={product.id}
              className="h-full w-full drop-shadow-[0_18px_28px_rgba(0,0,0,0.5)] transition-transform duration-500 ease-[var(--ease-brasa)] group-hover:scale-[1.04]"
            />
          )}
        </div>

        <div className="absolute top-3 left-3 flex flex-wrap gap-2">
          {/* A miniatura é a ilustração vetorial — montar cinco cenas WebGL na
              grade seria pesado. A etiqueta anuncia o que o botão abre, não o
              que esta imagem é. */}
          <Badge tone="ember">
            <Box size={11} strokeWidth={2.5} aria-hidden="true" />
            Ver em 3D
          </Badge>
          {product.availability === 'sold-out' && <Badge tone="muted">Esgotado hoje</Badge>}
          {product.availability === 'coming-soon' && <Badge tone="info">Em breve</Badge>}
        </div>
      </div>

      {/* ----------------------------- Conteúdo ----------------------------- */}
      <div className="flex flex-1 flex-col gap-4 p-5">
        <div className="flex flex-col gap-2">
          <div className="flex items-start justify-between gap-3">
            <h3 className="text-xl leading-none">{product.name}</h3>
            <span className="tnum shrink-0 text-lg font-extrabold text-ember-soft">
              {formatBRL(product.price)}
            </span>
          </div>
          {/* Duas linhas fixas mantêm todos os cards com a mesma altura. */}
          <p className="line-clamp-2 min-h-[2.6em] text-[0.84rem] leading-relaxed text-ash">
            {product.tagline}
          </p>
        </div>

        {product.proteinWeight && (
          <p className="text-[0.68rem] font-bold tracking-[0.16em] text-ash/70 uppercase">
            Proteína {product.proteinWeight}
          </p>
        )}

        <div className="mt-auto flex flex-col gap-2">
          <Button variant="secondary" size="md" block onClick={() => onExplore(product)}>
            Explorar em 3D
          </Button>
          <Button
            variant="primary"
            size="md"
            block
            disabled={!isSellable}
            onClick={() => onQuickAdd(product)}
            aria-label={`Adicionar ${product.name} ao carrinho por ${formatBRL(product.price)}`}
          >
            <ShoppingBag size={15} aria-hidden="true" />
            {isSellable ? 'Adicionar ao carrinho' : 'Indisponível'}
          </Button>
        </div>
      </div>
    </article>
  )
}
