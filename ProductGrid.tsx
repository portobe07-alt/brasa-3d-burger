import type { Product } from '../types/product'
import { ProductCard } from './ProductCard'
import { SectionHeading } from './ui'

/** Seção do cardápio: cabeçalho e a grade dos cinco produtos. */
export function ProductGrid({
  products,
  onExplore,
  onQuickAdd,
}: {
  products: Product[]
  onExplore: (product: Product) => void
  onQuickAdd: (product: Product) => void
}) {
  return (
    <section id="cardapio" className="scroll-mt-24 px-4 py-20 sm:px-6 lg:py-28">
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          eyebrow="Cardápio"
          title="Feitos na brasa. Pensados nos detalhes."
          subtitle="Cinco combinações artesanais para descobrir seu próximo favorito."
        />

        {products.length === 0 ? (
          <p className="mt-14 text-center text-ash">Nenhum produto cadastrado no cardápio.</p>
        ) : (
          <div className="mt-14 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onExplore={onExplore}
                onQuickAdd={onQuickAdd}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
