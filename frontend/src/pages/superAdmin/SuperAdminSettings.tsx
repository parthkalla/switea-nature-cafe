import React, { useEffect, useState } from 'react';
import {
  Settings,
  Database,
  CheckCircle2,
  Save,
} from 'lucide-react';
import { SuperAdminLayout } from '../../components/layout/SuperAdminLayout';
import { api } from '../../services/api';

export const SuperAdminSettings: React.FC = () => {
  const [settings, setSettings] = useState<any>({
    platformName: 'ASRock Studios Restaurant Operating System',
    supportEmail: 'support@asrockstudios.in',
    defaultCurrency: 'INR',
    maintenanceMode: false,
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
      const res = await api.updateSuperAdminSettings(settings);
      if (res.settings) {
        setSettings(res.settings);
      }
      setSavedMessage('Platform configuration updated and saved successfully.');
      setTimeout(() => setSavedMessage(null), 3500);
    } catch (err: any) {
      alert(`Failed to update platform settings: ${err.message || 'Server error'}`);
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
            Configure ASRock Studios system parameters, multi-tenant policies, and infrastructure health
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
                  value={settings.platformName || ''}
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
                  value={settings.supportEmail || ''}
                  onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Default Currency
                </label>
                <select
                  value={settings.defaultCurrency || 'INR'}
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
                  value={settings.defaultTrialDays ?? 14}
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
                checked={Boolean(settings.maintenanceMode)}
                onChange={(e) => setSettings({ ...settings, maintenanceMode: e.target.checked })}
                className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Database & Infrastructure */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <Database className="w-4 h-4 text-indigo-600" />
              <span>Database & Multi-Tenant Infrastructure</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <span className="font-bold text-slate-700 block mb-1">Architecture</span>
                <span className="text-slate-600 block">ASRock Studios Multi-Tenant Engine</span>
                <span className="text-[11px] text-emerald-700 font-semibold mt-1 inline-block">
                  ● MariaDB / MySQL Enterprise Ready
                </span>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <span className="font-bold text-slate-700 block mb-1">Real-Time Sync Engine</span>
                <span className="text-slate-600 block">Socket.IO with Tenant Isolation</span>
                <span className="text-[11px] text-emerald-700 font-semibold mt-1 inline-block">
                  ● Swiggy & Zomato 2-Way Sync Bridge Active
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm px-6 py-3 rounded-xl shadow transition-colors disabled:opacity-50 cursor-pointer"
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
