import { useEffect, useMemo, useState } from 'react';
import { BarChart3, ChartNoAxesCombined, CircleDollarSign, Target, TrendingUp, UsersRound } from 'lucide-react';
import { Empty, ErrorBox, Loader, Metric, PageTitle } from '../components/UI';
import { CUSTOMER_STATUSES, DEAL_STAGES, SOURCES } from '../lib/constants';
import { money } from '../lib/format';
import { useRows } from '../lib/useRows';
import { getClient } from '../lib/supabase';
import { useAuth } from '../auth/AuthContext';
import type { Customer, Deal, Profile, Task } from '../types/models';

function monthKey(date: string): string {
  const value = new Date(date);
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}`;
}

export function ReportsPage() {
  const { role, user } = useAuth();
  const customers = useRows<Customer>('customers');
  const deals = useRows<Deal>('deals');
  const tasks = useRows<Task>('tasks');
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const loading = customers.loading || deals.loading || tasks.loading;
  const error = customers.error || deals.error || tasks.error;

  useEffect(() => {
    if (role !== 'admin') return;
    getClient().from('profiles').select('id,full_name,role,created_at,updated_at').order('full_name').then(({ data }) => setProfiles((data ?? []) as Profile[]));
  }, [role]);

  const won = deals.rows.filter(deal => deal.stage === 'Won');
  const lost = deals.rows.filter(deal => deal.stage === 'Lost');
  const closed = won.length + lost.length;
  const active = customers.rows.filter(customer => !customer.is_archived);
  const revenue = Object.entries(won.reduce<Record<string, number>>((totals, deal) => ({ ...totals, [deal.currency]: (totals[deal.currency] ?? 0) + Number(deal.value) }), {}));
  const monthTotals = useMemo(() => {
    const months = Array.from({ length: 6 }, (_, index) => {
      const date = new Date();
      date.setDate(1);
      date.setMonth(date.getMonth() - (5 - index));
      return { key: monthKey(date.toISOString()), label: new Intl.DateTimeFormat('ar', { month: 'short' }).format(date), value: 0 };
    });
    won.forEach(deal => {
      const month = months.find(item => item.key === monthKey(deal.created_at));
      if (month) month.value += Number(deal.value);
    });
    return months;
  }, [won]);
  const maxMonthValue = Math.max(...monthTotals.map(month => month.value), 1);
  const performance = useMemo(() => {
    const people = role === 'admin' ? profiles : [{ id: user?.id ?? '', full_name: 'أدائي', role: 'sales' as const, created_at: '', updated_at: '' }];
    return people.map(person => {
      const memberDeals = deals.rows.filter(deal => deal.owner_id === person.id);
      const memberWon = memberDeals.filter(deal => deal.stage === 'Won');
      const memberLost = memberDeals.filter(deal => deal.stage === 'Lost');
      const totalClosed = memberWon.length + memberLost.length;
      return { ...person, deals: memberDeals.length, won: memberWon.length, revenue: memberWon.reduce((sum, deal) => sum + Number(deal.value), 0), conversion: totalClosed ? Math.round(memberWon.length * 100 / totalClosed) : 0 };
    }).sort((a, b) => b.revenue - a.revenue);
  }, [deals.rows, profiles, role, user?.id]);
  const groups = [
    { label: 'العملاء بحسب المصدر', data: Object.entries(SOURCES).map(([key, label]) => ({ key, label, n: active.filter(customer => customer.source === key).length })) },
    { label: 'العملاء بحسب الحالة', data: Object.entries(CUSTOMER_STATUSES).map(([key, label]) => ({ key, label, n: active.filter(customer => customer.status === key).length })) },
    { label: 'فرص البيع بحسب المرحلة', data: Object.entries(DEAL_STAGES).map(([key, label]) => ({ key, label, n: deals.rows.filter(deal => deal.stage === key).length })) },
  ];

  return <><PageTitle eyebrow="تحليل الأعمال" title="التقارير والإحصائيات" subtitle="اعتمد على أرقامك الفعلية لفهم النمو واتخاذ قرارات أفضل."/>
    {error && <ErrorBox message={error} retry={() => { void customers.reload(); void deals.reload(); void tasks.reload(); }}/>} 
    {loading ? <Loader/> : <>
      <div className="metrics-grid"><Metric label="العملاء النشطون" value={active.length} icon={UsersRound} tone="blue"/><Metric label="إجمالي الفرص" value={deals.rows.length} icon={Target} tone="violet"/><Metric label="معدل التحويل" value={closed ? `${Math.round(won.length * 100 / closed)}%` : '—'} icon={TrendingUp} tone="green"/><Metric label="المهام المكتملة" value={tasks.rows.filter(task => task.status === 'Completed').length} icon={ChartNoAxesCombined} tone="orange"/></div>
      <section className="panel revenues-panel"><div className="section-head"><div><h2><CircleDollarSign size={20}/> الإيرادات الشهرية</h2><p className="muted">قيمة الصفقات المكتسبة خلال آخر ستة أشهر، مع إبقاء العملات منفصلة.</p></div></div><div className="monthly-bars">{monthTotals.map(month => <div className="monthly-bar-item" key={month.key}><strong dir="ltr">{month.value ? month.value.toLocaleString('en-US') : '—'}</strong><div className="monthly-bar-track"><span style={{ height: `${month.value * 100 / maxMonthValue}%` }}/></div><small>{month.label}</small></div>)}</div></section>
      <section className="panel performance-panel"><div className="section-head"><div><h2><UsersRound size={20}/> أداء المندوبين</h2><p className="muted">مقارنة الفرص المكتسبة ومعدل التحويل وقيمة المبيعات.</p></div></div>{performance.length ? <div className="table-scroll"><table className="data-table"><thead><tr><th>المندوب</th><th>إجمالي الفرص</th><th>الصفقات المكتسبة</th><th>معدل التحويل</th><th>الإيرادات المكتسبة</th></tr></thead><tbody>{performance.map(person => <tr key={person.id}><td><div className="person-cell"><span className="person-avatar">{(person.full_name || 'م').charAt(0)}</span><b>{person.full_name || 'عضو بدون اسم'}</b></div></td><td>{person.deals}</td><td>{person.won}</td><td><span className="status status-green">{person.conversion}%</span></td><td dir="ltr">{person.revenue ? money(person.revenue, 'USD') : '—'}</td></tr>)}</tbody></table></div> : <Empty icon={UsersRound} title="لا توجد بيانات أداء" subtitle="ستظهر المقارنة عند إضافة فرص بيع."/>}</section>
      <div className="reports-grid"><section className="panel revenues-panel"><div className="section-head"><div><h2><CircleDollarSign size={20}/> قيمة الصفقات المكتسبة</h2><p className="muted">عرض القيم لكل عملة على حدة.</p></div></div><div className="revenues-list">{revenue.length ? revenue.map(([currency, total]) => <div className="revenue-unit" key={currency}><span>{currency}</span><strong dir="ltr">{money(total, currency)}</strong></div>) : <div className="muted">لم تسجّل صفقات مكتسبة بعد.</div>}</div></section>{groups.map(group => <section className="panel chart-panel" key={group.label}><div className="section-head"><div><h2>{group.label}</h2><p className="muted">توزيع السجلات حسب التصنيف</p></div><BarChart3 size={20} className="chart-head-icon"/></div>{group.data.some(item => item.n > 0) ? <div className="report-bars">{group.data.map(item => <div className="report-bar-row" key={item.key}><div className="report-label"><span>{item.label}</span><b>{item.n}</b></div><div className="report-track"><span style={{ width: `${100 * item.n / Math.max(...group.data.map(value => value.n), 1)}%` }}/></div></div>)}</div> : <Empty icon={BarChart3} title="لا توجد بيانات" subtitle="ستظهر الإحصائيات عند إضافة سجلات حقيقية."/>}</section>)}</div>
      <p className="report-footnote">التقارير تعتمد على السجلات المتاحة في مساحة العمل. تظهر بيانات كل الفريق للمشرف، بينما يرى مندوب المبيعات بياناته الخاصة.</p>
    </>}
  </>;
}
