import React, { useEffect, useState, useMemo } from 'react';
import {
  Award,
  Sparkles,
  Gift,
  Coins,
  Check,
  Save,
  RefreshCw,
  Search,
  Filter,
  Coffee,
  UtensilsCrossed,
  AlertCircle,
  TrendingUp,
  Users,
  CheckCircle2,
  Sliders,
  DollarSign,
  Info,
  Layers,
} from 'lucide-react';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { api } from '../../services/api';
import { MenuItem, MenuCategory } from '../../types';

export const AdminLoyalty: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [savingGlobal, setSavingGlobal] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // Global Loyalty Settings State
  const [isLoyaltyEnabled, setIsLoyaltyEnabled] = useState(true);
  const [loyaltyPerOrderPoints, setLoyaltyPerOrderPoints] = useState<number | string>(0);
  const [loyaltyFoodSpendPerPoint, setLoyaltyFoodSpendPerPoint] = useState<number | string>(10);
  const [loyaltyCoffeeSpendPerPoint, setLoyaltyCoffeeSpendPerPoint] = useState<number | string>(10);
  const [loyaltyFoodPercent, setLoyaltyFoodPercent] = useState<number | string>(0);
  const [loyaltyCoffeePercent, setLoyaltyCoffeePercent] = useState<number | string>(15);
  const [loyaltyPointValue, setLoyaltyPointValue] = useState<number | string>(1.0);
  const [loyaltyMinOrderAmount, setLoyaltyMinOrderAmount] = useState<number | string>(0);
  const [loyaltyMinRedeemPoints, setLoyaltyMinRedeemPoints] = useState<number | string>(0);

  // Stats State
  const [stats, setStats] = useState({
    totalMembers: 0,
    activeFoodPoints: 0,
    activeCoffeePoints: 0,
    lifetimeFoodPoints: 0,
    lifetimeCoffeePoints: 0,
    itemsWithPointsCount: 0,
  });

  // Items and Categories State
  const [items, setItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<'ALL' | 'FOOD' | 'COFFEE' | 'CUSTOM'>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  // Item points edit state: { [itemId: string]: number | string }
  const [itemPointsMap, setItemPointsMap] = useState<Record<string, number | string>>({});
  const [savingItemId, setSavingItemId] = useState<string | null>(null);
  const [itemSaveFeedback, setItemSaveFeedback] = useState<Record<string, boolean>>({});

  // Bulk action state
  const [bulkPointsValue, setBulkPointsValue] = useState<number>(5);
  const [isBulkApplying, setIsBulkApplying] = useState(false);

  // Load all loyalty data
  const fetchData = async () => {
    try {
      setLoading(true);
      const [settingsRes, itemsRes, categoriesRes] = await Promise.all([
        api.getLoyaltySettings(),
        api.getAdminMenuItems(),
        api.getAdminCategories(),
      ]);

      if (settingsRes.settings) {
        const s = settingsRes.settings;
        setIsLoyaltyEnabled(s.isLoyaltyEnabled !== false);
        setLoyaltyPerOrderPoints(s.loyaltyPerOrderPoints || 0);
        setLoyaltyFoodSpendPerPoint(s.loyaltyFoodSpendPerPoint || 10);
        setLoyaltyCoffeeSpendPerPoint(s.loyaltyCoffeeSpendPerPoint || 10);
        setLoyaltyFoodPercent(s.loyaltyFoodPercent !== undefined ? s.loyaltyFoodPercent : 0);
        setLoyaltyCoffeePercent(s.loyaltyCoffeePercent !== undefined ? s.loyaltyCoffeePercent : 15);
        setLoyaltyPointValue(s.loyaltyPointValue || 1.0);
        setLoyaltyMinOrderAmount(s.loyaltyMinOrderAmount || 0);
        setLoyaltyMinRedeemPoints(s.loyaltyMinRedeemPoints || 0);
      }

      if (settingsRes.stats) {
        setStats(settingsRes.stats);
      }

      const fetchedItems: MenuItem[] = itemsRes.items || [];
      setItems(fetchedItems);
      setCategories(categoriesRes.categories || []);

      // Build local map of item loyalty points
      const pMap: Record<string, number> = {};
      fetchedItems.forEach((it) => {
        pMap[it.id] = (it as any).loyaltyPoints || 0;
      });
      setItemPointsMap(pMap);
    } catch (err) {
      console.error('Failed to load loyalty settings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Save Global Settings
  const handleSaveGlobalSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSavingGlobal(true);
      setSaveSuccessMsg(null);
      await api.updateLoyaltySettings({
        isLoyaltyEnabled,
        loyaltyPerOrderPoints: Number(loyaltyPerOrderPoints),
        loyaltyFoodSpendPerPoint: Number(loyaltyFoodSpendPerPoint),
        loyaltyCoffeeSpendPerPoint: Number(loyaltyCoffeeSpendPerPoint),
        loyaltyFoodPercent: Number(loyaltyFoodPercent),
        loyaltyCoffeePercent: Number(loyaltyCoffeePercent),
        loyaltyPointValue: Number(loyaltyPointValue),
        loyaltyMinOrderAmount: Number(loyaltyMinOrderAmount),
        loyaltyMinRedeemPoints: Number(loyaltyMinRedeemPoints),
      });
      setSaveSuccessMsg('Global loyalty program settings saved successfully!');
      setTimeout(() => setSaveSuccessMsg(null), 4000);
    } catch (err: any) {
      alert(err.message || 'Failed to save loyalty settings.');
    } finally {
      setSavingGlobal(false);
    }
  };

  // Save individual item loyalty points
  const handleSaveItemLoyalty = async (itemId: string) => {
    try {
      setSavingItemId(itemId);
      const raw = itemPointsMap[itemId];
      const pts = Math.max(0, parseInt(String(raw), 10) || 0);
      await api.updateMenuItemLoyalty(itemId, pts);

      // Update local items state
      setItems((prev) =>
        prev.map((it) => (it.id === itemId ? { ...it, loyaltyPoints: pts } : it))
      );
      setItemPointsMap((prev) => ({ ...prev, [itemId]: pts }));

      // Show temporary checkmark feedback
      setItemSaveFeedback((prev) => ({ ...prev, [itemId]: true }));
      setTimeout(() => {
        setItemSaveFeedback((prev) => ({ ...prev, [itemId]: false }));
      }, 2000);
    } catch (err: any) {
      alert(err.message || 'Failed to update item loyalty points.');
    } finally {
      setSavingItemId(null);
    }
  };

  // Filter items
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // 1. Category filter
      if (selectedCategory !== 'ALL' && item.categoryId !== selectedCategory) {
        return false;
      }

      // 2. Resolve Item Type (Food vs Coffee)
      const resolvedType = item.itemType || item.category?.itemType || 'FOOD';

      if (selectedTypeFilter === 'FOOD' && resolvedType !== 'FOOD') return false;
      if (selectedTypeFilter === 'COFFEE' && resolvedType !== 'COFFEE') return false;
      if (selectedTypeFilter === 'CUSTOM') {
        const pts = Number(itemPointsMap[item.id] || 0);
        if (pts <= 0) return false;
      }

      // 3. Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchName = item.name.toLowerCase().includes(query);
        const matchCat = (item.category?.name || '').toLowerCase().includes(query);
        if (!matchName && !matchCat) return false;
      }

      return true;
    });
  }, [items, selectedCategory, selectedTypeFilter, searchQuery, itemPointsMap]);

  // Bulk Apply Points to Filtered Items
  const handleBulkApply = async (pts: number) => {
    if (filteredItems.length === 0) return;
    const confirmMsg = `Apply ${pts} loyalty points to all ${filteredItems.length} filtered items?`;
    if (!window.confirm(confirmMsg)) return;

    try {
      setIsBulkApplying(true);
      const updates = filteredItems.map((it) => ({
        id: it.id,
        loyaltyPoints: pts,
      }));

      await api.batchUpdateMenuItemLoyalty({ updates });

      // Update local states
      const newMap = { ...itemPointsMap };
      updates.forEach((u) => {
        newMap[u.id] = u.loyaltyPoints;
      });
      setItemPointsMap(newMap);
      setItems((prev) =>
        prev.map((it) => (newMap[it.id] !== undefined ? { ...it, loyaltyPoints: Number(newMap[it.id]) || 0 } : it))
      );

      setSaveSuccessMsg(`Updated ${updates.length} items to ${pts} loyalty points!`);
      setTimeout(() => setSaveSuccessMsg(null), 4000);
    } catch (err: any) {
      alert(err.message || 'Failed to bulk apply loyalty points.');
    } finally {
      setIsBulkApplying(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6 pb-12">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 bg-amber-100 text-amber-900 rounded-xl">
                <Award className="w-5 h-5" />
              </span>
              <h1 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900">
                Loyalty & Rewards Program
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-stone-500 mt-1">
              Set per-order point rules, food/coffee category earn rates, and configure individual loyalty points for each menu item.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchData}
              disabled={loading}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-stone-50 border border-stone-200 text-stone-700 rounded-xl text-xs font-semibold shadow-xs transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-amber-600' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Success Alert Banner */}
        {saveSuccessMsg && (
          <div className="flex items-center gap-2.5 p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl text-xs font-semibold shadow-xs">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{saveSuccessMsg}</span>
          </div>
        )}

        {/* Program Status & KPI Overview */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-3xl border border-stone-200 p-4 shadow-soft">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">Loyalty Program</span>
              <span className={`w-2.5 h-2.5 rounded-full ${isLoyaltyEnabled ? 'bg-emerald-500' : 'bg-stone-300'}`} />
            </div>
            <div className="mt-2 flex items-center gap-2">
              <span className={`font-serif text-xl sm:text-2xl font-bold ${isLoyaltyEnabled ? 'text-emerald-700' : 'text-stone-400'}`}>
                {isLoyaltyEnabled ? 'Active' : 'Paused'}
              </span>
            </div>
            <p className="text-[11px] text-stone-400 mt-0.5">
              {isLoyaltyEnabled ? 'Customers earn & redeem points' : 'Points generation paused'}
            </p>
          </div>

          <div className="bg-white rounded-3xl border border-stone-200 p-4 shadow-soft">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">Registered Members</span>
              <Users className="w-4 h-4 text-amber-600" />
            </div>
            <div className="mt-2">
              <span className="font-serif text-xl sm:text-2xl font-bold text-stone-900">{stats.totalMembers}</span>
            </div>
            <p className="text-[11px] text-stone-400 mt-0.5">Unique customers with loyalty cards</p>
          </div>

          <div className="bg-white rounded-3xl border border-stone-200 p-4 shadow-soft">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">Active Circulation</span>
              <Coins className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="mt-2">
              <span className="font-serif text-xl sm:text-2xl font-bold text-stone-900">
                {stats.activeFoodPoints + stats.activeCoffeePoints} <span className="text-xs font-sans text-stone-500 font-normal">pts</span>
              </span>
            </div>
            <p className="text-[11px] text-stone-400 mt-0.5">
              🍔 {stats.activeFoodPoints} Food • ☕ {stats.activeCoffeePoints} Coffee
            </p>
          </div>

          <div className="bg-white rounded-3xl border border-stone-200 p-4 shadow-soft">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">Custom Item Rules</span>
              <Gift className="w-4 h-4 text-purple-600" />
            </div>
            <div className="mt-2">
              <span className="font-serif text-xl sm:text-2xl font-bold text-purple-700">
                {items.filter((it) => Number(itemPointsMap[it.id] || 0) > 0).length} / {items.length}
              </span>
            </div>
            <p className="text-[11px] text-stone-400 mt-0.5">Dishes/drinks with individual points</p>
          </div>
        </div>

        {/* ============================================================== */}
        {/* SECTION 1: GLOBAL RULES & PER-ORDER EARNING SETTINGS           */}
        {/* ============================================================== */}
        <form onSubmit={handleSaveGlobalSettings} className="bg-white rounded-3xl border border-stone-200 p-6 shadow-soft space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-stone-100">
            <div>
              <h2 className="font-serif font-bold text-lg text-stone-900 flex items-center gap-2">
                <Sliders className="w-5 h-5 text-amber-600" />
                <span>Per-Order & Global Earning Rules</span>
              </h2>
              <p className="text-xs text-stone-500 mt-0.5">
                Set how points are awarded automatically on every order and configure the category spend conversion rates.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-stone-800 bg-stone-50 hover:bg-stone-100 px-3 py-1.5 rounded-xl border border-stone-200 transition-colors">
                <input
                  type="checkbox"
                  checked={isLoyaltyEnabled}
                  onChange={(e) => setIsLoyaltyEnabled(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                />
                <span>Enable Loyalty Program</span>
              </label>

              <button
                type="submit"
                disabled={savingGlobal}
                className="inline-flex items-center gap-1.5 bg-nature-900 hover:bg-nature-950 text-white px-5 py-2 rounded-xl text-xs font-bold shadow transition-colors"
              >
                {savingGlobal ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-nature-300" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5 text-nature-300" />
                    <span>Save Rules</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* 1. Per-Order Bonus Points */}
            <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/80 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-amber-950 flex items-center gap-1.5 uppercase tracking-wider">
                  <Gift className="w-4 h-4 text-amber-700" />
                  <span>Per-Order Bonus Points</span>
                </label>
                <span className="text-[11px] font-bold bg-amber-200/80 text-amber-900 px-2 py-0.5 rounded-full">
                  Per Order
                </span>
              </div>
              <p className="text-[11px] text-amber-900/80">
                Fixed bonus points awarded to customer on every order placed (Set 0 to disable order-level bonus).
              </p>
              <div className="relative pt-1">
                <input
                  type="number"
                  min={0}
                  step={1}
                  value={loyaltyPerOrderPoints}
                  onChange={(e) => setLoyaltyPerOrderPoints(e.target.value)}
                  onFocus={(e) => { if (e.target.value === '0') e.target.select(); }}
                  onBlur={() => {
                    if (loyaltyPerOrderPoints === '' || isNaN(Number(loyaltyPerOrderPoints))) {
                      setLoyaltyPerOrderPoints(0);
                    }
                  }}
                  className="w-full pl-3.5 pr-28 py-2.5 rounded-xl border border-amber-300 bg-white font-bold text-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <span className="absolute right-3.5 top-3.5 text-xs text-stone-400 font-semibold pointer-events-none select-none">pts / order</span>
              </div>
            </div>

            {/* 2. Food Category Spend Rate (%) */}
            <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200/80 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-emerald-950 flex items-center gap-1.5 uppercase tracking-wider">
                  <UtensilsCrossed className="w-4 h-4 text-emerald-700" />
                  <span>Food Earn Rate (%)</span>
                </label>
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${Number(loyaltyFoodPercent) === 0 ? 'bg-stone-200 text-stone-700' : 'bg-emerald-200/80 text-emerald-900'}`}>
                  {Number(loyaltyFoodPercent) === 0 ? 'Disabled (0%)' : `${loyaltyFoodPercent}% Cashback`}
                </span>
              </div>
              <p className="text-[11px] text-emerald-900/80">
                Percentage of food spend awarded as Food Points. Set to <strong>0%</strong> to disable food points for RoastFuze.
              </p>
              <div className="relative pt-1">
                <input
                  type="number"
                  min={0}
                  max={100}
                  step={1}
                  value={loyaltyFoodPercent}
                  onChange={(e) => setLoyaltyFoodPercent(e.target.value)}
                  onFocus={(e) => { if (e.target.value === '0') e.target.select(); }}
                  onBlur={() => {
                    if (loyaltyFoodPercent === '' || isNaN(Number(loyaltyFoodPercent))) {
                      setLoyaltyFoodPercent(0);
                    }
                  }}
                  className="w-full pl-3.5 pr-28 py-2.5 rounded-xl border border-emerald-300 bg-white font-bold text-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <span className="absolute right-3.5 top-3.5 text-xs text-stone-400 font-semibold pointer-events-none select-none">% of food bill</span>
              </div>
            </div>

            {/* 3. Coffee & Beverage Spend Rate (%) */}
            <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-300/80 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-amber-950 flex items-center gap-1.5 uppercase tracking-wider">
                  <Coffee className="w-4 h-4 text-amber-800" />
                  <span>Coffee & Drinks Rate (%)</span>
                </label>
                <span className="text-[11px] font-bold bg-amber-300/80 text-amber-950 px-2 py-0.5 rounded-full">
                  Default 15%
                </span>
              </div>
              <p className="text-[11px] text-amber-900/80">
                Percentage of coffee & beverage bill awarded as Coffee Points (e.g. 15% awards 18 pts on ₹120 coffee).
              </p>
              <div className="relative pt-1">
                <input
                  type="number"
                  min={0}
                  max={100}
                  step={1}
                  value={loyaltyCoffeePercent}
                  onChange={(e) => setLoyaltyCoffeePercent(e.target.value)}
                  onFocus={(e) => { if (e.target.value === '0') e.target.select(); }}
                  onBlur={() => {
                    if (loyaltyCoffeePercent === '' || isNaN(Number(loyaltyCoffeePercent))) {
                      setLoyaltyCoffeePercent(15);
                    }
                  }}
                  className="w-full pl-3.5 pr-32 py-2.5 rounded-xl border border-amber-300 bg-white font-bold text-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <span className="absolute right-3.5 top-3.5 text-xs text-stone-400 font-semibold pointer-events-none select-none">% of coffee bill</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-2">
            {/* 4. Point Redemption Conversion Rate */}
            <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-stone-800 flex items-center gap-1.5 uppercase tracking-wider">
                  <Coins className="w-4 h-4 text-amber-600" />
                  <span>Point Value (₹ / Point)</span>
                </label>
                <span className="text-[11px] font-bold bg-stone-200 text-stone-700 px-2 py-0.5 rounded-full">
                  Redemption
                </span>
              </div>
              <p className="text-[11px] text-stone-500">
                Rupee discount value of 1 point when customer redeems at checkout (e.g. 1 pt = ₹1.00).
              </p>
              <div className="relative pt-1">
                <input
                  type="number"
                  min={0.1}
                  step={0.1}
                  value={loyaltyPointValue}
                  onChange={(e) => setLoyaltyPointValue(e.target.value)}
                  onFocus={(e) => { if (e.target.value === '0') e.target.select(); }}
                  onBlur={() => {
                    if (loyaltyPointValue === '' || Number(loyaltyPointValue) <= 0) {
                      setLoyaltyPointValue(1.0);
                    }
                  }}
                  className="w-full pl-3.5 pr-24 py-2.5 rounded-xl border border-stone-300 bg-white font-bold text-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-nature-800 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <span className="absolute right-3.5 top-3.5 text-xs text-stone-400 font-semibold pointer-events-none select-none">₹ / point</span>
              </div>
            </div>

            {/* 5. Min Order Amount */}
            <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-stone-800 flex items-center gap-1.5 uppercase tracking-wider">
                  <DollarSign className="w-4 h-4 text-emerald-600" />
                  <span>Min. Cart Value to Earn</span>
                </label>
                <span className="text-[11px] font-bold bg-stone-200 text-stone-700 px-2 py-0.5 rounded-full">
                  Eligibility
                </span>
              </div>
              <p className="text-[11px] text-stone-500">
                Minimum order amount required before points are rewarded (Leave ₹0 for all orders).
              </p>
              <div className="relative pt-1">
                <input
                  type="number"
                  min={0}
                  step={10}
                  value={loyaltyMinOrderAmount}
                  onChange={(e) => setLoyaltyMinOrderAmount(e.target.value)}
                  onFocus={(e) => { if (e.target.value === '0') e.target.select(); }}
                  onBlur={() => {
                    if (loyaltyMinOrderAmount === '' || isNaN(Number(loyaltyMinOrderAmount))) {
                      setLoyaltyMinOrderAmount(0);
                    }
                  }}
                  className="w-full pl-3.5 pr-28 py-2.5 rounded-xl border border-stone-300 bg-white font-bold text-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-nature-800 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <span className="absolute right-3.5 top-3.5 text-xs text-stone-400 font-semibold pointer-events-none select-none">INR ₹ min</span>
              </div>
            </div>

            {/* 6. Min Wallet Points to Redeem */}
            <div className="p-4 rounded-2xl bg-purple-50/70 border border-purple-200/80 space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-purple-950 flex items-center gap-1.5 uppercase tracking-wider">
                  <Award className="w-4 h-4 text-purple-700" />
                  <span>Min. Points to Redeem</span>
                </label>
                <span className="text-[11px] font-bold bg-purple-200 text-purple-900 px-2 py-0.5 rounded-full">
                  Wallet Min.
                </span>
              </div>
              <p className="text-[11px] text-purple-900/80">
                Minimum points user must have in wallet to redeem at checkout (Leave 0 for any balance).
              </p>
              <div className="relative pt-1">
                <input
                  type="number"
                  min={0}
                  step={5}
                  value={loyaltyMinRedeemPoints}
                  onChange={(e) => setLoyaltyMinRedeemPoints(e.target.value)}
                  onFocus={(e) => { if (e.target.value === '0') e.target.select(); }}
                  onBlur={() => {
                    if (loyaltyMinRedeemPoints === '' || isNaN(Number(loyaltyMinRedeemPoints))) {
                      setLoyaltyMinRedeemPoints(0);
                    }
                  }}
                  className="w-full pl-3.5 pr-28 py-2.5 rounded-xl border border-purple-300 bg-white font-bold text-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-purple-600 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <span className="absolute right-3.5 top-3.5 text-xs text-stone-400 font-semibold pointer-events-none select-none">pts in wallet</span>
              </div>
            </div>
          </div>

          {/* Visual Formula Explainer Card */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-50/70 via-stone-50 to-emerald-50/70 border border-amber-200/60 flex items-start gap-3">
            <Info className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-stone-700 space-y-1.5">
              <p className="font-semibold text-stone-900">
                How Loyalty Points are Awarded & Redeemed:
              </p>
              <p className="text-stone-600 leading-relaxed">
                When a customer orders: Coffee & Drinks earn <strong className="text-amber-800">{loyaltyCoffeePercent}% points</strong> (e.g. ₹100 spent = {loyaltyCoffeePercent} pts worth ₹{((Number(loyaltyCoffeePercent) * Number(loyaltyPointValue))).toFixed(0)} coffee discount). {Number(loyaltyFoodPercent) > 0 ? (
                  <>Food items earn <strong className="text-emerald-800">{loyaltyFoodPercent}% points</strong>.</>
                ) : (
                  <strong className="text-stone-700">Food points are turned OFF (0%) — customers will not see any food points during checkout.</strong>
                )} Plus, orders qualifying for min ₹{loyaltyMinOrderAmount} receive <strong className="text-amber-800">+{loyaltyPerOrderPoints} bonus points</strong> automatically!
              </p>
              {Number(loyaltyMinRedeemPoints) > 0 ? (
                <p className="text-purple-900 font-medium">
                  🔒 <strong>Redemption Rule:</strong> Customers must hold a minimum balance of <strong>{loyaltyMinRedeemPoints} points</strong> in their wallet before redeeming points on any order.
                </p>
              ) : (
                <p className="text-stone-500 font-normal">
                  🔓 <strong>Redemption Rule:</strong> Customers can redeem any amount of available points without minimum balance restrictions.
                </p>
              )}
            </div>
          </div>
        </form>

        {/* ============================================================== */}
        {/* SECTION 2: INDIVIDUAL MENU ITEM LOYALTY POINTS (FOOD / DRINKS)  */}
        {/* ============================================================== */}
        <div className="bg-white rounded-3xl border border-stone-200 p-6 shadow-soft space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-100">
            <div>
              <h2 className="font-serif font-bold text-lg text-stone-900 flex items-center gap-2">
                <Gift className="w-5 h-5 text-purple-600" />
                <span>Individual Menu Item Loyalty Points</span>
              </h2>
              <p className="text-xs text-stone-500 mt-0.5">
                Set custom points for specific food items, beverages, and coffees. When set (&gt;0), customer receives that exact point reward per unit ordered!
              </p>
            </div>

            {/* Quick Bulk Action */}
            <div className="flex items-center gap-2 bg-stone-50 p-2 rounded-2xl border border-stone-200">
              <span className="text-[11px] font-bold text-stone-600 px-1">Quick Apply to View:</span>
              <button
                type="button"
                onClick={() => handleBulkApply(5)}
                disabled={isBulkApplying}
                className="px-2.5 py-1 bg-white hover:bg-stone-100 border border-stone-300 text-stone-700 rounded-lg text-xs font-bold transition-colors"
              >
                +5 pts
              </button>
              <button
                type="button"
                onClick={() => handleBulkApply(10)}
                disabled={isBulkApplying}
                className="px-2.5 py-1 bg-white hover:bg-stone-100 border border-stone-300 text-stone-700 rounded-lg text-xs font-bold transition-colors"
              >
                +10 pts
              </button>
              <button
                type="button"
                onClick={() => handleBulkApply(0)}
                disabled={isBulkApplying}
                className="px-2.5 py-1 bg-stone-200 hover:bg-stone-300 text-stone-700 rounded-lg text-xs font-bold transition-colors"
                title="Reset to default category rate"
              >
                Reset (0)
              </button>
            </div>
          </div>

          {/* Filter and Search Bar */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            {/* Type Filter Buttons */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
              <button
                onClick={() => setSelectedTypeFilter('ALL')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  selectedTypeFilter === 'ALL'
                    ? 'bg-nature-900 text-white shadow-sm'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                All Items ({items.length})
              </button>
              <button
                onClick={() => setSelectedTypeFilter('FOOD')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  selectedTypeFilter === 'FOOD'
                    ? 'bg-emerald-800 text-white shadow-sm'
                    : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                }`}
              >
                <span>🍔 Food Only</span>
              </button>
              <button
                onClick={() => setSelectedTypeFilter('COFFEE')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  selectedTypeFilter === 'COFFEE'
                    ? 'bg-amber-800 text-white shadow-sm'
                    : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
                }`}
              >
                <span>☕ Coffee & Drinks</span>
              </button>
              <button
                onClick={() => setSelectedTypeFilter('CUSTOM')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  selectedTypeFilter === 'CUSTOM'
                    ? 'bg-purple-800 text-white shadow-sm'
                    : 'bg-purple-50 text-purple-800 hover:bg-purple-100'
                }`}
              >
                <span>🎁 Custom Points ({items.filter((it) => Number(itemPointsMap[it.id] || 0) > 0).length})</span>
              </button>
            </div>

            {/* Category and Search Filters */}
            <div className="flex items-center gap-2.5">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-stone-200 text-xs font-semibold text-stone-700 bg-white focus:outline-none focus:ring-2 focus:ring-nature-800"
              >
                <option value="ALL">All Categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>

              <div className="relative flex-1 sm:w-60">
                <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search item name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-stone-200 text-xs text-stone-800 focus:outline-none focus:ring-2 focus:ring-nature-800"
                />
              </div>
            </div>
          </div>

          {/* Items Table / Cards */}
          <div className="overflow-x-auto rounded-2xl border border-stone-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 border-b border-stone-200 text-stone-600 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Menu Item</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Price</th>
                  <th className="py-3 px-4">Loyalty Rule</th>
                  <th className="py-3 px-4 w-48">Points per Item</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-stone-400">
                      No items match your selected filters.
                    </td>
                  </tr>
                ) : (
                  filteredItems.map((item) => {
                    const resolvedType = item.itemType || item.category?.itemType || 'FOOD';
                    const currentPoints = itemPointsMap[item.id] !== undefined ? itemPointsMap[item.id] : ((item as any).loyaltyPoints || 0);
                    const isSaving = savingItemId === item.id;
                    const isSaved = itemSaveFeedback[item.id];
                    const hasCustomPoints = Number(currentPoints) > 0;

                    return (
                      <tr key={item.id} className="hover:bg-stone-50/70 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            {item.image ? (
                              <img
                                src={item.image}
                                alt={item.name}
                                className="w-10 h-10 rounded-xl object-cover border border-stone-200 flex-shrink-0"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-xl bg-stone-100 border border-stone-200 flex items-center justify-center text-stone-400 flex-shrink-0 text-base">
                                {resolvedType === 'COFFEE' ? '☕' : '🍔'}
                              </div>
                            )}
                            <div className="min-w-0">
                              <span className="font-bold text-stone-900 block truncate leading-tight">
                                {item.name}
                              </span>
                              <span className="text-[10px] text-stone-400 truncate block">
                                {item.description || 'Delicious handcrafted item'}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-4 text-stone-600 font-medium">
                          {item.category?.name || 'Uncategorized'}
                        </td>

                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              resolvedType === 'COFFEE'
                                ? 'bg-amber-100 text-amber-900 border border-amber-200'
                                : 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                            }`}
                          >
                            {resolvedType === 'COFFEE' ? '☕ Coffee / Drink' : '🍔 Food Item'}
                          </span>
                        </td>

                        <td className="py-3 px-4 font-bold text-stone-900">
                          ₹{item.price}
                        </td>

                        <td className="py-3 px-4">
                          {hasCustomPoints ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-purple-100 text-purple-900 font-bold border border-purple-200 text-[11px]">
                              <Gift className="w-3 h-3 text-purple-700" />
                              <span>{currentPoints} pts / unit</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-xl bg-stone-100 text-stone-600 text-[10px] font-medium border border-stone-200">
                              <span>⚡ Default Rate (~{Math.floor(item.price / (Number(resolvedType === 'COFFEE' ? loyaltyCoffeeSpendPerPoint : loyaltyFoodSpendPerPoint) || 10))} pts)</span>
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1.5">
                            <input
                              type="number"
                              min={0}
                              step={1}
                              value={itemPointsMap[item.id] !== undefined ? itemPointsMap[item.id] : ((item as any).loyaltyPoints || 0)}
                              onChange={(e) => {
                                const val = e.target.value;
                                setItemPointsMap((prev) => ({ ...prev, [item.id]: val }));
                              }}
                              onFocus={(e) => { if (e.target.value === '0') e.target.select(); }}
                              onBlur={() => {
                                const raw = itemPointsMap[item.id];
                                if (raw === '' || isNaN(Number(raw))) {
                                  setItemPointsMap((prev) => ({ ...prev, [item.id]: 0 }));
                                }
                              }}
                              className="w-20 px-2.5 py-1.5 rounded-xl border border-stone-300 font-bold text-stone-900 text-xs focus:outline-none focus:ring-2 focus:ring-nature-800 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            />
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() =>
                                  setItemPointsMap((prev) => ({
                                    ...prev,
                                    [item.id]: (parseInt(String(prev[item.id] !== undefined ? prev[item.id] : (item as any).loyaltyPoints || 0), 10) || 0) + 5,
                                  }))
                                }
                                className="px-1.5 py-1 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded text-[10px] font-bold"
                                title="Add 5 points"
                              >
                                +5
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  setItemPointsMap((prev) => ({ ...prev, [item.id]: 0 }))
                                }
                                className="px-1.5 py-1 bg-stone-100 hover:bg-stone-200 text-stone-500 rounded text-[10px] font-bold"
                                title="Reset to 0 (default spend rate)"
                              >
                                0
                              </button>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => handleSaveItemLoyalty(item.id)}
                            disabled={isSaving}
                            className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                              isSaved
                                ? 'bg-emerald-600 text-white'
                                : 'bg-nature-900 hover:bg-nature-950 text-white shadow-xs'
                            }`}
                          >
                            {isSaving ? (
                              <RefreshCw className="w-3 h-3 animate-spin text-nature-300" />
                            ) : isSaved ? (
                              <>
                                <Check className="w-3 h-3 text-white" />
                                <span>Saved</span>
                              </>
                            ) : (
                              <>
                                <Save className="w-3 h-3 text-nature-300" />
                                <span>Save</span>
                              </>
                            )}
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};
