import { useMemo, useState } from 'react';
import { CalendarClock, CheckCircle2, Circle, ClipboardList, Pencil, Plus, Trash2 } from 'lucide-react';
import { TASK_PRIORITIES, TASK_STATUSES } from '../lib/constants';
import { Confirm, Empty, ErrorBox, Loader, PageTitle, RecordForm, SearchInput, StatusBadge, type Field } from '../components/UI';
import { errorMessage } from '../lib/data';
import { formatDate, inToday, isOverdue, localInputTime } from '../lib/format';
import { useRows } from '../lib/useRows';
import type { Customer, Deal, Task } from '../types/models';

export function TasksPage(){
  const {rows,loading,error,reload,save,remove}=useRows<Task>('tasks'); const customers=useRows<Customer>('customers');const deals=useRows<Deal>('deals');
  const [editing,setEditing]=useState<Task|null|undefined>();const [deleting,setDeleting]=useState<Task|null>(null);
  const [filter,setFilter]=useState('all');const [search,setSearch]=useState('');const [notice,setNotice]=useState('');
  const customerNames=useMemo(()=>new Map(customers.rows.map(c=>[c.id,c.name])),[customers.rows]);
  const visible=rows.filter(t=>[t.title,customerNames.get(t.customer_id??'')??''].join(' ').toLowerCase().includes(search.toLowerCase())&&(filter==='all'||(filter==='pending'&&t.status==='Pending')||(filter==='completed'&&t.status==='Completed')||(filter==='overdue'&&isOverdue(t.due_at,t.status))));
  const fields:Field[]=[{key:'title',label:'عنوان المهمة',required:true,placeholder:'مثال: التواصل مع العميل بعد إرسال العرض'},
    {key:'customer_id',label:'العميل المرتبط',type:'select',options:customers.rows.map(c=>({value:c.id,label:c.name}))},
    {key:'deal_id',label:'الفرصة المرتبطة',type:'select',options:deals.rows.map(d=>({value:d.id,label:d.title}))},
    {key:'priority',label:'الأولوية',type:'select',required:true,options:Object.entries(TASK_PRIORITIES).map(([value,label])=>({value,label}))},
    {key:'status',label:'الحالة',type:'select',required:true,options:Object.entries(TASK_STATUSES).map(([value,label])=>({value,label}))},
    {key:'due_at',label:'الموعد النهائي',type:'datetime-local'}];
  const saveTask=async(values:Record<string,string>)=>{
    const deal=deals.rows.find(d=>d.id===values.deal_id); if(deal&&values.customer_id&&deal.customer_id!==values.customer_id)throw new Error('العميل المحدد لا يطابق عميل فرصة البيع.');
    await save({title:values.title.trim(),customer_id:values.customer_id||null,deal_id:values.deal_id||null,priority:values.priority,status:values.status,due_at:values.due_at?new Date(values.due_at).toISOString():null},editing?.id);setNotice('تم حفظ المهمة بنجاح.');
  };
  const toggle=async(task:Task)=>{try{await save({status:task.status==='Pending'?'Completed':'Pending'},task.id);}catch(e){setNotice(errorMessage(e));}};
  return <><PageTitle eyebrow="تنظيم العمل" title="المهام والمتابعات" subtitle="ابقَ على اطلاع بكل متابعة واجتماع ومهمة في وقتها." action={<button className="btn btn-primary" onClick={()=>setEditing(null)}><Plus size={18}/> مهمة جديدة</button>}/>
  <div className="summary-strip"><div><strong>{rows.length}</strong><span>جميع المهام</span></div><div><strong>{rows.filter(t=>t.status==='Pending').length}</strong><span>قيد التنفيذ</span></div><div><strong>{rows.filter(t=>inToday(t.due_at)&&t.status==='Pending').length}</strong><span>مهام اليوم</span></div><div><strong>{rows.filter(t=>isOverdue(t.due_at,t.status)).length}</strong><span>مهام متأخرة</span></div></div>
  {notice&&<div className="notice-banner" role="status">{notice}<button onClick={()=>setNotice('')}>×</button></div>}
  <section className="panel"><div className="panel-toolbar"><div className="toolbar-title"><h2>قائمة المهام</h2><p className="muted">أنجز مهامك ورتبها بحسب الأولوية</p></div><div className="table-actions"><SearchInput value={search} onChange={setSearch} placeholder="ابحث عن مهمة..."/><select className="filter-select" aria-label="تصفية المهام" value={filter} onChange={e=>setFilter(e.target.value)}><option value="all">كل المهام</option><option value="pending">قيد التنفيذ</option><option value="completed">مكتملة</option><option value="overdue">متأخرة</option></select></div></div>
  {error?<ErrorBox message={error} retry={reload}/>:loading?<Loader/>:!visible.length?<Empty icon={ClipboardList} title="لا توجد مهام" subtitle="أنشئ مهمة متابعة جديدة أو غيّر التصفية." action={!search?<button className="btn btn-primary" onClick={()=>setEditing(null)}><Plus size={16}/> إضافة مهمة</button>:undefined}/>:<div className="task-list">{visible.map(t=><article key={t.id} className={`task-row ${t.status==='Completed'?'task-done':''}`}><button onClick={()=>toggle(t)} className="task-toggle" aria-label={t.status==='Completed'?'إعادة فتح':'إكمال المهمة'}>{t.status==='Completed'?<CheckCircle2 size={23}/>:<Circle size={23}/>}</button><div className="task-info"><h3>{t.title}</h3><p>{t.customer_id?customerNames.get(t.customer_id)??'عميل':'مهمة عامة'}</p></div><div className="task-meta"><StatusBadge text={TASK_PRIORITIES[t.priority]} variant={t.priority==='High'?'red':t.priority==='Medium'?'orange':'neutral'}/>{t.due_at&&<span className={`task-date ${isOverdue(t.due_at,t.status)?'overdue':''}`}><CalendarClock size={15}/>{formatDate(t.due_at,true)}</span>}</div><div className="row-actions"><button className="icon-button" aria-label="تعديل المهمة" onClick={()=>setEditing(t)}><Pencil size={16}/></button><button className="icon-button delete-small" aria-label="حذف المهمة" onClick={()=>setDeleting(t)}><Trash2 size={16}/></button></div></article>)}</div>}</section>
  {editing!==undefined&&<RecordForm title={editing?'تعديل المهمة':'مهمة جديدة'} fields={fields} initial={editing?{title:editing.title,customer_id:editing.customer_id??'',deal_id:editing.deal_id??'',priority:editing.priority,status:editing.status,due_at:localInputTime(editing.due_at)}:{priority:'Medium',status:'Pending'}} onSubmit={saveTask} onClose={()=>setEditing(undefined)}/>}
  {deleting&&<Confirm title="حذف المهمة" description="سيتم حذف المهمة نهائيًا." destructive onConfirm={()=>remove(deleting.id)} onClose={()=>setDeleting(null)}/>}
  </>;
}
