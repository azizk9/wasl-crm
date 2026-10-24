export type Source = 'Instagram' | 'WhatsApp' | 'Facebook' | 'Website' | 'Referral' | 'Other';
export type CustomerStatus = 'New' | 'Contacted' | 'Interested' | 'Customer' | 'Inactive';
export type DealStage = 'New Lead' | 'Contacted' | 'Qualified' | 'Proposal' | 'Negotiation' | 'Won' | 'Lost';
export type TaskPriority = 'Low' | 'Medium' | 'High';
export type TaskStatus = 'Pending' | 'Completed';
export type AppointmentStatus = 'Scheduled' | 'Completed' | 'Cancelled';
export type ActivityType = 'Note' | 'Call' | 'Message' | 'Meeting' | 'WhatsApp';
export interface BaseModel { id: string; owner_id: string; created_at: string; }
export interface Customer extends BaseModel {
  name: string; phone: string; email: string; source: Source; status: CustomerStatus;
  notes: string; is_archived: boolean; updated_at: string;
  next_action: string; next_follow_up_at: string | null;
}
export interface Deal extends BaseModel {
  customer_id: string; title: string; value: number; currency: string;
  stage: DealStage; expected_close_date: string | null; updated_at: string;
}
export interface Task extends BaseModel {
  customer_id: string | null; deal_id: string | null; title: string;
  priority: TaskPriority; status: TaskStatus; due_at: string | null; updated_at: string;
}
export interface Appointment extends BaseModel {
  customer_id: string; title: string; starts_at: string; ends_at: string;
  status: AppointmentStatus; notes: string; updated_at: string;
}
export interface Activity extends BaseModel {
  customer_id: string; type: ActivityType; content: string;
}
export interface Profile { id: string; full_name: string; created_at: string; updated_at: string; }
export type DataTable = 'customers' | 'deals' | 'tasks' | 'appointments' | 'activities';
