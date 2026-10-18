import React, { useEffect, useState, useMemo } from 'react';
import {
  Users,
  Search,
  Download,
  Phone,
  Calendar,
  ShoppingBag,
  TrendingUp,
  Award,
  Sparkles,
  ArrowUpRight,
} from 'lucide-react';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { api } from '../../services/api';

interface CustomerRecord {
  id: string;
  name: string;
  phone: string;
  totalOrders: number;
  totalSpent: number;
  lastVisit: string;
  orderTypes: string[];
  recentOrders: Array<{
    orderNumber: string;
    amount: number;
    date: string;
    type: string;
    status: string;
  }>;
}

export const AdminCustomers: React.FC = () => {
  const [customers, setCustomers] = useState<CustomerRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTier, setFilterTier] = useState<string>('ALL');

  useEffect(() => {
    async function loadCustomers() {
      try {
        setLoading(true);
        const res = await api.getAdminCustomers();
        setCustomers(res.customers || []);
      } catch (err) {
        console.error('Failed to load customers:', err);
      } finally {
        setLoading(false);
      }
    }
    loadCustomers();
  }, []);

  // Compute KPI summaries
  const totalCustomers = customers.length;
  const repeatCustomers = customers.filter((c) => c.totalOrders > 1).length;
  const repeatRate = totalCustomers > 0 ? (repeatCustomers / totalCustomers) * 100 : 0;
  const totalCustomerSpend = customers.reduce((acc, c) => acc + c.totalSpent, 0);
  const avgLifetimeValue = totalCustomers > 0 ? totalCustomerSpend / totalCustomers : 0;

  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      const matchSearch =
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.phone.includes(searchQuery);

      if (!matchSearch) return false;

      if (filterTier === 'VIP') return c.totalOrders >= 5 || c.totalSpent >= 2000;
      if (filterTier === 'REPEAT') return c.totalOrders > 1 && c.totalOrders < 5;
      if (filterTier === 'NEW') return c.totalOrders === 1;

      return true;
    });
  }, [customers, searchQuery, filterTier]);

  const exportCSV = () => {
    const headers = ['Customer Name', 'Phone', 'Total Orders', 'Total Spent (INR)', 'Last Visit Date', 'Order Types'];
    const rows = filteredCustomers.map((c) => [
      `"${c.name}"`,
      `"${c.phone}"`,
      c.totalOrders,
      c.totalSpent,
      `"${new Date(c.lastVisit).toLocaleDateString()}"`,
      `"${c.orderTypes.join(', ')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `switea-customers-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-nature-100 text-nature-900 text-xs font-semibold mb-2">
              <Users className="w-3.5 h-3.5 text-nature-700" />
              <span>Patron Directory & CRM</span>
            </div>
            <h1 className="font-serif text-3xl font-bold text-stone-900">Customer Directory</h1>
            <p className="text-xs text-stone-500 mt-1">
              Track dine-in guests, order history, repeat visit frequencies, and customer lifetime value
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={exportCSV}
              disabled={filteredCustomers.length === 0}
              className="inline-flex items-center gap-2 bg-white border border-stone-200 hover:border-nature-800 text-stone-800 text-xs font-bold px-4 py-2.5 rounded-full shadow-soft transition-colors disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5 text-nature-700" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Analytics Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="bg-white p-6 rounded-2xl border border-stone-200/80 shadow-soft">
            <span className="text-xs text-stone-500 font-medium block">Total Unique Patrons</span>
            <span className="font-serif text-3xl font-extrabold text-stone-900 mt-1 block">
              {totalCustomers}
            </span>
            <span className="text-[11px] text-stone-400 mt-1 block">Dine-in & online patrons</span>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-stone-200/80 shadow-soft">
            <span className="text-xs text-stone-500 font-medium block">Repeat Diner Rate</span>
            <span className="font-serif text-3xl font-extrabold text-nature-900 mt-1 block">
              {repeatRate.toFixed(1)}%
            </span>
            <span className="text-[11px] text-emerald-700 font-semibold mt-1 block">
              {repeatCustomers} returning customers
            </span>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-stone-200/80 shadow-soft">
            <span className="text-xs text-stone-500 font-medium block">Average Lifetime Value</span>
            <span className="font-serif text-3xl font-extrabold text-amber-700 mt-1 block">
              ₹{avgLifetimeValue.toFixed(2)}
            </span>
            <span className="text-[11px] text-stone-400 mt-1 block">Across all fulfilled orders</span>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-stone-200/80 shadow-soft">
            <span className="text-xs text-stone-500 font-medium block">Total Patron Revenue</span>
            <span className="font-serif text-3xl font-extrabold text-nature-950 mt-1 block">
              ₹{totalCustomerSpend.toFixed(2)}
            </span>
            <span className="text-[11px] text-stone-400 mt-1 block">Excluding cancelled trays</span>
          </div>
        </div>

        {/* Search & Segmentation Tabs */}
        <div className="bg-white p-4 rounded-2xl border border-stone-200/80 shadow-soft flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-96">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name or phone..."
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-nature-800"
            />
          </div>

          <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
            {['ALL', 'VIP', 'REPEAT', 'NEW'].map((tier) => (
              <button
                key={tier}
                onClick={() => setFilterTier(tier)}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-colors whitespace-nowrap ${
                  filterTier === tier
                    ? 'bg-nature-900 text-white'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                {tier === 'ALL' && 'All Customers'}
                {tier === 'VIP' && 'VIP (₹2000+ or 5+ visits)'}
                {tier === 'REPEAT' && 'Repeat Diners'}
                {tier === 'NEW' && 'First Timers'}
              </button>
            ))}
          </div>
        </div>

        {/* Customers Data Table */}
        <div className="bg-white rounded-3xl border border-stone-200/90 shadow-soft overflow-hidden">
          {loading ? (
            <div className="py-20 text-center">
              <div className="w-10 h-10 border-4 border-nature-900 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm font-semibold text-stone-700">Loading patrons...</p>
            </div>
          ) : filteredCustomers.length === 0 ? (
            <div className="py-16 text-center">
              <Users className="w-12 h-12 text-stone-300 mx-auto mb-3" />
              <h3 className="font-serif text-lg font-bold text-stone-800">No Customers Found</h3>
              <p className="text-xs text-stone-500 mt-1">
                Customers will automatically populate as orders are placed via table QR codes or checkout.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-stone-200 bg-stone-50 text-[11px] font-bold text-stone-500 uppercase tracking-wider">
                    <th className="py-3.5 px-6">Customer</th>
                    <th className="py-3.5 px-6">Phone</th>
                    <th className="py-3.5 px-6">Total Orders</th>
                    <th className="py-3.5 px-6">Total Spend</th>
                    <th className="py-3.5 px-6">Dining Types</th>
                    <th className="py-3.5 px-6">Last Visit</th>
                    <th className="py-3.5 px-6">Tier Badge</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {filteredCustomers.map((customer) => {
                    const isVip = customer.totalOrders >= 5 || customer.totalSpent >= 2000;
                    const isRepeat = customer.totalOrders > 1;

                    return (
                      <tr key={customer.id} className="hover:bg-cream-50/60 transition-colors">
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-nature-100 text-nature-900 font-serif font-bold flex items-center justify-center text-sm flex-shrink-0">
                              {customer.name[0]?.toUpperCase() || 'G'}
                            </div>
                            <div>
                              <span className="font-bold text-stone-900 block">{customer.name}</span>
                              <span className="text-[11px] text-stone-400">ID: {customer.id.slice(0, 8)}</span>
                            </div>
                          </div>
                        </td>

                        <td className="py-4 px-6 text-stone-700 font-mono text-xs">
                          {customer.phone}
                        </td>

                        <td className="py-4 px-6 font-semibold text-stone-900">
                          {customer.totalOrders} {customer.totalOrders === 1 ? 'order' : 'orders'}
                        </td>

                        <td className="py-4 px-6 font-serif font-bold text-nature-950">
                          ₹{customer.totalSpent.toFixed(2)}
                        </td>

                        <td className="py-4 px-6">
                          <div className="flex flex-wrap gap-1">
                            {customer.orderTypes.map((t) => (
                              <span
                                key={t}
                                className="text-[10px] font-semibold bg-stone-100 text-stone-700 px-2 py-0.5 rounded"
                              >
                                {t.replace('_', ' ')}
                              </span>
                            ))}
                          </div>
                        </td>

                        <td className="py-4 px-6 text-stone-600 text-xs">
                          {new Date(customer.lastVisit).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </td>

                        <td className="py-4 px-6">
                          {isVip ? (
                            <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-900 text-[11px] font-bold px-2.5 py-0.5 rounded-full border border-amber-300">
                              <Award className="w-3 h-3 text-amber-600" />
                              <span>VIP Diner</span>
                            </span>
                          ) : isRepeat ? (
                            <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-900 text-[11px] font-bold px-2.5 py-0.5 rounded-full border border-emerald-300">
                              <Sparkles className="w-3 h-3 text-emerald-600" />
                              <span>Repeat Patron</span>
                            </span>
                          ) : (
                            <span className="inline-block bg-stone-100 text-stone-600 text-[11px] font-medium px-2.5 py-0.5 rounded-full">
                              First Visit
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};
