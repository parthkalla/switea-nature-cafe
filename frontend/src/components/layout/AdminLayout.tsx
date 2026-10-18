import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  UtensilsCrossed,
  FolderTree,
  QrCode,
  ShoppingBag,
  ChefHat,
  Percent,
  Palette,
  Image as ImageIcon,
  Users,
  Store,
  BarChart3,
  LogOut,
  Menu,
  X,
  ExternalLink,
  Star,
  Layers,
  UserCheck,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const AdminLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  const navItems = [
    { label: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    { label: 'Live Orders', path: '/admin/orders', icon: ShoppingBag },
    { label: 'Kitchen Display', path: '/admin/kitchen', icon: ChefHat },
    { label: 'Tables & QR Codes', path: '/admin/tables', icon: QrCode },
    { label: 'Menu Items', path: '/admin/menu', icon: UtensilsCrossed },
    { label: 'Categories', path: '/admin/categories', icon: FolderTree },
    { label: 'Item Modifiers', path: '/admin/modifiers', icon: Layers },
    { label: 'Customer CRM', path: '/admin/customers', icon: UserCheck },
    { label: 'Offers & Discounts', path: '/admin/offers', icon: Percent },
    { label: 'Landing Page Editor', path: '/admin/branding', icon: Palette },
    { label: 'Gallery Manager', path: '/admin/gallery', icon: ImageIcon },
    { label: 'Reviews', path: '/admin/reviews', icon: Star },
    { label: 'Staff & Team', path: '/admin/team', icon: Users },
    { label: 'Cafe Profile', path: '/admin/profile', icon: Store },
    { label: 'Sales & Analytics', path: '/admin/analytics', icon: BarChart3 },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-stone-100 flex">
      {/* Sidebar for Desktop */}
      <aside className="hidden lg:flex flex-col w-64 bg-nature-950 text-cream-200 border-r border-nature-900 flex-shrink-0">
        <div className="h-20 px-6 flex items-center gap-3 border-b border-nature-900">
          <div className="w-10 h-10 rounded-full bg-nature-800 flex items-center justify-center font-bold text-white font-serif">
            S
          </div>
          <div>
            <h1 className="font-serif text-lg font-bold text-white leading-tight">Switea Cafe</h1>
            <span className="text-xs text-nature-400 font-medium tracking-wide">Restaurant Admin</span>
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
                    ? 'bg-nature-800 text-white font-semibold shadow-sm'
                    : 'text-stone-300 hover:bg-nature-900 hover:text-white'
                }`}
              >
                <Icon className={`w-4 h-4 ${active ? 'text-nature-300' : 'text-stone-400'}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User profile & exit footer */}
        <div className="p-4 border-t border-nature-900 bg-nature-950/60">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm font-semibold text-white">{user?.name || 'Switea Staff'}</p>
              <span className="text-xs bg-nature-800 text-nature-300 px-2 py-0.5 rounded-full font-medium">
                {user?.role || 'STAFF'}
              </span>
            </div>
            <button
              onClick={handleLogout}
              title="Logout"
              className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-nature-900"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
          <Link
            to="/menu"
            target="_blank"
            className="flex items-center justify-center gap-1.5 text-xs text-nature-300 hover:text-white bg-nature-900/80 py-2 rounded-lg transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Open Public Menu</span>
          </Link>
        </div>
      </aside>

      {/* Mobile Drawer */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div className="fixed inset-0 bg-black/60" onClick={() => setSidebarOpen(false)} />
          <div className="relative w-72 bg-nature-950 text-white flex flex-col h-full z-10 p-4">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-nature-800">
              <span className="font-serif text-xl font-bold">Switea Admin</span>
              <button onClick={() => setSidebarOpen(false)} className="p-1 text-stone-400 hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>
            <nav className="flex-1 space-y-1 overflow-y-auto">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setSidebarOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-stone-200 hover:bg-nature-800"
                  >
                    <Icon className="w-4 h-4 text-nature-300" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
            <button
              onClick={handleLogout}
              className="mt-4 flex items-center gap-2 text-sm text-red-300 py-2"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-stone-200 flex items-center justify-between px-4 sm:px-6 z-10 shadow-sm">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg text-stone-600 hover:bg-stone-100"
            >
              <Menu className="w-6 h-6" />
            </button>
            <span className="font-semibold text-stone-800 text-sm hidden sm:inline">
              Switea Nature Cafe Management
            </span>
          </div>

          <div className="flex items-center gap-4">
            <Link
              to="/"
              target="_blank"
              className="text-xs font-medium text-nature-800 hover:underline flex items-center gap-1"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Live Website</span>
            </Link>
            <div className="h-4 w-px bg-stone-300" />
            <div className="text-right">
              <span className="text-xs text-stone-500 block leading-tight">Logged in as</span>
              <strong className="text-xs text-stone-800">{user?.email || 'admin@switea.com'}</strong>
            </div>
          </div>
        </header>

        {/* Scrollable Page Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
};
