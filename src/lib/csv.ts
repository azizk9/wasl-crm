import { CUSTOMER_STATUSES, SOURCES } from './constants';
import type { Customer, CustomerStatus, Source } from '../types/models';

export type CsvField = 'name' | 'phone' | 'email' | 'source' | 'status';

export const CSV_FIELDS: CsvField[] = ['name', 'phone', 'email', 'source', 'status'];

export const CSV_FIELD_LABELS: Record<CsvField, string> = {
  name: 'الاسم',
  phone: 'الهاتف',
  email: 'البريد الإلكتروني',
  source: 'المصدر',
  status: 'الحالة',
};

const SOURCE_VALUES = Object.keys(SOURCES);
const STATUS_VALUES = Object.keys(CUSTOMER_STATUSES);

const SOURCE_ALIASES: Record<string, Source> = {
  instagram: 'Instagram', ig: 'Instagram', 'انستغرام': 'Instagram', 'انستجرام': 'Instagram',
  whatsapp: 'WhatsApp', wa: 'WhatsApp', 'واتساب': 'WhatsApp',
  facebook: 'Facebook', fb: 'Facebook', 'فيسبوك': 'Facebook',
  website: 'Website', web: 'Website', 'الموقع': 'Website', 'موقع': 'Website',
  referral: 'Referral', 'ترشيح': 'Referral', 'احالة': 'Referral',
  other: 'Other', 'اخرى': 'Other', 'أخرى': 'Other',
};

const STATUS_ALIASES: Record<string, CustomerStatus> = {
  new: 'New', 'جديد': 'New', 'جديده': 'New',
  contacted: 'Contacted', 'تم_التواصل': 'Contacted', 'تواصل': 'Contacted', 'تم التواصل': 'Contacted',
  interested: 'Interested', 'مهتم': 'Interested', 'مهتمه': 'Interested',
  customer: 'Customer', 'عميل': 'Customer', 'عملاء': 'Customer',
  inactive: 'Inactive', 'غير_نشط': 'Inactive', 'غير نشط': 'Inactive', 'خامل': 'Inactive',
};

export function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let current: string[] = [];
  let field = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else field += char;
    } else {
      if (char === '"') inQuotes = true;
      else if (char === ',' || char === ';' || char === '\t') { current.push(field); field = ''; }
      else if (char === '\n') { current.push(field); rows.push(current); current = []; field = ''; }
      else if (char === '\r') { /* skip */ }
      else field += char;
    }
  }
  if (field || current.length) { current.push(field); rows.push(current); }
  return rows.filter(r => r.some(c => c.trim()));
}

export function normalizeSource(raw: string): Source {
  const key = raw.trim().toLowerCase();
  if (SOURCE_VALUES.includes(raw.trim())) return raw.trim() as Source;
  return SOURCE_ALIASES[key] ?? 'Other';
}

export function normalizeStatus(raw: string): CustomerStatus {
  const key = raw.trim().toLowerCase();
  if (STATUS_VALUES.includes(raw.trim())) return raw.trim() as CustomerStatus;
  return STATUS_ALIASES[key] ?? 'New';
}

export type ValidationIssue = { row: number; issue: string; field?: CsvField };
export type ParsedRow = {
  rowIndex: number;
  raw: Record<CsvField, string>;
  normalized: { name: string; phone: string; email: string; source: Source; status: CustomerStatus };
  valid: boolean;
  issues: string[];
  duplicate: boolean;
};

export function validateRow(
  raw: Record<CsvField, string>,
  existingPhones: Set<string>,
  existingEmails: Set<string>,
  rowIndex: number,
): ParsedRow {
  const issues: string[] = [];
  const name = raw.name?.trim() ?? '';
  const phone = raw.phone?.trim() ?? '';
  const email = raw.email?.trim() ?? '';
  const source = normalizeSource(raw.source ?? '');
  const status = normalizeStatus(raw.status ?? '');

  if (name.length < 2) issues.push('الاسم قصير جداً (حرفان على الأقل)');
  if (name.length > 160) issues.push('الاسم طويل جداً (160 حرف كحد أقصى)');

  let duplicate = false;
  const phoneKey = phone.replace(/\D/g, '');
  if (phoneKey && existingPhones.has(phoneKey)) { duplicate = true; issues.push('رقم الهاتف موجود بالفعل'); }
  if (email && existingEmails.has(email.toLowerCase())) { duplicate = true; issues.push('البريد الإلكتروني موجود بالفعل'); }

  return {
    rowIndex,
    raw: { name, phone, email, source: raw.source ?? '', status: raw.status ?? '' },
    normalized: { name, phone, email, source, status },
    valid: issues.filter(i => !i.includes('موجود بالفعل')).length === 0,
    issues,
    duplicate,
  };
}

export function autoDetectMapping(headers: string[]): Record<CsvField, number> {
  const lower = headers.map(h => h.trim().toLowerCase());
  const find = (...keys: string[]) => lower.findIndex(h => keys.includes(h));
  return {
    name: find('name', 'الاسم', 'اسم', 'customer', 'العميل', 'اسم العميل'),
    phone: find('phone', 'الهاتف', 'هاتف', 'mobile', 'الجوال', 'رقم الهاتف', 'tel'),
    email: find('email', 'البريد', 'بريد', 'البريد الإلكتروني', 'mail', 'e-mail'),
    source: find('source', 'المصدر', 'مصدر', 'channel', 'القناة'),
    status: find('status', 'الحالة', 'حالة', 'الحالة', 'state'),
  };
}

export function mapRow(
  columns: string[],
  mapping: Record<CsvField, number>,
): Record<CsvField, string> {
  const get = (idx: number) => (idx >= 0 && idx < columns.length ? columns[idx].trim() : '');
  return {
    name: get(mapping.name),
    phone: get(mapping.phone),
    email: get(mapping.email),
    source: get(mapping.source),
    status: get(mapping.status),
  };
}

export function exportCustomersCSV(customers: Customer[]): string {
  const headers = ['الاسم', 'الهاتف', 'البريد الإلكتروني', 'المصدر', 'الحالة', 'تاريخ الإضافة'];
  const escape = (val: string) => {
    if (val.includes(',') || val.includes('"') || val.includes('\n'))
      return `"${val.replace(/"/g, '""')}"`;
    return val;
  };
  const lines = [headers.join(',')];
  for (const c of customers) {
    lines.push([
      escape(c.name),
      escape(c.phone),
      escape(c.email),
      escape(SOURCES[c.source] ?? c.source),
      escape(CUSTOMER_STATUSES[c.status] ?? c.status),
      escape(c.created_at),
    ].join(','));
  }
  return '\uFEFF' + lines.join('\n');
}

export function downloadCSV(filename: string, content: string): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
