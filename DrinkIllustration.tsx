import { useId, useMemo } from 'react'
import { getDrink } from '../data/drinks'
import type { DrinkId } from '../types/catalog'

/**
 * Ilustração vetorial de uma bebida.
 *
 * É uma representação GENÉRICA: garrafa, lata ou copo com a cor da bebida.
 * Não reproduz rótulos, logotipos nem embalagens de marca — desenhar algo
 * parecido com a embalagem de um fabricante confundiria o cliente sobre o que
 * ele está comprando. O nome da bebida aparece escrito ao lado, no card.
 *
 * Para mostrar as embalagens reais, o restaurante deve usar as próprias
 * fotografias.
 */
export function DrinkIllustration({ drinkId, className }: { drinkId: DrinkId; className?: string }) {
  const rawUid = useId()
  const uid = useMemo(() => rawUid.replace(/[^a-zA-Z0-9-]/g, ''), [rawUid])
  const drink = getDrink(drinkId)
  if (!drink) return null

  const { liquidColor, vessel, name } = drink
  const gradientId = `${uid}-liquid`
  const glassId = `${uid}-glass`

  return (
    <svg
      viewBox="0 0 160 240"
      className={className}
      role="img"
      aria-label={`Ilustração genérica de ${name}. Não representa a embalagem da marca.`}
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={liquidColor} stopOpacity="0.75" />
          <stop offset="38%" stopColor={liquidColor} />
          <stop offset="72%" stopColor={liquidColor} stopOpacity="0.82" />
          <stop offset="100%" stopColor={liquidColor} stopOpacity="0.6" />
        </linearGradient>
        <linearGradient id={glassId} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.26" />
          <stop offset="45%" stopColor="#ffffff" stopOpacity="0.04" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0.18" />
        </linearGradient>
      </defs>

      <ellipse cx="80" cy="222" rx="42" ry="8" fill="#000" opacity="0.45" />

      {vessel === 'lata' && (
        <>
          {/* Corpo da lata. */}
          <path d="M50 54 Q50 46 58 44 H102 Q110 46 110 54 V196 Q110 206 100 208 H60 Q50 206 50 196 Z" fill={`url(#${gradientId})`} />
          {/* Tampa. */}
          <ellipse cx="80" cy="48" rx="30" ry="8" fill="#b9bec6" />
          <ellipse cx="80" cy="47" rx="25" ry="6" fill="#8e949d" />
          <rect x="72" y="43" width="16" height="4" rx="2" fill="#6d737c" />
          {/* Brilho do alumínio. */}
          <rect x="54" y="56" width="52" height="146" fill={`url(#${glassId})`} />
          <rect x="58" y="60" width="7" height="138" rx="3.5" fill="#ffffff" opacity="0.2" />
          <ellipse cx="80" cy="204" rx="30" ry="7" fill="#000" opacity="0.22" />
        </>
      )}

      {vessel === 'garrafa' && (
        <>
          {/* Gargalo, ombro e corpo. */}
          <path d="M68 26 H92 V52 Q92 60 100 70 Q110 84 110 100 V194 Q110 206 98 208 H62 Q50 206 50 194 V100 Q50 84 60 70 Q68 60 68 52 Z" fill={`url(#${gradientId})`} />
          <rect x="66" y="18" width="28" height="12" rx="3" fill="#2f6fa8" />
          {/* Faixa transparente do rótulo, sem marca. */}
          <rect x="52" y="112" width="56" height="44" rx="4" fill="#ffffff" opacity="0.14" />
          <rect x="54" y="74" width="52" height="128" fill={`url(#${glassId})`} />
          <rect x="58" y="80" width="6" height="118" rx="3" fill="#ffffff" opacity="0.26" />
        </>
      )}

      {vessel === 'copo' && (
        <>
          {/* Copo levemente cônico. */}
          <path d="M48 58 H112 L104 204 Q103 212 95 212 H65 Q57 212 56 204 Z" fill={`url(#${gradientId})`} />
          {/* Linha do líquido. */}
          <ellipse cx="80" cy="58" rx="32" ry="9" fill={liquidColor} />
          <ellipse cx="80" cy="58" rx="32" ry="9" fill="#ffffff" opacity="0.2" />
          <path d="M48 58 H112 L104 204 Q103 212 95 212 H65 Q57 212 56 204 Z" fill={`url(#${glassId})`} />
          <rect x="60" y="70" width="7" height="124" rx="3.5" fill="#ffffff" opacity="0.22" />
          {/* Canudo. */}
          <rect x="92" y="28" width="7" height="42" rx="3.5" fill="#f5ebdd" opacity="0.85" transform="rotate(12 95 49)" />
        </>
      )}
    </svg>
  )
}
