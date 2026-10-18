import { useCallback, useEffect, useRef, useState } from 'react'
import { About } from './components/About'
import { CartDrawer } from './components/CartDrawer'
import { CartFab } from './components/CartFab'
import { Checkout } from './components/Checkout'
import { Footer } from './components/Footer'
import { Header } from './components/Header'
import { Hero } from './components/Hero'
import { HowItWorks } from './components/HowItWorks'
import { ProductDetails } from './components/ProductDetails'
import { ProductGrid } from './components/ProductGrid'
import { FriesSection } from './components/FriesSection'
import { DrinksSection } from './components/DrinksSection'
import { ComboBuilder } from './components/ComboBuilder'
import { ComboCallout } from './components/ComboCallout'
import { Toast } from './components/Toast'
import { PRODUCTS } from './data/products'
import { useCart } from './hooks/useCart'
import type { CartLineContent, Customization, Doneness } from './types/cart'
import type { Product } from './types/product'
import { EMPTY_CUSTOMIZATION, lineTitle } from './utils/pricing'
import { DEFAULT_DONENESS } from './types/cart'

/** Qual painel sobreposto está aberto. Apenas um por vez. */
type Panel = 'none' | 'details' | 'cart' | 'checkout' | 'combo'

export default function App() {
  const cart = useCart()
  const [panel, setPanel] = useState<Panel>('none')
  const [selected, setSelected] = useState<Product | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const toastTimer = useRef<number | undefined>(undefined)

  const showToast = useCallback((message: string) => {
    window.clearTimeout(toastTimer.current)
    setToast(message)
    toastTimer.current = window.setTimeout(() => setToast(null), 2800)
  }, [])

  useEffect(() => () => window.clearTimeout(toastTimer.current), [])

  const openDetails = (product: Product) => {
    setSelected(product)
    setPanel('details')
  }

  const addBurger = (
    product: Product,
    customization: Customization,
    quantity: number,
    doneness: Doneness | null,
  ) => {
    cart.add({ kind: 'burger', burger: { productId: product.id, customization, doneness } }, quantity)
    showToast(
      quantity > 1
        ? `${quantity}× ${product.name} no carrinho`
        : `${product.name} adicionado ao carrinho`,
    )
  }

  /** Adição direta pelo card, com a composição original e o ponto padrão. */
  const quickAdd = (product: Product) =>
    addBurger(product, EMPTY_CUSTOMIZATION, 1, product.supportsDoneness ? DEFAULT_DONENESS : null)

  /** Usada por batatas, bebidas e combos, que não têm tela de detalhes. */
  const addLine = (content: CartLineContent) => {
    cart.add(content, 1)
    showToast(`${lineTitle(content)} adicionado ao carrinho`)
  }

  const featured = PRODUCTS[0] ?? null

  return (
    <>
      {/* Atalho de teclado para quem navega sem mouse. */}
      <a
        href="#cardapio"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:rounded-full focus:bg-ember focus:px-5 focus:py-3 focus:text-[0.8rem] focus:font-bold focus:text-white"
      >
        Ir para o cardápio
      </a>

      <Header onOpenCart={() => setPanel('cart')} />

      <main>
        <Hero featured={featured} paused={panel !== 'none'} />
        <ProductGrid products={PRODUCTS} onExplore={openDetails} onQuickAdd={quickAdd} />
        <ComboCallout onOpen={() => setPanel('combo')} />
        <FriesSection onAdd={addLine} />
        <DrinksSection onAdd={addLine} />
        <HowItWorks />
        <About />
      </main>

      <Footer />

      <CartFab onOpen={() => setPanel('cart')} hidden={panel !== 'none'} />
      <Toast message={toast} />

      <ProductDetails
        product={selected}
        open={panel === 'details'}
        onClose={() => setPanel('none')}
        onAddToCart={addBurger}
      />

      <ComboBuilder open={panel === 'combo'} onClose={() => setPanel('none')} onAdd={addLine} />

      <CartDrawer
        open={panel === 'cart'}
        onClose={() => setPanel('none')}
        onCheckout={() => setPanel('checkout')}
      />

      <Checkout
        open={panel === 'checkout'}
        onClose={() => setPanel('none')}
        onBackToCart={() => setPanel('cart')}
      />
    </>
  )
}
