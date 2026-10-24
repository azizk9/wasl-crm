import { useMemo, useState } from 'react';
import { CircleDollarSign, Plus, Target, Trash2 } from 'lucide-react';
import { Confirm, Empty, ErrorBox, Loader, PageTitle, RecordForm, SearchInput, StatusBadge, type Field } from '../components/UI';
import { DEAL_STAGES } from '../lib/constants';
import { errorMessage } from '../lib/data';
import { formatDate, money } from '../lib/format';
import { useRows } from '../lib/useRows';
import type { Customer, Deal, DealStage } from '../types/models';

const stages = Object.keys(DEAL_STAGES) as DealStage[];
export function PipelinePage(){
  const {rows,loading,error,reload,save,remove}=useRows<Deal>('deals');const customers=useRows<Customer>('customers');
  const [editing,setEditing]=useState<Deal|null|undefined>();const [deleting,setDeleting]=useState<Deal|null>(null);
  const [search,setSearch]=useState('');const [notice,setNotice]=useState('');
  const byId=useMemo(()=>new Map(customers.rows.map(c=>[c.id,c])),[customers.rows]);
  const visible=rows.filter(d=>[d.title,byId.get(d.customer_id)?.name??''].join(' ').toLowerCase().includes(search.toLowerCase()));
  const fields:Field[]=[{key:'title',label:'اسم الفرصة',required:true,placeholder:'مثال: باقة الخدمات السنوية'},
    {key:'customer_id',label:'العميل',type:'select',required:true,options:customers.rows.filter(c=>!c.is_archived).map(c=>({value:c.id,label:c.name}))},
    {key:'value',label:'القيمة المتوقعة',type:'number',step:'0.01',required:true},
    {key:'currency',label:'العملة',type:'select',required:true,options:['USD','EUR','TRY','SYP','SAR','AED'].map(x=>({value:x,label:x}))},
    {key:'stage',label:'مرحلة الفرصة',type:'select',required:true,options:stages.map(x=>({value:x,label:DEAL_STAGES[x]}))},
    {key:'expected_close_date',label:'تاريخ الإغلاق المتوقع',type:'date'}];
  const saveDeal=async(form:Record<string,string>)=>{if(!form.customer_id)throw new Error('اختر عميلًا.');if(Number(form.value)<0)throw new Error('قيمة الصفقة يجب ألا تكون سالبة.');await save({title:form.title.trim(),customer_id:form.customer_id,value:Number(form.value),currency:form.currency,stage:form.stage,expected_close_date:form.expected_close_date||null},editing?.id);setNotice('تم حفظ الفرصة بنجاح.');};
  const stageChange=async(deal:Deal,stage:string)=>{try{await save({stage},deal.id);}catch(e){setNotice(errorMessage(e));}};
  return <><PageTitle eyebrow="عمليات البيع" title="خط المبيعات" subtitle="تابع جميع فرصك التجارية من أول تواصل حتى إغلاق الصفقة." action={<button className="btn btn-primary" onClick={()=>setEditing(null)} disabled={!customers.rows.some(c=>!c.is_archived)}><Plus size={18}/> فرصة جديدة</button>}/>
  {!customers.loading&&!customers.rows.some(c=>!c.is_archived)&&<div className="tip-banner">أضف عميلًا نشطًا أولًا لتتمكن من إنشاء فرصة بيع.</div>}
  <div className="summary-strip"><div><strong>{rows.length}</strong><span>جميع الفرص</span></div><div><strong>{rows.filter(d=>d.stage==='Won').length}</strong><span>صفقة مكتسبة</span></div><div><strong>{rows.filter(d=>d.stage!=='Won'&&d.stage!=='Lost').length}</strong><span>فرص مفتوحة</span></div><div><strong>{rows.filter(d=>d.stage==='Lost').length}</strong><span>فرص مفقودة</span></div></div>
  {notice&&<div className="notice-banner" role="status">{notice}<button onClick={()=>setNotice('')}>×</button></div>}
  <div className="pipeline-top"><div><h2>مراحل البيع</h2><p className="muted">يمكن تغيير حالة كل فرصة من القائمة داخل بطاقتها.</p></div><SearchInput value={search} onChange={setSearch} placeholder="بحث في الفرص..."/></div>
  {error?<ErrorBox message={error} retry={reload}/>:loading||customers.loading?<Loader/>:!visible.length?<div className="panel"><Empty icon={Target} title="لا توجد فرص بيع" subtitle="أنشئ فرصة مرتبطة بعميل لبدء متابعة عملية البيع."/></div>:<div className="kanban-scroll"><div className="kanban">{stages.map((stage,index)=>{const items=visible.filter(d=>d.stage===stage);return <section key={stage} className="kanban-column"><div className="kanban-head"><span className={`stage-dot dot-${index}`}/><h3>{DEAL_STAGES[stage]}</h3><span className="kanban-count">{items.length}</span></div><div className="kanban-items">{items.length===0&&<div className="kanban-blank">لا توجد فرص في هذه المرحلة</div>}{items.map(d=><article className="deal-card" key={d.id}><div className="deal-title-row"><strong>{d.title}</strong><button className="icon-button" onClick={()=>setEditing(d)} title="تعديل"><span className="edit-dots">•••</span></button></div><p className="deal-customer">{byId.get(d.customer_id)?.name??'عميل'}</p><div className="deal-value" dir="ltr"><CircleDollarSign size={15}/>{money(Number(d.value),d.currency)}</div><div className="deal-bottom"><small>{formatDate(d.expected_close_date)}</small><button className="icon-button delete-small" onClick={()=>setDeleting(d)} title="حذف"><Trash2 size={14}/></button></div><label className="visually-hidden" htmlFor={`stage-${d.id}`}>مرحلة الفرصة</label><select id={`stage-${d.id}`} value={d.stage} className="stage-select" onChange={e=>stageChange(d,e.target.value)}>{stages.map(x=><option key={x} value={x}>{DEAL_STAGES[x]}</option>)}</select></article>)}</div></section>})}</div></div>}
  <div className="pipeline-legend"><StatusBadge text="فرص مفتوحة" variant="blue"/><StatusBadge text="مكتسبة" variant="green"/><StatusBadge text="مفقودة" variant="red"/></div>
  {editing!==undefined&&<RecordForm title={editing?'تعديل فرصة بيع':'فرصة بيع جديدة'} fields={fields} initial={editing?{title:editing.title,customer_id:editing.customer_id,value:String(editing.value),currency:editing.currency,stage:editing.stage,expected_close_date:editing.expected_close_date??''}:{value:'0',currency:'USD',stage:'New Lead'}} onSubmit={saveDeal} onClose={()=>setEditing(undefined)}/>}
  {deleting&&<Confirm title="حذف فرصة البيع" description="سيتم حذف الفرصة نهائيًا. هل أنت متأكد؟" destructive onConfirm={()=>remove(deleting.id)} onClose={()=>setDeleting(null)}/>}
  </>;
}
