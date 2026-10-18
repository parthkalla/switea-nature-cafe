import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Building2,
  Users,
  CreditCard,
  DollarSign,
  Activity,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { SuperAdminLayout } from '../../components/layout/SuperAdminLayout';
import { api } from '../../services/api';

export const SuperAdminDashboard: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await api.getSuperAdminOverview();
        setData(res);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading || !data) {
    return (
      <SuperAdminLayout>
        <div className="py-20 text-center text-xs text-stone-400">Loading platform metrics...</div>
      </SuperAdminLayout>
    );
  }

  const { metrics, recentRestaurants, recentAuditLogs, systemHealth } = data;

  return (
    <SuperAdminLayout>
      <div className="space-y-8">
        <div>
          <h1 className="font-serif text-3xl font-bold text-stone-900">Platform Overview</h1>
          <p className="text-xs text-stone-500 mt-1">Multi-tenant restaurant system health and subscriptions</p>
        </div>

        {/* System Health Banner */}
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-emerald-500 animate-ping" />
            <div>
              <strong className="text-xs font-bold text-emerald-950 block">Platform Services Operational</strong>
              <span className="text-[11px] text-emerald-700">PostgreSQL / SQLite Database: {systemHealth.database} • Uptime: {systemHealth.uptimeSeconds}s</span>
            </div>
          </div>
          <span className="text-xs font-mono bg-white px-2.5 py-1 rounded-md text-emerald-800 border border-emerald-200">
            Node.js v24 • Production Mode
          </span>
        </div>

        {/* Platform Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-soft">
            <span className="text-xs font-bold text-stone-400 uppercase tracking-wider block mb-1">
              Active Restaurants
            </span>
            <span className="font-serif text-3xl font-extrabold text-stone-900 block">
              {metrics.totalRestaurants}
            </span>
            <span className="text-[11px] text-stone-500 mt-1 block">Tenants on platform</span>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-soft">
            <span className="text-xs font-bold text-stone-400 uppercase tracking-wider block mb-1">
              Platform Gross Volume
            </span>
            <span className="font-serif text-3xl font-extrabold text-indigo-600 block">
              ₹{metrics.platformGMV}
            </span>
            <span className="text-[11px] text-stone-500 mt-1 block">Across all table orders</span>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-soft">
            <span className="text-xs font-bold text-stone-400 uppercase tracking-wider block mb-1">
              Total System Orders
            </span>
            <span className="font-serif text-3xl font-extrabold text-stone-900 block">
              {metrics.totalOrders}
            </span>
            <span className="text-[11px] text-stone-500 mt-1 block">Processed orders</span>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-soft">
            <span className="text-xs font-bold text-stone-400 uppercase tracking-wider block mb-1">
              Active SaaS Subscriptions
            </span>
            <span className="font-serif text-3xl font-extrabold text-emerald-700 block">
              {metrics.activeSubscriptions}
            </span>
            <span className="text-[11px] text-stone-500 mt-1 block">Pro & Starter plans</span>
          </div>
        </div>

        {/* Restaurants directory preview */}
        <div className="bg-white rounded-3xl border border-stone-200 p-6 shadow-soft space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-stone-100">
            <h2 className="font-serif font-bold text-lg text-stone-900">Tenant Restaurants</h2>
            <Link to="/super-admin/restaurants" className="text-xs font-bold text-indigo-600 hover:underline">
              View All Directory →
            </Link>
          </div>

          <div className="divide-y divide-stone-100">
            {recentRestaurants.map((r: any) => (
              <div key={r.id} className="py-3 flex items-center justify-between">
                <div>
                  <strong className="text-sm text-stone-900 block">{r.name}</strong>
                  <span className="text-xs text-stone-400">Slug: /{r.slug} • {r._count?.tables || 0} tables</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs bg-emerald-50 text-emerald-700 font-bold px-2.5 py-0.5 rounded-full">
                    {r.isOpen ? 'Operational' : 'Suspended'}
                  </span>
                  <Link
                    to={`/menu/${r.slug}`}
                    target="_blank"
                    className="text-xs text-indigo-600 font-semibold hover:underline"
                  >
                    View Menu
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </SuperAdminLayout>
  );
};
