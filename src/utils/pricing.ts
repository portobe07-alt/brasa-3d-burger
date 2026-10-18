import { resolveAddons } from '../data/addons'
import { getDrink } from '../data/drinks'
import { friesLabel, friesPrice, getFriesVariant } from '../data/sides'
import { getProduct } from '../data/products'
import type {
  BurgerSelection,
  CartItem,
  CartLineContent,
  Customization,
  DrinkSelection,
  FriesSelection,
} from '../types/cart'
import type { Product } from '../types/product'

/**
 * Regras de preço.
 *
 * Toda conta sai daqui, a partir dos dados estruturados da linha. Nenhum
 * componente calcula preço por conta própria e nenhum valor é escrito direto
 * na interface.
 *
 * Duas regras comerciais explícitas:
 *  - retirar ingredientes NÃO gera desconto: é preferência de montagem;
 *  - o ponto da carne NÃO altera o preço: é preferência de preparo.
 */

export const EMPTY_CUSTOMIZATION: Customization = {
  removedIngredientIds: [],
  addonIds: [],
}

/* -------------------------------------------------------------------------- */
/*  Preço por componente                                                       */
/* -------------------------------------------------------------------------- */

/** Soma dos adicionais escolhidos, em centavos. */
export function addonsTotal(customization: Customization): number {
  return resolveAddons(customization.addonIds).reduce((sum, addon) => sum + addon.price, 0)
}

/** Preço de uma unidade do produto já personalizada, em centavos. */
export function unitPrice(product: Product, customization: Customization): number {
  return product.price + addonsTotal(customization)
}

export function burgerPrice(selection: BurgerSelection): number {
  const product = getProduct(selection.productId)
  if (!product) return 0
  return unitPrice(product, selection.customization)
}

export function friesSelectionPrice(selection: FriesSelection): number {
  return friesPrice(selection.variantId, selection.size)
}

export function drinkSelectionPrice(selection: DrinkSelection): number {
  return getDrink(selection.drinkId)?.price ?? 0
}

/**
 * Preço de uma linha, por unidade.
 *
 * O combo é, por enquanto, a SOMA dos itens escolhidos. Nenhum desconto foi
 * informado, então nenhum é inventado. Para configurar um preço próprio de
 * combo no futuro, o único lugar a mudar é aqui — ver `COMBO_DISCOUNT`.
 */
export function lineUnitPrice(content: CartLineContent): number {
  switch (content.kind) {
    case 'burger':
      return burgerPrice(content.burger)
    case 'fries':
      return friesSelectionPrice(content.fries)
    case 'drink':
      return drinkSelectionPrice(content.drink)
    case 'combo':
      return (
        burgerPrice(content.burger) +
        friesSelectionPrice(content.fries) +
        drinkSelectionPrice(content.drink) -
        COMBO_DISCOUNT
      )
    default:
      return 0
  }
}

/**
 * Desconto do combo, em centavos.
 *
 * Zero de propósito: nenhum valor promocional foi definido, e anunciar um
 * desconto que não existe enganaria o cliente. Quando o restaurante definir a
 * política, basta alterar este número — a interface já mostra a economia
 * automaticamente quando ele for maior que zero.
 */
export const COMBO_DISCOUNT = 0

/** Preço total de uma linha (unidade × quantidade). */
export function lineTotal(item: CartItem): number {
  return lineUnitPrice(item.content) * item.quantity
}

/** Soma de todas as linhas do carrinho, em centavos. */
export function cartSubtotal(items: readonly CartItem[]): number {
  return items.reduce((sum, item) => sum + lineTotal(item), 0)
}

/** Quantidade total de unidades no carrinho (usada no contador do cabeçalho). */
export function cartItemCount(items: readonly CartItem[]): number {
  return items.reduce((sum, item) => sum + item.quantity, 0)
}

/* -------------------------------------------------------------------------- */
/*  Identidade da linha                                                        */
/* -------------------------------------------------------------------------- */

/**
 * Normaliza uma personalização para que a chave da linha seja estável:
 * listas ordenadas e sem duplicatas. Duas escolhas equivalentes feitas em
 * ordens diferentes produzem a mesma chave e, portanto, a mesma linha.
 */
export function normalizeCustomization(customization: Customization): Customization {
  return {
    removedIngredientIds: [...new Set(customization.removedIngredientIds)].sort(),
    addonIds: [...new Set(customization.addonIds)].sort(),
  }
}

export function normalizeBurger(selection: BurgerSelection): BurgerSelection {
  return { ...selection, customization: normalizeCustomization(selection.customization) }
}

/** Normaliza o conteúdo inteiro de uma linha. */
export function normalizeContent(content: CartLineContent): CartLineContent {
  switch (content.kind) {
    case 'burger':
      return { kind: 'burger', burger: normalizeBurger(content.burger) }
    case 'combo':
      return { ...content, burger: normalizeBurger(content.burger) }
    default:
      return content
  }
}

function burgerKey(selection: BurgerSelection): string {
  const normalized = normalizeBurger(selection)
  return [
    normalized.productId,
    `-${normalized.customization.removedIngredientIds.join(',')}`,
    `+${normalized.customization.addonIds.join(',')}`,
    `@${normalized.doneness ?? 'na'}`,
  ].join('|')
}

/** Chave de identidade de uma linha do carrinho. */
export function buildCartKey(content: CartLineContent): string {
  switch (content.kind) {
    case 'burger':
      return `burger::${burgerKey(content.burger)}`
    case 'fries':
      return `fries::${content.fries.variantId}:${content.fries.size}`
    case 'drink':
      return `drink::${content.drink.drinkId}`
    case 'combo':
      return `combo::${burgerKey(content.burger)}::${content.fries.variantId}:${content.fries.size}::${content.drink.drinkId}`
    default:
      return 'desconhecido'
  }
}

/* -------------------------------------------------------------------------- */
/*  Descrição em texto                                                         */
/* -------------------------------------------------------------------------- */

export function isCustomized(customization: Customization): boolean {
  return customization.removedIngredientIds.length > 0 || customization.addonIds.length > 0
}

export interface BurgerDescription {
  name: string
  added: string[]
  removed: string[]
  doneness: string | null
}

/**
 * Descreve um hambúrguer escolhido em frases curtas.
 * Os nomes vêm sempre do catálogo atual, não de texto guardado junto ao item.
 */
export function describeBurger(selection: BurgerSelection): BurgerDescription {
  const product = getProduct(selection.productId)
  const removed =
    product?.ingredients
      .filter((ingredient) => selection.customization.removedIngredientIds.includes(ingredient.id))
      .map((ingredient) => ingredient.name) ?? []
  const added = resolveAddons(selection.customization.addonIds).map((addon) => addon.name)
  const doneness =
    selection.doneness === null
      ? null
      : selection.doneness === 'mal-passado'
        ? 'Mal passado'
        : selection.doneness === 'ao-ponto'
          ? 'Ao ponto'
          : 'Bem passado'
  return { name: product?.name ?? 'Produto indisponível', added, removed, doneness }
}

export function describeFries(selection: FriesSelection): string {
  return friesLabel(selection.variantId, selection.size)
}

export function describeDrink(selection: DrinkSelection): string {
  return getDrink(selection.drinkId)?.name ?? 'Bebida indisponível'
}

/** Nome principal exibido para uma linha do carrinho. */
export function lineTitle(content: CartLineContent): string {
  switch (content.kind) {
    case 'burger':
      return describeBurger(content.burger).name
    case 'fries':
      return describeFries(content.fries)
    case 'drink':
      return describeDrink(content.drink)
    case 'combo':
      return `Combo ${describeBurger(content.burger).name}`
    default:
      return 'Item'
  }
}

/** `true` quando a linha ainda corresponde a produtos existentes no catálogo. */
export function isContentValid(content: CartLineContent): boolean {
  switch (content.kind) {
    case 'burger':
      return getProduct(content.burger.productId) !== undefined
    case 'fries':
      return getFriesVariant(content.fries.variantId) !== undefined
    case 'drink':
      return getDrink(content.drink.drinkId) !== undefined
    case 'combo':
      return (
        getProduct(content.burger.productId) !== undefined &&
        getFriesVariant(content.fries.variantId) !== undefined &&
        getDrink(content.drink.drinkId) !== undefined
      )
    default:
      return false
  }
}
