import React, { useEffect, useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  Building2,
  QrCode,
  ShoppingBag,
  CreditCard,
  RefreshCw,
  PieChart,
  ArrowUpRight,
} from 'lucide-react';
import { SuperAdminLayout } from '../../components/layout/SuperAdminLayout';
import { api } from '../../services/api';

export const SuperAdminAnalytics: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const res = await api.getSuperAdminAnalytics();
      setData(res);
    } catch (err) {
      console.error('Failed to load platform analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const summary = data?.summary || {};
  const restaurants = data?.restaurantPerformance || [];
  const planDistribution = data?.planDistribution || {};

  return (
    <SuperAdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Platform Analytics & Intelligence</h1>
            <p className="text-xs text-slate-500 mt-1">
              Cross-tenant GMV, transaction volume, QR table scans, and SaaS plan metrics
            </p>
          </div>

          <button
            onClick={fetchAnalytics}
            className="inline-flex items-center gap-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 px-4 py-2 rounded-xl text-xs font-semibold shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Metrics</span>
          </button>
        </div>

        {/* Global KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-xs text-slate-500 font-medium block">Total Platform GMV</span>
            <span className="text-3xl font-extrabold text-indigo-900 mt-1 block">
              ₹{(summary.totalRevenue || 0).toFixed(2)}
            </span>
            <span className="text-[11px] text-emerald-600 font-semibold mt-1 block flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> All active tenant orders
            </span>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-xs text-slate-500 font-medium block">Total Orders Processed</span>
            <span className="text-3xl font-extrabold text-slate-900 mt-1 block">
              {summary.totalOrdersCount || 0}
            </span>
            <span className="text-[11px] text-slate-400 mt-1 block">Dine-in, counter & online</span>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-xs text-slate-500 font-medium block">Active QR Code Scans</span>
            <span className="text-3xl font-extrabold text-emerald-800 mt-1 block">
              {summary.totalScans || 0}
            </span>
            <span className="text-[11px] text-slate-400 mt-1 block">Table token engagements</span>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-xs text-slate-500 font-medium block">Onboarded Cafes</span>
            <span className="text-3xl font-extrabold text-slate-900 mt-1 block">
              {summary.totalRestaurants || 0}
            </span>
            <span className="text-[11px] text-slate-400 mt-1 block">Multi-tenant instances</span>
          </div>
        </div>

        {/* Breakdown: Dining Modes & Plan Subscriptions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Order Types */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="font-bold text-slate-900 text-sm mb-4 flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-indigo-600" />
              <span>Order Fulfilment Distribution</span>
            </h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                  <span>Dine-In (Table QR Ordering)</span>
                  <span>{summary.orderTypes?.dineIn || 0} orders</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-indigo-600 h-2.5 rounded-full"
                    style={{
                      width: `${
                        summary.totalOrdersCount > 0
                          ? ((summary.orderTypes?.dineIn || 0) / summary.totalOrdersCount) * 100
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                  <span>Takeaway / Counter</span>
                  <span>{summary.orderTypes?.takeaway || 0} orders</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-amber-500 h-2.5 rounded-full"
                    style={{
                      width: `${
                        summary.totalOrdersCount > 0
                          ? ((summary.orderTypes?.takeaway || 0) / summary.totalOrdersCount) * 100
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                  <span>Delivery</span>
                  <span>{summary.orderTypes?.delivery || 0} orders</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-emerald-600 h-2.5 rounded-full"
                    style={{
                      width: `${
                        summary.totalOrdersCount > 0
                          ? ((summary.orderTypes?.delivery || 0) / summary.totalOrdersCount) * 100
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Plan Subscriptions */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="font-bold text-slate-900 text-sm mb-4 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-indigo-600" />
              <span>Subscription Tier Distribution</span>
            </h3>

            <div className="grid grid-cols-3 gap-3">
              {Object.entries(planDistribution).map(([planName, count]) => (
                <div key={planName} className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-center">
                  <span className="text-xs font-bold text-slate-600 uppercase tracking-wider block">
                    {planName}
                  </span>
                  <span className="text-2xl font-black text-indigo-950 mt-1 block">
                    {String(count)}
                  </span>
                  <span className="text-[10px] text-slate-400">Subscribers</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tenant Performance Leaderboard */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100">
            <h3 className="font-bold text-slate-900 text-sm">Restaurant Performance Overview</h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold text-slate-500 uppercase">
                  <th className="py-3 px-6">Restaurant</th>
                  <th className="py-3 px-6">Slug</th>
                  <th className="py-3 px-6">Status</th>
                  <th className="py-3 px-6">Active Tables</th>
                  <th className="py-3 px-6">Total Orders</th>
                  <th className="py-3 px-6">Gross Sales</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {restaurants.map((rest: any) => (
                  <tr key={rest.id} className="hover:bg-slate-50">
                    <td className="py-3.5 px-6 font-bold text-slate-900">
                      {rest.name}
                    </td>
                    <td className="py-3.5 px-6 font-mono text-slate-500">
                      /{rest.slug}
                    </td>
                    <td className="py-3.5 px-6">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          rest.isOpen ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {rest.isOpen ? 'OPEN' : 'CLOSED'}
                      </span>
                    </td>
                    <td className="py-3.5 px-6 font-semibold text-slate-700">
                      {rest.totalTables}
                    </td>
                    <td className="py-3.5 px-6 font-semibold text-slate-700">
                      {rest.totalOrders}
                    </td>
                    <td className="py-3.5 px-6 font-bold text-indigo-950 font-serif">
                      ₹{rest.totalSales.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </SuperAdminLayout>
  );
};
