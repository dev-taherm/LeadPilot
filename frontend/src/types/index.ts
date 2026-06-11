export type LeadStatus = 'new' | 'contacted' | 'qualified' | 'unqualified' | 'meeting_booked' | 'won' | 'lost';
export type LeadSource = 'website' | 'referral' | 'social' | 'cold_call' | 'advertisement' | 'other';

export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: 'super_admin' | 'business_owner' | 'staff';
  phone: string;
  avatar: string | null;
  business_id: number | null;
}

export interface Business {
  id: number;
  name: string;
  slug: string;
  logo: string | null;
  website: string | null;
  industry: string;
  description: string;
  services: string[];
  faq: { question: string; answer: string }[];
  timezone: string;
  operating_hours: Record<string, string>;
  ai_prompt_config: Record<string, unknown>;
  owner: User;
  is_active: boolean;
}

export interface Lead {
  id: number;
  name: string;
  email: string;
  phone: string;
  company: string | null;
  source: LeadSource;
  status: LeadStatus;
  score: number;
  assigned_to: User | null;
  notes: string;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface Conversation {
  id: number;
  lead: Lead;
  status: 'active' | 'paused' | 'closed' | 'ai_handoff';
  channel: string;
  ai_paused: boolean;
  assigned_to: User | null;
  last_message_at: string;
  created_at: string;
}

export interface Message {
  id: number;
  conversation: number;
  sender_type: 'lead' | 'ai' | 'staff' | 'system';
  content: string;
  channel: string;
  is_ai_generated: boolean;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface KnowledgeDocument {
  id: number;
  title: string;
  file: string;
  content: string;
  document_type: string;
  is_indexed: boolean;
  created_at: string;
}

export interface CalendarEvent {
  id: number;
  lead: Lead;
  title: string;
  description: string;
  start_time: string;
  end_time: string;
  status: string;
  created_at: string;
}

export interface AnalyticsSnapshot {
  id: number;
  date: string;
  total_leads: number;
  new_leads: number;
  qualified_leads: number;
  meetings_booked: number;
  conversion_rate: number;
  avg_response_time: number;
  ai_interactions: number;
  active_conversations: number;
}

export interface Notification {
  id: number;
  title: string;
  message: string;
  notification_type: string;
  is_read: boolean;
  link: string | null;
  created_at: string;
}

export interface AgentExecution {
  id: number;
  lead: Lead;
  status: string;
  input_data: Record<string, unknown>;
  output_data: Record<string, unknown>;
  started_at: string;
  completed_at: string | null;
}

export interface Pagination {
  count: number;
  total_pages: number;
  current_page: number;
  page_size: number;
  next: string | null;
  previous: string | null;
}

export interface PaginatedResponse<T> {
  success: boolean;
  pagination: Pagination;
  results: T[];
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: {
    status_code: number;
    message: string;
    details: Record<string, unknown>;
  };
}
