import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Fenix Assistenza Tecnica',
  description: 'Portale di assistenza tecnica per macchine Endosphere',
  manifest: '/manifest.json',
  themeColor: '#0a0a0f',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it">
      <body>{children}</body>
    </html>
  )
}
