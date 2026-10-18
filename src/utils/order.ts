
import { STORE } from '../data/store'
import type { BurgerSelection, CartItem, CartLineContent, FulfillmentMode } from '../types/cart'
import type { AccessContext } from './accessContext'
import { formatBRL } from './currency'
import {
  cartSubtotal,
  describeBurger,
  describeDrink,
  describeFries,
  lineTitle,
  lineTotal,
  lineUnitPrice,
} from './pricing'

/**
 * Montagem do pedido.
 *
 * Esta é a fronteira preparada para a integração futura. O payload abaixo é um
 * objeto completo e estável: basta enviá-lo para `STORE.orderApiUrl`, ou
 * transformá-lo em texto com `formatOrderAsText` para o WhatsApp.
 *
 * Nada aqui envia nada. Enquanto não houver canal configurado
 * (`data/store.ts`), o checkout permanece em modo demonstrativo.
 */

export interface OrderLine {
  /** Tipo da linha: hambúrguer, batata, bebida ou combo. */
  kind: CartLineContent['kind']
  /** Nome principal exibido ao cliente. */
  title: string
  quantity: number
  /** Preço de uma unidade, em centavos. */
  unitPrice: number
  /** Total da linha, em centavos. */
  lineTotal: number
  /** Detalhes da linha, já em texto: adicionais, retiradas, ponto, componentes. */
  details: string[]
}

export interface OrderPayload {
  /** Versão do formato, para a integração poder evoluir sem ambiguidade. */
  version: 2
  /**
   * Mesa identificada pela URL (QR Code ou NFC), quando houver.
   * É identificação, não confirmação: não abre comanda nem avisa a cozinha.
   */
  table: string | null
  fulfillment: FulfillmentMode
  notes: string
  lines: OrderLine[]
  /** Soma das linhas, em centavos. */
  subtotal: number
  /** Taxa de entrega, quando configurada. `null` = não configurada. */
  deliveryFee: number | null
  /**
   * Total conhecido. Igual ao subtotal quando não há taxa configurada — o
   * sistema não estima valores que não possui.
   */
  total: number
}

/** Descreve um hambúrguer em linhas de detalhe, na ordem em que o cliente leria. */
function burgerDetails(selection: BurgerSelection, prefix = ''): string[] {
  const described = describeBurger(selection)
  const details: string[] = []
  for (const addon of described.added) details.push(`${prefix}+ ${addon}`)
  for (const removed of described.removed) {
    details.push(`${prefix}- sem ${removed.charAt(0).toLowerCase()}${removed.slice(1)}`)
  }
  if (described.doneness) details.push(`${prefix}Ponto: ${described.doneness}`)
  return details
}

/** Monta os detalhes de uma linha a partir do seu conteúdo. */
function contentDetails(content: CartLineContent): string[] {
  switch (content.kind) {
    case 'burger':
      return burgerDetails(content.burger)
    case 'fries':
    case 'drink':
      return []
    case 'combo':
      return [
        describeBurger(content.burger).name,
        ...burgerDetails(content.burger, '   '),
        describeFries(content.fries),
        describeDrink(content.drink),
      ]
    default:
      return []
  }
}

export function buildOrderPayload(
  items: readonly CartItem[],
  fulfillment: FulfillmentMode,
  notes: string,
  access: AccessContext = { table: null, origin: 'link' },
): OrderPayload {
  const lines: OrderLine[] = items.map((item) => ({
    kind: item.content.kind,
    title: lineTitle(item.content),
    quantity: item.quantity,
    unitPrice: lineUnitPrice(item.content),
    lineTotal: lineTotal(item),
    details: contentDetails(item.content),
  }))

  const subtotal = cartSubtotal(items)
  const deliveryFee = fulfillment === 'delivery' ? STORE.deliveryFee : null

  return {
    version: 2,
    table: access.table,
    fulfillment,
    notes: notes.trim(),
    lines,
    subtotal,
    deliveryFee,
    total: subtotal + (deliveryFee ?? 0),
  }
}

/** Resumo em texto puro do pedido. Serve para o WhatsApp e para a área de transferência. */
export function formatOrderAsText(payload: OrderPayload): string {
  const parts: string[] = [`*${STORE.name}* — Pedido`, '']

  for (const line of payload.lines) {
    parts.push(`${line.quantity}x ${line.title} — ${formatBRL(line.lineTotal)}`)
    for (const detail of line.details) parts.push(`   ${detail}`)
  }

  parts.push('', `Subtotal: ${formatBRL(payload.subtotal)}`)
  if (payload.deliveryFee !== null) parts.push(`Entrega: ${formatBRL(payload.deliveryFee)}`)
  parts.push(`Total: ${formatBRL(payload.total)}`)
  parts.push('', `Retirada ou entrega: ${payload.fulfillment === 'pickup' ? 'Retirada' : 'Entrega'}`)
  if (payload.table) parts.push(`Mesa: ${payload.table}`)
  if (payload.notes) parts.push(`Observações: ${payload.notes}`)

  return parts.join('\n')
}

/**
 * Monta o link do WhatsApp. Retorna `null` quando o número não está
 * configurado — e nesse caso a interface não oferece o botão.
 */
export function buildWhatsAppUrl(payload: OrderPayload): string | null {
  if (!STORE.whatsappNumber) return null
  return `https://wa.me/${STORE.whatsappNumber}?text=${encodeURIComponent(formatOrderAsText(payload))}`
}
