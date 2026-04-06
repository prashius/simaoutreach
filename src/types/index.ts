export interface User {
  id: string
  email: string
  name: string | null
  avatar_url: string | null
  plan: string
  emails_limit: number
  emails_used: number
  plan_start: string | null
  plan_end: string | null
  smtp_host: string | null
  smtp_port: number | null
  smtp_user: string | null
  smtp_from: string | null
  smtp_from_name: string | null
  created_at: string
}

export interface Campaign {
  id: string
  user_id: string
  name: string
  status: 'draft' | 'generating' | 'ready' | 'sending' | 'sent' | 'paused'
  mode: 'simple' | 'deep'
  sender_name: string | null
  sender_email: string | null
  product_description: string | null
  call_to_action: string | null
  total_contacts: number
  emails_generated: number
  emails_approved: number
  emails_sent: number
  emails_replied: number
  created_at: string
  updated_at: string
}

export interface Contact {
  id: number
  user_id: string
  campaign_id: string
  email: string
  first_name: string | null
  last_name: string | null
  company_name: string | null
  title: string | null
  research_data: Record<string, any> | null
  created_at: string
}

export interface EmailSend {
  id: number
  user_id: string
  campaign_id: string
  contact_id: number
  subject: string | null
  body: string | null
  send_type: string
  status: 'draft' | 'approved' | 'sent' | 'failed'
  ai_research: Record<string, any> | null
  edited_by_user: boolean
  approved_at: string | null
  sent_at: string | null
  failed_reason: string | null
  message_id: string | null
  in_reply_to: string | null
  created_at: string
  // Joined fields
  contact_email?: string
  contact_first_name?: string
  contact_last_name?: string
  contact_company?: string
  contact_title?: string
}

export interface Payment {
  id: string
  user_id: string
  razorpay_order_id: string | null
  razorpay_payment_id: string | null
  amount: number
  currency: string
  plan_type: string
  status: string
  created_at: string
}
