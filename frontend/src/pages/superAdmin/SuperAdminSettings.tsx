import React, { useEffect, useState } from 'react';
import {
  Settings,
  Shield,
  CreditCard,
  Database,
  CheckCircle2,
  AlertTriangle,
  Server,
  Lock,
  Mail,
  Save,
} from 'lucide-react';
import { SuperAdminLayout } from '../../components/layout/SuperAdminLayout';
import { api } from '../../services/api';

export const SuperAdminSettings: React.FC = () => {
  const [settings, setSettings] = useState<any>({
    platformName: 'Switea Restaurant Operating System',
    supportEmail: 'support@switea.com',
    defaultCurrency: 'INR',
    maintenanceMode: false,
    razorpayActive: true,
    razorpayMode: 'SANDBOX',
    allowNewRegistrations: true,
    defaultTrialDays: 14,
    analyticsRetentionDays: 90,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  useEffect(() => {
    async function loadSettings() {
      try {
        setLoading(true);
        const res = await api.getSuperAdminSettings();
        if (res.settings) {
          setSettings(res.settings);
        }
      } catch (err) {
        console.error('Failed to load settings:', err);
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      await api.updateSuperAdminSettings(settings);
      setSavedMessage('Platform configuration updated and written to audit log.');
      setTimeout(() => setSavedMessage(null), 3500);
    } catch (err) {
      alert('Failed to update platform settings.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SuperAdminLayout>
      <div className="max-w-4xl space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Platform Global Settings</h1>
          <p className="text-xs text-slate-500 mt-1">
            Configure system parameters, payment gateways, multi-tenant policies, and infrastructure health
          </p>
        </div>

        {savedMessage && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-emerald-900 text-sm animate-in fade-in">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <span>{savedMessage}</span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-6">
          {/* Platform General */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <Settings className="w-4 h-4 text-indigo-600" />
              <span>Platform Identity & Defaults</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Platform Name
                </label>
                <input
                  type="text"
                  value={settings.platformName}
                  onChange={(e) => setSettings({ ...settings, platformName: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Platform Support Email
                </label>
                <input
                  type="email"
                  value={settings.supportEmail}
                  onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Default Currency
                </label>
                <select
                  value={settings.defaultCurrency}
                  onChange={(e) => setSettings({ ...settings, defaultCurrency: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 bg-white"
                >
                  <option value="INR">INR (₹ - Indian Rupee)</option>
                  <option value="USD">USD ($ - US Dollar)</option>
                  <option value="EUR">EUR (€ - Euro)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Default SaaS Trial Period (Days)
                </label>
                <input
                  type="number"
                  min="0"
                  max="90"
                  value={settings.defaultTrialDays}
                  onChange={(e) => setSettings({ ...settings, defaultTrialDays: Number(e.target.value) })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600"
                />
              </div>
            </div>

            {/* Maintenance Mode Alert */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              <div>
                <span className="font-bold text-sm text-slate-800 block">System Maintenance Mode</span>
                <span className="text-xs text-slate-500">
                  Temporarily pause public ordering and display a maintenance notice
                </span>
              </div>
              <input
                type="checkbox"
                checked={settings.maintenanceMode}
                onChange={(e) => setSettings({ ...settings, maintenanceMode: e.target.checked })}
                className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Payment Gateway: Razorpay */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <CreditCard className="w-4 h-4 text-indigo-600" />
              <span>Razorpay Payments Gateway & Webhooks</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Gateway Integration Mode
                </label>
                <select
                  value={settings.razorpayMode}
                  onChange={(e) => setSettings({ ...settings, razorpayMode: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 bg-white"
                >
                  <option value="SANDBOX">Sandbox / Test Mode (rzp_test_...)</option>
                  <option value="PRODUCTION">Production Live Mode (rzp_live_...)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Online Payments Status
                </label>
                <div className="pt-2 flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="razorpayActive"
                    checked={settings.razorpayActive}
                    onChange={(e) => setSettings({ ...settings, razorpayActive: e.target.checked })}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <label htmlFor="razorpayActive" className="text-xs font-semibold text-slate-800">
                    Enable Razorpay Checkout (UPI, Cards, NetBanking)
                  </label>
                </div>
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
              <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">
                Server Webhook Endpoint
              </span>
              <code className="text-xs font-mono text-indigo-900 block break-all">
                https://api.switeanaturecafe.com/api/payments/webhook
              </code>
              <p className="text-[11px] text-slate-500">
                All order settlements are validated server-side via cryptographic HMAC SHA256 signatures.
              </p>
            </div>
          </div>

          {/* Database & Infrastructure */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <Database className="w-4 h-4 text-indigo-600" />
              <span>Database & Environment Configuration</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <span className="font-bold text-slate-700 block mb-1">Database Architecture</span>
                <span className="text-slate-600 block">Prisma ORM with 24 Models</span>
                <span className="text-[11px] text-emerald-700 font-semibold mt-1 inline-block">
                  ● PostgreSQL & SQLite Zero-Config Ready
                </span>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <span className="font-bold text-slate-700 block mb-1">WebSocket Server</span>
                <span className="text-slate-600 block">Socket.IO with Tenant Isolation</span>
                <span className="text-[11px] text-emerald-700 font-semibold mt-1 inline-block">
                  ● Realtime Live Order Streaming Active
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm px-6 py-3 rounded-xl shadow transition-colors disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving...' : 'Save Configuration'}</span>
            </button>
          </div>
        </form>
      </div>
    </SuperAdminLayout>
  );
};
