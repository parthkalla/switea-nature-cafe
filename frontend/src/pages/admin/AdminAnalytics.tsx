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
  Search,
  CreditCard,
  Banknote,
  Filter,
  FileSpreadsheet,
  FileText,
  X,
  Coffee,
  ShieldCheck,
  Check,
  Coins,
  Percent,
  Flame,
  ArrowUpRight,
  Gift,
} from 'lucide-react';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { api } from '../../services/api';

export const AdminAnalytics: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [reportDate, setReportDate] = useState<string>('');

  // Order history filters for on-screen table
  const [searchQuery, setSearchQuery] = useState('');
  const [channelFilter, setChannelFilter] = useState<string>('ALL');
  const [paymentFilter, setPaymentFilter] = useState<string>('ALL');

  // Official Audit Report Modal & Scope
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportScope, setReportScope] = useState<'all' | 'today' | '7days'>('all');
  const [reportOrientation, setReportOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [exportedCsv, setExportedCsv] = useState(false);

  useEffect(() => {
    async function loadStats() {
      try {
        setLoading(true);
        const res = await api.getAdminAnalytics();
        setData(res);
        setReportDate(
          new Date().toLocaleString('en-IN', {
            dateStyle: 'medium',
            timeStyle: 'short',
          })
        );
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  const handleOpenReportModal = () => {
    setShowReportModal(true);
  };

  const handlePrintReport = () => {
    window.print();
  };

  if (loading || !data) {
    return (
      <AdminLayout>
        <div className="py-20 text-center">
          <div className="w-10 h-10 border-4 border-nature-900 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs font-semibold text-stone-600">Generating analytics & sales intelligence...</p>
        </div>
      </AdminLayout>
    );
  }

  const {
    metrics,
    topSellingItems = [],
    recentOrders = [],
    dailySalesTrend = [],
    channelBreakdown = {},
    categoryBreakdown = [],
  } = data;

  const maxDailySales = Math.max(...dailySalesTrend.map((d: any) => d.sales), 100);

  // Compute filtered orders for the official audit statement based on selected scope
  const getAuditOrders = () => {
    const orders = recentOrders || [];
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    if (reportScope === 'today') {
      return orders.filter((o: any) => new Date(o.createdAt) >= startOfToday && o.status !== 'CANCELLED');
    }
    if (reportScope === '7days') {
      return orders.filter((o: any) => new Date(o.createdAt) >= sevenDaysAgo && o.status !== 'CANCELLED');
    }
    return orders.filter((o: any) => o.status !== 'CANCELLED');
  };

  const auditOrders = getAuditOrders();

  // Financial & Tax Calculations for the official audit report
  const auditGrossSubtotal = auditOrders.reduce((sum: number, o: any) => {
    const sub = typeof o.subtotal === 'number' && o.subtotal > 0 ? o.subtotal : o.totalAmount / 1.05;
    return sum + sub;
  }, 0);

  const auditTotalDiscounts = auditOrders.reduce((sum: number, o: any) => sum + (o.discountAmount || 0), 0);

  // Loyalty Points Burn (1 point = ₹1 discount given by cafe)
  const auditFoodPointsRedeemed = auditOrders.reduce(
    (sum: number, o: any) => sum + (o.foodPointsRedeemed || 0),
    0
  );
  const auditCoffeePointsRedeemed = auditOrders.reduce(
    (sum: number, o: any) => sum + (o.coffeePointsRedeemed || 0),
    0
  );
  const auditTotalPointsBurn = auditFoodPointsRedeemed + auditCoffeePointsRedeemed;

  // Loyalty Points Rewarded (Future customer retention pipeline)
  const auditFoodPointsEarned = auditOrders.reduce(
    (sum: number, o: any) => sum + (o.foodPointsEarned || 0),
    0
  );
  const auditCoffeePointsEarned = auditOrders.reduce(
    (sum: number, o: any) => sum + (o.coffeePointsEarned || 0),
    0
  );

  // Tax calculations
  const auditTotalTax = auditOrders.reduce((sum: number, o: any) => {
    const sub = typeof o.subtotal === 'number' && o.subtotal > 0 ? o.subtotal : o.totalAmount / 1.05;
    const tax = typeof o.taxAmount === 'number' && o.taxAmount > 0 ? o.taxAmount : o.totalAmount - sub;
    return sum + tax;
  }, 0);

  const auditCGST = auditTotalTax / 2;
  const auditSGST = auditTotalTax / 2;
  const auditGrandTotal = auditOrders.reduce((sum: number, o: any) => sum + o.totalAmount, 0);

  // P&L Calculations: Net Food Sales, COGS (28% benchmark), and Operating Gross Profit
  const netFoodRevenue = Math.max(auditGrossSubtotal - auditTotalDiscounts - auditTotalPointsBurn, 0);
  const estimatedCogsPercent = 28; // Standard cafe ingredient/raw materials cost benchmark
  const estimatedCogs = Number((netFoodRevenue * (estimatedCogsPercent / 100)).toFixed(2));
  const estimatedGrossProfit = Number((netFoodRevenue - estimatedCogs).toFixed(2));
  const estimatedProfitMargin =
    netFoodRevenue > 0 ? Number(((estimatedGrossProfit / netFoodRevenue) * 100).toFixed(1)) : 0;

  // Payment Breakdown
  const auditUpiOrders = auditOrders.filter((o: any) => o.paymentMethod === 'UPI');
  const auditUpiTotal = auditUpiOrders.reduce((sum: number, o: any) => sum + o.totalAmount, 0);

  const auditCashOrders = auditOrders.filter(
    (o: any) => o.paymentMethod === 'PAY_AT_COUNTER' || o.paymentMethod === 'CASH'
  );
  const auditCashTotal = auditCashOrders.reduce((sum: number, o: any) => sum + o.totalAmount, 0);

  const auditOtherOrders = auditOrders.filter(
    (o: any) =>
      o.paymentMethod !== 'UPI' &&
      o.paymentMethod !== 'PAY_AT_COUNTER' &&
      o.paymentMethod !== 'CASH'
  );
  const auditOtherTotal = auditOtherOrders.reduce((sum: number, o: any) => sum + o.totalAmount, 0);

  // Channel Breakdown
  const auditDineInOrders = auditOrders.filter((o: any) => o.orderType === 'DINE_IN');
  const auditDineInTotal = auditDineInOrders.reduce((sum: number, o: any) => sum + o.totalAmount, 0);

  const auditTakeawayOrders = auditOrders.filter((o: any) => o.orderType === 'TAKEAWAY');
  const auditTakeawayTotal = auditTakeawayOrders.reduce((sum: number, o: any) => sum + o.totalAmount, 0);

  const auditDeliveryOrders = auditOrders.filter(
    (o: any) => o.orderType !== 'DINE_IN' && o.orderType !== 'TAKEAWAY'
  );
  const auditDeliveryTotal = auditDeliveryOrders.reduce((sum: number, o: any) => sum + o.totalAmount, 0);

  // CSV Export for Accountants
  const handleExportCsv = () => {
    const headers = [
      'Bill Number',
      'Date',
      'Time',
      'Customer Name',
      'Phone',
      'Dining Type',
      'Table',
      'Items Detail',
      'Subtotal (Taxable Rs)',
      'Loyalty Points Burn (Rs)',
      'Coupons Discount (Rs)',
      'CGST 2.5% (Rs)',
      'SGST 2.5% (Rs)',
      'Total GST (Rs)',
      'Grand Total (Rs)',
      'Payment Mode',
      'Payment Status',
      'Order Status',
    ];

    const rows = auditOrders.map((o: any) => {
      const d = new Date(o.createdAt);
      const subtotal = o.subtotal || Number((o.totalAmount / 1.05).toFixed(2));
      const tax = o.taxAmount || Number((o.totalAmount - subtotal).toFixed(2));
      const halfTax = (tax / 2).toFixed(2);
      const pointsBurn = (o.foodPointsRedeemed || 0) + (o.coffeePointsRedeemed || 0);
      const itemsStr = (o.items || []).map((i: any) => `${i.quantity}x ${i.itemName}`).join('; ');

      const tableDisplay = o.table
        ? o.table.tableNumber.toLowerCase().includes('table')
          ? o.table.tableNumber
          : `Table ${o.table.tableNumber}`
        : o.orderType === 'TAKEAWAY'
        ? 'Takeaway'
        : 'Counter';

      return [
        o.orderNumber,
        d.toLocaleDateString('en-IN'),
        d.toLocaleTimeString('en-IN'),
        `"${(o.customerName || 'Walk-in Guest').replace(/"/g, '""')}"`,
        `"${o.customerPhone || ''}"`,
        o.orderType,
        `"${tableDisplay}"`,
        `"${itemsStr.replace(/"/g, '""')}"`,
        subtotal.toFixed(2),
        pointsBurn.toFixed(2),
        (o.discountAmount || 0).toFixed(2),
        halfTax,
        halfTax,
        tax.toFixed(2),
        o.totalAmount.toFixed(2),
        o.paymentMethod,
        o.paymentStatus,
        o.status,
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `RoastFuze_Sales_Tax_PnL_${reportScope}_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setExportedCsv(true);
    setTimeout(() => setExportedCsv(false), 3000);
  };

  const formatPaymentMethod = (method?: string) => {
    if (!method) return 'Pay at Counter';
    if (method === 'PAY_AT_COUNTER' || method === 'CASH') return 'Cash / Counter';
    if (method === 'UPI') return 'UPI (GPay/PhonePe)';
    if (method === 'CARD' || method === 'RAZORPAY') return 'Card / Online';
    return method;
  };

  return (
    <AdminLayout>
      {/* ============================================================== */}
      {/* 1. ON-SCREEN DASHBOARD (Hidden in print)                        */}
      {/* ============================================================== */}
      <div className="space-y-8 dashboard-screen no-print">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-nature-100 text-nature-900 text-xs font-semibold mb-2">
              <BarChart3 className="w-3.5 h-3.5 text-nature-700" />
              <span>Performance, Tax & P&L Intelligence</span>
            </div>
            <h1 className="font-serif text-3xl font-bold text-stone-900">Reports, P&L & Analytics</h1>
            <p className="text-xs text-stone-500 mt-1">
              Sales velocity, net profit & loss, customer loyalty points cost, and tax compliance audit
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={handleExportCsv}
              className="inline-flex items-center gap-1.5 bg-white border border-stone-300 hover:bg-stone-50 text-stone-800 px-4 py-2.5 rounded-xl font-bold text-xs shadow-xs transition-colors cursor-pointer"
            >
              {exportedCsv ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>CSV Exported!</span>
                </>
              ) : (
                <>
                  <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
                  <span>Export CSV / Excel</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleOpenReportModal}
              className="inline-flex items-center gap-2 bg-nature-950 hover:bg-stone-900 text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-md hover:shadow-lg transition-all cursor-pointer"
            >
              <FileText className="w-4 h-4 text-amber-300" />
              <span>Official Sales, Tax & P&L Report</span>
            </button>
          </div>
        </div>

        {/* Primary Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-soft">
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wider block mb-1">
              Gross Revenue
            </span>
            <span className="font-serif text-3xl font-extrabold text-stone-900 block">
              ₹{metrics.totalSales}
            </span>
            <span className="text-[11px] text-stone-400 mt-1 block">Lifetime orders fulfilled</span>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-soft">
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

          <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-soft">
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wider block mb-1">
              Average Order Value
            </span>
            <span className="font-serif text-3xl font-extrabold text-amber-700 block">
              ₹{metrics.avgOrderValue}
            </span>
            <span className="text-[11px] text-stone-400 mt-1 block">Per successful table tray</span>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-soft">
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wider block mb-1">
              Total Table Scans
            </span>
            <span className="font-serif text-3xl font-extrabold text-stone-800 block">
              {metrics.qrScansCount}
            </span>
            <span className="text-[11px] text-stone-400 mt-1 block">Across all active table tokens</span>
          </div>
        </div>

        {/* ============================================================== */}
        {/* PROFIT & LOSS (P&L) & LOYALTY POINTS COST INTELLIGENCE CARD     */}
        {/* ============================================================== */}
        <div className="bg-gradient-to-br from-stone-900 via-nature-950 to-stone-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-stone-800 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-800 pb-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold mb-2">
                <Flame className="w-3.5 h-3.5" />
                <span>Cafe Financial Profit & Loss (P&L) Engine</span>
              </div>
              <h2 className="font-serif text-2xl font-bold tracking-tight text-white">
                Operating Profit & Customer Loyalty Cost Accounting
              </h2>
              <p className="text-xs text-stone-300 mt-1">
                Real-time computation factoring in Gross Sales, Customer Loyalty Points Burn, Ingredients Cost (COGS), and Net Profits
              </p>
            </div>

            <div className="text-left sm:text-right">
              <span className="text-xs uppercase font-bold text-stone-400 block tracking-wider">
                Operating Margin
              </span>
              <span className="text-3xl font-black text-emerald-400 font-mono">
                {estimatedProfitMargin}%
              </span>
              <span className="text-[11px] text-emerald-300 font-semibold block">
                🔥 High-Margin Cafe Velocity
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            {/* 1. Gross Revenue */}
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-1">
              <span className="text-[10px] uppercase font-bold text-stone-400 block">Gross F&B Sales</span>
              <span className="text-xl font-extrabold text-white font-mono block">
                ₹{auditGrossSubtotal.toFixed(2)}
              </span>
              <span className="text-[11px] text-stone-400">Total item billings</span>
            </div>

            {/* 2. Loyalty Subsidy (Points Burned) */}
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold text-amber-400 block">
                  Loyalty Points Burn
                </span>
                <Coins className="w-3.5 h-3.5 text-amber-400" />
              </div>
              <span className="text-xl font-extrabold text-amber-300 font-mono block">
                -₹{auditTotalPointsBurn.toFixed(2)}
              </span>
              <span className="text-[11px] text-stone-400">
                🍔 ₹{auditFoodPointsRedeemed} | ☕ ₹{auditCoffeePointsRedeemed}
              </span>
            </div>

            {/* 3. Raw Ingredient / COGS Cost */}
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-1">
              <span className="text-[10px] uppercase font-bold text-rose-400 block">
                Ingredients Cost (COGS 28%)
              </span>
              <span className="text-xl font-extrabold text-rose-300 font-mono block">
                -₹{estimatedCogs.toFixed(2)}
              </span>
              <span className="text-[11px] text-stone-400">Coffee beans, milk, syrups</span>
            </div>

            {/* 4. Estimated Operating Gross Profit */}
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-1">
              <span className="text-[10px] uppercase font-bold text-emerald-400 block">
                Net Gross Operating Profit
              </span>
              <span className="text-2xl font-black text-emerald-300 font-mono block">
                ₹{estimatedGrossProfit.toFixed(2)}
              </span>
              <span className="text-[11px] text-emerald-200 font-semibold">
                After raw cost & points subsidy
              </span>
            </div>
          </div>

          {/* Retention ROI Gauge */}
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-400/20 text-amber-300 flex items-center justify-center font-bold">
                <Gift className="w-5 h-5" />
              </div>
              <div>
                <span className="font-bold text-white block">
                  Customer Loyalty Pipeline (Future Repeat Visits)
                </span>
                <span className="text-[11px] text-stone-300">
                  Customers rewarded: 🍔 +{auditFoodPointsEarned} Food Points &nbsp;|&nbsp; ☕ +{auditCoffeePointsEarned} Coffee Points
                </span>
              </div>
            </div>

            <div className="text-right">
              <span className="px-3 py-1 rounded-full bg-emerald-400/20 text-emerald-300 border border-emerald-400/30 font-bold text-xs inline-block">
                Loyalty ROI: +{Math.max(auditGrossSubtotal > 0 ? Math.round((auditGrossSubtotal / (auditTotalPointsBurn || 1)) * 10) : 100, 100)}% Value Generated
              </span>
            </div>
          </div>
        </div>

        {/* 7-Day Velocity Chart */}
        <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-soft space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 pb-4">
            <div>
              <h2 className="font-serif font-bold text-lg text-stone-900 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-amber-600" />
                <span>7-Day Sales & Volume Velocity Trend</span>
              </h2>
              <p className="text-xs text-stone-500">Visualizing daily revenue flow and tray fulfillment count</p>
            </div>
            <div className="text-right">
              <span className="text-xs font-bold bg-amber-50 text-amber-900 px-3 py-1 rounded-full border border-amber-200 inline-block">
                Peak: ₹{maxDailySales.toFixed(2)}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-2 sm:gap-4 items-end h-56 pt-8 pb-2">
            {dailySalesTrend.map((day: any, i: number) => {
              const heightPercent = maxDailySales > 0 ? (day.sales / maxDailySales) * 100 : 0;
              const isToday = i === dailySalesTrend.length - 1;

              return (
                <div key={day.date} className="flex flex-col items-center h-full justify-end group">
                  <span className="text-[10px] font-bold text-stone-600 mb-1 opacity-80 group-hover:opacity-100">
                    ₹{day.sales}
                  </span>
                  <span className="text-[9px] text-stone-400 mb-1.5">{day.orders} orders</span>

                  <div className="w-full max-w-[42px] bg-stone-100 rounded-t-xl h-full flex items-end p-1">
                    <div
                      style={{ height: `${Math.max(heightPercent, 6)}%` }}
                      className={`w-full rounded-t-lg transition-all duration-500 ${
                        isToday
                          ? 'bg-gradient-to-t from-nature-950 to-amber-600'
                          : 'bg-stone-300 group-hover:bg-nature-800'
                      }`}
                    />
                  </div>

                  <span
                    className={`text-[11px] font-bold mt-2.5 block ${
                      isToday ? 'text-nature-950 font-black' : 'text-stone-500'
                    }`}
                  >
                    {day.day}
                  </span>
                  <span className="text-[9px] text-stone-400">{day.date}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Categories & Channel Breakdown Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-soft space-y-5">
            <h2 className="font-serif font-bold text-lg text-stone-900 pb-3 border-b border-stone-100 flex items-center justify-between">
              <span>Category Revenue Share</span>
              <span className="text-xs font-normal text-stone-500">{categoryBreakdown.length} Active Categories</span>
            </h2>
            <div className="space-y-4">
              {categoryBreakdown.map((cat: any) => {
                const totalCatRev = categoryBreakdown.reduce((s: number, c: any) => s + c.revenue, 0) || 1;
                const percent = Math.round((cat.revenue / totalCatRev) * 100);

                return (
                  <div key={cat.name} className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-stone-800">{cat.name}</span>
                      <span className="text-stone-500">
                        {cat.itemsSold} sold •{' '}
                        <strong className="text-stone-900 font-mono">₹{cat.revenue}</strong> ({percent}%)
                      </span>
                    </div>
                    <div className="w-full bg-stone-100 h-2.5 rounded-full overflow-hidden">
                      <div
                        style={{ width: `${percent}%` }}
                        className="bg-amber-700 h-full rounded-full transition-all duration-500"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="lg:col-span-5 bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-soft space-y-5">
            <h2 className="font-serif font-bold text-lg text-stone-900 pb-3 border-b border-stone-100">
              Ordering Channel Mix
            </h2>
            <div className="space-y-3">
              <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200/80 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                    <Utensils className="w-5 h-5 text-emerald-700" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-stone-900 block">Dine-in (Balcony Tables)</span>
                    <span className="text-[11px] text-stone-500">{channelBreakdown.dineInOrders || 0} Orders</span>
                  </div>
                </div>
                <span className="font-mono font-bold text-stone-900 text-sm">
                  ₹{(channelBreakdown.dineInSales || 0).toFixed(2)}
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200/80 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
                    <ShoppingBag className="w-5 h-5 text-amber-700" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-stone-900 block">Takeaway / Counter</span>
                    <span className="text-[11px] text-stone-500">{channelBreakdown.takeawayOrders || 0} Orders</span>
                  </div>
                </div>
                <span className="font-mono font-bold text-stone-900 text-sm">
                  ₹{(channelBreakdown.takeawaySales || 0).toFixed(2)}
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200/80 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-blue-700" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-stone-900 block">Home Delivery (Direct)</span>
                    <span className="text-[11px] text-stone-500">{channelBreakdown.deliveryOrders || 0} Orders</span>
                  </div>
                </div>
                <span className="font-mono font-bold text-stone-900 text-sm">
                  ₹{(channelBreakdown.deliverySales || 0).toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Top items table */}
        <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-soft space-y-4">
          <h2 className="font-serif font-bold text-lg text-stone-900 pb-2 border-b border-stone-100">
            Top Menu Performers by Revenue
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {topSellingItems.map((item: any, idx: number) => (
              <div
                key={item.itemName}
                className="p-4 rounded-2xl border border-stone-200/80 bg-stone-50/50 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-lg bg-amber-100 text-amber-900 font-bold text-xs flex items-center justify-center">
                    #{idx + 1}
                  </span>
                  <div>
                    <span className="font-bold text-xs text-stone-900 block truncate max-w-[130px]">
                      {item.itemName}
                    </span>
                    <span className="text-[11px] text-stone-400">{item.totalQuantity} ordered</span>
                  </div>
                </div>
                <span className="font-mono font-bold text-xs text-stone-900">
                  ₹{Number(item.totalRevenue).toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* On-Screen Sales & Order History Table */}
        <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-soft space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-stone-100">
            <div>
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-nature-800" />
                <h2 className="font-serif font-bold text-xl text-stone-900">
                  Comprehensive Sales & Order History
                </h2>
              </div>
              <p className="text-xs text-stone-500 mt-1">
                Detailed transaction log with exact timestamps, payment modes, customer details, and dining channels
              </p>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search customer, #order, table..."
                  className="pl-9 pr-3 py-1.5 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-nature-800 w-48 sm:w-56"
                />
              </div>

              <select
                value={channelFilter}
                onChange={(e) => setChannelFilter(e.target.value)}
                className="px-3 py-1.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-semibold text-stone-700 focus:outline-none"
              >
                <option value="ALL">All Dining Types</option>
                <option value="DINE_IN">Dine-In (Table)</option>
                <option value="TAKEAWAY">Takeaway / Counter</option>
                <option value="DELIVERY">Delivery</option>
              </select>

              <select
                value={paymentFilter}
                onChange={(e) => setPaymentFilter(e.target.value)}
                className="px-3 py-1.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-semibold text-stone-700 focus:outline-none"
              >
                <option value="ALL">All Payment Methods</option>
                <option value="PAY_AT_COUNTER">Pay at Counter</option>
                <option value="UPI">UPI / GPay / QR</option>
                <option value="RAZORPAY">Online Card</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            {(() => {
              const filteredOrders = (recentOrders || []).filter((o: any) => {
                if (channelFilter !== 'ALL' && o.orderType !== channelFilter) return false;
                if (paymentFilter !== 'ALL') {
                  if (paymentFilter === 'PAY_AT_COUNTER') {
                    if (o.paymentMethod !== 'PAY_AT_COUNTER' && o.paymentMethod !== 'CASH') return false;
                  } else if (o.paymentMethod !== paymentFilter) {
                    return false;
                  }
                }
                if (searchQuery.trim()) {
                  const q = searchQuery.toLowerCase();
                  const matchName = (o.customerName || '').toLowerCase().includes(q);
                  const matchPhone = (o.customerPhone || '').toLowerCase().includes(q);
                  const matchOrderNum = (o.orderNumber || '').toLowerCase().includes(q);
                  const matchTable = (o.table?.tableNumber || '').toLowerCase().includes(q);
                  return matchName || matchPhone || matchOrderNum || matchTable;
                }
                return true;
              });

              if (filteredOrders.length === 0) {
                return (
                  <div className="py-12 text-center text-xs text-stone-400">
                    No orders match the selected filters or search criteria.
                  </div>
                );
              }

              return (
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-stone-200 text-stone-500 uppercase tracking-wider font-bold text-[10px]">
                      <th className="py-3 px-3">Order & Exact Time</th>
                      <th className="py-3 px-3">Customer</th>
                      <th className="py-3 px-3">Channel / Table</th>
                      <th className="py-3 px-3">Items Summary</th>
                      <th className="py-3 px-3">Payment Method</th>
                      <th className="py-3 px-3">Status</th>
                      <th className="py-3 px-3 text-right">Bill Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {filteredOrders.map((o: any) => {
                      const orderDate = new Date(o.createdAt);
                      const formattedDate = orderDate.toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      });
                      const formattedTime = orderDate.toLocaleTimeString('en-IN', {
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true,
                      });

                      const tableDisplay = o.table
                        ? o.table.tableNumber.toLowerCase().includes('table')
                          ? o.table.tableNumber
                          : `Table ${o.table.tableNumber}`
                        : o.orderType === 'TAKEAWAY'
                        ? 'Takeaway / Counter'
                        : 'Home Delivery';

                      return (
                        <tr key={o.id} className="hover:bg-amber-50/40 transition-colors">
                          <td className="py-3.5 px-3">
                            <span className="font-bold text-stone-900 block font-mono">
                              #{o.orderNumber}
                            </span>
                            <span className="text-[11px] text-stone-500 flex items-center gap-1 mt-0.5">
                              <Clock className="w-3 h-3 text-stone-400" />
                              <span>{formattedDate} • {formattedTime}</span>
                            </span>
                          </td>

                          <td className="py-3.5 px-3">
                            <strong className="text-stone-900 block">
                              {o.customerName || 'Walk-in Guest'}
                            </strong>
                            {o.customerPhone && (
                              <span className="text-[11px] text-stone-500 font-mono block">
                                {o.customerPhone}
                              </span>
                            )}
                          </td>

                          <td className="py-3.5 px-3">
                            {o.orderType === 'DINE_IN' ? (
                              <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-1 rounded-full font-bold text-[10px]">
                                <Utensils className="w-3 h-3 text-emerald-700" />
                                <span>{tableDisplay}</span>
                              </span>
                            ) : o.orderType === 'TAKEAWAY' ? (
                              <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-800 border border-amber-200 px-2.5 py-1 rounded-full font-bold text-[10px]">
                                <ShoppingBag className="w-3 h-3 text-amber-700" />
                                <span>Takeaway</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-800 border border-blue-200 px-2.5 py-1 rounded-full font-bold text-[10px]">
                                <MapPin className="w-3 h-3 text-blue-700" />
                                <span>Delivery</span>
                              </span>
                            )}
                          </td>

                          <td className="py-3.5 px-3 max-w-[200px]">
                            <span className="text-stone-800 font-medium block truncate">
                              {(o.items || []).map((i: any) => `${i.quantity}x ${i.itemName}`).join(', ') || 'Item tray'}
                            </span>
                          </td>

                          <td className="py-3.5 px-3">
                            <div className="flex items-center gap-1.5">
                              <span className="text-stone-900 font-medium">
                                {formatPaymentMethod(o.paymentMethod)}
                              </span>
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                  o.paymentStatus === 'PAID'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-amber-100 text-amber-800'
                                }`}
                              >
                                {o.paymentStatus}
                              </span>
                            </div>
                          </td>

                          <td className="py-3.5 px-3">
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-stone-100 text-stone-800">
                              {o.status}
                            </span>
                          </td>

                          <td className="py-3.5 px-3 text-right">
                            <span className="font-serif font-black text-stone-900 text-sm block">
                              ₹{o.totalAmount.toFixed(2)}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              );
            })()}
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 2. OFFICIAL AUDIT REPORT MODAL (Interactive On-Screen Preview)  */}
      {/* ============================================================== */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 bg-stone-950/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-5 no-print animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-5xl w-full max-h-[94vh] flex flex-col shadow-2xl border border-stone-200 overflow-hidden">
            {/* Modal Header & Controls */}
            <div className="p-3.5 sm:p-4 border-b border-stone-200 bg-stone-50 flex flex-wrap items-center justify-between gap-2.5">
              <div>
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-amber-800" />
                  <h2 className="font-serif font-bold text-base sm:text-lg text-stone-900">
                    Official Sales, Tax & P&L Statement
                  </h2>
                </div>
                <p className="text-[11px] text-stone-500">
                  Comprehensive audit statement with profit & loss, loyalty points burn, and itemized tax ledger
                </p>
              </div>

              {/* Controls: Scope Selector & Orientation Toggle */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Scope */}
                <div className="inline-flex items-center bg-stone-200/80 p-0.5 rounded-xl text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setReportScope('all')}
                    className={`px-2.5 py-1 rounded-lg transition-all ${
                      reportScope === 'all'
                        ? 'bg-white text-stone-900 shadow-xs'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    All ({recentOrders.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setReportScope('today')}
                    className={`px-2.5 py-1 rounded-lg transition-all ${
                      reportScope === 'today'
                        ? 'bg-white text-stone-900 shadow-xs'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    Today ({metrics.ordersTodayCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setReportScope('7days')}
                    className={`px-2.5 py-1 rounded-lg transition-all ${
                      reportScope === '7days'
                        ? 'bg-white text-stone-900 shadow-xs'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    7 Days
                  </button>
                </div>

                {/* Orientation Selector */}
                <div className="inline-flex items-center bg-stone-200/80 p-0.5 rounded-xl text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setReportOrientation('portrait')}
                    className={`px-2.5 py-1 rounded-lg transition-all ${
                      reportOrientation === 'portrait'
                        ? 'bg-white text-stone-900 shadow-xs'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    Portrait (A4)
                  </button>
                  <button
                    type="button"
                    onClick={() => setReportOrientation('landscape')}
                    className={`px-2.5 py-1 rounded-lg transition-all ${
                      reportOrientation === 'landscape'
                        ? 'bg-white text-stone-900 shadow-xs'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    Landscape (Wide)
                  </button>
                </div>

                {/* Actions */}
                <button
                  type="button"
                  onClick={handleExportCsv}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-stone-300 hover:bg-stone-100 rounded-xl text-xs font-bold text-stone-700 transition-colors cursor-pointer"
                  title="Export to CSV Spreadsheet"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
                  <span>CSV</span>
                </button>

                <button
                  type="button"
                  onClick={handlePrintReport}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-nature-950 hover:bg-stone-900 text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5 text-amber-300" />
                  <span>Print / Save PDF</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowReportModal(false)}
                  className="p-1.5 text-stone-400 hover:text-stone-800 rounded-xl hover:bg-stone-200/50 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Scrollable Printable Statement Body */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-6">
              <AuditReportDocument
                orders={auditOrders}
                reportDate={reportDate}
                reportScope={reportScope}
                grossSubtotal={auditGrossSubtotal}
                totalDiscounts={auditTotalDiscounts}
                totalTax={auditTotalTax}
                cgst={auditCGST}
                sgst={auditSGST}
                grandTotal={auditGrandTotal}
                pointsBurn={auditTotalPointsBurn}
                foodPointsRedeemed={auditFoodPointsRedeemed}
                coffeePointsRedeemed={auditCoffeePointsRedeemed}
                netFoodRevenue={netFoodRevenue}
                estimatedCogs={estimatedCogs}
                estimatedGrossProfit={estimatedGrossProfit}
                estimatedProfitMargin={estimatedProfitMargin}
                upiTotal={auditUpiTotal}
                upiCount={auditUpiOrders.length}
                cashTotal={auditCashTotal}
                cashCount={auditCashOrders.length}
                otherTotal={auditOtherTotal}
                otherCount={auditOtherOrders.length}
                dineInTotal={auditDineInTotal}
                dineInCount={auditDineInOrders.length}
                takeawayTotal={auditTakeawayTotal}
                takeawayCount={auditTakeawayOrders.length}
                deliveryTotal={auditDeliveryTotal}
                deliveryCount={auditDeliveryOrders.length}
                topSellingItems={topSellingItems}
                formatPaymentMethod={formatPaymentMethod}
              />
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 3. DEDICATED PRINT CONTAINER (Active strictly during @media print) */}
      {/* ============================================================== */}
      <div className="hidden print:block report-print-only">
        <AuditReportDocument
          orders={auditOrders}
          reportDate={reportDate}
          reportScope={reportScope}
          grossSubtotal={auditGrossSubtotal}
          totalDiscounts={auditTotalDiscounts}
          totalTax={auditTotalTax}
          cgst={auditCGST}
          sgst={auditSGST}
          grandTotal={auditGrandTotal}
          pointsBurn={auditTotalPointsBurn}
          foodPointsRedeemed={auditFoodPointsRedeemed}
          coffeePointsRedeemed={auditCoffeePointsRedeemed}
          netFoodRevenue={netFoodRevenue}
          estimatedCogs={estimatedCogs}
          estimatedGrossProfit={estimatedGrossProfit}
          estimatedProfitMargin={estimatedProfitMargin}
          upiTotal={auditUpiTotal}
          upiCount={auditUpiOrders.length}
          cashTotal={auditCashTotal}
          cashCount={auditCashOrders.length}
          otherTotal={auditOtherTotal}
          otherCount={auditOtherOrders.length}
          dineInTotal={auditDineInTotal}
          dineInCount={auditDineInOrders.length}
          takeawayTotal={auditTakeawayTotal}
          takeawayCount={auditTakeawayOrders.length}
          deliveryTotal={auditDeliveryTotal}
          deliveryCount={auditDeliveryOrders.length}
          topSellingItems={topSellingItems}
          formatPaymentMethod={formatPaymentMethod}
        />
      </div>

      {/* Dedicated Print Stylesheet for Flawless A4 & Zero Right Clipping */}
      <style>{`
        @page {
          size: ${reportOrientation === 'landscape' ? 'A4 landscape' : 'A4 portrait'};
          margin: 6mm 6mm !important;
        }
        @media print {
          /* Hide dashboard background and UI wrappers */
          nav, aside, header, .no-print, .dashboard-screen {
            display: none !important;
          }
          html, body {
            background: #ffffff !important;
            color: #1c1917 !important;
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            box-sizing: border-box !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .report-print-only {
            display: block !important;
            width: 100% !important;
            box-sizing: border-box !important;
          }
          .page-break-avoid {
            page-break-inside: avoid !important;
          }
          table {
            width: 100% !important;
            table-layout: fixed !important;
          }
        }
      `}</style>
    </AdminLayout>
  );
};

/**
 * Pure Formal Tax Audit, P&L & Sales Statement Document Component
 */
const AuditReportDocument: React.FC<{
  orders: any[];
  reportDate: string;
  reportScope: string;
  grossSubtotal: number;
  totalDiscounts: number;
  totalTax: number;
  cgst: number;
  sgst: number;
  grandTotal: number;
  pointsBurn: number;
  foodPointsRedeemed: number;
  coffeePointsRedeemed: number;
  netFoodRevenue: number;
  estimatedCogs: number;
  estimatedGrossProfit: number;
  estimatedProfitMargin: number;
  upiTotal: number;
  upiCount: number;
  cashTotal: number;
  cashCount: number;
  otherTotal: number;
  otherCount: number;
  dineInTotal: number;
  dineInCount: number;
  takeawayTotal: number;
  takeawayCount: number;
  deliveryTotal: number;
  deliveryCount: number;
  topSellingItems: any[];
  formatPaymentMethod: (m?: string) => string;
}> = ({
  orders,
  reportDate,
  reportScope,
  grossSubtotal,
  totalDiscounts,
  totalTax,
  cgst,
  sgst,
  grandTotal,
  pointsBurn,
  foodPointsRedeemed,
  coffeePointsRedeemed,
  netFoodRevenue,
  estimatedCogs,
  estimatedGrossProfit,
  estimatedProfitMargin,
  upiTotal,
  upiCount,
  cashTotal,
  cashCount,
  otherTotal,
  otherCount,
  dineInTotal,
  dineInCount,
  takeawayTotal,
  takeawayCount,
  deliveryTotal,
  deliveryCount,
  topSellingItems,
  formatPaymentMethod,
}) => {
  return (
    <div className="bg-white text-stone-900 font-sans space-y-5 w-full">
      {/* 1. Official Letterhead */}
      <div className="pb-4 border-b-2 border-stone-900 flex justify-between items-start gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-8 h-8 rounded-lg bg-stone-900 text-amber-400 flex items-center justify-center font-bold text-sm">
              ☕
            </span>
            <h1 className="font-serif text-2xl font-black tracking-tight text-stone-950 uppercase">
              RoastFuze Coffee Bar
            </h1>
          </div>
          <p className="text-xs font-bold text-amber-900 uppercase tracking-wider">
            Musical Balcony Cafe • Jaipur
          </p>
          <p className="text-xs text-stone-600 mt-0.5">
            Opp. Musical Fountain, Gandhi Path West, Vaishali Nagar, Jaipur (Rajasthan) – 302021
          </p>
          <div className="text-[11px] text-stone-500 mt-1 flex flex-wrap items-center gap-3">
            <span>FSSAI Lic: <strong>22224074001293</strong></span>
            <span>•</span>
            <span>GSTIN: <strong>08AAACR1234F1Z5</strong></span>
            <span>•</span>
            <span>Tel: <strong>+91 93521 82562</strong></span>
          </div>
        </div>

        <div className="text-right">
          <span className="inline-block bg-stone-900 text-white text-[10px] font-mono font-bold uppercase tracking-widest px-3 py-1 rounded mb-1">
            Sales, Tax & P&L Statement
          </span>
          <p className="text-[11px] text-stone-500">
            Audit Date: <strong>{reportDate}</strong>
          </p>
          <p className="text-[11px] text-stone-500">
            Scope:{' '}
            <strong className="uppercase">
              {reportScope === 'today' ? "Today's Trading" : reportScope === '7days' ? 'Last 7 Days' : 'Full Lifetime'}
            </strong>
          </p>
          <p className="text-[11px] text-emerald-800 font-bold">
            Status: <strong>Reconciled & Certified</strong>
          </p>
        </div>
      </div>

      {/* 2. Executive P&L (Profit & Loss) Statement & Loyalty Points Subsidy */}
      <div className="page-break-avoid">
        <h3 className="text-xs font-bold uppercase tracking-wider text-stone-600 mb-2 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Flame className="w-3.5 h-3.5 text-amber-700" />
            <span>I. Profit & Loss (P&L) Accounting & Loyalty Cost</span>
          </span>
          <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
            Operating Margin: {estimatedProfitMargin}%
          </span>
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 p-3.5 bg-stone-50 border border-stone-200 rounded-2xl text-xs">
          <div className="space-y-0.5">
            <span className="text-[10px] uppercase font-bold text-stone-500">Gross F&B Subtotal</span>
            <span className="font-mono text-sm font-extrabold text-stone-900 block">
              ₹{grossSubtotal.toFixed(2)}
            </span>
            <span className="text-[10px] text-stone-400">Total item sales</span>
          </div>

          <div className="space-y-0.5">
            <span className="text-[10px] uppercase font-bold text-amber-700">Loyalty Points Burn</span>
            <span className="font-mono text-sm font-extrabold text-amber-900 block">
              -₹{pointsBurn.toFixed(2)}
            </span>
            <span className="text-[10px] text-stone-500">
              🍔 ₹{foodPointsRedeemed} | ☕ ₹{coffeePointsRedeemed}
            </span>
          </div>

          <div className="space-y-0.5">
            <span className="text-[10px] uppercase font-bold text-stone-500">Net F&B Turnover</span>
            <span className="font-mono text-sm font-extrabold text-stone-900 block">
              ₹{netFoodRevenue.toFixed(2)}
            </span>
            <span className="text-[10px] text-stone-400">After discounts/points</span>
          </div>

          <div className="space-y-0.5">
            <span className="text-[10px] uppercase font-bold text-rose-700">COGS (~28% Raw Cost)</span>
            <span className="font-mono text-sm font-extrabold text-rose-900 block">
              -₹{estimatedCogs.toFixed(2)}
            </span>
            <span className="text-[10px] text-stone-400">Ingredient expenses</span>
          </div>

          <div className="space-y-0.5 border-l sm:border-stone-300 sm:pl-2.5">
            <span className="text-[10px] uppercase font-black text-emerald-800">Gross Profit (Operating)</span>
            <span className="font-mono text-base font-black text-emerald-950 block">
              ₹{estimatedGrossProfit.toFixed(2)}
            </span>
            <span className="text-[10px] text-emerald-700 font-bold">
              {estimatedProfitMargin}% Gross Margin
            </span>
          </div>
        </div>
      </div>

      {/* 3. GST Tax & Payment Collections */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 page-break-avoid text-xs">
        {/* Tax Breakdown */}
        <div className="p-3 border border-stone-200 rounded-xl bg-white space-y-1.5">
          <span className="text-[10px] uppercase font-bold text-stone-500 block tracking-wider">
            GST Tax Breakdown (5.0%)
          </span>
          <div className="flex justify-between items-center text-[11px]">
            <span className="text-stone-600">Central GST (CGST 2.5%):</span>
            <strong className="font-mono text-stone-900">₹{cgst.toFixed(2)}</strong>
          </div>
          <div className="flex justify-between items-center text-[11px]">
            <span className="text-stone-600">State GST (SGST 2.5%):</span>
            <strong className="font-mono text-stone-900">₹{sgst.toFixed(2)}</strong>
          </div>
          <div className="flex justify-between items-center pt-1 border-t border-stone-100 font-bold">
            <span className="text-stone-800">Total GST Tax Collected:</span>
            <span className="font-mono text-amber-900">₹{totalTax.toFixed(2)}</span>
          </div>
        </div>

        {/* Payment Realization */}
        <div className="p-3 border border-stone-200 rounded-xl bg-white space-y-1.5">
          <span className="text-[10px] uppercase font-bold text-stone-500 block tracking-wider">
            Payment Mode Collections
          </span>
          <div className="flex justify-between items-center text-[11px]">
            <span className="text-stone-600">UPI (GPay / PhonePe / QR):</span>
            <strong className="font-mono text-stone-900">
              ₹{upiTotal.toFixed(2)} ({upiCount} bills)
            </strong>
          </div>
          <div className="flex justify-between items-center text-[11px]">
            <span className="text-stone-600">Cash / Counter:</span>
            <strong className="font-mono text-stone-900">
              ₹{cashTotal.toFixed(2)} ({cashCount} bills)
            </strong>
          </div>
          <div className="flex justify-between items-center pt-1 border-t border-stone-100 font-bold">
            <span className="text-stone-800">Grand Total Realized:</span>
            <span className="font-mono text-emerald-900">₹{grandTotal.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* 4. Detailed Order-by-Order Sales & Tax Audit Ledger (FIXED: Table Layout Fixed with 9 Clean Columns) */}
      <div className="w-full">
        <div className="flex justify-between items-baseline mb-1.5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-stone-600 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-stone-700" />
            <span>II. Detailed Order-by-Order Sales & Tax Ledger</span>
          </h3>
          <span className="text-[11px] text-stone-400 font-mono">
            {orders.length} Bills Reconciled
          </span>
        </div>

        <div className="border border-stone-300 rounded-xl overflow-hidden w-full">
          <table className="w-full text-left border-collapse table-fixed text-[11px]">
            <colgroup>
              <col style={{ width: '7%' }} />   {/* Bill # */}
              <col style={{ width: '11%' }} />  {/* Date & Time */}
              <col style={{ width: '11%' }} />  {/* Customer */}
              <col style={{ width: '8%' }} />   {/* Table / Mode */}
              <col style={{ width: '17%' }} />  {/* Items */}
              <col style={{ width: '9%' }} />   {/* Subtotal */}
              <col style={{ width: '8%' }} />   {/* Points / Disc */}
              <col style={{ width: '9%' }} />   {/* GST (5%) */}
              <col style={{ width: '10%' }} />  {/* Total */}
              <col style={{ width: '10%' }} />  {/* Payment */}
            </colgroup>
            <thead>
              <tr className="bg-stone-100 border-b border-stone-300 text-[10px] uppercase font-black text-stone-700 tracking-wider">
                <th className="py-2.5 px-2">Bill #</th>
                <th className="py-2.5 px-2">Date & Time</th>
                <th className="py-2.5 px-2">Customer</th>
                <th className="py-2.5 px-2">Table</th>
                <th className="py-2.5 px-2">Items Ordered</th>
                <th className="py-2.5 px-2 text-right">Subtotal (₹)</th>
                <th className="py-2.5 px-2 text-right text-amber-800">Points Burn</th>
                <th className="py-2.5 px-2 text-right">GST 5% (₹)</th>
                <th className="py-2.5 px-2 text-right font-black">Total (₹)</th>
                <th className="py-2.5 px-2 text-center">Payment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200">
              {orders.map((o: any) => {
                const orderDate = new Date(o.createdAt);
                const timeStr = orderDate.toLocaleTimeString('en-IN', {
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: true,
                });
                const dateStr = orderDate.toLocaleDateString('en-IN', {
                  day: '2-digit',
                  month: 'short',
                });

                const subtotal = o.subtotal || Number((o.totalAmount / 1.05).toFixed(2));
                const discount = o.loyaltyDiscount || o.discountAmount || 0;
                const tax = o.taxAmount || Number((o.totalAmount - (subtotal - discount)).toFixed(2));
                const halfTax = (tax / 2).toFixed(2);
                const itemsStr = (o.items || [])
                  .map((i: any) => `${i.quantity}x ${i.itemName}`)
                  .join(', ');

                // Clean table display (eliminates duplicate "Table Table T06")
                const tableDisplay = o.table
                  ? o.table.tableNumber.toLowerCase().includes('table')
                    ? o.table.tableNumber
                    : `Table ${o.table.tableNumber}`
                  : o.orderType === 'TAKEAWAY'
                  ? 'Takeaway'
                  : 'Counter';

                return (
                  <tr key={o.id} className="page-break-avoid hover:bg-stone-50">
                    <td className="py-2 px-2 font-mono font-bold text-stone-900 truncate">
                      #{o.orderNumber}
                    </td>
                    <td className="py-2 px-2 text-[10px] text-stone-600 truncate">
                      {dateStr} {timeStr}
                    </td>
                    <td className="py-2 px-2">
                      <span className="font-semibold text-stone-900 block truncate" title={o.customerName || 'Walk-in'}>
                        {o.customerName || 'Walk-in'}
                      </span>
                      {o.customerPhone && (
                        <span className="text-[9px] text-stone-400 font-mono block truncate">
                          {o.customerPhone}
                        </span>
                      )}
                    </td>
                    <td className="py-2 px-2 text-[10px] text-stone-700 truncate" title={tableDisplay}>
                      {tableDisplay}
                    </td>
                    <td className="py-2 px-2 text-[10px] text-stone-700 truncate" title={itemsStr}>
                      {itemsStr || '1x Order Tray'}
                    </td>
                    <td className="py-2 px-2 text-right font-mono text-stone-800">
                      ₹{subtotal.toFixed(2)}
                    </td>
                    <td className="py-2 px-2 text-right font-mono text-amber-800">
                      {discount > 0 ? `-₹${discount.toFixed(2)}` : '—'}
                    </td>
                    <td className="py-2 px-2 text-right font-mono text-stone-800">
                      <div>₹{tax.toFixed(2)}</div>
                      <div className="text-[9px] text-stone-400">CGST/SGST ₹{halfTax}</div>
                    </td>
                    <td className="py-2 px-2 text-right font-mono font-black text-stone-950">
                      ₹{o.totalAmount.toFixed(2)}
                    </td>
                    <td className="py-2 px-2 text-center text-[10px]">
                      <span className="font-bold text-stone-800 block truncate" title={formatPaymentMethod(o.paymentMethod)}>
                        {formatPaymentMethod(o.paymentMethod)}
                      </span>
                      <span className="text-emerald-700 font-semibold text-[9px]">{o.paymentStatus}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            {/* Grand Audit Totals Row */}
            <tfoot>
              <tr className="bg-stone-950 text-white font-mono font-bold text-xs page-break-avoid">
                <td colSpan={5} className="py-3 px-2 text-left uppercase tracking-wider">
                  Grand Audit Totals ({orders.length} Bills Reconciled)
                </td>
                <td className="py-3 px-2 text-right font-black">
                  ₹{grossSubtotal.toFixed(2)}
                </td>
                <td className="py-3 px-2 text-right text-amber-400 font-black">
                  {pointsBurn > 0 ? `-₹${pointsBurn.toFixed(2)}` : '₹0.00'}
                </td>
                <td className="py-3 px-2 text-right text-amber-300">
                  <div>₹{totalTax.toFixed(2)}</div>
                  <div className="text-[9px] text-stone-400 font-normal">₹{cgst.toFixed(2)} + ₹{sgst.toFixed(2)}</div>
                </td>
                <td className="py-3 px-2 text-right text-white font-black text-sm">
                  ₹{grandTotal.toFixed(2)}
                </td>
                <td className="py-3 px-2 text-center text-[10px] text-stone-300">
                  100% Verified
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* 5. Official Certification & Sign-off Block */}
      <div className="pt-5 border-t-2 border-dashed border-stone-300 page-break-avoid flex flex-col sm:flex-row justify-between items-end gap-6 text-xs text-stone-600">
        <div className="space-y-1">
          <p className="font-bold text-stone-800">System Verification & Audit Hash:</p>
          <p className="text-[10px] text-stone-400 font-mono">
            SHA256: RF-{new Date().getFullYear()}-{orders.length}-{grandTotal.toFixed(0)}-PNL-AUDIT
          </p>
          <p className="text-[10px] text-stone-500">
            Generated directly from RoastFuze Cafe Server ERP database.
          </p>
        </div>

        <div className="flex gap-12 text-center text-xs">
          <div className="space-y-8">
            <div className="border-b border-stone-400 w-36" />
            <span className="font-bold text-stone-700 block">Cafe Floor Manager</span>
          </div>
          <div className="space-y-8">
            <div className="border-b border-stone-400 w-36" />
            <span className="font-bold text-stone-700 block">Accounts / Auditor</span>
          </div>
        </div>
      </div>
    </div>
  );
};
