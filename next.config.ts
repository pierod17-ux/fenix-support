import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  eslint: { ignoreDuringBuilds: true },
  webpack: (config) => {
    // pdf-parse v1.x tenta di leggere file di test con fs.readFileSync a top-level.
    // Usando il path interno /lib/pdf-parse.js il problema è evitato, ma
    // aggiungiamo anche il fallback per canvas (richiesto da pdfjs-dist nel browser).
    config.resolve.alias = { ...config.resolve.alias, canvas: false }
    return config
  },
}

export default nextConfig
