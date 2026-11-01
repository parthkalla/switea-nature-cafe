import React, { useEffect, useState } from 'react';
import {
  Bell,
  Send,
  Users,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Clock,
  ExternalLink,
  MessageSquare,
  Gift,
  Flame,
  UserCheck,
  Search,
} from 'lucide-react';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { api } from '../../services/api';

interface CustomerOption {
  id: string;
  name: string;
  phone: string;
  totalOrders: number;
  totalSpent: number;
}

export const AdminNotifications: React.FC = () => {
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(true);
  const [history, setHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  // Form State
  const [targetType, setTargetType] = useState<'ALL' | 'SPECIFIC' | 'SUPER'>('ALL');
  const [selectedCustomerPhone, setSelectedCustomerPhone] = useState<string>('');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [url, setUrl] = useState('/community');
  const [sending, setSending] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Quick Templates
  const templates = [
    {
      title: 'Diwali Acoustic Balcony Night 🪔',
      message: 'Join us Nov 1 for live unplugged guitar, fairy lights, and complimentary desserts on orders above ₹399!',
      url: '/community',
    },
    {
      title: '🌟 RoastFuze Super Customer Perk',
      message: 'You have been awarded the Super Customer badge! Enjoy a complimentary beverage on your next visit.',
      url: '/community',
    },
    {
      title: '🍕 Sunset Pizza Hour: 20% Off',
      message: 'Use code DIWALIROAST to get 20% off all artisan stone-baked pizzas today!',
      url: '/menu',
    },
    {
      title: '🔔 Your Balcony Order is Ready!',
      message: 'Your food and beverage order has been plated fresh and is ready to be served.',
      url: '/order',
    },
  ];

  const fetchData = async () => {
    try {
      setLoadingCustomers(true);
      const custRes = await api.getAdminCustomers();
      setCustomers(custRes.customers || []);
    } catch (err) {
      console.error('Failed to load customers:', err);
    } finally {
      setLoadingCustomers(false);
    }

    try {
      setLoadingHistory(true);
      const histRes = await api.getAdminNotificationHistory();
      setHistory(histRes.history || []);
    } catch (err) {
      console.error('Failed to load history:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleApplyTemplate = (tmpl: { title: string; message: string; url: string }) => {
    setTitle(tmpl.title);
    setMessage(tmpl.message);
    setUrl(tmpl.url);
  };

  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) {
      setErrorMsg('Please enter both title and message.');
      return;
    }

    if (targetType === 'SPECIFIC' && !selectedCustomerPhone) {
      setErrorMsg('Please select a specific customer from the list.');
      return;
    }

    const recipient = customers.find((c) => c.phone === selectedCustomerPhone);

    try {
      setSending(true);
      setErrorMsg(null);
      setSuccessMsg(null);

      await api.sendCustomerNotification({
        target: targetType,
        phone: targetType === 'SPECIFIC' ? selectedCustomerPhone : undefined,
        recipientName: recipient ? recipient.name : undefined,
        title: title.trim(),
        message: message.trim(),
        url: url.trim() || '/community',
      });

      setSuccessMsg(
        targetType === 'ALL'
          ? 'Broadcast push notification sent to all connected cafe customers!'
          : targetType === 'SUPER'
          ? 'Exclusive perk notification sent to all Super Customers (VIP)!'
          : `Personalized notification dispatched to ${recipient?.name || selectedCustomerPhone}!`
      );

      // Trigger local browser alert if admin allowed
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(`[Sent] ${title}`, {
          body: message,
          icon: '/favicon.ico',
        });
      }

      // Refresh history
      const histRes = await api.getAdminNotificationHistory();
      setHistory(histRes.history || []);

      // Reset form
      setTitle('');
      setMessage('');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to send notification.');
    } finally {
      setSending(false);
    }
  };

  const superCustomers = customers.filter((c) => c.totalOrders >= 5 || c.totalSpent >= 500);

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-serif text-3xl font-bold text-stone-900 flex items-center gap-2.5">
              <Bell className="w-7 h-7 text-amber-700" />
              <span>Customer Push Notifications & Broadcasts</span>
            </h1>
            <p className="text-xs text-stone-500 mt-1">
              Send personalized live alerts, Diwali invitations, and exclusive perks to specific customers or all visitors.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-stone-600 font-semibold bg-white px-3.5 py-1.5 rounded-xl border border-stone-200 shadow-xs flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>{customers.length} Registered Customers</span>
            </span>
          </div>
        </div>

        {/* Alerts & Feedback */}
        {successMsg && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-emerald-900 text-sm animate-in fade-in">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3 text-rose-900 text-sm animate-in fade-in">
            <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Main 2-Column Composer */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left: Composer Form */}
          <div className="lg:col-span-7 bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-card space-y-6">
            <h2 className="font-serif text-lg font-bold text-stone-900 flex items-center gap-2">
              <Send className="w-4 h-4 text-nature-800" />
              <span>Compose Push Notification</span>
            </h2>

            {/* Target Audience Selector */}
            <div className="space-y-2">
              <label className="text-xs uppercase font-extrabold text-stone-500 tracking-wider block">
                Select Recipient Audience
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setTargetType('ALL')}
                  className={`p-3 rounded-2xl border text-center transition-all ${
                    targetType === 'ALL'
                      ? 'border-nature-950 bg-nature-900 text-white font-bold shadow-sm'
                      : 'border-stone-200 text-stone-600 hover:bg-stone-50'
                  }`}
                >
                  <span className="block text-xs font-bold">All Customers</span>
                  <span className="text-[10px] opacity-80 block mt-0.5">Global Broadcast</span>
                </button>

                <button
                  type="button"
                  onClick={() => setTargetType('SUPER')}
                  className={`p-3 rounded-2xl border text-center transition-all ${
                    targetType === 'SUPER'
                      ? 'border-amber-600 bg-amber-600 text-white font-bold shadow-sm'
                      : 'border-stone-200 text-stone-600 hover:bg-stone-50'
                  }`}
                >
                  <span className="block text-xs font-bold">Super Customers</span>
                  <span className="text-[10px] opacity-80 block mt-0.5">{superCustomers.length} VIP regulars</span>
                </button>

                <button
                  type="button"
                  onClick={() => setTargetType('SPECIFIC')}
                  className={`p-3 rounded-2xl border text-center transition-all ${
                    targetType === 'SPECIFIC'
                      ? 'border-nature-950 bg-nature-900 text-white font-bold shadow-sm'
                      : 'border-stone-200 text-stone-600 hover:bg-stone-50'
                  }`}
                >
                  <span className="block text-xs font-bold">Specific Customer</span>
                  <span className="text-[10px] opacity-80 block mt-0.5">By Name/Phone</span>
                </button>
              </div>
            </div>

            {/* Specific Customer Picker (If selected) */}
            {targetType === 'SPECIFIC' && (
              <div className="p-4 bg-cream-50 rounded-2xl border border-stone-200 space-y-2 animate-in fade-in">
                <label className="text-xs font-bold text-stone-700 block">
                  Select Specific Customer
                </label>
                {loadingCustomers ? (
                  <div className="text-xs text-stone-400">Loading customers...</div>
                ) : (
                  <select
                    value={selectedCustomerPhone}
                    onChange={(e) => setSelectedCustomerPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-xs font-medium bg-white focus:outline-none focus:ring-2 focus:ring-nature-800"
                  >
                    <option value="">-- Choose a customer --</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.phone}>
                        {c.name} ({c.phone}) • {c.totalOrders} Orders • ₹{c.totalSpent.toFixed(0)} spent
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )}

            {/* Quick Templates */}
            <div>
              <label className="text-[11px] uppercase font-extrabold text-stone-400 tracking-wider block mb-2">
                Quick Template Inspiration
              </label>
              <div className="flex flex-wrap gap-2">
                {templates.map((tmpl, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleApplyTemplate(tmpl)}
                    className="px-3 py-1.5 rounded-xl border border-stone-200 text-stone-700 hover:border-amber-400 hover:bg-amber-50/50 text-[11px] font-semibold transition-all"
                  >
                    {tmpl.title}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleSendNotification} className="space-y-4">
              <div>
                <label className="text-xs uppercase font-extrabold text-stone-600 tracking-wider block mb-1.5">
                  Notification Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Diwali Acoustic Night 🪔 / Free Brownie on Us!"
                  className="w-full px-4 py-3 rounded-xl border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-nature-800"
                />
              </div>

              <div>
                <label className="text-xs uppercase font-extrabold text-stone-600 tracking-wider block mb-1.5">
                  Notification Body Message
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={3}
                  placeholder="e.g. Namaste Parth! Join us tonight for live unplugged acoustic guitar on the balcony. Your coffee is on the house!"
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-nature-800"
                />
              </div>

              <div>
                <label className="text-xs uppercase font-extrabold text-stone-600 tracking-wider block mb-1.5">
                  Click Action Link (Where customer lands on tap)
                </label>
                <input
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="/community or /menu"
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-200 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-nature-800"
                />
              </div>

              <button
                type="submit"
                disabled={sending}
                className="w-full bg-nature-950 hover:bg-stone-900 text-white font-bold text-sm py-3.5 rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {sending ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Send className="w-4 h-4 text-amber-300" />
                )}
                <span>Dispatch Live Push Notification</span>
              </button>
            </form>
          </div>

          {/* Right: Notification Preview & Super Customers Highlight */}
          <div className="lg:col-span-5 space-y-6">
            {/* Live Preview Device Mock */}
            <div className="bg-gradient-to-br from-stone-900 to-stone-950 text-white rounded-3xl p-6 shadow-card border border-stone-800">
              <span className="text-[10px] uppercase font-bold tracking-widest text-amber-400 block mb-3">
                Live Customer Phone Preview
              </span>
              <div className="p-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-lg space-y-2">
                <div className="flex items-center justify-between text-[11px] text-stone-300">
                  <span className="font-semibold flex items-center gap-1.5 text-amber-300">
                    <Coffee className="w-3.5 h-3.5" />
                    <span>RoastFuze Coffee Bar</span>
                  </span>
                  <span>Just now</span>
                </div>
                <h4 className="font-bold text-sm text-white">
                  {title || 'Diwali Acoustic Balcony Night 🪔'}
                </h4>
                <p className="text-xs text-stone-300 leading-relaxed">
                  {message || 'Join us Nov 1 for live unplugged guitar, fairy lights, and complimentary desserts on orders above ₹399!'}
                </p>
                <div className="pt-2 flex items-center justify-between text-[10px] text-amber-400">
                  <span>Target: {targetType}</span>
                  <span>Tap to open {url || '/community'}</span>
                </div>
              </div>
            </div>

            {/* Super Customers VIP List */}
            <div className="bg-white rounded-3xl border border-stone-200 p-6 shadow-soft space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center font-bold">
                    <Sparkles className="w-4 h-4 text-amber-700" />
                  </div>
                  <div>
                    <h3 className="font-serif font-bold text-sm text-stone-900">
                      Super Customers (VIP Regulars)
                    </h3>
                    <p className="text-[11px] text-stone-500">
                      Top cafe patrons with repeat visits
                    </p>
                  </div>
                </div>
                <span className="text-xs font-extrabold text-amber-900 bg-amber-100 px-2.5 py-0.5 rounded-full">
                  {superCustomers.length} Regulars
                </span>
              </div>

              {superCustomers.length === 0 ? (
                <div className="text-xs text-stone-400 text-center py-4">
                  No customers with 5+ orders yet.
                </div>
              ) : (
                <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                  {superCustomers.map((sc) => (
                    <div
                      key={sc.id}
                      className="p-3 bg-cream-50 rounded-2xl border border-stone-200 flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-bold text-stone-900 block">{sc.name}</span>
                        <span className="text-[11px] text-stone-500 font-mono">{sc.phone}</span>
                      </div>
                      <div className="text-right">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-200 text-amber-900">
                          {sc.totalOrders} Visits
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setTargetType('SPECIFIC');
                            setSelectedCustomerPhone(sc.phone);
                            setTitle(`VIP Perk for ${sc.name}! 🌟`);
                            setMessage(`Hey ${sc.name}! Thank you for visiting RoastFuze ${sc.totalOrders} times. Your next artisan cappuccino is on the house!`);
                          }}
                          className="block text-[11px] text-nature-900 hover:underline font-bold mt-1"
                        >
                          Send Perk
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sent Notifications History Log */}
        <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-card space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-stone-100">
            <h3 className="font-serif font-bold text-lg text-stone-900 flex items-center gap-2">
              <Clock className="w-5 h-5 text-stone-600" />
              <span>Broadcast & Notification History</span>
            </h3>
            <span className="text-xs text-stone-500">
              {history.length} notifications logged
            </span>
          </div>

          {loadingHistory ? (
            <div className="py-6 text-center text-xs text-stone-400">Loading history...</div>
          ) : history.length === 0 ? (
            <div className="py-8 text-center text-xs text-stone-500">
              No notifications sent yet. Use the composer above to dispatch your first message!
            </div>
          ) : (
            <div className="divide-y divide-stone-100">
              {history.map((item) => (
                <div key={item.id} className="py-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-stone-900 text-sm">{item.title}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        item.target === 'ALL'
                          ? 'bg-blue-100 text-blue-800'
                          : item.target === 'SUPER'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {item.target === 'SPECIFIC' ? `Direct: ${item.recipientName || item.phone}` : item.target}
                      </span>
                    </div>
                    <p className="text-stone-600">{item.message}</p>
                    <span className="text-[10px] text-stone-400 block">
                      Target Link: {item.url || '/community'} • Sent by {item.sentBy || 'Admin'}
                    </span>
                  </div>

                  <span className="text-[11px] text-stone-400 whitespace-nowrap self-end sm:self-auto">
                    {new Date(item.timestamp).toLocaleString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

// Internal coffee icon component helper
const Coffee: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M17 8h1a4 4 0 1 1 0 8h-1" />
    <path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z" />
    <line x1="6" y1="2" x2="6" y2="4" />
    <line x1="10" y1="2" x2="10" y2="4" />
    <line x1="14" y1="2" x2="14" y2="4" />
  </svg>
);
