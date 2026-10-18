import { useId, useMemo } from 'react'
import type { FriesVariantId } from '../types/catalog'

/**
 * Ilustração vetorial de uma porção de batata frita.
 *
 * Desenhada a partir da variação escolhida: a tradicional mostra só as
 * batatas; a com queijo ganha cheddar escorrendo; a com queijo e bacon ganha
 * também cubos de bacon. É uma ILUSTRAÇÃO, não fotografia.
 *
 * Determinística: a mesma variação é sempre desenhada igual.
 */

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

const n = (value: number) => value.toFixed(1)

interface Stick {
  x: number
  y: number
  length: number
  width: number
  angle: number
  tone: number
}

export function FriesIllustration({
  variantId,
  className,
}: {
  variantId: FriesVariantId
  className?: string
}) {
  const rawUid = useId()
  const uid = useMemo(() => rawUid.replace(/[^a-zA-Z0-9-]/g, ''), [rawUid])

  const withCheese = variantId !== 'tradicional'
  const withBacon = variantId === 'queijo-bacon'

  const { sticks, cheese, bacon } = useMemo(() => {
    const rnd = createRandom(`fries-${variantId}`)

    // Palitos espalhados num monte: os de trás mais altos e inclinados.
    const sticks: Stick[] = Array.from({ length: 26 }, (_, i) => {
      const depth = i / 26
      return {
        x: 44 + rnd() * 152,
        y: 92 + depth * 44 + rnd() * 16,
        length: 54 + rnd() * 46,
        width: 11 + rnd() * 4,
        angle: (rnd() - 0.5) * 78,
        tone: rnd(),
      }
    })

    // Fios de cheddar escorrendo por cima do monte. Os limites mantêm o queijo
    // sobre as batatas — fora deles ele aparecia flutuando ao lado da porção.
    const cheese = Array.from({ length: 10 }, () => ({
      x: 58 + rnd() * 92,
      y: 100 + rnd() * 44,
      w: 20 + rnd() * 34,
      drip: 10 + rnd() * 22,
    }))

    const bacon = Array.from({ length: 16 }, () => ({
      x: 58 + rnd() * 112,
      y: 98 + rnd() * 52,
      s: 7 + rnd() * 5,
      a: rnd() * 90,
    }))

    return { sticks, cheese, bacon }
  }, [variantId])

  return (
    <svg
      viewBox="0 0 240 240"
      className={className}
      role="img"
      aria-label={
        withBacon
          ? 'Ilustração de batata frita com queijo cheddar derretido e bacon.'
          : withCheese
            ? 'Ilustração de batata frita com queijo cheddar derretido.'
            : 'Ilustração de batata frita tradicional.'
      }
    >
      <defs>
        <linearGradient id={`${uid}-box`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#e3853a" />
          <stop offset="100%" stopColor="#b8551d" />
        </linearGradient>
        <linearGradient id={`${uid}-cheddar`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffc256" />
          <stop offset="100%" stopColor="#e8941f" />
        </linearGradient>
      </defs>

      {/* Sombra de contato. */}
      <ellipse cx="120" cy="214" rx="74" ry="10" fill="#000" opacity="0.45" />

      {/* Palitos de trás. */}
      {sticks.slice(0, 13).map((stick, i) => (
        <g key={`back-${i}`} transform={`rotate(${n(stick.angle)} ${n(stick.x)} ${n(stick.y)})`}>
          <rect
            x={stick.x - stick.width / 2}
            y={stick.y - stick.length}
            width={stick.width}
            height={stick.length}
            rx={stick.width * 0.34}
            fill={stick.tone > 0.5 ? '#e0a63f' : '#cf8f2d'}
          />
          <rect
            x={stick.x - stick.width / 2 + 2}
            y={stick.y - stick.length + 3}
            width={stick.width * 0.32}
            height={stick.length - 7}
            rx={2}
            fill="#f6d089"
            opacity="0.55"
          />
        </g>
      ))}

      {/* Embalagem. */}
      <path d="M62 136 H178 L166 206 Q164 214 156 214 H84 Q76 214 74 206 Z" fill={`url(#${uid}-box)`} />
      <path d="M62 136 H178 L175 154 H65 Z" fill="#ffffff" opacity="0.14" />

      {/* Palitos da frente, saindo da embalagem. */}
      {sticks.slice(13).map((stick, i) => (
        <g key={`front-${i}`} transform={`rotate(${n(stick.angle * 0.6)} ${n(stick.x)} ${n(stick.y)})`}>
          <rect
            x={stick.x - stick.width / 2}
            y={stick.y - stick.length}
            width={stick.width}
            height={stick.length}
            rx={stick.width * 0.34}
            fill={stick.tone > 0.5 ? '#edb552' : '#dc9b35'}
          />
          <rect
            x={stick.x - stick.width / 2 + 2}
            y={stick.y - stick.length + 3}
            width={stick.width * 0.3}
            height={stick.length - 7}
            rx={2}
            fill="#fbdfa2"
            opacity="0.6"
          />
        </g>
      ))}

      {/* Cheddar derretido. */}
      {withCheese &&
        cheese.map((blob, i) => (
          <path
            key={`cheese-${i}`}
            d={`M${n(blob.x)} ${n(blob.y)} h${n(blob.w)} q${n(blob.w * 0.12)} ${n(blob.drip)} ${n(-blob.w * 0.3)} ${n(blob.drip)} q${n(-blob.w * 0.3)} ${n(2)} ${n(-blob.w * 0.7)} ${n(-blob.drip * 0.55)} Z`}
            fill={`url(#${uid}-cheddar)`}
            opacity="0.95"
          />
        ))}

      {/* Bacon em cubos. */}
      {withBacon &&
        bacon.map((bit, i) => (
          <g key={`bacon-${i}`} transform={`rotate(${n(bit.a)} ${n(bit.x)} ${n(bit.y)})`}>
            <rect x={bit.x} y={bit.y} width={bit.s} height={bit.s * 0.7} rx="1.6" fill="#9e3a22" />
            <rect x={bit.x} y={bit.y} width={bit.s} height={bit.s * 0.26} rx="1.2" fill="#cf7a5c" opacity="0.9" />
          </g>
        ))}
    </svg>
  )
}
