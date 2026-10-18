import { CHEESE_KINDS, PATTY_KINDS } from '../three/ingredientSpecs'
import type { Addon, AddonId } from '../types/product'

/**
 * Tabela central de adicionais. Os preços estão em centavos e são os valores
 * demonstrativos definidos para esta versão. Alterar aqui propaga para os
 * cards, a tela de detalhes, a cena 3D, o carrinho e a revisão do pedido.
 *
 * O campo `visual` é o que faz o adicional aparecer no hambúrguer: ele diz
 * qual peça inserir e onde. Um adicional sem `visual` muda apenas o preço, e a
 * interface informa isso em vez de fingir que o modelo mudou.
 */
export const ADDONS: Addon[] = [
  {
    id: 'extra-bacon',
    name: 'Bacon extra',
    description: 'Duas fatias adicionais de bacon crocante.',
    price: 500,
    visual: {
      kind: 'bacon',
      count: 1,
      // Vai por cima do queijo, ou da carne quando não houver queijo.
      anchorKinds: [...CHEESE_KINDS, ...PATTY_KINDS],
      insertOrder: 3,
    },
  },
  {
    id: 'extra-cheddar',
    name: 'Cheddar extra',
    description: 'Uma fatia adicional de queijo cheddar.',
    price: 300,
    visual: {
      kind: 'cheese-cheddar',
      // Entra logo acima da carne mais alta — inclusive a carne extra, se houver.
      count: 1,
      anchorKinds: [...PATTY_KINDS, ...CHEESE_KINDS],
      insertOrder: 2,
    },
  },
  {
    id: 'extra-beef',
    name: 'Carne bovina extra',
    description: 'Um hambúrguer bovino adicional de 100 g.',
    price: 800,
    visual: {
      // 100 g corresponde a um smash, mais fino que o disco artesanal.
      kind: 'patty-smash',
      count: 1,
      anchorKinds: PATTY_KINDS,
      insertOrder: 1,
    },
  },
]

const ADDON_BY_ID = new Map<AddonId, Addon>(ADDONS.map((addon) => [addon.id, addon]))

export function getAddon(id: AddonId): Addon | undefined {
  return ADDON_BY_ID.get(id)
}

/** Resolve uma lista de ids em objetos `Addon`, descartando ids desconhecidos. */
export function resolveAddons(ids: readonly AddonId[]): Addon[] {
  return ids
    .map((id) => ADDON_BY_ID.get(id))
    .filter((addon): addon is Addon => addon !== undefined)
}
