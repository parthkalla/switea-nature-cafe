import React, { useState } from 'react';
import { X, Check, Plus, Minus } from 'lucide-react';
import { MenuItem, ItemVariant, ModifierOption } from '../../types';

interface ModifierModalProps {
  item: MenuItem;
  onClose: () => void;
  onAddToCart: (payload: {
    variantId?: string;
    variantName?: string;
    selectedModifiers: { id: string; name: string; price: number }[];
    quantity: number;
    notes?: string;
  }) => void;
}

export const ModifierModal: React.FC<ModifierModalProps> = ({ item, onClose, onAddToCart }) => {
  const [selectedVariant, setSelectedVariant] = useState<ItemVariant | undefined>(
    item.variants?.find((v) => v.isDefault) || item.variants?.[0]
  );

  const [selectedOptions, setSelectedOptions] = useState<ModifierOption[]>(() => {
    const defaults: ModifierOption[] = [];
    item.modifierGroups?.forEach((g) => {
      g.options.forEach((opt) => {
        if (opt.isDefault) defaults.push(opt);
      });
    });
    return defaults;
  });

  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');

  const basePrice = selectedVariant ? selectedVariant.price : item.price;
  const modifiersPrice = selectedOptions.reduce((acc, opt) => acc + opt.price, 0);
  const totalPrice = (basePrice + modifiersPrice) * quantity;

  const toggleOption = (groupMaxSelect: number, option: ModifierOption) => {
    setSelectedOptions((prev) => {
      const exists = prev.some((o) => o.id === option.id);
      if (exists) {
        return prev.filter((o) => o.id !== option.id);
      }
      if (groupMaxSelect === 1) {
        // Replace other option from same group
        return [...prev.filter((o) => !item.modifierGroups?.some(g => g.options.some(opt => opt.id === o.id && g.options.some(opt2 => opt2.id === option.id)))), option];
      }
      return [...prev, option];
    });
  };

  const handleConfirm = () => {
    onAddToCart({
      variantId: selectedVariant?.id,
      variantName: selectedVariant?.name,
      selectedModifiers: selectedOptions.map((o) => ({ id: o.id, name: o.name, price: o.price })),
      quantity,
      notes: notes.trim() || undefined,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="relative p-6 border-b border-stone-100 flex items-start justify-between">
          <div className="pr-8">
            <div className="flex items-center gap-2 mb-1">
              <span className={`w-3.5 h-3.5 border-2 rounded-sm flex items-center justify-center ${item.isVeg ? 'border-green-600' : 'border-red-600'}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${item.isVeg ? 'bg-green-600' : 'bg-red-600'}`} />
              </span>
              <h3 className="font-serif text-xl font-bold text-stone-900">{item.name}</h3>
            </div>
            <p className="text-sm text-stone-500 line-clamp-2">{item.description}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-stone-100 text-stone-400 hover:text-stone-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Variants / Sizes */}
          {item.variants && item.variants.length > 0 && (
            <div>
              <h4 className="text-xs uppercase tracking-wider font-bold text-stone-500 mb-3">
                Select Size / Variant
              </h4>
              <div className="grid grid-cols-2 gap-2.5">
                {item.variants.map((variant) => {
                  const isSelected = selectedVariant?.id === variant.id;
                  return (
                    <button
                      key={variant.id}
                      type="button"
                      onClick={() => setSelectedVariant(variant)}
                      className={`p-3 rounded-2xl border text-left flex items-center justify-between transition-all ${
                        isSelected
                          ? 'border-nature-900 bg-nature-50/60 ring-2 ring-nature-900/10'
                          : 'border-stone-200 hover:border-stone-300'
                      }`}
                    >
                      <div>
                        <span className="font-semibold text-sm text-stone-800 block">{variant.name}</span>
                        <span className="text-xs text-nature-800 font-medium">₹{variant.price}</span>
                      </div>
                      <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${isSelected ? 'border-nature-900 bg-nature-900 text-white' : 'border-stone-300'}`}>
                        {isSelected && <Check className="w-3 h-3" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Modifier Groups */}
          {item.modifierGroups?.map((group) => (
            <div key={group.id} className="pt-2 border-t border-stone-100">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs uppercase tracking-wider font-bold text-stone-600">
                  {group.name}
                </h4>
                {group.isRequired && (
                  <span className="text-xs text-terracotta-600 font-medium">Required</span>
                )}
              </div>
              <div className="space-y-2">
                {group.options.map((option) => {
                  const isSelected = selectedOptions.some((o) => o.id === option.id);
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => toggleOption(group.maxSelect, option)}
                      className={`w-full p-3 rounded-xl border flex items-center justify-between text-left transition-colors ${
                        isSelected
                          ? 'border-nature-800 bg-nature-50/50'
                          : 'border-stone-200 hover:bg-stone-50'
                      }`}
                    >
                      <span className="text-sm font-medium text-stone-800">{option.name}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-semibold text-stone-600">
                          {option.price > 0 ? `+₹${option.price}` : 'Free'}
                        </span>
                        <div className={`w-5 h-5 rounded-md border flex items-center justify-center ${isSelected ? 'bg-nature-900 border-nature-900 text-white' : 'border-stone-300'}`}>
                          {isSelected && <Check className="w-3.5 h-3.5" />}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Special Cooking Instructions */}
          <div className="pt-2 border-t border-stone-100">
            <label className="text-xs uppercase tracking-wider font-bold text-stone-600 block mb-2">
              Special Cooking Instructions (Optional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Extra hot chai, less spicy, no onions..."
              className="w-full px-4 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-nature-800"
            />
          </div>
        </div>

        {/* Footer with quantity and add to cart */}
        <div className="p-4 sm:p-6 border-t border-stone-100 bg-cream-50 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 bg-white border border-stone-200 px-3 py-1.5 rounded-full shadow-sm">
            <button
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              className="p-1 hover:text-nature-900 text-stone-600"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="font-bold text-sm text-stone-800 w-4 text-center">{quantity}</span>
            <button
              onClick={() => setQuantity((q) => q + 1)}
              className="p-1 hover:text-nature-900 text-stone-600"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={handleConfirm}
            className="flex-1 bg-nature-900 hover:bg-nature-950 text-white py-3.5 px-6 rounded-2xl font-bold text-sm shadow-md transition-all flex items-center justify-between"
          >
            <span>Add to Cart</span>
            <span>₹{totalPrice}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
