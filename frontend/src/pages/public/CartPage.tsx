import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  ArrowLeft,
  Tag,
  Sparkles,
  AlertCircle,
  Utensils,
} from 'lucide-react';
import { Navbar } from '../../components/layout/Navbar';
import { Footer } from '../../components/layout/Footer';
import { useCart } from '../../context/CartContext';
import { api } from '../../services/api';

export const CartPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    items,
    updateQuantity,
    removeItem,
    clearCart,
    tableInfo,
    discountCode,
    setDiscountCode,
  } = useCart();

  const [promoInput, setPromoInput] = useState(discountCode);
  const [calculation, setCalculation] = useState<{
    subtotal: number;
    discountAmount: number;
    taxAmount: number;
    totalAmount: number;
    discount?: { code: string; amount: number } | null;
    discountError?: string | null;
    minOrderAmount?: number | null;
  } | null>(null);
  const [calculating, setCalculating] = useState(false);
  const [promoError, setPromoError] = useState<string | null>(null);

  useEffect(() => {
    async function calculate() {
      if (items.length === 0) {
        setCalculation(null);
        return;
      }
      try {
        setCalculating(true);
        const res = await api.calculateCart({
          restaurantSlug: 'switea',
          items: items.map((i) => ({
            menuItemId: i.menuItemId,
            variantId: i.variantId,
            modifierOptionIds: (i.selectedModifiers || []).map((m) => m.id),
            quantity: i.quantity,
            notes: i.notes,
          })),
          discountCode: discountCode || undefined,
        });
        setCalculation(res);
      } catch (err) {
        console.error('Calculation error:', err);
      } finally {
        setCalculating(false);
      }
    }
    calculate();
  }, [items, discountCode]);

  const handleApplyPromo = () => {
    if (!promoInput.trim()) return;
    setDiscountCode(promoInput.trim().toUpperCase());
    setPromoError(null);
  };

  const handleRemovePromo = () => {
    setDiscountCode('');
    setPromoInput('');
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-cream-100 flex flex-col">
        <Navbar />
        <main className="flex-1 max-w-xl mx-auto px-4 py-20 text-center flex flex-col items-center justify-center">
          <div className="w-20 h-20 rounded-full bg-cream-200 flex items-center justify-center text-stone-400 mb-6">
            <ShoppingBag className="w-10 h-10" />
          </div>
          <h1 className="font-serif text-3xl font-bold text-stone-900 mb-2">Your Cart is Empty</h1>
          <p className="text-sm text-stone-500 mb-8 max-w-sm">
            Explore Switea’s handcrafted teas, artisan cold coffees, and garden delights to fill your tray.
          </p>
          <Link
            to="/menu"
            className="inline-flex items-center gap-2 bg-nature-900 text-white px-8 py-3.5 rounded-full font-bold text-sm shadow hover:bg-nature-950 transition-colors"
          >
            <Utensils className="w-4 h-4 text-nature-300" />
            <span>Browse Full Menu</span>
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream-100 flex flex-col selection:bg-nature-200">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-1 w-full">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <Link to="/menu" className="inline-flex items-center gap-1.5 text-xs text-stone-500 hover:text-stone-800 font-semibold mb-2">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Menu</span>
            </Link>
            <h1 className="font-serif text-3xl sm:text-4xl font-bold text-stone-900">Your Order Tray</h1>
          </div>
          <button
            onClick={clearCart}
            className="text-xs text-red-600 hover:text-red-800 font-medium hover:underline"
          >
            Clear All
          </button>
        </div>

        {/* Two column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Left: Cart Items */}
          <div className="lg:col-span-7 space-y-4">
            {tableInfo && (
              <div className="bg-nature-50 border border-nature-200 rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-nature-800 block">Dine-in Order</span>
                  <p className="font-serif font-bold text-base text-stone-900">
                    {tableInfo.tableNumber} — {tableInfo.name}
                  </p>
                </div>
                <span className="text-xs text-nature-700 bg-nature-200/60 px-3 py-1 rounded-full font-semibold">
                  {tableInfo.section || 'Garden Area'}
                </span>
              </div>
            )}

            <div className="bg-white rounded-3xl border border-stone-200 shadow-soft overflow-hidden divide-y divide-stone-100">
              {items.map((item, idx) => {
                const modTotal = (item.selectedModifiers || []).reduce((acc, m) => acc + m.price, 0);
                const itemTotal = (item.price + modTotal) * item.quantity;

                return (
                  <div key={`${item.menuItemId}-${item.variantId}-${idx}`} className="p-5 flex items-start gap-4">
                    {/* Item Thumbnail */}
                    <div className="w-16 h-16 rounded-xl bg-stone-100 overflow-hidden flex-shrink-0">
                      {item.image ? (
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs text-stone-400 font-serif">
                          Switea
                        </div>
                      )}
                    </div>

                    {/* Item Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-serif font-bold text-base text-stone-900 leading-snug">
                            {item.name}
                          </h3>
                          {item.variantName && (
                            <span className="text-xs text-stone-500 font-medium block">
                              Size: {item.variantName}
                            </span>
                          )}
                        </div>
                        <span className="font-extrabold text-sm text-stone-900">₹{itemTotal}</span>
                      </div>

                      {/* Selected Modifiers */}
                      {item.selectedModifiers && item.selectedModifiers.length > 0 && (
                        <div className="mt-1 flex flex-wrap gap-1 text-[11px] text-stone-500">
                          {item.selectedModifiers.map((m) => (
                            <span key={m.id} className="bg-cream-100 border border-stone-200 px-2 py-0.5 rounded-md">
                              +{m.name} (₹{m.price})
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Notes */}
                      {item.notes && (
                        <p className="text-xs text-stone-400 italic mt-1">"{item.notes}"</p>
                      )}

                      {/* Quantity & Delete Controls */}
                      <div className="mt-3 flex items-center justify-between">
                        <div className="flex items-center gap-2.5 bg-stone-100 rounded-full px-2.5 py-1">
                          <button
                            onClick={() => updateQuantity(item.menuItemId, item.variantId, -1)}
                            className="p-0.5 text-stone-600 hover:text-stone-900"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="text-xs font-bold text-stone-900 min-w-4 text-center">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.menuItemId, item.variantId, 1)}
                            className="p-0.5 text-stone-600 hover:text-stone-900"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <button
                          onClick={() => removeItem(item.menuItemId, item.variantId)}
                          className="text-stone-400 hover:text-red-600 p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right: Order Summary & Checkout */}
          <div className="lg:col-span-5 space-y-6">
            {/* Promo Code Card */}
            <div className="bg-white rounded-3xl border border-stone-200 p-6 shadow-soft">
              <h2 className="font-serif font-bold text-base text-stone-900 mb-3 flex items-center gap-2">
                <Tag className="w-4 h-4 text-nature-800" />
                <span>Coupon / Offer Code</span>
              </h2>

              {calculation?.discount ? (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between">
                  <div className="flex items-center gap-2 text-emerald-900 text-xs font-bold">
                    <Sparkles className="w-4 h-4 text-emerald-600" />
                    <span>Coupon '{calculation.discount.code}' Applied (-₹{calculation.discount.amount})</span>
                  </div>
                  <button
                    onClick={handleRemovePromo}
                    className="text-xs text-red-600 font-semibold hover:underline"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={promoInput}
                      onChange={(e) => setPromoInput(e.target.value)}
                      placeholder="Try NATURE10"
                      className="flex-1 px-4 py-2.5 rounded-xl border border-stone-200 text-xs uppercase font-mono tracking-wider focus:outline-none focus:ring-2 focus:ring-nature-800"
                    />
                    <button
                      onClick={handleApplyPromo}
                      className="bg-nature-900 hover:bg-nature-950 text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow transition-colors"
                    >
                      Apply
                    </button>
                  </div>

                  {calculation?.discountError && discountCode && (
                    <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5 text-amber-900 text-xs animate-in fade-in duration-200">
                      <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                      <div className="flex-1 leading-relaxed">
                        <p className="font-semibold">{calculation.discountError}</p>
                        <Link to="/menu" className="text-nature-900 font-bold hover:underline mt-1 inline-block">
                          Add more items from menu →
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Bill Details */}
            <div className="bg-white rounded-3xl border border-stone-200 p-6 shadow-soft space-y-4">
              <h2 className="font-serif font-bold text-lg text-stone-900 pb-2 border-b border-stone-100">
                Bill Summary
              </h2>

              <div className="space-y-2.5 text-sm text-stone-600">
                <div className="flex items-center justify-between">
                  <span>Subtotal</span>
                  <span className="font-medium text-stone-900">₹{calculation?.subtotal.toFixed(2) || '0.00'}</span>
                </div>

                {calculation?.discountAmount ? (
                  <div className="flex items-center justify-between text-emerald-700 font-medium">
                    <span>Discount</span>
                    <span>-₹{calculation.discountAmount.toFixed(2)}</span>
                  </div>
                ) : null}

                <div className="flex items-center justify-between">
                  <span>Restaurant GST (5%)</span>
                  <span className="font-medium text-stone-900">₹{calculation?.taxAmount.toFixed(2) || '0.00'}</span>
                </div>
              </div>

              <div className="pt-3 border-t border-stone-200 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-stone-500 uppercase tracking-wider block">Grand Total</span>
                  <span className="font-serif text-2xl font-extrabold text-nature-950">
                    ₹{calculation?.totalAmount.toFixed(2) || '0.00'}
                  </span>
                </div>
                <span className="text-[11px] text-stone-400">All Taxes Included</span>
              </div>

              <button
                onClick={() => navigate('/checkout')}
                disabled={calculating}
                className="w-full bg-nature-900 hover:bg-nature-950 text-white py-4 px-6 rounded-2xl font-bold text-base shadow-card transition-all flex items-center justify-center gap-2 mt-4"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight className="w-5 h-5 text-nature-300" />
              </button>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};
