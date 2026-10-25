import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { CalendarDays, ChartNoAxesCombined, ChevronDown, CircleHelp, ClipboardList, LayoutDashboard, LogOut, Menu, Plus, Settings, ShieldCheck, Target, Users, X, CalendarClock, UserCog } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { getClient } from '../lib/supabase';
import { useLanguage } from '../i18n/LanguageContext';

const nav = [
  { to:'/dashboard', label:'لوحة التحكم', icon:LayoutDashboard },
  { to:'/customers', label:'العملاء', icon:Users },
  { to:'/pipeline', label:'فرص البيع', icon:Target },
  { to:'/follow-ups', label:'مركز المتابعات', icon:CalendarClock },
  { to:'/tasks', label:'المهام', icon:ClipboardList },
  { to:'/appointments', label:'المواعيد', icon:CalendarDays },
  { to:'/reports', label:'التقارير', icon:ChartNoAxesCombined },
];
const teamNav = { to:'/team', label:'الفريق', icon:UserCog };
function Logo(){ return <Link className="logo" to="/dashboard"><span className="logo-mark">و</span><span><strong>وصل <small>WASL</small></strong><em>Customer relationship manager</em></span></Link>; }
function WorkspaceSwitcher(){
  const {role}=useAuth();const {t}=useLanguage();const [open,setOpen]=useState(false);const ref=useRef<HTMLDivElement>(null);
  useEffect(()=>{const h=(event:MouseEvent)=>{if(ref.current&&!ref.current.contains(event.target as Node))setOpen(false);};document.addEventListener('mousedown',h);return()=>document.removeEventListener('mousedown',h);},[]);
  return <div className="workspace-switcher" ref={ref}>
    <button type="button" className="workspace-pill" onClick={()=>setOpen(value=>!value)} aria-haspopup="menu" aria-expanded={open}>
      <span className="workspace-avatar">W</span><span className="workspace-text"><strong>{t('مساحة عملي')}</strong><small>{t('الخطة الأساسية')}</small></span><ChevronDown size={16} className={`workspace-chevron ${open?'open':''}`}/>
    </button>
    {open&&<div className="workspace-menu" role="menu">
      <div className="workspace-menu-current"><span className="workspace-avatar">W</span><div><strong>{t('مساحة عملي')}</strong><small>{t('مساحتك الحالية')}</small></div></div>
      <div className="user-dropdown-divider"/>
      <Link to="/dashboard" className="workspace-menu-item" onClick={()=>setOpen(false)} role="menuitem">{t('لوحة التحكم')}</Link>
      {role==='admin'&&<Link to="/team" className="workspace-menu-item" onClick={()=>setOpen(false)} role="menuitem">{t('إدارة الفريق')}</Link>}
      <Link to="/settings" className="workspace-menu-item" onClick={()=>setOpen(false)} role="menuitem">{t('إعدادات الحساب')}</Link>
    </div>}
  </div>;
}
function UserMenu(){
  const {user,role,fullName}=useAuth();const {t}=useLanguage();const navigate=useNavigate();const [open,setOpen]=useState(false);
  const ref=useRef<HTMLDivElement>(null);
  useEffect(()=>{const h=(e:MouseEvent)=>{if(ref.current&&!ref.current.contains(e.target as Node))setOpen(false);};document.addEventListener('mousedown',h);return()=>document.removeEventListener('mousedown',h);},[]);
  const logout=async()=>{await getClient().auth.signOut();navigate('/login',{replace:true});};
  const display=fullName||(user?.email??'U');
  const initial=display.charAt(0).toUpperCase();
  return <div className="user-menu" ref={ref}>
    <button type="button" className="user-trigger topbar-user" onClick={()=>setOpen(o=>!o)} aria-haspopup="menu" aria-expanded={open}>
      <span className="header-user">{initial}</span>
      <span className="user-trigger-info"><b>{display}</b><small>{t(role==='admin'?'مشرف':'مبيعات')}</small></span>
      <ChevronDown size={15} className={`user-chevron ${open?'open':''}`}/>
    </button>
    {open&&<div className="user-dropdown" role="menu">
      <div className="user-dropdown-head"><span className="header-user big">{initial}</span><div><b>{display}</b><small dir="ltr">{user?.email??''}</small></div></div>
      <div className="user-dropdown-role"><ShieldCheck size={15}/> <span>{t(role==='admin'?'الدور: مشرف عام':'الدور: منسق مبيعات')}</span></div>
      <div className="user-dropdown-divider"/>
      <Link to="/settings" onClick={()=>setOpen(false)} className="user-dropdown-item" role="menuitem"><Settings size={17}/> {t('الإعدادات')}</Link>
      <a className="user-dropdown-item" href="https://supabase.com/docs" target="_blank" rel="noreferrer" onClick={()=>setOpen(false)} role="menuitem"><CircleHelp size={17}/> {t('المساعدة')}</a>
      <div className="user-dropdown-divider"/>
      <button type="button" className="user-dropdown-item danger" onClick={logout} role="menuitem"><LogOut size={17}/> {t('تسجيل الخروج')}</button>
    </div>}
  </div>;
}
export function AppLayout({children}:{children:ReactNode}) {
  const [drawer,setDrawer]=useState(false);const location=useLocation();const {role}=useAuth();const {language,t,toggleLanguage}=useLanguage();
  const visibleNav = role === 'admin' ? [...nav, teamNav] : nav;
  const active = visibleNav.find(n=>location.pathname.startsWith(n.to));
  return <div className="app-shell">
    {drawer&&<button type="button" className="mobile-scrim" onClick={()=>setDrawer(false)} aria-label="إغلاق القائمة"/>}
    <aside className={`sidebar ${drawer?'sidebar-open':''}`}>
      <div className="sidebar-top"><Logo/><button className="mobile-close icon-button" onClick={()=>setDrawer(false)} aria-label="إغلاق"><X size={19}/></button></div>
      <WorkspaceSwitcher/>
      <div className="nav-caption">{t('مساحة العمل')}</div>
      <nav className="side-nav" aria-label="التنقل الرئيسي">{visibleNav.map(({to,label,icon:Icon})=><NavLink onClick={()=>setDrawer(false)} key={to} to={to} className={({isActive})=>`side-link ${isActive?'active':''}`}><Icon size={19}/><span>{t(label)}</span></NavLink>)}</nav>
      <div className="sidebar-bottom"><div className="nav-caption">{t('الحساب')}</div><NavLink onClick={()=>setDrawer(false)} className={({isActive})=>`side-link ${isActive?'active':''}`} to="/settings"><Settings size={19}/>{t('الإعدادات')}</NavLink></div>
      <p className="sidebar-version">WASL CRM • v1.0</p>
    </aside>
    <div className="app-main"><header className="topbar"><div className="topbar-start"><span className="topbar-page">{t(active?.label ?? 'الإعدادات')}</span></div><div className="topbar-end"><button type="button" className="language-toggle" onClick={toggleLanguage} aria-label="Change language">{language==='ar'?'English':'العربية'}</button><UserMenu/><span className="topbar-divider"/><Link to="/customers?new=1" className="btn btn-primary btn-small topbar-add"><span>{t('إضافة عميل')}</span><Plus size={18}/></Link><button className="icon-button topbar-menu-icon" onClick={()=>setDrawer(true)} aria-label="فتح القائمة"><Menu size={22}/></button></div></header><main className="content">{children}</main><footer className="app-footer"><span>© Wasl CRM 2026</span><span>أنجز أعمالك بوضوح أكثر</span></footer></div>
  </div>;
}
