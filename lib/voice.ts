// Sintesi vocale delle risposte di Aura, lato browser (Web Speech API).
// Nessun costo, nessuna chiave API: la qualità della voce dipende dal
// dispositivo/browser del cliente, non da noi.
//
// Il testo passato qui è sempre completo (mai a metà streaming): leggere
// frammenti mentre arrivano creerebbe sovrapposizioni e tagli imprevedibili
// con la SpeechSynthesis API, che non supporta bene l'aggiornamento "live"
// di un'utterance in corso.

export function isSpeechSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window
}

// Toglie markdown ed emoji dal testo prima di leggerlo: senza, il sintetizzatore
// pronuncia gli asterischi del grassetto, i cancelletti dei titoli, ecc.
export function stripForSpeech(markdown: string): string {
  return markdown
    .replace(/```[\s\S]*?```/g, ' ')          // blocchi di codice
    .replace(/`([^`]+)`/g, '$1')              // `code` inline
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')    // immagini
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')  // [testo](link) → testo
    .replace(/[*_#>~]+/g, ' ')                // markup grassetto/corsivo/titoli/citazioni
    .replace(/^\s*[-•]\s+/gm, '')             // puntini elenco a inizio riga
    .replace(/\p{Extended_Pictographic}/gu, ' ') // emoji: spesso lette male o ignorate in modo strano
    .replace(/\s+/g, ' ')
    .trim()
}

// Rilevamento lingua leggerissimo, solo per scegliere la voce giusta tra le
// lingue che l'assistente usa più spesso. Euristica su parole funzionali molto
// comuni: non è un vero rilevatore linguistico, ma basta per il caso d'uso.
// Se non riconosce nulla con sufficiente margine, torna null e si usa la voce
// di default del browser.
const LANG_MARKERS: Record<string, string[]> = {
  'it-IT': ['il', 'la', 'di', 'che', 'per', 'una', 'sono', 'grazie', 'puoi', 'macchina'],
  'en-US': ['the', 'is', 'you', 'your', 'please', 'thanks', 'machine', 'can', 'could'],
  'fr-FR': ['le', 'la', 'vous', 'votre', 'merci', 'est', 'pouvez', 'machine'],
  'es-ES': ['el', 'la', 'usted', 'gracias', 'puede', 'está', 'máquina'],
  'de-DE': ['der', 'die', 'das', 'sie', 'bitte', 'danke', 'können', 'maschine'],
}

export function guessSpeechLang(text: string): string | null {
  const words = text.toLowerCase().match(/\p{L}+/gu) ?? []
  if (words.length === 0) return null
  const wordSet = new Set(words)
  let best: string | null = null
  let bestScore = 0
  for (const [lang, markers] of Object.entries(LANG_MARKERS)) {
    const score = markers.reduce((n, m) => n + (wordSet.has(m) ? 1 : 0), 0)
    if (score > bestScore) { bestScore = score; best = lang }
  }
  return bestScore >= 2 ? best : null
}

let cachedVoices: SpeechSynthesisVoice[] = []
function loadVoices() {
  if (!isSpeechSupported()) return
  cachedVoices = window.speechSynthesis.getVoices()
  if (cachedVoices.length === 0) {
    // Molti browser caricano le voci in modo asincrono al primo utilizzo
    window.speechSynthesis.onvoiceschanged = () => {
      cachedVoices = window.speechSynthesis.getVoices()
    }
  }
}
if (isSpeechSupported()) loadVoices()

function pickVoice(lang: string | null): SpeechSynthesisVoice | undefined {
  if (!lang || cachedVoices.length === 0) return undefined
  const prefix = lang.split('-')[0]
  return cachedVoices.find(v => v.lang === lang) ?? cachedVoices.find(v => v.lang.startsWith(prefix))
}

// Interrompe qualunque lettura in corso e legge il nuovo testo (mai due
// risposte sovrapposte). Silenzioso su qualunque errore: la voce è un extra,
// non deve mai bloccare la chat.
export function speak(rawText: string): void {
  if (!isSpeechSupported()) return
  try {
    window.speechSynthesis.cancel()
    const text = stripForSpeech(rawText)
    if (!text) return
    const utter = new SpeechSynthesisUtterance(text)
    const lang = guessSpeechLang(text)
    if (lang) {
      utter.lang = lang
      const voice = pickVoice(lang)
      if (voice) utter.voice = voice
    }
    window.speechSynthesis.speak(utter)
  } catch {
    // la voce è un extra: mai far fallire la chat per un problema di sintesi vocale
  }
}

export function stopSpeaking(): void {
  if (!isSpeechSupported()) return
  try { window.speechSynthesis.cancel() } catch { /* ignora */ }
}
