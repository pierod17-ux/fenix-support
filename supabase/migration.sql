-- ============================================================
-- FENIX SUPPORT — Database Migration
-- Eseguire su Supabase SQL Editor (nuovo progetto o stesso progetto)
-- ============================================================

-- Abilita pgvector per gli embedding RAG
CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================================
-- TECNICI (auth via Supabase Auth, profilo esteso)
-- ============================================================
CREATE TABLE technician_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'technician' CHECK (role IN ('admin', 'technician')),
  display_name text,
  phone text,
  whatsapp text,      -- numero internazionale senza +, es. 393331234567
  email text,
  created_at timestamptz DEFAULT now()
);

-- Crea profilo automaticamente alla registrazione utente
CREATE OR REPLACE FUNCTION create_technician_profile()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO technician_profiles (id, display_name, email)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'display_name', NEW.email)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION create_technician_profile();

-- ============================================================
-- TICKET DI SUPPORTO
-- ============================================================
CREATE TABLE support_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  status text NOT NULL DEFAULT 'open'
    CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  priority text NOT NULL DEFAULT 'medium'
    CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
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
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_tickets_status ON support_tickets(status);
CREATE INDEX idx_tickets_created ON support_tickets(created_at DESC);
CREATE INDEX idx_tickets_assigned ON support_tickets(assigned_to);

-- ============================================================
-- MESSAGGI DEL TICKET (conversazione chat)
-- ============================================================
CREATE TABLE ticket_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL REFERENCES support_tickets ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user', 'assistant', 'technician', 'system')),
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_messages_ticket ON ticket_messages(ticket_id, created_at);

-- ============================================================
-- KNOWLEDGE BASE — DOCUMENTI
-- ============================================================
CREATE TABLE knowledge_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  file_url text,
  file_type text,   -- 'pdf' | 'docx' | 'txt' | 'ticket'
  status text NOT NULL DEFAULT 'processing'
    CHECK (status IN ('processing', 'ready', 'error')),
  chunk_count int DEFAULT 0,
  uploaded_by uuid REFERENCES technician_profiles,
  created_at timestamptz DEFAULT now()
);

-- ============================================================
-- KNOWLEDGE BASE — CHUNKS CON EMBEDDING (pgvector)
-- ============================================================
CREATE TABLE knowledge_chunks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES knowledge_documents ON DELETE CASCADE,
  title text NOT NULL,
  content text NOT NULL,
  embedding vector(1536),   -- text-embedding-3-small di OpenAI
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_chunks_document ON knowledge_chunks(document_id);
-- Indice HNSW per ricerca vettoriale veloce
CREATE INDEX idx_chunks_embedding ON knowledge_chunks
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- Funzione per la ricerca semantica (RAG)
CREATE OR REPLACE FUNCTION match_knowledge_chunks(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 5
)
RETURNS TABLE (
  id uuid,
  document_id uuid,
  title text,
  content text,
  similarity float
)
LANGUAGE sql STABLE AS $$
  SELECT
    kc.id,
    kc.document_id,
    kc.title,
    kc.content,
    1 - (kc.embedding <=> query_embedding) AS similarity
  FROM knowledge_chunks kc
  JOIN knowledge_documents kd ON kd.id = kc.document_id
  WHERE kd.status = 'ready'
    AND 1 - (kc.embedding <=> query_embedding) > match_threshold
  ORDER BY kc.embedding <=> query_embedding
  LIMIT match_count;
$$;

-- ============================================================
-- TURNI DI REPERIBILITÀ
-- ============================================================
CREATE TABLE technician_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  technician_id uuid NOT NULL REFERENCES technician_profiles ON DELETE CASCADE,
  day_of_week int NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),  -- 0=Dom
  start_time time NOT NULL,
  end_time time NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_schedule_day ON technician_schedules(day_of_week, is_active);

-- ============================================================
-- FEEDBACK AI (like/dislike sulle risposte)
-- ============================================================
CREATE TABLE ai_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid REFERENCES support_tickets ON DELETE CASCADE,
  message_id uuid REFERENCES ticket_messages ON DELETE CASCADE,
  rating text NOT NULL CHECK (rating IN ('positive', 'negative')),
  comment text,
  created_at timestamptz DEFAULT now()
);

-- ============================================================
-- CONFIGURAZIONE AI (prompt, parametri)
-- ============================================================
CREATE TABLE ai_config (
  key text PRIMARY KEY,
  value text NOT NULL,
  updated_by uuid REFERENCES technician_profiles,
  updated_at timestamptz DEFAULT now()
);

-- Inserisci configurazione default
INSERT INTO ai_config (key, value) VALUES
  ('system_context', 'Macchine Endosphere per pressoterapia estetica. Modelli principali: Endosphere Body (trattamenti corpo, pressione max 120 bar), Endosphere Face (trattamenti viso, delicato). Componenti principali: motore brushless, pompa a pistone, sensori pressione/temperatura, display touch LVGL, microcontrollore ESP32-S3. Codici errore comuni: E01=pressione fuori range, E02=motore in stallo, E03=sovratemperatura, E04=sensore disconnesso. Reset di emergenza: tasto POWER 5 secondi.');

-- ============================================================
-- STORAGE BUCKET per i documenti
-- ============================================================
-- Eseguire nella console Supabase: Storage > New bucket
-- Nome: knowledge-documents, Public: false

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE technician_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE technician_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_config ENABLE ROW LEVEL SECURITY;

-- Tecnici: vedono il proprio profilo
CREATE POLICY "Tecnico vede proprio profilo" ON technician_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Tecnico aggiorna proprio profilo" ON technician_profiles
  FOR UPDATE USING (auth.uid() = id);

-- Admin: vede tutto
CREATE POLICY "Admin vede tutti i profili" ON technician_profiles
  FOR ALL USING (
    EXISTS (SELECT 1 FROM technician_profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Ticket: autenticati vedono tutti (tecnici), clienti usano service_role via API
CREATE POLICY "Tecnici vedono ticket" ON support_tickets
  FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Tecnici vedono messaggi" ON ticket_messages
  FOR ALL USING (auth.uid() IS NOT NULL);

-- Knowledge Base: solo autenticati
CREATE POLICY "Tecnici gestiscono KB docs" ON knowledge_documents
  FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Tecnici vedono chunks" ON knowledge_chunks
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Service inserisce chunks" ON knowledge_chunks
  FOR INSERT WITH CHECK (true);  -- service_role bypassa RLS

-- Schedule: solo autenticati
CREATE POLICY "Tecnici gestiscono schedule" ON technician_schedules
  FOR ALL USING (auth.uid() IS NOT NULL);

-- AI Config: solo admin
CREATE POLICY "Admin gestisce config" ON ai_config
  FOR ALL USING (
    EXISTS (SELECT 1 FROM technician_profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Feedback: pubblico (clienti non autenticati)
CREATE POLICY "Chiunque può lasciare feedback" ON ai_feedback
  FOR INSERT WITH CHECK (true);
