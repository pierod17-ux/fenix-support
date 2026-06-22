# Fenix Support — Contesto per Claude Code

Portale di supporto tecnico AI per macchine **Endosphere** (pressoterapia estetica).
Cliente: Fenix / Damtec. Admin: Piero D'Amico (pierod17@gmail.com).

## Stack
- Next.js 15 App Router · TypeScript strict · Tailwind v4
- Supabase PostgreSQL + RLS (project: `hvrjnuszitrybesklnyt`)
- Anthropic Claude `claude-sonnet-4-6` streaming SSE
- PostgreSQL full-text search (RAG, tsvector italian)
- Resend email (from: info@damtec.it)
- Netlify deploy → https://fenix-support.netlify.app (site ID: `ee5d6db8-3615-4f87-96ae-07432c0b5a47`)
- Repo: GitHub `pierod17-ux/fenix-support`, branch `master`

## Flusso principale
1. Cliente apre `/chat` → form info → chat streaming AI
2. AI diagnostica con RAG su `knowledge_chunks`
3. Se non risolve → tool `escalate_to_technician` → ticket + email tecnico
4. Tecnico apre chat diretta con cliente via link `/tech/[token]`
5. Admin gestisce tutto da `/admin` (login Supabase Auth)

## Pattern critici — leggere sempre prima di toccare le API routes

```
createClient()        = SSR client, legge cookie sessione → usare per auth check
createServiceClient() = service role, bypassa RLS → usare per operazioni senza sessione
```

**MAI** `createServiceClient().auth.getUser()` → restituisce sempre null.

Auth admin pattern corretto:
```typescript
const supabase = await createClient()           // SSR — legge la sessione
const { data: { user } } = await supabase.auth.getUser()
if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })
// poi usa supabase (o createServiceClient()) per le query DB
```

## RLS ai_config
- **SELECT**: pubblico (anche anon) — la chat route legge config senza sessione utente
- **INSERT/UPDATE**: solo admin (`technician_profiles.role = 'admin'`)

## Struttura directory chiave
```
app/
  chat/                    → pagina chat pubblica cliente
  admin/
    schedule/              → gestione reperibilità (tecnici + turni)
    training/              → Training AI (contesti, regole, costi)
    tickets/               → lista e dettaglio ticket
  tech/[token]/            → chat diretta tecnico (accesso via link email)
  api/
    chat/                  → streaming AI + escalation tool
    escalate/              → crea ticket, trova tecnico on-call, invia email
    direct-chat/           → gestione chat diretta tecnico↔cliente
    technicians/           → CRUD tecnici + inviti + reset password
    config/
      contexts/            → GET/POST system_contexts (multi-sezione)
      rules/               → GET/POST behavior_rules
      cost-limit/          → GET/POST cost_limit_usd
      prompt/              → GET/POST system_context (legacy fallback)
components/
  chat/ChatInterface.tsx   → UI chat cliente (escalation, direct chat, polling)
  admin/
    ScheduleEditor.tsx     → Apple-style: tab Tecnici + tab Turni
    SystemContextsEditor.tsx → editor multi-sezione contesti AI
    AIRulesEditor.tsx      → regole comportamento per categoria
    AICostTracker.tsx      → monitoraggio costi mensili
lib/
  supabase/server.ts       → createClient() e createServiceClient()
  email.ts                 → template email branded (Resend)
```

## Tabelle Supabase
| Tabella | Scopo |
|---|---|
| `technician_profiles` | Tecnici e admin (role, account_status, phone) |
| `support_tickets` | Ticket con stato, priorità, AI summary |
| `ticket_messages` | Messaggi chat (role: user \| assistant \| technician) |
| `technician_schedules` | Turni settimanali reperibilità |
| `direct_chats` | Chat diretta con access_token UUID |
| `ai_config` | Config AI key/value: system_contexts, behavior_rules, cost_limit_usd |
| `ai_usage_log` | Log token e costi |
| `knowledge_chunks` | Documenti indicizzati per RAG |

## Features completate
- ✅ Chat AI streaming con escalation tool
- ✅ Sistema reperibilità: tecnici (inviti, disable, reset pwd) + turni settimanali
- ✅ Chat diretta tecnico↔cliente con media upload (bucket: `chat-media`)
- ✅ Email branded: invito tecnico, reset password, notifica chat diretta
- ✅ Training AI: contesti multi-sezione, regole comportamento, monitoraggio costi
- ✅ RAG su knowledge base (documenti + ticket risolti)

## Env vars necessari (.env.local)
Le chiavi sono nel file `.env.local` (ignorato da git, sincronizzato via OneDrive).
Se mancano, le trovi nella memoria Claude in `project_credentials.md`.

## Stile UI
Apple-inspired: colori CSS variables (`--surface`, `--accent`, `--text-primary` ecc.),
border-radius generosi (16-20px), backdrop-filter blur, boxShadow `var(--shadow-md)`.
Font: `-apple-system, sans-serif`. Niente librerie UI esterne.
