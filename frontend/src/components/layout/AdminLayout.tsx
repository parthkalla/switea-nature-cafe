import React, { useState, useEffect } from 'react';
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
  Plug,
  Bell,
  Sparkles,
  ArrowRight,
  Bike,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getSocket } from '../../services/socket';

interface AdminAlert {
  id: string;
  title: string;
  message: string;
  type: 'ORDER' | 'RIDER' | 'REVIEW';
  path: string;
  time: string;
}

export const AdminLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const cafeSlug = (user as any)?.memberships?.[0]?.restaurant?.slug || (user as any)?.restaurantSlug || 'roastfuze';
  const liveWebsiteUrl = (() => {
    const hostname = window.location.hostname.toLowerCase();
    if (hostname.includes('localhost') || hostname.includes('127.0.0.1')) {
      return '/';
    }
    if (hostname.endsWith('asrockstudios.in')) {
      return `https://${cafeSlug}.asrockstudios.in/`;
    }
    return '/';
  })();

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  const [activeAlert, setActiveAlert] = useState<AdminAlert | null>(null);

  const playChime = (type: 'ORDER' | 'RIDER' | 'REVIEW') => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'triangle';
      const freq = type === 'ORDER' ? 659.25 : type === 'RIDER' ? 523.25 : 783.99;
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.5, audioCtx.currentTime + 0.25);
      gain.gain.setValueAtTime(0.25, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.5);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.5);
    } catch {
      // AudioContext unavailable
    }
  };

  useEffect(() => {
    const socket = getSocket();
    const restaurantId = user?.restaurantId || 'roastfuze';
    socket.emit('join_restaurant', restaurantId);

    // 1. New Order Alert
    socket.on('new_order', (order: any) => {
      playChime('ORDER');
      const alertData: AdminAlert = {
        id: `ord-${Date.now()}`,
        title: `🔔 New Order #${order.orderNumber || ''}`,
        message: `${order.customerName || 'Guest'} placed an order • ₹${Number(order.totalAmount || 0).toFixed(2)}`,
        type: 'ORDER',
        path: '/admin/orders',
        time: 'Just Now',
      };
      setActiveAlert(alertData);

      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(alertData.title, {
          body: alertData.message,
          icon: '/favicon.ico',
        });
      }
    });

    // 2. Delivery Partner Assigned
    socket.on('delivery_partner_assigned', (payload: any) => {
      playChime('RIDER');
      const alertData: AdminAlert = {
        id: `rider-${Date.now()}`,
        title: `🛵 Delivery Partner Assigned`,
        message: payload.message || `Rider ${payload.riderName} assigned to #${payload.orderNumber}`,
        type: 'RIDER',
        path: '/admin/orders',
        time: 'Just Now',
      };
      setActiveAlert(alertData);

      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(alertData.title, {
          body: alertData.message,
          icon: '/favicon.ico',
        });
      }
    });

    // 3. New Review Submitted
    socket.on('new_review', (payload: any) => {
      playChime('REVIEW');
      const rev = payload.review || {};
      const alertData: AdminAlert = {
        id: `rev-${Date.now()}`,
        title: `⭐ New ${rev.rating || 5}-Star Customer Review!`,
        message: `${rev.customerName || 'Customer'}: "${rev.comment || 'Great experience!'}"`,
        type: 'REVIEW',
        path: '/admin/reviews',
        time: 'Just Now',
      };
      setActiveAlert(alertData);

      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(alertData.title, {
          body: alertData.message,
          icon: '/favicon.ico',
        });
      }
    });

    return () => {
      socket.off('new_order');
      socket.off('delivery_partner_assigned');
      socket.off('new_review');
    };
  }, [user]);

  const navItems = [
    { label: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    { label: 'Live Orders', path: '/admin/orders', icon: ShoppingBag },
    { label: 'Kitchen Display', path: '/admin/kitchen', icon: ChefHat },
    { label: 'Tables & QR Codes', path: '/admin/tables', icon: QrCode },
    { label: 'Menu Items', path: '/admin/menu', icon: UtensilsCrossed },
    { label: 'Categories', path: '/admin/categories', icon: FolderTree },
    { label: 'Item Modifiers', path: '/admin/modifiers', icon: Layers },
    { label: 'Customer CRM', path: '/admin/customers', icon: UserCheck },
    { label: 'Push Alerts & Broadcast', path: '/admin/notifications', icon: Bell },
    { label: 'Swiggy & Zomato', path: '/admin/marketplace', icon: Plug },
    { label: 'Offers & Discounts', path: '/admin/offers', icon: Percent },
    { label: 'Website Customizer', path: '/admin/customizer', icon: Palette },
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
          <div className="w-10 h-10 rounded-full bg-amber-900 flex items-center justify-center font-bold text-white font-serif">
            R
          </div>
          <div>
            <h1 className="font-serif text-lg font-bold text-white leading-tight">RoastFuze</h1>
            <span className="text-xs text-amber-400 font-medium tracking-wide">Balcony Cafe Admin</span>
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
              <p className="text-sm font-semibold text-white">{user?.name || 'RoastFuze Staff'}</p>
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
          <a
            href={liveWebsiteUrl === '/' ? '/menu' : `${liveWebsiteUrl}menu`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1.5 text-xs text-nature-300 hover:text-white bg-nature-900/80 py-2 rounded-lg transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Open Public Menu</span>
          </a>
        </div>
      </aside>

      {/* Mobile Drawer */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div className="fixed inset-0 bg-black/60" onClick={() => setSidebarOpen(false)} />
          <div className="relative w-72 bg-nature-950 text-white flex flex-col h-full z-10 p-4">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-nature-800">
              <span className="font-serif text-xl font-bold">RoastFuze Admin</span>
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
              RoastFuze Coffee Bar Management
            </span>
          </div>

          <div className="flex items-center gap-4">
            <a
              href={liveWebsiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-medium text-amber-900 hover:underline flex items-center gap-1"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Live Website</span>
            </a>
            <div className="h-4 w-px bg-stone-300" />
            <div className="text-right">
              <span className="text-xs text-stone-500 block leading-tight">Logged in as</span>
              <strong className="text-xs text-stone-800">{user?.email || 'owner@roastfuze.com'}</strong>
            </div>
          </div>
        </header>

        {/* Scrollable Page Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 relative">
          {/* Floating Real-Time Admin Notification Toast */}
          {activeAlert && (
            <div className="fixed top-20 right-4 sm:right-8 z-50 max-w-sm w-full bg-nature-950 text-white rounded-2xl p-4 shadow-2xl border border-amber-400/50 animate-in slide-in-from-top-4 fade-in duration-300">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-400/20 text-amber-300 flex items-center justify-center flex-shrink-0 mt-0.5">
                    {activeAlert.type === 'ORDER' ? (
                      <ShoppingBag className="w-4 h-4 text-amber-400" />
                    ) : activeAlert.type === 'RIDER' ? (
                      <Bike className="w-4 h-4 text-blue-400" />
                    ) : (
                      <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                    )}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                      <span>{activeAlert.title}</span>
                    </h4>
                    <p className="text-xs text-stone-300 mt-0.5 line-clamp-2">
                      {activeAlert.message}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveAlert(null)}
                  className="text-stone-400 hover:text-white p-1 rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="mt-3 pt-2.5 border-t border-nature-900 flex items-center justify-between text-xs">
                <span className="text-[10px] text-amber-400/80 font-bold uppercase tracking-wider">
                  Real-Time Live Alert
                </span>
                <Link
                  to={activeAlert.path}
                  onClick={() => setActiveAlert(null)}
                  className="inline-flex items-center gap-1 font-bold text-amber-400 hover:text-amber-300 hover:underline"
                >
                  <span>View Details</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          )}

          {children}
        </main>
      </div>
    </div>
  );
};
