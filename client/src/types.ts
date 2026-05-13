export interface User {
  id: number;
  email: string;
  fullName: string;
  phone?: string;
  role: "owner" | "client" | "admin";
}

export interface Appointment {
  id: number;
  client_id: number;
  owner_id: number;
  start_time: string;
  end_time: string;
  status: "pending" | "confirmed" | "completed" | "denied" | "cancelled";
  booking_type: "slot" | "request";
  notes?: string;
  owner_response?: string;
  suggested_time?: string;
  fee?: string;
  actual_duration_min?: number;
  insurance_billed?: string;
  payment_status?: string;
  created_at: string;
  updated_at: string;
  client_name?: string;
  client_email?: string;
  owner_name?: string;
}

export interface Message {
  id: number;
  sender_id: number;
  receiver_id: number;
  content: string;
  is_read: boolean;
  created_at: string;
  sender_name?: string;
}

export interface Conversation {
  user_id: number;
  full_name: string;
  email: string;
  last_message: string;
  last_message_at: string;
  unread_count: number;
}

export interface AvailabilitySlot {
  id: number;
  owner_id: number;
  day_of_week: number;
  start_time: string;
  end_time: string;
  slot_duration_min: number;
  is_active: boolean;
}

export interface OpenSlot {
  start: string;
  end: string;
}
