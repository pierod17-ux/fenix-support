// Riconoscimento vocale (voce → testo) lato browser, per comporre i messaggi
// della chat parlando invece di scrivere. Web Speech API, gratis, nessuna
// chiave: stesso approccio scelto per la voce in uscita di Aura (lib/voice.ts).
//
// ⚠️ Supporto browser MOLTO più incostante della sintesi vocale in uscita:
// Firefox non implementa affatto il riconoscimento (solo Chrome/Edge/Safari,
// e su Safari con affidabilità minore). Il pulsante va sempre nascosto se
// isSpeechRecognitionSupported() è false — nessun fallback possibile lato
// browser gratuito.
//
// TypeScript non include tipi per questa API (non è nello standard DOM lib):
// interfacce minime locali, solo per ciò che usiamo davvero.

interface SpeechRecognitionResultLike {
  isFinal: boolean
  0: { transcript: string }
}
interface SpeechRecognitionEventLike {
  resultIndex: number
  results: ArrayLike<SpeechRecognitionResultLike>
}
interface SpeechRecognitionErrorEventLike {
  error: string
}
interface SpeechRecognitionLike {
  lang: string
  continuous: boolean
  interimResults: boolean
  maxAlternatives: number
  onresult: ((event: SpeechRecognitionEventLike) => void) | null
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null
  onend: (() => void) | null
  start: () => void
  stop: () => void
  abort: () => void
}
type SpeechRecognitionCtor = new () => SpeechRecognitionLike

function getCtor(): SpeechRecognitionCtor | null {
  if (typeof window === 'undefined') return null
  const w = window as unknown as { SpeechRecognition?: SpeechRecognitionCtor; webkitSpeechRecognition?: SpeechRecognitionCtor }
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null
}

export function isSpeechRecognitionSupported(): boolean {
  return getCtor() !== null
}

export interface ListenHandlers {
  // text = trascrizione accumulata fin qui (parziale finché isFinal è false)
  onResult: (text: string, isFinal: boolean) => void
  onEnd: () => void
  // 'not-allowed' = permesso microfono negato, 'no-speech' = nessun audio
  // rilevato, altri codici per errori del motore
  onError?: (error: string) => void
}

let active: SpeechRecognitionLike | null = null

// Avvia l'ascolto. Ritorna false se il riconoscimento non è supportato o non
// riesce a partire (permesso negato in modo sincrono, in alcuni browser).
export function startListening(lang: string, handlers: ListenHandlers): boolean {
  const Ctor = getCtor()
  if (!Ctor) return false
  stopListening() // mai due riconoscimenti attivi insieme

  try {
    const rec = new Ctor()
    try { rec.lang = lang } catch { /* alcuni browser accettano solo lingue installate */ }
    rec.continuous = false      // un messaggio alla volta, si ferma da solo al silenzio
    rec.interimResults = true   // mostra il testo mentre viene riconosciuto, non solo alla fine
    rec.maxAlternatives = 1

    let finalText = ''
    rec.onresult = (event) => {
      let interim = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const r = event.results[i]
        const chunk = r[0]?.transcript ?? ''
        if (r.isFinal) finalText += chunk
        else interim += chunk
      }
      handlers.onResult((finalText + interim).trim(), false)
    }
    rec.onerror = (event) => { handlers.onError?.(event.error) }
    rec.onend = () => {
      handlers.onResult(finalText.trim(), true)
      active = null
      handlers.onEnd()
    }

    active = rec
    rec.start()
    return true
  } catch {
    active = null
    return false
  }
}

export function stopListening(): void {
  try { active?.stop() } catch { /* ignora */ }
}

export function isListening(): boolean {
  return active !== null
}
