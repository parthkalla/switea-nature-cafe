import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  Building2,
  Users,
  CreditCard,
  History,
  LogOut,
  ArrowLeft,
  BarChart3,
  Settings,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const SuperAdminLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/super-admin/login');
  };

  const navItems = [
    { label: 'Platform Overview', path: '/super-admin/dashboard', icon: ShieldCheck },
    { label: 'Restaurants Directory', path: '/super-admin/restaurants', icon: Building2 },
    { label: 'Platform Users', path: '/super-admin/users', icon: Users },
    { label: 'Subscription Plans', path: '/super-admin/plans', icon: CreditCard },
    { label: 'Platform Analytics', path: '/super-admin/analytics', icon: BarChart3 },
    { label: 'Security Audit Logs', path: '/super-admin/audit-logs', icon: History },
    { label: 'Global Settings', path: '/super-admin/settings', icon: Settings },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-stone-100 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-slate-200 border-r border-slate-800 flex flex-col flex-shrink-0">
        <div className="h-20 px-6 flex items-center gap-3 border-b border-slate-800">
          <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-bold text-white text-base leading-tight">Super Admin</h1>
            <span className="text-xs text-indigo-400 font-mono">Platform Console</span>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  active
                    ? 'bg-indigo-600 text-white font-semibold shadow'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800 space-y-2">
          <Link
            to="/admin/dashboard"
            className="flex items-center gap-2 text-xs text-slate-400 hover:text-white py-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Switch to Cafe Admin</span>
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 text-xs bg-red-950/60 text-red-200 py-2 rounded-lg hover:bg-red-900 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Logout Super Admin</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-stone-200 flex items-center justify-between px-6">
          <span className="font-semibold text-stone-800 text-sm">
            Switea Platform Super Administration
          </span>
          <span className="text-xs text-stone-500 font-mono">
            {user?.email} ({user?.role})
          </span>
        </header>

        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
};
