export const SOURCES = { Instagram: 'إنستغرام', WhatsApp: 'واتساب', Facebook: 'فيسبوك', Website: 'الموقع', Referral: 'ترشيح', Other: 'أخرى' } as const;
export const CUSTOMER_STATUSES = { New: 'جديد', Contacted: 'تم التواصل', Interested: 'مهتم', Customer: 'عميل', Inactive: 'غير نشط' } as const;
export const DEAL_STAGES = { 'New Lead': 'فرصة جديدة', Contacted: 'تم التواصل', Qualified: 'مؤهل', Proposal: 'عرض سعر', Negotiation: 'تفاوض', Won: 'مكتسب', Lost: 'مفقود' } as const;
export const TASK_PRIORITIES = { Low: 'منخفضة', Medium: 'متوسطة', High: 'عالية' } as const;
export const TASK_STATUSES = { Pending: 'قيد التنفيذ', Completed: 'مكتملة' } as const;
export const APPOINTMENT_STATUSES = { Scheduled: 'مجدول', Completed: 'مكتمل', Cancelled: 'ملغى' } as const;
export const ACTIVITY_TYPES = { Note: 'ملاحظة', Call: 'مكالمة', Message: 'رسالة', Meeting: 'اجتماع', WhatsApp: 'واتساب' } as const;
export const FOLLOW_UP_ACTIONS = { call: 'مكالمة هاتفية', whatsapp: 'رسالة واتساب', meeting: 'اجتماع', email: 'بريد إلكتروني', proposal: 'إرسال عرض سعر', other: 'أخرى' } as const;
