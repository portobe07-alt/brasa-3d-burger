import { getProduct } from '../data/products'
import type { CartLineContent } from '../types/cart'
import { BurgerIllustration } from './BurgerIllustration'
import { DrinkIllustration } from './DrinkIllustration'
import { FriesIllustration } from './FriesIllustration'

/**
 * Miniatura de uma linha do carrinho.
 *
 * Escolhe a ilustração certa para cada tipo. No combo mostra o hambúrguer,
 * que é o item principal — os componentes completos aparecem escritos logo
 * ao lado.
 */
export function ProductThumb({ content, className = '' }: { content: CartLineContent; className?: string }) {
  if (content.kind === 'fries') {
    return <FriesIllustration variantId={content.fries.variantId} className={className} />
  }
  if (content.kind === 'drink') {
    return <DrinkIllustration drinkId={content.drink.drinkId} className={className} />
  }

  const product = getProduct(content.burger.productId)
  if (!product) return null

  if (product.imagePath) {
    return <img src={product.imagePath} alt="" className={`${className} object-contain`} loading="lazy" />
  }
  return (
    <BurgerIllustration
      ingredients={product.ingredients}
      seed={product.id}
      removedIds={content.burger.customization.removedIngredientIds}
      className={className}
    />
  )
}
