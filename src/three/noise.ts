/**
 * Ruído determinístico para dar irregularidade orgânica às geometrias.
 *
 * Nada aqui depende de `Math.random`: a mesma semente produz sempre a mesma
 * peça, então um hambúrguer não muda de aparência a cada renderização nem
 * entre sessões.
 */

/** Hash inteiro de 32 bits, base de todo o resto. */
function hash(x: number): number {
  let h = Math.imul(x ^ (x >>> 16), 2246822507)
  h = Math.imul(h ^ (h >>> 13), 3266489909)
  return (h ^ (h >>> 16)) >>> 0
}

/** Converte uma semente em texto num inteiro estável (FNV-1a). */
export function seedToInt(seed: string): number {
  let h = 2166136261
  for (let i = 0; i < seed.length; i += 1) {
    h ^= seed.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

/** Gerador pseudoaleatório sequencial, para distribuir peças soltas. */
export function createRandom(seed: string | number): () => number {
  let state = (typeof seed === 'string' ? seedToInt(seed) : seed) || 1
  return () => {
    state ^= state << 13
    state ^= state >>> 17
    state ^= state << 5
    return ((state >>> 0) % 1000000) / 1000000
  }
}

/** Valor em [-1, 1] nos pontos inteiros da grade. */
function latticeValue(ix: number, iy: number, iz: number, seed: number): number {
  const h = hash(ix * 374761393 + iy * 668265263 + iz * 2147483647 + seed)
  return (h % 2000000) / 1000000 - 1
}

const smooth = (t: number) => t * t * (3 - 2 * t)
const lerp = (a: number, b: number, t: number) => a + (b - a) * t

/** Ruído de valor 3D, contínuo e suave, em [-1, 1]. */
export function valueNoise3(x: number, y: number, z: number, seed = 0): number {
  const ix = Math.floor(x)
  const iy = Math.floor(y)
  const iz = Math.floor(z)
  const fx = smooth(x - ix)
  const fy = smooth(y - iy)
  const fz = smooth(z - iz)

  const c = (dx: number, dy: number, dz: number) => latticeValue(ix + dx, iy + dy, iz + dz, seed)

  const x00 = lerp(c(0, 0, 0), c(1, 0, 0), fx)
  const x10 = lerp(c(0, 1, 0), c(1, 1, 0), fx)
  const x01 = lerp(c(0, 0, 1), c(1, 0, 1), fx)
  const x11 = lerp(c(0, 1, 1), c(1, 1, 1), fx)

  return lerp(lerp(x00, x10, fy), lerp(x01, x11, fy), fz)
}

/** Soma de oitavas: detalhe grosso e fino ao mesmo tempo. */
export function fbm3(x: number, y: number, z: number, seed = 0, octaves = 3): number {
  let sum = 0
  let amplitude = 1
  let frequency = 1
  let norm = 0
  for (let i = 0; i < octaves; i += 1) {
    sum += valueNoise3(x * frequency, y * frequency, z * frequency, seed + i * 1013) * amplitude
    norm += amplitude
    amplitude *= 0.5
    frequency *= 2.07
  }
  return sum / norm
}

/**
 * Ruído periódico no ângulo: o valor em θ e em θ+2π é o mesmo.
 * Indispensável para bordas irregulares de peças redondas — sem isso aparece
 * uma emenda visível onde a volta se fecha.
 */
export function angularNoise(theta: number, seed = 0, frequency = 4): number {
  return valueNoise3(Math.cos(theta) * frequency, Math.sin(theta) * frequency, 0, seed)
}
