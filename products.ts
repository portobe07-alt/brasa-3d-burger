import type { Product } from '../types/product'

/**
 * Catálogo BRASA 3D BURGER.
 *
 * Fonte única de verdade para nomes, descrições, preços e ingredientes.
 * Nenhum componente repete esses valores.
 *
 * A ordem de `ingredients` é a ordem real de montagem, de baixo para cima, e é
 * ela que define o empilhamento na cena 3D: `utils/composition.ts` converte
 * esta lista em peças posicionadas, e `three/builders.ts` gera a geometria de
 * cada tipo. Mudar a ordem aqui muda o hambúrguer na tela.
 *
 * Não há dependência de arquivos 3D externos: a geometria é procedural.
 */
export const PRODUCTS: Product[] = [
  {
    id: 'brasa-classico',
    slug: 'brasa-classico',
    name: 'Brasa Clássico',
    tagline: 'Carne artesanal de 150 g, cheddar derretido e molho da casa.',
    description:
      'Um hambúrguer artesanal suculento, preparado na chapa para criar uma crosta dourada, acompanhado de queijo cheddar derretido, vegetais frescos e molho especial da casa, servido em pão brioche macio e levemente tostado.',
    price: 2990,
    proteinWeight: '150 g',
    ingredients: [
      { id: 'bun-bottom', name: 'Pão brioche inferior tostado na manteiga', kind: 'bun-bottom', removable: false },
      {
        id: 'house-sauce',
        name: 'Molho especial da casa, à base de maionese, mostarda e temperos',
        kind: 'sauce-house',
        removable: true,
      },
      { id: 'lettuce', name: 'Alface americana crocante', kind: 'lettuce', removable: true },
      { id: 'tomato', name: 'Duas rodelas de tomate fresco', kind: 'tomato', removable: true },
      { id: 'patty', name: 'Hambúrguer bovino artesanal de 150 g', kind: 'patty-beef', removable: false },
      { id: 'cheddar', name: 'Uma fatia de queijo cheddar derretido', kind: 'cheese-cheddar', removable: true },
      {
        id: 'bun-top',
        name: 'Pão brioche superior dourado com sementes de gergelim',
        kind: 'bun-top',
        removable: false,
      },
    ],
    imagePath: null,
    supportsDoneness: true,
    availability: 'available',
    addonIds: ['extra-bacon', 'extra-cheddar', 'extra-beef'],
  },
  {
    id: 'double-melt',
    slug: 'double-melt',
    name: 'Double Melt',
    tagline: 'Dois smash burgers prensados com cheddar entre as camadas.',
    description:
      'Para quem leva hambúrguer a sério: duas carnes bovinas prensadas na chapa, com bordas crocantes, queijo cheddar derretido entre as camadas e molho cremoso especial. Tudo isso dentro de um pão brioche tostado.',
    price: 3690,
    proteinWeight: '2 × 100 g',
    ingredients: [
      { id: 'bun-bottom', name: 'Pão brioche inferior tostado', kind: 'bun-bottom', removable: false },
      { id: 'creamy-sauce', name: 'Molho especial cremoso', kind: 'sauce-house', removable: true },
      { id: 'patty-1', name: 'Primeiro smash burger bovino de 100 g', kind: 'patty-smash', removable: false },
      { id: 'cheddar-1', name: 'Uma fatia de cheddar derretido', kind: 'cheese-cheddar', removable: true },
      { id: 'patty-2', name: 'Segundo smash burger bovino de 100 g', kind: 'patty-smash', removable: false },
      { id: 'cheddar-2', name: 'Uma segunda fatia de cheddar', kind: 'cheese-cheddar', removable: true },
      { id: 'onion', name: 'Cebola branca finamente picada', kind: 'onion-raw', removable: true },
      { id: 'bun-top', name: 'Pão brioche superior com gergelim', kind: 'bun-top', removable: false },
    ],
    imagePath: null,
    supportsDoneness: true,
    availability: 'available',
    addonIds: ['extra-bacon', 'extra-cheddar', 'extra-beef'],
  },
  {
    id: 'bacon-bbq',
    slug: 'bacon-bbq',
    name: 'Bacon BBQ',
    tagline: 'Carne de 180 g, bacon crocante e barbecue defumado.',
    description:
      'Uma combinação intensa de sabores: hambúrguer bovino artesanal, cheddar cremoso, bacon crocante e molho barbecue defumado, com um toque adocicado que equilibra a suculência da carne. Finalizado com cebola caramelizada e pão brioche tostado.',
    price: 3890,
    proteinWeight: '180 g',
    ingredients: [
      { id: 'bun-bottom', name: 'Pão brioche inferior tostado', kind: 'bun-bottom', removable: false },
      { id: 'bbq-base', name: 'Molho barbecue defumado', kind: 'sauce-bbq', removable: true },
      { id: 'patty', name: 'Hambúrguer bovino artesanal de 180 g', kind: 'patty-beef', removable: false },
      { id: 'cheddar', name: 'Uma fatia de queijo cheddar', kind: 'cheese-cheddar', removable: true },
      { id: 'bacon', name: 'Duas fatias de bacon crocante', kind: 'bacon', removable: true },
      { id: 'onion', name: 'Cebola caramelizada em tiras', kind: 'onion-caramelized', removable: true },
      { id: 'bbq-top', name: 'Uma pequena porção adicional de barbecue', kind: 'sauce-bbq', removable: true },
      { id: 'bun-top', name: 'Pão brioche superior', kind: 'bun-top', removable: false },
    ],
    imagePath: null,
    supportsDoneness: true,
    availability: 'available',
    addonIds: ['extra-bacon', 'extra-cheddar', 'extra-beef'],
  },
  {
    id: 'crispy-chicken',
    slug: 'crispy-chicken',
    name: 'Crispy Chicken',
    tagline: 'Filé de frango empanado, queijo prato e molho de alho.',
    description:
      'Filé de frango empanado, dourado por fora e suculento por dentro, servido com alface americana, tomate fresco e molho cremoso levemente temperado. O pão brioche macio completa a experiência com um contraste irresistível de texturas.',
    price: 3290,
    proteinWeight: '160 g',
    ingredients: [
      { id: 'bun-bottom', name: 'Pão brioche inferior tostado', kind: 'bun-bottom', removable: false },
      { id: 'garlic-sauce', name: 'Molho cremoso de alho', kind: 'sauce-garlic', removable: true },
      { id: 'lettuce', name: 'Alface americana crocante', kind: 'lettuce', removable: true },
      {
        id: 'chicken',
        name: 'Filé de frango empanado de aproximadamente 160 g',
        kind: 'patty-chicken',
        removable: false,
      },
      { id: 'prato', name: 'Uma fatia de queijo prato derretido', kind: 'cheese-prato', removable: true },
      { id: 'tomato', name: 'Duas rodelas de tomate fresco', kind: 'tomato', removable: true },
      { id: 'garlic-sauce-top', name: 'Molho cremoso adicional', kind: 'sauce-garlic', removable: true },
      { id: 'bun-top', name: 'Pão brioche superior', kind: 'bun-top', removable: false },
    ],
    imagePath: null,
    // Filé de frango empanado não tem ponto de carne.
    supportsDoneness: false,
    availability: 'available',
    addonIds: ['extra-bacon', 'extra-cheddar'],
  },
  {
    id: 'blue-cheese-premium',
    slug: 'blue-cheese',
    name: 'Blue Cheese Premium',
    tagline: 'Carne de 180 g, gorgonzola, cebola caramelizada e rúcula.',
    description:
      'Uma criação sofisticada para os amantes de sabores marcantes. Hambúrguer bovino artesanal de 180 g, queijo azul de sabor intenso, cebola lentamente caramelizada e molho de maionese com ervas, envolvidos por um pão brioche dourado.',
    price: 4290,
    proteinWeight: '180 g',
    ingredients: [
      { id: 'bun-bottom', name: 'Pão brioche inferior tostado', kind: 'bun-bottom', removable: false },
      { id: 'herb-mayo', name: 'Maionese temperada com ervas', kind: 'sauce-mayo-herbs', removable: true },
      { id: 'patty', name: 'Hambúrguer bovino artesanal de 180 g', kind: 'patty-beef', removable: false },
      {
        id: 'blue-cheese',
        name: 'Queijo azul tipo gorgonzola, parcialmente derretido',
        kind: 'cheese-blue',
        removable: true,
      },
      { id: 'onion', name: 'Cebola caramelizada em tiras', kind: 'onion-caramelized', removable: true },
      { id: 'arugula', name: 'Folhas pequenas de rúcula', kind: 'arugula', removable: true },
      { id: 'bun-top', name: 'Pão brioche superior levemente tostado', kind: 'bun-top', removable: false },
    ],
    imagePath: null,
    supportsDoneness: true,
    availability: 'available',
    addonIds: ['extra-bacon', 'extra-beef'],
  },
]

const PRODUCT_BY_ID = new Map(PRODUCTS.map((product) => [product.id, product]))

export function getProduct(id: string): Product | undefined {
  return PRODUCT_BY_ID.get(id)
}
