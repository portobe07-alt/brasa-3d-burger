import * as THREE from 'three'
import { mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import type { IngredientKind } from '../types/product'
import { specFor, type IngredientSpec } from './ingredientSpecs'
import { angularNoise, createRandom, fbm3, seedToInt } from './noise'

/**
 * Construtores de geometria dos ingredientes.
 *
 * Cada peça é uma malha 3D de verdade, gerada proceduralmente: perfis de
 * revolução para pães e carnes, superfícies radiais onduladas para folhas e
 * molhos, fatias que escorrem para o queijo, tiras torcidas para o bacon.
 * Não há plano com imagem fingindo volume.
 *
 * A irregularidade vem de ruído determinístico semeado pelo id da peça, então
 * o mesmo hambúrguer é sempre idêntico, mas duas carnes do mesmo prato têm
 * bordas diferentes — como na chapa.
 */

const RADIAL_SEGMENTS = 72

/**
 * Solda vértices coincidentes.
 *
 * `LatheGeometry` duplica a coluna onde a volta se fecha. Sem soldar, as
 * normais dos dois lados dessa emenda não batem e aparece uma linha vertical
 * de iluminação no meio do pão.
 */
function weld(geometry: THREE.BufferGeometry): THREE.BufferGeometry {
  // `mergeVertices` compara todos os atributos. Os dois lados da emenda têm a
  // mesma posição mas u=0 e u=1, então nunca seriam unidos enquanto a UV
  // existir. Nenhuma peça usa textura, então a UV pode sair.
  geometry.deleteAttribute('uv')
  const welded = mergeVertices(geometry, 1e-4)
  if (welded !== geometry) geometry.dispose()
  welded.computeVertexNormals()
  return welded
}

/* -------------------------------------------------------------------------- */
/*  Utilitários de malha                                                       */
/* -------------------------------------------------------------------------- */

/**
 * Empurra os vértices para fora no plano horizontal, conforme o ângulo.
 * É o que cria bordas irregulares em peças redondas sem deixar emenda.
 */
function applyRadialNoise(
  geometry: THREE.BufferGeometry,
  { amplitude, frequency, seed, falloff }: {
    amplitude: number
    frequency: number
    seed: number
    /** Peso do deslocamento conforme a altura relativa (0 base, 1 topo). */
    falloff?: (t: number) => number
  },
): void {
  const position = geometry.attributes.position as THREE.BufferAttribute
  geometry.computeBoundingBox()
  const box = geometry.boundingBox!
  const height = Math.max(box.max.y - box.min.y, 1e-6)

  for (let i = 0; i < position.count; i += 1) {
    const x = position.getX(i)
    const y = position.getY(i)
    const z = position.getZ(i)
    const radius = Math.hypot(x, z)
    if (radius < 1e-4) continue

    const theta = Math.atan2(z, x)
    const t = (y - box.min.y) / height
    const weight = falloff ? falloff(t) : 1
    const offset = angularNoise(theta, seed, frequency) * amplitude * weight
    const scale = (radius + offset) / radius

    position.setX(i, x * scale)
    position.setZ(i, z * scale)
  }
  position.needsUpdate = true
  geometry.computeVertexNormals()
}

/** Desloca os vértices ao longo da própria normal, para relevo orgânico. */
function applySurfaceNoise(
  geometry: THREE.BufferGeometry,
  { amplitude, frequency, seed, octaves = 2 }: {
    amplitude: number
    frequency: number
    seed: number
    octaves?: number
  },
): void {
  geometry.computeVertexNormals()
  const position = geometry.attributes.position as THREE.BufferAttribute
  const normal = geometry.attributes.normal as THREE.BufferAttribute

  for (let i = 0; i < position.count; i += 1) {
    const x = position.getX(i)
    const y = position.getY(i)
    const z = position.getZ(i)
    const n = fbm3(x * frequency, y * frequency, z * frequency, seed, octaves)
    position.setXYZ(
      i,
      x + normal.getX(i) * n * amplitude,
      y + normal.getY(i) * n * amplitude,
      z + normal.getZ(i) * n * amplitude,
    )
  }
  position.needsUpdate = true
  geometry.computeVertexNormals()
}

/**
 * Grava variação de cor por vértice. Multiplica a cor base do material, então
 * serve para tostado, veios e manchas sem precisar de arquivo de textura.
 */
function applyVertexTint(
  geometry: THREE.BufferGeometry,
  tint: (x: number, y: number, z: number, t: number) => number | [number, number, number],
): void {
  const position = geometry.attributes.position as THREE.BufferAttribute
  geometry.computeBoundingBox()
  const box = geometry.boundingBox!
  const height = Math.max(box.max.y - box.min.y, 1e-6)
  const colors = new Float32Array(position.count * 3)

  for (let i = 0; i < position.count; i += 1) {
    const x = position.getX(i)
    const y = position.getY(i)
    const z = position.getZ(i)
    const value = tint(x, y, z, (y - box.min.y) / height)
    if (typeof value === 'number') {
      colors[i * 3] = value
      colors[i * 3 + 1] = value
      colors[i * 3 + 2] = value
    } else {
      colors[i * 3] = value[0]
      colors[i * 3 + 1] = value[1]
      colors[i * 3 + 2] = value[2]
    }
  }
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
}

/** Superfície de revolução construída a partir de uma função de altura. */
function radialSurface(
  rings: number,
  segments: number,
  radiusAt: (ringT: number, theta: number) => number,
  heightAt: (radius: number, theta: number, ringT: number) => number,
): THREE.BufferGeometry {
  const positions: number[] = []
  const indices: number[] = []

  for (let ring = 0; ring <= rings; ring += 1) {
    const ringT = ring / rings
    for (let segment = 0; segment <= segments; segment += 1) {
      const theta = (segment / segments) * Math.PI * 2
      const radius = radiusAt(ringT, theta)
      positions.push(
        Math.cos(theta) * radius,
        heightAt(radius, theta, ringT),
        Math.sin(theta) * radius,
      )
    }
  }

  const stride = segments + 1
  for (let ring = 0; ring < rings; ring += 1) {
    for (let segment = 0; segment < segments; segment += 1) {
      const a = ring * stride + segment
      const b = a + stride
      indices.push(a, b, a + 1, a + 1, b, b + 1)
    }
  }

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geometry.setIndex(indices)
  geometry.computeVertexNormals()
  return geometry
}

/** Material padrão das peças, com variação de cor por vértice habilitada. */
function makeMaterial(spec: IngredientSpec, overrides: Partial<THREE.MeshStandardMaterialParameters> = {}) {
  return new THREE.MeshStandardMaterial({
    color: new THREE.Color(spec.color),
    roughness: spec.roughness,
    metalness: 0,
    vertexColors: true,
    envMapIntensity: spec.sheen ? 0.5 + spec.sheen * 0.45 : 0.45,
    ...overrides,
  })
}


function mesh(geometry: THREE.BufferGeometry, material: THREE.Material, name: string): THREE.Mesh {
  const result = new THREE.Mesh(geometry, material)
  result.castShadow = true
  result.receiveShadow = true
  result.name = name
  return result
}

/* -------------------------------------------------------------------------- */
/*  Pães                                                                       */
/* -------------------------------------------------------------------------- */

function buildBunBottom(spec: IngredientSpec, seed: number): THREE.Object3D {
  const r = spec.radius
  const h = spec.thickness
  // Perfil de revolução: base levemente abaulada, cintura e topo plano.
  const profile = [
    new THREE.Vector2(0, h * 0.06),
    new THREE.Vector2(r * 0.45, h * 0.015),
    new THREE.Vector2(r * 0.8, 0),
    new THREE.Vector2(r * 0.97, h * 0.16),
    new THREE.Vector2(r, h * 0.45),
    new THREE.Vector2(r * 0.985, h * 0.76),
    new THREE.Vector2(r * 0.94, h * 0.95),
    new THREE.Vector2(r * 0.6, h),
    new THREE.Vector2(0, h * 1.01),
  ]
  const geometry = weld(new THREE.LatheGeometry(profile, RADIAL_SEGMENTS))
  applyRadialNoise(geometry, { amplitude: r * 0.018, frequency: 3, seed, falloff: (t) => 0.4 + t * 0.6 })
  applySurfaceNoise(geometry, { amplitude: h * 0.05, frequency: 5.5, seed: seed + 7 })
  // Passada fina: o poro do pão. Em geometria, e não em `bumpMap`, porque a
  // UV é removida ao soldar a emenda do torno e a textura não seria amostrada.
  applySurfaceNoise(geometry, { amplitude: h * 0.012, frequency: 26, seed: seed + 71, octaves: 1 })
  // Assado mais escuro na parte alta e nas bordas.
  applyVertexTint(geometry, (x, y, z, t) => {
    const edge = Math.hypot(x, z) / r
    const patches = fbm3(x * 4.5, y * 4.5, z * 4.5, seed + 3, 2) * 0.15
    const grain = fbm3(x * 15, y * 15, z * 15, seed + 63, 2) * 0.06
    return 0.8 + t * 0.2 + edge * 0.08 + patches + grain
  })
  geometry.translate(0, -h / 2, 0)
  return mesh(geometry, makeMaterial(spec), 'pao-inferior')
}

/** Pontos de controle do perfil da cúpula, em fração de (raio, altura). */
const BUN_TOP_PROFILE: [number, number][] = [
  [0.6, 0],
  [0.9, 0.04],
  [1, 0.2],
  [0.985, 0.42],
  [0.9, 0.64],
  [0.72, 0.83],
  [0.44, 0.96],
  [0.2, 1.01],
  [0, 1.025],
]

/** Raio da cúpula do pão a uma dada altura relativa. */
function bunTopRadiusAt(t: number, radius: number): number {
  const clamped = Math.min(1.025, Math.max(0, t))
  for (let i = 0; i < BUN_TOP_PROFILE.length - 1; i += 1) {
    const [r0, t0] = BUN_TOP_PROFILE[i]
    const [r1, t1] = BUN_TOP_PROFILE[i + 1]
    if (clamped >= t0 && clamped <= t1) {
      const k = t1 === t0 ? 0 : (clamped - t0) / (t1 - t0)
      return (r0 + (r1 - r0) * k) * radius
    }
  }
  return 0
}

function buildBunTop(spec: IngredientSpec, seed: number, sesame: boolean): THREE.Object3D {
  const r = spec.radius
  const h = spec.thickness
  const profile = [
    new THREE.Vector2(0, 0),
    new THREE.Vector2(r * 0.6, 0),
    new THREE.Vector2(r * 0.9, h * 0.04),
    new THREE.Vector2(r, h * 0.2),
    new THREE.Vector2(r * 0.985, h * 0.42),
    new THREE.Vector2(r * 0.9, h * 0.64),
    new THREE.Vector2(r * 0.72, h * 0.83),
    new THREE.Vector2(r * 0.44, h * 0.96),
    new THREE.Vector2(r * 0.2, h * 1.01),
    new THREE.Vector2(0, h * 1.025),
  ]
  const geometry = weld(new THREE.LatheGeometry(profile, RADIAL_SEGMENTS))
  applyRadialNoise(geometry, { amplitude: r * 0.02, frequency: 3, seed, falloff: (t) => 1 - t * 0.5 })
  applySurfaceNoise(geometry, { amplitude: h * 0.035, frequency: 4.5, seed: seed + 11 })
  applySurfaceNoise(geometry, { amplitude: h * 0.008, frequency: 30, seed: seed + 73, octaves: 1 })
  applyVertexTint(geometry, (x, y, z, t) => {
    // Topo da cúpula pega mais forno; a saia fica mais clara. A amplitude
    // maior evita a cúpula chapada de massa uniforme.
    const bake = 0.76 + Math.pow(t, 1.3) * 0.44
    const patches = fbm3(x * 4.5, y * 4.5, z * 4.5, seed + 5, 2) * 0.17
    const grain = fbm3(x * 15, y * 15, z * 15, seed + 61, 2) * 0.07
    return bake + patches + grain
  })

  const group = new THREE.Group()
  group.name = 'pao-superior'
  group.add(mesh(geometry, makeMaterial(spec), 'pao-superior-massa'))

  if (sesame) {
    const count = 42
    const seedGeometry = new THREE.SphereGeometry(0.038, 8, 6)
    seedGeometry.scale(1.7, 0.62, 1)
    seedGeometry.setAttribute(
      'color',
      new THREE.BufferAttribute(new Float32Array(seedGeometry.attributes.position.count * 3).fill(1), 3),
    )
    const seedMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color('#f3e2c0'),
      roughness: 0.55,
      metalness: 0,
      vertexColors: true,
    })
    const seeds = new THREE.InstancedMesh(seedGeometry, seedMaterial, count)
    seeds.castShadow = true
    seeds.name = 'gergelim'

    const rnd = createRandom(seed + 991)
    const dummy = new THREE.Object3D()
    const normal = new THREE.Vector3()
    for (let i = 0; i < count; i += 1) {
      // Assenta cada semente SOBRE o perfil real da cúpula. Aproximar o pão
      // por um elipsoide deixava as sementes enterradas na massa.
      const t = 0.32 + rnd() * 0.66
      const azimuth = rnd() * Math.PI * 2
      const surfaceR = bunTopRadiusAt(t, r) * 1.004
      const surfaceY = t * h

      dummy.position.set(Math.cos(azimuth) * surfaceR, surfaceY, Math.sin(azimuth) * surfaceR)

      // Normal da superfície de revolução: inclinação do perfil naquele ponto.
      const step = 0.02
      const slope = (bunTopRadiusAt(t + step, r) - bunTopRadiusAt(t - step, r)) / (2 * step * h)
      normal.set(Math.cos(azimuth), -slope, Math.sin(azimuth)).normalize()
      dummy.lookAt(dummy.position.clone().add(normal))
      dummy.rotateZ(rnd() * Math.PI)
      dummy.updateMatrix()
      seeds.setMatrixAt(i, dummy.matrix)
    }
    seeds.instanceMatrix.needsUpdate = true
    group.add(seeds)
  }

  group.position.y = -h / 2
  const wrapper = new THREE.Group()
  wrapper.add(group)
  wrapper.name = 'pao-superior'
  return wrapper
}

/* -------------------------------------------------------------------------- */
/*  Proteínas                                                                  */
/* -------------------------------------------------------------------------- */

function buildPatty(spec: IngredientSpec, seed: number, smash: boolean): THREE.Object3D {
  const r = spec.radius
  const h = spec.thickness
  const profile = [
    new THREE.Vector2(0, 0),
    new THREE.Vector2(r * 0.86, 0),
    new THREE.Vector2(r * 0.99, h * 0.18),
    new THREE.Vector2(r, h * 0.5),
    new THREE.Vector2(r * 0.985, h * 0.82),
    new THREE.Vector2(r * 0.87, h),
    new THREE.Vector2(0, h * 1.02),
  ]
  const geometry = weld(new THREE.LatheGeometry(profile, RADIAL_SEGMENTS))

  // O smash é prensado: borda muito mais rendada e irregular.
  applyRadialNoise(geometry, {
    amplitude: r * (smash ? 0.042 : 0.03),
    frequency: smash ? 13 : 9,
    seed,
    falloff: (t) => 0.5 + Math.sin(t * Math.PI) * 0.8,
  })
  applySurfaceNoise(geometry, { amplitude: h * (smash ? 0.1 : 0.085), frequency: 6, seed: seed + 13, octaves: 3 })
  // Grão da carne moída, bem miúdo.
  applySurfaceNoise(geometry, { amplitude: h * 0.028, frequency: 34, seed: seed + 77, octaves: 1 })

  applyVertexTint(geometry, (x, y, z, t) => {
    const grain = fbm3(x * 9, y * 14, z * 9, seed + 17, 3)
    // Topo e borda pegam a chapa e ficam bem mais escuros que a lateral.
    const crust = 0.72 + Math.pow(t, 1.6) * 0.75 + Math.pow(Math.hypot(x, z) / r, 3) * 0.3

    // Marcas de grelha: faixas paralelas queimadas, visíveis só na face de
    // cima, onde a carne encostou na grelha.
    const onTop = Math.max(0, (t - 0.72) / 0.28)
    const bar = Math.sin((x * Math.cos(0.5) + z * Math.sin(0.5)) * 9.5)
    const sear = onTop * Math.max(0, bar - 0.45) * 0.85

    return Math.max(0.34, crust + grain * 0.2 - sear)
  })

  geometry.translate(0, -h / 2, 0)
  return mesh(geometry, makeMaterial(spec), smash ? 'smash-burger' : 'hamburguer')
}

function buildChicken(spec: IngredientSpec, seed: number): THREE.Object3D {
  const r = spec.radius
  const h = spec.thickness
  // Filé: esfera subdividida achatada e depois bastante deformada, para dar o
  // contorno torto característico de um empanado. O nível 4 (2.562 vértices)
  // já sustenta a granulação; o 5 quadruplicava o custo de construção sem
  // diferença visível.
  const geometry = new THREE.IcosahedronGeometry(1, 4)
  geometry.scale(r * 0.98, h * 0.5, r * 0.84)
  applySurfaceNoise(geometry, { amplitude: h * 0.3, frequency: 2.2, seed, octaves: 2 })
  // Granulação do empanamento, de alta frequência.
  applySurfaceNoise(geometry, { amplitude: h * 0.075, frequency: 13, seed: seed + 29, octaves: 2 })

  applyVertexTint(geometry, (x, y, z) => {
    const crumb = fbm3(x * 16, y * 16, z * 16, seed + 31, 2)
    return 0.84 + crumb * 0.3 + Math.max(0, y) * 0.3
  })

  return mesh(geometry, makeMaterial(spec), 'file-de-frango-empanado')
}

/* -------------------------------------------------------------------------- */
/*  Corte transversal da carne (escolha do ponto)                              */
/* -------------------------------------------------------------------------- */

/** Pontos de controle do perfil da carne, em fração de (raio, altura). */
const PATTY_PROFILE: [number, number][] = [
  [0.86, 0],
  [0.99, 0.18],
  [1, 0.5],
  [0.985, 0.82],
  [0.87, 1],
]

/** Raio externo da carne a uma dada altura relativa. */
function pattyRadiusAt(t: number, radius: number): number {
  const clamped = Math.min(1, Math.max(0, t))
  for (let i = 0; i < PATTY_PROFILE.length - 1; i += 1) {
    const [r0, t0] = PATTY_PROFILE[i]
    const [r1, t1] = PATTY_PROFILE[i + 1]
    if (clamped >= t0 && clamped <= t1) {
      const k = t1 === t0 ? 0 : (clamped - t0) / (t1 - t0)
      return (r0 + (r1 - r0) * k) * radius
    }
  }
  return PATTY_PROFILE[PATTY_PROFILE.length - 1][0] * radius
}

/**
 * Aparência do interior conforme o ponto.
 *
 * `crustDepth` é a espessura da faixa cozida medida a partir de qualquer
 * superfície, em fração da altura da carne. É ela que diferencia os pontos: um
 * mal passado tem a faixa fina e muito vermelho no centro; um bem passado tem
 * a faixa grossa e quase nenhum rosado.
 */
const DONENESS_LOOK: Record<string, { core: THREE.Color; band: THREE.Color; crustDepth: number }> = {
  'mal-passado': {
    core: new THREE.Color('#a8352b'),
    band: new THREE.Color('#bd6150'),
    crustDepth: 0.2,
  },
  'ao-ponto': {
    core: new THREE.Color('#bb6a53'),
    band: new THREE.Color('#9d5740'),
    crustDepth: 0.4,
  },
  'bem-passado': {
    core: new THREE.Color('#8a5c3a'),
    band: new THREE.Color('#71472a'),
    crustDepth: 0.85,
  },
}

const CRUST_COLOR = new THREE.Color('#3a2110')

/**
 * Meio disco de carne, com a face do corte voltada para a câmera.
 *
 * Cortar ao meio — e não tirar uma cunha — é o que torna a comparação entre
 * os pontos legível: a seção fica inteira de frente, grande e sempre no mesmo
 * enquadramento.
 *
 * A face é colorida por vértice conforme a distância até a superfície mais
 * próxima (borda, topo ou base): perto da superfície fica a crosta grelhada e
 * o centro recebe a cor do ponto. O que diferencia os três pontos é a
 * espessura dessa faixa cozida, exatamente como numa carne de verdade. Não é
 * textura trocada por cima: a malha carrega a informação.
 */
function buildMeatCutaway(spec: IngredientSpec, seed: number, doneness: string): THREE.Object3D {
  const look = DONENESS_LOOK[doneness] ?? DONENESS_LOOK['ao-ponto']
  const r = spec.radius
  const h = spec.thickness
  const group = new THREE.Group()
  group.name = `carne-${doneness}`

  /* --- Metade de trás, grelhada --- */
  const profile = PATTY_PROFILE.map(([pr, pt]) => new THREE.Vector2(pr * r, pt * h))
  profile.unshift(new THREE.Vector2(0, 0))
  profile.push(new THREE.Vector2(0, h * 1.02))

  // `phi` zero aponta para +Z (a câmera). Girando de 90° a 270° sobra a
  // metade de trás, e o plano do corte fica de frente para quem olha.
  const outer = new THREE.LatheGeometry(profile, 72, Math.PI / 2, Math.PI)
  outer.deleteAttribute('uv')
  outer.computeVertexNormals()
  applySurfaceNoise(outer, { amplitude: h * 0.06, frequency: 6, seed: seed + 13, octaves: 3 })
  applyVertexTint(outer, (x, y, z, t) => {
    const grain = fbm3(x * 9, y * 14, z * 9, seed + 17, 3)
    const crust = 0.72 + Math.pow(t, 1.6) * 0.75 + Math.pow(Math.hypot(x, z) / r, 3) * 0.3
    const onTop = Math.max(0, (t - 0.72) / 0.28)
    const bar = Math.sin((x * Math.cos(0.5) + z * Math.sin(0.5)) * 9.5)
    return Math.max(0.34, crust + grain * 0.2 - onTop * Math.max(0, bar - 0.45) * 0.85)
  })
  outer.translate(0, -h / 2, 0)
  group.add(mesh(outer, makeMaterial(spec), 'carne-superficie'))

  /* --- Face do corte, no plano z = 0 --- */
  const COLS = 54
  const ROWS = 22
  const positions: number[] = []
  const colors: number[] = []
  const indices: number[] = []

  for (let row = 0; row <= ROWS; row += 1) {
    const t = row / ROWS
    const edge = pattyRadiusAt(t, r)
    for (let col = 0; col <= COLS; col += 1) {
      // De -raio a +raio: a seção atravessa a carne inteira.
      const x = (col / COLS) * 2 * edge - edge
      positions.push(x, t * h - h / 2, 0)

      const distance = Math.min(edge - Math.abs(x), t * h, h - t * h)
      const mixed = THREE.MathUtils.clamp(distance / (look.crustDepth * h), 0, 1)
      const color =
        mixed < 0.5
          ? CRUST_COLOR.clone().lerp(look.band, THREE.MathUtils.smoothstep(mixed / 0.5, 0, 1))
          : look.band.clone().lerp(look.core, THREE.MathUtils.smoothstep((mixed - 0.5) / 0.5, 0, 1))

      // Fibra e gordura: variação fina para a seção não ficar chapada.
      const fiber = 1 + fbm3(x * 20, t * 40, 0, seed + 23, 3) * 0.16
      const marbling = Math.max(0, fbm3(x * 34, t * 52, 5, seed + 29, 2)) * 0.22 * mixed
      colors.push(
        Math.min(1, color.r * fiber + marbling),
        Math.min(1, color.g * fiber + marbling * 0.92),
        Math.min(1, color.b * fiber + marbling * 0.8),
      )
    }
  }

  const stride = COLS + 1
  for (let row = 0; row < ROWS; row += 1) {
    for (let col = 0; col < COLS; col += 1) {
      const a = row * stride + col
      indices.push(a, a + 1, a + stride, a + 1, a + stride + 1, a + stride)
    }
  }

  const face = new THREE.BufferGeometry()
  face.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  face.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
  face.setIndex(indices)
  face.computeVertexNormals()

  group.add(
    mesh(
      face,
      new THREE.MeshStandardMaterial({
        // Base branca: a cor por vértice aparece exatamente como definida.
        color: 0xffffff,
        roughness: 0.74,
        metalness: 0,
        vertexColors: true,
        side: THREE.DoubleSide,
      }),
      'carne-corte',
    ),
  )

  return group
}

/* -------------------------------------------------------------------------- */
/*  Queijos                                                                    */
/* -------------------------------------------------------------------------- */

function buildCheeseSlice(spec: IngredientSpec, seed: number): THREE.Object3D {
  // Um pouco menor que a carne: a borda tostada continua aparecendo em volta.
  const half = spec.radius * 0.86
  const t = spec.thickness
  // Fatia quadrada que derrete e escorre: caixa subdividida cujos vértices
  // caem conforme a distância do centro, com as quinas pendendo mais.
  const geometry = new THREE.BoxGeometry(half * 2, t, half * 2, 28, 1, 28)
  const position = geometry.attributes.position as THREE.BufferAttribute
  const rnd = createRandom(seed)
  const cornerBias = [0.85 + rnd() * 0.5, 0.85 + rnd() * 0.5, 0.85 + rnd() * 0.5, 0.85 + rnd() * 0.5]

  for (let i = 0; i < position.count; i += 1) {
    const x = position.getX(i)
    const y = position.getY(i)
    const z = position.getZ(i)
    const nx = Math.abs(x) / half
    const nz = Math.abs(z) / half
    // Chebyshev: a borda inteira cai, e as quinas caem mais.
    const edge = Math.max(nx, nz)
    const corner = Math.min(nx, nz)
    const quadrant = (x < 0 ? 0 : 1) + (z < 0 ? 0 : 2)
    // Queda em unidades absolutas: a borda cai um pouco, as quinas pendem mais.
    const droop =
      Math.pow(edge, 3.2) * 0.03 + Math.pow(corner * edge, 2.4) * 0.055 * cornerBias[quadrant]
    const ripple = angularNoise(Math.atan2(z, x), seed + 3, 5) * 0.012 * edge
    position.setY(i, y - droop + ripple)
    // Quadrado "amaciado" (superelipse): as laterais continuam largas, mas as
    // quinas não disparam para fora como num quadrado perfeito.
    const squircle = Math.pow(Math.pow(nx, 4) + Math.pow(nz, 4), 0.25)
    const pull = squircle > 1e-4 ? Math.max(nx, nz) / squircle : 1
    const shrink = pull * (1 - edge * 0.03)
    position.setX(i, x * shrink)
    position.setZ(i, z * shrink)
  }
  position.needsUpdate = true
  geometry.computeVertexNormals()

  applyVertexTint(geometry, (x, y, z) => 0.92 + fbm3(x * 5, y * 5, z * 5, seed + 19, 2) * 0.12)

  return mesh(geometry, makeMaterial(spec, { roughness: spec.roughness }), 'fatia-de-queijo')
}

function buildBlueCheese(spec: IngredientSpec, seed: number): THREE.Object3D {
  const group = new THREE.Group()
  group.name = 'queijo-azul'
  const rnd = createRandom(seed)
  const material = makeMaterial(spec, { roughness: 0.66 })
  const chunks = 14

  for (let i = 0; i < chunks; i += 1) {
    const size = 0.1 + rnd() * 0.09
    // Icosaedro sem subdivisão: faces planas, aspecto quebradiço.
    const geometry = new THREE.IcosahedronGeometry(size, 0)
    geometry.scale(1 + rnd() * 0.5, 0.7 + rnd() * 0.4, 1 + rnd() * 0.5)
    applyVertexTint(geometry, (x, y, z) => {
      // Veios azulados: faixas estreitas e escuras no creme.
      const vein = fbm3(x * 22 + i * 3, y * 22, z * 22, seed + 41, 2)
      return vein > 0.34 ? [0.62, 0.66, 0.78] : [0.98, 0.97, 0.93]
    })
    const chunk = mesh(geometry, material, `queijo-azul-${i}`)
    const angle = (i / chunks) * Math.PI * 2 + rnd() * 0.5
    // Distribuição puxada para a borda: no miolo o pão esconderia tudo.
    const distance = spec.radius * (0.42 + rnd() * 0.52)
    chunk.position.set(Math.cos(angle) * distance, (rnd() - 0.5) * spec.thickness * 0.3, Math.sin(angle) * distance)
    chunk.rotation.set(rnd() * Math.PI, rnd() * Math.PI, rnd() * Math.PI)
    group.add(chunk)
  }
  return group
}

/* -------------------------------------------------------------------------- */
/*  Vegetais                                                                   */
/* -------------------------------------------------------------------------- */

function buildLettuce(spec: IngredientSpec, seed: number): THREE.Object3D {
  const r = spec.radius
  const geometry = radialSurface(
    6,
    96,
    (ringT) => r * (0.3 + ringT * 0.7),
    (_radius, theta, ringT) => {
      // Babado: ondulação forte na borda, quase plana no centro.
      const ruffle = Math.sin(theta * 9 + seed * 0.01) * 0.5 + angularNoise(theta, seed, 7) * 0.5
      return ruffle * spec.thickness * 1.5 * Math.pow(ringT, 2.1) + (1 - ringT) * spec.thickness * 0.25
    },
  )
  applyVertexTint(geometry, (x, y, z) => {
    const r2 = Math.hypot(x, z) / r
    // Folha mais clara e amarelada no miolo, mais verde na borda.
    const tone = 1.18 - r2 * 0.3 + fbm3(x * 8, y * 8, z * 8, seed + 23, 2) * 0.12
    return [tone * 1.04, tone, tone * 0.78]
  })
  return mesh(geometry, makeMaterial(spec, { side: THREE.DoubleSide, roughness: 0.52 }), 'alface')
}

function buildArugula(spec: IngredientSpec, seed: number): THREE.Object3D {
  const group = new THREE.Group()
  group.name = 'rucula'
  const rnd = createRandom(seed)
  const material = makeMaterial(spec, { side: THREE.DoubleSide, roughness: 0.58 })
  const leaves = 14

  for (let i = 0; i < leaves; i += 1) {
    // Folha estreita e recortada: plano alongado, dobrado e torcido.
    const length = 0.4 + rnd() * 0.26
    const width = 0.1 + rnd() * 0.06
    const geometry = new THREE.PlaneGeometry(width, length, 3, 9)
    const position = geometry.attributes.position as THREE.BufferAttribute
    for (let v = 0; v < position.count; v += 1) {
      const x = position.getX(v)
      const y = position.getY(v)
      // O clamp é obrigatório: `y` pode sair uma fração abaixo de -length/2 por
      // erro de ponto flutuante, e `Math.pow` de base negativa devolve NaN,
      // o que contamina a geometria inteira.
      const t = Math.min(1, Math.max(0, (y + length / 2) / length))
      // Afina para a ponta e dobra a folha no eixo central.
      position.setX(v, x * (1 - Math.pow(t, 1.8) * 0.85))
      position.setZ(v, Math.abs(x) * 1.1 + Math.sin(t * 3) * 0.035)
    }
    position.needsUpdate = true
    geometry.computeVertexNormals()
    applyVertexTint(geometry, (x, y, z) => 0.85 + fbm3(x * 12, y * 12, z * 12, seed + i, 2) * 0.25)

    const leaf = mesh(geometry, material, `rucula-${i}`)
    const angle = (i / leaves) * Math.PI * 2 + rnd() * 0.6
    const distance = spec.radius * (0.5 + rnd() * 0.55)
    leaf.position.set(Math.cos(angle) * distance, (rnd() - 0.3) * spec.thickness * 0.4, Math.sin(angle) * distance)
    leaf.rotation.set(-Math.PI / 2 + (rnd() - 0.5) * 0.7, rnd() * Math.PI * 2, (rnd() - 0.5) * 0.8)
    group.add(leaf)
  }
  return group
}

function buildTomato(spec: IngredientSpec, seed: number): THREE.Object3D {
  const group = new THREE.Group()
  group.name = 'tomate'
  const rnd = createRandom(seed)
  const sliceRadius = spec.radius * 0.5

  for (let i = 0; i < 2; i += 1) {
    const geometry = new THREE.CylinderGeometry(sliceRadius, sliceRadius * 0.985, spec.thickness, 48, 1)
    applyRadialNoise(geometry, { amplitude: sliceRadius * 0.02, frequency: 4, seed: seed + i * 7 })
    applyVertexTint(geometry, (x, _y, z) => {
      const rel = Math.hypot(x, z) / sliceRadius
      // Casca mais escura na borda, polpa clara no miolo.
      if (rel > 0.88) return [0.78, 0.5, 0.45]
      const pulp = 1.12 - rel * 0.25
      return [pulp, pulp * 0.72, pulp * 0.66]
    })
    const slice = mesh(geometry, makeMaterial(spec, { roughness: 0.44 }), `tomate-${i}`)
    const offset = sliceRadius * 0.92
    slice.position.set(i === 0 ? -offset : offset, 0, (rnd() - 0.5) * 0.08)
    slice.rotation.y = rnd() * Math.PI
    group.add(slice)
  }
  return group
}

function buildOnionRaw(spec: IngredientSpec, seed: number): THREE.Object3D {
  const group = new THREE.Group()
  group.name = 'cebola-picada'
  const rnd = createRandom(seed)
  const material = makeMaterial(spec, { roughness: 0.46 })
  const bits = 46

  for (let i = 0; i < bits; i += 1) {
    const size = 0.035 + rnd() * 0.03
    const geometry = new THREE.BoxGeometry(size, size * 0.5, size * (0.7 + rnd() * 0.6))
    applyVertexTint(geometry, () => 0.9 + rnd() * 0.22)
    const bit = mesh(geometry, material, `cebola-${i}`)
    // Distribuição uniforme em disco (raiz da fração evita acúmulo no centro).
    const angle = rnd() * Math.PI * 2
    const distance = Math.sqrt(rnd()) * spec.radius * 0.92
    bit.position.set(Math.cos(angle) * distance, (rnd() - 0.5) * spec.thickness * 0.4, Math.sin(angle) * distance)
    bit.rotation.set(rnd() * 0.5, rnd() * Math.PI * 2, rnd() * 0.5)
    group.add(bit)
  }
  return group
}

function buildOnionCaramelized(spec: IngredientSpec, seed: number): THREE.Object3D {
  const group = new THREE.Group()
  group.name = 'cebola-caramelizada'
  const rnd = createRandom(seed)
  const material = makeMaterial(spec, { roughness: 0.4 })
  const strands = 16

  for (let i = 0; i < strands; i += 1) {
    // Tira longa e mole: tubo seguindo uma curva aberta.
    const startAngle = rnd() * Math.PI * 2
    const radius = 0.25 + rnd() * spec.radius * 0.6
    const sweep = 0.9 + rnd() * 1.5
    const points: THREE.Vector3[] = []
    for (let p = 0; p <= 6; p += 1) {
      const t = p / 6
      const angle = startAngle + sweep * t
      const wobble = 1 + Math.sin(t * 5 + i) * 0.12
      points.push(
        new THREE.Vector3(
          Math.cos(angle) * radius * wobble,
          Math.sin(t * Math.PI) * spec.thickness * 0.3 + (rnd() - 0.5) * spec.thickness * 0.25,
          Math.sin(angle) * radius * wobble,
        ),
      )
    }
    const curve = new THREE.CatmullRomCurve3(points)
    const geometry = new THREE.TubeGeometry(curve, 18, 0.019 + rnd() * 0.012, 6, false)
    applyVertexTint(geometry, (x, y, z) => 0.82 + fbm3(x * 10, y * 10, z * 10, seed + i, 2) * 0.35)
    group.add(mesh(geometry, material, `cebola-caramelizada-${i}`))
  }
  return group
}

/* -------------------------------------------------------------------------- */
/*  Bacon e molhos                                                             */
/* -------------------------------------------------------------------------- */

function buildBacon(spec: IngredientSpec, seed: number): THREE.Object3D {
  const group = new THREE.Group()
  group.name = 'bacon'
  const rnd = createRandom(seed)
  const material = makeMaterial(spec, { roughness: 0.46, side: THREE.DoubleSide })

  for (let i = 0; i < 2; i += 1) {
    const length = spec.radius * 1.95
    const width = 0.34 + rnd() * 0.07
    const geometry = new THREE.BoxGeometry(length, 0.022, width, 60, 1, 4)
    const position = geometry.attributes.position as THREE.BufferAttribute
    const phase = rnd() * Math.PI * 2
    const amplitude = spec.thickness * (0.75 + rnd() * 0.5)

    for (let v = 0; v < position.count; v += 1) {
      const x = position.getX(v)
      const y = position.getY(v)
      const z = position.getZ(v)
      const t = x / length
      // Ondulação da fatia fritando, mais torção nas pontas.
      const wave = Math.sin(t * 9 + phase) * amplitude + Math.sin(t * 21 + phase * 2) * amplitude * 0.3
      const taper = 1 - Math.pow(Math.abs(t * 2), 4) * 0.25
      position.setY(v, y + wave)
      position.setZ(v, z * taper + Math.sin(t * 7 + phase) * 0.03)
    }
    position.needsUpdate = true
    geometry.computeVertexNormals()

    applyVertexTint(geometry, (x, _y, z) => {
      // Faixas de gordura: listras claras ao longo da tira.
      const streak = Math.sin(z * 26 + x * 2.5 + i) * 0.5 + 0.5
      const fat = streak > 0.62 ? 1.45 : 0.86
      return [fat, fat * 0.78, fat * 0.72]
    })

    const strip = mesh(geometry, material, `bacon-${i}`)
    strip.position.set(0, (rnd() - 0.5) * 0.015, (i === 0 ? -1 : 1) * (0.14 + rnd() * 0.05))
    // Tiras cruzadas: assim o bacon aparece em quatro pontos da borda, e não
    // só nas duas pontas de uma faixa reta.
    strip.rotation.y = (i === 0 ? -1 : 1) * (0.42 + rnd() * 0.18)
    group.add(strip)
  }
  return group
}

function buildSauce(spec: IngredientSpec, seed: number): THREE.Object3D {
  const r = spec.radius
  // Camada fina e brilhante, com a borda irregular de quem foi espalhado.
  const geometry = radialSurface(
    4,
    80,
    (ringT) => r * (0.12 + ringT * 0.88) * (1 + angularNoise(ringT * 6, seed, 3) * 0.05),
    (_radius, theta, ringT) => {
      const edgeDrip = angularNoise(theta, seed + 2, 6) * spec.thickness * 0.8
      return spec.thickness * 0.5 * (1 - Math.pow(ringT, 3)) + edgeDrip * ringT
    },
  )
  applyVertexTint(geometry, (x, y, z) => 0.94 + fbm3(x * 9, y * 9, z * 9, seed + 37, 2) * 0.14)
  return mesh(
    geometry,
    makeMaterial(spec, { side: THREE.DoubleSide, roughness: spec.roughness }),
    'molho',
  )
}

/* -------------------------------------------------------------------------- */
/*  Despacho                                                                   */
/* -------------------------------------------------------------------------- */

export interface BuildOptions {
  /** Nome do ingrediente, usado para detalhes como sementes de gergelim. */
  name?: string
  /**
   * Variante de construção. Hoje só `cutaway:<ponto>`, que troca o disco de
   * carne inteiro pelo corte transversal usado na escolha do ponto.
   */
  variant?: string
}

/**
 * Constrói a malha de uma peça.
 *
 * Retorna sempre um `Object3D` novo: peças nunca são compartilhadas entre
 * instâncias, para que duas carnes do mesmo prato possam ter bordas distintas.
 * Quem chama é responsável por descartar a geometria e o material.
 */
export function buildIngredientObject(
  kind: IngredientKind,
  seedText: string,
  options: BuildOptions = {},
): THREE.Object3D {
  const spec = specFor(kind)
  const seed = seedToInt(seedText)

  // Corte transversal: usado na visualização exclusiva da carne.
  if (options.variant?.startsWith('cutaway:')) {
    return buildMeatCutaway(spec, seed, options.variant.slice('cutaway:'.length))
  }

  switch (kind) {
    case 'bun-bottom':
      return buildBunBottom(spec, seed)
    case 'bun-top':
      return buildBunTop(spec, seed, /gergelim/i.test(options.name ?? ''))
    case 'patty-beef':
      return buildPatty(spec, seed, false)
    case 'patty-smash':
      return buildPatty(spec, seed, true)
    case 'patty-chicken':
      return buildChicken(spec, seed)
    case 'cheese-cheddar':
    case 'cheese-prato':
      return buildCheeseSlice(spec, seed)
    case 'cheese-blue':
      return buildBlueCheese(spec, seed)
    case 'lettuce':
      return buildLettuce(spec, seed)
    case 'arugula':
      return buildArugula(spec, seed)
    case 'tomato':
      return buildTomato(spec, seed)
    case 'onion-raw':
      return buildOnionRaw(spec, seed)
    case 'onion-caramelized':
      return buildOnionCaramelized(spec, seed)
    case 'bacon':
      return buildBacon(spec, seed)
    case 'sauce-house':
    case 'sauce-bbq':
    case 'sauce-garlic':
    case 'sauce-mayo-herbs':
      return buildSauce(spec, seed)
    default:
      return new THREE.Group()
  }
}

/** Libera geometrias e materiais de uma subárvore da cena. */
export function disposeObject(root: THREE.Object3D): void {
  root.traverse((node) => {
    const target = node as THREE.Mesh
    target.geometry?.dispose?.()
    const material = target.material
    if (Array.isArray(material)) material.forEach((entry) => entry.dispose())
    else material?.dispose?.()
  })
}
