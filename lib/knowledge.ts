// Helper condivisi tra le due sorgenti della Knowledge Base: upload di un file
// (app/api/knowledge/upload) e aggiunta di un link (app/api/knowledge/link).
// Stesso chunking/indicizzazione per entrambe: l'AI in RAG non distingue da
// dove viene il contenuto (vedi match_knowledge_chunks_fts).
import type { SupabaseClient } from '@supabase/supabase-js'

export function chunkText(text: string): string[] {
  const chunks: string[] = []
  let start = 0
  while (start < text.length) {
    const end = Math.min(start + 800, text.length)
    chunks.push(text.slice(start, end).trim())
    if (end >= text.length) break
    start += 700
  }
  return chunks.filter(c => c.length > 50)
}

export async function insertChunks(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any>,
  docId: string,
  title: string,
  chunks: string[]
) {
  const rows = chunks.map((content, i) => ({
    document_id: docId,
    title: `${title} (parte ${i + 1})`,
    content,
  }))
  for (let i = 0; i < rows.length; i += 50) {
    const { error } = await supabase.from('knowledge_chunks').insert(rows.slice(i, i + 50))
    if (error) throw new Error(`Chunk insert: ${error.message}`)
  }
  const { error: updErr } = await supabase
    .from('knowledge_documents')
    .update({ status: 'ready', chunk_count: rows.length })
    .eq('id', docId)
  if (updErr) throw new Error(`Status update: ${updErr.message}`)
}

// Estrazione testo molto semplice da HTML: basta per pagine di documentazione
// (manuali online, FAQ, guide d'uso) senza aggiungere una libreria di parsing
// HTML solo per questo. Non gestisce JS lato client (SPA): se la pagina non
// ha contenuto nel markup iniziale, il chunking scarterà il risultato (troppo
// corto) e la route restituirà un errore chiaro all'admin.
export function htmlToText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|li|h[1-6]|tr|section|article)>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/g, "'")
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

const BLOCKED_HOSTS = new Set(['localhost', '0.0.0.0', '::1'])

function isPrivateIPv4(host: string): boolean {
  const m = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/)
  if (!m) return false
  const a = Number(m[1]), b = Number(m[2])
  return a === 10 || a === 127 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168)
}

// Guardia SSRF di base: l'URL lo sceglie un admin (autenticato), non un
// cliente anonimo, quindi il rischio è più basso — ma un admin malizioso o
// un link copiato senza attenzione non deve poter far interrogare dal server
// indirizzi interni (localhost, rete privata, metadata cloud). Non protegge
// da DNS rebinding (richiederebbe pinning dell'IP risolto): limite accettato,
// non un servizio pubblico.
export function isSafeExternalUrl(url: URL): boolean {
  if (!['http:', 'https:'].includes(url.protocol)) return false
  const host = url.hostname.toLowerCase()
  if (BLOCKED_HOSTS.has(host)) return false
  if (isPrivateIPv4(host)) return false
  if (host.endsWith('.local') || host.endsWith('.internal')) return false
  return true
}
