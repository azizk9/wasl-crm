import { useEffect, useState, type FormEvent } from 'react';
import { CheckCircle2, LockKeyhole, Mail, Save, ShieldCheck, UserRound } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { ErrorBox, PageTitle } from '../components/UI';
import { errorMessage } from '../lib/data';
import { getClient } from '../lib/supabase';

export function SettingsPage(){
  const {user}=useAuth();const [name,setName]=useState('');const [busy,setBusy]=useState(false);const [error,setError]=useState('');const [notice,setNotice]=useState('');
  const [password,setPassword]=useState('');const [passBusy,setPassBusy]=useState(false);
  useEffect(()=>{if(!user)return;getClient().from('profiles').select('full_name').eq('id',user.id).single().then(({data,error:e})=>{if(data)setName(data.full_name??'');if(e)setError(e.message);});},[user]);
  const submit=async(event:FormEvent)=>{event.preventDefault();if(!user)return;setBusy(true);setError('');setNotice('');try{const {error:e}=await getClient().from('profiles').update({full_name:name.trim()}).eq('id',user.id);if(e)throw e;setNotice('تم حفظ بيانات الحساب.');}catch(err){setError(errorMessage(err));}finally{setBusy(false);}};
  const changePassword=async(event:FormEvent)=>{event.preventDefault();setPassBusy(true);setError('');setNotice('');try{const {error:e}=await getClient().auth.updateUser({password});if(e)throw e;setPassword('');setNotice('تم تحديث كلمة المرور بنجاح. قد تتطلب بعض الحسابات إعادة التحقق.');}catch(err){setError(errorMessage(err));}finally{setPassBusy(false);}};
  return <><PageTitle eyebrow="تفضيلات المستخدم" title="إعدادات الحساب" subtitle="عدّل معلومات حسابك، وتأكد من حماية بياناتك."/>
    {error&&<ErrorBox message={error}/>} {notice&&<div className="notice-banner" role="status"><CheckCircle2 size={18}/>{notice}<button onClick={()=>setNotice('')}>×</button></div>}
    <div className="settings-grid"><section className="panel settings-panel"><div className="section-head"><div><h2><UserRound size={20}/> المعلومات الشخصية</h2><p className="muted">الاسم الذي يظهر في حسابك</p></div></div><form className="settings-form" onSubmit={submit}><label className="field"><span>الاسم الكامل</span><input value={name} onChange={e=>setName(e.target.value)} placeholder="اسمك الكامل" maxLength={160}/></label><label className="field"><span>البريد الإلكتروني</span><div className="input-icon"><Mail size={17}/><input type="email" value={user?.email??''} disabled dir="ltr"/></div></label><p className="hint">لتغيير بريدك الإلكتروني استخدم إعدادات المصادقة أو تواصل مع مشرف المشروع.</p><button className="btn btn-primary" disabled={busy}><Save size={17}/>{busy?'جارٍ الحفظ...':'حفظ التغييرات'}</button></form></section><section className="panel settings-panel"><div className="section-head"><div><h2><LockKeyhole size={20}/> الأمان</h2><p className="muted">تحديث كلمة المرور الخاصة بحسابك</p></div></div><form className="settings-form" onSubmit={changePassword}><label className="field"><span>كلمة مرور جديدة</span><input type="password" value={password} onChange={e=>setPassword(e.target.value)} minLength={6} required placeholder="أدخل كلمة مرور لا تقل عن 6 أحرف" autoComplete="new-password"/></label><button className="btn btn-outline" disabled={passBusy}><LockKeyhole size={17}/>{passBusy?'جارٍ التحديث...':'تغيير كلمة المرور'}</button></form><div className="security-note"><ShieldCheck size={21}/><div><b>حماية البيانات</b><p>بيانات كل مستخدم محمية بسياسات PostgreSQL Row Level Security، بالإضافة إلى المصادقة.</p></div></div></section></div>
  </>;
}
