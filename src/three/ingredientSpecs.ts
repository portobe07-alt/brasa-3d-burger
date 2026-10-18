import type { IngredientKind } from '../types/product'

/**
 * Propriedades físicas e de material de cada ingrediente na cena 3D.
 *
 * As unidades de cena foram escolhidas com o raio do pão valendo 1.0, de modo
 * que um hambúrguer montado tenha pouco mais de 1 unidade de altura. A câmera
 * e os limites de zoom em `BurgerScene` partem dessa escala.
 *
 * `thickness` é o espaço que a peça ocupa na vertical — é o que define o
 * empilhamento. Como a composição é recalculada a partir destes valores, um
 * adicional entra na pilha e todas as peças acima dele sobem sozinhas.
 */
export interface IngredientSpec {
  /** Espessura ocupada no empilhamento. */
  thickness: number
  /** Raio da peça. Valores acima de 1.0 criam a saliência típica de queijo e alface. */
  radius: number
  /** Cor base, em sRGB. */
  color: string
  /** Rugosidade do material: 0 espelhado, 1 totalmente fosco. */
  roughness: number
  /** Quanto a peça invade a de baixo, para as camadas se tocarem de verdade. */
  overlap: number
  /** Intensidade do verniz; usado em molhos e queijo derretido. */
  sheen?: number
}

export const INGREDIENT_SPECS: Record<IngredientKind, IngredientSpec> = {
  'bun-bottom': { thickness: 0.27, radius: 1.0, color: '#b9772f', roughness: 0.84, overlap: 0 },
  'bun-top': { thickness: 0.52, radius: 1.0, color: '#c07d31', roughness: 0.8, overlap: 0.02 },

  'sauce-house': { thickness: 0.05, radius: 0.92, color: '#d8b24e', roughness: 0.28, overlap: 0.02, sheen: 0.8 },
  'sauce-bbq': { thickness: 0.05, radius: 0.92, color: '#6b2c12', roughness: 0.3, overlap: 0.02, sheen: 0.55 },
  'sauce-garlic': { thickness: 0.05, radius: 0.92, color: '#ddd3b8', roughness: 0.3, overlap: 0.02, sheen: 0.7 },
  'sauce-mayo-herbs': { thickness: 0.05, radius: 0.92, color: '#d6cb9f', roughness: 0.34, overlap: 0.02, sheen: 0.6 },

  lettuce: { thickness: 0.1, radius: 1.09, color: '#538f2f', roughness: 0.58, overlap: 0.03 },
  arugula: { thickness: 0.09, radius: 1.1, color: '#3f7d33', roughness: 0.6, overlap: 0.03 },
  tomato: { thickness: 0.11, radius: 1.02, color: '#c7331f', roughness: 0.42, overlap: 0.02, sheen: 0.4 },

  'patty-beef': { thickness: 0.27, radius: 0.97, color: '#5c3719', roughness: 0.76, overlap: 0.01 },
  'patty-smash': { thickness: 0.17, radius: 1.03, color: '#633b1b', roughness: 0.74, overlap: 0.01 },
  'patty-chicken': { thickness: 0.26, radius: 1.07, color: '#b9742a', roughness: 0.78, overlap: 0.01 },

  'cheese-cheddar': { thickness: 0.06, radius: 1.08, color: '#eb9a1c', roughness: 0.34, overlap: 0.008, sheen: 0.9 },
  'cheese-prato': { thickness: 0.06, radius: 1.08, color: '#f2c85a', roughness: 0.36, overlap: 0.012, sheen: 0.85 },
  'cheese-blue': { thickness: 0.13, radius: 0.9, color: '#ece6d4', roughness: 0.62, overlap: 0.02 },

  bacon: { thickness: 0.075, radius: 1.02, color: '#8f3119', roughness: 0.5, overlap: 0.02, sheen: 0.6 },
  'onion-raw': { thickness: 0.055, radius: 0.86, color: '#f3eee4', roughness: 0.5, overlap: 0.02 },
  'onion-caramelized': { thickness: 0.08, radius: 0.9, color: '#a9661f', roughness: 0.44, overlap: 0.02, sheen: 0.7 },
}

export function specFor(kind: IngredientKind): IngredientSpec {
  return INGREDIENT_SPECS[kind]
}

/** Agrupamentos usados pelas regras de montagem dos adicionais. */
export const PATTY_KINDS: IngredientKind[] = ['patty-beef', 'patty-smash', 'patty-chicken']
export const CHEESE_KINDS: IngredientKind[] = ['cheese-cheddar', 'cheese-prato', 'cheese-blue']

export function isPatty(kind: IngredientKind): boolean {
  return PATTY_KINDS.includes(kind)
}
export function isCheese(kind: IngredientKind): boolean {
  return CHEESE_KINDS.includes(kind)
}
