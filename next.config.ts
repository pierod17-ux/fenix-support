import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  serverExternalPackages: ['pdf-parse'],
  // Marcatore di build mostrato in fondo alla sidebar admin: serve a capire a colpo
  // d'occhio se il browser sta servendo l'ultima versione o una copia in cache.
  // COMMIT_REF e BRANCH sono iniettati da Netlify durante il build.
  env: {
    NEXT_PUBLIC_BUILD_REF: (process.env.COMMIT_REF ?? '').slice(0, 7) || 'dev',
    NEXT_PUBLIC_BUILD_TIME: new Date().toISOString(),
  },
  webpack: (config) => {
    config.resolve.alias = { ...config.resolve.alias, canvas: false }
    return config
  },
}

export default nextConfig
