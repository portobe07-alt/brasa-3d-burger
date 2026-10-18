/**
 * Tipos do catálogo.
 *
 * Todos os preços são armazenados em CENTAVOS (número inteiro) para evitar
 * erros de arredondamento de ponto flutuante. A formatação em reais acontece
 * apenas na borda da interface, em `utils/currency.ts`.
 */

/**
 * Natureza visual de um ingrediente.
 *
 * Usado por dois consumidores:
 *  - a ilustração vetorial em camadas (`BurgerIllustration`), que desenha cada
 *    tipo com forma, cor e textura próprias;
 *  - a lista de ingredientes, que escolhe o marcador de cor.
 *
 * Não tem relação com o modelo GLB: um modelo 3D real traz a própria geometria.
 */
export type IngredientKind =
  | 'bun-bottom'
  | 'bun-top'
  | 'sauce-house'
  | 'sauce-bbq'
  | 'sauce-garlic'
  | 'sauce-mayo-herbs'
  | 'lettuce'
  | 'tomato'
  | 'arugula'
  | 'patty-beef'
  | 'patty-smash'
  | 'patty-chicken'
  | 'cheese-cheddar'
  | 'cheese-prato'
  | 'cheese-blue'
  | 'bacon'
  | 'onion-raw'
  | 'onion-caramelized'

export interface Ingredient {
  /** Identificador estável dentro do produto. Usado nas personalizações. */
  id: string
  /** Nome exibido ao cliente. */
  name: string
  kind: IngredientKind
  /**
   * Se o cliente pode pedir a retirada deste ingrediente.
   * Pães e a proteína principal não são removíveis.
   */
  removable: boolean
}

export type AddonId = 'extra-bacon' | 'extra-cheddar' | 'extra-beef'

/**
 * Como um adicional entra na montagem 3D.
 *
 * Sem isto, um adicional só mexeria no preço. Com isto, a peça correspondente
 * é realmente inserida na pilha e todas as camadas acima sobem.
 */
export interface AddonVisual {
  /** Tipo de ingrediente que o adicional insere. */
  kind: IngredientKind
  /** Quantas peças são inseridas. */
  count: number
  /**
   * A peça entra logo acima da camada mais alta cujo tipo esteja nesta lista.
   * Não havendo nenhuma, entra logo abaixo do pão superior.
   */
  anchorKinds: IngredientKind[]
  /** Ordem de inserção quando vários adicionais são escolhidos ao mesmo tempo. */
  insertOrder: number
}

export interface Addon {
  id: AddonId
  name: string
  description: string
  /** Acréscimo em centavos. */
  price: number
  /**
   * Representação visual na cena 3D. `null` quando o adicional ainda não tem
   * geometria correspondente — nesse caso ele altera preço e descrição do
   * pedido, e a interface avisa que o modelo não muda.
   */
  visual: AddonVisual | null
}

/** Como a visualização principal do produto deve ser apresentada. */
export type ProductAvailability = 'available' | 'sold-out' | 'coming-soon'

export interface Product {
  id: string
  slug: string
  name: string
  /** Chamada curta usada nos cards do cardápio. */
  tagline: string
  /** Descrição completa, exibida na tela de detalhes. */
  description: string
  /** Preço base em centavos. */
  price: number
  /** Peso da proteína, quando aplicável (ex.: "150 g"). */
  proteinWeight: string | null
  /** Ingredientes na ordem real de montagem, de baixo para cima. */
  ingredients: Ingredient[]
  /**
   * Fotografia do produto em `public/images/`, quando houver.
   * `null` significa que nenhuma foto foi fornecida; os cards e a miniatura do
   * carrinho recaem sobre a ilustração vetorial em camadas.
   *
   * Não substitui o visualizador 3D: a tela de detalhes gera a geometria
   * proceduralmente e não depende de arquivo nenhum.
   */
  imagePath: string | null
  /**
   * Se o produto oferece escolha de ponto da carne.
   * `false` para proteínas que não têm ponto, como o filé de frango empanado.
   */
  supportsDoneness: boolean
  availability: ProductAvailability
  addonIds: AddonId[]
}
