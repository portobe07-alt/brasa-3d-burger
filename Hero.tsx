import type { Product } from '../types/product'
import { EMPTY_CUSTOMIZATION } from '../utils/pricing'
import { Burger3DViewer } from './Burger3DViewer'
import { Button } from './ui'

/**
 * Seção inicial.
 *
 * O destaque é o mesmo visualizador 3D da tela de produto, com a composição
 * original do hambúrguer: o cliente já gira e separa as camadas aqui.
 *
 * Com um painel sobreposto aberto, a cena é desmontada (`paused`): manter um
 * segundo contexto WebGL vivo atrás de algo que cobre a tela inteira só
 * consumiria memória.
 */
export function Hero({ featured, paused = false }: { featured: Product | null; paused?: boolean }) {
  return (
    <section id="inicio" className="relative scroll-mt-24 overflow-hidden px-4 pt-28 pb-16 sm:px-6 lg:pt-36 lg:pb-24">
      {/* Iluminação de fundo. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_55%_at_50%_0%,rgba(232,117,50,0.16),transparent_70%)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-40 left-1/2 size-[32rem] -translate-x-1/2 rounded-full bg-ember/8 blur-[120px]"
      />

      <div className="relative mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.95fr)] lg:gap-16">
        {/* ----------------------------- Texto ----------------------------- */}
        <div className="anim-fade-up flex flex-col items-start gap-7">
          <span className="inline-flex items-center gap-2 rounded-full border border-ember/30 bg-ember/10 px-3.5 py-1.5 text-[0.64rem] font-bold tracking-[0.24em] text-ember-soft uppercase">
            Cardápio interativo
          </span>

          <h1 className="text-balance text-5xl leading-[0.98] sm:text-6xl lg:text-7xl">
            Seu próximo burger,
            <br />
            <span className="text-ember">em outra dimensão.</span>
          </h1>

          <p className="max-w-lg text-pretty text-[1.02rem] leading-relaxed text-ash">
            Explore nossos hambúrgueres artesanais em uma experiência interativa. Gire, descubra os
            ingredientes e escolha seu próximo favorito.
          </p>

          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <Button
              size="lg"
              onClick={() => document.getElementById('cardapio')?.scrollIntoView({ block: 'start' })}
            >
              Explorar cardápio
            </Button>
            <Button
              variant="secondary"
              size="lg"
              onClick={() => document.getElementById('como-funciona')?.scrollIntoView({ block: 'start' })}
            >
              Como funciona
            </Button>
          </div>
        </div>

        {/* ---------------------------- Visual ---------------------------- */}
        {featured && (
          <div className="anim-fade-up [animation-delay:120ms]">
            <Burger3DViewer product={featured} customization={EMPTY_CUSTOMIZATION} active={!paused} />
            <p className="mt-3 text-[0.74rem] leading-relaxed text-ash">
              Em destaque:{' '}
              <span className="font-semibold text-cream">{featured.name}</span> — {featured.tagline}
            </p>
          </div>
        )}
      </div>
    </section>
  )
}
