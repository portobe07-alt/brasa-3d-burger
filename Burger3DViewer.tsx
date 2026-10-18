import { Suspense, lazy, useEffect, useMemo, useRef, useState } from 'react'
import { Box, Image as ImageIcon, Layers, Minus, Plus, RotateCcw, TriangleAlert } from 'lucide-react'
import type { Product } from '../types/product'
import type { Customization, Doneness } from '../types/cart'
import { useReducedMotion, useWebGLSupport } from '../hooks/useEnvironment'
import { resolveComposition, resolveMeatComposition } from '../utils/composition'
import type { SceneCommand } from '../three/BurgerScene'
import { BurgerIllustration } from './BurgerIllustration'
import { Badge, Button, IconButton, Spinner } from './ui'

/**
 * Visualizador do produto.
 *
 * A geometria é gerada proceduralmente em three.js a partir da composição, por
 * isso o 3D está sempre disponível — não depende de nenhum arquivo externo. O
 * único caso de recuo é o navegador não conseguir iniciar o WebGL; aí entra a
 * ilustração vetorial, identificada como ilustração e sem controles de rotação
 * ou zoom, que seriam uma promessa falsa.
 */

/** three.js entra em um chunk separado, carregado quando o visualizador aparece. */
const BurgerScene = lazy(() => import('../three/BurgerScene'))

export interface Burger3DViewerProps {
  product: Product
  /** Personalização atual: é ela que define as peças presentes na cena. */
  customization: Customization
  /** Ingrediente destacado, sincronizado com a lista. */
  highlightedId?: string | null
  className?: string
  /** Mostra a barra de controles abaixo do palco. */
  showControls?: boolean
  /**
   * Quando definido, o palco mostra SOMENTE o disco de carne, cortado, no
   * ponto indicado. Nenhum outro ingrediente aparece.
   */
  meatFocus?: Doneness | null
  /**
   * Monta a cena 3D. Com `false`, o canvas é desmontado e o contexto WebGL
   * liberado — usado para não manter o visualizador do topo vivo atrás de um
   * painel que o cobre inteiro.
   */
  active?: boolean
}

export function Burger3DViewer({
  product,
  customization,
  highlightedId = null,
  className = '',
  showControls = true,
  active = true,
  meatFocus = null,
}: Burger3DViewerProps) {
  const hasWebGL = useWebGLSupport()
  const reducedMotion = useReducedMotion()

  const [command, setCommand] = useState<SceneCommand | null>(null)
  const [expansion, setExpansion] = useState(0)
  const [ready, setReady] = useState(false)
  const commandId = useRef(0)

  // A composição é derivada dos dados; a cena apenas a desenha. Na escolha do
  // ponto, a composição é trocada por um único disco de carne cortado — é o
  // que faz a transição entre as duas vistas ser suave, já que a cena anima a
  // entrada e a saída das peças sozinha.
  const composition = useMemo(
    () => (meatFocus ? resolveMeatComposition(meatFocus) : resolveComposition(product, customization)),
    [product, customization, meatFocus],
  )

  // Trocar de vista devolve a câmera à posição inicial: na vista da carne é
  // isso que deixa a face do corte de frente para quem olha.
  useEffect(() => {
    commandId.current += 1
    setCommand({ id: commandId.current, kind: 'reset' })
  }, [meatFocus !== null])

  const send = (kind: SceneCommand['kind']) => {
    commandId.current += 1
    setCommand({ id: commandId.current, kind })
  }

  const isSeparated = expansion > 0.5
  const addonsWithoutGeometry = useMemo(
    () => customization.addonIds.filter((id) => !product.addonIds.includes(id)),
    [customization.addonIds, product.addonIds],
  )

  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      {/* ------------------------------ Palco ------------------------------ */}
      <div className="grain relative isolate aspect-square w-full overflow-hidden rounded-card border border-white/8 bg-coal-2">
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_26%,rgba(232,117,50,0.2),transparent_64%)]"
        />
        <div
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 h-1/3 bg-[linear-gradient(to_top,rgba(0,0,0,0.55),transparent)]"
        />

        {hasWebGL && active ? (
          <Suspense
            fallback={
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                <Spinner />
                <p className="text-[0.68rem] font-semibold tracking-[0.16em] text-ash uppercase">
                  Preparando visualizador 3D
                </p>
              </div>
            }
          >
            <BurgerScene
              composition={composition}
              productId={product.id}
              reducedMotion={reducedMotion}
              command={command}
              highlightedId={highlightedId}
              onExpansionChange={setExpansion}
              onCreated={() => setReady(true)}
            />
          </Suspense>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center p-5 sm:p-7">
            <BurgerIllustration
              ingredients={product.ingredients}
              seed={product.id}
              highlightedId={highlightedId}
              removedIds={customization.removedIngredientIds}
              className="h-full w-full drop-shadow-[0_24px_40px_rgba(0,0,0,0.55)]"
            />
          </div>
        )}

        {/* Etiqueta de modo: diz sempre o que está na tela. */}
        <div className="absolute top-3 left-3 z-10">
          {hasWebGL && active ? (
            <Badge tone="ember">
              <Box size={11} strokeWidth={2.5} aria-hidden="true" />
              {meatFocus ? 'Corte da carne em 3D' : 'Modelo 3D interativo'}
            </Badge>
          ) : (
            <Badge tone="muted">
              <ImageIcon size={11} strokeWidth={2.5} aria-hidden="true" />
              Ilustração de referência
            </Badge>
          )}
        </div>

        {/* Medidor de separação: mostra que o zoom comanda as camadas. */}
        {hasWebGL && active && ready && !meatFocus && (
          <div className="absolute top-3 right-3 z-10 flex items-center gap-2">
            <span className="text-[0.58rem] font-bold tracking-[0.14em] text-ash/80 uppercase">
              {isSeparated ? 'Camadas separadas' : 'Montado'}
            </span>
            <span
              aria-hidden="true"
              className="h-1 w-12 overflow-hidden rounded-full bg-white/12"
            >
              <span
                className="block h-full rounded-full bg-ember transition-[width] duration-150 ease-linear"
                style={{ width: `${Math.round(expansion * 100)}%` }}
              />
            </span>
          </div>
        )}

        {hasWebGL && active && ready && (
          <p className="pointer-events-none absolute right-3 bottom-3 z-10 hidden text-right text-[0.6rem] leading-relaxed font-semibold tracking-[0.1em] text-ash/70 uppercase sm:block">
            Arraste para girar
            {!meatFocus && (
              <>
                <br />
                Role para separar as camadas
              </>
            )}
          </p>
        )}
      </div>

      {/* ---------------------------- Controles ---------------------------- */}
      {showControls && hasWebGL && active && (
        <div className="flex flex-wrap items-center gap-2">
          <IconButton label="Restaurar visualização inicial" size="sm" onClick={() => send('reset')}>
            <RotateCcw size={15} aria-hidden="true" />
          </IconButton>
          <IconButton label="Aproximar e separar as camadas" size="sm" onClick={() => send('zoom-in')}>
            <Plus size={15} aria-hidden="true" />
          </IconButton>
          <IconButton label="Afastar e juntar as camadas" size="sm" onClick={() => send('zoom-out')}>
            <Minus size={15} aria-hidden="true" />
          </IconButton>

          {!meatFocus && (
          <Button
            variant={isSeparated ? 'primary' : 'secondary'}
            size="sm"
            aria-pressed={isSeparated}
            onClick={() => send(isSeparated ? 'collapse' : 'expand')}
            className="ml-auto"
          >
            <Layers size={14} aria-hidden="true" />
            {isSeparated ? 'Juntar camadas' : 'Ver ingredientes em camadas'}
          </Button>
          )}
        </div>
      )}

      {/* ------------------------- Mensagens de estado ------------------------- */}
      {!hasWebGL && active && (
        <p className="flex items-start gap-2 text-[0.78rem] leading-relaxed text-ash">
          <TriangleAlert size={14} className="mt-0.5 shrink-0 text-amber-400/80" aria-hidden="true" />
          <span>
            Este dispositivo não conseguiu iniciar a renderização 3D (WebGL indisponível). Exibindo a
            ilustração vetorial em camadas, por isso não há rotação nem zoom.
          </span>
        </p>
      )}

      {meatFocus && (
        <p className="text-[0.75rem] leading-relaxed text-ash/80">
          Imagem ilustrativa do ponto da carne. O resultado real pode variar conforme o preparo.
        </p>
      )}

      {addonsWithoutGeometry.length > 0 && (
        <p className="text-[0.78rem] leading-relaxed text-ash">
          Alguns adicionais escolhidos não têm peça correspondente no modelo: eles entram no preço e na
          descrição do pedido, mas não alteram a imagem.
        </p>
      )}
    </div>
  )
}
