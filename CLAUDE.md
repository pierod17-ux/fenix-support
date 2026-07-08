# Fenix Support — Contesto per Claude Code

Portale di supporto tecnico AI per macchine **Endosphere** (pressoterapia estetica).
Cliente: Fenix / Damtec. Admin: Piero D'Amico (pierod17@gmail.com).

## Stack
- Next.js 15 App Router · TypeScript strict · Tailwind v4
- Supabase PostgreSQL + RLS (project: `zrjskqqngaijloamiros`, org **FreeDamtec**, piano Free — attenzione: i progetti Free vanno in pausa dopo 7 giorni senza traffico)
- Anthropic Claude `claude-sonnet-4-6` streaming SSE
- PostgreSQL full-text search (RAG, tsvector italian)
- Resend email (from: sensor-smart@damtec.net — dominio verificato su Resend)
- Netlify deploy → https://fenix-support.netlify.app (site ID: `ee5d6db8-3615-4f87-96ae-07432c0b5a47`)
- Repo: GitHub `pierod17-ux/fenix-support`, branch `master`

## Infrastruttura & accessi Supabase (leggere prima di operare sul DB)
- **Progetto attuale**: `zrjskqqngaijloamiros` (nome `fenix-support`), org **FreeDamtec** (`acunslgniodhpqhomshn`), piano **Free**.
- ⚠️ **Il connettore Supabase MCP vede UNA sola organizzazione alla volta.** Spesso è collegato a **DAMTEC srl** (dove stanno SensorSmart ecc.), NON a FreeDamtec → in quel caso `list_projects` NON mostra il progetto fenix e le query MCP falliscono. Per lavorare sul DB via MCP l'utente deve riconnettere il connettore all'org FreeDamtec. In alternativa si opera via REST con URL + service_role key (vedi env).
- **Storia**: migrato il 2026-07-06 da un vecchio progetto (org DAMTEC srl, a pagamento, poi eliminato) a questo Free per risparmiare ~10€/mese. Migrati SOLO knowledge base + `ai_config`; ticket/conversazioni/tecnici erano dati di test e NON sono stati portati → **il DB è sostanzialmente pulito**: c'è solo l'admin `pierod17@gmail.com`, nessun altro tecnico, nessun turno, KB con 2 documenti / 88 chunk.
- **Schema versionato**: `supabase/full_schema.sql` (schema completo idempotente, fedele al live) + `supabase/seed_data.sql` (KB + config). ⚠️ `supabase/migration.sql` è **OBSOLETO** (solo schema iniziale del 19/06, contiene pure il bug RLS ricorsivo poi corretto) — NON usarlo.
- **Gotcha trigger**: `create_technician_profile()` DEVE avere `SET search_path = public`, altrimenti il servizio Auth (che invoca il trigger con un search_path senza `public`) fallisce con "relation technician_profiles does not exist" → creazione utenti KO.

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

## Link email set-password (invito tecnico / reset / recupero password) — NON regredire
I link inviati via email portano a `/auth/set-password?token_hash=...&type=recovery|invite`.
Il token viene consumato **solo al submit del form** (`supabase.auth.verifyOtp`), non al
caricamento della pagina. Motivo: i filtri antispam/anteprima dei client di posta
"pre-aprono" i link, e il vecchio `action_link` monouso (`/auth/v1/verify?token=...`)
veniva bruciato dal primo GET dello scanner → "link scaduto" prima del clic utente.
- Helper unico: `lib/auth-links.ts` → `buildSetPasswordLink(siteUrl, properties, type)`.
  Usa `properties.hashed_token` da `generateLink`; fallback compatibile al vecchio `action_link`.
- Usato da: `api/auth/forgot-password`, `api/technicians` (invito), `api/technicians/[id]/reset-password`.
- La pagina `/auth/set-password` gestisce sia `?token_hash=` (nuovo) sia `#access_token=` (legacy).
- **Config Auth Supabase obbligatoria** (dashboard → Auth → URL Configuration):
  Site URL = `https://fenix-support.netlify.app`, Redirect URLs deve includere
  `https://fenix-support.netlify.app/**` — altrimenti GoTrue scarta il `redirect_to` e rimanda alla home.

## Struttura directory chiave
```
app/
  chat/                    → pagina chat pubblica cliente
  admin/
    schedule/              → gestione reperibilità (tecnici + turni)
    training/              → Training AI (contesti, regole, costi)
    tickets/               → lista e dettaglio ticket
  tech/[token]/            → chat diretta tecnico (accesso via link email)
  login/                   → login admin + "Password dimenticata"
  auth/set-password/       → imposta/reset password via token_hash (invito e recovery)
  api/
    chat/                  → streaming AI + escalation tool
    escalate/              → crea ticket, trova tecnico on-call, invia email
    direct-chat/           → gestione chat diretta tecnico↔cliente
    technicians/           → CRUD tecnici + inviti + reset password
    auth/forgot-password/  → recupero password pubblico (invia email di reset)
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
  auth-links.ts            → buildSetPasswordLink() (link email token_hash anti-scanner)
supabase/
  full_schema.sql          → schema completo idempotente (fonte di verità)
  seed_data.sql            → dati KB + config AI
  migration.sql            → OBSOLETO (non usare)
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
| `on_call_notifications` | Dedup invii mail reperibilità (schedule_id, kind, for_date) |

## Features completate
- ✅ Chat AI streaming con escalation tool — IA "**Aura**", multilingua (rileva lingua utente)
- ✅ Modelli macchina: Evolution, Essenza, Sensor Smart, Sensor Therapy
- ✅ Sistema reperibilità: tecnici (inviti, disable, reset pwd, **elimina**) + turni settimanali
- ✅ Permessi turni: admin gestisce tutto; tecnico vede solo i propri (read-only)
- ✅ Stato online tecnici (heartbeat → `last_seen`, pallino verde in reperibilità)
- ✅ Mail reperibilità automatica (pg_cron → `/api/cron/on-call`, 10min prima + inizio turno)
- ✅ Invito tecnico end-to-end: `/auth/set-password` (flusso `token_hash`, vedi sezione dedicata)
- ✅ Recupero password pubblico da `/login` ("Password dimenticata") + reset password admin-side
- ✅ Link email a prova di scanner antispam (`token_hash` consumato solo al submit)
- ✅ Sessione persistente: `middleware.ts` rinnova token ad ogni richiesta
- ✅ Eliminazione ticket (admin-only, cascade)
- ✅ Chat diretta tecnico↔cliente con media upload (bucket: `chat-media`)
- ✅ Email branded da `sensor-smart@damtec.net`: invito, reset pwd, chat diretta, reperibilità
- ✅ Training AI: contesti multi-sezione, regole comportamento, monitoraggio costi
- ✅ RAG su knowledge base (documenti + ticket risolti)

## Automazioni infra
- **pg_cron** job `on-call-check` (ogni minuto) → POST `/api/cron/on-call` con header `x-cron-secret` (env `CRON_SECRET`). Dedup in `on_call_notifications`. Ora in Europe/Rome.
- **Env var su Netlify**: cambiarne una richiede un nuovo deploy per applicarla al runtime. NON marcare le var come "secret" (non vengono iniettate nel runtime Next.js).

## Env vars necessari (.env.local)
Template in `.env.local.example`. Le chiavi reali sono nel file `.env.local`
(ignorato da git, sincronizzato via OneDrive); se mancano, in memoria Claude `project_credentials.md`.
- **Runtime (produzione)**: le env sono su **Netlify** (site `ee5d6db8-...`), già ripuntate al nuovo
  progetto Supabase. Cambiano solo le 3 Supabase (`NEXT_PUBLIC_SUPABASE_URL`,
  `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`); Resend/Anthropic/WhatsApp/`CRON_SECRET` invariate.
- ⚠️ **`.env.local` locale**: dopo la migrazione va aggiornato con URL + chiavi del nuovo progetto
  `zrjskqqngaijloamiros` (il vecchio progetto è stato eliminato → le vecchie chiavi non funzionano più).

## Stile UI
Apple-inspired: colori CSS variables (`--surface`, `--accent`, `--text-primary` ecc.),
border-radius generosi (16-20px), backdrop-filter blur, boxShadow `var(--shadow-md)`.
Font: `-apple-system, sans-serif`. Niente librerie UI esterne.
