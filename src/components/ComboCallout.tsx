import { ArrowRight, UtensilsCrossed } from 'lucide-react'
import { Button } from './ui'

/**
 * Chamada para a montagem de combo, entre o cardápio e os acompanhamentos.
 *
 * Não interrompe o fluxo: quem quiser pedir só o hambúrguer simplesmente
 * segue adiante.
 */
export function ComboCallout({ onOpen }: { onOpen: () => void }) {
  return (
    <section id="combos" className="scroll-mt-24 px-4 pb-6 sm:px-6">
      <div className="grain relative mx-auto flex max-w-6xl flex-col items-start gap-5 overflow-hidden rounded-card border border-ember/25 bg-coal-2 p-7 sm:flex-row sm:items-center sm:justify-between sm:p-9">
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[radial-gradient(ellipse_at_15%_50%,rgba(232,117,50,0.18),transparent_60%)]"
        />
        <div className="relative flex items-start gap-4">
          <span aria-hidden="true" className="grid size-12 shrink-0 place-items-center rounded-xl bg-ember/15 text-ember">
            <UtensilsCrossed size={22} />
          </span>
          <div>
            <h2 className="text-2xl leading-none">Monte seu combo</h2>
            <p className="mt-2 max-w-md text-[0.9rem] leading-relaxed text-ash">
              Um hambúrguer, uma batata e uma bebida em um único pedido. O valor é a soma dos itens
              escolhidos.
            </p>
          </div>
        </div>
        <Button size="lg" onClick={onOpen} className="relative shrink-0 whitespace-nowrap">
          Montar combo
          <ArrowRight size={16} aria-hidden="true" />
        </Button>
      </div>
    </section>
  )
}
