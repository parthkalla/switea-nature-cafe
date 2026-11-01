import React, { useEffect, useState } from 'react';
import {
  CheckCircle2,
  ExternalLink,
  Plug,
  RefreshCw,
  Store,
  Laptop,
  Check,
  Sparkles,
  Zap,
  ArrowRight,
  ShieldCheck,
  Radio,
} from 'lucide-react';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { api } from '../../services/api';

type Provider = 'SWIGGY' | 'ZOMATO';

export const AdminMarketplace: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Chrome Extension Sync Bridge state
  const [extensionInstalled, setExtensionInstalled] = useState(false);
  const [extensionPinged, setExtensionPinged] = useState(false);
  const [syncingTest, setSyncingTest] = useState<'SWIGGY' | 'ZOMATO' | null>(null);

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

  const handleSimulateOrder = async (source: 'ZOMATO' | 'SWIGGY') => {
    setSyncingTest(source);
    try {
      const token = localStorage.getItem('roastfuze_token') || '';
      const orderNum = Math.floor(1000 + Math.random() * 9000);
      const isZomato = source === 'ZOMATO';

      const orderPayload = {
        source,
        isDemo: true,
        externalOrderId: `TEST-${source}-${orderNum}`,
        orderNumber: `${isZomato ? 'ZM' : 'SW'}-${orderNum}`,
        customerName: isZomato ? 'Rohan Verma (Zomato Gold)' : 'Priya Sen (Swiggy One)',
        customerPhone: '+91 98290 88776',
        riderName: isZomato ? 'Deepak Valet' : 'Mukesh Rider',
        riderStatus: 'ASSIGNED_ON_WAY',
        items: isZomato ? [
          { itemName: 'Signature Hazelnut Cold Coffee', quantity: 2, unitPrice: 220, totalPrice: 440 },
          { itemName: 'Wood-fired Truffle Mushroom Pizza', quantity: 1, unitPrice: 450, totalPrice: 450 }
        ] : [
          { itemName: 'Oreo Overload Balcony Frappe', quantity: 2, unitPrice: 189, totalPrice: 378 },
          { itemName: 'Cheesy Garlic Bread', quantity: 1, unitPrice: 109, totalPrice: 109 }
        ],
        totalAmount: isZomato ? 890 : 487,
        subtotal: isZomato ? 890 : 487,
        notes: '[DEMO TEST ORDER] Sample online delivery order',
        restaurantSlug: getActiveSlug()
      };

      // Also dispatch to Chrome Extension if content script listening
      window.postMessage({ type: 'ROASTFUZE_TEST_ORDER', source }, '*');

      const res = await fetch('/api/integrations/extension/sync-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify(orderPayload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to simulate');
      setMessage(`⚡ Live Test ${source} Order #${data.orderNumber} successfully pushed to Kitchen KDS & Live Orders!`);
    } catch (err: any) {
      setMessage(`Sync error: ${err.message}`);
    } finally {
      setSyncingTest(null);
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
              Connect your delivery partner seller portals and manage all online & dine-in orders in one live kitchen queue.
            </p>
          </div>
          <button
            onClick={checkExtension}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-stone-200 text-xs font-bold text-stone-700 shadow-sm hover:bg-stone-50 transition-colors"
          >
            <RefreshCw className="w-4 h-4" /> Check Extension Status
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
                  Run Swiggy Partner & Zomato Merchant on your laptop browser. Our extension automatically syncs incoming orders into RoastFuze, tracks riders live, and pushes "Food Ready" back to Swiggy/Zomato without any monthly UrbanPiper or Petpooja fees.
                </p>
              </div>

              {/* Status Badge */}
              <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl flex items-center gap-3 flex-shrink-0">
                <div className={`w-3.5 h-3.5 rounded-full ${extensionInstalled ? 'bg-emerald-400 shadow-lg shadow-emerald-500/50' : 'bg-amber-400 animate-ping'}`} />
                <div>
                  <div className="text-[11px] uppercase tracking-wider font-bold text-slate-400">Sync Bridge Status</div>
                  <div className="text-xs font-bold text-white">
                    {extensionInstalled ? '🟢 Extension Active & Connected' : '🟠 Waiting for Extension Tab'}
                  </div>
                </div>
              </div>
            </div>

            {/* Actions Grid: 4 Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Card 1: Setup / State */}
              {extensionInstalled ? (
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
                      Listening for Swiggy & Zomato tabs in browser
                    </p>
                  </div>
                </div>
              ) : (
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

              {/* Card 2: Test Swiggy Order Button */}
              <button
                type="button"
                onClick={() => handleSimulateOrder('SWIGGY')}
                disabled={syncingTest !== null}
                className="bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white p-4 rounded-2xl font-bold text-xs flex flex-col justify-between gap-3 shadow-lg shadow-orange-950/40 transition-all cursor-pointer text-left disabled:opacity-50"
              >
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 rounded-xl bg-white/20 text-white flex items-center justify-center font-bold">
                    S
                  </div>
                  <span className="text-[10px] uppercase font-bold text-white bg-white/20 px-2 py-0.5 rounded-full">
                    {syncingTest === 'SWIGGY' ? 'Pushing...' : 'Test Kitchen'}
                  </span>
                </div>
                <div>
                  <div className="text-sm font-bold text-white">⚡ Send Test Swiggy Order</div>
                  <p className="text-[11px] text-orange-100/90 font-normal mt-0.5">Injects live Swiggy One order into KDS (Tagged Demo)</p>
                </div>
              </button>

              {/* Card 3: Test Zomato Order Button */}
              <button
                type="button"
                onClick={() => handleSimulateOrder('ZOMATO')}
                disabled={syncingTest !== null}
                className="bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white p-4 rounded-2xl font-bold text-xs flex flex-col justify-between gap-3 shadow-lg shadow-rose-950/40 transition-all cursor-pointer text-left disabled:opacity-50"
              >
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 rounded-xl bg-white/20 text-white flex items-center justify-center font-bold">
                    Z
                  </div>
                  <span className="text-[10px] uppercase font-bold text-white bg-white/20 px-2 py-0.5 rounded-full">
                    {syncingTest === 'ZOMATO' ? 'Pushing...' : 'Test Kitchen'}
                  </span>
                </div>
                <div>
                  <div className="text-sm font-bold text-white">⚡ Send Test Zomato Order</div>
                  <p className="text-[11px] text-rose-100/90 font-normal mt-0.5">Injects live Zomato Gold order into KDS (Tagged Demo)</p>
                </div>
              </button>

              {/* Card 4: Open Orders Queue */}
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
                  <p className="text-[11px] text-slate-400 font-normal mt-0.5">Manage incoming marketplace orders & kitchen tables</p>
                </div>
              </a>
            </div>

            {/* User Instructions */}
            <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800/80 text-xs text-slate-300">
              <div className="flex items-center gap-2 text-white font-bold mb-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>{extensionInstalled ? 'Sync Bridge is Ready & Active' : 'How the Free Direct Sync Works:'}</span>
              </div>
              <p className="text-[12px] text-slate-300 leading-relaxed">
                {extensionInstalled
                  ? 'Your Chrome extension is connected! Just open partner.swiggy.com or restaurant.zomato.com in another tab on this laptop. Incoming orders will automatically flow into RoastFuze kitchen, and marking "Food Ready" on KDS will push back to Swiggy/Zomato.'
                  : 'Click "⚡ Install Sync Bridge (Auto)" and open the downloaded installer once. It automatically configures Chrome and adds a "RoastFuze POS with Sync" shortcut to your desktop.'}
              </p>
            </div>
          </div>
        </div>

        {/* Swiggy & Zomato Live Status Cards */}
        <div className="grid md:grid-cols-2 gap-5">
          {/* Swiggy Card */}
          <div className="bg-white rounded-3xl border border-stone-200 shadow-soft p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center font-black text-xl bg-orange-100 text-orange-600">
                  S
                </div>
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${extensionInstalled ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-stone-100 text-stone-600'}`}>
                  {extensionInstalled ? 'EXTENSION LISTENING' : 'READY TO SYNC'}
                </span>
              </div>
              <h2 className="font-serif text-xl font-bold text-stone-900 mt-5">Swiggy Partner</h2>
              <p className="text-xs text-stone-500 mt-1">
                Real-time bi-directional order sync, rider assignment tracking & KDS "Food Ready" dispatch via Chrome extension.
              </p>
              <div className="mt-4 bg-stone-50 rounded-2xl p-3 text-xs text-stone-600 space-y-1">
                <p><strong>Integration Mode:</strong> Chrome Extension Sync Bridge (0% fee)</p>
                <p><strong>Seller URL:</strong> partner.swiggy.com</p>
              </div>
            </div>
            <div className="mt-6 flex items-center gap-3">
              <a
                href="https://partner.swiggy.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold py-3 rounded-xl flex items-center justify-center gap-1.5 transition-colors"
              >
                <span>Open Swiggy Partner</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <button
                type="button"
                onClick={() => handleSimulateOrder('SWIGGY')}
                disabled={syncingTest !== null}
                className="px-4 py-3 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold rounded-xl transition-colors disabled:opacity-50"
              >
                Test Swiggy
              </button>
            </div>
          </div>

          {/* Zomato Card */}
          <div className="bg-white rounded-3xl border border-stone-200 shadow-soft p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center font-black text-xl bg-red-100 text-red-600">
                  Z
                </div>
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${extensionInstalled ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-stone-100 text-stone-600'}`}>
                  {extensionInstalled ? 'EXTENSION LISTENING' : 'READY TO SYNC'}
                </span>
              </div>
              <h2 className="font-serif text-xl font-bold text-stone-900 mt-5">Zomato Merchant</h2>
              <p className="text-xs text-stone-500 mt-1">
                Real-time bi-directional order sync, rider assignment tracking & KDS "Food Ready" dispatch via Chrome extension.
              </p>
              <div className="mt-4 bg-stone-50 rounded-2xl p-3 text-xs text-stone-600 space-y-1">
                <p><strong>Integration Mode:</strong> Chrome Extension Sync Bridge (0% fee)</p>
                <p><strong>Seller URL:</strong> restaurant.zomato.com</p>
              </div>
            </div>
            <div className="mt-6 flex items-center gap-3">
              <a
                href="https://restaurant.zomato.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 bg-red-600 hover:bg-red-700 text-white text-xs font-bold py-3 rounded-xl flex items-center justify-center gap-1.5 transition-colors"
              >
                <span>Open Zomato Merchant</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <button
                type="button"
                onClick={() => handleSimulateOrder('ZOMATO')}
                disabled={syncingTest !== null}
                className="px-4 py-3 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold rounded-xl transition-colors disabled:opacity-50"
              >
                Test Zomato
              </button>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};
