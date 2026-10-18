import type { Drink, DrinkCategory, DrinkId } from '../types/catalog'

/**
 * Bebidas.
 *
 * Os preços seguem a categoria: água R$ 3,50, refrigerantes R$ 5,50 e sucos
 * R$ 7,50. Nenhum sabor, tamanho ou preço além dos informados foi criado.
 *
 * Sobre a representação visual: as ilustrações são **genéricas** — garrafa,
 * lata ou copo com a cor da bebida e o nome escrito. Não reproduzem rótulos,
 * logotipos nem embalagens de marca. Inventar uma embalagem parecida com a de
 * um fabricante confundiria o cliente sobre o que ele está comprando; se o
 * restaurante quiser mostrar as embalagens reais, deve usar as próprias fotos.
 */

/** Preço por categoria, em centavos. */
export const DRINK_CATEGORY_PRICE: Record<DrinkCategory, number> = {
  agua: 350,
  refrigerante: 550,
  suco: 750,
}

export const DRINK_CATEGORY_LABEL: Record<DrinkCategory, string> = {
  agua: 'Água',
  refrigerante: 'Refrigerantes',
  suco: 'Sucos',
}

export const DRINKS: Drink[] = [
  {
    id: 'agua',
    name: 'Água',
    category: 'agua',
    price: DRINK_CATEGORY_PRICE.agua,
    liquidColor: '#cfe7f2',
    vessel: 'garrafa',
  },
  {
    id: 'coca-cola',
    name: 'Coca-Cola',
    category: 'refrigerante',
    price: DRINK_CATEGORY_PRICE.refrigerante,
    liquidColor: '#4a2112',
    vessel: 'lata',
  },
  {
    id: 'coca-cola-zero',
    name: 'Coca-Cola Zero',
    category: 'refrigerante',
    price: DRINK_CATEGORY_PRICE.refrigerante,
    liquidColor: '#3c1b10',
    vessel: 'lata',
  },
  {
    id: 'guarana-antarctica',
    name: 'Guaraná Antarctica',
    category: 'refrigerante',
    price: DRINK_CATEGORY_PRICE.refrigerante,
    liquidColor: '#c7883c',
    vessel: 'lata',
  },
  {
    id: 'fanta-laranja',
    name: 'Fanta Laranja',
    category: 'refrigerante',
    price: DRINK_CATEGORY_PRICE.refrigerante,
    liquidColor: '#e8761a',
    vessel: 'lata',
  },
  {
    id: 'suco-laranja',
    name: 'Suco de laranja',
    category: 'suco',
    price: DRINK_CATEGORY_PRICE.suco,
    liquidColor: '#eda023',
    vessel: 'copo',
  },
  {
    id: 'suco-uva',
    name: 'Suco de uva',
    category: 'suco',
    price: DRINK_CATEGORY_PRICE.suco,
    liquidColor: '#6b2560',
    vessel: 'copo',
  },
]

const DRINK_BY_ID = new Map<DrinkId, Drink>(DRINKS.map((drink) => [drink.id, drink]))

export function getDrink(id: DrinkId): Drink | undefined {
  return DRINK_BY_ID.get(id)
}

/** Bebidas agrupadas por categoria, na ordem de exibição. */
export const DRINKS_BY_CATEGORY: { category: DrinkCategory; drinks: Drink[] }[] = (
  ['agua', 'refrigerante', 'suco'] as DrinkCategory[]
).map((category) => ({ category, drinks: DRINKS.filter((drink) => drink.category === category) }))
