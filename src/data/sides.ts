import type { FriesSize, FriesVariant, FriesVariantId } from '../types/catalog'

/**
 * Batatas fritas.
 *
 * O preço sai de duas tabelas, não de nove valores soltos: o preço da batata
 * tradicional por tamanho, mais um acréscimo por variação. É exatamente a
 * regra comercial informada (as versões com queijo e com queijo e bacon custam
 * R$ 2,00 a mais que a tradicional do mesmo tamanho), então ajustar um tamanho
 * continua produzindo a tabela certa.
 *
 *                          P          M          G
 *   Tradicional        R$  7,00   R$ 10,00   R$ 12,00
 *   Com queijo         R$  9,00   R$ 12,00   R$ 14,00
 *   Com queijo e bacon R$  9,00   R$ 12,00   R$ 14,00
 */

/** Preço da batata tradicional por tamanho, em centavos. */
export const FRIES_BASE_PRICE: Record<FriesSize, number> = {
  P: 700,
  M: 1000,
  G: 1200,
}

export const FRIES_SIZES: { id: FriesSize; name: string; shortName: string }[] = [
  { id: 'P', name: 'Pequena', shortName: 'P' },
  { id: 'M', name: 'Média', shortName: 'M' },
  { id: 'G', name: 'Grande', shortName: 'G' },
]

export const FRIES_VARIANTS: FriesVariant[] = [
  {
    id: 'tradicional',
    name: 'Batata frita tradicional',
    description: 'Batatas crocantes por fora e macias por dentro, com sal.',
    surcharge: 0,
  },
  {
    id: 'queijo',
    name: 'Batata frita com queijo',
    description: 'Batatas crocantes cobertas com cheddar cremoso derretido.',
    surcharge: 200,
  },
  {
    id: 'queijo-bacon',
    name: 'Batata frita com queijo e bacon',
    description: 'Batatas crocantes com cheddar derretido e bacon em cubos.',
    surcharge: 200,
  },
]

const VARIANT_BY_ID = new Map<FriesVariantId, FriesVariant>(
  FRIES_VARIANTS.map((variant) => [variant.id, variant]),
)

export function getFriesVariant(id: FriesVariantId): FriesVariant | undefined {
  return VARIANT_BY_ID.get(id)
}

/** Preço de uma porção, em centavos. Fonte única para toda a aplicação. */
export function friesPrice(variantId: FriesVariantId, size: FriesSize): number {
  const variant = VARIANT_BY_ID.get(variantId)
  if (!variant) return 0
  return FRIES_BASE_PRICE[size] + variant.surcharge
}

/** Nome exibido de uma porção, ex.: "Batata frita com queijo (M)". */
export function friesLabel(variantId: FriesVariantId, size: FriesSize): string {
  const variant = VARIANT_BY_ID.get(variantId)
  return variant ? `${variant.name} (${size})` : 'Batata frita'
}
