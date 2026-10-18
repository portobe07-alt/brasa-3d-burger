import { STORE } from '../data/store'

/**
 * Rodapé.
 *
 * Só exibe contato, endereço ou formas de pagamento quando esses dados
 * existirem de fato em `data/store.ts`.
 */
export function Footer() {
  return (
    <footer className="border-t border-white/8 bg-coal-2 px-4 py-12 sm:px-6">
      <div className="mx-auto flex max-w-6xl flex-col gap-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="font-display text-xl tracking-[0.06em] text-cream">{STORE.name}</p>
            <p className="mt-1.5 text-[0.82rem] text-ash">{STORE.concept}</p>
          </div>

          <nav aria-label="Navegação do rodapé" className="flex flex-wrap gap-x-6 gap-y-2">
            {[
              { href: '#cardapio', label: 'Cardápio' },
              { href: '#combos', label: 'Combos' },
              { href: '#batatas', label: 'Batatas' },
              { href: '#bebidas', label: 'Bebidas' },
              { href: '#sobre', label: 'Sobre' },
            ].map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-[0.78rem] font-semibold tracking-[0.08em] text-ash uppercase transition-colors hover:text-cream"
              >
                {link.label}
              </a>
            ))}
          </nav>
        </div>

        <dl className="grid grid-cols-1 gap-4 border-t border-white/8 pt-8 text-[0.8rem] sm:grid-cols-3">
          <div>
            <dt className="text-[0.66rem] font-bold tracking-[0.18em] text-ash/70 uppercase">Endereço</dt>
            <dd className="mt-1 text-ash">{STORE.address ?? 'Não informado'}</dd>
          </div>
          <div>
            <dt className="text-[0.66rem] font-bold tracking-[0.18em] text-ash/70 uppercase">Horário</dt>
            <dd className="mt-1 text-ash">{STORE.openingHours ?? 'Não informado'}</dd>
          </div>
          <div>
            <dt className="text-[0.66rem] font-bold tracking-[0.18em] text-ash/70 uppercase">Pagamento</dt>
            <dd className="mt-1 text-ash">
              {STORE.paymentMethods.length > 0 ? STORE.paymentMethods.join(', ') : 'Não configurado'}
            </dd>
          </div>
        </dl>

        <p className="text-[0.72rem] leading-relaxed text-ash/70">
          Projeto de demonstração de cardápio digital interativo. {STORE.name} é uma hamburgueria fictícia;
          os produtos, preços e informações desta página existem apenas para fins de demonstração.
        </p>
      </div>
    </footer>
  )
}
