import React, { useState, useEffect } from 'react';
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
  Sparkles,
  Gift,
  Coffee,
  UtensilsCrossed,
  Users,
  MapPin,
  RefreshCw,
} from 'lucide-react';
import { Navbar } from '../../components/layout/Navbar';
import { Footer } from '../../components/layout/Footer';
import { useCart } from '../../context/CartContext';
import { useTenant } from '../../context/TenantContext';
import { api } from '../../services/api';
import { CartCalculation } from '../../types';

export const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    items,
    tableToken,
    tableInfo,
    tableSource,
    mySeatedTable,
    setTableSession,
    restoreMySeatedTable,
    clearTableSession,
    discountCode,
    clearCart,
    subtotal,
  } = useCart();

  const { restaurant: tenantRestaurant, slug: tenantSlug } = useTenant();
  const effectiveSlug = tenantSlug || tenantRestaurant?.slug || 'roastfuze';
  const cafeName = tenantRestaurant?.name || 'Cafe';
  const pointValueRate = (tenantRestaurant as any)?.loyaltyPointValue || 1.0;
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [orderType, setOrderType] = useState<'DINE_IN' | 'TAKEAWAY'>(tableToken ? 'DINE_IN' : 'TAKEAWAY');
  const [paymentMethod, setPaymentMethod] = useState<'PAY_AT_COUNTER' | 'UPI' | 'RAZORPAY'>('PAY_AT_COUNTER');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Table Selection & Real-Time Availability
  const [tables, setTables] = useState<
    Array<{
      id: string;
      tableNumber: string;
      name: string;
      section: string;
      capacity: number;
      token: string | null;
      isOccupied: boolean;
      status: 'AVAILABLE' | 'OCCUPIED';
    }>
  >([]);
  const [loadingTables, setLoadingTables] = useState(false);
  const [showTablePicker, setShowTablePicker] = useState(!tableToken);

  const fetchTables = async () => {
    try {
      setLoadingTables(true);
      const res = await api.getPublicTables('roastfuze');
      setTables(res.tables || []);
    } catch (err) {
      console.error('Error fetching tables:', err);
    } finally {
      setLoadingTables(false);
    }
  };

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    fetchTables();
  }, []);

  // Loyalty Points State
  const [redeemFoodPoints, setRedeemFoodPoints] = useState(0);
  const [redeemCoffeePoints, setRedeemCoffeePoints] = useState(0);
  const [useFoodPoints, setUseFoodPoints] = useState(false);
  const [useCoffeePoints, setUseCoffeePoints] = useState(false);
  const [calculation, setCalculation] = useState<CartCalculation | null>(null);
  const minRedeemPoints = (tenantRestaurant as any)?.loyaltyMinRedeemPoints || (calculation as any)?.minRedeemPoints || 0;
  const [loadingCalculation, setLoadingCalculation] = useState(false);

  // Recalculate bill whenever items, coupon, phone, or redemption preferences change
  useEffect(() => {
    if (items.length === 0) return;

    let isMounted = true;
    async function fetchCalculation() {
      try {
        setLoadingCalculation(true);
        const res = await api.calculateCart({
          restaurantSlug: effectiveSlug,
          items: items.map((i) => ({
            menuItemId: i.menuItemId,
            variantId: i.variantId,
            modifierOptionIds: i.selectedModifiers?.map((m) => m.id),
            quantity: i.quantity,
            notes: i.notes,
          })),
          discountCode: discountCode || undefined,
          customerPhone: customerPhone.trim() || undefined,
          redeemFoodPoints: useFoodPoints ? redeemFoodPoints : 0,
          redeemCoffeePoints: useCoffeePoints ? redeemCoffeePoints : 0,
        });

        if (isMounted) {
          setCalculation(res);
          // If first time loading points, default redemption amount to max allowable
          if (res.maxRedeemableFoodPoints > 0 && redeemFoodPoints === 0) {
            setRedeemFoodPoints(res.maxRedeemableFoodPoints);
          }
          if (res.maxRedeemableCoffeePoints > 0 && redeemCoffeePoints === 0) {
            setRedeemCoffeePoints(res.maxRedeemableCoffeePoints);
          }
        }
      } catch (err) {
        console.error('Calculation error:', err);
      } finally {
        if (isMounted) setLoadingCalculation(false);
      }
    }

    fetchCalculation();
    return () => {
      isMounted = false;
    };
  }, [items, discountCode, customerPhone, useFoodPoints, useCoffeePoints, redeemFoodPoints, redeemCoffeePoints]);

  if (items.length === 0) {
    navigate('/cart');
    return null;
  }

  const handleSelectTable = (tbl: any) => {
    const isMyTable =
      tbl.token === tableToken ||
      tbl.token === mySeatedTable?.token ||
      tbl.tableNumber === mySeatedTable?.tableNumber;

    if (!isMyTable && (tbl.status === 'OCCUPIED' || tbl.isOccupied)) {
      return; // Occupied tables that DO NOT belong to this guest cannot be selected
    }
    if (!tbl.token) {
      setError('This table does not have an active QR token.');
      return;
    }
    setTableSession(
      tbl.token,
      {
        tableNumber: tbl.tableNumber,
        name: tbl.name,
        section: tbl.section,
      },
      'MANUAL'
    );
    setShowTablePicker(false);
    setError(null);
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (orderType === 'DINE_IN' && !tableToken) {
      setError('Please select an available table above to proceed with Dine-in.');
      setShowTablePicker(true);
      return;
    }

    try {
      setIsSubmitting(true);

      // Request browser notification permission on user click gesture
      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
        try {
          Notification.requestPermission().catch(() => {});
        } catch {}
      }

      const res = await api.createOrder({
        restaurantSlug: effectiveSlug,
        tableToken: orderType === 'DINE_IN' ? tableToken : undefined,
        orderType,
        customerName: customerName.trim() || undefined,
        customerPhone: customerPhone.trim() || undefined,
        notes: notes.trim() || undefined,
        discountCode: discountCode || undefined,
        paymentMethod,
        redeemFoodPoints: useFoodPoints ? calculation?.foodPointsRedeemed || redeemFoodPoints : 0,
        redeemCoffeePoints: useCoffeePoints ? calculation?.coffeePointsRedeemed || redeemCoffeePoints : 0,
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

  const finalSubtotal = calculation?.subtotal ?? subtotal;
  const foodSubtotal = calculation?.foodSubtotal ?? 0;
  const coffeeSubtotal = calculation?.coffeeSubtotal ?? 0;
  const foodPointsEarned = calculation?.potentialFoodPoints ?? Math.floor(foodSubtotal / 10);
  const coffeePointsEarned = calculation?.potentialCoffeePoints ?? Math.floor(coffeeSubtotal / 10);
  const availableFood = calculation?.availableFoodPoints ?? 0;
  const availableCoffee = calculation?.availableCoffeePoints ?? 0;
  const loyaltyDiscount = calculation?.loyaltyDiscount ?? 0;
  const couponDiscount = calculation?.discountAmount ?? 0;
  const taxAmount = calculation?.taxAmount ?? Number(((finalSubtotal * 0.05)).toFixed(2));
  const grandTotal = calculation?.totalAmount ?? Number(((finalSubtotal + taxAmount)).toFixed(2));

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
            <div className="bg-white rounded-3xl border border-stone-200 p-6 shadow-soft space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-serif font-bold text-base text-stone-900">Choose Order Type</h2>
                <span className="text-xs text-stone-400">
                  {orderType === 'DINE_IN' ? 'Table Service' : 'Self Pickup'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setOrderType('DINE_IN');
                    if (!tableToken) setShowTablePicker(true);
                  }}
                  className={`p-4 rounded-2xl border text-left transition-all ${
                    orderType === 'DINE_IN'
                      ? 'border-nature-900 bg-nature-50 text-nature-950 font-bold ring-2 ring-nature-900/10'
                      : 'border-stone-200 text-stone-600 hover:bg-stone-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-bold">Dine-in at Cafe</span>
                    <Store className="w-4 h-4 text-nature-800" />
                  </div>
                  <span className="text-[11px] text-stone-500 block truncate">
                    {tableInfo ? `${tableInfo.tableNumber} - ${tableInfo.name}` : 'Choose Table'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setOrderType('TAKEAWAY');
                    setShowTablePicker(false);
                    setError(null);
                  }}
                  className={`p-4 rounded-2xl border text-left transition-all ${
                    orderType === 'TAKEAWAY'
                      ? 'border-nature-900 bg-nature-50 text-nature-950 font-bold ring-2 ring-nature-900/10'
                      : 'border-stone-200 text-stone-600 hover:bg-stone-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-bold">Takeaway / Parcel</span>
                    <Banknote className="w-4 h-4 text-stone-400" />
                  </div>
                  <span className="text-[11px] text-stone-400 block">Pick up from Counter</span>
                </button>
              </div>

              {/* DINE-IN TABLE DETAILS OR PICKER */}
              {orderType === 'DINE_IN' && (
                <div className="pt-3 border-t border-stone-100">
                  {/* If Table is Selected and Table Picker is closed */}
                  {tableInfo && !showTablePicker ? (
                    <div
                      className={`p-4 rounded-2xl border transition-all ${
                        tableSource === 'QR'
                          ? 'bg-amber-50/80 border-amber-200 text-amber-950'
                          : 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white flex-shrink-0 ${
                              tableSource === 'QR' ? 'bg-amber-600 shadow-sm' : 'bg-emerald-600 shadow-sm'
                            }`}
                          >
                            {tableSource === 'QR' ? (
                              <QrCode className="w-5 h-5" />
                            ) : (
                              <CheckCircle2 className="w-5 h-5" />
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-stone-900 text-sm">
                                {tableInfo.tableNumber}: {tableInfo.name}
                              </span>
                              {tableSource === 'QR' ? (
                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-200 text-amber-900 flex items-center gap-1">
                                  <QrCode className="w-3 h-3" /> Scanned via Table QR
                                </span>
                              ) : (
                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-200 text-emerald-900 flex items-center gap-1">
                                  <CheckCircle2 className="w-3 h-3" /> Table Selected
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-stone-600 mt-1 flex items-center gap-2">
                              <span>📍 {tableInfo.section || 'RoastFuze Musical Balcony'}</span>
                              <span>•</span>
                              <span>Food will be served directly to this table</span>
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            fetchTables();
                            setShowTablePicker(true);
                          }}
                          className="text-xs font-bold text-nature-900 hover:text-nature-950 underline px-2 py-1 rounded hover:bg-white/60 transition-colors whitespace-nowrap self-center"
                        >
                          Change Table
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* INTERACTIVE TABLE SELECTION PICKER */
                    <div className="space-y-3 mt-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-serif font-bold text-sm text-stone-900 flex items-center gap-2">
                            <Store className="w-4 h-4 text-amber-800" />
                            <span>Select Your Table (Khali Table Chunein)</span>
                          </h3>
                          <p className="text-[11px] text-stone-500">
                            Only vacant tables can be selected. Occupied tables are blocked.
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={fetchTables}
                            disabled={loadingTables}
                            className="p-1.5 rounded-lg border border-stone-200 text-stone-600 hover:text-stone-900 hover:bg-stone-50 text-xs flex items-center gap-1 transition-all"
                            title="Refresh table availability"
                          >
                            <RefreshCw className={`w-3.5 h-3.5 ${loadingTables ? 'animate-spin' : ''}`} />
                            <span className="hidden sm:inline text-[11px]">Refresh</span>
                          </button>

                          {tableInfo && (
                            <button
                              type="button"
                              onClick={() => setShowTablePicker(false)}
                              className="text-xs font-semibold text-stone-600 hover:text-stone-900 px-2.5 py-1 rounded-lg border border-stone-200 bg-stone-50 hover:bg-stone-100"
                            >
                              Cancel
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Quick Restore Seated Table Banner if accidentally changed */}
                      {mySeatedTable && (!tableInfo || tableInfo.tableNumber !== mySeatedTable.tableNumber) && (
                        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between gap-3 text-xs animate-in fade-in">
                          <div className="flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-amber-600 flex-shrink-0" />
                            <span className="text-amber-950 font-medium">
                              Seated at <strong>{mySeatedTable.tableNumber} ({mySeatedTable.name})</strong>?
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={restoreMySeatedTable}
                            className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-3 py-1.5 rounded-lg text-xs whitespace-nowrap shadow-xs transition-colors"
                          >
                            Re-select My Table
                          </button>
                        </div>
                      )}

                      {loadingTables ? (
                        <div className="py-8 text-center text-stone-500 text-xs">
                          <div className="w-6 h-6 border-2 border-nature-900 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                          Checking table availability in cafe...
                        </div>
                      ) : tables.length === 0 ? (
                        <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 text-center text-xs text-stone-600">
                          No tables available right now. Please select Takeaway or ask cafe staff.
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          {tables.map((tbl) => {
                            const isSelected = tableToken === tbl.token;
                            const isMyTable =
                              tbl.token === tableToken ||
                              tbl.token === mySeatedTable?.token ||
                              tbl.tableNumber === mySeatedTable?.tableNumber;
                            const isOccupied = (tbl.isOccupied || tbl.status === 'OCCUPIED') && !isMyTable;

                            return (
                              <button
                                key={tbl.id}
                                type="button"
                                disabled={isOccupied}
                                onClick={() => handleSelectTable(tbl)}
                                className={`p-3.5 rounded-2xl border text-left transition-all relative ${
                                  isSelected
                                    ? 'border-emerald-600 bg-emerald-50 ring-2 ring-emerald-600/20'
                                    : isMyTable
                                    ? 'border-amber-400 bg-amber-50/70 hover:border-amber-500 hover:bg-amber-100/50 cursor-pointer shadow-xs'
                                    : isOccupied
                                    ? 'border-stone-200 bg-stone-100/70 opacity-60 cursor-not-allowed'
                                    : 'border-stone-200 bg-white hover:border-emerald-500 hover:bg-emerald-50/40 cursor-pointer shadow-xs'
                                }`}
                              >
                                <div className="flex items-start justify-between gap-2 mb-1.5">
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-bold text-sm text-stone-900">
                                      {tbl.tableNumber}
                                    </span>
                                    {isSelected && (
                                      <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                                    )}
                                  </div>

                                  {isMyTable ? (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-200 text-amber-950 border border-amber-300">
                                      Your Table
                                    </span>
                                  ) : isOccupied ? (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                                      Occupied
                                    </span>
                                  ) : (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                      Available / Khali
                                    </span>
                                  )}
                                </div>

                                <div className="text-xs text-stone-700 font-medium truncate">
                                  {tbl.name}
                                </div>

                                <div className="flex items-center justify-between text-[11px] text-stone-400 mt-2 pt-2 border-t border-stone-100">
                                  <span className="flex items-center gap-1 truncate max-w-[60%]">
                                    <MapPin className="w-3 h-3 text-stone-400 flex-shrink-0" />
                                    <span className="truncate">{tbl.section}</span>
                                  </span>
                                  <span className="flex items-center gap-1 flex-shrink-0">
                                    <Users className="w-3 h-3 text-stone-400" />
                                    {tbl.capacity} Seats
                                  </span>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {!tableToken && (
                        <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                          <span>Dine-in ke liye upar di gayi khali table par click karein.</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Customer Details */}
            <div className="bg-white rounded-3xl border border-stone-200 p-6 shadow-soft space-y-4">
              <h2 className="font-serif font-bold text-base text-stone-900">Contact & Loyalty Information</h2>

              <div>
                <label className="text-xs uppercase tracking-wider font-bold text-stone-600 block mb-1.5">
                  Phone Number (For Dual Loyalty Points & Order Updates)
                </label>
                <input
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="+91 98000 00000"
                  className="w-full px-4 py-3 rounded-xl border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-nature-800"
                />
                <span className="text-[11px] text-stone-400 mt-1 block">
                  Enter your number to earn and redeem separate Food & Coffee loyalty points!
                </span>
              </div>

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

            {/* Dual Loyalty Program Card */}
            <div className="bg-gradient-to-br from-amber-50/80 via-white to-emerald-50/80 rounded-3xl border border-amber-200/90 p-6 shadow-soft space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-amber-200/60">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-900 flex items-center justify-center">
                    <Gift className="w-4 h-4 text-amber-700" />
                  </div>
                  <div>
                    <h2 className="font-serif font-bold text-base text-stone-900">{cafeName} Dual Loyalty Club</h2>
                    <p className="text-[11px] text-stone-500">
                      Food points alag 🍔 aur coffee & beverage points alag ☕
                    </p>
                  </div>
                </div>
                <span className="text-[11px] bg-amber-100 text-amber-900 font-bold px-2.5 py-1 rounded-full">
                  1 Pt = ₹{pointValueRate}
                </span>
              </div>

              {/* Points to be earned preview */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-white/90 rounded-2xl border border-emerald-200 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-sm">
                    🍔
                  </div>
                  <div>
                    <span className="text-[11px] text-stone-500 block">Food Points Earned</span>
                    <span className="text-sm font-extrabold text-emerald-900">+{foodPointsEarned} Pts</span>
                    <span className="text-[10px] text-stone-400 block">On ₹{foodSubtotal.toFixed(0)} food</span>
                  </div>
                </div>

                <div className="p-3 bg-white/90 rounded-2xl border border-amber-200 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-sm">
                    ☕
                  </div>
                  <div>
                    <span className="text-[11px] text-stone-500 block">Coffee Points Earned</span>
                    <span className="text-sm font-extrabold text-amber-900">+{coffeePointsEarned} Pts</span>
                    <span className="text-[10px] text-stone-400 block">On ₹{coffeeSubtotal.toFixed(0)} coffee</span>
                  </div>
                </div>
              </div>

              {/* Redemption Section if Customer has phone entered */}
              {customerPhone.trim() ? (
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-stone-700 block uppercase tracking-wider">
                      Redeem Your Balance
                    </span>
                    {minRedeemPoints > 0 && (
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        (availableFood + availableCoffee) >= minRedeemPoints
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : 'bg-amber-100 text-amber-900 border border-amber-200'
                      }`}>
                        {(availableFood + availableCoffee) >= minRedeemPoints
                          ? `✓ Min. ${minRedeemPoints} pts unlocked`
                          : `Min. ${minRedeemPoints} pts required`}
                      </span>
                    )}
                  </div>

                  {/* Warning banner if wallet points < minRedeemPoints */}
                  {minRedeemPoints > 0 && (availableFood + availableCoffee) < minRedeemPoints && (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-950 flex items-start gap-2.5">
                      <span className="text-base flex-shrink-0">🔒</span>
                      <div>
                        <p className="font-bold">Minimum {minRedeemPoints} points required to redeem</p>
                        <p className="text-[11px] text-amber-900 mt-0.5 leading-relaxed">
                          You currently have <strong>{availableFood + availableCoffee} points</strong> in your wallet. Earn {minRedeemPoints - (availableFood + availableCoffee)} more points to unlock checkout discounts.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Food Points Redemption */}
                  <div className={`p-4 rounded-2xl border transition-all ${
                    useFoodPoints ? 'bg-emerald-50/70 border-emerald-400 ring-1 ring-emerald-400' : 'bg-white border-stone-200'
                  }`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <input
                          type="checkbox"
                          id="redeemFoodCheck"
                          checked={useFoodPoints}
                          disabled={
                            (minRedeemPoints > 0 && (availableFood + availableCoffee) < minRedeemPoints) ||
                            availableFood === 0 ||
                            foodSubtotal === 0
                          }
                          onChange={(e) => setUseFoodPoints(e.target.checked)}
                          className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer disabled:opacity-40"
                        />
                        <label htmlFor="redeemFoodCheck" className="text-xs cursor-pointer select-none">
                          <span className="font-bold text-stone-900 block">
                            🍔 Redeem Food Points (Balance: {availableFood} Pts)
                          </span>
                          <span className="text-stone-500 text-[11px] block">
                            {minRedeemPoints > 0 && (availableFood + availableCoffee) < minRedeemPoints
                              ? `Locked: Need ${minRedeemPoints} total wallet points to redeem`
                              : foodSubtotal === 0
                              ? 'No food items in cart to apply food points to'
                              : availableFood > 0
                              ? `Save up to ₹${(Math.min(availableFood, Math.floor(foodSubtotal)) * pointValueRate).toFixed(0)} off food items`
                              : 'No food points available yet'}
                          </span>
                        </label>
                      </div>

                      {useFoodPoints && calculation && calculation.foodPointsRedeemed > 0 && (
                        <span className="text-xs font-extrabold text-emerald-800 whitespace-nowrap bg-emerald-100 px-2.5 py-1 rounded-lg">
                          -₹{(calculation.foodPointsRedeemed * pointValueRate).toFixed(2)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Coffee Points Redemption */}
                  <div className={`p-4 rounded-2xl border transition-all ${
                    useCoffeePoints ? 'bg-amber-50/70 border-amber-400 ring-1 ring-amber-400' : 'bg-white border-stone-200'
                  }`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <input
                          type="checkbox"
                          id="redeemCoffeeCheck"
                          checked={useCoffeePoints}
                          disabled={
                            (minRedeemPoints > 0 && (availableFood + availableCoffee) < minRedeemPoints) ||
                            availableCoffee === 0 ||
                            coffeeSubtotal === 0
                          }
                          onChange={(e) => setUseCoffeePoints(e.target.checked)}
                          className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 cursor-pointer disabled:opacity-40"
                        />
                        <label htmlFor="redeemCoffeeCheck" className="text-xs cursor-pointer select-none">
                          <span className="font-bold text-stone-900 block">
                            ☕ Redeem Coffee Points (Balance: {availableCoffee} Pts)
                          </span>
                          <span className="text-stone-500 text-[11px] block">
                            {minRedeemPoints > 0 && (availableFood + availableCoffee) < minRedeemPoints
                              ? `Locked: Need ${minRedeemPoints} total wallet points to redeem`
                              : coffeeSubtotal === 0
                              ? 'No coffee/beverage items in cart to apply coffee points to'
                              : availableCoffee > 0
                              ? `Save up to ₹${(Math.min(availableCoffee, Math.floor(coffeeSubtotal)) * pointValueRate).toFixed(0)} off coffee items`
                              : 'No coffee points available yet'}
                          </span>
                        </label>
                      </div>

                      {useCoffeePoints && calculation && calculation.coffeePointsRedeemed > 0 && (
                        <span className="text-xs font-extrabold text-amber-800 whitespace-nowrap bg-amber-100 px-2.5 py-1 rounded-lg">
                          -₹{(calculation.coffeePointsRedeemed * pointValueRate).toFixed(2)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-stone-500 italic text-center pt-1">
                  💡 Type your phone number above to see and redeem your existing loyalty points.
                </p>
              )}
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
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-stone-800">{item.name}</span>
                        <span className={`text-[9px] px-1.5 py-0.2 rounded ${
                          item.itemType === 'COFFEE' ? 'bg-amber-100 text-amber-900' : 'bg-emerald-100 text-emerald-900'
                        }`}>
                          {item.itemType === 'COFFEE' ? '☕' : '🍔'}
                        </span>
                      </div>
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
                  <span className="font-semibold text-stone-900">₹{finalSubtotal.toFixed(2)}</span>
                </div>

                {foodSubtotal > 0 && (
                  <div className="flex justify-between text-[11px] text-stone-400 pl-2">
                    <span>🍔 Food items</span>
                    <span>₹{foodSubtotal.toFixed(2)}</span>
                  </div>
                )}

                {coffeeSubtotal > 0 && (
                  <div className="flex justify-between text-[11px] text-stone-400 pl-2">
                    <span>☕ Coffee & beverages</span>
                    <span>₹{coffeeSubtotal.toFixed(2)}</span>
                  </div>
                )}

                {couponDiscount > 0 && (
                  <div className="flex justify-between text-emerald-700 font-semibold">
                    <span>Coupon Discount</span>
                    <span>-₹{couponDiscount.toFixed(2)}</span>
                  </div>
                )}

                {calculation && calculation.foodPointsRedeemed > 0 && (
                  <div className="flex justify-between text-emerald-800 font-semibold">
                    <span>Food Points Redeemed ({calculation.foodPointsRedeemed} Pts)</span>
                    <span>-₹{calculation.foodPointsRedeemed.toFixed(2)}</span>
                  </div>
                )}

                {calculation && calculation.coffeePointsRedeemed > 0 && (
                  <div className="flex justify-between text-amber-800 font-semibold">
                    <span>Coffee Points Redeemed ({calculation.coffeePointsRedeemed} Pts)</span>
                    <span>-₹{calculation.coffeePointsRedeemed.toFixed(2)}</span>
                  </div>
                )}

                <div className="flex justify-between">
                  <span>GST (5%)</span>
                  <span className="font-semibold text-stone-900">₹{taxAmount.toFixed(2)}</span>
                </div>

                <div className="pt-2 border-t border-stone-100 flex justify-between text-base font-extrabold text-nature-950">
                  <span>Grand Total</span>
                  <span>₹{grandTotal.toFixed(2)}</span>
                </div>
              </div>

              {/* Loyalty Earned Banner */}
              <div className="p-3 bg-nature-50 border border-nature-200/80 rounded-2xl text-[11px] space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-nature-900">
                  <Sparkles className="w-3.5 h-3.5 text-nature-700" />
                  <span>Points You'll Earn:</span>
                </div>
                <div className="flex justify-between text-nature-800 font-medium pl-5">
                  <span>🍔 Food Loyalty Points:</span>
                  <span className="font-bold">+{foodPointsEarned} Pts</span>
                </div>
                <div className="flex justify-between text-nature-800 font-medium pl-5">
                  <span>☕ Coffee Loyalty Points:</span>
                  <span className="font-bold">+{coffeePointsEarned} Pts</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || loadingCalculation}
                className="w-full bg-nature-900 hover:bg-nature-950 text-white py-4 rounded-2xl font-bold text-base shadow-card transition-all flex items-center justify-center gap-2 mt-4 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Lock className="w-4 h-4 text-nature-300" />
                    <span>Confirm Order • ₹{grandTotal.toFixed(2)}</span>
                  </>
                )}
              </button>

              <p className="text-[11px] text-stone-400 text-center flex items-center justify-center gap-1 pt-1">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-700" />
                <span>Verified RoastFuze table ordering system</span>
              </p>
            </div>
          </div>
        </form>
      </main>

      <Footer />
    </div>
  );
};
