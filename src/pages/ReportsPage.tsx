import { BarChart3, ChartNoAxesCombined, CircleDollarSign, Target, TrendingUp, UsersRound } from 'lucide-react';
import { Empty, ErrorBox, Loader, Metric, PageTitle } from '../components/UI';
import { CUSTOMER_STATUSES, DEAL_STAGES, SOURCES } from '../lib/constants';
import { money } from '../lib/format';
import { useRows } from '../lib/useRows';
import type { Customer, Deal, Task } from '../types/models';

export function ReportsPage(){
  const customers=useRows<Customer>('customers');const deals=useRows<Deal>('deals');const tasks=useRows<Task>('tasks');
  const loading=customers.loading||deals.loading||tasks.loading;const error=customers.error||deals.error||tasks.error;
  const won=deals.rows.filter(d=>d.stage==='Won');const lost=deals.rows.filter(d=>d.stage==='Lost');const closed=won.length+lost.length;
  const revenue=Object.entries(won.reduce<Record<string,number>>((o,d)=>({...o,[d.currency]:(o[d.currency]??0)+Number(d.value)}),{}));
  const active=customers.rows.filter(c=>!c.is_archived);
  const groups=[{label:'العملاء بحسب المصدر',data:Object.entries(SOURCES).map(([key,label])=>({key,label,n:active.filter(c=>c.source===key).length}))},
    {label:'العملاء بحسب الحالة',data:Object.entries(CUSTOMER_STATUSES).map(([key,label])=>({key,label,n:active.filter(c=>c.status===key).length}))},
    {label:'فرص البيع بحسب المرحلة',data:Object.entries(DEAL_STAGES).map(([key,label])=>({key,label,n:deals.rows.filter(d=>d.stage===key).length}))}];
  return <><PageTitle eyebrow="تحليل الأعمال" title="التقارير والإحصائيات" subtitle="اعتمد على أرقامك الفعلية لفهم النمو واتخاذ قرارات أفضل."/>
  {error&&<ErrorBox message={error} retry={()=>{void customers.reload();void deals.reload();void tasks.reload();}}/>}
  {loading?<Loader/>:<><div className="metrics-grid"><Metric label="العملاء النشطون" value={active.length} icon={UsersRound} tone="blue"/><Metric label="إجمالي الفرص" value={deals.rows.length} icon={Target} tone="violet"/><Metric label="نسبة إغلاق الفرص المحسومة" value={closed?`${Math.round(won.length*100/closed)}%`:'—'} icon={TrendingUp} tone="green"/><Metric label="المهام المكتملة" value={tasks.rows.filter(t=>t.status==='Completed').length} icon={ChartNoAxesCombined} tone="orange"/></div>
  <section className="panel revenues-panel"><div className="section-head"><div><h2><CircleDollarSign size={20}/> قيمة الصفقات المكتسبة</h2><p className="muted">عرض القيم لكل عملة على حدة لتجنب جمع عملات مختلفة.</p></div></div><div className="revenues-list">{revenue.length?revenue.map(([currency,total])=><div className="revenue-unit" key={currency}><span>{currency}</span><strong dir="ltr">{money(total,currency)}</strong></div>):<div className="muted">لم تسجّل صفقات مكتسبة بعد.</div>}</div></section>
  <div className="reports-grid">{groups.map(group=><section className="panel chart-panel" key={group.label}><div className="section-head"><div><h2>{group.label}</h2><p className="muted">توزيع السجلات حسب التصنيف</p></div><BarChart3 size={20} className="chart-head-icon"/></div>{group.data.some(d=>d.n>0)?<div className="report-bars">{group.data.map(d=><div className="report-bar-row" key={d.key}><div className="report-label"><span>{d.label}</span><b>{d.n}</b></div><div className="report-track"><span style={{width:`${100*d.n/Math.max(...group.data.map(v=>v.n),1)}%`}}/></div></div>)}</div>:<Empty icon={BarChart3} title="لا توجد بيانات" subtitle="ستظهر الإحصائيات عند إضافة سجلات حقيقية."/>}</section>)}</div>
  <p className="report-footnote">التقارير مبنية على أول 1,000 سجل من كل جدول لكل حساب في هذه النسخة. للبيانات الأكبر سنحتاج استعلامات تجميع مع pagination.</p></>}
  </>;
}
