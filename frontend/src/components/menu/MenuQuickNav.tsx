import React, { useState } from 'react';
import {
  Layers,
  X,
  Coffee,
  Pizza,
  Cake,
  ArrowUp,
  Search,
  Sparkles,
  ChevronRight,
} from 'lucide-react';
import { MenuCategory } from '../../types';

interface MenuQuickNavProps {
  categories: MenuCategory[];
  activeCategory: string;
  onSelectCategory: (categorySlug: string) => void;
  hasBottomCart?: boolean;
}

export const MenuQuickNav: React.FC<MenuQuickNavProps> = ({
  categories,
  activeCategory,
  onSelectCategory,
  hasBottomCart = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [filterQuery, setFilterQuery] = useState('');

  const handleJump = (slug: string) => {
    onSelectCategory(slug);
    setIsOpen(false);
    setTimeout(() => {
      if (slug === 'ALL') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
      const el = document.getElementById(slug);
      if (el) {
        const offset = 90;
        const bodyRect = document.body.getBoundingClientRect().top;
        const elementRect = el.getBoundingClientRect().top;
        const elementPosition = elementRect - bodyRect;
        const offsetPosition = elementPosition - offset;

        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth',
        });
      }
    }, 120);
  };

  const handleScrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setIsOpen(false);
  };

  const filteredCategories = categories.filter((c) =>
    c.name.toLowerCase().includes(filterQuery.toLowerCase())
  );

  // Group into Beverages, Food, Desserts
  const beverageCategories = filteredCategories.filter(
    (c) =>
      c.itemType === 'COFFEE' ||
      ['hot-coffee', 'iced-coffee', 'frappe-ice-cream', 'iced-teas-authentic-teas', 'gourmet-thick-shakes', 'balcony-coolers-mocktails'].includes(c.slug)
  );

  const foodCategories = filteredCategories.filter(
    (c) =>
      c.itemType === 'FOOD' &&
      !['sweet-treats-desserts'].includes(c.slug)
  );

  const dessertCategories = filteredCategories.filter((c) =>
    ['sweet-treats-desserts'].includes(c.slug)
  );

  return (
    <>
      {/* Floating Action Button at Bottom Right */}
      <div
        className={`fixed right-4 sm:right-8 z-40 transition-all duration-300 ${
          hasBottomCart ? 'bottom-24 sm:bottom-28' : 'bottom-6 sm:bottom-8'
        }`}
      >
        <button
          onClick={() => setIsOpen(true)}
          className="group flex items-center gap-2.5 bg-nature-950 hover:bg-stone-900 text-white px-4 sm:px-5 py-3 sm:py-3.5 rounded-full shadow-2xl border border-nature-700/80 hover:border-amber-400 hover:scale-105 active:scale-95 transition-all text-xs sm:text-sm font-bold tracking-wide"
          aria-label="Quick category navigation"
        >
          <div className="w-6 h-6 rounded-full bg-amber-400/20 text-amber-300 flex items-center justify-center">
            <Layers className="w-3.5 h-3.5" />
          </div>
          <span>Quick Menu</span>
          <span className="bg-amber-400 text-nature-950 text-[10px] font-extrabold px-2 py-0.5 rounded-full">
            {categories.length}
          </span>
        </button>
      </div>

      {/* Slide-over / Modal Backdrop */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className="w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-stone-200 max-h-[85vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-300"
            role="dialog"
            aria-modal="true"
          >
            {/* Header */}
            <div className="p-4 sm:p-5 bg-cream-50 border-b border-stone-200 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center font-bold">
                  <Layers className="w-4 h-4 text-amber-800" />
                </div>
                <div>
                  <h3 className="font-serif text-lg font-bold text-stone-900">Jump to Category</h3>
                  <p className="text-[11px] text-stone-500">Instant scroll to your favorite dishes & roasts</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-500 hover:text-stone-800 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Search inside Drawer */}
            <div className="p-3 border-b border-stone-100 bg-white flex-shrink-0">
              <div className="relative">
                <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={filterQuery}
                  onChange={(e) => setFilterQuery(e.target.value)}
                  placeholder="Filter category (e.g. Pizza, Coffee, Momos...)"
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-stone-200 bg-stone-50 focus:outline-none focus:ring-2 focus:ring-amber-800"
                />
              </div>
            </div>

            {/* Category Groups List */}
            <div className="p-4 overflow-y-auto space-y-5 flex-1 divide-y divide-stone-100">
              {/* Show All Full Menu Button */}
              <button
                type="button"
                onClick={() => handleJump('ALL')}
                className="w-full p-3 rounded-2xl border border-stone-200 bg-cream-50 hover:bg-cream-100 flex items-center justify-between text-xs font-bold text-stone-800 transition-colors shadow-xs"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-amber-400 text-stone-900 flex items-center justify-center">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                  <div className="text-left">
                    <span className="block font-bold">View Full Menu (All Items)</span>
                    <span className="text-[10px] text-stone-500 font-normal">Show all 11 food & beverage sections</span>
                  </div>
                </div>
                <ArrowUp className="w-4 h-4 text-stone-400" />
              </button>

              {/* Beverages Section */}
              {beverageCategories.length > 0 && (
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800 flex items-center gap-1.5 mb-2">
                    <Coffee className="w-3.5 h-3.5 text-amber-700" />
                    <span>Artisan Roasts & Beverages</span>
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {beverageCategories.map((cat) => {
                      const isActive = activeCategory === cat.slug;
                      return (
                        <button
                          key={cat.id}
                          onClick={() => handleJump(cat.slug)}
                          className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                            isActive
                              ? 'bg-amber-50/80 border-amber-300 text-amber-950 font-bold shadow-sm'
                              : 'bg-stone-50/60 hover:bg-stone-100 border-stone-200/80 text-stone-800'
                          }`}
                        >
                          <div>
                            <span className="text-xs font-semibold block">{cat.name}</span>
                            <span className="text-[10px] text-stone-500">
                              {cat.items?.length || 0} items • Coffee Points ☕
                            </span>
                          </div>
                          <ChevronRight className="w-4 h-4 text-stone-400 group-hover:text-stone-700" />
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Food Section */}
              {foodCategories.length > 0 && (
                <div className="pt-4">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1.5 mb-2">
                    <Pizza className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Balcony Gourmet Bites</span>
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {foodCategories.map((cat) => {
                      const isActive = activeCategory === cat.slug;
                      return (
                        <button
                          key={cat.id}
                          onClick={() => handleJump(cat.slug)}
                          className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                            isActive
                              ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950 font-bold shadow-sm'
                              : 'bg-stone-50/60 hover:bg-stone-100 border-stone-200/80 text-stone-800'
                          }`}
                        >
                          <div>
                            <span className="text-xs font-semibold block">{cat.name}</span>
                            <span className="text-[10px] text-stone-500">
                              {cat.items?.length || 0} items • Food Points 🍔
                            </span>
                          </div>
                          <ChevronRight className="w-4 h-4 text-stone-400" />
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Desserts Section */}
              {dessertCategories.length > 0 && (
                <div className="pt-4">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-rose-800 flex items-center gap-1.5 mb-2">
                    <Cake className="w-3.5 h-3.5 text-rose-700" />
                    <span>Sweet Treats & Waffles</span>
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {dessertCategories.map((cat) => {
                      const isActive = activeCategory === cat.slug;
                      return (
                        <button
                          key={cat.id}
                          onClick={() => handleJump(cat.slug)}
                          className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                            isActive
                              ? 'bg-rose-50/80 border-rose-300 text-rose-950 font-bold shadow-sm'
                              : 'bg-stone-50/60 hover:bg-stone-100 border-stone-200/80 text-stone-800'
                          }`}
                        >
                          <div>
                            <span className="text-xs font-semibold block">{cat.name}</span>
                            <span className="text-[10px] text-stone-500">
                              {cat.items?.length || 0} items • Food Points 🍰
                            </span>
                          </div>
                          <ChevronRight className="w-4 h-4 text-stone-400" />
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Actions */}
            <div className="p-3 bg-cream-50 border-t border-stone-200 flex items-center justify-between flex-shrink-0 text-xs">
              <button
                onClick={handleScrollToTop}
                className="flex items-center gap-1.5 text-stone-600 hover:text-stone-900 font-semibold px-3 py-1.5 rounded-lg hover:bg-stone-200/60 transition-colors"
              >
                <ArrowUp className="w-3.5 h-3.5" />
                <span>Scroll to Top</span>
              </button>
              <button
                onClick={() => {
                  onSelectCategory('ALL');
                  setIsOpen(false);
                }}
                className="bg-nature-950 text-white font-bold px-4 py-2 rounded-xl text-xs shadow hover:bg-stone-800 transition-colors"
              >
                Show All Items
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
