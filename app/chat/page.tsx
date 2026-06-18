import ChatInterface from '@/components/chat/ChatInterface'

export default function ChatPage() {
  return (
    <main className="min-h-screen flex flex-col" style={{ background: 'var(--background)' }}>
      {/* Header */}
      <header className="flex-shrink-0 px-4 py-3 flex items-center gap-3 border-b"
        style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: 'var(--accent)' }}>
          <svg width="16" height="16" viewBox="0 0 32 32" fill="none">
            <circle cx="16" cy="16" r="10" stroke="white" strokeWidth="2.5"/>
            <path d="M10 16 L14 20 L22 12" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <div>
          <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Fenix Assistenza Tecnica</p>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--success)' }}/>
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Assistente AI attivo</p>
          </div>
        </div>
      </header>

      {/* Chat */}
      <div className="flex-1 overflow-hidden">
        <ChatInterface />
      </div>
    </main>
  )
}
