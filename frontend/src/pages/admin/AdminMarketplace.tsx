import React, { useEffect, useState } from 'react';
import {
  CheckCircle2,
  ExternalLink,
  Plug,
  RefreshCw,
  Store,
  Webhook,
  Download,
  Laptop,
  Check,
  AlertCircle,
  Sparkles,
  Zap,
  ArrowRight,
  ShieldCheck,
  Radio,
  FileCode,
} from 'lucide-react';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { api } from '../../services/api';

type Provider = 'SWIGGY' | 'ZOMATO';
type Connection = {
  provider: Provider;
  status: string;
  restaurantHandle?: string;
  externalRestaurantId?: string;
  statusUrl?: string;
  updatedAt?: string;
};

const demoOrders = [
  { provider: 'SWIGGY', id: 'SWG-78421', customer: 'Rahul Sharma', items: '2 × Cold Coffee, 1 × Paneer Tikka Sandwich', amount: 468, status: 'PREPARING', color: 'orange' },
  { provider: 'ZOMATO', id: 'ZOM-55208', customer: 'Ananya Mehta', items: '1 × Farmhouse Pizza, 2 × Masala Chai', amount: 612, status: 'PENDING', color: 'red' },
];

export const AdminMarketplace: React.FC = () => {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<Provider | null>(null);
  const [message, setMessage] = useState('');
  const [liveProvider, setLiveProvider] = useState<Provider>('SWIGGY');
  const [liveConfig, setLiveConfig] = useState({ restaurantHandle: '', externalRestaurantId: '', apiToken: '', webhookSecret: '', statusUrl: '' });

  // Chrome Extension Sync Bridge state
  const [extensionInstalled, setExtensionInstalled] = useState(false);
  const [extensionPinged, setExtensionPinged] = useState(false);
  const [syncingTest, setSyncingTest] = useState(false);

  const checkExtension = () => {
    // 1. Check DOM marker injected by content script
    const hasAttr = document.documentElement.getAttribute('data-roastfuze-extension-installed') === 'true';
    if (hasAttr) {
      setExtensionInstalled(true);
    }

    // 2. Ping extension via window postMessage
    window.postMessage({ type: 'ROASTFUZE_PING' }, '*');
  };

  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (e.data?.type === 'ROASTFUZE_EXTENSION_READY' || e.data?.type === 'ROASTFUZE_PONG') {
        setExtensionInstalled(true);
        setExtensionPinged(true);
      }
      if (e.data?.type === 'ROASTFUZE_HANDSHAKE_ACK') {
        setMessage('✅ Chrome Extension successfully synchronized with this restaurant portal!');
      }
    };

    window.addEventListener('message', handleMessage);
    checkExtension();
    const interval = setInterval(checkExtension, 3000);

    return () => {
      window.removeEventListener('message', handleMessage);
      clearInterval(interval);
    };
  }, []);

  const getActiveSlug = () => {
    const host = window.location.hostname.toLowerCase();
    if (host.includes('localhost') || host.includes('127.0.0.1')) return 'roastfuze';
    const parts = host.split('.');
    return (parts.length > 2 && parts[0] !== 'admin' && parts[0] !== 'www') ? parts[0] : 'roastfuze';
  };

  const triggerHandshake = () => {
    const token = localStorage.getItem('roastfuze_token') || '';
    const restaurantId = localStorage.getItem('roastfuze_restaurant_id') || '281f2b53-a69a-4bb3-a390-b28b9053ef7e';
    window.postMessage({
      type: 'ROASTFUZE_HANDSHAKE_INIT',
      restaurantId,
      token,
      restaurantSlug: getActiveSlug(),
      apiUrl: window.location.origin + '/api'
    }, '*');
    setMessage('Initiated handshake with Chrome Extension...');
  };

  const handleSimulateOrder = async (source: 'ZOMATO' | 'SWIGGY') => {
    setSyncingTest(true);
    try {
      // Direct API simulation or via postMessage
      window.postMessage({ type: 'ROASTFUZE_TEST_ORDER', source }, '*');

      const res = await fetch('/api/integrations/extension/sync-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source,
          customerName: source === 'ZOMATO' ? 'Rohan Verma (Zomato Gold)' : 'Priya Sen (Swiggy One)',
          customerPhone: '+91 98290 88776',
          riderName: source === 'ZOMATO' ? 'Deepak Valet' : 'Mukesh Rider',
          riderStatus: 'ASSIGNED_ON_WAY',
          items: [
            { name: 'Signature Hazelnut Cold Coffee', quantity: 2, price: 220 },
            { name: 'Wood-fired Truffle Mushroom Pizza', quantity: 1, price: 450 }
          ],
          totalAmount: 890,
          subtotal: 890,
          restaurantSlug: getActiveSlug()
        })
      });
      const data = await res.json();
      setMessage(`🎉 Test ${source} Order #${data.orderNumber || '101'} pushed to Kitchen KDS & Live Orders!`);
    } catch (err: any) {
      setMessage(`Sync error: ${err.message}`);
    } finally {
      setSyncingTest(false);
    }
  };

  const load = async () => {
    try {
      setConnections((await api.getMarketplaceConnections()).connections || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const connectionFor = (provider: Provider) => connections.find((item) => item.provider === provider);

  const connectDemo = async (provider: Provider) => {
    try {
      setSaving(provider);
      await api.saveMarketplaceConnection(provider, {
        status: 'DEMO',
        restaurantHandle: 'RoastFuze Coffee Bar',
        externalRestaurantId: provider === 'SWIGGY' ? 'swiggy-demo' : 'zomato-demo'
      });
      setMessage(`${provider} demo connection enabled. Sample orders are now visible below.`);
      await load();
    } catch (error: any) {
      setMessage(error.message || 'Could not connect demo.');
    } finally {
      setSaving(null);
    }
  };

  const saveLive = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      setSaving(liveProvider);
      await api.saveMarketplaceConnection(liveProvider, { ...liveConfig, status: 'CONNECTED' });
      setMessage(`${liveProvider} connection details saved. Webhook/status sync is ready.`);
      await load();
      setLiveConfig({ restaurantHandle: '', externalRestaurantId: '', apiToken: '', webhookSecret: '', statusUrl: '' });
    } catch (error: any) {
      setMessage(error.message || 'Could not save live connection.');
    } finally {
      setSaving(null);
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-orange-100 to-amber-100 text-orange-950 text-xs font-bold border border-orange-200">
              <Plug className="w-3.5 h-3.5 text-orange-600" /> Marketplace Hub & Sync Engine
            </div>
            <h1 className="font-serif text-3xl font-bold text-stone-900 mt-3">Swiggy & Zomato Integrations</h1>
            <p className="text-sm text-stone-500 mt-1">
              Connect your delivery partner accounts and manage all online & dine-in orders in one kitchen queue.
            </p>
          </div>
          <button
            onClick={load}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-stone-200 text-xs font-bold text-stone-700 shadow-sm hover:bg-stone-50 transition-colors"
          >
            <RefreshCw className="w-4 h-4" /> Refresh connections
          </button>
        </div>

        {message && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl px-5 py-3 text-sm font-semibold flex items-center justify-between">
            <span>{message}</span>
            <button onClick={() => setMessage('')} className="text-emerald-700 font-bold text-xs underline">Dismiss</button>
          </div>
        )}

        {/* 100% Free Chrome Extension Sync Bridge Banner */}
        <div className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 border border-indigo-900/50 shadow-2xl">
          <div className="relative z-10 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-indigo-900/60 pb-6">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-bold">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  100% Free Direct Sync • Zero Middleman Fee
                </div>
                <h2 className="text-xl sm:text-2xl font-serif font-bold text-white mt-2">
                  RoastFuze Sync Bridge — Chrome Extension
                </h2>
                <p className="text-xs sm:text-sm text-slate-300 max-w-2xl">
                  Run Swiggy Partner & Zomato Merchant on your laptop browser. Our extension automatically syncs incoming orders into RoastFuze, tracks riders live, and pushes "Food Ready" back to Swiggy/Zomato.
                </p>
              </div>

              {/* Status Badge */}
              <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl flex items-center gap-3 flex-shrink-0">
                <div className={`w-3.5 h-3.5 rounded-full ${extensionInstalled ? 'bg-emerald-400 shadow-lg shadow-emerald-500/50' : 'bg-amber-400 animate-ping'}`} />
                <div>
                  <div className="text-[11px] uppercase tracking-wider font-bold text-slate-400">Sync Bridge Status</div>
                  <div className="text-xs font-bold text-white">
                    {extensionInstalled ? '🟢 Extension Active & Connected' : '🟠 Not Detected in This Tab'}
                  </div>
                </div>
              </div>
            </div>

            {/* Actions Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {extensionInstalled ? (
                /* Connected State Card */
                <div className="bg-emerald-950/40 border border-emerald-500/40 text-white p-4 rounded-2xl flex flex-col justify-between gap-3 shadow-lg shadow-emerald-950/50">
                  <div className="flex items-center justify-between">
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                      <Check className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] uppercase font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                      Live & Paired
                    </span>
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white flex items-center gap-1.5">
                      <span>Sync Bridge Active</span>
                    </div>
                    <p className="text-[11px] text-emerald-300/80 font-normal mt-0.5">
                      Listening for Swiggy & Zomato tabs in this browser
                    </p>
                  </div>
                </div>
              ) : (
                /* Not installed yet */
                <a
                  href="/install-roastfuze-bridge.cmd"
                  download="install-roastfuze-bridge.cmd"
                  className="bg-indigo-600 hover:bg-indigo-500 text-white p-4 rounded-2xl font-bold text-xs flex flex-col justify-between gap-3 shadow-lg shadow-indigo-600/30 transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between">
                    <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
                      <Zap className="w-4 h-4 text-white group-hover:scale-110 transition-transform" />
                    </div>
                    <span className="text-[10px] uppercase font-bold text-emerald-300 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-500/30">1-Click Auto Install</span>
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white">⚡ Install Sync Bridge (Auto)</div>
                    <p className="text-[11px] text-indigo-200/80 font-normal mt-0.5">Click to run: installs extension & creates Desktop icon</p>
                  </div>
                </a>
              )}

              {/* Live Test Button */}
              <button
                type="button"
                onClick={() => handleSimulateOrder('ZOMATO')}
                disabled={syncingTest}
                className="bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white p-4 rounded-2xl font-bold text-xs flex flex-col justify-between gap-3 shadow-lg shadow-rose-900/40 transition-all cursor-pointer text-left disabled:opacity-50"
              >
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 rounded-xl bg-white/20 text-white flex items-center justify-center">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] uppercase font-bold text-white bg-white/20 px-2 py-0.5 rounded-full">
                    {syncingTest ? 'Pushing...' : 'Test Kitchen'}
                  </span>
                </div>
                <div>
                  <div className="text-sm font-bold text-white">⚡ Send Test Zomato Order</div>
                  <p className="text-[11px] text-rose-100/90 font-normal mt-0.5">Instantly injects an order into Kitchen KDS & Live Orders</p>
                </div>
              </button>

              {/* Open Orders Queue */}
              <a
                href="/admin/orders"
                className="bg-slate-900 hover:bg-slate-800 border border-slate-700 text-white p-4 rounded-2xl font-bold text-xs flex flex-col justify-between gap-3 transition-colors text-left"
              >
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                    <Store className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">View Queue</span>
                </div>
                <div>
                  <div className="text-sm font-bold text-white">Open Live Orders Queue</div>
                  <p className="text-[11px] text-slate-400 font-normal mt-0.5">Manage incoming marketplace orders & tables</p>
                </div>
              </a>
            </div>

            {/* Simple User Instructions */}
            <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800/80 text-xs text-slate-300">
              <div className="flex items-center gap-2 text-white font-bold mb-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>{extensionInstalled ? 'Sync Bridge is Ready & Active' : 'Zero-Fuss Setup (No ZIP, No Developer Mode):'}</span>
              </div>
              <p className="text-[12px] text-slate-300 leading-relaxed">
                {extensionInstalled
                  ? 'Your Chrome extension is connected! Just open partner.swiggy.com or restaurant.zomato.com in another tab on this laptop. Incoming orders will automatically flow into RoastFuze kitchen, and marking "Food Ready" will sync back to Swiggy/Zomato.'
                  : 'Click "⚡ Install Sync Bridge (Auto)" and open the downloaded installer once. It automatically configures Chrome and adds a "RoastFuze POS with Sync" shortcut to your desktop.'}
              </p>
            </div>
          </div>
        </div>

        {/* Existing Provider Status Cards */}
        <div className="grid md:grid-cols-2 gap-5">
          {(['SWIGGY', 'ZOMATO'] as Provider[]).map((provider) => {
            const connection = connectionFor(provider);
            const isSwiggy = provider === 'SWIGGY';
            return (
              <div key={provider} className="bg-white rounded-3xl border border-stone-200 shadow-soft p-6">
                <div className="flex items-start justify-between">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-xl ${isSwiggy ? 'bg-orange-100 text-orange-600' : 'bg-red-100 text-red-600'}`}>
                    {isSwiggy ? 'S' : 'Z'}
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${connection?.status === 'CONNECTED' ? 'bg-emerald-100 text-emerald-800' : connection?.status === 'DEMO' ? 'bg-blue-100 text-blue-800' : 'bg-stone-100 text-stone-500'}`}>
                    {connection?.status || 'NOT CONNECTED'}
                  </span>
                </div>
                <h2 className="font-serif text-xl font-bold text-stone-900 mt-5">{provider}</h2>
                <p className="text-xs text-stone-500 mt-1">
                  Orders, menu identity and status sync for your {provider.toLowerCase()} seller account.
                </p>
                {connection && (
                  <div className="mt-4 bg-stone-50 rounded-2xl p-3 text-xs text-stone-600">
                    <p><strong>Outlet:</strong> {connection.restaurantHandle}</p>
                    <p className="mt-1"><strong>Restaurant ID:</strong> {connection.externalRestaurantId}</p>
                  </div>
                )}
                <button
                  onClick={() => connectDemo(provider)}
                  disabled={saving === provider || loading}
                  className={`w-full mt-5 py-3 rounded-xl text-xs font-bold text-white disabled:opacity-60 ${isSwiggy ? 'bg-orange-600 hover:bg-orange-700' : 'bg-red-600 hover:bg-red-700'}`}
                >
                  {saving === provider ? 'Connecting...' : connection?.status === 'DEMO' ? 'Reconnect Demo' : 'Connect Demo Account'}
                </button>
              </div>
            );
          })}
        </div>

        {/* Live Webhook / Direct Form */}
        <form onSubmit={saveLive} className="bg-white rounded-3xl border border-stone-200 shadow-soft p-6">
          <div className="flex items-start justify-between gap-4 mb-5">
            <div>
              <h2 className="font-serif text-xl font-bold text-stone-900">Direct API Webhook Configuration (Optional)</h2>
              <p className="text-xs text-stone-500 mt-1">If you receive official enterprise API keys from Swiggy/Zomato BD team, enter them here.</p>
            </div>
            <select
              value={liveProvider}
              onChange={(e) => setLiveProvider(e.target.value as Provider)}
              className="px-3 py-2 rounded-xl border border-stone-200 text-xs font-bold"
            >
              <option value="SWIGGY">Swiggy</option>
              <option value="ZOMATO">Zomato</option>
            </select>
          </div>
          <div className="grid md:grid-cols-2 gap-3">
            {([
              ['restaurantHandle', 'Outlet / account name'],
              ['externalRestaurantId', 'Platform restaurant ID'],
              ['apiToken', 'API token'],
              ['webhookSecret', 'Webhook secret'],
              ['statusUrl', 'Status API URL']
            ] as const).map(([key, label]) => (
              <label key={key} className="text-[11px] font-bold text-stone-600">
                {label}
                <input
                  type={key === 'apiToken' || key === 'webhookSecret' ? 'password' : 'text'}
                  value={liveConfig[key]}
                  onChange={(e) => setLiveConfig((prev) => ({ ...prev, [key]: e.target.value }))}
                  placeholder={label}
                  className="w-full mt-1 px-3 py-2.5 rounded-xl border border-stone-200 text-sm font-normal focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  required={key === 'restaurantHandle' || key === 'externalRestaurantId'}
                />
              </label>
            ))}
          </div>
          <button
            type="submit"
            disabled={saving !== null}
            className="mt-5 inline-flex items-center gap-2 bg-stone-900 hover:bg-stone-800 text-white px-5 py-3 rounded-xl text-xs font-bold disabled:opacity-60 shadow-md"
          >
            {saving === liveProvider ? 'Saving...' : 'Save live connection'}
          </button>
        </form>

        {/* Demo Orders */}
        <div className="bg-white rounded-3xl border border-stone-200 shadow-soft overflow-hidden">
          <div className="p-6 border-b border-stone-100 flex items-center justify-between">
            <div>
              <h2 className="font-serif text-xl font-bold text-stone-900">Demo marketplace orders</h2>
              <p className="text-xs text-stone-500 mt-1">Preview of how incoming orders appear in Admin → Live Orders.</p>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-blue-100 text-blue-800 text-[10px] font-bold">DEMO DATA</span>
          </div>
          <div className="divide-y divide-stone-100">
            {demoOrders.map((order) => (
              <div key={order.id} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${order.color === 'orange' ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'}`}>
                    {order.provider[0]}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <strong className="text-sm text-stone-900">#{order.id}</strong>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-stone-100 text-stone-600">{order.provider}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">{order.status}</span>
                    </div>
                    <p className="text-xs text-stone-700 mt-1">{order.customer}</p>
                    <p className="text-xs text-stone-500 mt-1">{order.items}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-serif text-lg font-bold text-stone-900">₹{order.amount}</p>
                  <a href="/admin/orders" className="text-xs font-bold text-indigo-600 hover:underline mt-1 inline-block">Open Live Orders →</a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};
