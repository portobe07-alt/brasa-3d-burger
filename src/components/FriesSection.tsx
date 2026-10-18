import { useState } from 'react'
import { ShoppingBag } from 'lucide-react'
import { FRIES_SIZES, FRIES_VARIANTS, friesPrice } from '../data/sides'
import type { FriesSize, FriesVariantId } from '../types/catalog'
import type { CartLineContent } from '../types/cart'
import { formatBRL } from '../utils/currency'
import { FriesIllustration } from './FriesIllustration'
import { Button, SectionHeading } from './ui'

/**
 * Seção de acompanhamentos.
 *
 * Cada card guarda o próprio tamanho selecionado, e o preço exibido vem
 * sempre de `friesPrice()` — a mesma função usada pelo carrinho. Não existe
 * tamanho sem preço: trocar P, M ou G atualiza o valor e o item que vai para
 * o carrinho.
 */
function FriesCard({
  variantId,
  name,
  description,
  onAdd,
}: {
  variantId: FriesVariantId
  name: string
  description: string
  onAdd: (content: CartLineContent) => void
}) {
  const [size, setSize] = useState<FriesSize>('M')
  const price = friesPrice(variantId, size)

  return (
    <article className="group grain flex flex-col overflow-hidden rounded-card border border-white/8 bg-coal-2 transition-all duration-300 ease-[var(--ease-brasa)] hover:-translate-y-1 hover:border-white/18 hover:shadow-lift">
      <div className="relative aspect-5/4 w-full shrink-0 overflow-hidden bg-coal">
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_35%,rgba(232,117,50,0.2),transparent_62%)]"
        />
        <div className="absolute inset-0 flex items-center justify-center p-4">
          <FriesIllustration
            variantId={variantId}
            className="h-full w-full drop-shadow-[0_18px_28px_rgba(0,0,0,0.5)] transition-transform duration-500 ease-[var(--ease-brasa)] group-hover:scale-[1.04]"
          />
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-4 p-5">
        <div className="flex flex-col gap-2">
          <div className="flex items-start justify-between gap-3">
            <h3 className="min-h-[2.3em] text-lg leading-tight">{name}</h3>
            <span className="tnum shrink-0 text-lg font-extrabold text-ember-soft">{formatBRL(price)}</span>
          </div>
          <p className="line-clamp-2 min-h-[2.6em] text-[0.84rem] leading-relaxed text-ash">{description}</p>
        </div>

        {/* Seletor de tamanho: cada opção mostra o próprio preço. */}
        <div role="radiogroup" aria-label={`Tamanho — ${name}`} className="grid grid-cols-3 gap-2">
          {FRIES_SIZES.map((option) => {
            const selected = option.id === size
            return (
              <button
                key={option.id}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => setSize(option.id)}
                className={[
                  'flex flex-col items-center gap-0.5 rounded-xl border px-2 py-2.5 transition-all duration-200',
                  selected
                    ? 'border-ember/60 bg-ember/10 text-cream'
                    : 'border-white/10 bg-coal text-ash hover:border-white/25 hover:text-cream',
                ].join(' ')}
              >
                <span className="text-[0.82rem] font-bold">{option.shortName}</span>
                <span className="tnum text-[0.68rem]">{formatBRL(friesPrice(variantId, option.id))}</span>
              </button>
            )
          })}
        </div>

        <Button
          variant="primary"
          size="md"
          block
          className="mt-auto"
          onClick={() => onAdd({ kind: 'fries', fries: { variantId, size } })}
          aria-label={`Adicionar ${name} tamanho ${size} ao carrinho por ${formatBRL(price)}`}
        >
          <ShoppingBag size={15} aria-hidden="true" />
          Adicionar ao carrinho
        </Button>
      </div>
    </article>
  )
}

export function FriesSection({ onAdd }: { onAdd: (content: CartLineContent) => void }) {
  return (
    <section id="batatas" className="scroll-mt-24 border-t border-white/8 px-4 py-20 sm:px-6 lg:py-24">
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          eyebrow="Acompanhamentos"
          title="Crocantes por fora, macias por dentro."
          subtitle="Escolha o tamanho da sua porção. O preço acompanha a escolha."
        />
        <div className="mt-14 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FRIES_VARIANTS.map((variant) => (
            <FriesCard
              key={variant.id}
              variantId={variant.id}
              name={variant.name}
              description={variant.description}
              onAdd={onAdd}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
