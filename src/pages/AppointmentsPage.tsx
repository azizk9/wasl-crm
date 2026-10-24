import { useMemo, useState } from 'react';
import { CalendarDays, Clock3, Pencil, Plus, Trash2, Users } from 'lucide-react';
import { APPOINTMENT_STATUSES } from '../lib/constants';
import { Confirm, Empty, ErrorBox, Loader, PageTitle, RecordForm, SearchInput, StatusBadge, type Field } from '../components/UI';
import { formatDate, isUpcoming, localInputTime } from '../lib/format';
import { useRows } from '../lib/useRows';
import type { Appointment, Customer } from '../types/models';

export function AppointmentsPage(){
  const {rows,loading,error,reload,save,remove}=useRows<Appointment>('appointments');const customers=useRows<Customer>('customers');
  const [editing,setEditing]=useState<Appointment|null|undefined>();const [deleting,setDeleting]=useState<Appointment|null>(null);
  const [search,setSearch]=useState('');const [filter,setFilter]=useState('all');const [notice,setNotice]=useState('');
  const names=useMemo(()=>new Map(customers.rows.map(c=>[c.id,c.name])),[customers.rows]);
  const visible=rows.filter(a=>(filter==='all'||a.status===filter)&&[a.title,names.get(a.customer_id)??''].join(' ').toLowerCase().includes(search.toLowerCase())).sort((a,b)=>new Date(a.starts_at).getTime()-new Date(b.starts_at).getTime());
  const fields:Field[]=[{key:'title',label:'عنوان الموعد',required:true,placeholder:'مثال: استشارة أولية'},
    {key:'customer_id',label:'العميل',type:'select',required:true,options:customers.rows.filter(c=>!c.is_archived).map(c=>({value:c.id,label:c.name}))},
    {key:'starts_at',label:'بداية الموعد',type:'datetime-local',required:true},
    {key:'ends_at',label:'نهاية الموعد',type:'datetime-local',required:true},
    {key:'status',label:'الحالة',type:'select',required:true,options:Object.entries(APPOINTMENT_STATUSES).map(([value,label])=>({value,label}))},
    {key:'notes',label:'ملاحظات',type:'textarea'}];
  const saveAppointment=async(values:Record<string,string>)=>{const start=new Date(values.starts_at);const end=new Date(values.ends_at);if(Number.isNaN(start.getTime())||Number.isNaN(end.getTime())||end<=start)throw new Error('يجب أن يكون وقت النهاية بعد البداية.');await save({title:values.title.trim(),customer_id:values.customer_id,starts_at:start.toISOString(),ends_at:end.toISOString(),status:values.status,notes:values.notes},editing?.id);setNotice('تم حفظ الموعد بنجاح.');};
  return <><PageTitle eyebrow="جدولة الأعمال" title="المواعيد" subtitle="كل مواعيد عملائك في جدول واحد واضح وسهل الإدارة." action={<button className="btn btn-primary" disabled={!customers.rows.some(c=>!c.is_archived)} onClick={()=>setEditing(null)}><Plus size={18}/> موعد جديد</button>}/>
    <div className="summary-strip"><div><strong>{rows.length}</strong><span>إجمالي المواعيد</span></div><div><strong>{rows.filter(a=>a.status==='Scheduled'&&isUpcoming(a.starts_at)).length}</strong><span>مواعيد قادمة</span></div><div><strong>{rows.filter(a=>a.status==='Completed').length}</strong><span>مواعيد مكتملة</span></div><div><strong>{rows.filter(a=>a.status==='Cancelled').length}</strong><span>مواعيد ملغاة</span></div></div>
    {!customers.loading&&!customers.rows.some(c=>!c.is_archived)&&<div className="tip-banner">أضف عميلًا أولًا لجدولة موعد مرتبط به.</div>}
    {notice&&<div className="notice-banner" role="status">{notice}<button onClick={()=>setNotice('')}>×</button></div>}
    <section className="panel"><div className="panel-toolbar"><div className="toolbar-title"><h2>جدول المواعيد</h2><p className="muted">جميع الأوقات بتوقيت جهازك المحلي</p></div><div className="table-actions"><SearchInput value={search} onChange={setSearch} placeholder="ابحث في المواعيد..."/><select className="filter-select" aria-label="تصفية المواعيد" value={filter} onChange={e=>setFilter(e.target.value)}><option value="all">جميع المواعيد</option>{Object.entries(APPOINTMENT_STATUSES).map(([key,value])=><option key={key} value={key}>{value}</option>)}</select></div></div>
    {error?<ErrorBox message={error} retry={reload}/>:loading?<Loader/>:!visible.length?<Empty icon={CalendarDays} title="لا توجد مواعيد" subtitle="ابدأ بجدولة موعد جديد لعميل."/>:<div className="appointments-list">{visible.map(a=><article className="appointment-row" key={a.id}><div className="appointment-date"><b>{new Date(a.starts_at).toLocaleDateString('en-GB',{day:'2-digit'})}</b><span>{new Date(a.starts_at).toLocaleDateString('ar',{month:'short'})}</span></div><div className="appointment-details"><h3>{a.title}</h3><div className="appointment-extras"><span><Users size={15}/>{names.get(a.customer_id)??'عميل'}</span><span><Clock3 size={15}/>{formatDate(a.starts_at,true)} — {new Date(a.ends_at).toLocaleTimeString('ar',{hour:'2-digit',minute:'2-digit'})}</span></div>{a.notes&&<small>{a.notes}</small>}</div><StatusBadge text={APPOINTMENT_STATUSES[a.status]} variant={a.status==='Completed'?'green':a.status==='Cancelled'?'red':'blue'}/><div className="row-actions"><button className="icon-button" title="تعديل" onClick={()=>setEditing(a)}><Pencil size={17}/></button><button className="icon-button delete-small" title="حذف" onClick={()=>setDeleting(a)}><Trash2 size={16}/></button></div></article>)}</div>}</section>
    {editing!==undefined&&<RecordForm title={editing?'تعديل الموعد':'جدولة موعد جديد'} fields={fields} initial={editing?{title:editing.title,customer_id:editing.customer_id,starts_at:localInputTime(editing.starts_at),ends_at:localInputTime(editing.ends_at),status:editing.status,notes:editing.notes}:{status:'Scheduled'}} onSubmit={saveAppointment} onClose={()=>setEditing(undefined)}/>}
    {deleting&&<Confirm title="حذف الموعد" description="هل تريد حذف الموعد نهائيًا؟" destructive onConfirm={()=>remove(deleting.id)} onClose={()=>setDeleting(null)}/>}
  </>;
}
