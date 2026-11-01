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
  Gift,
  Plus,
  Minus,
  X,
  History,
  CheckCircle2,
} from 'lucide-react';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { api } from '../../services/api';

interface CustomerRecord {
  id: string;
  name: string;
  phone: string;
  totalOrders: number;
  totalSpent: number;
  foodPoints?: number;
  coffeePoints?: number;
  lifetimeFoodPoints?: number;
  lifetimeCoffeePoints?: number;
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

  // Loyalty Modal State
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerRecord | null>(null);
  const [loyaltyDetails, setLoyaltyDetails] = useState<any>(null);
  const [loadingLoyalty, setLoadingLoyalty] = useState(false);
  const [adjustType, setAdjustType] = useState<'FOOD' | 'COFFEE'>('FOOD');
  const [adjustAmount, setAdjustAmount] = useState<number>(10);
  const [adjustReason, setAdjustReason] = useState<string>('ADMIN_ADJUSTMENT');
  const [adjustDescription, setAdjustDescription] = useState<string>('');
  const [isSubmittingAdjust, setIsSubmittingAdjust] = useState(false);
  const [adjustSuccessMsg, setAdjustSuccessMsg] = useState<string | null>(null);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const res = await api.getAdminCustomers();
      setCustomers(res.customers || []);
    } catch (err) {
      console.error('Failed to load customers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  // Compute KPI summaries
  const totalCustomers = customers.length;
  const repeatCustomers = customers.filter((c) => c.totalOrders > 1).length;
  const repeatRate = totalCustomers > 0 ? (repeatCustomers / totalCustomers) * 100 : 0;
  const totalCustomerSpend = customers.reduce((acc, c) => acc + c.totalSpent, 0);
  const totalFoodPoints = customers.reduce((acc, c) => acc + (c.foodPoints || 0), 0);
  const totalCoffeePoints = customers.reduce((acc, c) => acc + (c.coffeePoints || 0), 0);

  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      const matchSearch =
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.phone.includes(searchQuery);

      if (!matchSearch) return false;

      if (filterTier === 'VIP') return c.totalOrders >= 5 || c.totalSpent >= 2000;
      if (filterTier === 'REPEAT') return c.totalOrders > 1 && c.totalOrders < 5;
      if (filterTier === 'NEW') return c.totalOrders === 1;
      if (filterTier === 'LOYALTY') return (c.foodPoints || 0) > 0 || (c.coffeePoints || 0) > 0;

      return true;
    });
  }, [customers, searchQuery, filterTier]);

  const openLoyaltyModal = async (customer: CustomerRecord) => {
    setSelectedCustomer(customer);
    setAdjustSuccessMsg(null);
    setAdjustDescription('');
    try {
      setLoadingLoyalty(true);
      const res = await api.getCustomerLoyalty(customer.phone);
      setLoyaltyDetails(res.loyalty);
    } catch (err) {
      console.error('Failed to load loyalty:', err);
    } finally {
      setLoadingLoyalty(false);
    }
  };

  const handleAdjustPoints = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) return;

    try {
      setIsSubmittingAdjust(true);
      setAdjustSuccessMsg(null);
      const res = await api.adjustCustomerLoyalty({
        customerPhone: selectedCustomer.phone,
        customerName: selectedCustomer.name,
        pointsType: adjustType,
        amount: Number(adjustAmount),
        reason: adjustReason,
        description: adjustDescription || `Manual adjustment by cafe manager`,
      });

      setAdjustSuccessMsg(res.message || 'Points updated successfully!');
      setLoyaltyDetails((prev: any) => ({
        ...prev,
        foodPoints: res.loyalty.foodPoints,
        coffeePoints: res.loyalty.coffeePoints,
      }));
      // Refresh customer list in background
      fetchCustomers();
    } catch (err: any) {
      alert(err.message || 'Failed to adjust points');
    } finally {
      setIsSubmittingAdjust(false);
    }
  };

  const exportCSV = () => {
    const headers = ['Customer Name', 'Phone', 'Total Orders', 'Total Spent (INR)', 'Food Points', 'Coffee Points', 'Last Visit Date', 'Order Types'];
    const rows = filteredCustomers.map((c) => [
      `"${c.name}"`,
      `"${c.phone}"`,
      c.totalOrders,
      c.totalSpent,
      c.foodPoints || 0,
      c.coffeePoints || 0,
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
              <span>Patron Directory & Dual Loyalty Program</span>
            </div>
            <h1 className="font-serif text-3xl font-bold text-stone-900">Customer Directory</h1>
            <p className="text-xs text-stone-500 mt-1">
              Track dine-in guests, separate food & coffee loyalty balances, repeat visits, and patron metrics
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
            <span className="text-[11px] text-stone-400 mt-1 block">
              {repeatRate.toFixed(1)}% Repeat diner rate
            </span>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-stone-200/80 shadow-soft">
            <span className="text-xs text-stone-500 font-medium block">Total Patron Revenue</span>
            <span className="font-serif text-3xl font-extrabold text-nature-950 mt-1 block">
              ₹{totalCustomerSpend.toFixed(2)}
            </span>
            <span className="text-[11px] text-emerald-700 font-semibold mt-1 block">
              {repeatCustomers} repeat diners
            </span>
          </div>

          <div className="bg-emerald-50/70 p-6 rounded-2xl border border-emerald-200/80 shadow-soft">
            <div className="flex items-center justify-between">
              <span className="text-xs text-emerald-900 font-bold block">🍔 Food Points in Circulation</span>
              <span className="text-base">🍔</span>
            </div>
            <span className="font-serif text-3xl font-extrabold text-emerald-950 mt-1 block">
              {totalFoodPoints} Pts
            </span>
            <span className="text-[11px] text-emerald-800 font-medium mt-1 block">
              Worth ₹{totalFoodPoints} off food orders
            </span>
          </div>

          <div className="bg-amber-50/70 p-6 rounded-2xl border border-amber-200/80 shadow-soft">
            <div className="flex items-center justify-between">
              <span className="text-xs text-amber-900 font-bold block">☕ Coffee Points in Circulation</span>
              <span className="text-base">☕</span>
            </div>
            <span className="font-serif text-3xl font-extrabold text-amber-950 mt-1 block">
              {totalCoffeePoints} Pts
            </span>
            <span className="text-[11px] text-amber-800 font-medium mt-1 block">
              Worth ₹{totalCoffeePoints} off beverage orders
            </span>
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
            {['ALL', 'LOYALTY', 'VIP', 'REPEAT', 'NEW'].map((tier) => (
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
                {tier === 'LOYALTY' && 'Active Loyalty Members'}
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
                    <th className="py-3.5 px-5">Customer</th>
                    <th className="py-3.5 px-5">Phone</th>
                    <th className="py-3.5 px-5">Orders</th>
                    <th className="py-3.5 px-5">Spend</th>
                    <th className="py-3.5 px-5 bg-emerald-50/50 text-emerald-950">🍔 Food Points</th>
                    <th className="py-3.5 px-5 bg-amber-50/50 text-amber-950">☕ Coffee Points</th>
                    <th className="py-3.5 px-5">Last Visit</th>
                    <th className="py-3.5 px-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {filteredCustomers.map((customer) => {
                    const isVip = customer.totalOrders >= 5 || customer.totalSpent >= 2000;
                    const foodPts = customer.foodPoints || 0;
                    const coffeePts = customer.coffeePoints || 0;

                    return (
                      <tr key={customer.id} className="hover:bg-cream-50/60 transition-colors">
                        <td className="py-4 px-5">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-nature-100 text-nature-900 font-serif font-bold flex items-center justify-center text-sm flex-shrink-0">
                              {customer.name[0]?.toUpperCase() || 'G'}
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-stone-900">{customer.name}</span>
                                {isVip && (
                                  <span className="text-[10px] bg-amber-100 text-amber-900 font-bold px-1.5 py-0.5 rounded">
                                    VIP
                                  </span>
                                )}
                              </div>
                              <span className="text-[11px] text-stone-400">ID: {customer.id.slice(0, 8)}</span>
                            </div>
                          </div>
                        </td>

                        <td className="py-4 px-5 text-stone-700 font-mono text-xs">
                          {customer.phone}
                        </td>

                        <td className="py-4 px-5 font-semibold text-stone-900">
                          {customer.totalOrders}
                        </td>

                        <td className="py-4 px-5 font-serif font-bold text-nature-950">
                          ₹{customer.totalSpent.toFixed(2)}
                        </td>

                        {/* Separate Food Points */}
                        <td className="py-4 px-5 bg-emerald-50/20">
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-100/70 border border-emerald-200 text-emerald-950 font-bold text-xs">
                            <span>🍔</span>
                            <span>{foodPts} Pts</span>
                          </div>
                        </td>

                        {/* Separate Coffee Points */}
                        <td className="py-4 px-5 bg-amber-50/20">
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-100/70 border border-amber-200 text-amber-950 font-bold text-xs">
                            <span>☕</span>
                            <span>{coffeePts} Pts</span>
                          </div>
                        </td>

                        <td className="py-4 px-5 text-stone-600 text-xs">
                          {new Date(customer.lastVisit).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                          })}
                        </td>

                        <td className="py-4 px-5 text-right">
                          <button
                            onClick={() => openLoyaltyModal(customer)}
                            className="inline-flex items-center gap-1.5 bg-nature-900 hover:bg-nature-950 text-white text-xs font-semibold px-3 py-1.5 rounded-xl shadow-xs transition-colors"
                          >
                            <Gift className="w-3.5 h-3.5 text-nature-300" />
                            <span>Manage Points</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal: Customer Points & History Management */}
        {selectedCustomer && (
          <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl border border-stone-200 max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl space-y-6 animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between pb-3 border-b border-stone-200">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-900 flex items-center justify-center font-bold text-base">
                    🎁
                  </div>
                  <div>
                    <h2 className="font-serif font-bold text-lg text-stone-900">Manage Loyalty Points</h2>
                    <p className="text-xs text-stone-500">
                      {selectedCustomer.name} ({selectedCustomer.phone})
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedCustomer(null)}
                  className="p-2 rounded-full text-stone-400 hover:text-stone-800 hover:bg-stone-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Current Balances Card */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-center">
                  <span className="text-xs font-bold text-emerald-900 block mb-1">🍔 Food Points</span>
                  <span className="text-2xl font-extrabold text-emerald-950 font-serif">
                    {loyaltyDetails?.foodPoints ?? selectedCustomer.foodPoints ?? 0}
                  </span>
                  <span className="text-[10px] text-emerald-700 block mt-0.5">
                    Lifetime: {loyaltyDetails?.lifetimeFoodPoints ?? 0} Pts
                  </span>
                </div>

                <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 text-center">
                  <span className="text-xs font-bold text-amber-900 block mb-1">☕ Coffee Points</span>
                  <span className="text-2xl font-extrabold text-amber-950 font-serif">
                    {loyaltyDetails?.coffeePoints ?? selectedCustomer.coffeePoints ?? 0}
                  </span>
                  <span className="text-[10px] text-amber-700 block mt-0.5">
                    Lifetime: {loyaltyDetails?.lifetimeCoffeePoints ?? 0} Pts
                  </span>
                </div>
              </div>

              {/* Adjust Points Form */}
              <form onSubmit={handleAdjustPoints} className="bg-stone-50 p-4 rounded-2xl border border-stone-200 space-y-3">
                <h3 className="font-serif font-bold text-sm text-stone-800">Adjust Customer Points</h3>

                {adjustSuccessMsg && (
                  <div className="p-2.5 bg-emerald-100 text-emerald-900 text-xs rounded-xl flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-700 flex-shrink-0" />
                    <span>{adjustSuccessMsg}</span>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAdjustType('FOOD')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                      adjustType === 'FOOD'
                        ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs'
                        : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-100'
                    }`}
                  >
                    🍔 Food Points
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjustType('COFFEE')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                      adjustType === 'COFFEE'
                        ? 'bg-amber-700 text-white border-amber-700 shadow-xs'
                        : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-100'
                    }`}
                  >
                    ☕ Coffee Points
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-stone-600 block mb-1">Amount (+ or -)</label>
                    <input
                      type="number"
                      value={adjustAmount}
                      onChange={(e) => setAdjustAmount(parseInt(e.target.value) || 0)}
                      placeholder="e.g. 20 or -10"
                      className="w-full px-3 py-2 rounded-xl border border-stone-200 text-sm font-bold bg-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-stone-600 block mb-1">Reason</label>
                    <select
                      value={adjustReason}
                      onChange={(e) => setAdjustReason(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs font-semibold bg-white"
                    >
                      <option value="ADMIN_ADJUSTMENT">Admin Adjustment</option>
                      <option value="GOODWILL_REWARD">Goodwill / Compensation</option>
                      <option value="LOYALTY_BONUS">Special Promo Bonus</option>
                      <option value="MANUAL_CORRECTION">Correction</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-stone-600 block mb-1">Note (Optional)</label>
                  <input
                    type="text"
                    value={adjustDescription}
                    onChange={(e) => setAdjustDescription(e.target.value)}
                    placeholder="e.g. Goodwill points for anniversary visit"
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs bg-white"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmittingAdjust || adjustAmount === 0}
                  className="w-full bg-nature-900 hover:bg-nature-950 text-white py-2.5 rounded-xl font-bold text-xs shadow transition-all disabled:opacity-50"
                >
                  {isSubmittingAdjust ? 'Updating...' : `Apply ${adjustAmount > 0 ? '+' : ''}${adjustAmount} ${adjustType} Points`}
                </button>
              </form>

              {/* Transactions History */}
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 font-bold text-xs text-stone-700">
                  <ShoppingBag className="w-3.5 h-3.5 text-stone-500" />
                  <span>Previous Orders</span>
                </div>
                {selectedCustomer.recentOrders.length === 0 ? (
                  <p className="py-3 text-center text-xs text-stone-400 italic bg-stone-50 rounded-xl">No previous orders found.</p>
                ) : (
                  <div className="space-y-1.5">
                    {selectedCustomer.recentOrders.map((previousOrder) => (
                      <div key={previousOrder.orderNumber} className="flex items-center justify-between bg-stone-50 rounded-xl px-3 py-2 text-xs">
                        <div><span className="font-bold text-stone-800">#{previousOrder.orderNumber}</span><span className="text-stone-500 ml-2">{previousOrder.type}</span><p className="text-[10px] text-stone-400">{new Date(previousOrder.date).toLocaleString('en-IN')}</p></div>
                        <div className="text-right"><span className="font-bold text-nature-950">₹{previousOrder.amount.toFixed(2)}</span><p className="text-[10px] text-stone-500">{previousOrder.status}</p></div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Transactions History */}
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 font-bold text-xs text-stone-700">
                  <History className="w-3.5 h-3.5 text-stone-500" />
                  <span>Recent Points Activity</span>
                </div>

                {loadingLoyalty ? (
                  <div className="py-6 text-center text-xs text-stone-400">Loading history...</div>
                ) : !loyaltyDetails?.transactions || loyaltyDetails.transactions.length === 0 ? (
                  <div className="py-4 text-center text-xs text-stone-400 italic bg-stone-50 rounded-xl">
                    No points transactions recorded yet.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto divide-y divide-stone-100 pr-1">
                    {loyaltyDetails.transactions.map((tx: any) => (
                      <div key={tx.id} className="pt-2 flex items-center justify-between text-xs">
                        <div>
                          <div className="flex items-center gap-1">
                            <span className="font-bold text-stone-800">
                              {tx.pointsType === 'COFFEE' ? '☕ Coffee' : '🍔 Food'}
                            </span>
                            <span className="text-[11px] text-stone-500">
                              • {tx.description || tx.reason}
                            </span>
                          </div>
                          <span className="text-[10px] text-stone-400">
                            {new Date(tx.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <span className={`font-mono font-bold text-xs ${tx.points > 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                          {tx.points > 0 ? `+${tx.points}` : tx.points} Pts
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};
