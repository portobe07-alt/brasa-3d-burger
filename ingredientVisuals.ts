import type { IngredientKind } from '../types/product'

/**
 * Paleta e geometria de cada tipo de ingrediente.
 *
 * Alimenta a ilustração vetorial em camadas e os marcadores de cor da lista de
 * ingredientes. É uma representação ilustrativa, não uma fotografia e não um
 * modelo 3D — a interface sempre deixa isso explícito.
 *
 * `width` e `height` estão no sistema de coordenadas da ilustração, cuja
 * largura útil é 340 e cujo pão tem 240 de largura.
 */
export interface IngredientVisual {
  /** Cor principal, usada também como marcador na lista. */
  color: string
  /** Tom mais claro, para luz e volume. */
  light: string
  /** Tom mais escuro, para sombra e contorno. */
  dark: string
  /** Largura da camada na ilustração. */
  width: number
  /** Altura da camada na ilustração. */
  height: number
  /** Quanto a camada invade a de baixo, para as peças se tocarem. */
  overlap: number
}

export const INGREDIENT_VISUALS: Record<IngredientKind, IngredientVisual> = {
  'bun-bottom': { color: '#C98A4B', light: '#E3AE73', dark: '#8A5425', width: 240, height: 40, overlap: 0 },
  'bun-top': { color: '#D2913F', light: '#EFBC78', dark: '#90581F', width: 242, height: 78, overlap: 2 },
  'sauce-house': { color: '#F0D27A', light: '#F8E6AE', dark: '#C9A240', width: 226, height: 13, overlap: 4 },
  'sauce-bbq': { color: '#7A2E12', light: '#A9471F', dark: '#4A1A08', width: 226, height: 13, overlap: 4 },
  'sauce-garlic': { color: '#F4EDD6', light: '#FFFBEF', dark: '#CDC2A2', width: 226, height: 13, overlap: 4 },
  'sauce-mayo-herbs': { color: '#EFE6C4', light: '#FAF4DD', dark: '#B9AE83', width: 226, height: 13, overlap: 4 },
  lettuce: { color: '#5FA03C', light: '#8CC95F', dark: '#3A6B22', width: 268, height: 24, overlap: 5 },
  tomato: { color: '#CE3B2A', light: '#E9644F', dark: '#8E2217', width: 232, height: 20, overlap: 5 },
  arugula: { color: '#3F7D33', light: '#6AAD54', dark: '#27511F', width: 262, height: 22, overlap: 6 },
  'patty-beef': { color: '#58301A', light: '#7B4524', dark: '#331A0C', width: 234, height: 34, overlap: 3 },
  'patty-smash': { color: '#5C3318', light: '#875127', dark: '#361B09', width: 244, height: 21, overlap: 3 },
  'patty-chicken': { color: '#C07A2C', light: '#E8A94F', dark: '#8A5118', width: 240, height: 36, overlap: 3 },
  'cheese-cheddar': { color: '#F0A028', light: '#FFC256', dark: '#C0761A', width: 270, height: 17, overlap: 3 },
  'cheese-prato': { color: '#F4CE6A', light: '#FDE49B', dark: '#C4A245', width: 270, height: 17, overlap: 3 },
  'cheese-blue': { color: '#EDE7D6', light: '#FFFBF0', dark: '#B6AE98', width: 228, height: 20, overlap: 4 },
  bacon: { color: '#9E3A22', light: '#C85C38', dark: '#66220F', width: 246, height: 17, overlap: 5 },
  'onion-raw': { color: '#F2EDE2', light: '#FFFFFF', dark: '#C3BCAD', width: 222, height: 12, overlap: 4 },
  'onion-caramelized': { color: '#B9762C', light: '#DC9C4C', dark: '#804D16', width: 232, height: 16, overlap: 4 },
}

export function visualFor(kind: IngredientKind): IngredientVisual {
  return INGREDIENT_VISUALS[kind]
}
