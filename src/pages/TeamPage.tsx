import { useEffect, useState } from 'react';
import { Crown, ShieldCheck, UserCog, UsersRound } from 'lucide-react';
import { Empty, ErrorBox, Loader, PageTitle } from '../components/UI';
import { errorMessage } from '../lib/data';
import { getClient } from '../lib/supabase';
import { useAuth } from '../auth/AuthContext';
import type { Profile, UserRole } from '../types/models';

export function TeamPage() {
  const { role, user } = useAuth();
  const [members, setMembers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const loadMembers = async () => {
    try {
      setLoading(true);
      setError('');
      const { data, error: queryError } = await getClient().from('profiles').select('id,full_name,role,created_at,updated_at').order('created_at', { ascending: true });
      if (queryError) throw queryError;
      setMembers((data ?? []) as Profile[]);
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (role === 'admin') void loadMembers();
    else setLoading(false);
  }, [role]);

  const updateRole = async (member: Profile, nextRole: UserRole) => {
    if (member.role === nextRole || member.id === user?.id && nextRole !== 'admin') return;
    try {
      setError('');
      setNotice('');
      const { error: rpcError } = await getClient().rpc('set_member_role', { p_member: member.id, p_role: nextRole });
      if (rpcError) throw rpcError;
      setMembers(current => current.map(item => item.id === member.id ? { ...item, role: nextRole } : item));
      setNotice('تم تحديث دور العضو بنجاح.');
    } catch (cause) {
      setError(errorMessage(cause));
    }
  };

  if (role !== 'admin') {
    return <><PageTitle eyebrow="إدارة الوصول" title="الفريق" subtitle="هذه الصفحة متاحة للمشرفين فقط."/><div className="panel"><Empty icon={ShieldCheck} title="لا تملك صلاحية الوصول" subtitle="تواصل مع مشرف مساحة العمل إذا كنت بحاجة إلى إدارة الفريق."/></div></>;
  }

  return <>
    <PageTitle eyebrow="إدارة مساحة العمل" title="الفريق" subtitle="راجع أعضاء الفريق وأدر صلاحيات الوصول من مكان واحد."/>
    {notice && <div className="notice-banner" role="status">{notice}<button type="button" onClick={() => setNotice('')}>×</button></div>}
    {error && <ErrorBox message={error} retry={() => { void loadMembers(); }}/>} 
    {loading ? <Loader/> : <section className="panel team-panel">
      <div className="section-head"><div><h2><UsersRound size={20}/> أعضاء مساحة العمل</h2><p className="muted">{members.length} أعضاء مسجلون في النظام</p></div><span className="role-badge role-admin"><Crown size={14}/> صلاحيات المشرف</span></div>
      {members.length ? <div className="table-scroll"><table className="data-table team-table"><thead><tr><th>العضو</th><th>الدور الحالي</th><th>تغيير الدور</th><th>تاريخ الانضمام</th></tr></thead><tbody>{members.map(member => <tr key={member.id}><td><div className="person-cell"><span className="person-avatar">{(member.full_name || 'م').charAt(0)}</span><span><b>{member.full_name || 'عضو بدون اسم'}</b><small dir="ltr">{member.id.slice(0, 8)}…</small></span></div></td><td><span className={`role-badge ${member.role === 'admin' ? 'role-admin' : 'role-sales'}`}>{member.role === 'admin' ? <><Crown size={13}/> مشرف عام</> : <><UserCog size={13}/> منسق مبيعات</>}</span></td><td><select className="filter-select" value={member.role} disabled={member.id === user?.id} aria-label={`تغيير دور ${member.full_name || 'العضو'}`} onChange={event => { void updateRole(member, event.target.value as UserRole); }}><option value="sales">منسق مبيعات</option><option value="admin">مشرف عام</option></select></td><td>{new Date(member.created_at).toLocaleDateString('ar-SY')}</td></tr>)}</tbody></table></div> : <Empty icon={UsersRound} title="لا يوجد أعضاء بعد" subtitle="سيظهر أعضاء مساحة العمل هنا."/>}
    </section>}
  </>;
}
