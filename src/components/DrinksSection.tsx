import { Plus } from 'lucide-react'
import { DRINKS_BY_CATEGORY, DRINK_CATEGORY_LABEL } from '../data/drinks'
import type { CartLineContent } from '../types/cart'
import type { Drink } from '../types/catalog'
import { formatBRL } from '../utils/currency'
import { DrinkIllustration } from './DrinkIllustration'
import { SectionHeading } from './ui'

/**
 * Seção de bebidas, agrupada por categoria.
 *
 * As ilustrações são genéricas — garrafa, lata ou copo com a cor da bebida.
 * Não reproduzem rótulos nem embalagens de marca; o nome identifica o produto.
 */
function DrinkCard({ drink, onAdd }: { drink: Drink; onAdd: (content: CartLineContent) => void }) {
  return (
    <button
      type="button"
      onClick={() => onAdd({ kind: 'drink', drink: { drinkId: drink.id } })}
      aria-label={`Adicionar ${drink.name} ao carrinho por ${formatBRL(drink.price)}`}
      className="group grain relative flex flex-col items-center gap-3 rounded-card border border-white/8 bg-coal-2 p-4 text-center transition-all duration-300 ease-[var(--ease-brasa)] hover:-translate-y-1 hover:border-white/18 hover:shadow-lift"
    >
      <span
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-24 bg-[radial-gradient(ellipse_at_50%_0%,rgba(232,117,50,0.16),transparent_70%)]"
      />
      <span className="relative flex h-28 w-full items-center justify-center">
        <DrinkIllustration
          drinkId={drink.id}
          className="h-full w-auto drop-shadow-[0_12px_20px_rgba(0,0,0,0.5)] transition-transform duration-500 ease-[var(--ease-brasa)] group-hover:scale-[1.06]"
        />
      </span>
      <span className="flex flex-1 flex-col gap-1">
        <span className="text-[0.88rem] leading-tight font-semibold text-cream">{drink.name}</span>
        <span className="tnum text-[0.95rem] font-extrabold text-ember-soft">{formatBRL(drink.price)}</span>
      </span>
      <span className="inline-flex items-center gap-1.5 rounded-full border border-cream/20 px-3 py-1.5 text-[0.66rem] font-bold tracking-[0.1em] text-cream uppercase transition-colors group-hover:border-ember group-hover:bg-ember group-hover:text-white">
        <Plus size={12} aria-hidden="true" />
        Adicionar
      </span>
    </button>
  )
}

export function DrinksSection({ onAdd }: { onAdd: (content: CartLineContent) => void }) {
  return (
    <section id="bebidas" className="scroll-mt-24 border-t border-white/8 bg-coal-2 px-4 py-20 sm:px-6 lg:py-24">
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          eyebrow="Bebidas"
          title="Para acompanhar."
          subtitle="Água, refrigerantes e sucos. Toque para adicionar ao pedido."
        />

        <div className="mt-14 flex flex-col gap-10">
          {DRINKS_BY_CATEGORY.map(({ category, drinks }) => (
            <div key={category}>
              <h3 className="mb-4 text-[0.82rem] tracking-[0.18em] text-ash">
                {DRINK_CATEGORY_LABEL[category]}
              </h3>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {drinks.map((drink) => (
                  <DrinkCard key={drink.id} drink={drink} onAdd={onAdd} />
                ))}
              </div>
            </div>
          ))}
        </div>

        <p className="mt-10 text-[0.74rem] leading-relaxed text-ash/75">
          As imagens das bebidas são ilustrações genéricas e não representam as embalagens das marcas.
        </p>
      </div>
    </section>
  )
}
