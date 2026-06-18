export type UserRole = 'admin' | 'technician'

export interface TechnicianProfile {
  id: string
  role: UserRole
  display_name: string | null
  phone: string | null
  whatsapp: string | null
  email: string | null
  created_at: string
}

export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed'
export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent'

export interface SupportTicket {
  id: string
  status: TicketStatus
  priority: TicketPriority
  subject: string
  customer_name: string
  customer_email: string | null
  customer_phone: string | null
  machine_serial: string | null
  machine_model: string | null
  center_name: string | null
  assigned_to: string | null
  ai_summary: string | null
  escalated_at: string | null
  resolved_at: string | null
  created_at: string
  // joined
  assignee?: TechnicianProfile
  messages?: TicketMessage[]
}

export interface TicketMessage {
  id: string
  ticket_id: string
  role: 'user' | 'assistant' | 'technician' | 'system'
  content: string
  created_at: string
}

export interface KnowledgeDocument {
  id: string
  title: string
  description: string | null
  file_url: string | null
  file_type: string | null
  status: 'processing' | 'ready' | 'error'
  chunk_count: number
  uploaded_by: string | null
  created_at: string
}

export interface TechnicianSchedule {
  id: string
  technician_id: string
  day_of_week: number  // 0=Sun, 1=Mon...6=Sat
  start_time: string   // HH:MM
  end_time: string
  is_active: boolean
  technician?: TechnicianProfile
}

export interface AiFeedback {
  id: string
  ticket_id: string
  message_id: string
  rating: 'positive' | 'negative'
  comment: string | null
  created_at: string
}
