import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import {
  CheckCircle2,
  Clock,
  ArrowLeft,
  Printer,
  Share2,
  MessageCircle,
  ShieldCheck,
  Coffee,
  AlertCircle,
  Gift,
  Receipt,
  FileCheck,
} from 'lucide-react';
import { api } from '../../services/api';
import { Order } from '../../types';

export const BillPage: React.FC = () => {
  const { orderToken } = useParams<{ orderToken: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [viewMode, setViewMode] = useState<'standard' | 'thermal'>('standard');

  useEffect(() => {
    if (!orderToken) return;

    async function fetchBill() {
      try {
        setLoading(true);
        const data = await api.getOrderStatus(orderToken!);
        setOrder(data);
      } catch (err: any) {
        setError('Bill not found or link has expired.');
      } finally {
        setLoading(false);
      }
    }

    fetchBill();
  }, [orderToken]);

  // Handle auto-print if ?print=1 or ?autoPrint=true
  useEffect(() => {
    if (!loading && order) {
      const searchParams = new URLSearchParams(window.location.search);
      if (
        searchParams.get('print') === '1' ||
        searchParams.get('print') === 'true' ||
        searchParams.get('autoPrint') === 'true'
      ) {
        const timer = setTimeout(() => {
          window.print();
        }, 500);
        return () => clearTimeout(timer);
      }
    }
  }, [loading, order]);

  const handlePrint = () => {
    window.print();
  };

  const handleShareWhatsApp = () => {
    if (!order) return;
    const currentUrl = window.location.href.split('?')[0];
    const text = [
      '☕ *ROASTFUZE COFFEE BAR*',
      'Musical Balcony Cafe • Jaipur',
      '--------------------------------',
      `Namaste *${order.customerName || 'Guest'}* ji! 🙏`,
      'Thank you for dining at RoastFuze Coffee Bar!',
      '',
      `🧾 *Bill Number:* #${order.orderNumber}`,
      `💰 *Total Amount:* ₹${order.totalAmount.toFixed(2)} (${order.paymentStatus === 'PAID' ? 'PAID' : 'PENDING'})`,
      `📍 *Seating:* ${order.table ? `${order.table.tableNumber} (${order.table.name})` : 'Takeaway / Parcel'}`,
      `📅 *Date:* ${new Date(order.createdAt).toLocaleString('en-IN')}`,
      '',
      '🔗 *View & Download Your Official Tax Bill:*',
      currentUrl,
      '',
      '❤️ Hope you enjoyed the live balcony sunset & coffee vibes!',
    ].join('\n');

    const phone = (order.customerPhone || '').replace(/\D/g, '');
    const url = phone
      ? `https://wa.me/${phone}?text=${encodeURIComponent(text)}`
      : `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href.split('?')[0]);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {
      // fallback
    }
  };

  const formatPaymentMethod = (method?: string) => {
    if (!method) return 'Pay at Counter (Cash)';
    if (method === 'PAY_AT_COUNTER' || method === 'CASH') return 'Cash / Pay at Counter';
    if (method === 'UPI') return 'UPI (GPay / PhonePe / Paytm)';
    if (method === 'CARD') return 'Credit / Debit Card';
    if (method === 'SWIGGY') return 'Swiggy Prepaid';
    if (method === 'ZOMATO') return 'Zomato Prepaid';
    return method;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-100 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full border-4 border-nature-900 border-t-transparent animate-spin mx-auto mb-3" />
          <p className="font-serif text-lg font-bold text-stone-800">Loading Official Bill...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-stone-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 text-center shadow-soft border border-stone-200">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
          <h2 className="font-serif text-2xl font-bold text-stone-900 mb-2">Bill Not Found</h2>
          <p className="text-xs text-stone-500 mb-6">{error || 'Unable to retrieve this invoice.'}</p>
          <Link
            to="/menu"
            className="inline-block bg-nature-950 text-white text-xs font-bold px-6 py-3 rounded-full"
          >
            Go to Menu
          </Link>
        </div>
      </div>
    );
  }

  // Access check: Admin or Served/Completed/Paid
  const searchParams =
    typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams();
  const isAdminView =
    searchParams.get('admin') === 'true' ||
    searchParams.get('print') === '1' ||
    (typeof window !== 'undefined' &&
      Boolean(localStorage.getItem('admin_token') || localStorage.getItem('switea_token')));

  const isEligibleToView =
    isAdminView ||
    order.status === 'SERVED' ||
    order.paymentStatus === 'PAID';

  if (!isEligibleToView) {
    return (
      <div className="min-h-screen bg-stone-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 text-center shadow-card border border-stone-200">
          <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-900 flex items-center justify-center mx-auto mb-4 font-bold">
            <Clock className="w-7 h-7 text-amber-800" />
          </div>
          <span className="text-xs font-bold uppercase tracking-widest text-amber-800 bg-amber-50 px-3.5 py-1 rounded-full border border-amber-200 inline-block mb-3">
            Order In Kitchen
          </span>
          <h2 className="font-serif text-2xl font-bold text-stone-900 mb-2">
            Bill Unlocks on Service
          </h2>
          <p className="text-xs text-stone-500 mb-6">
            Aapka official tax invoice order (#{order.orderNumber}) kitchen se <strong>Served</strong> hone ke baad ya Payment complete hone par yahan available hoga.
          </p>
          <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200 text-xs text-stone-700 font-semibold mb-6 flex items-center justify-between">
            <span>Kitchen Status:</span>
            <strong className="text-amber-900 bg-amber-100 px-2.5 py-0.5 rounded-lg">{order.status}</strong>
          </div>
          <Link
            to={`/order/${order.orderToken}`}
            className="w-full inline-block bg-nature-950 text-white text-xs font-bold px-6 py-3.5 rounded-xl shadow-sm hover:bg-stone-900 transition-colors"
          >
            ← Track Live Order Status
          </Link>
        </div>
      </div>
    );
  }

  const billUrl = typeof window !== 'undefined' ? window.location.href.split('?')[0] : '';
  const isPaid = order.paymentStatus === 'PAID';
  const taxHalf = (order.taxAmount / 2).toFixed(2);

  return (
    <div className="min-h-screen bg-stone-100 text-stone-800 flex flex-col items-center py-6 sm:py-10 px-4 selection:bg-amber-200">
      {/* Top Floating Control Bar (Hidden when printing) */}
      <div className="no-print w-full max-w-xl mb-6 flex flex-wrap items-center justify-between gap-3">
        <Link
          to={`/order/${order.orderToken}`}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-stone-600 hover:text-stone-950 bg-white border border-stone-200 px-3.5 py-2 rounded-xl shadow-xs transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Live Tracking</span>
        </Link>

        {/* View Mode Toggle: Standard A4 vs 80mm Thermal POS */}
        <div className="inline-flex items-center bg-stone-200/80 p-0.5 rounded-xl text-xs font-bold">
          <button
            type="button"
            onClick={() => setViewMode('standard')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              viewMode === 'standard' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <FileCheck className="w-3.5 h-3.5" />
            <span>Tax Invoice (A4)</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('thermal')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              viewMode === 'thermal' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Receipt className="w-3.5 h-3.5" />
            <span>Thermal POS (80mm)</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopyLink}
            className="inline-flex items-center gap-1 text-xs font-semibold text-stone-700 hover:text-stone-950 bg-white border border-stone-200 px-3 py-2 rounded-xl shadow-xs transition-colors"
            title="Copy Bill Link"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{copiedLink ? 'Copied!' : 'Copy Link'}</span>
          </button>

          <button
            type="button"
            onClick={handleShareWhatsApp}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-green-700 hover:bg-green-800 px-3.5 py-2 rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            <span>WhatsApp</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-nature-950 hover:bg-stone-900 px-4 py-2 rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-amber-300" />
            <span>Print / PDF</span>
          </button>
        </div>
      </div>

      {/* MODE 1: Standard A4 Tax Invoice */}
      {viewMode === 'standard' && (
        <main
          id="printable-bill"
          className="w-full max-w-xl bg-white rounded-3xl shadow-card border border-stone-200 p-6 sm:p-10 relative overflow-hidden transition-all"
        >
          {/* Decorative Top Accent Stripe */}
          <div className="h-2 bg-gradient-to-r from-amber-600 via-stone-800 to-amber-700 absolute top-0 left-0 right-0" />

          {/* Cafe Header & Branding */}
          <header className="text-center pb-6 border-b-2 border-dashed border-stone-200 pt-2">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto mb-3 text-amber-900 shadow-xs">
              <Coffee className="w-7 h-7" />
            </div>

            <h1 className="font-serif text-2xl sm:text-3xl font-extrabold text-stone-950 tracking-tight">
              RoastFuze Coffee Bar
            </h1>
            <p className="text-xs uppercase font-bold tracking-widest text-amber-900 mt-1">
              Musical Balcony Cafe • Jaipur
            </p>
            <p className="text-xs text-stone-500 mt-1">
              Opp. Musical Fountain, Gandhi Path West, Vaishali Nagar, Jaipur – 302021
            </p>
            <div className="text-[11px] text-stone-500 mt-1 flex flex-wrap items-center justify-center gap-3">
              <span>FSSAI: <strong>22224074001293</strong></span>
              <span>•</span>
              <span>GSTIN: <strong>08AAACR1234F1Z5</strong></span>
              <span>•</span>
              <span>Tel: <strong>+91 93521 82562</strong></span>
            </div>

            {/* Official Tax Invoice Title */}
            <div className="mt-4 inline-block bg-stone-100 border border-stone-200 text-stone-800 text-[11px] font-extrabold uppercase tracking-widest px-4 py-1 rounded-full">
              Official Tax Invoice & Receipt
            </div>
          </header>

          {/* Invoice Metadata Box */}
          <section className="py-5 border-b border-stone-100 grid grid-cols-2 gap-y-3 gap-x-4 text-xs">
            <div>
              <span className="text-[10px] uppercase font-bold text-stone-400 block tracking-wider">
                Invoice / Bill No.
              </span>
              <span className="font-mono text-sm font-extrabold text-stone-900">
                #{order.orderNumber}
              </span>
            </div>

            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-stone-400 block tracking-wider">
                Date & Time
              </span>
              <span className="font-medium text-stone-800">
                {new Date(order.createdAt).toLocaleDateString('en-IN', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                })}{' '}
                • {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>

            <div>
              <span className="text-[10px] uppercase font-bold text-stone-400 block tracking-wider">
                Customer Details
              </span>
              <span className="font-bold text-stone-900 block">
                {order.customerName || 'Walk-in Guest'}
              </span>
              {order.customerPhone ? (
                <span className="text-[11px] text-stone-500 font-mono">
                  {order.customerPhone}
                </span>
              ) : (
                <span className="text-[11px] text-stone-400">Phone not provided</span>
              )}
            </div>

            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-stone-400 block tracking-wider">
                Dining Mode / Table
              </span>
              {order.table ? (
                <span className="font-bold text-emerald-800 block">
                  Table {order.table.tableNumber} • {order.table.name}
                </span>
              ) : (
                <span className="font-bold text-stone-700 block">Takeaway / Self-Pickup</span>
              )}
              <span className="text-[10px] text-stone-400">
                {order.table?.section || 'RoastFuze Cafe Counter'}
              </span>
            </div>
          </section>

          {/* Payment Status Stamp */}
          <section className="py-3 flex items-center justify-between bg-stone-50/70 -mx-6 sm:-mx-10 px-6 sm:px-10 border-b border-stone-100">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">
                Payment Status:
              </span>
              <span
                className={`px-3 py-0.5 rounded-full text-xs font-extrabold flex items-center gap-1 ${
                  isPaid
                    ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                    : 'bg-amber-100 text-amber-900 border border-amber-300'
                }`}
              >
                {isPaid ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" /> : <Clock className="w-3.5 h-3.5" />}
                <span>{isPaid ? 'PAID' : 'PAYMENT PENDING'}</span>
              </span>
            </div>

            <span className="text-xs font-semibold text-stone-600">
              Method:{' '}
              <strong className="text-stone-900 font-bold">
                {formatPaymentMethod(order.paymentMethod)}
              </strong>
            </span>
          </section>

          {/* Itemized Table */}
          <section className="py-6 border-b-2 border-stone-900">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-stone-200 text-[10px] uppercase font-extrabold text-stone-400 tracking-wider">
                  <th className="pb-2.5">Item Description</th>
                  <th className="pb-2.5 text-center">Qty</th>
                  <th className="pb-2.5 text-right">Price</th>
                  <th className="pb-2.5 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-xs">
                {order.items?.map((item) => (
                  <tr key={item.id} className="py-2.5">
                    <td className="py-3 pr-2">
                      <span className="font-bold text-stone-900 block">{item.itemName}</span>
                      {item.modifiers && item.modifiers.length > 0 && (
                        <span className="text-[11px] text-stone-500 block mt-0.5">
                          +{item.modifiers.map((m: any) => m.modifierName).join(', ')}
                        </span>
                      )}
                    </td>
                    <td className="py-3 text-center font-mono font-semibold text-stone-700">
                      {item.quantity}
                    </td>
                    <td className="py-3 text-right font-mono text-stone-600">
                      ₹{item.unitPrice.toFixed(2)}
                    </td>
                    <td className="py-3 text-right font-mono font-bold text-stone-950">
                      ₹{item.totalPrice.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          {/* Totals & Calculations */}
          <section className="py-5 border-b border-dashed border-stone-200 text-xs space-y-2">
            <div className="flex justify-between text-stone-600">
              <span>Item Subtotal</span>
              <span className="font-mono font-semibold text-stone-900">
                ₹{order.subtotal.toFixed(2)}
              </span>
            </div>

            {order.discountAmount > 0 && (
              <div className="flex justify-between text-emerald-700 font-medium">
                <span>Coupon Discount</span>
                <span className="font-mono">-₹{order.discountAmount.toFixed(2)}</span>
              </div>
            )}

            {order.foodPointsRedeemed && order.foodPointsRedeemed > 0 ? (
              <div className="flex justify-between text-emerald-800 font-medium">
                <span>🍔 Food Loyalty Points Redeemed ({order.foodPointsRedeemed} Pts)</span>
                <span className="font-mono">-₹{order.foodPointsRedeemed.toFixed(2)}</span>
              </div>
            ) : null}

            {order.coffeePointsRedeemed && order.coffeePointsRedeemed > 0 ? (
              <div className="flex justify-between text-amber-800 font-medium">
                <span>☕ Coffee Loyalty Points Redeemed ({order.coffeePointsRedeemed} Pts)</span>
                <span className="font-mono">-₹{order.coffeePointsRedeemed.toFixed(2)}</span>
              </div>
            ) : null}

            <div className="flex justify-between text-stone-500 text-[11px]">
              <span>CGST (2.5%)</span>
              <span className="font-mono">₹{taxHalf}</span>
            </div>
            <div className="flex justify-between text-stone-500 text-[11px]">
              <span>SGST (2.5%)</span>
              <span className="font-mono">₹{taxHalf}</span>
            </div>

            <div className="pt-3 border-t-2 border-stone-900 flex justify-between items-baseline">
              <div>
                <span className="font-serif text-lg font-black text-stone-950 block">
                  Grand Total
                </span>
                <span className="text-[10px] text-stone-400 uppercase tracking-wider font-semibold">
                  (Inclusive of all taxes)
                </span>
              </div>
              <div className="text-right">
                <span className="font-serif text-2xl font-black text-stone-950">
                  ₹{order.totalAmount.toFixed(2)}
                </span>
              </div>
            </div>
          </section>

          {/* Loyalty Reward Banner */}
          {((order.foodPointsEarned && order.foodPointsEarned > 0) ||
            (order.coffeePointsEarned && order.coffeePointsEarned > 0)) && (
            <section className="my-5 p-4 bg-gradient-to-br from-amber-50 to-emerald-50 rounded-2xl border border-amber-200/80 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-400 text-stone-950 flex items-center justify-center font-bold">
                  <Gift className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-bold text-stone-900 block">
                    Loyalty Points Rewarded on this Bill
                  </span>
                  <span className="text-[11px] text-stone-500">
                    {order.foodPointsEarned && order.foodPointsEarned > 0 ? (
                      <>Dual Rewards: 🍔 +{order.foodPointsEarned} Food Pts &nbsp;|&nbsp; ☕ +{order.coffeePointsEarned || 0} Coffee Pts</>
                    ) : (
                      <>Coffee Rewards: ☕ +{order.coffeePointsEarned || 0} Coffee Pts</>
                    )}
                  </span>
                </div>
              </div>
              <span className="px-2.5 py-1 bg-white text-stone-800 rounded-lg border border-amber-200 text-[11px] font-bold">
                1 Pt = ₹1
              </span>
            </section>
          )}

          {/* QR Code Verification & Footer Message */}
          <footer className="pt-6 text-center space-y-4">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-left">
              <div className="p-2 bg-white rounded-xl border border-stone-200 shadow-2xs">
                <QRCodeSVG value={billUrl} size={72} level="M" />
              </div>
              <div className="text-center sm:text-left">
                <span className="text-xs font-bold text-stone-900 block flex items-center justify-center sm:justify-start gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Verified Digital Tax Invoice</span>
                </span>
                <p className="text-[11px] text-stone-500 mt-0.5">
                  Scan this QR code with any camera to verify this bill on RoastFuze server.
                </p>
                <span className="text-[10px] text-stone-400 font-mono mt-1 block">
                  Token: {order.orderToken}
                </span>
              </div>
            </div>

            <div className="pt-4 border-t border-stone-100 text-center">
              <p className="font-serif italic text-sm text-stone-800 font-medium">
                "Good coffee, live music, and unforgettable balcony sunsets."
              </p>
              <p className="text-[11px] text-stone-400 mt-1">
                Thank you for visiting RoastFuze Coffee Bar! Follow us on Instagram: <strong>@roastfuze_coffee</strong>
              </p>
            </div>
          </footer>
        </main>
      )}

      {/* MODE 2: 80mm Thermal Receipt (POS Slip) */}
      {viewMode === 'thermal' && (
        <main
          id="printable-bill"
          className="w-full max-w-[340px] bg-white rounded-2xl shadow-card border border-stone-300 p-5 font-mono text-[12px] text-stone-900 leading-tight"
        >
          {/* Thermal Receipt Header */}
          <div className="text-center pb-3 border-b border-dashed border-stone-400">
            <h2 className="font-bold text-base tracking-wide text-stone-950 uppercase">
              ROASTFUZE COFFEE BAR
            </h2>
            <p className="text-[11px] text-stone-600">Musical Balcony Cafe • Jaipur</p>
            <p className="text-[10px] text-stone-500 mt-0.5">Opp. Musical Fountain, Vaishali Nagar</p>
            <p className="text-[10px] text-stone-500">Tel: +91 93521 82562 • FSSAI: 22224074001293</p>
            <p className="text-[10px] font-bold mt-1 text-stone-700">*** TAX INVOICE ***</p>
          </div>

          {/* Thermal Metadata */}
          <div className="py-2.5 border-b border-dashed border-stone-300 space-y-1 text-[11px]">
            <div className="flex justify-between">
              <span>BILL NO:</span>
              <strong className="font-bold">#{order.orderNumber}</strong>
            </div>
            <div className="flex justify-between">
              <span>DATE:</span>
              <span>{new Date(order.createdAt).toLocaleDateString('en-IN')} {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
            <div className="flex justify-between">
              <span>DINING:</span>
              <strong className="font-bold">{order.table ? `TABLE ${order.table.tableNumber}` : 'TAKEAWAY'}</strong>
            </div>
            <div className="flex justify-between">
              <span>GUEST:</span>
              <span>{order.customerName || 'Walk-in'}</span>
            </div>
            {order.customerPhone && (
              <div className="flex justify-between">
                <span>PHONE:</span>
                <span>{order.customerPhone}</span>
              </div>
            )}
          </div>

          {/* Thermal Items */}
          <div className="py-2.5 border-b border-dashed border-stone-300">
            <div className="flex justify-between text-[10px] uppercase font-bold text-stone-500 pb-1">
              <span>QTY & ITEM</span>
              <span>TOTAL</span>
            </div>
            <div className="space-y-1.5 mt-1">
              {order.items?.map((item) => (
                <div key={item.id} className="flex justify-between items-start">
                  <div className="flex-1 pr-2">
                    <span className="font-bold">{item.quantity}x {item.itemName}</span>
                    {item.modifiers && item.modifiers.length > 0 && (
                      <div className="text-[10px] text-stone-500">
                        +{item.modifiers.map((m: any) => m.modifierName).join(', ')}
                      </div>
                    )}
                  </div>
                  <span className="font-bold">₹{item.totalPrice.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Thermal Totals */}
          <div className="py-2.5 border-b border-dashed border-stone-400 space-y-1 text-[11px]">
            <div className="flex justify-between">
              <span>SUBTOTAL:</span>
              <span>₹{order.subtotal.toFixed(2)}</span>
            </div>
            {order.discountAmount > 0 && (
              <div className="flex justify-between">
                <span>DISCOUNT:</span>
                <span>-₹{order.discountAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-stone-600">
              <span>CGST (2.5%):</span>
              <span>₹{taxHalf}</span>
            </div>
            <div className="flex justify-between text-stone-600">
              <span>SGST (2.5%):</span>
              <span>₹{taxHalf}</span>
            </div>
            <div className="flex justify-between text-sm font-bold pt-1.5 border-t border-stone-400 text-stone-950">
              <span>TOTAL AMOUNT:</span>
              <span>₹{order.totalAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-[11px] pt-1">
              <span>STATUS:</span>
              <strong className="font-bold">{isPaid ? 'PAID' : 'PENDING'} ({formatPaymentMethod(order.paymentMethod)})</strong>
            </div>
          </div>

          {/* Thermal QR & Footer */}
          <div className="pt-3 text-center space-y-2">
            <div className="flex justify-center p-1 bg-white inline-block mx-auto border border-stone-200">
              <QRCodeSVG value={billUrl} size={64} level="M" />
            </div>
            <p className="text-[10px] text-stone-500">Scan to Verify Digital Invoice</p>
            <p className="text-[11px] font-bold text-stone-800">
              *** THANK YOU! VISIT AGAIN ***
            </p>
            <p className="text-[10px] text-stone-500">Instagram: @roastfuze_coffee</p>
          </div>
        </main>
      )}

      {/* Bottom Sticky Action on Mobile (Hidden when printing) */}
      <div className="no-print mt-6 w-full max-w-xl flex items-center justify-between gap-3 text-xs">
        <Link
          to="/menu"
          className="text-stone-600 hover:text-stone-950 font-bold underline"
        >
          ← Explore Full Menu
        </Link>
        <button
          type="button"
          onClick={handlePrint}
          className="bg-stone-900 hover:bg-stone-950 text-white font-bold px-5 py-2.5 rounded-full flex items-center gap-1.5 shadow-sm cursor-pointer"
        >
          <Printer className="w-3.5 h-3.5 text-amber-300" />
          <span>Save as PDF / Print</span>
        </button>
      </div>

      {/* Print Specific CSS */}
      <style>{`
        @page {
          size: ${viewMode === 'thermal' ? '80mm auto' : 'A4 portrait'};
          margin: ${viewMode === 'thermal' ? '4mm' : '8mm 10mm'};
        }
        @media print {
          .no-print {
            display: none !important;
          }
          html, body {
            background: #ffffff !important;
            color: #1c1917 !important;
            padding: 0 !important;
            margin: 0 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          #printable-bill {
            box-shadow: none !important;
            border: ${viewMode === 'thermal' ? 'none' : '1px solid #d6d3d1'} !important;
            border-radius: ${viewMode === 'thermal' ? '0' : '16px'} !important;
            max-width: ${viewMode === 'thermal' ? '100%' : '620px'} !important;
            margin: 0 auto !important;
            padding: ${viewMode === 'thermal' ? '8px' : '22px 28px'} !important;
            page-break-inside: avoid !important;
          }
        }
      `}</style>
    </div>
  );
};
