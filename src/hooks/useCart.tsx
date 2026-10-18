import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type ReactNode,
} from 'react'
import { ADDONS } from '../data/addons'
import { DRINKS } from '../data/drinks'
import { FRIES_SIZES, FRIES_VARIANTS } from '../data/sides'
import { PRODUCTS } from '../data/products'
import type { AddonId, Product } from '../types/product'
import type { DrinkId, FriesSize, FriesVariantId } from '../types/catalog'
import type { BurgerSelection, Cart, CartItem, CartLineContent, Doneness } from '../types/cart'
import { buildCartKey, cartItemCount, cartSubtotal, isContentValid, normalizeContent } from '../utils/pricing'

/**
 * Carrinho da aplicação.
 *
 * Funciona inteiramente no navegador. O conteúdo é guardado em
 * `localStorage`, na chave abaixo, e contém apenas identificadores de produto,
 * adicional, ingrediente retirado, tamanho de batata, bebida, ponto da carne e
 * quantidades. **Nenhum dado pessoal é armazenado.** O carrinho não é
 * compartilhado entre dispositivos, não é enviado a servidor nenhum e some ao
 * limpar os dados do site.
 *
 * A chave mudou para `v2` quando o carrinho passou a aceitar batatas, bebidas
 * e combos: a estrutura antiga só sabia descrever hambúrgueres. Carrinhos
 * gravados na versão anterior são descartados em silêncio, e a chave antiga é
 * removida — é preferível a um carrinho meio lido com preços errados.
 */
const STORAGE_KEY = 'brasa3d.cart.v2'
const LEGACY_STORAGE_KEY = 'brasa3d.cart.v1'
const MAX_QUANTITY_PER_ITEM = 20

type CartAction =
  | { type: 'add'; content: CartLineContent; quantity: number }
  | { type: 'setQuantity'; key: string; quantity: number }
  | { type: 'remove'; key: string }
  | { type: 'clear' }

const EMPTY_CART: Cart = { items: [] }

function clampQuantity(value: number): number {
  if (!Number.isFinite(value)) return 1
  return Math.min(Math.max(Math.trunc(value), 1), MAX_QUANTITY_PER_ITEM)
}

function reducer(state: Cart, action: CartAction): Cart {
  switch (action.type) {
    case 'add': {
      const content = normalizeContent(action.content)
      const key = buildCartKey(content)
      const existing = state.items.find((item) => item.key === key)
      if (existing) {
        return {
          items: state.items.map((item) =>
            item.key === key ? { ...item, quantity: clampQuantity(item.quantity + action.quantity) } : item,
          ),
        }
      }
      return { items: [...state.items, { key, quantity: clampQuantity(action.quantity), content }] }
    }
    case 'setQuantity': {
      if (action.quantity < 1) {
        return { items: state.items.filter((item) => item.key !== action.key) }
      }
      return {
        items: state.items.map((item) =>
          item.key === action.key ? { ...item, quantity: clampQuantity(action.quantity) } : item,
        ),
      }
    }
    case 'remove':
      return { items: state.items.filter((item) => item.key !== action.key) }
    case 'clear':
      return EMPTY_CART
    default:
      return state
  }
}

/* -------------------------------------------------------------------------- */
/*  Leitura do carrinho salvo                                                  */
/* -------------------------------------------------------------------------- */

const VALID_ADDON_IDS = new Set<string>(ADDONS.map((addon) => addon.id))
const VALID_DRINK_IDS = new Set<string>(DRINKS.map((drink) => drink.id))
const VALID_VARIANT_IDS = new Set<string>(FRIES_VARIANTS.map((variant) => variant.id))
const VALID_SIZES = new Set<string>(FRIES_SIZES.map((size) => size.id))
const VALID_DONENESS = new Set<string>(['mal-passado', 'ao-ponto', 'bem-passado'])

/** Reconstrói um hambúrguer salvo, descartando escolhas que não existem mais. */
function reviveBurger(raw: unknown): BurgerSelection | null {
  if (typeof raw !== 'object' || raw === null) return null
  const candidate = raw as BurgerSelection
  const product: Product | undefined = PRODUCTS.find((entry) => entry.id === candidate.productId)
  if (!product) return null

  const removedIngredientIds = Array.isArray(candidate.customization?.removedIngredientIds)
    ? candidate.customization.removedIngredientIds.filter((id: unknown) =>
        product.ingredients.some((ingredient) => ingredient.id === id && ingredient.removable),
      )
    : []

  const addonIds = Array.isArray(candidate.customization?.addonIds)
    ? (candidate.customization.addonIds.filter(
        (id: unknown) => typeof id === 'string' && VALID_ADDON_IDS.has(id) && product.addonIds.includes(id as AddonId),
      ) as AddonId[])
    : []

  // O ponto da carne só sobrevive se o produto ainda oferecer a opção.
  const doneness =
    product.supportsDoneness && typeof candidate.doneness === 'string' && VALID_DONENESS.has(candidate.doneness)
      ? (candidate.doneness as Doneness)
      : product.supportsDoneness
        ? 'ao-ponto'
        : null

  return { productId: product.id, customization: { removedIngredientIds, addonIds }, doneness }
}

function reviveFries(raw: unknown): { variantId: FriesVariantId; size: FriesSize } | null {
  if (typeof raw !== 'object' || raw === null) return null
  const { variantId, size } = raw as { variantId?: string; size?: string }
  if (typeof variantId !== 'string' || !VALID_VARIANT_IDS.has(variantId)) return null
  if (typeof size !== 'string' || !VALID_SIZES.has(size)) return null
  return { variantId: variantId as FriesVariantId, size: size as FriesSize }
}

function reviveDrink(raw: unknown): { drinkId: DrinkId } | null {
  if (typeof raw !== 'object' || raw === null) return null
  const { drinkId } = raw as { drinkId?: string }
  if (typeof drinkId !== 'string' || !VALID_DRINK_IDS.has(drinkId)) return null
  return { drinkId: drinkId as DrinkId }
}

function reviveContent(raw: unknown): CartLineContent | null {
  if (typeof raw !== 'object' || raw === null) return null
  const content = raw as CartLineContent

  switch (content.kind) {
    case 'burger': {
      const burger = reviveBurger(content.burger)
      return burger ? { kind: 'burger', burger } : null
    }
    case 'fries': {
      const fries = reviveFries(content.fries)
      return fries ? { kind: 'fries', fries } : null
    }
    case 'drink': {
      const drink = reviveDrink(content.drink)
      return drink ? { kind: 'drink', drink } : null
    }
    case 'combo': {
      const burger = reviveBurger(content.burger)
      const fries = reviveFries(content.fries)
      const drink = reviveDrink(content.drink)
      // Um combo incompleto não vira meio combo: é descartado inteiro.
      return burger && fries && drink ? { kind: 'combo', burger, fries, drink } : null
    }
    default:
      return null
  }
}

/**
 * Lê o carrinho guardado, descartando qualquer coisa que não corresponda mais
 * ao catálogo atual. Um produto removido do cardápio, um adicional que deixou
 * de existir ou um tamanho inválido simplesmente desaparecem, em vez de gerar
 * preços errados.
 */
function loadCart(): Cart {
  if (typeof window === 'undefined') return EMPTY_CART
  try {
    // A estrutura v1 não descrevia batatas, bebidas nem combos.
    window.localStorage.removeItem(LEGACY_STORAGE_KEY)

    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return EMPTY_CART

    const parsed: unknown = JSON.parse(raw)
    if (typeof parsed !== 'object' || parsed === null || !Array.isArray((parsed as Cart).items)) {
      return EMPTY_CART
    }

    const merged = new Map<string, CartItem>()
    for (const candidate of (parsed as Cart).items) {
      if (typeof candidate !== 'object' || candidate === null) continue
      const content = reviveContent((candidate as CartItem).content)
      if (!content || !isContentValid(content)) continue

      const normalized = normalizeContent(content)
      const key = buildCartKey(normalized)
      const quantity = clampQuantity(Number((candidate as CartItem).quantity))
      const existing = merged.get(key)
      merged.set(
        key,
        existing
          ? { ...existing, quantity: clampQuantity(existing.quantity + quantity) }
          : { key, quantity, content: normalized },
      )
    }
    return { items: [...merged.values()] }
  } catch (error) {
    console.warn('[Brasa3D] Carrinho salvo ignorado por estar ilegível:', error)
    return EMPTY_CART
  }
}

/* -------------------------------------------------------------------------- */
/*  Contexto                                                                   */
/* -------------------------------------------------------------------------- */

export interface CartApi {
  items: CartItem[]
  /** Quantidade total de unidades — alimenta o contador do cabeçalho. */
  count: number
  /** Soma de todas as linhas, em centavos. */
  subtotal: number
  add: (content: CartLineContent, quantity?: number) => void
  setQuantity: (key: string, quantity: number) => void
  increment: (key: string) => void
  decrement: (key: string) => void
  removeItem: (key: string) => void
  clear: () => void
}

const CartContext = createContext<CartApi | null>(null)

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, dispatch] = useReducer(reducer, undefined, loadCart)

  // Persistência: gravação a cada mudança. Falhas (modo privado, cota cheia)
  // são ignoradas — o carrinho continua funcionando em memória.
  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cart))
    } catch (error) {
      console.warn('[Brasa3D] Não foi possível salvar o carrinho localmente:', error)
    }
  }, [cart])

  const add = useCallback(
    (content: CartLineContent, quantity = 1) => dispatch({ type: 'add', content, quantity }),
    [],
  )
  const setQuantity = useCallback(
    (key: string, quantity: number) => dispatch({ type: 'setQuantity', key, quantity }),
    [],
  )
  const removeItem = useCallback((key: string) => dispatch({ type: 'remove', key }), [])
  const clear = useCallback(() => dispatch({ type: 'clear' }), [])

  const api = useMemo<CartApi>(() => {
    const findQuantity = (key: string) => cart.items.find((item) => item.key === key)?.quantity ?? 0
    return {
      items: cart.items,
      count: cartItemCount(cart.items),
      subtotal: cartSubtotal(cart.items),
      add,
      setQuantity,
      increment: (key) => setQuantity(key, findQuantity(key) + 1),
      decrement: (key) => setQuantity(key, findQuantity(key) - 1),
      removeItem,
      clear,
    }
  }, [cart.items, add, setQuantity, removeItem, clear])

  return <CartContext.Provider value={api}>{children}</CartContext.Provider>
}

export function useCart(): CartApi {
  const context = useContext(CartContext)
  if (!context) throw new Error('useCart precisa ser usado dentro de <CartProvider>.')
  return context
}
