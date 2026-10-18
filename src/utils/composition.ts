import { resolveAddons } from '../data/addons'
import { specFor } from '../three/ingredientSpecs'
import type { Composition, LayerInstance, PlacedLayer } from '../types/composition'
import type { Customization } from '../types/cart'
import type { IngredientKind, Product } from '../types/product'

/**
 * Resolve produto + personalização em uma pilha de peças posicionadas.
 *
 * Esta é a fonte única da montagem. A cena 3D, a lista de ingredientes e a
 * descrição do pedido saem todas daqui, então é impossível a tela mostrar uma
 * composição diferente da que foi pedida.
 *
 * O empilhamento é recalculado do zero a cada mudança: inserir uma carne extra
 * faz tudo que está acima dela subir sozinho, sem posições fixas no código.
 */

/** Monta a lista de peças, já com os adicionais inseridos nas posições certas. */
function buildLayerInstances(product: Product, customization: Customization): LayerInstance[] {
  const layers: LayerInstance[] = product.ingredients
    .filter((ingredient) => !customization.removedIngredientIds.includes(ingredient.id))
    .map((ingredient) => ({
      id: ingredient.id,
      ingredientId: ingredient.id,
      addonId: null,
      name: ingredient.name,
      kind: ingredient.kind,
      seed: `${product.id}-${ingredient.id}`,
      isAddon: false,
    }))

  // Só entram adicionais que o produto realmente oferece.
  const addons = resolveAddons(customization.addonIds)
    .filter((addon) => product.addonIds.includes(addon.id))
    .sort((a, b) => (a.visual?.insertOrder ?? 99) - (b.visual?.insertOrder ?? 99))

  for (const addon of addons) {
    const visual = addon.visual
    // Sem geometria correspondente, o adicional não entra na cena. A interface
    // avisa o cliente em vez de inserir uma peça qualquer.
    if (!visual) continue

    for (let copy = 0; copy < visual.count; copy += 1) {
      // Procura a camada mais alta que sirva de âncora.
      let insertAt = -1
      for (let i = layers.length - 1; i >= 0; i -= 1) {
        if (visual.anchorKinds.includes(layers[i].kind)) {
          insertAt = i + 1
          break
        }
      }

      // Sem âncora, a peça entra logo abaixo do pão superior.
      if (insertAt === -1) {
        const topBun = layers.findIndex((layer) => layer.kind === 'bun-top')
        insertAt = topBun === -1 ? layers.length : topBun
      }

      layers.splice(insertAt, 0, {
        id: `addon:${addon.id}#${copy}`,
        ingredientId: null,
        addonId: addon.id,
        name: addon.name,
        kind: visual.kind,
        seed: `${product.id}-addon-${addon.id}-${copy}`,
        isAddon: true,
      })
    }
  }

  return layers
}

/** Posiciona as peças no eixo vertical, de baixo para cima. */
export function resolveComposition(product: Product, customization: Customization): Composition {
  const instances = buildLayerInstances(product, customization)

  let cursor = 0
  let radius = 0

  const layers: PlacedLayer[] = instances.map((instance, index) => {
    const spec = specFor(instance.kind)
    // Cada peça afunda um pouco na de baixo, para não ficarem discos soltos.
    if (index > 0) cursor -= spec.overlap
    const y = cursor + spec.thickness / 2
    cursor += spec.thickness
    radius = Math.max(radius, spec.radius)
    return { ...instance, thickness: spec.thickness, y, index }
  })

  return { layers, height: Math.max(cursor, 0.001), radius: Math.max(radius, 0.001) }
}

/**
 * Composição com um único disco de carne, cortado, para a escolha do ponto.
 *
 * Nenhum outro ingrediente entra: a visualização mostra só a carne, como
 * pedido. A identidade da camada inclui o ponto escolhido, então trocar de
 * ponto troca a peça — e a cena anima a substituição sozinha.
 */
export function resolveMeatComposition(doneness: string): Composition {
  const spec = specFor('patty-beef')
  // A carne ocupa a cena inteira aqui, então vale a pena ampliá-la.
  const thickness = spec.thickness * 1.5
  return {
    layers: [
      {
        id: `meat-focus:${doneness}`,
        ingredientId: null,
        addonId: null,
        name: 'Hambúrguer bovino artesanal',
        kind: 'patty-beef',
        seed: 'meat-focus',
        isAddon: false,
        variant: `cutaway:${doneness}`,
        thickness,
        y: thickness / 2,
        index: 0,
      },
    ],
    height: thickness,
    radius: spec.radius,
    // Uma peça sozinha precisa crescer para ocupar o quadro.
    fitUpscale: 2.1,
  }
}

/** Como uma linha deve aparecer na lista de ingredientes. */
export type IngredientDisplayState = 'kept' | 'removed' | 'addon'

export interface IngredientDisplayEntry {
  id: string
  name: string
  kind: IngredientKind
  state: IngredientDisplayState
  /** Id do ingrediente original, para sincronizar o realce com a cena 3D. */
  ingredientId: string | null
}

/**
 * Monta a lista exibida na tela de detalhes.
 *
 * Percorre a composição já resolvida — portanto na ordem real de montagem,
 * com os adicionais nas posições em que de fato entraram — e reintroduz os
 * ingredientes retirados, riscados, no lugar de origem. O cliente vê
 * exatamente o que vai receber e o que pediu para tirar.
 */
export function buildIngredientDisplay(
  product: Product,
  customization: Customization,
  composition: Composition,
): IngredientDisplayEntry[] {
  const removed = new Set(customization.removedIngredientIds)
  const entries: IngredientDisplayEntry[] = []
  let originalIndex = 0

  const flushRemovedBefore = (ingredientId: string | null) => {
    // Emite os retirados que vinham antes desta peça na receita original.
    while (originalIndex < product.ingredients.length) {
      const original = product.ingredients[originalIndex]
      if (original.id === ingredientId) {
        originalIndex += 1
        return
      }
      if (!removed.has(original.id)) return
      entries.push({
        id: original.id,
        name: original.name,
        kind: original.kind,
        state: 'removed',
        ingredientId: original.id,
      })
      originalIndex += 1
    }
  }

  for (const layer of composition.layers) {
    if (layer.ingredientId) flushRemovedBefore(layer.ingredientId)
    entries.push({
      id: layer.id,
      name: layer.name,
      kind: layer.kind,
      state: layer.isAddon ? 'addon' : 'kept',
      ingredientId: layer.ingredientId,
    })
  }

  // Retirados que ficavam no fim da receita.
  flushRemovedBefore(null)

  return entries
}
