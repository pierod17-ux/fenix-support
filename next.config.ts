import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  eslint: { ignoreDuringBuilds: true },
  // pdf-parse deve girare fuori dal bundle webpack (usa fs.readFileSync a top-level)
  serverExternalPackages: ['pdf-parse'],
  webpack: (config) => {
    config.resolve.alias = { ...config.resolve.alias, canvas: false }
    return config
  },
}

export default nextConfig
