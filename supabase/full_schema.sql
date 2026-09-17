-- ============================================================
-- FENIX SUPPORT — Schema completo (ricostruzione fedele dello stato attuale)
-- Generato dallo stato live del progetto hvrjnuszitrybesklnyt il 2026-07-03.
-- Include le 9 migrazioni tracciate + il drift non tracciato
-- (tabella ai_usage_log, policy anon per chat pubblica, job cron).
--
-- USO: incollare interamente nel SQL Editor del NUOVO progetto Supabase.
-- Idempotente: rieseguibile senza errori.
-- Dopo lo schema: vedi sezioni STORAGE, CRON e AUTH in fondo.
-- ============================================================

-- ---------- ESTENSIONI ----------
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- ---------- TECNICI (profilo esteso su auth.users) ----------
CREATE TABLE IF NOT EXISTS technician_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'technician' CHECK (role IN ('admin', 'technician')),
  display_name text,
  phone text,
  whatsapp text,
  email text,
  account_status text DEFAULT 'active' CHECK (account_status IN ('active', 'disabled', 'invited')),
  last_seen timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Crea automaticamente il profilo alla registrazione utente
-- SET search_path obbligatorio: il servizio auth invoca il trigger con un
-- search_path che non include public → senza, "relation does not exist"
CREATE OR REPLACE FUNCTION create_technician_profile()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.technician_profiles (id, display_name, email)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'display_name', NEW.email)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION create_technician_profile();

-- Helper admin (SECURITY DEFINER) per evitare ricorsione RLS
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean LANGUAGE sql SECURITY DEFINER SET search_path = public STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.technician_profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;
REVOKE ALL ON FUNCTION public.is_admin() FROM public;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated, service_role;

-- ---------- TICKET DI SUPPORTO ----------
CREATE TABLE IF NOT EXISTS support_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  priority text NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  subject text NOT NULL,
  customer_name text NOT NULL,
  customer_email text,
  customer_phone text,
  machine_serial text,
  machine_model text,
  center_name text,
  assigned_to uuid REFERENCES technician_profiles,
  ai_summary text,
  added_to_kb boolean DEFAULT false,
  escalated_at timestamptz,
  resolved_at timestamptz,
  problem_category text CHECK (problem_category IN ('hardware','PC','software','firmware','meccanica')),
  satisfaction_rating smallint CHECK (satisfaction_rating BETWEEN 0 AND 5),
  rated_at timestamptz,
  created_at timestamptz DEFAULT now()
);
COMMENT ON COLUMN public.support_tickets.problem_category IS
  'Categoria del problema assegnata dall''AI in fase di escalation: hardware, PC, software, firmware, meccanica';
COMMENT ON COLUMN public.support_tickets.satisfaction_rating IS
  'Valutazione 0-5 stelle chiesta dall''AI al cliente a fine chat, dopo conferma esplicita (vedi lib/chat)';

CREATE INDEX IF NOT EXISTS idx_tickets_status ON support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_created ON support_tickets(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tickets_assigned ON support_tickets(assigned_to);
-- Patch per DB già esistenti (idempotente, vedi nota d'intestazione del file)
ALTER TABLE support_tickets ADD COLUMN IF NOT EXISTS satisfaction_rating smallint CHECK (satisfaction_rating BETWEEN 0 AND 5);
ALTER TABLE support_tickets ADD COLUMN IF NOT EXISTS rated_at timestamptz;

-- ---------- MESSAGGI DEL TICKET ----------
CREATE TABLE IF NOT EXISTS ticket_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL REFERENCES support_tickets ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user', 'assistant', 'technician', 'system')),
  content text NOT NULL,
  media_url text,
  media_type text,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_messages_ticket ON ticket_messages(ticket_id, created_at);

-- ---------- KNOWLEDGE BASE — DOCUMENTI ----------
CREATE TABLE IF NOT EXISTS knowledge_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  file_url text,
  file_type text,
  status text NOT NULL DEFAULT 'processing' CHECK (status IN ('processing', 'ready', 'error')),
  chunk_count int DEFAULT 0,
  uploaded_by uuid REFERENCES technician_profiles,
  -- 'link': indicizzato da una pagina web (source_url) invece che da un file caricato
  source_type text NOT NULL DEFAULT 'file' CHECK (source_type IN ('file', 'link')),
  source_url text,
  created_at timestamptz DEFAULT now()
);
-- Patch per DB già esistenti (idempotente, vedi nota d'intestazione del file)
ALTER TABLE knowledge_documents ADD COLUMN IF NOT EXISTS source_type text NOT NULL DEFAULT 'file' CHECK (source_type IN ('file','link'));
ALTER TABLE knowledge_documents ADD COLUMN IF NOT EXISTS source_url text;

-- ---------- KNOWLEDGE BASE — CHUNKS (pgvector + full-text italian) ----------
CREATE TABLE IF NOT EXISTS knowledge_chunks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES knowledge_documents ON DELETE CASCADE,
  title text NOT NULL,
  content text NOT NULL,
  embedding vector(1536),
  fts tsvector GENERATED ALWAYS AS (
    to_tsvector('italian', coalesce(title, '') || ' ' || coalesce(content, ''))
  ) STORED,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_chunks_document ON knowledge_chunks(document_id);
CREATE INDEX IF NOT EXISTS idx_chunks_embedding ON knowledge_chunks
  USING hnsw (embedding vector_cosine_ops) WITH (m = 16, ef_construction = 64);
CREATE INDEX IF NOT EXISTS knowledge_chunks_fts_idx ON knowledge_chunks USING GIN (fts);

-- Ricerca semantica (vettoriale) — legacy, per embedding OpenAI
CREATE OR REPLACE FUNCTION match_knowledge_chunks(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 5
)
RETURNS TABLE (id uuid, document_id uuid, title text, content text, similarity float)
LANGUAGE sql STABLE AS $$
  SELECT kc.id, kc.document_id, kc.title, kc.content,
    1 - (kc.embedding <=> query_embedding) AS similarity
  FROM knowledge_chunks kc
  JOIN knowledge_documents kd ON kd.id = kc.document_id
  WHERE kd.status = 'ready'
    AND 1 - (kc.embedding <=> query_embedding) > match_threshold
  ORDER BY kc.embedding <=> query_embedding
  LIMIT match_count;
$$;

-- Ricerca full-text (in uso attuale, RAG su tsvector italiano)
CREATE OR REPLACE FUNCTION match_knowledge_chunks_fts(
  query_text text,
  match_count int DEFAULT 5
)
RETURNS TABLE(id uuid, document_id uuid, title text, content text, similarity float)
LANGUAGE plpgsql AS $$
DECLARE
  tsq tsquery;
BEGIN
  tsq := websearch_to_tsquery('italian', query_text);
  IF tsq IS NULL OR tsq::text = '' THEN
    RETURN QUERY
      SELECT kc.id, kc.document_id, kc.title, kc.content, 0.0::float
      FROM knowledge_chunks kc
      JOIN knowledge_documents kd ON kd.id = kc.document_id
      WHERE kd.status = 'ready'
      ORDER BY kc.created_at DESC
      LIMIT match_count;
    RETURN;
  END IF;
  RETURN QUERY
    SELECT kc.id, kc.document_id, kc.title, kc.content,
      ts_rank_cd(kc.fts, tsq)::float AS similarity
    FROM knowledge_chunks kc
    JOIN knowledge_documents kd ON kd.id = kc.document_id
    WHERE kd.status = 'ready' AND kc.fts @@ tsq
    ORDER BY similarity DESC
    LIMIT match_count;
END;
$$;

-- ---------- TURNI DI REPERIBILITÀ ----------
CREATE TABLE IF NOT EXISTS technician_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  technician_id uuid NOT NULL REFERENCES technician_profiles ON DELETE CASCADE,
  day_of_week int NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time time NOT NULL,
  end_time time NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_schedule_day ON technician_schedules(day_of_week, is_active);

-- ---------- FEEDBACK AI ----------
CREATE TABLE IF NOT EXISTS ai_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid REFERENCES support_tickets ON DELETE CASCADE,
  message_id uuid REFERENCES ticket_messages ON DELETE CASCADE,
  rating text NOT NULL CHECK (rating IN ('positive', 'negative')),
  comment text,
  created_at timestamptz DEFAULT now()
);

-- ---------- CONFIG AI (key/value) ----------
CREATE TABLE IF NOT EXISTS ai_config (
  key text PRIMARY KEY,
  value text NOT NULL,
  updated_by uuid REFERENCES technician_profiles,
  updated_at timestamptz DEFAULT now()
);
-- Config di default (i valori reali vengono migrati a parte, vedi script dati)
INSERT INTO ai_config (key, value) VALUES
  ('system_context', 'Macchine Endosphere per pressoterapia estetica. Modelli principali: Endosphere Body (trattamenti corpo, pressione max 120 bar), Endosphere Face (trattamenti viso, delicato). Componenti principali: motore brushless, pompa a pistone, sensori pressione/temperatura, display touch LVGL, microcontrollore ESP32-S3. Codici errore comuni: E01=pressione fuori range, E02=motore in stallo, E03=sovratemperatura, E04=sensore disconnesso. Reset di emergenza: tasto POWER 5 secondi.')
ON CONFLICT (key) DO NOTHING;

-- ---------- LOG USO AI (costi/token) ----------
CREATE TABLE IF NOT EXISTS ai_usage_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  input_tokens integer NOT NULL DEFAULT 0,
  output_tokens integer NOT NULL DEFAULT 0,
  cost_usd numeric NOT NULL DEFAULT 0,
  ticket_id uuid
);

-- ---------- CHAT DIRETTA TECNICO↔CLIENTE ----------
CREATE TABLE IF NOT EXISTS direct_chats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid REFERENCES support_tickets(id) ON DELETE CASCADE,
  technician_id uuid REFERENCES technician_profiles(id),
  status text DEFAULT 'active' CHECK (status IN ('active', 'closed')),
  access_token text UNIQUE DEFAULT encode(gen_random_bytes(24), 'base64'),
  claimed_at timestamptz,           -- quando un tecnico l'ha presa in carico
  created_at timestamptz DEFAULT now()
);
ALTER TABLE direct_chats ADD COLUMN IF NOT EXISTS claimed_at timestamptz;

-- ---------- INVITI PERSONALI ALLA CHAT DIRETTA ----------
-- Un token per ogni tecnico di turno. La chat nasce con technician_id NULL: il
-- primo tecnico che apre il proprio link la prende in carico (UPDATE condizionale
-- atomico in lib/direct-chat.ts), gli altri ricevono l'avviso. Solo service_role.
CREATE TABLE IF NOT EXISTS direct_chat_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id uuid NOT NULL REFERENCES direct_chats(id) ON DELETE CASCADE,
  technician_id uuid NOT NULL REFERENCES technician_profiles(id) ON DELETE CASCADE,
  token text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE (chat_id, technician_id)
);
CREATE INDEX IF NOT EXISTS idx_direct_chat_invites_chat ON direct_chat_invites(chat_id);

-- ---------- DEDUP NOTIFICHE REPERIBILITÀ ----------
CREATE TABLE IF NOT EXISTS on_call_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_id uuid NOT NULL REFERENCES technician_schedules(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('reminder','start')),
  for_date date NOT NULL,
  sent_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (schedule_id, kind, for_date)
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE technician_profiles   ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets       ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_messages       ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_documents   ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_chunks      ENABLE ROW LEVEL SECURITY;
ALTER TABLE technician_schedules  ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_feedback           ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_config             ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_usage_log          ENABLE ROW LEVEL SECURITY;
ALTER TABLE direct_chats          ENABLE ROW LEVEL SECURITY;
ALTER TABLE on_call_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE direct_chat_invites  ENABLE ROW LEVEL SECURITY;

-- technician_profiles
DROP POLICY IF EXISTS "Tecnico vede proprio profilo" ON technician_profiles;
CREATE POLICY "Tecnico vede proprio profilo" ON technician_profiles FOR SELECT USING (auth.uid() = id);
DROP POLICY IF EXISTS "Tecnico aggiorna proprio profilo" ON technician_profiles;
CREATE POLICY "Tecnico aggiorna proprio profilo" ON technician_profiles FOR UPDATE USING (auth.uid() = id);
DROP POLICY IF EXISTS "Admin vede tutti i profili" ON technician_profiles;
CREATE POLICY "Admin vede tutti i profili" ON technician_profiles FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- support_tickets
DROP POLICY IF EXISTS "Tecnici vedono ticket" ON support_tickets;
CREATE POLICY "Tecnici vedono ticket" ON support_tickets FOR ALL USING (auth.uid() IS NOT NULL);
DROP POLICY IF EXISTS "Clienti creano ticket" ON support_tickets;
CREATE POLICY "Clienti creano ticket" ON support_tickets FOR INSERT TO anon WITH CHECK (true);

-- ticket_messages
DROP POLICY IF EXISTS "Tecnici vedono messaggi" ON ticket_messages;
CREATE POLICY "Tecnici vedono messaggi" ON ticket_messages FOR ALL USING (auth.uid() IS NOT NULL);
DROP POLICY IF EXISTS "Clienti inviano messaggi" ON ticket_messages;
CREATE POLICY "Clienti inviano messaggi" ON ticket_messages FOR INSERT TO anon WITH CHECK (role = 'user'::text);

-- knowledge base
DROP POLICY IF EXISTS "Tecnici gestiscono KB docs" ON knowledge_documents;
CREATE POLICY "Tecnici gestiscono KB docs" ON knowledge_documents FOR ALL USING (auth.uid() IS NOT NULL);
DROP POLICY IF EXISTS "Tecnici vedono chunks" ON knowledge_chunks;
CREATE POLICY "Tecnici vedono chunks" ON knowledge_chunks FOR SELECT USING (auth.uid() IS NOT NULL);
DROP POLICY IF EXISTS "Service inserisce chunks" ON knowledge_chunks;
CREATE POLICY "Service inserisce chunks" ON knowledge_chunks FOR INSERT WITH CHECK (true);

-- schedule
DROP POLICY IF EXISTS "Tecnici gestiscono schedule" ON technician_schedules;
CREATE POLICY "Tecnici gestiscono schedule" ON technician_schedules FOR ALL USING (auth.uid() IS NOT NULL);

-- ai_config
DROP POLICY IF EXISTS "Leggi config" ON ai_config;
CREATE POLICY "Leggi config" ON ai_config FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admin inserisce config" ON ai_config;
CREATE POLICY "Admin inserisce config" ON ai_config FOR INSERT WITH CHECK (is_admin());
DROP POLICY IF EXISTS "Admin modifica config" ON ai_config;
CREATE POLICY "Admin modifica config" ON ai_config FOR UPDATE USING (is_admin()) WITH CHECK (is_admin());

-- ai_usage_log
DROP POLICY IF EXISTS "Admin reads usage" ON ai_usage_log;
CREATE POLICY "Admin reads usage" ON ai_usage_log FOR SELECT USING (is_admin());
DROP POLICY IF EXISTS "Service inserts usage" ON ai_usage_log;
CREATE POLICY "Service inserts usage" ON ai_usage_log FOR INSERT WITH CHECK (true);

-- ai_feedback
DROP POLICY IF EXISTS "Chiunque puo lasciare feedback" ON ai_feedback;
CREATE POLICY "Chiunque puo lasciare feedback" ON ai_feedback FOR INSERT WITH CHECK (true);

-- direct_chats
DROP POLICY IF EXISTS "service_role_all_direct_chats" ON direct_chats;
CREATE POLICY "service_role_all_direct_chats" ON direct_chats FOR ALL TO service_role USING (true) WITH CHECK (true);

-- on_call_notifications e direct_chat_invites: nessuna policy (accesso solo via service_role che bypassa RLS)

-- ============================================================
-- STORAGE BUCKETS
-- ============================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('knowledge-documents', 'knowledge-documents', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('chat-media', 'chat-media', true, 52428800,
  ARRAY['image/jpeg','image/png','image/gif','image/webp','video/mp4','video/quicktime','video/webm'])
ON CONFLICT (id) DO NOTHING;


-- ---------- POLICY RLS SUI BUCKET ----------
-- /api/knowledge/upload e /api/knowledge/[id] scrivono su 'knowledge-documents'
-- con la SESSIONE UTENTE (createClient), non col service role: senza queste
-- policy l'upload fallisce con "new row violates row-level security policy".
-- 'chat-media' non ha policy di proposito: ci scrive solo il service role,
-- che bypassa la RLS.
DROP POLICY IF EXISTS "KB docs lettura autenticati" ON storage.objects;
CREATE POLICY "KB docs lettura autenticati" ON storage.objects
  FOR SELECT TO authenticated USING (bucket_id = 'knowledge-documents');

DROP POLICY IF EXISTS "KB docs upload autenticati" ON storage.objects;
CREATE POLICY "KB docs upload autenticati" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'knowledge-documents');

DROP POLICY IF EXISTS "KB docs update autenticati" ON storage.objects;
CREATE POLICY "KB docs update autenticati" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'knowledge-documents')
  WITH CHECK (bucket_id = 'knowledge-documents');

DROP POLICY IF EXISTS "KB docs eliminazione autenticati" ON storage.objects;
CREATE POLICY "KB docs eliminazione autenticati" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'knowledge-documents');

-- ============================================================
-- CRON — controllo reperibilità ogni minuto
-- ATTENZIONE: sostituisci <CRON_SECRET> con il valore di env CRON_SECRET.
-- L'URL resta quello di Netlify (il sito non cambia, cambia solo il backend Supabase).
-- ============================================================
-- SELECT cron.schedule('on-call-check', '* * * * *', $CRON$
--   SELECT net.http_post(
--     url := 'https://fenix-support.netlify.app/api/cron/on-call',
--     headers := jsonb_build_object('Content-Type','application/json','x-cron-secret','<CRON_SECRET>'),
--     body := '{}'::jsonb
--   );
-- $CRON$);
