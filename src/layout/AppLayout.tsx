import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { CalendarDays, ChartNoAxesCombined, ChevronDown, CircleHelp, ClipboardList, LayoutDashboard, LogOut, Menu, PanelRightClose, Plus, Settings, ShieldCheck, Target, Users, X, CalendarClock } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { getClient } from '../lib/supabase';

const nav = [
  { to:'/dashboard', label:'لوحة التحكم', icon:LayoutDashboard },
  { to:'/customers', label:'العملاء', icon:Users },
  { to:'/pipeline', label:'فرص البيع', icon:Target },
  { to:'/follow-ups', label:'مركز المتابعات', icon:CalendarClock },
  { to:'/tasks', label:'المهام', icon:ClipboardList },
  { to:'/appointments', label:'المواعيد', icon:CalendarDays },
  { to:'/reports', label:'التقارير', icon:ChartNoAxesCombined },
];
function Logo(){ return <Link className="logo" to="/dashboard"><span className="logo-mark">و</span><span><strong>وصل <small>WASL</small></strong><em>Customer relationship manager</em></span></Link>; }
function UserMenu(){
  const {user,role,fullName}=useAuth();const navigate=useNavigate();const [open,setOpen]=useState(false);
  const ref=useRef<HTMLDivElement>(null);
  useEffect(()=>{const h=(e:MouseEvent)=>{if(ref.current&&!ref.current.contains(e.target as Node))setOpen(false);};document.addEventListener('mousedown',h);return()=>document.removeEventListener('mousedown',h);},[]);
  const logout=async()=>{await getClient().auth.signOut();navigate('/login',{replace:true});};
  const display=fullName||(user?.email??'U');
  const initial=display.charAt(0).toUpperCase();
  return <div className="user-menu" ref={ref}>
    <button type="button" className="user-trigger topbar-user" onClick={()=>setOpen(o=>!o)} aria-haspopup="menu" aria-expanded={open}>
      <span className="header-user">{initial}</span>
      <span className="user-trigger-info"><b>{display}</b><small>{role==='admin'?'مشرف':'مبيعات'}</small></span>
      <ChevronDown size={15} className={`user-chevron ${open?'open':''}`}/>
    </button>
    {open&&<div className="user-dropdown" role="menu">
      <div className="user-dropdown-head"><span className="header-user big">{initial}</span><div><b>{display}</b><small dir="ltr">{user?.email??''}</small></div></div>
      <div className="user-dropdown-role"><ShieldCheck size={15}/> <span>الدور: {role==='admin'?'مشرف عام':'منسق مبيعات'}</span></div>
      <div className="user-dropdown-divider"/>
      <Link to="/settings" onClick={()=>setOpen(false)} className="user-dropdown-item" role="menuitem"><Settings size={17}/> الإعدادات</Link>
      <a className="user-dropdown-item" href="https://supabase.com/docs" target="_blank" rel="noreferrer" onClick={()=>setOpen(false)} role="menuitem"><CircleHelp size={17}/> المساعدة</a>
      <div className="user-dropdown-divider"/>
      <button type="button" className="user-dropdown-item danger" onClick={logout} role="menuitem"><LogOut size={17}/> تسجيل الخروج</button>
    </div>}
  </div>;
}
export function AppLayout({children}:{children:ReactNode}) {
  const [drawer,setDrawer]=useState(false);const location=useLocation();
  const active = nav.find(n=>location.pathname.startsWith(n.to));
  return <div className="app-shell">
    {drawer&&<button type="button" className="mobile-scrim" onClick={()=>setDrawer(false)} aria-label="إغلاق القائمة"/>}
    <aside className={`sidebar ${drawer?'sidebar-open':''}`}>
      <div className="sidebar-top"><Logo/><button className="mobile-close icon-button" onClick={()=>setDrawer(false)} aria-label="إغلاق"><X size={19}/></button></div>
      <div className="workspace-pill"><span className="workspace-avatar">W</span><span className="workspace-text"><strong>مساحة عملي</strong><small>الخطة الأساسية</small></span><ChevronDown size={16}/></div>
      <div className="nav-caption">مساحة العمل</div>
      <nav className="side-nav" aria-label="التنقل الرئيسي">{nav.map(({to,label,icon:Icon})=><NavLink onClick={()=>setDrawer(false)} key={to} to={to} className={({isActive})=>`side-link ${isActive?'active':''}`}><Icon size={19}/><span>{label}</span></NavLink>)}</nav>
      <div className="sidebar-bottom"><div className="nav-caption">الحساب</div><NavLink onClick={()=>setDrawer(false)} className={({isActive})=>`side-link ${isActive?'active':''}`} to="/settings"><Settings size={19}/>الإعدادات</NavLink></div>
      <p className="sidebar-version">WASL CRM • v1.0</p>
    </aside>
    <div className="app-main"><header className="topbar"><div className="topbar-start"><span className="topbar-page">{active?.label ?? 'الإعدادات'}</span></div><div className="topbar-end"><UserMenu/><span className="topbar-divider"/><Link to="/customers?new=1" className="btn btn-primary btn-small topbar-add"><span>إضافة عميل</span><Plus size={18}/></Link><button className="icon-button topbar-menu-icon" onClick={()=>setDrawer(true)} aria-label="فتح القائمة"><Menu size={22}/></button><button className="icon-button topbar-panel-icon" aria-label="إخفاء القائمة"><PanelRightClose size={20}/></button></div></header><main className="content">{children}</main><footer className="app-footer"><span>© Wasl CRM 2026</span><span>أنجز أعمالك بوضوح أكثر</span></footer></div>
  </div>;
}
