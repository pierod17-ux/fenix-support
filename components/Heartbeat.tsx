'use client'

import { useEffect } from 'react'

// Sends a presence ping on mount and every 60s while the tab is alive,
// plus once more when the tab becomes visible again.
export default function Heartbeat() {
  useEffect(() => {
    const ping = () => {
      fetch('/api/heartbeat', { method: 'POST', keepalive: true }).catch(() => {})
    }
    ping()
    const interval = setInterval(ping, 60_000)
    const onVisible = () => { if (document.visibilityState === 'visible') ping() }
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      clearInterval(interval)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [])
  return null
}
