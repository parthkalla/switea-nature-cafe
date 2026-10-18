import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Banknote,
  ShoppingBag,
  Clock,
  CheckCircle2,
  QrCode,
  UtensilsCrossed,
  ArrowRight,
  TrendingUp,
  ChefHat,
} from 'lucide-react';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { api } from '../../services/api';
import { getSocket } from '../../services/socket';
import { Order } from '../../types';

export const AdminDashboard: React.FC = () => {
  const [data, setData] = useState<{
    metrics: {
      salesToday: number;
      ordersTodayCount: number;
      totalSales: number;
      totalOrdersCount: number;
      pendingOrders: number;
      completedOrders: number;
      avgOrderValue: number;
      totalTables: number;
      totalMenuItems: number;
      categoriesCount: number;
      qrScansCount: number;
    };
    recentOrders: Order[];
    topSellingItems: { name: string; quantity: number; revenue: number }[];
  } | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    try {
      const res = await api.getAdminAnalytics();
      setData(res);
    } catch (err) {
      console.error('Failed to load analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();

    // Listen for realtime orders to auto-refresh metrics
    const socket = getSocket();
    socket.on('new_order', () => {
      fetchAnalytics();
    });

    return () => {
      socket.off('new_order');
    };
  }, []);

  if (loading) {
    return (
      <AdminLayout>
        <div className="py-20 text-center">
          <div className="w-10 h-10 border-4 border-nature-900 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-stone-500">Loading live analytics...</p>
        </div>
      </AdminLayout>
    );
  }

  const { metrics, recentOrders, topSellingItems } = data || {
    metrics: {
      salesToday: 0,
      ordersTodayCount: 0,
      totalSales: 0,
      totalOrdersCount: 0,
      pendingOrders: 0,
      completedOrders: 0,
      avgOrderValue: 0,
      totalTables: 0,
      totalMenuItems: 0,
      categoriesCount: 0,
      qrScansCount: 0,
    },
    recentOrders: [],
    topSellingItems: [],
  };

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-serif text-3xl font-bold text-stone-900">Cafe Overview</h1>
            <p className="text-xs text-stone-500 mt-1">Live metrics from your Switea restaurant database</p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/admin/kitchen"
              className="inline-flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white px-4 py-2.5 rounded-xl font-bold text-xs shadow-sm transition-colors"
            >
              <ChefHat className="w-4 h-4" />
              <span>Kitchen Display</span>
            </Link>
            <Link
              to="/admin/orders"
              className="inline-flex items-center gap-2 bg-nature-900 hover:bg-nature-950 text-white px-4 py-2.5 rounded-xl font-bold text-xs shadow-sm transition-colors"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>View All Orders</span>
            </Link>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="bg-white p-6 rounded-3xl border border-stone-200/90 shadow-soft">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">Today's Sales</span>
              <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                <Banknote className="w-5 h-5" />
              </div>
            </div>
            <span className="font-serif text-3xl font-extrabold text-stone-900 block">
              ₹{metrics.salesToday}
            </span>
            <span className="text-[11px] text-stone-500 mt-1 block">
              {metrics.ordersTodayCount} {metrics.ordersTodayCount === 1 ? 'order' : 'orders'} placed today
            </span>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-stone-200/90 shadow-soft">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">Pending Orders</span>
              <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
                <Clock className="w-5 h-5" />
              </div>
            </div>
            <span className="font-serif text-3xl font-extrabold text-amber-700 block">
              {metrics.pendingOrders}
            </span>
            <span className="text-[11px] text-stone-500 mt-1 block">Needs kitchen fulfillment</span>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-stone-200/90 shadow-soft">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">Active Tables</span>
              <div className="w-9 h-9 rounded-xl bg-nature-100 text-nature-800 flex items-center justify-center">
                <QrCode className="w-5 h-5" />
              </div>
            </div>
            <span className="font-serif text-3xl font-extrabold text-stone-900 block">
              {metrics.totalTables}
            </span>
            <span className="text-[11px] text-stone-500 mt-1 block">
              {metrics.qrScansCount} total QR scans logged
            </span>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-stone-200/90 shadow-soft">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">Menu Offerings</span>
              <div className="w-9 h-9 rounded-xl bg-cream-200 text-stone-800 flex items-center justify-center">
                <UtensilsCrossed className="w-5 h-5" />
              </div>
            </div>
            <span className="font-serif text-3xl font-extrabold text-stone-900 block">
              {metrics.totalMenuItems}
            </span>
            <span className="text-[11px] text-stone-500 mt-1 block">
              Across {metrics.categoriesCount} categories
            </span>
          </div>
        </div>

        {/* Two Column Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Recent Orders */}
          <div className="lg:col-span-8 bg-white rounded-3xl border border-stone-200 p-6 shadow-soft space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <h2 className="font-serif font-bold text-lg text-stone-900">Recent Customer Orders</h2>
              <Link to="/admin/orders" className="text-xs font-bold text-nature-900 hover:underline">
                View All →
              </Link>
            </div>

            {recentOrders.length === 0 ? (
              <p className="text-xs text-stone-400 py-8 text-center">No orders recorded yet.</p>
            ) : (
              <div className="divide-y divide-stone-100">
                {recentOrders.map((ord) => (
                  <div key={ord.id} className="py-3.5 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <strong className="text-sm text-stone-900">#{ord.orderNumber}</strong>
                        <span className="text-xs text-stone-500 font-medium">
                          {ord.table ? `${ord.table.tableNumber}` : 'Takeaway'}
                        </span>
                      </div>
                      <span className="text-xs text-stone-400 block mt-0.5">
                        {ord.items?.length || 0} items • {new Date(ord.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="font-bold text-sm text-stone-900 block">₹{ord.totalAmount}</span>
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold mt-1 ${
                          ord.status === 'SERVED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : ord.status === 'CANCELLED'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {ord.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Top Selling Items */}
          <div className="lg:col-span-4 bg-white rounded-3xl border border-stone-200 p-6 shadow-soft space-y-4">
            <h2 className="font-serif font-bold text-lg text-stone-900 pb-3 border-b border-stone-100 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-nature-800" />
              <span>Top Sellers</span>
            </h2>

            {topSellingItems.length === 0 ? (
              <p className="text-xs text-stone-400 py-8 text-center">No sales data yet.</p>
            ) : (
              <div className="space-y-3">
                {topSellingItems.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-stone-900 block">{item.name}</span>
                      <span className="text-stone-400">{item.quantity} sold</span>
                    </div>
                    <span className="font-semibold text-stone-700">₹{item.revenue}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};
