import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search,
  Plus,
  Minus,
  Trash2,
  ShoppingBag,
  UtensilsCrossed,
  Coffee,
  CheckCircle2,
  AlertCircle,
  Printer,
  User,
  Phone,
  DollarSign,
  QrCode,
  Sparkles,
  Award,
  CreditCard,
  Banknote,
  Smartphone,
  RotateCcw,
  Receipt,
  Clock,
  Layers,
  ChevronRight,
  X,
  FileText,
  Gift,
} from 'lucide-react';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { api } from '../../services/api';
import { MenuItem, MenuCategory, Table, Restaurant } from '../../types';
import { useTenant } from '../../context/TenantContext';

interface CartItem {
  id: string; // unique cart entry key
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  itemType: 'FOOD' | 'COFFEE';
  loyaltyPoints: number;
  variantId?: string;
  variantName?: string;
  notes?: string;
}

export const AdminPOS: React.FC = () => {
  const navigate = useNavigate();
  const { slug, restaurant: tenantRestaurant } = useTenant();

  // Data Loading
  const [items, setItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [vegOnly, setVegOnly] = useState(false);

  // Active Ticket State
  const [orderType, setOrderType] = useState<'DINE_IN' | 'TAKEAWAY'>('DINE_IN');
  const [selectedTableId, setSelectedTableId] = useState<string>('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [orderNotes, setOrderNotes] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'UPI' | 'CARD'>('CASH');
  const [paymentStatus, setPaymentStatus] = useState<'PAID' | 'PENDING'>('PAID');

  // Customer Loyalty Lookup
  const [loyaltyData, setLoyaltyData] = useState<any>(null);
  const [loadingLoyalty, setLoadingLoyalty] = useState(false);
  const [useFoodPoints, setUseFoodPoints] = useState(false);
  const [useCoffeePoints, setUseCoffeePoints] = useState(false);

  // Submitting
  const [placingOrder, setPlacingOrder] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Success Modal
  const [placedOrder, setPlacedOrder] = useState<any>(null);

  // Variant selector modal state
  const [activeItemForVariant, setActiveItemForVariant] = useState<MenuItem | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [itemsRes, catRes, tablesRes] = await Promise.all([
          api.getAdminMenuItems(),
          api.getAdminCategories(),
          api.getAdminTables(),
        ]);
        setItems(itemsRes.items || []);
        setCategories(catRes.categories || []);
        const activeTables = (tablesRes.tables || []).filter((t: Table) => t.isActive);
        setTables(activeTables);
        if (activeTables.length > 0) {
          setSelectedTableId(activeTables[0].id);
        }
      } catch (err: any) {
        console.error('POS data load failed:', err);
        setErrorMessage('Failed to load menu or tables.');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Lookup loyalty whenever a valid 10-digit phone number is entered
  useEffect(() => {
    const clean = customerPhone.replace(/\D/g, '');
    if (clean.length === 10) {
      let isSubscribed = true;
      async function checkLoyalty() {
        try {
          setLoadingLoyalty(true);
          const data = await api.getLoyaltyBalance(clean, slug || 'roastfuze');
          if (isSubscribed) {
            setLoyaltyData(data);
            if (data.name && !customerName) {
              setCustomerName(data.name);
            }
          }
        } catch (e) {
          if (isSubscribed) setLoyaltyData(null);
        } finally {
          if (isSubscribed) setLoadingLoyalty(false);
        }
      }
      checkLoyalty();
      return () => {
        isSubscribed = false;
      };
    } else {
      setLoyaltyData(null);
      setUseFoodPoints(false);
      setUseCoffeePoints(false);
    }
  }, [customerPhone, slug]);

  // Cart Calculations
  const foodSubtotal = useMemo(() => {
    return cart.filter((i) => i.itemType === 'FOOD').reduce((acc, i) => acc + i.price * i.quantity, 0);
  }, [cart]);

  const coffeeSubtotal = useMemo(() => {
    return cart.filter((i) => i.itemType === 'COFFEE').reduce((acc, i) => acc + i.price * i.quantity, 0);
  }, [cart]);

  const subtotal = foodSubtotal + coffeeSubtotal;

  const pointValueRate = (tenantRestaurant as any)?.loyaltyPointValue || loyaltyData?.earnRate?.pointValue || 1.0;
  const minRedeemPoints = (tenantRestaurant as any)?.loyaltyMinRedeemPoints || loyaltyData?.earnRate?.minRedeemPoints || 0;
  const totalWalletPoints = (loyaltyData?.foodPoints || 0) + (loyaltyData?.coffeePoints || 0);
  const isRedeemEligible = minRedeemPoints <= 0 || totalWalletPoints >= minRedeemPoints;

  const maxRedeemableFood = isRedeemEligible ? Math.min(loyaltyData?.foodPoints || 0, Math.floor(foodSubtotal)) : 0;
  const maxRedeemableCoffee = isRedeemEligible ? Math.min(loyaltyData?.coffeePoints || 0, Math.floor(coffeeSubtotal)) : 0;

  const actualFoodRedeemed = useFoodPoints ? maxRedeemableFood : 0;
  const actualCoffeeRedeemed = useCoffeePoints ? maxRedeemableCoffee : 0;
  const loyaltyDiscount = Number(((actualFoodRedeemed + actualCoffeeRedeemed) * pointValueRate).toFixed(2));

  const taxPercent = (tenantRestaurant as any)?.taxPercent || 5.0;
  const discountedSubtotal = Math.max(0, subtotal - loyaltyDiscount);
  const taxAmount = Number(((discountedSubtotal * taxPercent) / 100).toFixed(2));
  const grandTotal = Number((discountedSubtotal + taxAmount).toFixed(2));

  // Add Item to Ticket
  const handleAddItem = (item: MenuItem, variant?: { id: string; name: string; price: number }) => {
    // If item has variants and none was selected, open modal
    if (!variant && item.variants && item.variants.length > 0) {
      setActiveItemForVariant(item);
      return;
    }

    const resolvedPrice = variant ? variant.price : item.price;
    const entryId = variant ? `${item.id}-${variant.id}` : item.id;
    const itemType = (item as any).itemType === 'COFFEE' || item.category?.itemType === 'COFFEE' ? 'COFFEE' : 'FOOD';

    setCart((prev) => {
      const existing = prev.find((i) => i.id === entryId);
      if (existing) {
        return prev.map((i) => (i.id === entryId ? { ...i, quantity: i.quantity + 1 } : i));
      }
      return [
        ...prev,
        {
          id: entryId,
          menuItemId: item.id,
          name: item.name,
          price: resolvedPrice,
          quantity: 1,
          itemType,
          loyaltyPoints: (item as any).loyaltyPoints || 0,
          variantId: variant?.id,
          variantName: variant?.name,
        },
      ];
    });

    if (activeItemForVariant) {
      setActiveItemForVariant(null);
    }
  };

  // Update item quantity
  const handleUpdateQty = (entryId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((i) => {
          if (i.id === entryId) {
            const next = i.quantity + delta;
            return next > 0 ? { ...i, quantity: next } : null;
          }
          return i;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const handleRemoveItem = (entryId: string) => {
    setCart((prev) => prev.filter((i) => i.id !== entryId));
  };

  const handleClearTicket = () => {
    if (cart.length > 0 && !window.confirm('Clear all items from current ticket?')) return;
    setCart([]);
    setCustomerName('');
    setCustomerPhone('');
    setOrderNotes('');
    setUseFoodPoints(false);
    setUseCoffeePoints(false);
    setLoyaltyData(null);
    setErrorMessage(null);
  };

  // Submit Order to POS
  const handlePlaceOrder = async () => {
    if (cart.length === 0) {
      alert('Please add at least one item to the ticket.');
      return;
    }

    if (orderType === 'DINE_IN' && !selectedTableId) {
      alert('Please select a table for Dine-In order.');
      return;
    }

    try {
      setPlacingOrder(true);
      setErrorMessage(null);

      const payload = {
        orderType,
        tableId: orderType === 'DINE_IN' ? selectedTableId : undefined,
        customerName: customerName.trim() || undefined,
        customerPhone: customerPhone.trim() || undefined,
        notes: orderNotes.trim() || undefined,
        paymentMethod,
        paymentStatus,
        status: 'ACCEPTED',
        redeemFoodPoints: actualFoodRedeemed,
        redeemCoffeePoints: actualCoffeeRedeemed,
        items: cart.map((i) => ({
          menuItemId: i.menuItemId,
          variantId: i.variantId,
          quantity: i.quantity,
          notes: i.notes,
        })),
      };

      const res = await api.createAdminPosOrder(payload);
      setPlacedOrder(res);
      // Reset ticket
      setCart([]);
      setCustomerName('');
      setCustomerPhone('');
      setOrderNotes('');
      setUseFoodPoints(false);
      setUseCoffeePoints(false);
      setLoyaltyData(null);
    } catch (err: any) {
      console.error('POS order failed:', err);
      setErrorMessage(err.message || 'Failed to place POS order.');
    } finally {
      setPlacingOrder(false);
    }
  };

  // Filtered menu items
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (selectedCategory !== 'ALL' && item.categoryId !== selectedCategory) {
        return false;
      }
      if (vegOnly && !item.isVeg) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = item.name.toLowerCase().includes(q);
        const matchDesc = item.description?.toLowerCase().includes(q);
        if (!matchName && !matchDesc) return false;
      }
      return true;
    });
  }, [items, selectedCategory, vegOnly, searchQuery]);

  return (
    <AdminLayout>
      <div className="flex flex-col lg:flex-row gap-5 h-[calc(100vh-100px)]">
        {/* ============================================================== */}
        {/* LEFT PANE: MENU CATALOG & CATEGORY BROWSER                     */}
        {/* ============================================================== */}
        <div className="flex-1 flex flex-col bg-white rounded-3xl border border-stone-200 shadow-soft overflow-hidden min-w-0">
          {/* Top Bar: Search, Category Tabs, Veg Filter */}
          <div className="p-4 border-b border-stone-100 space-y-3 flex-shrink-0">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="p-2 bg-amber-100 text-amber-900 rounded-xl">
                  <Receipt className="w-5 h-5" />
                </span>
                <div>
                  <h1 className="font-serif text-lg sm:text-xl font-bold text-stone-900 leading-tight">
                    Point of Sale (POS) Terminal
                  </h1>
                  <span className="text-[11px] text-stone-500 font-medium">
                    Walk-in, Counter & Dine-in Order Placement
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  to="/admin/orders"
                  className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-semibold transition-colors"
                >
                  <ShoppingBag className="w-3.5 h-3.5 text-stone-600" />
                  <span>Live Orders</span>
                </Link>
              </div>
            </div>

            {/* Search Input & Veg Filter */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search item name, ingredients or dish code..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-8 py-2 rounded-xl border border-stone-200 bg-stone-50/70 text-xs font-medium text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-2.5 text-stone-400 hover:text-stone-700"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <button
                onClick={() => setVegOnly(!vegOnly)}
                className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-all ${
                  vegOnly
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                    : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${vegOnly ? 'bg-emerald-600' : 'bg-stone-400'}`} />
                <span>Veg Only</span>
              </button>
            </div>

            {/* Horizontal Category Scroll Bar */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar scrollbar-none">
              <button
                onClick={() => setSelectedCategory('ALL')}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                  selectedCategory === 'ALL'
                    ? 'bg-stone-900 text-white shadow-xs'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                All Menu ({items.length})
              </button>
              {categories.map((c) => {
                const isSelected = selectedCategory === c.id;
                const count = items.filter((it) => it.categoryId === c.id).length;
                return (
                  <button
                    key={c.id}
                    onClick={() => setSelectedCategory(c.id)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                      isSelected
                        ? 'bg-stone-900 text-white shadow-xs'
                        : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                    }`}
                  >
                    {c.name} ({count})
                  </button>
                );
              })}
            </div>
          </div>

          {/* Items Grid */}
          <div className="flex-1 p-4 overflow-y-auto">
            {loading ? (
              <div className="py-24 text-center text-xs text-stone-400">
                <div className="w-8 h-8 rounded-full border-2 border-amber-600 border-t-transparent animate-spin mx-auto mb-2" />
                <span>Loading Menu Items...</span>
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="py-20 text-center">
                <UtensilsCrossed className="w-10 h-10 text-stone-300 mx-auto mb-2" />
                <p className="text-sm font-bold text-stone-700">No items match your filter</p>
                <p className="text-xs text-stone-400 mt-0.5">Try searching for something else or clearing filters.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
                {filteredItems.map((item) => {
                  const itemType = (item as any).itemType === 'COFFEE' || item.category?.itemType === 'COFFEE' ? 'COFFEE' : 'FOOD';
                  const inCartCount = cart
                    .filter((c) => c.menuItemId === item.id)
                    .reduce((acc, c) => acc + c.quantity, 0);

                  return (
                    <button
                      key={item.id}
                      onClick={() => handleAddItem(item)}
                      className={`text-left p-3 rounded-2xl border transition-all relative flex flex-col justify-between group hover:shadow-md hover:border-amber-400 ${
                        inCartCount > 0 ? 'bg-amber-50/40 border-amber-300 ring-1 ring-amber-300' : 'bg-white border-stone-200'
                      }`}
                    >
                      {/* In-Cart Badge */}
                      {inCartCount > 0 && (
                        <span className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-amber-600 text-white font-extrabold text-[11px] flex items-center justify-center shadow-sm">
                          {inCartCount}
                        </span>
                      )}

                      <div>
                        {/* Image or Category placeholder */}
                        <div className="w-full h-24 rounded-xl bg-stone-100 overflow-hidden mb-2 relative">
                          {item.image ? (
                            <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-stone-400">
                              {itemType === 'COFFEE' ? <Coffee className="w-8 h-8 opacity-40" /> : <UtensilsCrossed className="w-8 h-8 opacity-40" />}
                            </div>
                          )}

                          {/* Veg/Nonveg indicator */}
                          <div className="absolute top-1.5 left-1.5 bg-white/90 backdrop-blur-xs p-1 rounded-md">
                            <span className={`block w-2 h-2 rounded-full ${item.isVeg ? 'bg-emerald-600' : 'bg-red-600'}`} />
                          </div>

                          {/* Custom Loyalty Points Tag */}
                          {((item as any).loyaltyPoints || 0) > 0 && (
                            <div className="absolute bottom-1.5 right-1.5 bg-purple-900/90 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md flex items-center gap-0.5 shadow-xs">
                              <Gift className="w-2.5 h-2.5 text-purple-200" />
                              <span>+{(item as any).loyaltyPoints} pts</span>
                            </div>
                          )}
                        </div>

                        <h3 className="font-serif font-bold text-xs text-stone-900 line-clamp-1 group-hover:text-amber-900">
                          {item.name}
                        </h3>
                        <span className="text-[10px] text-stone-400 block line-clamp-1">
                          {item.category?.name || 'Cafe Special'}
                        </span>
                      </div>

                      <div className="mt-2 pt-2 border-t border-stone-100 flex items-center justify-between">
                        <span className="font-serif font-extrabold text-xs text-stone-900">
                          ₹{item.price}
                          {item.variants && item.variants.length > 0 && (
                            <span className="text-[10px] font-sans font-normal text-stone-400 ml-1">options</span>
                          )}
                        </span>

                        <span className="p-1 rounded-lg bg-stone-100 group-hover:bg-amber-600 group-hover:text-white text-stone-600 transition-colors">
                          <Plus className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ============================================================== */}
        {/* RIGHT PANE: ACTIVE TICKET / ORDER SETTLEMENT SUMMARY           */}
        {/* ============================================================== */}
        <div className="w-full lg:w-[420px] xl:w-[440px] flex flex-col bg-white rounded-3xl border border-stone-200 shadow-soft overflow-hidden flex-shrink-0">
          {/* Ticket Header & Mode Toggle */}
          <div className="p-4 border-b border-stone-100 space-y-3 flex-shrink-0 bg-stone-50/60">
            <div className="flex items-center justify-between">
              <span className="font-serif font-bold text-sm text-stone-900 flex items-center gap-1.5">
                <ShoppingBag className="w-4 h-4 text-amber-700" />
                <span>Active Counter Ticket</span>
              </span>

              {cart.length > 0 && (
                <button
                  onClick={handleClearTicket}
                  className="text-[11px] font-semibold text-red-600 hover:text-red-700 flex items-center gap-1 hover:underline"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset</span>
                </button>
              )}
            </div>

            {/* Order Type Buttons: Dine-In vs Takeaway */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-stone-200/70 rounded-2xl">
              <button
                type="button"
                onClick={() => setOrderType('DINE_IN')}
                className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                  orderType === 'DINE_IN'
                    ? 'bg-white text-stone-900 shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <UtensilsCrossed className="w-3.5 h-3.5 text-amber-600" />
                <span>🍽️ Dine-In</span>
              </button>
              <button
                type="button"
                onClick={() => setOrderType('TAKEAWAY')}
                className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                  orderType === 'TAKEAWAY'
                    ? 'bg-white text-stone-900 shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <ShoppingBag className="w-3.5 h-3.5 text-emerald-600" />
                <span>🥡 Takeaway</span>
              </button>
            </div>

            {/* Table Selector (If Dine-In) */}
            {orderType === 'DINE_IN' && (
              <div>
                <label className="text-[11px] font-bold text-stone-600 uppercase tracking-wider block mb-1">
                  Assign Table
                </label>
                <select
                  value={selectedTableId}
                  onChange={(e) => setSelectedTableId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-white text-xs font-semibold text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  {tables.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.tableNumber} - {t.name} ({t.section || 'Hall'}, {t.capacity} seats)
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Customer Details & Real-Time Loyalty Lookup */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block mb-0.5">
                  Customer Mobile
                </label>
                <div className="relative">
                  <Phone className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-2.5" />
                  <input
                    type="tel"
                    placeholder="10-digit phone"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    maxLength={13}
                    className="w-full pl-8 pr-2 py-1.5 rounded-xl border border-stone-200 bg-white text-xs font-semibold text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block mb-0.5">
                  Guest Name (Optional)
                </label>
                <div className="relative">
                  <User className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    placeholder="Guest name"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full pl-8 pr-2 py-1.5 rounded-xl border border-stone-200 bg-white text-xs font-medium text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>
            </div>

            {/* Loyalty Balance Badge if phone detected */}
            {loadingLoyalty && (
              <div className="p-2 bg-stone-100 rounded-xl text-[10px] text-stone-500 animate-pulse text-center">
                Checking loyalty points balance...
              </div>
            )}

            {loyaltyData && !loadingLoyalty && (
              <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-2xl text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-amber-950 flex items-center gap-1">
                    <Award className="w-3.5 h-3.5 text-amber-600" />
                    <span>Loyalty Card: {loyaltyData.name || customerPhone}</span>
                  </span>
                  <span className="font-extrabold text-amber-900 text-[11px]">
                    {totalWalletPoints} Pts total
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px] text-amber-900">
                  <span>🍔 Food: {loyaltyData.foodPoints} pts</span>
                  <span>☕ Coffee: {loyaltyData.coffeePoints} pts</span>
                </div>

                {/* Minimum threshold check */}
                {minRedeemPoints > 0 && !isRedeemEligible ? (
                  <p className="text-[10px] text-amber-800 italic">
                    🔒 Min. {minRedeemPoints} pts required in wallet to redeem. (Need {minRedeemPoints - totalWalletPoints} more pts)
                  </p>
                ) : (
                  <div className="pt-1 flex items-center gap-4 text-[11px]">
                    {loyaltyData.foodPoints > 0 && foodSubtotal > 0 && (
                      <label className="flex items-center gap-1.5 cursor-pointer font-bold text-emerald-900">
                        <input
                          type="checkbox"
                          checked={useFoodPoints}
                          onChange={(e) => setUseFoodPoints(e.target.checked)}
                          className="w-3.5 h-3.5 text-emerald-600 rounded"
                        />
                        <span>Redeem Food (-₹{maxRedeemableFood})</span>
                      </label>
                    )}

                    {loyaltyData.coffeePoints > 0 && coffeeSubtotal > 0 && (
                      <label className="flex items-center gap-1.5 cursor-pointer font-bold text-amber-900">
                        <input
                          type="checkbox"
                          checked={useCoffeePoints}
                          onChange={(e) => setUseCoffeePoints(e.target.checked)}
                          className="w-3.5 h-3.5 text-amber-600 rounded"
                        />
                        <span>Redeem Coffee (-₹{maxRedeemableCoffee})</span>
                      </label>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Ticket Items List */}
          <div className="flex-1 p-3 overflow-y-auto space-y-2 divide-y divide-stone-100">
            {cart.length === 0 ? (
              <div className="py-16 text-center text-stone-400">
                <ShoppingBag className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-xs font-semibold">Ticket is empty</p>
                <p className="text-[10px] text-stone-400 mt-0.5">Click any item from the left catalog to add.</p>
              </div>
            ) : (
              cart.map((item) => (
                <div key={item.id} className="pt-2 first:pt-0 flex items-center justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="font-serif font-bold text-xs text-stone-900 truncate">
                        {item.name}
                      </span>
                      {item.variantName && (
                        <span className="text-[10px] bg-stone-100 px-1.5 py-0.2 rounded font-medium text-stone-600">
                          {item.variantName}
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-stone-500 block">
                      ₹{item.price} each • {item.itemType === 'COFFEE' ? '☕ Drink' : '🍔 Food'}
                    </span>
                  </div>

                  {/* Quantity Controller */}
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleUpdateQty(item.id, -1)}
                      className="w-6 h-6 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 flex items-center justify-center font-bold text-xs transition-colors"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="font-serif font-bold text-xs text-stone-900 w-5 text-center">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => handleUpdateQty(item.id, 1)}
                      className="w-6 h-6 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 flex items-center justify-center font-bold text-xs transition-colors"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  <div className="text-right w-16">
                    <span className="font-serif font-bold text-xs text-stone-900 block">
                      ₹{item.price * item.quantity}
                    </span>
                    <button
                      onClick={() => handleRemoveItem(item.id)}
                      className="text-stone-300 hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Ticket Settlement & Payment Footer */}
          <div className="p-4 border-t border-stone-100 bg-stone-50/80 space-y-3 flex-shrink-0">
            {/* Payment Method Selector */}
            <div className="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={() => setPaymentMethod('CASH')}
                className={`py-1.5 px-2 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1 border transition-all ${
                  paymentMethod === 'CASH'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                    : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-100'
                }`}
              >
                <Banknote className="w-3.5 h-3.5" />
                <span>Cash</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('UPI')}
                className={`py-1.5 px-2 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1 border transition-all ${
                  paymentMethod === 'UPI'
                    ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                    : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-100'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>UPI / QR</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('CARD')}
                className={`py-1.5 px-2 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1 border transition-all ${
                  paymentMethod === 'CARD'
                    ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                    : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-100'
                }`}
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>Card</span>
              </button>
            </div>

            {/* Payment Status (Paid / Pending) */}
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">
                Settlement Status
              </span>
              <div className="flex items-center gap-1 bg-stone-200 p-0.5 rounded-lg text-[10px] font-bold">
                <button
                  type="button"
                  onClick={() => setPaymentStatus('PAID')}
                  className={`px-2 py-0.5 rounded-md transition-all ${
                    paymentStatus === 'PAID' ? 'bg-emerald-600 text-white shadow-xs' : 'text-stone-600'
                  }`}
                >
                  ✓ Collected (Paid)
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentStatus('PENDING')}
                  className={`px-2 py-0.5 rounded-md transition-all ${
                    paymentStatus === 'PENDING' ? 'bg-amber-600 text-white shadow-xs' : 'text-stone-600'
                  }`}
                >
                  Pay Later
                </button>
              </div>
            </div>

            {/* Price Calculations */}
            <div className="space-y-1 text-xs text-stone-600 pt-1 border-t border-stone-200/60">
              <div className="flex justify-between">
                <span>Items Subtotal:</span>
                <span className="font-semibold text-stone-900">₹{subtotal.toFixed(2)}</span>
              </div>
              {loyaltyDiscount > 0 && (
                <div className="flex justify-between text-emerald-700 font-semibold">
                  <span>Loyalty Discount:</span>
                  <span>-₹{loyaltyDiscount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-stone-500 text-[11px]">
                <span>Taxes & GST ({taxPercent}%):</span>
                <span>₹{taxAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-baseline pt-1.5 border-t border-stone-200">
                <span className="font-serif font-bold text-stone-900 text-sm">Grand Total:</span>
                <span className="font-serif font-black text-xl text-stone-950">₹{grandTotal.toFixed(2)}</span>
              </div>
            </div>

            {/* Error banner if order placement failed */}
            {errorMessage && (
              <div className="p-2.5 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Place Order CTA Button */}
            <button
              onClick={handlePlaceOrder}
              disabled={placingOrder || cart.length === 0}
              className="w-full py-3 px-4 rounded-2xl bg-nature-900 hover:bg-nature-950 text-white font-serif font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {placingOrder ? (
                <>
                  <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  <span>Processing POS Order...</span>
                </>
              ) : (
                <>
                  <Receipt className="w-4 h-4 text-nature-300" />
                  <span>Place POS Order • ₹{grandTotal.toFixed(2)}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* MODAL 1: VARIANT SELECTION POPUP                              */}
      {/* ============================================================== */}
      {activeItemForVariant && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-serif font-bold text-base text-stone-900">
                  {activeItemForVariant.name}
                </h3>
                <p className="text-xs text-stone-500">Choose portion / size variant:</p>
              </div>
              <button
                onClick={() => setActiveItemForVariant(null)}
                className="text-stone-400 hover:text-stone-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              {activeItemForVariant.variants?.map((v) => (
                <button
                  key={v.id}
                  onClick={() => handleAddItem(activeItemForVariant, v)}
                  className="w-full p-3 rounded-2xl border border-stone-200 hover:border-amber-400 hover:bg-amber-50/50 flex items-center justify-between text-left transition-all group"
                >
                  <span className="font-semibold text-xs text-stone-800 group-hover:text-amber-950">
                    {v.name}
                  </span>
                  <span className="font-serif font-extrabold text-xs text-stone-900 group-hover:text-amber-950">
                    ₹{v.price}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 2: ORDER PLACED SUCCESSFULLY POPUP                       */}
      {/* ============================================================== */}
      {placedOrder && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
            <div className="text-center space-y-2">
              <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-2">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h2 className="font-serif font-black text-2xl text-stone-900">
                Order Placed Successfully!
              </h2>
              <p className="text-xs text-stone-500">
                Ticket dispatched to kitchen & staff live display.
              </p>
            </div>

            {/* Order details card */}
            <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 space-y-2 text-xs">
              <div className="flex justify-between items-center pb-2 border-b border-stone-200">
                <span className="text-stone-500">Order Number:</span>
                <span className="font-serif font-black text-stone-900 text-sm">
                  #{placedOrder.order?.orderNumber}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-stone-500">Service Mode:</span>
                <span className="font-bold text-stone-800">
                  {placedOrder.order?.orderType === 'DINE_IN'
                    ? `🍽️ Dine-In (${placedOrder.order?.table?.tableNumber || 'Table'})`
                    : '🥡 Takeaway (Walk-in)'}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-stone-500">Guest:</span>
                <span className="font-semibold text-stone-800">
                  {placedOrder.order?.customerName || 'Walk-in Guest'}
                  {placedOrder.order?.customerPhone ? ` • ${placedOrder.order.customerPhone}` : ''}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-stone-500">Payment:</span>
                <span className="font-bold text-emerald-700">
                  {placedOrder.order?.paymentMethod} • {placedOrder.order?.paymentStatus}
                </span>
              </div>

              <div className="flex justify-between items-center pt-2 border-t border-stone-200">
                <span className="font-serif font-bold text-stone-900 text-sm">Amount Billed:</span>
                <span className="font-serif font-extrabold text-stone-950 text-base">
                  ₹{Number(placedOrder.order?.totalAmount || 0).toFixed(2)}
                </span>
              </div>

              {placedOrder.loyalty && (
                <div className="pt-2 border-t border-stone-200 text-[11px] text-purple-900 flex justify-between">
                  <span>🎁 Loyalty Points Awarded:</span>
                  <span className="font-bold">
                    +{placedOrder.loyalty.foodPointsEarned} Food • +{placedOrder.loyalty.coffeePointsEarned} Coffee
                  </span>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-1">
              <div className="grid grid-cols-2 gap-2">
                <Link
                  to={`/bill/${placedOrder.order?.orderToken}`}
                  target="_blank"
                  className="py-2.5 px-3 rounded-xl bg-stone-900 hover:bg-stone-950 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                >
                  <Printer className="w-4 h-4 text-amber-300" />
                  <span>Print Bill / Slip</span>
                </Link>

                <Link
                  to="/admin/orders"
                  className="py-2.5 px-3 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                >
                  <ShoppingBag className="w-4 h-4 text-stone-600" />
                  <span>Live Orders</span>
                </Link>
              </div>

              <button
                onClick={() => setPlacedOrder(null)}
                className="w-full py-2.5 rounded-xl border border-stone-300 hover:bg-stone-50 text-stone-700 font-semibold text-xs transition-colors"
              >
                + Start Next POS Order
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};
