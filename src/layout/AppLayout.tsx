import { useState, type ReactNode } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { CalendarDays, ChartNoAxesCombined, ChevronDown, CircleHelp, ClipboardList, LayoutDashboard, LogOut, Menu, PanelRightClose, Plus, Settings, Target, Users, X, CalendarClock } from 'lucide-react';
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
export function AppLayout({children}:{children:ReactNode}) {
  const [drawer,setDrawer] = useState(false);const {user}=useAuth();const navigate=useNavigate();const location=useLocation();
  const active = nav.find(n=>location.pathname.startsWith(n.to));
  const logout=async()=>{await getClient().auth.signOut();navigate('/login',{replace:true});};
  return <div className="app-shell">
    {drawer&&<button type="button" className="mobile-scrim" onClick={()=>setDrawer(false)} aria-label="إغلاق القائمة"/>}
    <aside className={`sidebar ${drawer?'sidebar-open':''}`}>
      <div className="sidebar-top"><Logo/><button className="mobile-close icon-button" onClick={()=>setDrawer(false)} aria-label="إغلاق"><X size={19}/></button></div>
      <div className="workspace-pill"><span className="workspace-avatar">W</span><span className="workspace-text"><strong>مساحة عملي</strong><small>الخطة الأساسية</small></span><ChevronDown size={16}/></div>
      <div className="nav-caption">مساحة العمل</div>
      <nav className="side-nav" aria-label="التنقل الرئيسي">{nav.map(({to,label,icon:Icon})=><NavLink onClick={()=>setDrawer(false)} key={to} to={to} className={({isActive})=>`side-link ${isActive?'active':''}`}><Icon size={19}/><span>{label}</span></NavLink>)}</nav>
      <div className="sidebar-bottom"><div className="nav-caption">الحساب</div><NavLink onClick={()=>setDrawer(false)} className={({isActive})=>`side-link ${isActive?'active':''}`} to="/settings"><Settings size={19}/>الإعدادات</NavLink><a className="side-link" href="https://supabase.com/docs" target="_blank" rel="noreferrer"><CircleHelp size={19}/>المساعدة</a><button type="button" className="side-link logout" onClick={logout}><LogOut size={19}/>تسجيل الخروج</button></div>
      <p className="sidebar-version">WASL CRM • v1.0</p>
    </aside>
    <div className="app-main"><header className="topbar"><div className="topbar-start"><button className="icon-button menu-trigger" onClick={()=>setDrawer(true)} aria-label="فتح القائمة"><Menu size={21}/></button><PanelRightClose className="topbar-icon" size={19}/><span className="topbar-divider"/><span className="topbar-page">{active?.label ?? 'الإعدادات'}</span></div><div className="topbar-end"><Link to="/customers?new=1" className="btn btn-primary btn-small"><Plus size={16}/> إضافة عميل</Link><span className="header-user" title={user?.email??''}>{(user?.email??'U').charAt(0).toUpperCase()}</span></div></header><main className="content">{children}</main><footer className="app-footer"><span>© Wasl CRM 2026</span><span>أنجز أعمالك بوضوح أكثر</span></footer></div>
  </div>;
}
