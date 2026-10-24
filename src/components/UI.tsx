import { AlertCircle, ArrowLeft, Check, LoaderCircle, Search, X, type LucideIcon } from 'lucide-react';
import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { errorMessage } from '../lib/data';

export function PageTitle({ eyebrow, title, subtitle, action }: { eyebrow?: string; title: string; subtitle?: string; action?: ReactNode }) {
  return <div className="page-title"><div><p className="eyebrow">{eyebrow ?? 'WASL CRM'}</p><h1>{title}</h1>{subtitle && <p className="muted subtitle">{subtitle}</p>}</div>{action && <div className="page-action">{action}</div>}</div>;
}
export function Metric({ label, value, icon: Icon, subtitle, tone = 'blue' }: { label: string; value: string | number; icon: LucideIcon; subtitle?: string; tone?: 'blue'|'violet'|'green'|'orange' }) {
  return <article className="metric-card"><div className="metric-top"><span className={`icon-tile tone-${tone}`}><Icon size={21} /></span><span className="metric-dots">•••</span></div><p className="metric-value" dir="auto">{value}</p><p className="metric-label">{label}</p>{subtitle && <p className="metric-subtitle">{subtitle}</p>}</article>;
}
export function StatusBadge({ text, variant = 'neutral' }: { text: string; variant?: 'neutral'|'blue'|'green'|'orange'|'red' }) {
  return <span className={`status status-${variant}`}>{text}</span>;
}
export function Empty({ icon: Icon, title, subtitle, action }: { icon: LucideIcon; title: string; subtitle: string; action?: ReactNode }) {
  return <div className="empty-state"><span className="empty-icon"><Icon size={27}/></span><h3>{title}</h3><p>{subtitle}</p>{action}</div>;
}
export function Loader({ label = 'جارٍ تحميل البيانات...' }: { label?: string }) { return <div className="loading"><LoaderCircle className="spin" size={20}/>{label}</div>; }
export function ErrorBox({ message, retry }: { message: string; retry?: () => void }) {
  return <div className="error-box" role="alert"><AlertCircle size={19}/><span>{message}</span>{retry && <button type="button" className="link-button" onClick={retry}>إعادة المحاولة</button>}</div>;
}
export function SearchInput({ value, onChange, placeholder = 'بحث...' }: { value: string; onChange: (value: string) => void; placeholder?: string }) {
  return <div className="search-input"><Search size={17}/><input value={value} onChange={event => onChange(event.target.value)} placeholder={placeholder}/></div>;
}
export function Modal({ title, subtitle, children, onClose, wide = false }: { title: string; subtitle?: string; children: ReactNode; onClose: () => void; wide?: boolean }) {
  useEffect(() => { const f=(e:KeyboardEvent)=>{if(e.key==='Escape') onClose();}; window.addEventListener('keydown',f); return ()=>window.removeEventListener('keydown',f);},[onClose]);
  return <div className="modal-overlay" onMouseDown={e=>{if(e.target===e.currentTarget)onClose();}} role="presentation"><section role="dialog" aria-modal="true" aria-label={title} className={`modal ${wide?'modal-wide':''}`}><div className="modal-head"><div><h2>{title}</h2>{subtitle&&<p className="muted">{subtitle}</p>}</div><button className="icon-button" type="button" onClick={onClose} aria-label="إغلاق"><X size={20}/></button></div>{children}</section></div>;
}
export type Field = { key: string; label: string; type?: 'text'|'email'|'tel'|'number'|'date'|'datetime-local'|'textarea'|'select'; required?: boolean; options?: {value:string,label:string}[]; placeholder?: string; step?: string };
export function RecordForm({ title, subtitle, fields, initial, onSubmit, onClose, submitLabel='حفظ البيانات' }: {
  title: string; subtitle?:string; fields:Field[]; initial?: Record<string,string>;
  onSubmit: (values: Record<string,string>) => Promise<void>; onClose:()=>void; submitLabel?: string;
}) {
  const [values,setValues] = useState<Record<string,string>>(() => Object.fromEntries(fields.map(field=>[field.key, initial?.[field.key] ?? ''])));
  const [saving,setSaving] = useState(false); const [error,setError] = useState('');
  const submit = async(e:FormEvent) => {e.preventDefault();try {setSaving(true);setError('');await onSubmit(values);onClose();}catch(err){setError(errorMessage(err));}finally{setSaving(false);}};
  return <Modal title={title} subtitle={subtitle} onClose={onClose} wide><form onSubmit={submit} className="modal-form"><div className="form-grid">{fields.map(field=><label key={field.key} className={`field ${field.type==='textarea'?'field-full':''}`}><span>{field.label}{field.required&&<b className="required"> *</b>}</span>{field.type==='textarea'?<textarea rows={3} value={values[field.key]} placeholder={field.placeholder} onChange={e=>setValues(s=>({...s,[field.key]:e.target.value}))} required={field.required}/>:field.type==='select'?<select value={values[field.key]} onChange={e=>setValues(s=>({...s,[field.key]:e.target.value}))} required={field.required}><option value="">اختر...</option>{field.options?.map(opt=><option key={opt.value} value={opt.value}>{opt.label}</option>)}</select>:<input type={field.type??'text'} step={field.step} min={field.type==='number'?'0':undefined} value={values[field.key]} placeholder={field.placeholder} onChange={e=>setValues(s=>({...s,[field.key]:e.target.value}))} required={field.required}/>}</label>)}</div>{error&&<ErrorBox message={error}/>}<div className="form-actions"><button className="btn btn-ghost" type="button" onClick={onClose} disabled={saving}>إلغاء</button><button className="btn btn-primary" disabled={saving} type="submit">{saving?<LoaderCircle size={17} className="spin"/>:<Check size={17}/>} {saving?'جارٍ الحفظ...':submitLabel}</button></div></form></Modal>;
}
export function Confirm({ title, description, onConfirm, onClose, destructive = false }: { title:string;description:string;onConfirm:()=>Promise<void>;onClose:()=>void;destructive?:boolean }) {
  const [working,setWorking]=useState(false);const [error,setError]=useState('');
  return <Modal title={title} onClose={onClose}><p className="muted">{description}</p>{error&&<ErrorBox message={error}/>}<div className="form-actions"><button className="btn btn-ghost" onClick={onClose}>إلغاء</button><button className={`btn ${destructive?'btn-danger':'btn-primary'}`} disabled={working} onClick={async()=>{try{setWorking(true);await onConfirm();onClose();}catch(e){setError(errorMessage(e));}finally{setWorking(false);}}}>{working?<LoaderCircle size={16} className="spin"/>:<ArrowLeft size={16}/>} تأكيد</button></div></Modal>;
}
