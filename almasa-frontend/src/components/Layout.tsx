// import { ReactNode } from 'react';
// import { motion } from 'framer-motion';
// import { Link, useLocation } from 'react-router-dom';
// import {
//   LayoutDashboard, Users, Clock, DollarSign,
//   ChevronRight, Building2, Menu, X
// } from 'lucide-react';
// import { useState } from 'react';

// const navItems = [
//   { label: 'لوحة التحكم', icon: LayoutDashboard, path: '/' },
//   { label: 'الموظفون', icon: Users, path: '/employees' },
//   { label: 'الحضور والوقت', icon: Clock, path: '/attendance' },
//   { label: 'الرواتب والقروض', icon: () => <span className="font-bold text-sm">ج.م</span>, path: '/payroll' },
// ];

// interface LayoutProps { children: ReactNode; }

// export default function Layout({ children }: LayoutProps) {
//   const location = useLocation();
//   const [sidebarOpen, setSidebarOpen] = useState(true);

//   return (
//     <div className="flex min-h-screen bg-background">
//       {/* Sidebar */}
//       <motion.aside
//         initial={false}
//         animate={{ width: sidebarOpen ? 260 : 72 }}
//         transition={{ duration: 0.3, ease: 'easeInOut' }}
//         className="flex flex-col shrink-0 overflow-hidden"
//         style={{ background: 'hsl(var(--navy-dark))' }}
//       >
//         {/* Logo Area */}
//         <div className="flex items-center gap-3 px-4 py-5 border-b border-white/10">
//           <div className="flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center"
//             style={{ background: 'var(--gradient-gold)' }}>
//             <Building2 className="w-5 h-5" style={{ color: 'hsl(var(--navy-dark))' }} />
//           </div>
//           {sidebarOpen && (
//             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
//               <p className="font-cairo font-bold text-white text-base leading-tight">شركة الماسه</p>
//               <p className="text-xs" style={{ color: 'hsl(var(--gold-light))' }}>Al-Masa Company</p>
//             </motion.div>
//           )}
//         </div>

//         {/* Nav Items */}
//         <nav className="flex-1 py-4 space-y-1 px-2">
//           {navItems.map((item) => {
//             const active = location.pathname === item.path;
//             return (
//               <Link key={item.path} to={item.path}>
//                 <motion.div
//                   whileHover={{ x: 2 }}
//                   className={`flex items-center gap-3 px-3 py-3 rounded-lg cursor-pointer transition-colors ${
//                     active ? 'nav-item-active' : 'text-sidebar-foreground hover:bg-sidebar-accent'
//                   }`}
//                 >
//                   <item.icon className="w-5 h-5 flex-shrink-0" style={{ color: active ? 'hsl(var(--gold))' : undefined }} />
//                   {sidebarOpen && (
//                     <span className="text-sm font-medium font-cairo flex-1">{item.label}</span>
//                   )}
//                   {sidebarOpen && active && <ChevronRight className="w-4 h-4" style={{ color: 'hsl(var(--gold))' }} />}
//                 </motion.div>
//               </Link>
//             );
//           })}
//         </nav>

//         {/* Collapse toggle */}
//         <div className="p-4 border-t border-white/10">
//           <button
//             onClick={() => setSidebarOpen(!sidebarOpen)}
//             className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
//           >
//             {sidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
//             {sidebarOpen && <span className="text-xs font-cairo">طي القائمة</span>}
//           </button>
//         </div>
//       </motion.aside>

//       {/* Main Content */}
//       <div className="flex flex-col flex-1 min-w-0">
//         {/* Top Header */}
//         <header className="h-16 flex items-center justify-between px-6 bg-white border-b border-border shadow-sm">
//           <div>
//             <h1 className="font-cairo font-bold text-lg" style={{ color: 'hsl(var(--navy))' }}>
//               {navItems.find(n => n.path === location.pathname)?.label || 'شركة الماسه'}
//             </h1>
//             <p className="text-xs text-muted-foreground">
//               {navItems.find(n => n.path === location.pathname)?.labelEn || 'Al-Masa Company'}
//             </p>
//           </div>
//           <div className="flex items-center gap-3">
//             <div className="text-right">
//               <p className="text-sm font-semibold" style={{ color: 'hsl(var(--navy))' }}>مدير النظام</p>
//               <p className="text-xs text-muted-foreground">أ/ ياسر بشير</p>
//             </div>
//             <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm"
//               style={{ background: 'var(--gradient-hero)', color: 'white' }}>
//               م
//             </div>
//           </div>
//         </header>

//         {/* Page Content */}
//         <main className="flex-1 overflow-auto p-6">
//           <motion.div
//             key={location.pathname}
//             initial={{ opacity: 0, y: 12 }}
//             animate={{ opacity: 1, y: 0 }}
//             transition={{ duration: 0.3 }}
//           >
//             {children}
//           </motion.div>
//         </main>
//       </div>
//     </div>
//   );
// }


import { type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, Clock, CalendarX2, Scale, BookOpen,
  ChevronRight, Building2, Menu, X, LogOut, ClipboardList,
} from 'lucide-react';
import { useState } from 'react';
import { clearAuth, getAuth, isAdmin } from '@/lib/auth';

const baseNavItems = [
  { label: 'لوحة التحكم',     labelEn: 'Dashboard',       icon: LayoutDashboard, path: '/' },
  { label: 'لايحة الشركة',    labelEn: 'Company Policy',  icon: BookOpen,        path: '/company-policy' },
  { label: 'الموظفون',         labelEn: 'Employees',        icon: Users,           path: '/employees' },
  { label: 'الحضور والوقت',   labelEn: 'Attendance',       icon: Clock,           path: '/attendance' },
  { label: 'الرواتب والقروض', labelEn: 'Payroll & Loans',  icon: () => <span className="font-bold text-sm w-5 h-5 flex items-center justify-center">ج.م</span>, path: '/payroll' },
  { label: 'سجل الإجازات',    labelEn: 'Absence History',  icon: CalendarX2,      path: '/manager/absence-history' },
  { label: 'نهاية الخدمة',   labelEn: 'End of Service',   icon: Scale,           path: '/settlement' },
];

interface LayoutProps { children: ReactNode; }

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const auth = getAuth();
  const admin = isAdmin(auth);

  const adminNavItems = admin
    ? [{ label: 'سجل التدقيق', labelEn: 'Audit log', icon: ClipboardList, path: '/audit-logs' as const }]
    : [];
  const navItems = [...baseNavItems, ...adminNavItems];

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: sidebarOpen ? 260 : 72 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="flex flex-col shrink-0 overflow-hidden"
        style={{ background: 'hsl(var(--navy-dark))' }}
      >
        {/* Logo Area */}
        <div className="flex items-center gap-3 px-4 py-5 border-b border-white/10">
          <div className="flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center"
            style={{ background: 'var(--gradient-gold)' }}>
            <Building2 className="w-5 h-5" style={{ color: 'hsl(var(--navy-dark))' }} />
          </div>
          {sidebarOpen && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
              <p className="font-cairo font-bold text-white text-base leading-tight">شركة الماسه</p>
              <p className="text-xs" style={{ color: 'hsl(var(--gold-light))' }}>Al-Masa Company</p>
            </motion.div>
          )}
        </div>

        {/* Nav Items */}
        <nav className="flex-1 py-4 space-y-1 px-2">
          {navItems.map((item) => {
            const active = location.pathname === item.path;
            return (
              <Link key={item.path} to={item.path}>
                <motion.div
                  whileHover={{ x: 2 }}
                  className={`flex items-center gap-3 px-3 py-3 rounded-lg cursor-pointer transition-colors ${
                    active ? 'nav-item-active' : 'text-sidebar-foreground hover:bg-sidebar-accent'
                  }`}
                >
                  <item.icon className="w-5 h-5 flex-shrink-0" style={{ color: active ? 'hsl(var(--gold))' : undefined }} />
                  {sidebarOpen && (
                    <span className="text-sm font-medium font-cairo flex-1">{item.label}</span>
                  )}
                  {sidebarOpen && active && <ChevronRight className="w-4 h-4" style={{ color: 'hsl(var(--gold))' }} />}
                </motion.div>
              </Link>
            );
          })}
        </nav>

        {/* Collapse toggle */}
        <div className="p-4 border-t border-white/10">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
          >
            {sidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            {sidebarOpen && <span className="text-xs font-cairo">قفل القائمة</span>}
          </button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Top Header */}
        <header className="h-16 flex items-center justify-between px-6 bg-white border-b border-border shadow-sm">
          <div>
            <h1 className="font-cairo font-bold text-lg" style={{ color: 'hsl(var(--navy))' }}>
              {navItems.find(n => n.path === location.pathname)?.label || 'شركة الماسه'}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-semibold font-cairo" style={{ color: 'hsl(var(--navy))' }}>
                {auth?.username ?? 'مستخدم'}
              </p>
              <p className="text-xs text-muted-foreground font-cairo">
                {admin ? 'Admin' : 'User'}
              </p>
            </div>
            <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm"
              style={{ background: 'var(--gradient-hero)', color: 'white' }}>
              {(auth?.username?.trim()?.[0] ?? 'م')}
            </div>
            <button
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border hover:bg-muted/40 transition-colors text-sm font-cairo"
              onClick={() => {
                clearAuth();
                navigate('/login', { replace: true });
              }}
              title="تسجيل الخروج"
            >
              <LogOut className="w-4 h-4" />
              خروج
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-6">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
}