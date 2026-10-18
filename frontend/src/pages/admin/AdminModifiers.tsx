import React, { useEffect, useState } from 'react';
import {
  Layers,
  Plus,
  Trash2,
  Search,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  UtensilsCrossed,
  Tag,
  DollarSign,
  X,
} from 'lucide-react';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { api } from '../../services/api';
import { MenuItem } from '../../types';

interface ModifierOption {
  id: string;
  name: string;
  price: number;
  isDefault: boolean;
}

interface ModifierGroup {
  id: string;
  name: string;
  minSelect: number;
  maxSelect: number;
  isRequired: boolean;
  menuItem: {
    id: string;
    name: string;
    slug: string;
    price: number;
  };
  options: ModifierOption[];
}

export const AdminModifiers: React.FC = () => {
  const [groups, setGroups] = useState<ModifierGroup[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // New Group Form State
  const [selectedMenuItemId, setSelectedMenuItemId] = useState('');
  const [groupName, setGroupName] = useState('');
  const [minSelect, setMinSelect] = useState(0);
  const [maxSelect, setMaxSelect] = useState(1);
  const [isRequired, setIsRequired] = useState(false);
  const [options, setOptions] = useState<Array<{ name: string; price: number; isDefault: boolean }>>([
    { name: '', price: 0, isDefault: true },
  ]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [modifiersRes, itemsRes] = await Promise.all([
        api.getAdminModifiers(),
        api.getAdminMenuItems(),
      ]);
      setGroups(modifiersRes.groups || []);
      setMenuItems(itemsRes.items || []);
      if (itemsRes.items && itemsRes.items.length > 0 && !selectedMenuItemId) {
        setSelectedMenuItemId(itemsRes.items[0].id);
      }
    } catch (err) {
      console.error('Failed to load modifiers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddOptionRow = () => {
    setOptions([...options, { name: '', price: 0, isDefault: false }]);
  };

  const handleRemoveOptionRow = (index: number) => {
    if (options.length <= 1) return;
    setOptions(options.filter((_, idx) => idx !== index));
  };

  const handleOptionChange = (index: number, field: string, val: any) => {
    const updated = [...options];
    updated[index] = { ...updated[index], [field]: val };
    setOptions(updated);
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMenuItemId || !groupName.trim()) {
      alert('Please select a menu item and enter a group name.');
      return;
    }

    const validOptions = options.filter((o) => o.name.trim());
    if (validOptions.length === 0) {
      alert('Please add at least one modifier option.');
      return;
    }

    try {
      setSubmitting(true);
      await api.createModifierGroup({
        menuItemId: selectedMenuItemId,
        name: groupName.trim(),
        minSelect: Number(minSelect),
        maxSelect: Number(maxSelect),
        isRequired,
        options: validOptions,
      });

      setShowCreateModal(false);
      setGroupName('');
      setOptions([{ name: '', price: 0, isDefault: true }]);
      loadData();
      setToastMessage('Modifier group created successfully.');
      setTimeout(() => setToastMessage(null), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to create modifier group.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteGroup = async (id: string) => {
    if (!window.confirm('Delete this modifier group?')) return;
    try {
      await api.deleteModifierGroup(id);
      setGroups(groups.filter((g) => g.id !== id));
      setToastMessage('Modifier group deleted.');
      setTimeout(() => setToastMessage(null), 3000);
    } catch (err) {
      alert('Failed to delete modifier group.');
    }
  };

  const filteredGroups = groups.filter(
    (g) =>
      g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.menuItem.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-nature-100 text-nature-900 text-xs font-semibold mb-2">
              <Layers className="w-3.5 h-3.5 text-nature-700" />
              <span>Menu Customizations & Add-ons</span>
            </div>
            <h1 className="font-serif text-3xl font-bold text-stone-900">Item Modifiers & Options</h1>
            <p className="text-xs text-stone-500 mt-1">
              Configure variant add-ons, sugar levels, spice customizers, and extra toppings
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 bg-nature-900 hover:bg-nature-950 text-white font-bold text-sm px-5 py-2.5 rounded-full shadow transition-all duration-200"
            >
              <Plus className="w-4 h-4" />
              <span>New Modifier Group</span>
            </button>
          </div>
        </div>

        {/* Feedback Toast */}
        {toastMessage && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-emerald-900 text-sm animate-in fade-in">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Search & Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-soft">
            <span className="text-xs text-stone-500 font-medium block">Total Modifier Groups</span>
            <span className="font-serif text-2xl font-bold text-stone-900 mt-1 block">
              {groups.length}
            </span>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-soft">
            <span className="text-xs text-stone-500 font-medium block">Customizable Menu Items</span>
            <span className="font-serif text-2xl font-bold text-stone-900 mt-1 block">
              {new Set(groups.map((g) => g.menuItem.id)).size}
            </span>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-soft">
            <span className="text-xs text-stone-500 font-medium block">Total Add-on Options</span>
            <span className="font-serif text-2xl font-bold text-nature-900 mt-1 block">
              {groups.reduce((acc, g) => acc + g.options.length, 0)}
            </span>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="bg-white p-4 rounded-2xl border border-stone-200/80 shadow-soft flex items-center justify-between">
          <div className="relative w-full max-w-md">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter by modifier or item name..."
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-nature-800"
            />
          </div>
        </div>

        {/* Groups Grid */}
        {loading ? (
          <div className="py-20 text-center">
            <div className="w-10 h-10 border-4 border-nature-900 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm font-semibold text-stone-700">Loading modifier groups...</p>
          </div>
        ) : filteredGroups.length === 0 ? (
          <div className="bg-white rounded-3xl border border-stone-200 p-12 text-center">
            <Layers className="w-12 h-12 text-stone-300 mx-auto mb-3" />
            <h3 className="font-serif text-lg font-bold text-stone-800">No Modifier Groups Found</h3>
            <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto mb-5">
              Add customization options like tea sweetness levels, dip choices, or cheese toppings.
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-nature-900 text-white px-5 py-2.5 rounded-full text-xs font-bold shadow"
            >
              Create First Modifier Group
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredGroups.map((group) => (
              <div
                key={group.id}
                className="bg-white rounded-2xl border border-stone-200/90 shadow-soft p-5 flex flex-col justify-between hover:shadow-card transition-all"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <span className="text-[11px] font-bold text-nature-700 uppercase tracking-wider block">
                        Item: {group.menuItem.name}
                      </span>
                      <h3 className="font-serif text-lg font-bold text-stone-900 leading-snug">
                        {group.name}
                      </h3>
                    </div>
                    <button
                      onClick={() => handleDeleteGroup(group.id)}
                      title="Delete Modifier Group"
                      className="p-1.5 rounded-lg text-stone-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-4">
                    <span
                      className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                        group.isRequired
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-stone-100 text-stone-700'
                      }`}
                    >
                      {group.isRequired ? 'Required Selection' : 'Optional'}
                    </span>
                    <span className="text-[11px] font-medium bg-cream-200 text-stone-700 px-2.5 py-0.5 rounded-full">
                      Min: {group.minSelect} • Max: {group.maxSelect}
                    </span>
                  </div>

                  {/* Options List */}
                  <div className="space-y-1.5 border-t border-stone-100 pt-3">
                    <span className="text-xs font-bold text-stone-500 uppercase tracking-wider block mb-2">
                      Options ({group.options.length})
                    </span>
                    {group.options.map((opt) => (
                      <div
                        key={opt.id}
                        className="flex items-center justify-between text-xs py-1.5 px-3 rounded-lg bg-stone-50 border border-stone-200/60"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-stone-800">{opt.name}</span>
                          {opt.isDefault && (
                            <span className="text-[10px] bg-nature-100 text-nature-800 font-bold px-1.5 py-0.2 rounded">
                              Default
                            </span>
                          )}
                        </div>
                        <span className="font-bold text-nature-950 font-serif">
                          {opt.price > 0 ? `+₹${opt.price.toFixed(2)}` : 'Free'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-stone-100 text-[11px] text-stone-400 flex items-center justify-between">
                  <span>Linked Item Price: ₹{group.menuItem.price.toFixed(2)}</span>
                  <span className="text-nature-800 font-semibold">Active in QR Menu</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal: Create Modifier Group */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
              <div className="p-6 border-b border-stone-100 flex items-center justify-between">
                <div>
                  <h3 className="font-serif text-xl font-bold text-stone-900">New Modifier Group</h3>
                  <p className="text-xs text-stone-500">Attach custom options to a specific menu dish</p>
                </div>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="p-2 text-stone-400 hover:text-stone-700 rounded-full hover:bg-stone-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateGroup} className="flex-1 overflow-y-auto p-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                    Select Menu Item *
                  </label>
                  <select
                    value={selectedMenuItemId}
                    onChange={(e) => setSelectedMenuItemId(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-nature-800 bg-stone-50"
                  >
                    {menuItems.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name} (₹{item.price})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                    Modifier Group Name *
                  </label>
                  <input
                    type="text"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    placeholder="e.g. Sugar Level, Extra Dip, Crust Type"
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-nature-800"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                      Min Selection
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="10"
                      value={minSelect}
                      onChange={(e) => setMinSelect(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-nature-800"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                      Max Selection
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={maxSelect}
                      onChange={(e) => setMaxSelect(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-nature-800"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="isRequired"
                    checked={isRequired}
                    onChange={(e) => setIsRequired(e.target.checked)}
                    className="rounded border-stone-300 text-nature-900 focus:ring-nature-800"
                  />
                  <label htmlFor="isRequired" className="text-xs font-semibold text-stone-800">
                    Required selection (customer must choose before adding to cart)
                  </label>
                </div>

                {/* Dynamic Options List */}
                <div className="pt-3 border-t border-stone-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-stone-700 uppercase tracking-wider">
                      Options & Prices
                    </span>
                    <button
                      type="button"
                      onClick={handleAddOptionRow}
                      className="text-xs text-nature-800 font-bold hover:underline flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Option</span>
                    </button>
                  </div>

                  <div className="space-y-2">
                    {options.map((opt, idx) => (
                      <div key={idx} className="flex items-center gap-2 bg-stone-50 p-2 rounded-xl border border-stone-200">
                        <input
                          type="text"
                          value={opt.name}
                          onChange={(e) => handleOptionChange(idx, 'name', e.target.value)}
                          placeholder="e.g. Less Sugar, Extra Cheese"
                          required
                          className="flex-1 px-2.5 py-1.5 text-xs rounded-lg border border-stone-200 bg-white"
                        />
                        <div className="flex items-center gap-1 w-24">
                          <span className="text-xs text-stone-500">₹</span>
                          <input
                            type="number"
                            min="0"
                            step="5"
                            value={opt.price}
                            onChange={(e) => handleOptionChange(idx, 'price', Number(e.target.value))}
                            placeholder="Price"
                            className="w-full px-2 py-1.5 text-xs rounded-lg border border-stone-200 bg-white"
                          />
                        </div>
                        <label className="flex items-center gap-1 text-[11px] text-stone-600 px-1">
                          <input
                            type="checkbox"
                            checked={opt.isDefault}
                            onChange={(e) => handleOptionChange(idx, 'isDefault', e.target.checked)}
                          />
                          <span>Def</span>
                        </label>
                        {options.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveOptionRow(idx)}
                            className="p-1 text-stone-400 hover:text-red-600"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-stone-100 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2.5 text-xs font-semibold text-stone-600 hover:bg-stone-100 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="bg-nature-900 text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow hover:bg-nature-950 disabled:opacity-50"
                  >
                    {submitting ? 'Creating...' : 'Save Modifier Group'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};
