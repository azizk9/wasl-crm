export const formatDate = (iso?: string | null, time = false) => {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('ar', { dateStyle: 'medium', ...(time ? { timeStyle: 'short' as const } : {}) }).format(date);
};
export const money = (amount: number, currency = 'USD') => {
  try { return new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 2 }).format(amount); }
  catch { return `${amount.toFixed(2)} ${currency}`; }
};
export const localInputTime = (iso?: string | null) => {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n:number) => String(n).padStart(2,'0');
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};
export const safeWhatsApp = (phone: string): string | null => {
  const cleaned = phone.replace(/\D/g, '');
  return cleaned.length >= 7 && cleaned.length <= 15 ? `https://wa.me/${cleaned}` : null;
};
export const whatsappWithMessage = (phone: string, message: string): string | null => {
  const base = safeWhatsApp(phone);
  if (!base) return null;
  const text = message.trim();
  return text ? `${base}?text=${encodeURIComponent(text)}` : base;
};
export const isOverdue = (iso: string | null, status = 'Pending') => !!iso && status !== 'Completed' && new Date(iso).getTime() < Date.now();
export const inToday = (iso: string | null) => !!iso && new Date(iso).toDateString() === new Date().toDateString();
export const isUpcoming = (iso: string) => new Date(iso).getTime() >= Date.now();
