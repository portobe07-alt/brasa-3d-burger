const BRL = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  minimumFractionDigits: 2,
})

/** Formata um valor em centavos como real brasileiro (ex.: 2990 → "R$ 29,90"). */
export function formatBRL(cents: number): string {
  return BRL.format(cents / 100)
}

/** Formata um acréscimo, sempre com sinal (ex.: 500 → "+ R$ 5,00"). */
export function formatDelta(cents: number): string {
  const sign = cents < 0 ? '−' : '+'
  return `${sign} ${BRL.format(Math.abs(cents) / 100)}`
}
