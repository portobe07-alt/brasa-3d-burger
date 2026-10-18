import { useEffect, useState } from 'react'

/** Resultado da detecção de WebGL, calculado uma única vez por sessão. */
let webglSupport: boolean | null = null

/**
 * Verifica se o navegador consegue criar um contexto WebGL.
 *
 * Sem isso, montar um canvas 3D gera erro de console e uma tela preta — então
 * a aplicação prefere a ilustração vetorial e diz por quê.
 */
export function detectWebGL(): boolean {
  if (webglSupport !== null) return webglSupport
  if (typeof document === 'undefined') return false
  try {
    const canvas = document.createElement('canvas')
    const context =
      canvas.getContext('webgl2') ??
      canvas.getContext('webgl') ??
      canvas.getContext('experimental-webgl')
    webglSupport = context !== null
  } catch {
    webglSupport = false
  }
  return webglSupport
}

export function useWebGLSupport(): boolean {
  // O resultado é constante durante a sessão e fica memoizado no módulo, então
  // basta calcular na inicialização do estado.
  const [supported] = useState<boolean>(detectWebGL)
  return supported
}

/** Acompanha uma media query e reage a mudanças. */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return false
    return window.matchMedia(query).matches
  })

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return
    const list = window.matchMedia(query)
    const onChange = (event: MediaQueryListEvent) => setMatches(event.matches)
    setMatches(list.matches)
    list.addEventListener('change', onChange)
    return () => list.removeEventListener('change', onChange)
  }, [query])

  return matches
}

/** `true` quando o sistema pede movimento reduzido. */
export function useReducedMotion(): boolean {
  return useMediaQuery('(prefers-reduced-motion: reduce)')
}

/** Trava a rolagem do corpo da página enquanto um painel sobreposto está aberto. */
export function useBodyScrollLock(locked: boolean): void {
  useEffect(() => {
    if (!locked) return
    const { body } = document
    const previousOverflow = body.style.overflow
    const previousPaddingRight = body.style.paddingRight
    // Compensa a largura da barra de rolagem para o layout não "pular".
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth
    body.style.overflow = 'hidden'
    if (scrollbarWidth > 0) body.style.paddingRight = `${scrollbarWidth}px`
    return () => {
      body.style.overflow = previousOverflow
      body.style.paddingRight = previousPaddingRight
    }
  }, [locked])
}
