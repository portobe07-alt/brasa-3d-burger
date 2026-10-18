import { Minus, Plus, Trash2 } from 'lucide-react'
import type { CartItem as CartItemModel, CartLineContent } from '../types/cart'
import { formatBRL } from '../utils/currency'
import {
  describeBurger,
  describeDrink,
  describeFries,
  isContentValid,
  lineTitle,
  lineTotal,
  lineUnitPrice,
} from '../utils/pricing'
import { ProductThumb } from './ProductThumb'
import { IconButton } from './ui'

/**
 * Uma linha do carrinho.
 *
 * Serve os quatro tipos — hambúrguer, batata, bebida e combo. Os detalhes são
 * escritos a partir dos dados do item, não de texto guardado junto: os nomes
 * vêm sempre do catálogo atual.
 */

/** Linhas de detalhe exibidas abaixo do nome do item. */
function detailLines(content: CartLineContent): { text: string; tone: 'add' | 'remove' | 'info' }[] {
  const burgerLines = (selection: Parameters<typeof describeBurger>[0], prefix = '') => {
    const described = describeBurger(selection)
    const lines: { text: string; tone: 'add' | 'remove' | 'info' }[] = []
    for (const addon of described.added) lines.push({ text: `${prefix}+ ${addon}`, tone: 'add' })
    for (const removed of described.removed) {
      lines.push({
        text: `${prefix}sem ${removed.charAt(0).toLowerCase()}${removed.slice(1)}`,
        tone: 'remove',
      })
    }
    if (described.doneness) lines.push({ text: `${prefix}Ponto: ${described.doneness}`, tone: 'info' })
    return lines
  }

  switch (content.kind) {
    case 'burger':
      return burgerLines(content.burger)
    case 'combo':
      return [
        { text: describeBurger(content.burger).name, tone: 'info' as const },
        ...burgerLines(content.burger, '   '),
        { text: describeFries(content.fries), tone: 'info' as const },
        { text: describeDrink(content.drink), tone: 'info' as const },
      ]
    default:
      return []
  }
}

export function CartItemRow({
  item,
  onIncrement,
  onDecrement,
  onRemove,
}: {
  item: CartItemModel
  onIncrement: (key: string) => void
  onDecrement: (key: string) => void
  onRemove: (key: string) => void
}) {
  // Defesa contra um item que saiu do catálogo depois de entrar no carrinho.
  if (!isContentValid(item.content)) {
    return (
      <li className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-coal-2 p-4">
        <p className="text-[0.82rem] text-ash">Este item não está mais disponível no cardápio.</p>
        <IconButton label="Remover item indisponível" variant="danger" size="sm" onClick={() => onRemove(item.key)}>
          <Trash2 size={15} aria-hidden="true" />
        </IconButton>
      </li>
    )
  }

  const title = lineTitle(item.content)
  const details = detailLines(item.content)

  return (
    <li className="flex gap-3.5 rounded-xl border border-white/8 bg-coal-2 p-3.5">
      {/* Miniatura */}
      <div className="relative size-20 shrink-0 overflow-hidden rounded-lg bg-coal">
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_40%,rgba(232,117,50,0.2),transparent_65%)]"
        />
        <div className="absolute inset-0 flex items-center justify-center p-2">
          <ProductThumb content={item.content} className="h-full w-full" />
        </div>
      </div>

      {/* Conteúdo */}
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="truncate text-[0.95rem] leading-tight">{title}</h3>
            <p className="tnum mt-0.5 text-[0.72rem] text-ash">
              {formatBRL(lineUnitPrice(item.content))} por unidade
            </p>
          </div>
          <IconButton
            label={`Remover ${title} do carrinho`}
            variant="danger"
            size="sm"
            onClick={() => onRemove(item.key)}
          >
            <Trash2 size={14} aria-hidden="true" />
          </IconButton>
        </div>

        {details.length > 0 && (
          <ul className="flex flex-col gap-0.5 text-[0.72rem] leading-snug whitespace-pre">
            {details.map((detail, index) => (
              <li
                key={`${detail.text}-${index}`}
                className={detail.tone === 'add' ? 'text-ember-soft' : 'text-ash'}
              >
                {detail.text}
              </li>
            ))}
          </ul>
        )}

        <div className="mt-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-1.5">
            <IconButton
              label={item.quantity > 1 ? `Diminuir quantidade de ${title}` : `Remover ${title}`}
              size="sm"
              onClick={() => onDecrement(item.key)}
            >
              <Minus size={14} aria-hidden="true" />
            </IconButton>
            <output aria-label={`Quantidade de ${title}`} className="tnum w-7 text-center text-[0.95rem] font-bold">
              {item.quantity}
            </output>
            <IconButton
              label={`Aumentar quantidade de ${title}`}
              size="sm"
              onClick={() => onIncrement(item.key)}
              disabled={item.quantity >= 20}
            >
              <Plus size={14} aria-hidden="true" />
            </IconButton>
          </div>
          <span className="tnum text-[1rem] font-extrabold text-cream">{formatBRL(lineTotal(item))}</span>
        </div>
      </div>
    </li>
  )
}
