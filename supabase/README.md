# Supabase — Runbook (ricreare il progetto da zero)

Procedura per ricostruire il backend fenix-support su un nuovo progetto Supabase
(disaster recovery, o migrazione verso un'altra org/piano). Testata il 2026-07-06
durante la migrazione da DAMTEC srl (a pagamento) all'org **FreeDamtec** (Free).

**Progetto di produzione attuale**: `zrjskqqngaijloamiros` — org FreeDamtec — piano Free.

> ⚠️ Piano Free: il progetto va in **pausa dopo 7 giorni senza traffico**. Si riattiva
> dalla dashboard in un clic. Limiti: 500 MB DB, niente backup automatici.

---

## File in questa cartella
| File | Contenuto | Uso |
|---|---|---|
| `full_schema.sql` | Schema completo idempotente (tabelle, funzioni RAG, RLS, policy, trigger, storage bucket) | **Fonte di verità** |
| `seed_data.sql` | Knowledge base (2 documenti + 88 chunk) + `ai_config` (4 chiavi) | Dati con valore reale |
| `migration.sql` | ⚠️ **OBSOLETO** — solo schema iniziale del 19/06, con bug RLS ricorsivo | Non usare |

---

## Passi

### 1. Crea il progetto
Dashboard Supabase → org desiderata → **New project** → region **eu-central-1 (Frankfurt)**
(come gli altri progetti Damtec) → password DB robusta (annotala, ma serve solo per
connessioni Postgres dirette; l'app usa le API key).

### 2. Applica lo schema
SQL Editor → incolla ed esegui **tutto** `full_schema.sql`.
Abilita `vector`, `pg_cron`, `pg_net` e crea tabelle/funzioni/RLS/policy/bucket.
- Se `CREATE EXTENSION pg_cron/pg_net` fallisse, abilitali prima da Database → Extensions.

### 3. Carica i dati
SQL Editor → esegui `seed_data.sql` (documenti prima dei chunk per via delle FK).
Verifica: `select count(*) from knowledge_chunks;` → **88**, `ai_config` → **4**.

### 4. Crea l'utente admin
Il trigger `on_auth_user_created` crea il profilo automaticamente (con
`SET search_path = public`, già nello schema — senza, la creazione utente fallisce).

Via dashboard: **Authentication → Users → Add user** → email `pierod17@gmail.com`,
password, ✅ **Auto Confirm User**.

Oppure via API (serve la `service_role` key `$SRK`):
```bash
curl -X POST "https://<PROJECT_REF>.supabase.co/auth/v1/admin/users" \
  -H "apikey: $SRK" -H "Authorization: Bearer $SRK" -H "Content-Type: application/json" \
  -d '{"email":"pierod17@gmail.com","password":"<PWD>","email_confirm":true,"user_metadata":{"display_name":"Piero D'\''Amico"}}'
```

Poi **promuovi ad admin** (il trigger assegna `role='technician'` di default):
```sql
UPDATE technician_profiles SET role='admin' WHERE email='pierod17@gmail.com';
```

### 5. Configura Auth URL (indispensabile per i link email)
Dashboard → **Authentication → URL Configuration**:
- **Site URL**: `https://fenix-support.netlify.app`
- **Redirect URLs** → Add URL: `https://fenix-support.netlify.app/**`

Senza questo, i link di invito/reset/recupero password vengono rimandati alla home.

### 6. Crea il job cron reperibilità
SQL Editor (`<CRON_SECRET>` = valore della env `CRON_SECRET` su Netlify):
```sql
select cron.schedule('on-call-check', '* * * * *', $CRON$
  SELECT net.http_post(
    url := 'https://fenix-support.netlify.app/api/cron/on-call',
    headers := jsonb_build_object('Content-Type','application/json','x-cron-secret','<CRON_SECRET>'),
    body := '{}'::jsonb
  );
$CRON$);
```
L'URL resta quello Netlify (cambia il backend, non il sito). Verifica: `select * from cron.job;`

### 7. Ripunta le env var su Netlify e ridistribuisci
Cambiano **solo le 3 Supabase** (Site settings → Environment variables):
- `NEXT_PUBLIC_SUPABASE_URL` = `https://<PROJECT_REF>.supabase.co`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` = anon key (legacy JWT) del nuovo progetto
- `SUPABASE_SERVICE_ROLE_KEY` = service_role secret del nuovo progetto

Le altre (Resend, Anthropic, WhatsApp, `CRON_SECRET`, URL) restano invariate.
Poi **trigger deploy** (le env si applicano solo a un nuovo build) e aggiorna anche
il `.env.local` locale.

### 8. Verifica end-to-end
- Login admin su `https://fenix-support.netlify.app/login`
- Chat pubblica `/chat` risponde e fa RAG (la KB va via service client)
- "Password dimenticata" invia l'email e il link porta a `/auth/set-password`

---

## Note operative
- **Connettore Supabase MCP**: vede una sola org alla volta. Per operare sul DB di fenix
  via MCP il connettore va puntato su **FreeDamtec**; in alternativa REST + service_role key.
- **Tecnici**: dopo un ripristino "pulito" esiste solo l'admin. Gli altri tecnici si
  reinvitano da `/admin` (e vanno ricreati i loro turni di reperibilità).
- **File storage**: i bucket vengono creati vuoti dallo schema. I documenti KB originali
  non sono necessari al RAG (che usa la full-text search sul testo dei chunk); il link
  "scarica originale" resterebbe rotto finché non si ricaricano i file.
