import type { DrinkId, FriesSize, FriesVariantId } from './catalog'
import type { AddonId } from './product'

/** Escolhas do cliente sobre a montagem de um hambúrguer. */
export interface Customization {
  /** Ids de ingredientes que o cliente pediu para retirar. */
  removedIngredientIds: string[]
  /** Adicionais escolhidos. */
  addonIds: AddonId[]
}

/**
 * Ponto da carne.
 *
 * Só se aplica a hambúrgueres de carne bovina — o Crispy Chicken não oferece a
 * opção. Não altera o preço: é uma preferência de preparo.
 */
export type Doneness = 'mal-passado' | 'ao-ponto' | 'bem-passado'

export const DONENESS_OPTIONS: { id: Doneness; name: string; description: string }[] = [
  { id: 'mal-passado', name: 'Mal passado', description: 'Centro avermelhado e suculento.' },
  { id: 'ao-ponto', name: 'Ao ponto', description: 'Centro rosado, com transição suave.' },
  { id: 'bem-passado', name: 'Bem passado', description: 'Cozido por inteiro, sem rosado.' },
]

export const DEFAULT_DONENESS: Doneness = 'ao-ponto'

/** Um hambúrguer escolhido, com toda a sua personalização. */
export interface BurgerSelection {
  productId: string
  customization: Customization
  /** `null` quando o produto não oferece ponto da carne (frango). */
  doneness: Doneness | null
}

export interface FriesSelection {
  variantId: FriesVariantId
  size: FriesSize
}

export interface DrinkSelection {
  drinkId: DrinkId
}

/**
 * Conteúdo de uma linha do carrinho.
 *
 * União discriminada: o carrinho carrega hambúrgueres, batatas, bebidas e
 * combos sem que nenhum deles precise fingir ser outro. `utils/pricing.ts`
 * resolve o preço de cada variação em um único lugar.
 */
export type CartLineContent =
  | { kind: 'burger'; burger: BurgerSelection }
  | { kind: 'fries'; fries: FriesSelection }
  | { kind: 'drink'; drink: DrinkSelection }
  | { kind: 'combo'; burger: BurgerSelection; fries: FriesSelection; drink: DrinkSelection }

export type CartLineKind = CartLineContent['kind']

export interface CartItem {
  /**
   * Chave derivada de todo o conteúdo da linha. Dois itens iguais em tudo se
   * somam; qualquer diferença de personalização, tamanho, ponto da carne ou
   * componente de combo cria uma linha separada.
   */
  key: string
  quantity: number
  content: CartLineContent
}

export type FulfillmentMode = 'pickup' | 'delivery'

export interface Cart {
  items: CartItem[]
}
