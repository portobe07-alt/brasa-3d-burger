import { useId, useMemo } from 'react'
import type { Ingredient, IngredientKind } from '../types/product'
import { visualFor } from '../utils/ingredientVisuals'

/**
 * Ilustração vetorial em camadas de um hambúrguer.
 *
 * Cada camada é desenhada a partir da lista real de ingredientes do produto,
 * de baixo para cima. É uma ILUSTRAÇÃO — não é fotografia e não é um modelo
 * 3D. Todo lugar da interface que a usa diz isso explicitamente.
 *
 * Serve a dois propósitos:
 *  1. imagem de referência enquanto o arquivo GLB do produto não existe;
 *  2. visualização em camadas (`exploded`), que separa as peças no eixo
 *     vertical — legítimo aqui porque a ilustração é de fato composta por
 *     camadas independentes.
 *
 * Determinismo: cada camada deriva toda a sua geometria em um único `useMemo`
 * que cria o próprio gerador pseudoaleatório a partir de uma semente em texto.
 * Assim a mesma semente desenha sempre exatamente a mesma peça, sem variação
 * entre renderizações.
 */

const VIEW_WIDTH = 340
const CENTER_X = VIEW_WIDTH / 2
const PADDING = 14
/** Distância entre camadas na visualização separada. */
const EXPLODE_GAP = 22

/** PRNG determinístico (xorshift sobre hash FNV-1a da semente). */
function createRandom(seed: string): () => number {
  let h = 2166136261
  for (let i = 0; i < seed.length; i += 1) {
    h ^= seed.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return () => {
    h ^= h << 13
    h ^= h >>> 17
    h ^= h << 5
    return ((h >>> 0) % 100000) / 100000
  }
}

interface LayerRenderProps {
  /** Largura da camada. */
  w: number
  /** Altura da camada. */
  h: number
  /** Semente em texto; a geometria é derivada dela. */
  seed: string
  /** Prefixo único para ids de gradiente (evita colisão entre instâncias). */
  uid: string
}

/* -------------------------------------------------------------------------- */
/*  Primitivas de desenho                                                      */
/* -------------------------------------------------------------------------- */

const n = (value: number) => value.toFixed(1)

/** Borda inferior ondulada, usada em molhos e queijos que escorrem. */
function drippingBottom(w: number, h: number, drips: number, rnd: () => number): string {
  const step = w / drips
  let d = `M0 0 H${n(w)} V${n(h * 0.45)}`
  for (let i = drips - 1; i >= 0; i -= 1) {
    const x = i * step
    const depth = h * (0.45 + rnd() * 0.55)
    d += ` Q${n(x + step * 0.5)} ${n(depth)} ${n(x)} ${n(h * 0.4)}`
  }
  return `${d} Z`
}

/** Borda superior recortada, usada em alface e rúcula. */
function ruffledTop(w: number, h: number, bumps: number, rnd: () => number): string {
  const step = w / bumps
  let d = `M0 ${n(h)} V${n(h * 0.55)}`
  for (let i = 0; i < bumps; i += 1) {
    const x = i * step
    const peak = h * (0.05 + rnd() * 0.3)
    d += ` Q${n(x + step * 0.5)} ${n(peak)} ${n(x + step)} ${n(h * 0.55)}`
  }
  return `${d} V${n(h)} Z`
}

/**
 * Contorno de uma proteína vista de lado: pontas arredondadas e borda superior
 * irregular. Com `bumpyBottom`, a borda inferior também fica irregular — é o
 * que dá ao filé empanado a silhueta volumosa e torta, diferente do disco de
 * carne, que assenta reto na chapa.
 */
function proteinOutline(
  w: number,
  h: number,
  rnd: () => number,
  { amplitude = 0.2, bumpyBottom = false }: { amplitude?: number; bumpyBottom?: boolean } = {},
): string {
  const r = Math.min(h * 0.42, 14)
  const bumps = 7
  const step = (w - r * 2) / bumps

  let d = `M${n(r)} 0`
  for (let i = 0; i < bumps; i += 1) {
    const x = r + i * step
    d += ` Q${n(x + step * 0.5)} ${n((rnd() - 0.5) * h * amplitude)} ${n(x + step)} 0`
  }
  d += ` Q${n(w)} 0 ${n(w)} ${n(r)} V${n(h - r)} Q${n(w)} ${n(h)} ${n(w - r)} ${n(h)}`

  if (bumpyBottom) {
    for (let i = bumps - 1; i >= 0; i -= 1) {
      const x = r + i * step
      d += ` Q${n(x + step * 0.5)} ${n(h + (rnd() - 0.3) * h * amplitude)} ${n(x)} ${n(h)}`
    }
  } else {
    d += ` H${n(r)}`
  }

  d += ` Q0 ${n(h)} 0 ${n(h - r)} V${n(r)} Q0 0 ${n(r)} 0 Z`
  return d
}

/* -------------------------------------------------------------------------- */
/*  Renderizadores por tipo de ingrediente                                     */
/* -------------------------------------------------------------------------- */

function BunBottom({ w, h, uid }: LayerRenderProps) {
  const v = visualFor('bun-bottom')
  const id = `${uid}-bunb`
  return (
    <>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={v.light} />
          <stop offset="55%" stopColor={v.color} />
          <stop offset="100%" stopColor={v.dark} />
        </linearGradient>
      </defs>
      <path d={`M0 0 H${n(w)} V${n(h - 16)} Q${n(w)} ${n(h)} ${n(w - 22)} ${n(h)} H22 Q0 ${n(h)} 0 ${n(h - 16)} Z`} fill={`url(#${id})`} />
      <path d={`M6 3 H${n(w - 6)}`} stroke={v.light} strokeWidth="3" strokeLinecap="round" opacity="0.5" />
    </>
  )
}

function BunTop({ w, h, seed, uid, sesame }: LayerRenderProps & { sesame: boolean }) {
  const v = visualFor('bun-top')
  const id = `${uid}-bunt`
  const seeds = useMemo(() => {
    if (!sesame) return []
    const rnd = createRandom(seed)
    return Array.from({ length: 11 }, () => ({
      x: 26 + rnd() * (w - 52),
      y: 14 + rnd() * (h * 0.44),
      r: 1.4 + rnd() * 0.9,
      a: rnd() * 60 - 30,
    }))
  }, [sesame, seed, w, h])

  return (
    <>
      <defs>
        <radialGradient id={id} cx="38%" cy="18%" r="85%">
          <stop offset="0%" stopColor={v.light} />
          <stop offset="52%" stopColor={v.color} />
          <stop offset="100%" stopColor={v.dark} />
        </radialGradient>
      </defs>
      <path
        d={`M0 ${n(h)} V${n(h * 0.58)} C0 ${n(h * 0.1)} ${n(w * 0.2)} 0 ${n(w / 2)} 0 C${n(w * 0.8)} 0 ${n(w)} ${n(h * 0.1)} ${n(w)} ${n(h * 0.58)} V${n(h)} Z`}
        fill={`url(#${id})`}
      />
      {/* Brilho de estúdio no topo do pão. */}
      <ellipse cx={w * 0.37} cy={h * 0.22} rx={w * 0.2} ry={h * 0.12} fill="#FFFFFF" opacity="0.16" />
      {seeds.map((s, i) => (
        <ellipse key={i} cx={s.x} cy={s.y} rx={s.r * 1.9} ry={s.r} fill="#F6E7C8" opacity="0.85" transform={`rotate(${s.a} ${s.x} ${s.y})`} />
      ))}
    </>
  )
}

function Sauce({ w, h, seed, uid, kind }: LayerRenderProps & { kind: IngredientKind }) {
  const v = visualFor(kind)
  const id = `${uid}-sauce`
  const d = useMemo(() => drippingBottom(w, h, 7, createRandom(seed)), [w, h, seed])
  return (
    <>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={v.light} />
          <stop offset="100%" stopColor={v.color} />
        </linearGradient>
      </defs>
      <path d={d} fill={`url(#${id})`} />
      <path d={`M4 1.5 H${n(w - 4)}`} stroke={v.light} strokeWidth="2" strokeLinecap="round" opacity="0.6" />
    </>
  )
}

function Leafy({ w, h, seed, kind }: LayerRenderProps & { kind: 'lettuce' | 'arugula' }) {
  const v = visualFor(kind)
  const bumps = kind === 'lettuce' ? 9 : 13
  const shape = useMemo(
    () => ({
      outer: ruffledTop(w, h, bumps, createRandom(seed)),
      inner: ruffledTop(w, h * 0.72, bumps, createRandom(`${seed}-inner`)),
    }),
    [w, h, bumps, seed],
  )
  return (
    <>
      <path d={shape.outer} fill={v.color} />
      <path d={shape.inner} fill={v.light} opacity="0.55" />
      <path d={`M0 ${n(h - 2)} H${n(w)}`} stroke={v.dark} strokeWidth="2.5" strokeLinecap="round" opacity="0.55" />
    </>
  )
}

function Tomato({ w, h, uid }: LayerRenderProps) {
  const v = visualFor('tomato')
  const id = `${uid}-tom`
  const sliceW = (w - 10) / 2
  return (
    <>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={v.light} />
          <stop offset="100%" stopColor={v.color} />
        </linearGradient>
      </defs>
      {[0, 1].map((i) => {
        const x = i * (sliceW + 10)
        return (
          <g key={i}>
            <rect x={x} y="0" width={sliceW} height={h} rx={h / 2} fill={`url(#${id})`} />
            <rect x={x + 7} y={h * 0.3} width={sliceW - 14} height={h * 0.4} rx={h * 0.2} fill={v.light} opacity="0.5" />
            <rect x={x} y={h - 3} width={sliceW} height="3" rx="1.5" fill={v.dark} opacity="0.4" />
          </g>
        )
      })}
    </>
  )
}

function Patty({ w, h, seed, uid, kind }: LayerRenderProps & { kind: 'patty-beef' | 'patty-smash' }) {
  const v = visualFor(kind)
  const id = `${uid}-patty`
  const shape = useMemo(() => {
    const rnd = createRandom(seed)
    return {
      outline: proteinOutline(w, h, rnd),
      texture: Array.from({ length: kind === 'patty-beef' ? 34 : 22 }, () => ({
        x: 8 + rnd() * (w - 16),
        y: h * 0.18 + rnd() * h * 0.64,
        r: 0.9 + rnd() * 1.5,
      })),
    }
  }, [w, h, seed, kind])
  return (
    <>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={v.light} />
          <stop offset="45%" stopColor={v.color} />
          <stop offset="100%" stopColor={v.dark} />
        </linearGradient>
      </defs>
      <path d={shape.outline} fill={`url(#${id})`} />
      {shape.texture.map((t, i) => (
        <circle key={i} cx={t.x} cy={t.y} r={t.r} fill={v.dark} opacity="0.4" />
      ))}
      {/* Crosta tostada na borda inferior. */}
      <path d={`M10 ${n(h - 2.5)} H${n(w - 10)}`} stroke={v.dark} strokeWidth="3" strokeLinecap="round" opacity="0.65" />
    </>
  )
}

function ChickenFillet({ w, h, seed, uid }: LayerRenderProps) {
  const v = visualFor('patty-chicken')
  const id = `${uid}-chk`
  const shape = useMemo(() => {
    const rnd = createRandom(seed)
    return {
      outline: proteinOutline(w, h, rnd, { amplitude: 0.34, bumpyBottom: true }),
      crumbs: Array.from({ length: 64 }, () => ({
        x: 7 + rnd() * (w - 14),
        y: 5 + rnd() * (h - 10),
        r: 1.1 + rnd() * 2.2,
        tone: rnd(),
      })),
    }
  }, [w, h, seed])
  return (
    <>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={v.light} />
          <stop offset="60%" stopColor={v.color} />
          <stop offset="100%" stopColor={v.dark} />
        </linearGradient>
      </defs>
      {/* Contorno irregular, próprio de um filé empanado. */}
      <path d={shape.outline} fill={`url(#${id})`} />
      {shape.crumbs.map((c, i) => (
        <circle key={i} cx={c.x} cy={c.y} r={c.r} fill={c.tone > 0.5 ? v.light : v.dark} opacity={c.tone > 0.5 ? 0.55 : 0.4} />
      ))}
    </>
  )
}

function CheeseSlice({ w, h, seed, uid, kind }: LayerRenderProps & { kind: 'cheese-cheddar' | 'cheese-prato' }) {
  const v = visualFor(kind)
  const id = `${uid}-chz`
  const d = useMemo(() => drippingBottom(w, h, 6, createRandom(seed)), [w, h, seed])
  return (
    <>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={v.light} />
          <stop offset="100%" stopColor={v.color} />
        </linearGradient>
      </defs>
      <path d={d} fill={`url(#${id})`} />
      <path d={`M10 1.5 H${n(w - 10)}`} stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" opacity="0.35" />
    </>
  )
}

function BlueCheese({ w, h, seed }: LayerRenderProps) {
  const v = visualFor('cheese-blue')
  const chunks = useMemo(() => {
    const rnd = createRandom(seed)
    const count = 7
    const step = w / count
    return Array.from({ length: count }, (_, i) => ({
      x: i * step + rnd() * 6,
      y: rnd() * (h * 0.3),
      w: step * (0.8 + rnd() * 0.4),
      h: h * (0.6 + rnd() * 0.4),
      veins: Array.from({ length: 3 }, () => ({ dx: rnd(), dy: rnd(), len: 0.3 + rnd() * 0.5 })),
    }))
  }, [w, h, seed])
  return (
    <g>
      {chunks.map((c, i) => (
        <g key={i}>
          <rect x={c.x} y={c.y} width={c.w} height={c.h} rx={3.5} fill={v.color} />
          <rect x={c.x} y={c.y} width={c.w} height={c.h * 0.4} rx={3.5} fill={v.light} opacity="0.7" />
          {c.veins.map((vein, j) => (
            <path
              key={j}
              d={`M${n(c.x + vein.dx * c.w * 0.7)} ${n(c.y + vein.dy * c.h * 0.7)} q${n(c.w * 0.14)} ${n(c.h * vein.len * 0.5)} ${n(c.w * vein.len * 0.4)} ${n(c.h * 0.1)}`}
              stroke="#5E6E8C"
              strokeWidth="1.5"
              strokeLinecap="round"
              fill="none"
              opacity="0.75"
            />
          ))}
          <rect x={c.x} y={c.y + c.h - 2} width={c.w} height="2" rx="1" fill={v.dark} opacity="0.5" />
        </g>
      ))}
    </g>
  )
}

function Bacon({ w, h, seed, uid }: LayerRenderProps) {
  const v = visualFor('bacon')
  const id = `${uid}-bcn`
  const paths = useMemo(() => {
    const rnd = createRandom(seed)
    return [0, 1].map((s) => {
      const y = s * (h * 0.46)
      const waves = 6
      const step = w / waves
      let d = `M0 ${n(y + h * 0.26)}`
      for (let i = 0; i < waves; i += 1) {
        const x = i * step
        const amp = (rnd() - 0.4) * h * 0.4
        d += ` Q${n(x + step * 0.5)} ${n(y + h * 0.26 + amp)} ${n(x + step)} ${n(y + h * 0.26)}`
      }
      return d
    })
  }, [w, h, seed])
  return (
    <>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={v.dark} />
          <stop offset="30%" stopColor={v.color} />
          <stop offset="62%" stopColor={v.light} />
          <stop offset="100%" stopColor={v.color} />
        </linearGradient>
      </defs>
      {paths.map((d, i) => (
        <path key={i} d={d} stroke={`url(#${id})`} strokeWidth={h * 0.42} strokeLinecap="round" fill="none" opacity={i === 0 ? 1 : 0.92} />
      ))}
    </>
  )
}

function OnionRaw({ w, h, seed }: LayerRenderProps) {
  const v = visualFor('onion-raw')
  const bits = useMemo(() => {
    const rnd = createRandom(seed)
    return Array.from({ length: 26 }, () => ({
      x: 4 + rnd() * (w - 12),
      y: rnd() * (h - 6),
      s: 3.5 + rnd() * 3.5,
      a: rnd() * 90,
    }))
  }, [w, h, seed])
  return (
    <g>
      {bits.map((b, i) => (
        <rect
          key={i}
          x={b.x}
          y={b.y}
          width={b.s}
          height={b.s * 0.75}
          rx="1.2"
          fill={i % 3 === 0 ? v.light : v.color}
          stroke={v.dark}
          strokeWidth="0.6"
          transform={`rotate(${b.a} ${b.x} ${b.y})`}
        />
      ))}
    </g>
  )
}

function OnionCaramelized({ w, h, seed }: LayerRenderProps) {
  const v = visualFor('onion-caramelized')
  const strands = useMemo(() => {
    const rnd = createRandom(seed)
    return Array.from({ length: 9 }, (_, i) => ({
      x: (i * w) / 9 + rnd() * 8,
      y: 2 + rnd() * (h - 8),
      len: w * (0.1 + rnd() * 0.14),
      curve: (rnd() - 0.5) * h * 1.2,
    }))
  }, [w, h, seed])
  return (
    <g>
      {strands.map((s, i) => (
        <path
          key={i}
          d={`M${n(s.x)} ${n(s.y)} q${n(s.len / 2)} ${n(s.curve)} ${n(s.len)} 0`}
          stroke={i % 2 === 0 ? v.color : v.light}
          strokeWidth={h * 0.3}
          strokeLinecap="round"
          fill="none"
        />
      ))}
    </g>
  )
}

/* -------------------------------------------------------------------------- */
/*  Despacho                                                                   */
/* -------------------------------------------------------------------------- */

function LayerShape({ kind, props, sesame }: { kind: IngredientKind; props: LayerRenderProps; sesame: boolean }) {
  switch (kind) {
    case 'bun-bottom':
      return <BunBottom {...props} />
    case 'bun-top':
      return <BunTop {...props} sesame={sesame} />
    case 'sauce-house':
    case 'sauce-bbq':
    case 'sauce-garlic':
    case 'sauce-mayo-herbs':
      return <Sauce {...props} kind={kind} />
    case 'lettuce':
    case 'arugula':
      return <Leafy {...props} kind={kind} />
    case 'tomato':
      return <Tomato {...props} />
    case 'patty-beef':
    case 'patty-smash':
      return <Patty {...props} kind={kind} />
    case 'patty-chicken':
      return <ChickenFillet {...props} />
    case 'cheese-cheddar':
    case 'cheese-prato':
      return <CheeseSlice {...props} kind={kind} />
    case 'cheese-blue':
      return <BlueCheese {...props} />
    case 'bacon':
      return <Bacon {...props} />
    case 'onion-raw':
      return <OnionRaw {...props} />
    case 'onion-caramelized':
      return <OnionCaramelized {...props} />
    default:
      return null
  }
}

/* -------------------------------------------------------------------------- */
/*  Componente público                                                         */
/* -------------------------------------------------------------------------- */

export interface BurgerIllustrationProps {
  /** Ingredientes do produto, de baixo para cima. */
  ingredients: Ingredient[]
  /** Semente determinística (use o id do produto) para a textura. */
  seed: string
  /** Separa as camadas no eixo vertical. */
  exploded?: boolean
  /** Ingrediente destacado, sincronizado com a lista de ingredientes. */
  highlightedId?: string | null
  /** Ids de ingredientes retirados pelo cliente — não são desenhados. */
  removedIds?: readonly string[]
  className?: string
}

export function BurgerIllustration({
  ingredients,
  seed,
  exploded = false,
  highlightedId = null,
  removedIds = [],
  className,
}: BurgerIllustrationProps) {
  const rawUid = useId()
  const uid = useMemo(() => rawUid.replace(/[^a-zA-Z0-9-]/g, ''), [rawUid])

  const visible = useMemo(
    () => ingredients.filter((ingredient) => !removedIds.includes(ingredient.id)),
    [ingredients, removedIds],
  )

  /**
   * Posiciona cada camada. A lista vem de baixo para cima, então o cálculo
   * acontece de baixo para cima e a coordenada é convertida para o eixo Y do
   * SVG (que cresce para baixo) no final.
   */
  const layout = useMemo(() => {
    const gap = exploded ? EXPLODE_GAP : 0
    let cursor = 0
    const placed = visible.map((ingredient) => {
      const v = visualFor(ingredient.kind)
      const yFromBottom = cursor
      cursor += v.height - (exploded ? 0 : v.overlap) + gap
      return { ingredient, visual: v, yFromBottom }
    })
    const stackHeight = Math.max(cursor - gap, 1)
    const totalHeight = stackHeight + PADDING * 2
    return {
      layers: placed.map((layer) => ({
        ...layer,
        y: totalHeight - PADDING - layer.yFromBottom - layer.visual.height,
      })),
      totalHeight,
    }
  }, [visible, exploded])

  return (
    <svg
      viewBox={`0 0 ${VIEW_WIDTH} ${layout.totalHeight}`}
      className={className}
      role="img"
      aria-label={`Ilustração em camadas do hambúrguer, de baixo para cima: ${visible.map((i) => i.name).join('; ')}.`}
      style={{ overflow: 'visible' }}
    >
      {/* Sombra de contato, só na composição montada. */}
      {!exploded && (
        <ellipse cx={CENTER_X} cy={layout.totalHeight - PADDING + 4} rx={118} ry={11} fill="#000000" opacity="0.5" />
      )}
      {layout.layers.map(({ ingredient, visual, y }) => {
        const isDimmed = highlightedId !== null && highlightedId !== ingredient.id
        const isHighlighted = highlightedId === ingredient.id
        return (
          <g
            key={ingredient.id}
            transform={`translate(${CENTER_X - visual.width / 2} ${y})`}
            style={{
              opacity: isDimmed ? 0.28 : 1,
              transition: 'opacity 0.22s var(--ease-brasa), filter 0.22s var(--ease-brasa)',
              filter: isHighlighted ? 'drop-shadow(0 0 10px rgba(232,117,50,0.85))' : undefined,
            }}
          >
            <LayerShape
              kind={ingredient.kind}
              sesame={/gergelim/i.test(ingredient.name)}
              props={{
                w: visual.width,
                h: visual.height,
                seed: `${seed}-${ingredient.id}`,
                uid: `${uid}-${ingredient.id}`,
              }}
            />
          </g>
        )
      })}
    </svg>
  )
}
