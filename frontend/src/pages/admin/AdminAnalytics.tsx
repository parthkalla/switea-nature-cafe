import React, { useEffect, useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  Users,
  DollarSign,
  QrCode,
  Download,
  Printer,
  ShoppingBag,
  Sparkles,
  Calendar,
  Utensils,
  MapPin,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { api } from '../../services/api';

export const AdminAnalytics: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [reportDate, setReportDate] = useState<string>('');

  useEffect(() => {
    async function loadStats() {
      try {
        setLoading(true);
        const res = await api.getAdminAnalytics();
        setData(res);
        setReportDate(new Date().toLocaleString('en-IN', {
          dateStyle: 'medium',
          timeStyle: 'short',
        }));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  const handlePrint = () => {
    window.print();
  };

  if (loading || !data) {
    return (
      <AdminLayout>
        <div className="py-20 text-center">
          <div className="w-10 h-10 border-4 border-nature-900 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs font-semibold text-stone-600">Generating analytics & sales charts...</p>
        </div>
      </AdminLayout>
    );
  }

  const { metrics, topSellingItems, recentOrders, dailySalesTrend = [], channelBreakdown, categoryBreakdown = [] } = data;

  const maxDailySales = Math.max(...dailySalesTrend.map((d: any) => d.sales), 100);

  return (
    <AdminLayout>
      <div className="space-y-8 printable-area">
        {/* Print-only Header Letterhead */}
        <div className="hidden print:block pb-6 mb-6 border-b-2 border-stone-800 text-stone-900">
          <div className="flex justify-between items-start">
            <div>
              <span className="font-serif text-2xl font-bold tracking-tight text-nature-950 block">
                Switea Nature Cafe
              </span>
              <span className="text-xs text-stone-600 block mt-0.5">
                64A, Karni Vihar, Gandhipath, near Vaishali Nagar, Jaipur (Rajasthan)
              </span>
              <span className="text-xs text-stone-600">Contact: +91 95554 95454 | Email: contact@switea.com</span>
            </div>
            <div className="text-right">
              <span className="text-xs font-bold uppercase tracking-wider bg-stone-100 px-2.5 py-1 rounded border border-stone-300 block mb-1">
                Executive Sales Audit
              </span>
              <span className="text-xs text-stone-500 block">Generated: {reportDate}</span>
            </div>
          </div>
        </div>

        {/* Top Header for Screen */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-nature-100 text-nature-900 text-xs font-semibold mb-2">
              <BarChart3 className="w-3.5 h-3.5 text-nature-700" />
              <span>Performance & Revenue Intelligence</span>
            </div>
            <h1 className="font-serif text-3xl font-bold text-stone-900">Reports & Analytics</h1>
            <p className="text-xs text-stone-500 mt-1">
              Real-time sales velocity, 7-day revenue visualizer, category shares, and table utilization
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-2 bg-nature-900 hover:bg-nature-950 text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow transition-all duration-200"
            >
              <Printer className="w-4 h-4 text-nature-300" />
              <span>Print Official PDF Report</span>
            </button>
          </div>
        </div>

        {/* Primary Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-soft print-card">
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wider block mb-1">
              Gross Revenue
            </span>
            <span className="font-serif text-3xl font-extrabold text-stone-900 block">
              ₹{metrics.totalSales}
            </span>
            <span className="text-[11px] text-stone-400 mt-1 block">Lifetime orders fulfilled</span>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-soft print-card">
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wider block mb-1">
              Today's Sales
            </span>
            <span className="font-serif text-3xl font-extrabold text-nature-950 block">
              ₹{metrics.salesToday}
            </span>
            <span className="text-[11px] text-emerald-700 font-semibold mt-1 block">
              {metrics.ordersTodayCount} trays ordered today
            </span>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-soft print-card">
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wider block mb-1">
              Average Order Value
            </span>
            <span className="font-serif text-3xl font-extrabold text-amber-700 block">
              ₹{metrics.avgOrderValue}
            </span>
            <span className="text-[11px] text-stone-400 mt-1 block">Per successful table tray</span>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-soft print-card">
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wider block mb-1">
              Total Table Scans
            </span>
            <span className="font-serif text-3xl font-extrabold text-emerald-700 block">
              {metrics.qrScansCount}
            </span>
            <span className="text-[11px] text-stone-400 mt-1 block">Across all active table tokens</span>
          </div>
        </div>

        {/* Visual Charts: 7-Day Revenue Trend Graph */}
        <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-soft print-card space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-stone-100">
            <div>
              <h2 className="font-serif font-bold text-xl text-stone-900 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-nature-700" />
                <span>7-Day Sales & Volume Velocity Trend</span>
              </h2>
              <p className="text-xs text-stone-500 mt-0.5">
                Visualizing daily revenue flow and tray fulfillment count
              </p>
            </div>
            <span className="text-xs font-bold text-nature-800 bg-nature-50 px-3 py-1 rounded-full border border-nature-200">
              Peak: ₹{maxDailySales.toFixed(2)}
            </span>
          </div>

          {/* Interactive Bar & Chart Visualizer */}
          <div className="pt-4">
            <div className="h-64 flex items-end justify-between gap-3 sm:gap-6 border-b border-stone-200 pb-3">
              {dailySalesTrend.map((d: any, idx: number) => {
                const heightPercent = Math.max(8, Math.round((d.sales / maxDailySales) * 100));
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group">
                    {/* Hover tooltip / Label */}
                    <div className="mb-2 text-center opacity-90 group-hover:opacity-100 transition-opacity">
                      <span className="font-serif text-xs font-extrabold text-nature-950 block">
                        ₹{d.sales}
                      </span>
                      <span className="text-[10px] text-stone-400 block font-medium">
                        {d.ordersCount} orders
                      </span>
                    </div>

                    {/* Chart Bar */}
                    <div className="w-full max-w-[48px] bg-stone-100 rounded-t-xl overflow-hidden flex flex-col justify-end p-1">
                      <div
                        className="w-full bg-gradient-to-t from-nature-900 to-nature-700 rounded-t-lg transition-all duration-500 group-hover:from-emerald-800 group-hover:to-nature-600 shadow-sm"
                        style={{ height: `${heightPercent}%` }}
                      />
                    </div>

                    {/* X-axis Day Label */}
                    <div className="mt-3 text-center">
                      <span className="font-bold text-xs text-stone-800 block">{d.day}</span>
                      <span className="text-[10px] text-stone-400 block">{d.date}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Two Columns: Category Shares & Fulfillment Channels */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Category Contribution Graph */}
          <div className="lg:col-span-7 bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-soft print-card space-y-5">
            <h2 className="font-serif font-bold text-lg text-stone-900 pb-3 border-b border-stone-100 flex items-center justify-between">
              <span>Category Revenue Share</span>
              <span className="text-xs font-normal text-stone-500">{categoryBreakdown.length} Active Categories</span>
            </h2>

            {categoryBreakdown.length === 0 ? (
              <p className="text-xs text-stone-400 py-6 text-center">No category sales recorded yet.</p>
            ) : (
              <div className="space-y-4">
                {categoryBreakdown.map((cat: any, idx: number) => {
                  const maxCatRev = Math.max(...categoryBreakdown.map((c: any) => c.revenue), 100);
                  const barPercent = Math.max(5, Math.round((cat.revenue / maxCatRev) * 100));

                  return (
                    <div key={idx} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-stone-800">{cat.name}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-stone-500">{cat.itemsSold} sold</span>
                          <strong className="font-serif font-bold text-nature-950">₹{cat.revenue}</strong>
                        </div>
                      </div>
                      <div className="w-full bg-stone-100 rounded-full h-2.5 overflow-hidden">
                        <div
                          className="bg-nature-800 h-2.5 rounded-full transition-all duration-500"
                          style={{ width: `${barPercent}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Fulfillment Channels */}
          <div className="lg:col-span-5 bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-soft print-card space-y-5">
            <h2 className="font-serif font-bold text-lg text-stone-900 pb-3 border-b border-stone-100">
              Ordering Channel Mix
            </h2>

            <div className="space-y-4 pt-1">
              <div className="p-4 rounded-2xl bg-cream-50 border border-stone-200/80 flex items-center justify-between">
                <div>
                  <span className="font-bold text-xs uppercase tracking-wider text-nature-800 block">
                    Dine-in (Table QR)
                  </span>
                  <span className="font-serif text-2xl font-black text-stone-900 block mt-0.5">
                    {channelBreakdown?.dineIn?.percentage || 0}%
                  </span>
                  <span className="text-[11px] text-stone-500">
                    {channelBreakdown?.dineIn?.count || 0} table tray orders
                  </span>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-nature-100 text-nature-900 flex items-center justify-center font-bold">
                  <QrCode className="w-6 h-6" />
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200/80 flex items-center justify-between">
                <div>
                  <span className="font-bold text-xs uppercase tracking-wider text-stone-700 block">
                    Takeaway / Counter
                  </span>
                  <span className="font-serif text-2xl font-black text-stone-900 block mt-0.5">
                    {channelBreakdown?.takeaway?.percentage || 0}%
                  </span>
                  <span className="text-[11px] text-stone-500">
                    {channelBreakdown?.takeaway?.count || 0} counter pickups
                  </span>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-900 flex items-center justify-center font-bold">
                  <ShoppingBag className="w-6 h-6" />
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200/80 flex items-center justify-between">
                <div>
                  <span className="font-bold text-xs uppercase tracking-wider text-stone-700 block">
                    Delivery
                  </span>
                  <span className="font-serif text-2xl font-black text-stone-900 block mt-0.5">
                    {channelBreakdown?.delivery?.percentage || 0}%
                  </span>
                  <span className="text-[11px] text-stone-500">
                    {channelBreakdown?.delivery?.count || 0} home deliveries
                  </span>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-900 flex items-center justify-center font-bold">
                  <Utensils className="w-6 h-6" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Top items table */}
        <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-soft print-card space-y-4">
          <h2 className="font-serif font-bold text-lg text-stone-900 pb-2 border-b border-stone-100">
            Top Menu Performers by Revenue
          </h2>

          <div className="divide-y divide-stone-100">
            {topSellingItems.map((item: any, idx: number) => (
              <div key={idx} className="py-3.5 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-full bg-cream-200 text-stone-700 flex items-center justify-center font-bold text-xs">
                    {idx + 1}
                  </span>
                  <div>
                    <strong className="text-stone-900 text-sm block">{item.name}</strong>
                    <span className="text-stone-500">{item.quantity} orders fulfilled</span>
                  </div>
                </div>
                <span className="font-serif font-extrabold text-nature-950 text-base">₹{item.revenue}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Print-only certification footer */}
        <div className="hidden print:block pt-8 mt-8 border-t border-stone-300 text-xs text-stone-500 flex justify-between items-center">
          <span>Switea Nature Cafe Management System — Authoritative Financial Record</span>
          <span>Verified by Restaurant Manager</span>
        </div>
      </div>
    </AdminLayout>
  );
};
