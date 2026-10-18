import { STORE } from '../data/store'
import { PRODUCTS } from '../data/products'
import { SectionHeading } from './ui'

/**
 * Seção "Sobre".
 *
 * Texto de marca e nada além disso: sem avaliações, depoimentos, números de
 * vendas ou selos. Os únicos dados exibidos são os que o próprio catálogo
 * fornece.
 */
export function About() {
  // Variedade real do catálogo: quantos tipos distintos de ingrediente ele usa.
  const distinctIngredientKinds = new Set(
    PRODUCTS.flatMap((product) => product.ingredients.map((ingredient) => ingredient.kind)),
  ).size

  const facts = [
    { label: 'Hambúrgueres no cardápio', value: String(PRODUCTS.length) },
    { label: 'Tipos de ingrediente no cardápio', value: String(distinctIngredientKinds) },
    {
      label: 'Faixa de preço',
      value: `R$ ${(Math.min(...PRODUCTS.map((p) => p.price)) / 100).toFixed(2).replace('.', ',')} – R$ ${(
        Math.max(...PRODUCTS.map((p) => p.price)) / 100
      )
        .toFixed(2)
        .replace('.', ',')}`,
    },
  ]

  return (
    <section id="sobre" className="scroll-mt-24 px-4 py-20 sm:px-6 lg:py-28">
      <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-2 lg:gap-16">
        <div className="flex flex-col gap-6">
          <SectionHeading
            eyebrow="Sobre"
            title="Hamburgueria artesanal, com a comida em primeiro plano."
            align="left"
          />
          <div className="flex flex-col gap-4 text-[0.95rem] leading-relaxed text-ash">
            <p>
              A {STORE.name} nasceu de uma ideia simples: quem pede um hambúrguer deveria conseguir ver
              exatamente o que vai receber. Em vez de uma foto única e distante, cada produto do nosso
              cardápio é apresentado camada por camada, na ordem em que sai da chapa.
            </p>
            <p>
              A chapa é quente, a carne é prensada no ponto para formar crosta, e o pão brioche passa pela
              manteiga antes de encontrar o resto. O que muda aqui é só a forma de mostrar isso.
            </p>
            <p className="text-cream/70">
              Esta é uma hamburgueria fictícia, criada para demonstrar o cardápio digital interativo.
            </p>
          </div>
        </div>

        <dl className="grid grid-cols-1 content-start gap-4 sm:grid-cols-3 lg:grid-cols-1">
          {facts.map((fact) => (
            <div key={fact.label} className="rounded-card border border-white/8 bg-coal-2 p-6">
              <dd className="tnum font-display text-3xl text-ember">{fact.value}</dd>
              <dt className="mt-2 text-[0.72rem] font-bold tracking-[0.14em] text-ash uppercase">
                {fact.label}
              </dt>
            </div>
          ))}
        </dl>
      </div>
    </section>
  )
}
