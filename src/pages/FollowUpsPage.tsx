import { useMemo, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import {
  CalendarClock, CheckCircle2, Clock3, MessageCircle,
  Plus, CalendarPlus, ListChecks, Users, ArrowUpLeft, X,
} from 'lucide-react';
import { LoaderCircle } from 'lucide-react';
import {
  Confirm, Empty, ErrorBox, Loader, Modal, PageTitle, SearchInput, StatusBadge, type Field,
} from '../components/UI';
import { ACTIVITY_TYPES, CUSTOMER_STATUSES } from '../lib/constants';
import { errorMessage } from '../lib/data';
import { formatDate, isOverdue, inToday, isUpcoming, localInputTime, whatsappWithMessage } from '../lib/format';
import { useRows } from '../lib/useRows';
import type { Activity, ActivityType, Appointment, Customer, Deal, Task } from '../types/models';

type ActivityDraft = { type: ActivityType; content: string };

export function FollowUpsPage() {
  const customers = useRows<Customer>('customers');
  const activities = useRows<Activity>('activities');
  const tasks = useRows<Task>('tasks');
  const appointments = useRows<Appointment>('appointments');
  const deals = useRows<Deal>('deals');

  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<'today' | 'overdue' | 'upcoming' | 'all'>('today');
  const [timeline, setTimeline] = useState<Customer | null>(null);
  const [rescheduling, setRescheduling] = useState<Customer | null>(null);
  const [completing, setCompleting] = useState<Customer | null>(null);
  const [notice, setNotice] = useState('');
  const [activityDraft, setActivityDraft] = useState<ActivityDraft>({ type: 'Note', content: '' });
  const [savingActivity, setSavingActivity] = useState(false);

  const active = useMemo(() => customers.rows.filter(c => !c.is_archived), [customers.rows]);

  const withFollowUp = useMemo(
    () => active.filter(c => c.next_follow_up_at).sort((a, b) =>
      (a.next_follow_up_at ?? '').localeCompare(b.next_follow_up_at ?? '')),
    [active],
  );

  const today = withFollowUp.filter(c => inToday(c.next_follow_up_at));
  const overdue = withFollowUp.filter(c => isOverdue(c.next_follow_up_at));
  const upcoming = withFollowUp.filter(c => isUpcoming(c.next_follow_up_at!) && !inToday(c.next_follow_up_at));

  const tabData = tab === 'today' ? today : tab === 'overdue' ? overdue : tab === 'upcoming' ? upcoming : withFollowUp;
  const visible = tabData.filter(c =>
    [c.name, c.phone, c.next_action].join(' ').toLowerCase().includes(search.toLowerCase()),
  );

  const noFollowUpCount = active.filter(c => !c.next_follow_up_at).length;

  const loading = customers.loading || activities.loading;
  const error = customers.error || activities.error;

  const followUpCounts = { today: today.length, overdue: overdue.length, upcoming: upcoming.length, all: withFollowUp.length };

  const updateFollowUp = async (customer: Customer, nextAction: string, followUpAt: string | null) => {
    await customers.save({
      next_action: nextAction,
      next_follow_up_at: followUpAt ? new Date(followUpAt).toISOString() : null,
    }, customer.id);
  };

  const completeFollowUp = async () => {
    if (!completing) return;
    await customers.save({ next_action: '', next_follow_up_at: null }, completing.id);
    setNotice(`تم إنجاز متابعة "${completing.name}".`);
  };

  const rescheduleSave = async (values: Record<string, string>) => {
    if (!rescheduling) return;
    const dt = new Date(values.next_follow_up_at);
    if (Number.isNaN(dt.getTime())) throw new Error('اختر تاريخًا ووقتًا صحيحين.');
    await updateFollowUp(rescheduling, values.next_action.trim() || rescheduling.next_action, values.next_follow_up_at);
    setNotice(`تمت إعادة جدولة متابعة "${rescheduling.name}".`);
  };

  const recordActivity = async (e: FormEvent) => {
    e.preventDefault();
    if (!timeline || !activityDraft.content.trim()) return;
    setSavingActivity(true);
    try {
      await activities.save({ customer_id: timeline.id, type: activityDraft.type, content: activityDraft.content.trim() });
      setActivityDraft({ type: 'Note', content: '' });
    } catch (err) {
      setNotice(errorMessage(err));
    } finally {
      setSavingActivity(false);
    }
  };

  const customerActivities = activities.rows.filter(a => a.customer_id === timeline?.id);
  const customerTasks = tasks.rows.filter(t => t.customer_id === timeline?.id);
  const customerAppointments = appointments.rows.filter(a => a.customer_id === timeline?.id);
  const customerDeals = deals.rows.filter(d => d.customer_id === timeline?.id);

  type TimelineEvent = { id: string; date: string; type: 'activity' | 'task' | 'appointment' | 'deal'; label: string; detail: string };
  const timelineEvents: TimelineEvent[] = useMemo(() => {
    if (!timeline) return [];
    const events: TimelineEvent[] = [];
    customerActivities.forEach(a => events.push({
      id: a.id, date: a.created_at, type: 'activity',
      label: ACTIVITY_TYPES[a.type], detail: a.content,
    }));
    customerTasks.forEach(t => events.push({
      id: t.id, date: t.created_at, type: 'task',
      label: `مهمة: ${t.title}`,
      detail: t.status === 'Completed' ? 'مكتملة' : t.due_at ? `موعد: ${formatDate(t.due_at, true)}` : 'قيد التنفيذ',
    }));
    customerAppointments.forEach(a => events.push({
      id: a.id, date: a.starts_at, type: 'appointment',
      label: `موعد: ${a.title}`,
      detail: `${formatDate(a.starts_at, true)} — ${a.status === 'Completed' ? 'مكتمل' : a.status === 'Cancelled' ? 'ملغى' : 'مجدول'}`,
    }));
    customerDeals.forEach(d => events.push({
      id: d.id, date: d.created_at, type: 'deal',
      label: `فرصة: ${d.title}`,
      detail: `مرحلة: ${d.stage}`,
    }));
    return events.sort((a, b) => b.date.localeCompare(a.date));
  }, [timeline, customerActivities, customerTasks, customerAppointments, customerDeals]);

  const waMessage = (c: Customer) => {
    const greeting = `مرحباً ${c.name}،`;
    const actionPart = c.next_action ? `\n\nبخصوص: ${c.next_action}` : '';
    return `${greeting}${actionPart}`;
  };

  const rescheduleFields: Field[] = [
    { key: 'next_action', label: 'الإجراء التالي', placeholder: 'مثال: مكالمة متابعة، إرسال عرض...', type: 'text' },
    { key: 'next_follow_up_at', label: 'تاريخ ووقت المتابعة', type: 'datetime-local', required: true },
  ];

  const tabButton = (key: typeof tab, label: string, count: number, variant: 'blue' | 'red' | 'green' | 'neutral') => (
    <button
      key={key}
      className={`fu-tab ${tab === key ? 'fu-tab-active' : ''}`}
      onClick={() => setTab(key)}
    >
      <span>{label}</span>
      <StatusBadge text={String(count)} variant={variant} />
    </button>
  );

  return (
    <>
      <PageTitle
        eyebrow="مركز المتابعات"
        title="مركز المتابعات الذكي"
        subtitle="لا تخسر عميلاً بسبب متابعة منسية — كل ما يحتاج اهتمامك اليوم في مكان واحد."
      />

      {notice && (
        <div className="notice-banner" role="status">
          <CheckCircle2 size={18} />
          {notice}
          <button type="button" onClick={() => setNotice('')}>×</button>
        </div>
      )}

      <div className="summary-strip">
        <div><strong>{today.length}</strong><span>متابعات اليوم</span></div>
        <div><strong>{overdue.length}</strong><span>متأخرة</span></div>
        <div><strong>{upcoming.length}</strong><span>قادمة</span></div>
        <div><strong>{noFollowUpCount}</strong><span>بدون متابعة مجدولة</span></div>
      </div>

      {error && (
        <ErrorBox message={error} retry={() => { void customers.reload(); void activities.reload(); }} />
      )}

      {loading ? (
        <Loader label="جارٍ تحميل المتابعات..." />
      ) : (
        <>
          <div className="fu-tabs">
            {tabButton('today', 'اليوم', followUpCounts.today, 'blue')}
            {tabButton('overdue', 'متأخرة', followUpCounts.overdue, 'red')}
            {tabButton('upcoming', 'قادمة', followUpCounts.upcoming, 'green')}
            {tabButton('all', 'الكل', followUpCounts.all, 'neutral')}
          </div>

          <section className="panel">
            <div className="panel-toolbar">
              <div className="toolbar-title">
                <h2>قائمة المتابعات</h2>
                <p className="muted">{visible.length} عميل في هذه القائمة</p>
              </div>
              <div className="table-actions">
                <SearchInput value={search} onChange={setSearch} placeholder="ابحث بالاسم أو الإجراء..." />
              </div>
            </div>

            {!visible.length ? (
              <Empty
                icon={ListChecks}
                title={tab === 'today' ? 'لا توجد متابعات لليوم' : tab === 'overdue' ? 'لا توجد متابعات متأخرة' : 'لا توجد متابعات في هذه القائمة'}
                subtitle={search ? 'جرّب تغيير البحث.' : 'حدّد متابعة قادمة لأي عميل من ملفه أو من صفحة العملاء.'}
                action={noFollowUpCount > 0 && !search ? (
                  <Link className="btn btn-outline" to="/customers"><Users size={16}/> انتقال للعملاء</Link>
                ) : undefined}
              />
            ) : (
              <div className="fu-list">
                {visible.map(c => {
                  const isLate = isOverdue(c.next_follow_up_at);
                  const isNow = inToday(c.next_follow_up_at);
                  const wa = whatsappWithMessage(c.phone, waMessage(c));
                  return (
                    <article key={c.id} className={`fu-card ${isLate ? 'fu-card-overdue' : ''}`}>
                      <div className="fu-card-main" onClick={() => setTimeline(c)} role="button" tabIndex={0}
                        onKeyDown={e => { if (e.key === 'Enter') setTimeline(c); }}>
                        <span className="person-avatar">{c.name.charAt(0)}</span>
                        <div className="fu-card-info">
                          <div className="fu-card-title">
                            <b>{c.name}</b>
                            <StatusBadge text={CUSTOMER_STATUSES[c.status]} variant={c.status === 'Customer' ? 'green' : c.status === 'Interested' ? 'orange' : 'blue'} />
                          </div>
                          {c.next_action && <p className="fu-action"><ListChecks size={13}/> {c.next_action}</p>}
                          <span className={`fu-date ${isLate ? 'overdue' : ''}`}>
                            <CalendarClock size={14}/>
                            {isLate ? 'متأخرة منذ ' : isNow ? 'اليوم ' : ''}
                            {formatDate(c.next_follow_up_at, true)}
                          </span>
                        </div>
                      </div>
                      <div className="fu-card-actions">
                        {wa && (
                          <a className="icon-button wa-button" href={wa} target="_blank" rel="noopener noreferrer"
                            aria-label={`واتساب ${c.name}`} title="إرسال واتساب برسالة جاهزة">
                            <MessageCircle size={18}/>
                          </a>
                        )}
                        <button className="icon-button" title="إعادة جدولة" onClick={() => setRescheduling(c)}>
                          <CalendarPlus size={17}/>
                        </button>
                        <button className="icon-button" title="إنجاز المتابعة" onClick={() => setCompleting(c)}
                          style={{ color: '#20ae79' }}>
                          <CheckCircle2 size={18}/>
                        </button>
                        <button className="link-button" onClick={() => setTimeline(c)}>السجل</button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>

          {noFollowUpCount > 0 && !search && tab === 'all' && (
            <p className="report-footnote">
              لديك {noFollowUpCount} عميل بدون متابعة مجدولة. افتح ملف أي عميل من صفحة العملاء لتحديد الإجراء التالي وموعده.
            </p>
          )}
        </>
      )}

      {/* Timeline modal */}
      {timeline && (
        <Modal title={`سجل ${timeline.name}`} subtitle="الخط الزمني الكامل لتفاعلاتك مع هذا العميل" wide onClose={() => { setTimeline(null); setActivityDraft({ type: 'Note', content: '' }); }}>
          <div className="details-top">
            <span className="big-avatar">{timeline.name.charAt(0)}</span>
            <div>
              <h3>{timeline.name}</h3>
              <p className="muted">{timeline.phone || 'لا يوجد رقم هاتف'}</p>
            </div>
            <span className="details-status">
              <StatusBadge text={CUSTOMER_STATUSES[timeline.status]} variant="blue" />
            </span>
          </div>

          {timeline.next_action || timeline.next_follow_up_at ? (
            <div className="fu-current-plan">
              <div>
                <span>الإجراء التالي</span>
                <b>{timeline.next_action || '—'}</b>
              </div>
              <div>
                <span>موعد المتابعة</span>
                <b className={isOverdue(timeline.next_follow_up_at) ? 'overdue-text' : ''}>
                  {formatDate(timeline.next_follow_up_at, true)}
                </b>
              </div>
            </div>
          ) : null}

          {/* Record activity */}
          <div className="fu-record-section">
            <h3><Plus size={16}/> تسجيل تفاعل جديد</h3>
            <form className="fu-record-form" onSubmit={recordActivity}>
              <select className="filter-select" value={activityDraft.type}
                onChange={e => setActivityDraft(d => ({ ...d, type: e.target.value as ActivityType }))}>
                {Object.entries(ACTIVITY_TYPES).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
              <input
                placeholder="اكتب تفاصيل المكالمة، الرسالة، أو الاجتماع..."
                value={activityDraft.content}
                maxLength={1500}
                onChange={e => setActivityDraft(d => ({ ...d, content: e.target.value }))}
              />
              {activityDraft.type === 'WhatsApp' && whatsappWithMessage(timeline.phone, activityDraft.content || waMessage(timeline)) && (
                <a className="btn btn-outline btn-small"
                  href={whatsappWithMessage(timeline.phone, activityDraft.content || waMessage(timeline))!}
                  target="_blank" rel="noopener noreferrer">
                  <MessageCircle size={15}/> فتح واتساب
                </a>
              )}
              <button className="btn btn-primary" disabled={savingActivity || !activityDraft.content.trim()}>
                {savingActivity ? <LoaderCircle className="spin" size={16}/> : <Plus size={16}/>}
                حفظ
              </button>
            </form>
          </div>

          {/* Quick WhatsApp */}
          {whatsappWithMessage(timeline.phone, waMessage(timeline)) && (
            <a className="btn btn-outline btn-block fu-wa-cta"
              href={whatsappWithMessage(timeline.phone, waMessage(timeline))!}
              target="_blank" rel="noopener noreferrer">
              <MessageCircle size={18}/> تواصل عبر واتساب برسالة جاهزة
            </a>
          )}

          {/* Timeline */}
          <div className="fu-timeline-section">
            <div className="section-mini-head">
              <h3><Clock3 size={16}/> الخط الزمني للتفاعلات</h3>
              <span>{timelineEvents.length} حدث</span>
            </div>
            {timelineEvents.length ? (
              <div className="fu-timeline">
                {timelineEvents.map(ev => (
                  <div className="fu-timeline-item" key={ev.id}>
                    <span className={`fu-timeline-dot fu-dot-${ev.type}`} />
                    <div className="fu-timeline-body">
                      <p><b>{ev.label}</b></p>
                      <small>{ev.detail}</small>
                      <span className="fu-timeline-date">{formatDate(ev.date, true)}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="muted" style={{ marginTop: 16 }}>لا تتفاعلات مسجلة بعد.</p>
            )}
          </div>

          <div className="form-actions">
            <Link className="btn btn-outline" to="/customers" onClick={() => setTimeline(null)}>
              <ArrowUpLeft size={16}/> صفحة العملاء
            </Link>
            <button className="btn btn-ghost" onClick={() => { setTimeline(null); setActivityDraft({ type: 'Note', content: '' }); }}>
              <X size={16}/> إغلاق
            </button>
          </div>
        </Modal>
      )}

      {/* Reschedule modal */}
      {rescheduling && (
        <Modal title="إعادة جدولة المتابعة" subtitle={`تعديل موعد متابعة ${rescheduling.name}`} onClose={() => setRescheduling(null)}>
          <RescheduleForm
            fields={rescheduleFields}
            initial={{
              next_action: rescheduling.next_action,
              next_follow_up_at: localInputTime(rescheduling.next_follow_up_at) || localInputTime(new Date().toISOString()),
            }}
            onSubmit={rescheduleSave}
            onClose={() => setRescheduling(null)}
            customerName={rescheduling.name}
          />
        </Modal>
      )}

      {/* Complete confirmation */}
      {completing && (
        <Confirm
          title="إنجاز المتابعة"
          description={`سيتم تعليم متابعة "${completing.name}" كمنجزة ومسح الإجراء التالي والموعد. يمكنك تسجيل تفاعل في سجل العميل.`}
          onConfirm={completeFollowUp}
          onClose={() => setCompleting(null)}
        />
      )}
    </>
  );
}

function RescheduleForm({ fields, initial, onSubmit, onClose, customerName }: {
  fields: Field[]; initial: Record<string, string>;
  onSubmit: (values: Record<string, string>) => Promise<void>; onClose: () => void; customerName: string;
}) {
  const [values, setValues] = useState<Record<string, string>>(() => Object.fromEntries(fields.map(f => [f.key, initial[f.key] ?? ''])));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError('');
      await onSubmit(values);
      onClose();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };
  return (
    <form onSubmit={submit} className="modal-form">
      <p className="muted">أعد تحديد الإجراء والموعد القادم لمتابعة <b>{customerName}</b>.</p>
      <div className="form-grid">
        {fields.map(field => (
          <label key={field.key} className={`field ${field.type === 'textarea' ? 'field-full' : ''}`}>
            <span>{field.label}{field.required && <b className="required"> *</b>}</span>
            <input
              type={field.type ?? 'text'}
              value={values[field.key]}
              placeholder={field.placeholder}
              onChange={e => setValues(s => ({ ...s, [field.key]: e.target.value }))}
              required={field.required}
            />
          </label>
        ))}
      </div>
      {error && <ErrorBox message={error} />}
      <div className="form-actions">
        <button className="btn btn-ghost" type="button" onClick={onClose} disabled={saving}>إلغاء</button>
        <button className="btn btn-primary" disabled={saving} type="submit">
          {saving ? <Clock3 size={17} className="spin" /> : <CalendarPlus size={17} />} حفظ الموعد
        </button>
      </div>
    </form>
  );
}
