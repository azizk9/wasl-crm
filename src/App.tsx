import { Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './auth/AuthContext';
import { Loader } from './components/UI';
import { AppLayout } from './layout/AppLayout';
import { isConfigured } from './lib/supabase';
import { AuthPage, ResetPasswordPage, SetupPage } from './pages/AuthPage';
import { DashboardPage } from './pages/DashboardPage';
import { CustomersPage } from './pages/CustomersPage';
import { PipelinePage } from './pages/PipelinePage';
import { TasksPage } from './pages/TasksPage';
import { AppointmentsPage } from './pages/AppointmentsPage';
import { ReportsPage } from './pages/ReportsPage';
import { SettingsPage } from './pages/SettingsPage';
import { FollowUpsPage } from './pages/FollowUpsPage';

function RoutedApp(){
  const {user,loading}=useAuth();
  if(loading)return <div className="standalone"><Loader label="جارٍ بدء وصل CRM..."/></div>;
  return <Routes>
    <Route path="/login" element={!user?<AuthPage/>:<Navigate to="/dashboard" replace/>}/>
    <Route path="/reset-password" element={<ResetPasswordPage/>}/>
    <Route path="/*" element={user?<AppLayout><Routes>
      <Route path="/dashboard" element={<DashboardPage/>}/>
      <Route path="/customers" element={<CustomersPage/>}/>
      <Route path="/pipeline" element={<PipelinePage/>}/>
      <Route path="/follow-ups" element={<FollowUpsPage/>}/>
      <Route path="/tasks" element={<TasksPage/>}/>
      <Route path="/appointments" element={<AppointmentsPage/>}/>
      <Route path="/reports" element={<ReportsPage/>}/>
      <Route path="/settings" element={<SettingsPage/>}/>
      <Route path="*" element={<Navigate to="/dashboard" replace/>}/>
    </Routes></AppLayout>:<Navigate to="/login" replace/>}/>
  </Routes>;
}
export default function App(){return isConfigured?<AuthProvider><RoutedApp/></AuthProvider>:<SetupPage/>;}
