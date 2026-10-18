/**
 * Gera um modelo GLB de TESTE com camadas separadas.
 *
 * Serve para verificar o visualizador 3D de ponta a ponta — carregamento,
 * rotação, zoom e separação de camadas — sem depender de um modelo artístico
 * pronto. Cada ingrediente sai como um nó independente da cena, que é
 * exatamente o que a visualização em camadas exige.
 *
 * NÃO é um modelo de produto: são discos coloridos, propositalmente simples.
 *
 * Uso:
 *   node scripts/make-test-model.mjs public/models/brasa-classico.glb
 */
import { writeFileSync, mkdirSync } from 'node:fs'
import { dirname } from 'node:path'

/** Camadas do teste: nome do nó, raio, altura e cor (RGB linear 0–1). */
const LAYERS = [
  { name: 'pao-inferior', radius: 1.0, height: 0.34, color: [0.62, 0.38, 0.16] },
  { name: 'molho-casa', radius: 0.95, height: 0.07, color: [0.88, 0.74, 0.3] },
  { name: 'alface', radius: 1.08, height: 0.12, color: [0.3, 0.55, 0.16] },
  { name: 'tomate', radius: 0.96, height: 0.1, color: [0.72, 0.16, 0.1] },
  { name: 'hamburguer-bovino', radius: 1.02, height: 0.28, color: [0.22, 0.11, 0.05] },
  { name: 'queijo-cheddar', radius: 1.06, height: 0.07, color: [0.92, 0.55, 0.1] },
  { name: 'pao-superior', radius: 1.0, height: 0.52, color: [0.72, 0.46, 0.18] },
]

const SEGMENTS = 48

/** Cilindro com tampas, centrado na origem. */
function buildCylinder(radius, height, segments) {
  const positions = []
  const normals = []
  const indices = []
  const half = height / 2
  const push = (p, nrm) => {
    positions.push(...p)
    normals.push(...nrm)
  }

  // Lateral.
  const sideStart = positions.length / 3
  for (let i = 0; i <= segments; i += 1) {
    const angle = (i / segments) * Math.PI * 2
    const x = Math.cos(angle)
    const z = Math.sin(angle)
    push([x * radius, -half, z * radius], [x, 0, z])
    push([x * radius, half, z * radius], [x, 0, z])
  }
  for (let i = 0; i < segments; i += 1) {
    const a = sideStart + i * 2
    indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2)
  }

  // Tampas (topo com normal +Y, base com normal -Y).
  for (const [sign, y] of [
    [1, half],
    [-1, -half],
  ]) {
    const center = positions.length / 3
    push([0, y, 0], [0, sign, 0])
    for (let i = 0; i <= segments; i += 1) {
      const angle = (i / segments) * Math.PI * 2
      push([Math.cos(angle) * radius, y, Math.sin(angle) * radius], [0, sign, 0])
    }
    for (let i = 0; i < segments; i += 1) {
      const a = center + 1 + i
      if (sign === 1) indices.push(center, a + 1, a)
      else indices.push(center, a, a + 1)
    }
  }

  return {
    positions: new Float32Array(positions),
    normals: new Float32Array(normals),
    indices: new Uint16Array(indices),
  }
}

function align4(value) {
  return (4 - (value % 4)) % 4
}

function build() {
  const buffers = []
  const bufferViews = []
  const accessors = []
  const meshes = []
  const nodes = []
  const materials = []
  let offset = 0

  const addView = (data) => {
    const bytes = Buffer.from(data.buffer, data.byteOffset, data.byteLength)
    const padding = align4(bytes.length)
    buffers.push(bytes, Buffer.alloc(padding))
    const view = { buffer: 0, byteOffset: offset, byteLength: bytes.length }
    bufferViews.push(view)
    offset += bytes.length + padding
    return bufferViews.length - 1
  }

  const minMax = (array, components) => {
    const min = new Array(components).fill(Infinity)
    const max = new Array(components).fill(-Infinity)
    for (let i = 0; i < array.length; i += components) {
      for (let c = 0; c < components; c += 1) {
        min[c] = Math.min(min[c], array[i + c])
        max[c] = Math.max(max[c], array[i + c])
      }
    }
    return { min, max }
  }

  let y = 0
  LAYERS.forEach((layer, index) => {
    const geometry = buildCylinder(layer.radius, layer.height, SEGMENTS)

    const positionView = addView(geometry.positions)
    const normalView = addView(geometry.normals)
    const indexView = addView(geometry.indices)

    const bounds = minMax(geometry.positions, 3)
    accessors.push({
      bufferView: positionView,
      componentType: 5126, // FLOAT
      count: geometry.positions.length / 3,
      type: 'VEC3',
      min: bounds.min,
      max: bounds.max,
    })
    accessors.push({
      bufferView: normalView,
      componentType: 5126,
      count: geometry.normals.length / 3,
      type: 'VEC3',
    })
    accessors.push({
      bufferView: indexView,
      componentType: 5123, // UNSIGNED_SHORT
      count: geometry.indices.length,
      type: 'SCALAR',
    })

    materials.push({
      name: `${layer.name}-material`,
      pbrMetallicRoughness: {
        baseColorFactor: [...layer.color, 1],
        metallicFactor: 0,
        roughnessFactor: 0.62,
      },
    })

    meshes.push({
      name: `${layer.name}-mesh`,
      primitives: [
        {
          attributes: { POSITION: index * 3, NORMAL: index * 3 + 1 },
          indices: index * 3 + 2,
          material: index,
        },
      ],
    })

    // Empilha as camadas, com uma leve sobreposição.
    y += layer.height / 2
    nodes.push({ name: layer.name, mesh: index, translation: [0, y, 0] })
    y += layer.height / 2 - 0.02
  })

  const binary = Buffer.concat(buffers)

  const gltf = {
    asset: { version: '2.0', generator: 'brasa-3d-burger/scripts/make-test-model.mjs' },
    scene: 0,
    scenes: [{ name: 'burger-teste', nodes: nodes.map((_, i) => i) }],
    nodes,
    meshes,
    materials,
    accessors,
    bufferViews,
    buffers: [{ byteLength: binary.length }],
  }

  const jsonText = JSON.stringify(gltf)
  const jsonBuffer = Buffer.from(jsonText, 'utf8')
  const jsonPadding = Buffer.alloc(align4(jsonBuffer.length), 0x20) // espaços
  const jsonChunk = Buffer.concat([jsonBuffer, jsonPadding])

  const header = Buffer.alloc(12)
  header.write('glTF', 0, 'ascii')
  header.writeUInt32LE(2, 4)
  header.writeUInt32LE(12 + 8 + jsonChunk.length + 8 + binary.length, 8)

  const jsonHeader = Buffer.alloc(8)
  jsonHeader.writeUInt32LE(jsonChunk.length, 0)
  jsonHeader.write('JSON', 4, 'ascii')

  const binHeader = Buffer.alloc(8)
  binHeader.writeUInt32LE(binary.length, 0)
  binHeader.write('BIN\0', 4, 'ascii')

  return Buffer.concat([header, jsonHeader, jsonChunk, binHeader, binary])
}

const target = process.argv[2]
if (!target) {
  console.error('Uso: node scripts/make-test-model.mjs <caminho-de-saida.glb>')
  process.exit(1)
}

const glb = build()
mkdirSync(dirname(target), { recursive: true })
writeFileSync(target, glb)
console.log(`GLB de teste gerado: ${target} (${(glb.length / 1024).toFixed(1)} kB, ${LAYERS.length} camadas)`)
