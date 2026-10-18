/**
 * Tipos dos acompanhamentos e bebidas.
 *
 * Como no resto do projeto, todos os preços são inteiros em CENTAVOS. A
 * formatação em reais acontece só na borda da interface.
 */

export type FriesSize = 'P' | 'M' | 'G'
export type FriesVariantId = 'tradicional' | 'queijo' | 'queijo-bacon'

export interface FriesVariant {
  id: FriesVariantId
  name: string
  description: string
  /**
   * Acréscimo sobre o preço da batata tradicional do MESMO tamanho, em
   * centavos. A regra comercial é essa — não uma tabela solta por variação —,
   * então mudar o preço base de um tamanho propaga corretamente.
   */
  surcharge: number
}

export type DrinkCategory = 'agua' | 'refrigerante' | 'suco'
export type DrinkId =
  | 'agua'
  | 'coca-cola'
  | 'coca-cola-zero'
  | 'guarana-antarctica'
  | 'fanta-laranja'
  | 'suco-laranja'
  | 'suco-uva'

export interface Drink {
  id: DrinkId
  name: string
  category: DrinkCategory
  /** Preço em centavos. */
  price: number
  /** Cor do líquido, usada na ilustração genérica. */
  liquidColor: string
  /** Recipiente desenhado na ilustração. */
  vessel: 'garrafa' | 'lata' | 'copo'
}
