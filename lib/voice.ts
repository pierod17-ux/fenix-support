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

// Il Web Speech API non espone un campo "genere" ufficiale per le voci: le
// browser/OS lo suggeriscono solo nel nome ("Google UK English Female",
// "Microsoft Elsa", "en-us-x-sfg#female_1-local"...). Punteggio euristico su
// nomi noti, comuni ai principali motori (Chrome/Android, Apple, Windows)
// nelle lingue che Aura usa più spesso. Non è infallibile, ma è il meglio
// che si può fare senza passare a un servizio TTS a pagamento.
const FEMALE_MARKERS = [
  'female', 'donna', 'woman',
  // it
  'alice', 'elsa', 'federica', 'paola', 'silvia', 'giulia', 'monica', 'martina',
  // en
  'samantha', 'victoria', 'karen', 'susan', 'zira', 'hazel', 'salli', 'joanna',
  'kimberly', 'ava', 'allison', 'moira', 'tessa', 'fiona', 'serena',
  // fr
  'amelie', 'amélie', 'audrey', 'celine', 'céline', 'chantal', 'marie', 'julie',
  // es
  'paulina', 'conchita', 'lucia', 'lucía', 'marisol', 'esperanza',
  // de
  'anna', 'petra', 'marlene', 'vicki', 'helena', 'katja',
]
const MALE_MARKERS = [
  'male', 'uomo', 'man',
  'luca', 'diego', 'cosimo', 'marco', 'paolo',
  'daniel', 'alex', 'fred', 'tom', 'david', 'aaron',
  'thomas', 'nicolas', 'henri',
  'jorge', 'juan', 'pablo',
  'yannick', 'stefan', 'markus', 'hans',
]
// "male" è contenuto in "female": va escluso prima di cercare "male" da solo.
function genderScore(name: string): number {
  const n = name.toLowerCase()
  const isFemale = FEMALE_MARKERS.some(m => n.includes(m))
  const withoutFemale = n.replace(/female/g, '')
  const isMale = MALE_MARKERS.some(m => withoutFemale.includes(m))
  if (isFemale) return 1
  if (isMale) return -1
  return 0
}

// Sceglie la voce più adatta per la lingua rilevata, preferendo un segnale
// di voce femminile quando disponibile. `pitch` compensa i casi dubbi: se
// non troviamo una voce chiaramente femminile, alziamo leggermente il tono
// invece di lasciare la questione al caso.
function pickVoice(lang: string | null): { voice: SpeechSynthesisVoice | undefined; pitch: number } {
  if (cachedVoices.length === 0) return { voice: undefined, pitch: 1.1 }
  const prefix = lang?.split('-')[0]
  const candidates = lang
    ? cachedVoices.filter(v => v.lang === lang || (prefix && v.lang.startsWith(prefix)))
    : cachedVoices
  const pool = candidates.length > 0 ? candidates : cachedVoices

  let best: SpeechSynthesisVoice | undefined
  let bestScore = -Infinity
  for (const v of pool) {
    const score = genderScore(v.name)
    if (score > bestScore) { bestScore = score; best = v }
  }
  // score 1 = voce riconosciuta come femminile → tono naturale della voce.
  // score 0 = nessun segnale di genere → tono leggermente più acuto, per
  // orientarsi verso il femminile senza stravolgere la voce.
  // score -1 = solo voci con segnali maschili disponibili per questa lingua
  // → tono più acuto, comunque meglio di niente.
  const pitch = bestScore >= 1 ? 1 : bestScore === 0 ? 1.15 : 1.25
  return { voice: best, pitch }
}

// Interrompe qualunque lettura in corso e legge il nuovo testo (mai due
// risposte sovrapposte). Ogni proprietà è impostata in un try/catch separato:
// alcuni motori TTS possono rifiutare una combinazione voce/lingua (per
// esempio se l'elenco voci del sistema è incompleto o cambia a runtime) — in
// quel caso l'utterance va comunque letta con le impostazioni di default,
// invece di non leggere nulla per un dettaglio che non blocca la chat.
export function speak(rawText: string): void {
  if (!isSpeechSupported()) return
  const text = stripForSpeech(rawText)
  if (!text) return
  try { window.speechSynthesis.cancel() } catch { /* ignora */ }

  let utter: SpeechSynthesisUtterance
  try {
    utter = new SpeechSynthesisUtterance(text)
  } catch {
    return
  }

  const lang = guessSpeechLang(text)
  try { if (lang) utter.lang = lang } catch { /* ignora */ }

  const { voice, pitch } = pickVoice(lang)
  try { if (voice) utter.voice = voice } catch { /* si legge comunque con la voce di default */ }
  try { utter.pitch = pitch } catch { /* ignora */ }
  try { utter.rate = 1.2 } catch { /* ignora */ } // 20% più veloce del ritmo di default

  try { window.speechSynthesis.speak(utter) } catch { /* la voce è un extra: mai bloccare la chat */ }
}

export function stopSpeaking(): void {
  if (!isSpeechSupported()) return
  try { window.speechSynthesis.cancel() } catch { /* ignora */ }
}
