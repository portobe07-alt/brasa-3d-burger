import { useEffect, useMemo, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { ContactShadows, OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import type { Composition, PlacedLayer } from '../types/composition'
import { buildIngredientObject, disposeObject } from './builders'

/**
 * Cena 3D do hambúrguer.
 *
 * Três coisas são mantidas deliberadamente separadas, como pedido:
 *
 *  - **Zoom da câmera**: distância da câmera ao centro, controlada por scroll,
 *    pinça ou botões. Vive no OrbitControls.
 *  - **Expansão das camadas**: parâmetro normalizado `t` em [0, 1], DERIVADO da
 *    distância da câmera. Não acumula por evento de scroll: é sempre
 *    recalculado a partir da distância atual, então mil scrolls rápidos
 *    chegam ao mesmo lugar que um arrasto lento.
 *  - **Rotação**: ângulos do OrbitControls, que não interferem em nada acima.
 *
 * A posição original de cada peça vem da composição (`utils/composition.ts`) e
 * nunca é alterada; a expansão é um deslocamento aplicado sobre ela.
 */

const FOV = 38
const MIN_DISTANCE = 2.1
const MAX_DISTANCE = 4.4
/** Distância máxima entre camadas, em unidades de cena. */
const MAX_GAP = 0.19
/**
 * Fração inicial do zoom que ainda não separa nada. Dá uma folga para o
 * cliente aproximar um pouco e só ver o hambúrguer maior, montado.
 */
const EXPANSION_DEAD_ZONE = 0.07
/** Quanto do quadro a pilha pode ocupar. Abaixo de 1 garante margem. */
const FIT_MARGIN = 0.86

const clamp01 = (value: number) => Math.min(1, Math.max(0, value))
const smoothstep = (t: number) => t * t * (3 - 2 * t)

/** Converte a distância da câmera no parâmetro de expansão. */
export function expansionFromDistance(distance: number): number {
  const zoom = clamp01((MAX_DISTANCE - distance) / (MAX_DISTANCE - MIN_DISTANCE))
  return smoothstep(clamp01((zoom - EXPANSION_DEAD_ZONE) / (1 - EXPANSION_DEAD_ZONE)))
}

/** Distância de câmera que produz uma dada expansão. Usada pelos atalhos. */
function distanceForExpansion(target: number): number {
  // Inverte o smoothstep numericamente — barato e suficiente para um atalho.
  let low = MIN_DISTANCE
  let high = MAX_DISTANCE
  for (let i = 0; i < 24; i += 1) {
    const mid = (low + high) / 2
    if (expansionFromDistance(mid) > target) low = mid
    else high = mid
  }
  return (low + high) / 2
}

export type SceneCommandKind = 'reset' | 'zoom-in' | 'zoom-out' | 'expand' | 'collapse'
export interface SceneCommand {
  id: number
  kind: SceneCommandKind
}

/* -------------------------------------------------------------------------- */
/*  Peças da cena                                                              */
/* -------------------------------------------------------------------------- */

interface LayerEntry {
  object: THREE.Object3D
  layer: PlacedLayer
  /** Progresso de entrada, 0 a 1. Peças novas crescem até a posição. */
  appear: number
  /** Marcada para sair: encolhe e é descartada. */
  exiting: boolean
  /** Altura atual, interpolada rumo ao alvo. */
  currentY: number
  /** Intensidade do realce, interpolada. */
  highlight: number
}

function BurgerModel({
  composition,
  productId,
  reducedMotion,
  highlightedId,
  onExpansionChange,
}: {
  composition: Composition
  productId: string
  reducedMotion: boolean
  highlightedId: string | null
  onExpansionChange?: (expansion: number) => void
}) {
  const groupRef = useRef<THREE.Group>(null)
  const entriesRef = useRef(new Map<string, LayerEntry>())
  const lastProductRef = useRef(productId)
  const reportedExpansionRef = useRef(-1)
  const invalidate = useThree((state) => state.invalidate)

  // Sincroniza as malhas com a composição: cria o que entrou, marca o que saiu.
  useEffect(() => {
    const group = groupRef.current
    if (!group) return
    const entries = entriesRef.current

    // Troca de produto não faz transição: a montagem anterior é descartada na
    // hora, para não misturar dois hambúrgueres na mesma cena.
    if (lastProductRef.current !== productId) {
      for (const entry of entries.values()) {
        group.remove(entry.object)
        disposeObject(entry.object)
      }
      entries.clear()
      lastProductRef.current = productId
    }

    const present = new Set<string>()

    for (const layer of composition.layers) {
      present.add(layer.id)
      const existing = entries.get(layer.id)
      if (existing) {
        existing.layer = layer
        existing.exiting = false
        continue
      }

      const object = buildIngredientObject(layer.kind, layer.seed, {
        name: layer.name,
        variant: layer.variant,
      })
      object.name = layer.id
      group.add(object)
      entries.set(layer.id, {
        object,
        layer,
        appear: reducedMotion ? 1 : 0,
        exiting: false,
        // Peça nova desce até o lugar, como se fosse colocada no hambúrguer.
        currentY: layer.y - composition.height / 2 + (reducedMotion ? 0 : 0.5),
        highlight: 0,
      })
    }

    for (const [id, entry] of entries) {
      if (!present.has(id)) entry.exiting = true
    }

    invalidate()
  }, [composition, productId, reducedMotion, invalidate])

  // Descarte final ao desmontar o visualizador.
  useEffect(() => {
    const entries = entriesRef.current
    return () => {
      for (const entry of entries.values()) disposeObject(entry.object)
      entries.clear()
    }
  }, [])

  useFrame((state, delta) => {
    const group = groupRef.current
    if (!group) return

    const entries = entriesRef.current
    const step = reducedMotion ? 1 : 1 - Math.exp(-delta * 9)
    let animating = false

    /* --- 1. Expansão, derivada da distância da câmera --- */
    const distance = state.camera.position.length()
    const expansion = expansionFromDistance(distance)
    const gap = expansion * MAX_GAP

    if (onExpansionChange && Math.abs(expansion - reportedExpansionRef.current) > 0.02) {
      reportedExpansionRef.current = expansion
      onExpansionChange(expansion)
    }

    /* --- 2. Posição de cada peça: original + deslocamento da expansão --- */
    const count = composition.layers.length
    const middle = (count - 1) / 2

    for (const [id, entry] of entries) {
      const { layer } = entry
      const targetAppear = entry.exiting ? 0 : 1
      entry.appear += (targetAppear - entry.appear) * step
      if (Math.abs(targetAppear - entry.appear) > 0.002) animating = true

      if (entry.exiting && entry.appear < 0.02) {
        group.remove(entry.object)
        disposeObject(entry.object)
        entries.delete(id)
        animating = true
        continue
      }

      const baseY = layer.y - composition.height / 2
      const targetY = baseY + (layer.index - middle) * gap
      entry.currentY += (targetY - entry.currentY) * step
      if (Math.abs(targetY - entry.currentY) > 0.0004) animating = true

      entry.object.position.y = entry.currentY
      // Peça entrando cresce até o tamanho normal; saindo, encolhe.
      const scale = 0.45 + entry.appear * 0.55
      entry.object.scale.setScalar(scale)
      entry.object.visible = entry.appear > 0.01

      // Realce do ingrediente apontado na lista: brilho próprio, sem trocar
      // o material (que é compartilhado dentro de uma mesma peça).
      const wanted = highlightedId !== null && entry.layer.ingredientId === highlightedId ? 0.34 : 0
      if (entry.highlight !== wanted) {
        entry.highlight += (wanted - entry.highlight) * step
        if (Math.abs(wanted - entry.highlight) < 0.004) entry.highlight = wanted
        else animating = true
        entry.object.traverse((node) => {
          const target = node as THREE.Mesh
          const material = target.material as THREE.MeshStandardMaterial | undefined
          if (material?.isMeshStandardMaterial) {
            material.emissive.setRGB(entry.highlight, entry.highlight * 0.5, entry.highlight * 0.16)
          }
        })
      }
    }

    /* --- 3. Enquadramento: a pilha separada nunca sai da tela --- */
    // A folga cobre o que a espessura nominal não prevê: cúpula do pão,
    // relevo das carnes e o queijo escorrendo.
    const stackHeight = composition.height + Math.max(count - 1, 0) * gap + 0.22
    const camera = state.camera as THREE.PerspectiveCamera
    const frustumHeight = 2 * Math.tan((camera.fov * Math.PI) / 360) * distance
    const frustumWidth = frustumHeight * camera.aspect
    const fitScale = Math.min(
      composition.fitUpscale ?? 1,
      (frustumHeight * FIT_MARGIN) / Math.max(stackHeight, 0.001),
      (frustumWidth * FIT_MARGIN) / Math.max(composition.radius * 2, 0.001),
    )
    const nextScale = group.scale.x + (fitScale - group.scale.x) * step
    if (Math.abs(fitScale - group.scale.x) > 0.0005) animating = true
    group.scale.setScalar(nextScale)

    if (animating) invalidate()
  })

  return <group ref={groupRef} />
}

/* -------------------------------------------------------------------------- */
/*  Iluminação                                                                 */
/* -------------------------------------------------------------------------- */

/**
 * Iluminação de estúdio com mapa de ambiente gerado em memória.
 *
 * `RoomEnvironment` vem do próprio three.js e é construída proceduralmente —
 * nenhum HDR é baixado de uma CDN. É ela que dá o reflexo suave que faz o
 * queijo e os molhos parecerem úmidos em vez de plásticos.
 */
function StudioLighting() {
  const { scene, gl } = useThree()

  useEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl)
    const room = new RoomEnvironment()
    const envMap = pmrem.fromScene(room, 0.04).texture
    scene.environment = envMap
    // A sala procedural é clara: sem reduzir a intensidade ela lava as cores
    // e o pão dourado vira creme.
    scene.environmentIntensity = 0.32
    return () => {
      scene.environment = null
      scene.environmentIntensity = 1
      envMap.dispose()
      room.dispose?.()
      pmrem.dispose()
    }
  }, [scene, gl])

  return (
    <>
      <ambientLight intensity={0.22} />
      {/* Luz principal quente, alta e à frente — define o volume e as sombras. */}
      <spotLight
        position={[3.4, 6, 4.2]}
        angle={0.6}
        penumbra={0.9}
        intensity={62}
        color="#fff1dd"
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0012}
      />
      {/* Preenchimento frio oposto, para descolar o produto do fundo escuro. */}
      <directionalLight position={[-4.5, 1.8, -2.6]} intensity={0.55} color="#a8c4ff" />
      {/* Contraluz de brasa, que desenha o contorno. */}
      <pointLight position={[0, -0.8, -3.4]} intensity={11} color="#e87532" />
      <pointLight position={[1.6, 2.4, -1.8]} intensity={4} color="#ffd9b0" />
    </>
  )
}

/* -------------------------------------------------------------------------- */
/*  Comandos de câmera                                                         */
/* -------------------------------------------------------------------------- */

/** Traduz os botões da interface em movimento de câmera, sempre pela distância. */
function CameraCommands({
  command,
  reducedMotion,
  controlsRef,
}: {
  command: SceneCommand | null
  reducedMotion: boolean
  controlsRef: React.RefObject<OrbitControlsImpl | null>
}) {
  const { camera, invalidate } = useThree()
  const targetDistanceRef = useRef<number | null>(null)

  useEffect(() => {
    if (!command) return
    const distance = camera.position.length()

    switch (command.kind) {
      case 'zoom-in':
        targetDistanceRef.current = Math.max(MIN_DISTANCE, distance - 0.65)
        break
      case 'zoom-out':
        targetDistanceRef.current = Math.min(MAX_DISTANCE, distance + 0.65)
        break
      case 'expand':
        targetDistanceRef.current = distanceForExpansion(0.97)
        break
      case 'collapse':
      case 'reset':
        targetDistanceRef.current = MAX_DISTANCE
        break
    }

    if (command.kind === 'reset') controlsRef.current?.reset()
    invalidate()
  }, [command, camera, controlsRef, invalidate])

  useFrame((_, delta) => {
    const target = targetDistanceRef.current
    if (target === null) return

    const distance = camera.position.length()
    const step = reducedMotion ? 1 : 1 - Math.exp(-delta * 7)
    const next = distance + (target - distance) * step

    camera.position.multiplyScalar(next / distance)
    controlsRef.current?.update()
    invalidate()

    if (Math.abs(target - next) < 0.004) targetDistanceRef.current = null
  })

  return null
}

/* -------------------------------------------------------------------------- */
/*  Componente padrão                                                          */
/* -------------------------------------------------------------------------- */

export interface BurgerSceneProps {
  composition: Composition
  productId: string
  reducedMotion: boolean
  command: SceneCommand | null
  /** Ingrediente destacado, sincronizado com a lista da tela de detalhes. */
  highlightedId?: string | null
  onExpansionChange?: (expansion: number) => void
  onCreated?: () => void
}

export default function BurgerScene({
  composition,
  productId,
  reducedMotion,
  command,
  highlightedId = null,
  onExpansionChange,
  onCreated,
}: BurgerSceneProps) {
  const controlsRef = useRef<OrbitControlsImpl | null>(null)
  const dpr = useMemo(
    () => Math.min(typeof window === 'undefined' ? 1 : window.devicePixelRatio || 1, 2),
    [],
  )

  /** Setas giram, `+`/`−` aproximam e afastam, `0` restaura. */
  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const controls = controlsRef.current
    if (!controls) return

    const STEP = Math.PI / 24
    let deltaTheta = 0
    let deltaPhi = 0
    let zoomFactor = 1

    switch (event.key) {
      case 'ArrowLeft': deltaTheta = -STEP; break
      case 'ArrowRight': deltaTheta = STEP; break
      case 'ArrowUp': deltaPhi = -STEP; break
      case 'ArrowDown': deltaPhi = STEP; break
      case '+': case '=': zoomFactor = 0.86; break
      case '-': case '_': zoomFactor = 1.16; break
      case '0': controls.reset(); event.preventDefault(); return
      default: return
    }

    event.preventDefault()
    const camera = controls.object
    const offset = camera.position.clone().sub(controls.target)
    const spherical = new THREE.Spherical().setFromVector3(offset)
    spherical.theta += deltaTheta
    spherical.phi = THREE.MathUtils.clamp(spherical.phi + deltaPhi, 0.3, Math.PI - 0.45)
    spherical.radius = THREE.MathUtils.clamp(spherical.radius * zoomFactor, MIN_DISTANCE, MAX_DISTANCE)
    offset.setFromSpherical(spherical)
    camera.position.copy(controls.target).add(offset)
    controls.update()
  }

  // A divisão do toque entre página e visualizador está em `.burger-stage` no
  // index.css — ver o comentário lá.
  return (
    <div
      className="burger-stage absolute inset-0 rounded-[inherit] focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-ember"
      tabIndex={0}
      role="application"
      aria-label="Visualizador 3D do hambúrguer. Arraste para girar. Aproxime o zoom para separar as camadas e ver cada ingrediente. Pelo teclado: setas giram, mais e menos controlam o zoom, zero restaura a visualização."
      onKeyDown={handleKeyDown}
    >
      <Canvas
        dpr={dpr}
        shadows
        camera={{ position: [0, 1.15, 4.25], fov: FOV, near: 0.1, far: 60 }}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        // Renderiza só quando algo muda: poupa bateria no celular.
        frameloop="demand"
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping
          gl.toneMappingExposure = 0.82
          onCreated?.()
        }}
      >
        <StudioLighting />
        <BurgerModel
          composition={composition}
          productId={productId}
          reducedMotion={reducedMotion}
          highlightedId={highlightedId}
          onExpansionChange={onExpansionChange}
        />
        <ContactShadows position={[0, -1.3, 0]} opacity={0.5} scale={6.5} blur={2.8} far={3} color="#000000" />
        <OrbitControls
          ref={controlsRef}
          makeDefault
          enablePan={false}
          enableDamping={!reducedMotion}
          dampingFactor={0.07}
          rotateSpeed={0.72}
          zoomSpeed={1.15}
          minDistance={MIN_DISTANCE}
          maxDistance={MAX_DISTANCE}
          // Quase 180° na vertical e 360° livres na horizontal: o cliente
          // alcança frente, costas, laterais, topo e base.
          minPolarAngle={0.08}
          maxPolarAngle={Math.PI - 0.08}
          target={[0, 0, 0]}
          // Um dedo gira; dois dedos controlam o zoom. Assim a página continua
          // rolável quando o toque começa fora do visualizador.
          touches={{ ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_ROTATE }}
        />
        <CameraCommands command={command} reducedMotion={reducedMotion} controlsRef={controlsRef} />
      </Canvas>
    </div>
  )
}
