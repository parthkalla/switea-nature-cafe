import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import {
  Search,
  Sparkles,
  ShoppingBag,
  SlidersHorizontal,
  X,
  AlertCircle,
  Clock,
  Phone,
  Utensils,
} from 'lucide-react';
import { Navbar } from '../../components/layout/Navbar';
import { Footer } from '../../components/layout/Footer';
import { MenuItemCard } from '../../components/menu/MenuItemCard';
import { api } from '../../services/api';
import { useCart } from '../../context/CartContext';
import { MenuCategory, Restaurant, Table } from '../../types';

export const MenuPage: React.FC = () => {
  const { restaurantSlug = 'switea', tableToken } = useParams<{ restaurantSlug?: string; tableToken?: string }>();
  const [searchParams] = useSearchParams();
  const initialCategory = searchParams.get('category');

  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory || 'ALL');
  const [vegOnly, setVegOnly] = useState(false);

  const { setTableSession, tableInfo, totalItemCount, subtotal } = useCart();

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError(null);

        // If tableToken is provided in URL, resolve table association
        if (tableToken) {
          try {
            const tableRes = await api.getTableByToken(tableToken);
            setTableSession(tableToken, {
              tableNumber: tableRes.table.tableNumber,
              name: tableRes.table.name,
              section: tableRes.table.section,
            });
          } catch (tErr: any) {
            console.error('Table token resolution error:', tErr);
            setError(tErr.message || 'Invalid table token.');
          }
        }

        const menuRes = await api.getMenu(restaurantSlug);
        setRestaurant(menuRes.restaurant);
        setCategories(menuRes.categories || []);

        if (initialCategory) {
          setSelectedCategory(initialCategory);
        }
      } catch (err: any) {
        console.error('Failed to load menu:', err);
        setError('Failed to load digital menu.');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [restaurantSlug, tableToken, initialCategory]);

  // Filtered menu items
  const filteredCategories = useMemo(() => {
    return categories
      .map((cat) => {
        if (selectedCategory !== 'ALL' && cat.slug !== selectedCategory) {
          return null;
        }

        const matchedItems = (cat.items || []).filter((item) => {
          const matchQuery =
            item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()));
          const matchVeg = vegOnly ? item.isVeg : true;
          return matchQuery && matchVeg;
        });

        if (matchedItems.length === 0) return null;

        return {
          ...cat,
          items: matchedItems,
        };
      })
      .filter(Boolean) as MenuCategory[];
  }, [categories, selectedCategory, searchQuery, vegOnly]);

  if (loading) {
    return (
      <div className="min-h-screen bg-cream-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full border-4 border-nature-900 border-t-transparent animate-spin mx-auto mb-4" />
          <p className="font-serif text-lg font-bold text-nature-950">Preparing Digital Menu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream-100 text-stone-800 flex flex-col selection:bg-nature-200 pb-24">
      <Navbar />

      {/* Table Session Header */}
      {tableInfo && (
        <div className="bg-nature-900 text-white px-4 py-3 shadow-md">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              <p className="text-sm font-semibold">
                You are ordering for <strong className="text-nature-200">{tableInfo.tableNumber}</strong> ({tableInfo.name} • {tableInfo.section})
              </p>
            </div>
            <span className="text-xs text-nature-300">
              Orders will be served directly to your table
            </span>
          </div>
        </div>
      )}

      {/* Error alert if table token is invalid */}
      {error && (
        <div className="max-w-4xl mx-auto mt-4 px-4">
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center gap-3 text-amber-900 text-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-amber-600" />
            <span>{error} You can still browse the full menu.</span>
          </div>
        </div>
      )}

      {/* Menu Header Banner */}
      <section className="bg-white border-b border-stone-200/80 pt-8 pb-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <span className="text-xs uppercase tracking-wider font-bold text-nature-700 block mb-1">
                {restaurant?.tagLine || 'A Sip of Sweetness'}
              </span>
              <h1 className="font-serif text-3xl sm:text-4xl font-bold text-stone-900">
                {restaurant?.name || 'Switea Nature Cafe'} Digital Menu
              </h1>
              <p className="text-xs text-stone-500 mt-1 flex items-center gap-4">
                <span>📍 Jaipur, Rajasthan</span>
                <span>⏰ {restaurant?.openingHours}</span>
                <span className="text-emerald-700 font-semibold">● Open Now</span>
              </p>
            </div>

            {/* Search & Veg Filter */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              {/* Search Bar */}
              <div className="relative">
                <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search chai, maggi, pizza..."
                  className="w-full sm:w-64 pl-10 pr-8 py-2.5 rounded-full border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-nature-800 bg-cream-50"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Veg Only Toggle */}
              <button
                onClick={() => setVegOnly(!vegOnly)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-bold transition-all border ${
                  vegOnly
                    ? 'bg-green-700 text-white border-green-700 shadow-sm'
                    : 'bg-white text-stone-700 border-stone-200 hover:border-green-600'
                }`}
              >
                <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
                <span>Veg Only</span>
              </button>
            </div>
          </div>

          {/* Sticky Category Scroll Bar */}
          <div className="mt-8 flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none no-scrollbar">
            <button
              onClick={() => setSelectedCategory('ALL')}
              className={`px-5 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                selectedCategory === 'ALL'
                  ? 'bg-nature-900 text-white shadow-sm'
                  : 'bg-cream-200 text-stone-700 hover:bg-cream-300'
              }`}
            >
              All Items
            </button>
            {categories.map((cat) => {
              const isSelected = selectedCategory === cat.slug;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.slug)}
                  className={`px-5 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                    isSelected
                      ? 'bg-nature-900 text-white shadow-sm'
                      : 'bg-cream-200 text-stone-700 hover:bg-cream-300'
                  }`}
                >
                  {cat.name}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Main Items Listing */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-1">
        {filteredCategories.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-stone-200 p-8">
            <Utensils className="w-12 h-12 text-stone-300 mx-auto mb-3" />
            <h3 className="font-serif text-xl font-bold text-stone-800">No items match your search</h3>
            <p className="text-xs text-stone-500 mt-1 mb-4">Try searching for something else or clearing filters.</p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('ALL');
                setVegOnly(false);
              }}
              className="bg-nature-900 text-white text-xs font-bold px-5 py-2.5 rounded-full"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="space-y-12">
            {filteredCategories.map((cat) => (
              <section key={cat.id} id={cat.slug} className="scroll-mt-24">
                <div className="flex items-center gap-3 mb-6">
                  <h2 className="font-serif text-2xl font-bold text-stone-900">{cat.name}</h2>
                  <span className="text-xs text-stone-500 font-medium bg-cream-200 px-2.5 py-0.5 rounded-full">
                    {cat.items?.length || 0} items
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {cat.items?.map((item) => (
                    <MenuItemCard key={item.id} item={item} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </main>

      {/* Floating Bottom Cart Bar */}
      {totalItemCount > 0 && (
        <aside aria-label="Order summary" className="fixed bottom-4 left-4 right-4 max-w-lg mx-auto z-40 bg-nature-900 text-white rounded-2xl shadow-2xl p-4 flex items-center justify-between border border-nature-800 animate-in slide-in-from-bottom duration-300">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-nature-800 flex items-center justify-center font-bold text-sm">
              <ShoppingBag className="w-5 h-5 text-nature-300" />
            </div>
            <div>
              <span className="text-xs text-stone-300 block">{totalItemCount} {totalItemCount === 1 ? 'item' : 'items'} added</span>
              <span className="font-serif text-lg font-extrabold text-white">₹{subtotal.toFixed(2)}</span>
            </div>
          </div>

          <Link
            to="/cart"
            className="bg-white hover:bg-stone-100 text-nature-950 font-bold text-xs px-6 py-3 rounded-xl shadow transition-colors flex items-center gap-1.5"
          >
            <span>View Cart</span>
            <span>→</span>
          </Link>
        </aside>
      )}

      <Footer />
    </div>
  );
};
