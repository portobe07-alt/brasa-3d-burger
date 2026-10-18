import type { IngredientDisplayEntry } from '../utils/composition'
import { visualFor } from '../utils/ingredientVisuals'

/**
 * Lista de ingredientes na ordem real de montagem, de baixo para cima.
 *
 * Reflete a composição efetiva: adicionais aparecem na posição em que
 * entraram no hambúrguer, e ingredientes retirados ficam riscados no lugar de
 * origem. Passar o ponteiro ou o foco por uma linha destaca a peça
 * correspondente na cena 3D.
 */
export function IngredientList({
  entries,
  onHighlight,
  highlightedId = null,
}: {
  entries: IngredientDisplayEntry[]
  onHighlight?: (id: string | null) => void
  highlightedId?: string | null
}) {
  let position = 0

  return (
    <ol
      className="flex flex-col"
      onMouseLeave={() => onHighlight?.(null)}
      aria-label="Ingredientes, de baixo para cima"
    >
      {entries.map((entry) => {
        const visual = visualFor(entry.kind)
        const removed = entry.state === 'removed'
        if (!removed) position += 1
        const highlighted =
          highlightedId !== null && entry.ingredientId === highlightedId && !removed

        return (
          <li key={entry.id}>
            <div
              className={[
                'flex items-start gap-3 rounded-lg px-2 py-2 transition-colors duration-200',
                highlighted ? 'bg-ember/10' : 'hover:bg-white/4',
              ].join(' ')}
              onMouseEnter={() => onHighlight?.(entry.ingredientId)}
              onFocus={() => onHighlight?.(entry.ingredientId)}
              onBlur={() => onHighlight?.(null)}
              tabIndex={onHighlight ? 0 : -1}
            >
              <span
                aria-hidden="true"
                className={`mt-1 size-3 shrink-0 rounded-full border border-black/30 ${removed ? 'opacity-35' : ''}`}
                style={{
                  background: `linear-gradient(140deg, ${visual.light}, ${visual.color} 60%, ${visual.dark})`,
                }}
              />
              <span className="tnum w-5 shrink-0 text-[0.7rem] font-bold text-ash/60">
                {removed ? '—' : String(position).padStart(2, '0')}
              </span>
              <span
                className={[
                  'text-[0.86rem] leading-snug',
                  removed ? 'text-ash/50 line-through' : 'text-cream/90',
                ].join(' ')}
              >
                {entry.name}
                {removed && (
                  <span className="ml-2 text-[0.66rem] font-bold tracking-[0.12em] text-ash uppercase no-underline">
                    retirado
                  </span>
                )}
                {entry.state === 'addon' && (
                  <span className="ml-2 text-[0.66rem] font-bold tracking-[0.12em] text-ember-soft uppercase">
                    adicional
                  </span>
                )}
              </span>
            </div>
          </li>
        )
      })}
    </ol>
  )
}
