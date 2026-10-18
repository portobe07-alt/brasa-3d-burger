import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Caminhos relativos no build: assim o site funciona servido a partir da
  // raiz do domínio ou de qualquer subpasta, sem reconfigurar nada.
  base: './',
  build: {
    // three.js e o ecossistema R3F ficam fora do pacote inicial por meio do
    // import dinâmico de `ModelCanvas`. Não declare esses módulos em
    // `manualChunks`: isso os transforma em dependência estática da entrada e
    // faz o build emitir um `modulepreload`, baixando ~1 MB em toda visita,
    // inclusive quando nenhum modelo 3D existe.
    chunkSizeWarningLimit: 1200,
  },
})
