import { Check, Flame, Minus, Plus } from 'lucide-react'
import { resolveAddons } from '../data/addons'
import type { AddonId, Product } from '../types/product'
import type { Customization, Doneness } from '../types/cart'
import { DONENESS_OPTIONS } from '../types/cart'
import { formatDelta } from '../utils/currency'
import { Button, IconButton, Rule } from './ui'

/**
 * Personalização de um item.
 *
 * Duas decisões importantes:
 *  - retirar ingredientes não gera desconto: é preferência de montagem, e o
 *    preço base do produto continua o mesmo;
 *  - escolher um adicional altera o preço e a descrição do pedido, mas NÃO
 *    altera o modelo 3D. O modelo representa a composição original do produto,
 *    e a interface não finge o contrário.
 */
export function BurgerCustomizer({
  product,
  customization,
  onChange,
  quantity,
  onQuantityChange,
  onHighlight,
  doneness,
  onDonenessChange,
  onDonenessPreview,
  meatPreview,
}: {
  product: Product
  customization: Customization
  onChange: (next: Customization) => void
  quantity: number
  onQuantityChange: (next: number) => void
  onHighlight?: (id: string | null) => void
  /** Ponto escolhido. `null` quando o produto não oferece a opção. */
  doneness: Doneness | null
  onDonenessChange: (next: Doneness) => void
  /**
   * Liga e desliga a visualização exclusiva da carne. Passar `true` troca o
   * palco pelo corte da carne; `false` devolve o hambúrguer completo.
   */
  onDonenessPreview: (active: boolean) => void
  /** Se o palco está mostrando o corte da carne neste momento. */
  meatPreview: boolean
}) {
  const removable = product.ingredients.filter((ingredient) => ingredient.removable)
  const addons = resolveAddons(product.addonIds)

  const toggleRemoved = (id: string) => {
    const already = customization.removedIngredientIds.includes(id)
    onChange({
      ...customization,
      removedIngredientIds: already
        ? customization.removedIngredientIds.filter((entry) => entry !== id)
        : [...customization.removedIngredientIds, id],
    })
  }

  const toggleAddon = (id: AddonId) => {
    const already = customization.addonIds.includes(id)
    onChange({
      ...customization,
      addonIds: already
        ? customization.addonIds.filter((entry) => entry !== id)
        : [...customization.addonIds, id],
    })
  }

  return (
    <div className="flex flex-col gap-7">
      {/* --------------------------- Ponto da carne --------------------------- */}
      {doneness !== null && (
        <section
          // Entrar na seção mostra só a carne; sair devolve o hambúrguer.
          onMouseEnter={() => onDonenessPreview(true)}
          onMouseLeave={() => onDonenessPreview(false)}
          onFocus={() => onDonenessPreview(true)}
          onBlur={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget as Node)) onDonenessPreview(false)
          }}
        >
          <header className="mb-1 flex items-baseline justify-between gap-3">
            <h3 className="flex items-center gap-2 text-[0.82rem] tracking-[0.14em]">
              <Flame size={14} className="text-ember" aria-hidden="true" />
              Ponto da carne
            </h3>
            <span className="text-[0.68rem] text-ash">Sem alteração no preço</span>
          </header>
          <p className="mb-3 text-[0.78rem] leading-relaxed text-ash">
            Escolha um ponto para ver o corte da carne no visualizador ao lado.
          </p>

          {/* Controle explícito da vista. O passar do ponteiro também alterna,
              mas no celular não existe hover — sem este botão o cliente não
              teria como voltar ao hambúrguer de propósito. */}
          <Button
            variant={meatPreview ? 'primary' : 'secondary'}
            size="sm"
            aria-pressed={meatPreview}
            onClick={() => onDonenessPreview(!meatPreview)}
            className="mb-3"
          >
            <Flame size={13} aria-hidden="true" />
            {meatPreview ? 'Ver o hambúrguer' : 'Ver o corte da carne'}
          </Button>

          <div role="radiogroup" aria-label="Ponto da carne" className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            {DONENESS_OPTIONS.map((option) => {
              const selected = option.id === doneness
              return (
                <button
                  key={option.id}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => {
                    onDonenessChange(option.id)
                    onDonenessPreview(true)
                  }}
                  className={[
                    'flex flex-col gap-1 rounded-xl border px-3.5 py-3 text-left transition-all duration-200',
                    selected
                      ? 'border-ember/60 bg-ember/10 text-cream'
                      : 'border-white/10 bg-coal-2 text-ash hover:border-white/25 hover:text-cream',
                  ].join(' ')}
                >
                  <span className="text-[0.84rem] font-semibold">{option.name}</span>
                  <span className="text-[0.7rem] leading-snug">{option.description}</span>
                </button>
              )
            })}
          </div>
        </section>
      )}

      {doneness !== null && <Rule />}

      {/* ------------------------- Retirar ingredientes ------------------------- */}
      {removable.length > 0 && (
        <section>
          <header className="mb-1 flex items-baseline justify-between gap-3">
            <h3 className="text-[0.82rem] tracking-[0.14em]">Retirar ingredientes</h3>
            <span className="text-[0.68rem] text-ash">Sem alteração no preço</span>
          </header>
          <p className="mb-3 text-[0.78rem] text-ash">
            Desmarque o que você não quiser no seu hambúrguer.
          </p>
          <ul className="flex flex-col gap-1.5">
            {removable.map((ingredient) => {
              const kept = !customization.removedIngredientIds.includes(ingredient.id)
              return (
                <li key={ingredient.id}>
                  <label
                    className="flex cursor-pointer items-start gap-3 rounded-lg px-2 py-2 transition-colors duration-200 hover:bg-white/4"
                    onMouseEnter={() => onHighlight?.(ingredient.id)}
                    onMouseLeave={() => onHighlight?.(null)}
                  >
                    <input
                      type="checkbox"
                      checked={kept}
                      onChange={() => toggleRemoved(ingredient.id)}
                      className="peer sr-only"
                    />
                    <span
                      aria-hidden="true"
                      className={[
                        'mt-0.5 grid size-5 shrink-0 place-items-center rounded-md border transition-all duration-200',
                        kept
                          ? 'border-ember bg-ember text-white'
                          : 'border-cream/25 bg-transparent text-transparent',
                        'peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ember',
                      ].join(' ')}
                    >
                      <Check size={13} strokeWidth={3} />
                    </span>
                    <span
                      className={[
                        'text-[0.85rem] leading-snug transition-colors',
                        kept ? 'text-cream/90' : 'text-ash/60 line-through',
                      ].join(' ')}
                    >
                      {ingredient.name}
                    </span>
                  </label>
                </li>
              )
            })}
          </ul>
        </section>
      )}

      {addons.length > 0 && <Rule />}

      {/* ----------------------------- Adicionais ----------------------------- */}
      {addons.length > 0 && (
        <section>
          <h3 className="mb-3 text-[0.82rem] tracking-[0.14em]">Adicionais</h3>
          <ul className="flex flex-col gap-2">
            {addons.map((addon) => {
              const selected = customization.addonIds.includes(addon.id)
              return (
                <li key={addon.id}>
                  <label
                    className={[
                      'flex cursor-pointer items-center gap-3 rounded-xl border px-3.5 py-3 transition-all duration-200',
                      selected
                        ? 'border-ember/60 bg-ember/10'
                        : 'border-white/10 bg-coal-2 hover:border-white/25',
                    ].join(' ')}
                  >
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={() => toggleAddon(addon.id)}
                      className="peer sr-only"
                    />
                    <span
                      aria-hidden="true"
                      className={[
                        'grid size-5 shrink-0 place-items-center rounded-md border transition-all duration-200',
                        selected ? 'border-ember bg-ember text-white' : 'border-cream/25 text-transparent',
                        'peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ember',
                      ].join(' ')}
                    >
                      <Check size={13} strokeWidth={3} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[0.88rem] font-semibold text-cream">{addon.name}</span>
                      <span className="block text-[0.74rem] text-ash">{addon.description}</span>
                    </span>
                    <span
                      className={[
                        'tnum shrink-0 text-[0.82rem] font-bold',
                        selected ? 'text-ember-soft' : 'text-ash',
                      ].join(' ')}
                    >
                      {formatDelta(addon.price)}
                    </span>
                  </label>
                </li>
              )
            })}
          </ul>
        </section>
      )}

      <Rule />

      {/* ----------------------------- Quantidade ----------------------------- */}
      <section className="flex items-center justify-between gap-4">
        <h3 className="text-[0.82rem] tracking-[0.14em]">Quantidade</h3>
        <div className="flex items-center gap-2">
          <IconButton
            label="Diminuir quantidade"
            size="sm"
            onClick={() => onQuantityChange(Math.max(1, quantity - 1))}
            disabled={quantity <= 1}
          >
            <Minus size={15} aria-hidden="true" />
          </IconButton>
          <output
            aria-label="Quantidade selecionada"
            className="tnum w-10 text-center text-lg font-bold text-cream"
          >
            {quantity}
          </output>
          <IconButton
            label="Aumentar quantidade"
            size="sm"
            onClick={() => onQuantityChange(Math.min(20, quantity + 1))}
            disabled={quantity >= 20}
          >
            <Plus size={15} aria-hidden="true" />
          </IconButton>
        </div>
      </section>
    </div>
  )
}
