import { useEffect, useMemo, useState } from 'react'
import { Clock, Menu, QrCode, ShoppingBag, X } from 'lucide-react'
import { STORE } from '../data/store'
import { useCart } from '../hooks/useCart'
import { readAccessContext } from '../utils/accessContext'
import { Badge, IconButton } from './ui'

const NAV_LINKS = [
  { href: '#cardapio', label: 'Cardápio' },
  { href: '#combos', label: 'Combos' },
  { href: '#batatas', label: 'Batatas' },
  { href: '#bebidas', label: 'Bebidas' },
  { href: '#sobre', label: 'Sobre' },
]

/**
 * Cabeçalho fixo, discreto de propósito para não competir com os produtos.
 *
 * O indicador de funcionamento mostra o horário configurado em
 * `data/store.ts`. Enquanto não houver essa informação, ele diz exatamente
 * isso — a interface nunca afirma que a loja está aberta.
 */
export function Header({ onOpenCart }: { onOpenCart: () => void }) {
  const cart = useCart()
  // Mesa vinda do QR Code ou da etiqueta NFC. Lida uma vez por sessão.
  const access = useMemo(() => readAccessContext(), [])
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={[
        'fixed inset-x-0 top-0 z-40 transition-all duration-300 ease-[var(--ease-brasa)]',
        scrolled ? 'border-b border-white/8 bg-coal/90 backdrop-blur-md' : 'border-b border-transparent',
      ].join(' ')}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4 sm:px-6">
        {/* ----------------------------- Logotipo ----------------------------- */}
        <a href="#inicio" className="group flex shrink-0 items-center gap-2.5" aria-label={`${STORE.name} — início`}>
          <span aria-hidden="true" className="grid size-9 place-items-center rounded-xl bg-ember">
            <svg viewBox="0 0 24 24" className="size-5" fill="none">
              <path d="M3 9c0-3.3 4-5.5 9-5.5s9 2.2 9 5.5z" fill="#fff" />
              <rect x="2.5" y="10.5" width="19" height="2.6" rx="1.3" fill="#121212" opacity="0.5" />
              <rect x="2.5" y="14.2" width="19" height="3.2" rx="1.4" fill="#fff" opacity="0.85" />
              <path d="M3 18.8h18c0 1.7-2 2.7-9 2.7s-9-1-9-2.7z" fill="#fff" />
            </svg>
          </span>
          <span className="flex flex-col leading-none">
            <span className="font-display text-[0.95rem] tracking-[0.06em] text-cream">BRASA 3D</span>
            <span className="text-[0.56rem] font-bold tracking-[0.34em] text-ember">BURGER</span>
          </span>
        </a>

        {/* ----------------------------- Navegação ----------------------------- */}
        <nav aria-label="Navegação principal" className="ml-5 hidden items-center gap-0.5 lg:flex">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="rounded-full px-3 py-2 text-[0.74rem] font-semibold tracking-[0.1em] text-ash uppercase transition-colors duration-200 hover:bg-white/5 hover:text-cream"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2.5">
          {/* Mesa identificada pelo acesso (QR Code ou NFC). */}
          {access.table && (
            <Badge tone="ember">
              <QrCode size={11} strokeWidth={2.5} aria-hidden="true" />
              Mesa {access.table}
            </Badge>
          )}

          {/* Indicador de funcionamento. */}
          <span className="hidden xl:block">
            <Badge tone={STORE.openingHours ? 'positive' : 'muted'}>
              <Clock size={11} strokeWidth={2.5} aria-hidden="true" />
              {STORE.openingHours ?? 'Horário não informado'}
            </Badge>
          </span>

          {/* Carrinho, com contador. */}
          <button
            type="button"
            onClick={onOpenCart}
            className="relative inline-flex h-11 items-center gap-2 rounded-full border border-cream/20 px-4 text-[0.74rem] font-bold tracking-[0.1em] text-cream uppercase transition-all duration-200 hover:border-cream/50 hover:bg-cream/5 active:scale-[0.98]"
            aria-label={
              cart.count === 0
                ? 'Abrir carrinho, vazio'
                : `Abrir carrinho, ${cart.count} ${cart.count === 1 ? 'item' : 'itens'}`
            }
          >
            <ShoppingBag size={16} aria-hidden="true" />
            <span className="hidden sm:inline">Carrinho</span>
            {cart.count > 0 && (
              <span
                aria-hidden="true"
                className="tnum grid min-w-5 place-items-center rounded-full bg-ember px-1.5 py-0.5 text-[0.66rem] leading-none font-extrabold text-white"
              >
                {cart.count}
              </span>
            )}
          </button>

          {/* Menu do celular. */}
          <span className="lg:hidden">
            <IconButton
              label={menuOpen ? 'Fechar menu' : 'Abrir menu'}
              variant="ghost"
              onClick={() => setMenuOpen((value) => !value)}
              aria-expanded={menuOpen}
              aria-controls="menu-mobile"
            >
              {menuOpen ? <X size={20} aria-hidden="true" /> : <Menu size={20} aria-hidden="true" />}
            </IconButton>
          </span>
        </div>
      </div>

      {/* --------------------------- Painel do celular --------------------------- */}
      {menuOpen && (
        <nav
          id="menu-mobile"
          aria-label="Navegação principal (celular)"
          className="anim-fade border-t border-white/8 bg-coal/97 px-4 py-3 backdrop-blur-md lg:hidden"
        >
          <ul className="flex flex-col">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className="block rounded-lg px-3 py-3 text-[0.9rem] font-semibold text-cream transition-colors hover:bg-white/5"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
          <p className="mt-2 px-3 pb-1 text-[0.7rem] text-ash">
            {STORE.openingHours ?? 'Horário de funcionamento não informado.'}
          </p>
        </nav>
      )}
    </header>
  )
}
