import { Layers, MousePointerClick, SlidersHorizontal, ShoppingBag } from 'lucide-react'
import { SectionHeading } from './ui'

const STEPS = [
  {
    icon: MousePointerClick,
    title: 'Escolha um hambúrguer',
    text: 'Percorra o cardápio e abra o produto que te chamou atenção.',
  },
  {
    icon: Layers,
    title: 'Veja a composição',
    text: 'Separe as camadas e acompanhe a lista de ingredientes na ordem de montagem, de baixo para cima.',
  },
  {
    icon: SlidersHorizontal,
    title: 'Ajuste do seu jeito',
    text: 'Retire o que não quiser, escolha adicionais e defina a quantidade. O preço acompanha cada mudança.',
  },
  {
    icon: ShoppingBag,
    title: 'Monte seu pedido',
    text: 'Adicione ao carrinho e revise tudo antes de concluir, com os valores somados automaticamente.',
  },
]

/** Explicação do fluxo, âncora do botão secundário do hero. */
export function HowItWorks() {
  return (
    <section id="como-funciona" className="scroll-mt-24 border-y border-white/8 bg-coal-2 px-4 py-20 sm:px-6 lg:py-24">
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          eyebrow="Como funciona"
          title="Quatro passos até o seu pedido."
          subtitle="Uma experiência pensada para você entender exatamente o que vai comer."
        />

        <ol className="mt-14 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step, index) => (
            <li
              key={step.title}
              className="relative flex flex-col gap-4 rounded-card border border-white/8 bg-coal p-6"
            >
              <span className="tnum absolute top-5 right-5 font-display text-2xl text-white/8">
                {String(index + 1).padStart(2, '0')}
              </span>
              <span aria-hidden="true" className="grid size-11 place-items-center rounded-xl bg-ember/12 text-ember">
                <step.icon size={20} />
              </span>
              <h3 className="text-[1.05rem] leading-tight">{step.title}</h3>
              <p className="text-[0.84rem] leading-relaxed text-ash">{step.text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
