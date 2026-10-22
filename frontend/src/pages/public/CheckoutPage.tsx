import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ShieldCheck,
  CreditCard,
  Banknote,
  Store,
  QrCode,
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import { Navbar } from '../../components/layout/Navbar';
import { Footer } from '../../components/layout/Footer';
import { useCart } from '../../context/CartContext';
import { api } from '../../services/api';

export const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const { items, tableToken, tableInfo, discountCode, clearCart, subtotal } = useCart();

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [orderType, setOrderType] = useState<'DINE_IN' | 'TAKEAWAY'>(tableToken ? 'DINE_IN' : 'TAKEAWAY');
  const [paymentMethod, setPaymentMethod] = useState<'PAY_AT_COUNTER' | 'UPI' | 'RAZORPAY'>('PAY_AT_COUNTER');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (items.length === 0) {
    navigate('/cart');
    return null;
  }

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (orderType === 'DINE_IN' && !tableToken) {
      setError('Please scan a table QR code or select takeaway.');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await api.createOrder({
        restaurantSlug: 'switea',
        tableToken: orderType === 'DINE_IN' ? tableToken : undefined,
        orderType,
        customerName: customerName.trim() || undefined,
        customerPhone: customerPhone.trim() || undefined,
        notes: notes.trim() || undefined,
        discountCode: discountCode || undefined,
        paymentMethod,
        items: items.map((i) => ({
          menuItemId: i.menuItemId,
          variantId: i.variantId,
          modifierOptionIds: i.selectedModifiers?.map((m) => m.id),
          quantity: i.quantity,
          notes: i.notes,
        })),
      });

      clearCart();
      navigate(`/order/${res.orderToken}`);
    } catch (err: any) {
      console.error('Order creation error:', err);
      setError(err.message || 'Failed to place order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream-100 flex flex-col selection:bg-nature-200">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10 flex-1 w-full">
        <Link to="/cart" className="inline-flex items-center gap-1.5 text-xs text-stone-500 hover:text-stone-800 font-semibold mb-4">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Tray</span>
        </Link>

        <h1 className="font-serif text-3xl font-bold text-stone-900 mb-8">Confirm & Place Order</h1>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-3 text-red-900 text-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 md:grid-cols-12 gap-8">
          {/* Left inputs */}
          <div className="md:col-span-7 space-y-6">
            {/* Dining Mode Selection */}
            <div className="bg-white rounded-3xl border border-stone-200 p-6 shadow-soft">
              <h2 className="font-serif font-bold text-base text-stone-900 mb-3">Order Type</h2>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setOrderType('DINE_IN')}
                  className={`p-4 rounded-2xl border text-center transition-all ${
                    orderType === 'DINE_IN'
                      ? 'border-nature-900 bg-nature-50 text-nature-950 font-bold ring-2 ring-nature-900/10'
                      : 'border-stone-200 text-stone-600 hover:bg-stone-50'
                  }`}
                >
                  <span className="block text-sm">Dine-in at Cafe</span>
                  {tableInfo && (
                    <span className="text-[11px] text-nature-700 block mt-0.5">
                      {tableInfo.tableNumber}
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setOrderType('TAKEAWAY')}
                  className={`p-4 rounded-2xl border text-center transition-all ${
                    orderType === 'TAKEAWAY'
                      ? 'border-nature-900 bg-nature-50 text-nature-950 font-bold ring-2 ring-nature-900/10'
                      : 'border-stone-200 text-stone-600 hover:bg-stone-50'
                  }`}
                >
                  <span className="block text-sm">Takeaway / Parcel</span>
                  <span className="text-[11px] text-stone-400 block mt-0.5">Self-Pickup</span>
                </button>
              </div>
            </div>

            {/* Customer Details */}
            <div className="bg-white rounded-3xl border border-stone-200 p-6 shadow-soft space-y-4">
              <h2 className="font-serif font-bold text-base text-stone-900">Contact Details</h2>

              <div>
                <label className="text-xs uppercase tracking-wider font-bold text-stone-600 block mb-1.5">
                  Your Name (Optional)
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                  className="w-full px-4 py-3 rounded-xl border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-nature-800"
                />
              </div>

              <div>
                <label className="text-xs uppercase tracking-wider font-bold text-stone-600 block mb-1.5">
                  Phone Number (For Order Updates)
                </label>
                <input
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="+91 98000 00000"
                  className="w-full px-4 py-3 rounded-xl border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-nature-800"
                />
              </div>

              <div>
                <label className="text-xs uppercase tracking-wider font-bold text-stone-600 block mb-1.5">
                  Dining Notes / Special Requests
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any allergies or seating requests?"
                  rows={2}
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-nature-800"
                />
              </div>
            </div>

            {/* Payment Method */}
            <div className="bg-white rounded-3xl border border-stone-200 p-6 shadow-soft space-y-3">
              <h2 className="font-serif font-bold text-base text-stone-900 mb-2">Payment Method</h2>

              <div className="space-y-2">
                {[
                  { id: 'PAY_AT_COUNTER', label: 'Pay at Counter (Cash / Card)', desc: 'Pay with cash or card directly at the billing counter', icon: Store },
                  { id: 'UPI', label: 'UPI / Dynamic QR', desc: 'Scan QR with Google Pay, PhonePe, Paytm', icon: QrCode },
                  { id: 'RAZORPAY', label: 'Online Payment (Cards / NetBanking)', desc: 'Instant & secure payment gateway', icon: CreditCard },
                ].map((m) => {
                  const Icon = m.icon;
                  const isSelected = paymentMethod === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setPaymentMethod(m.id as any)}
                      className={`w-full p-3.5 rounded-2xl border flex items-center justify-between text-left transition-all ${
                        isSelected
                          ? 'border-nature-900 bg-nature-50/70 ring-2 ring-nature-900/10'
                          : 'border-stone-200 hover:bg-stone-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${isSelected ? 'bg-nature-900 text-white' : 'bg-stone-100 text-stone-600'}`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div>
                          <span className="font-semibold text-sm text-stone-900 block">{m.label}</span>
                          <span className="text-xs text-stone-500">{m.desc}</span>
                        </div>
                      </div>
                      <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${isSelected ? 'border-nature-900 bg-nature-900 text-white' : 'border-stone-300'}`}>
                        {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right summary and submit */}
          <div className="md:col-span-5 space-y-6">
            <div className="bg-white rounded-3xl border border-stone-200 p-6 shadow-soft space-y-4">
              <h2 className="font-serif font-bold text-lg text-stone-900 pb-2 border-b border-stone-100">
                Order Review
              </h2>

              <div className="space-y-3 max-h-60 overflow-y-auto divide-y divide-stone-100 pr-1">
                {items.map((item, idx) => (
                  <div key={idx} className="pt-2 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-semibold text-stone-800">{item.name}</span>
                      {item.variantName && <span className="text-stone-400 block">({item.variantName})</span>}
                      <span className="text-stone-500 block">Qty: {item.quantity}</span>
                    </div>
                    <span className="font-bold text-stone-900">₹{(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="pt-3 border-t border-stone-200 space-y-2 text-xs text-stone-600">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-semibold text-stone-900">₹{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>GST (5%)</span>
                  <span className="font-semibold text-stone-900">₹{((subtotal * 0.05)).toFixed(2)}</span>
                </div>
                <div className="pt-2 border-t border-stone-100 flex justify-between text-sm font-extrabold text-nature-950">
                  <span>Total Amount</span>
                  <span>₹{(subtotal * 1.05).toFixed(2)}</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-nature-900 hover:bg-nature-950 text-white py-4 rounded-2xl font-bold text-base shadow-card transition-all flex items-center justify-center gap-2 mt-4 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Lock className="w-4 h-4 text-nature-300" />
                    <span>Confirm Order</span>
                  </>
                )}
              </button>

              <p className="text-[11px] text-stone-400 text-center flex items-center justify-center gap-1 pt-1">
                <ShieldCheck className="w-3.5 h-3.5 text-nature-700" />
                <span>Verified Switea table ordering system</span>
              </p>
            </div>
          </div>
        </form>
      </main>

      <Footer />
    </div>
  );
};
