import React, { useState } from 'react';
import { Plus, Minus, Sparkles, Flame, Clock } from 'lucide-react';
import { MenuItem } from '../../types';
import { useCart } from '../../context/CartContext';
import { ModifierModal } from './ModifierModal';

interface MenuItemCardProps {
  item: MenuItem;
}

export const MenuItemCard: React.FC<MenuItemCardProps> = ({ item }) => {
  const [showModal, setShowModal] = useState(false);
  const { items, addItem, updateQuantity } = useCart();

  const cartEntry = items.find((i) => i.menuItemId === item.id);
  const hasCustomizations = (item.variants && item.variants.length > 0) || (item.modifierGroups && item.modifierGroups.length > 0);

  const handleAddClick = () => {
    if (hasCustomizations) {
      setShowModal(true);
    } else {
      addItem({
        menuItemId: item.id,
        name: item.name,
        price: item.price,
        image: item.image,
        isVeg: item.isVeg,
        quantity: 1,
      });
    }
  };

  return (
    <>
      <div className="bg-white rounded-2xl border border-stone-200/80 shadow-soft overflow-hidden flex flex-col hover:shadow-card transition-all duration-300 group">
        {/* Item Image with Badges */}
        <div className="relative aspect-[4/3] bg-stone-100 overflow-hidden">
          {item.image ? (
            <img
              src={item.image}
              alt={item.name}
              loading="lazy"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-cream-200 text-stone-400 font-serif text-sm">
              Switea Nature Cafe
            </div>
          )}

          {/* Badges Overlay */}
          <div className="absolute top-2.5 left-2.5 flex flex-wrap gap-1.5 z-10">
            {item.isBestseller && (
              <span className="bg-amber-500/95 text-white text-[11px] font-bold px-2.5 py-0.5 rounded-full shadow-sm flex items-center gap-1 backdrop-blur-sm">
                <Sparkles className="w-3 h-3" /> Bestseller
              </span>
            )}
            {item.isSpecial && (
              <span className="bg-nature-900/90 text-nature-200 text-[11px] font-bold px-2.5 py-0.5 rounded-full shadow-sm flex items-center gap-1 backdrop-blur-sm">
                <Flame className="w-3 h-3 text-terracotta-500" /> Chef's Special
              </span>
            )}
          </div>

          {/* Availability overlay if paused */}
          {!item.isAvailable && (
            <div className="absolute inset-0 bg-stone-900/70 backdrop-blur-[2px] flex items-center justify-center z-20">
              <span className="bg-white/90 text-stone-800 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                Sold Out Today
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4 flex-1 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              {/* Veg / Non-Veg Indicator */}
              <span
                className={`w-3.5 h-3.5 border-2 rounded-sm flex items-center justify-center flex-shrink-0 ${
                  item.isVeg ? 'border-green-600' : 'border-red-600'
                }`}
                title={item.isVeg ? 'Vegetarian' : 'Non-Vegetarian'}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${item.isVeg ? 'bg-green-600' : 'bg-red-600'}`} />
              </span>
              <h3 className="font-serif font-bold text-base text-stone-900 leading-snug line-clamp-1">
                {item.name}
              </h3>
            </div>

            {item.description && (
              <p className="text-xs text-stone-500 line-clamp-2 leading-relaxed mb-3">
                {item.description}
              </p>
            )}
          </div>

          <div className="pt-2 border-t border-stone-100 flex items-center justify-between mt-auto">
            <div>
              <span className="text-base font-extrabold text-nature-950">₹{item.price}</span>
              {hasCustomizations && (
                <span className="block text-[10px] text-stone-500 font-medium">Customizable</span>
              )}
            </div>

            {item.isAvailable && (
              <div>
                {cartEntry && !hasCustomizations ? (
                  <div className="flex items-center gap-2 bg-nature-100 text-nature-900 rounded-full px-2.5 py-1 border border-nature-300 font-bold text-xs shadow-sm">
                    <button
                      onClick={() => updateQuantity(item.id, undefined, -1)}
                      className="p-0.5 hover:text-nature-950"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span>{cartEntry.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.id, undefined, 1)}
                      className="p-0.5 hover:text-nature-950"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={handleAddClick}
                    className="bg-nature-900 hover:bg-nature-950 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-sm transition-all hover:scale-105 active:scale-95 flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5 text-nature-300" />
                    <span>ADD</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {showModal && (
        <ModifierModal
          item={item}
          onClose={() => setShowModal(false)}
          onAddToCart={(payload) => {
            addItem({
              menuItemId: item.id,
              name: item.name,
              price: item.price,
              image: item.image,
              isVeg: item.isVeg,
              ...payload,
            });
          }}
        />
      )}
    </>
  );
};
