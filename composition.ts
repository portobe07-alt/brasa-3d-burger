import type { IngredientKind } from './product'

/**
 * Uma peça física da montagem, já resolvida.
 *
 * É a ponte entre os dados comerciais (produto + personalização) e a cena 3D:
 * a composição é SEMPRE derivada dos dados, nunca montada à mão em um
 * componente. Isso garante que o que aparece na tela, o preço e o carrinho
 * descrevam exatamente a mesma coisa.
 */
export interface LayerInstance {
  /** Identificador único desta peça na pilha (estável entre renderizações). */
  id: string
  /** Ingrediente de origem no catálogo, ou `null` se veio de um adicional. */
  ingredientId: string | null
  /** Adicional de origem, quando aplicável. */
  addonId: string | null
  name: string
  kind: IngredientKind
  /** Semente determinística: a mesma peça é sempre gerada igual. */
  seed: string
  /** `true` quando a peça foi inserida por um adicional. */
  isAddon: boolean
  /**
   * Variante de construção da malha, quando a peça não é a forma padrão do
   * tipo. Usada pelo corte transversal da carne na escolha do ponto.
   */
  variant?: string
}

/** Peça posicionada na pilha, pronta para virar malha. */
export interface PlacedLayer extends LayerInstance {
  /** Espessura ocupada no eixo vertical, em unidades de cena. */
  thickness: number
  /** Altura do centro da peça, medida a partir da base da pilha. */
  y: number
  /** Índice na pilha, de baixo para cima. */
  index: number
}

export interface Composition {
  layers: PlacedLayer[]
  /** Altura total da pilha montada, em unidades de cena. */
  height: number
  /** Maior raio entre as peças — usado para enquadrar a cena. */
  radius: number
  /**
   * Quanto a cena pode AMPLIAR esta composição para preencher o quadro.
   * O padrão é 1 (só reduz). A vista exclusiva da carne usa um valor maior,
   * porque uma peça sozinha ficaria pequena demais no enquadramento pensado
   * para um hambúrguer inteiro.
   */
  fitUpscale?: number
}
