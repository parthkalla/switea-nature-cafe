import React, { useEffect, useState } from 'react';
import { Plus, Search, Trash2, Edit2, Check, AlertCircle, Sparkles, Flame, Eye, EyeOff, Gift } from 'lucide-react';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { ImageUploadField } from '../../components/common/ImageUploadField';
import { api } from '../../services/api';
import { MenuItem, MenuCategory } from '../../types';

export const AdminMenu: React.FC = () => {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState<number | string>(99);
  const [isVeg, setIsVeg] = useState(true);
  const [isBestseller, setIsBestseller] = useState(false);
  const [isSpecial, setIsSpecial] = useState(false);
  const [image, setImage] = useState('');
  const [prepTime, setPrepTime] = useState(15);
  const [itemType, setItemType] = useState<'INHERIT' | 'FOOD' | 'COFFEE'>('INHERIT');
  const [loyaltyPoints, setLoyaltyPoints] = useState<number | string>(0);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleOpenAddModal = () => {
    setEditingItem(null);
    setName('');
    setDescription('');
    setPrice(99);
    setImage('');
    setIsVeg(true);
    setIsBestseller(false);
    setIsSpecial(false);
    setPrepTime(15);
    setItemType('INHERIT');
    setLoyaltyPoints(0);
    if (categories.length > 0) setCategoryId(categories[0].id);
    setShowModal(true);
  };

  const handleOpenEditModal = (item: MenuItem) => {
    setEditingItem(item);
    setName(item.name);
    setDescription(item.description || '');
    setPrice(item.price);
    setImage(item.image || '');
    setIsVeg(item.isVeg);
    setIsBestseller(item.isBestseller);
    setIsSpecial(item.isSpecial);
    setPrepTime(item.prepTimeMinutes || 15);
    setItemType(item.itemType || 'INHERIT');
    setLoyaltyPoints((item as any).loyaltyPoints || 0);
    setCategoryId(item.categoryId);
    setShowModal(true);
  };

  const fetchMenuData = async () => {
    try {
      const [itemsRes, catRes] = await Promise.all([
        api.getAdminMenuItems(),
        api.getAdminCategories(),
      ]);
      setItems(itemsRes.items || []);
      setCategories(catRes.categories || []);
      if (catRes.categories?.length > 0 && !categoryId) {
        setCategoryId(catRes.categories[0].id);
      }
    } catch (err) {
      console.error('Failed to load menu items:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMenuData();
  }, []);

  const handleToggleAvailability = async (id: string) => {
    try {
      await api.toggleItemAvailability(id);
      setItems((prev) =>
        prev.map((i) => (i.id === id ? { ...i, isAvailable: !i.isAvailable } : i))
      );
    } catch (err) {
      alert('Failed to toggle availability.');
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (!window.confirm('Delete this menu item?')) return;
    try {
      await api.deleteMenuItem(id);
      setItems((prev) => prev.filter((i) => i.id !== id));
    } catch (err) {
      alert('Failed to delete item.');
    }
  };

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !categoryId) return;

    try {
      setSubmitting(true);
      const payload = {
        name: name.trim(),
        categoryId,
        description: description.trim(),
        price: Number(price),
        itemType: itemType === 'INHERIT' ? undefined : itemType,
        isVeg,
        isBestseller,
        isSpecial,
        image: image.trim() || undefined,
        prepTimeMinutes: Number(prepTime),
        loyaltyPoints: Math.max(0, parseInt(String(loyaltyPoints), 10) || 0),
      };

      if (editingItem) {
        await api.updateMenuItem(editingItem.id, payload);
      } else {
        await api.createMenuItem(payload);
      }

      setShowModal(false);
      setEditingItem(null);
      setName('');
      setDescription('');
      setImage('');
      setItemType('INHERIT');
      setLoyaltyPoints(0);
      fetchMenuData();
    } catch (err: any) {
      alert(err.message || 'Failed to save item.');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredItems = items.filter((item) => {
    const matchCategory = selectedCategory === 'ALL' || item.categoryId === selectedCategory;
    const matchSearch = item.name.toLowerCase().includes(search.toLowerCase());
    return matchCategory && matchSearch;
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-serif text-3xl font-bold text-stone-900">Menu Catalog</h1>
            <p className="text-xs text-stone-500 mt-1">Manage dishes, prices, availability, and customizations</p>
          </div>

          <button
            onClick={handleOpenAddModal}
            className="inline-flex items-center gap-2 bg-nature-900 hover:bg-nature-950 text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow transition-colors"
          >
            <Plus className="w-4 h-4 text-nature-300" />
            <span>Add Menu Item</span>
          </button>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-white p-4 rounded-3xl border border-stone-200 shadow-soft">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            <button
              onClick={() => setSelectedCategory('ALL')}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                selectedCategory === 'ALL'
                  ? 'bg-nature-900 text-white shadow-sm'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              All Categories
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  selectedCategory === cat.id
                    ? 'bg-nature-900 text-white shadow-sm'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          <div className="relative">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search items..."
              className="w-full md:w-64 pl-9 pr-4 py-2 rounded-xl border border-stone-200 text-xs focus:outline-none focus:ring-2 focus:ring-nature-800"
            />
          </div>
        </div>

        {/* Items Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className={`bg-white rounded-2xl border p-4 shadow-soft flex flex-col justify-between transition-all ${
                !item.isAvailable ? 'opacity-60 border-stone-200' : 'border-stone-200/90'
              }`}
            >
              <div>
                <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-stone-100 mb-3">
                  {item.image ? (
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs text-stone-400">
                      RoastFuze Coffee Bar
                    </div>
                  )}
                  <div className="absolute top-2 left-2 flex gap-1">
                    {item.isBestseller && (
                      <span className="bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                        Bestseller
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 mb-1">
                  <span className={`w-3.5 h-3.5 border-2 rounded-sm flex items-center justify-center ${item.isVeg ? 'border-green-600' : 'border-red-600'}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${item.isVeg ? 'bg-green-600' : 'bg-red-600'}`} />
                  </span>
                  <h3 className="font-serif font-bold text-base text-stone-900 leading-tight">
                    {item.name}
                  </h3>
                  <div className="flex items-center gap-1.5 ml-auto">
                    {((item as any).loyaltyPoints || 0) > 0 && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-900 border border-purple-200 flex items-center gap-1">
                        <Gift className="w-3 h-3 text-purple-700" />
                        <span>{(item as any).loyaltyPoints} pts</span>
                      </span>
                    )}
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      (item.itemType === 'COFFEE' || item.category?.itemType === 'COFFEE')
                        ? 'bg-amber-100 text-amber-900 border border-amber-200'
                        : 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                    }`}>
                      {(item.itemType === 'COFFEE' || item.category?.itemType === 'COFFEE') ? '☕ Coffee' : '🍔 Food'}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-stone-500 line-clamp-2 mb-3">{item.description}</p>
                <span className="font-extrabold text-base text-stone-900 block mb-2">₹{item.price}</span>
              </div>

              {/* Bottom Actions */}
              <div className="pt-3 border-t border-stone-100 flex items-center justify-between">
                <button
                  onClick={() => handleToggleAvailability(item.id)}
                  className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl transition-colors ${
                    item.isAvailable
                      ? 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                  }`}
                >
                  {item.isAvailable ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  <span>{item.isAvailable ? 'In Stock' : 'Paused'}</span>
                </button>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEditModal(item)}
                    className="p-1.5 text-stone-500 hover:text-stone-900 rounded-lg hover:bg-stone-100 transition-colors"
                    title="Edit item"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => handleDeleteItem(item.id)}
                    className="p-1.5 text-stone-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                    title="Delete item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Add / Edit Item Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
              <h2 className="font-serif font-bold text-xl text-stone-900">
                {editingItem ? 'Edit Menu Item' : 'Add Menu Item'}
              </h2>

              <form onSubmit={handleSaveItem} className="space-y-4 pt-1">
                <div>
                  <label className="text-xs uppercase tracking-wider font-bold text-stone-600 block mb-1">
                    Item Name
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Saffron Elaichi Chai"
                    className="w-full px-4 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-nature-800"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs uppercase tracking-wider font-bold text-stone-600 block mb-1">
                      Category
                    </label>
                    <select
                      value={categoryId}
                      onChange={(e) => setCategoryId(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-nature-800 bg-white"
                    >
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs uppercase tracking-wider font-bold text-stone-600 block mb-1">
                      Price (INR ₹)
                    </label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-nature-800"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs uppercase tracking-wider font-bold text-stone-600 block mb-1">
                    Description
                  </label>
                  <textarea
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Rich aromatic Assam tea simmered with fresh spices..."
                    className="w-full px-4 py-2 rounded-xl border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-nature-800"
                  />
                </div>

                <div>
                  <ImageUploadField
                    label="Item Photo"
                    value={image}
                    onChange={setImage}
                    placeholder="Upload dish photo from your device or paste URL"
                  />
                </div>

                <div className="flex items-center gap-6 pt-2">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-stone-700">
                    <input
                      type="checkbox"
                      checked={isVeg}
                      onChange={(e) => setIsVeg(e.target.checked)}
                      className="w-4 h-4 text-nature-900 rounded focus:ring-nature-800"
                    />
                    <span>Vegetarian</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-stone-700">
                    <input
                      type="checkbox"
                      checked={isBestseller}
                      onChange={(e) => setIsBestseller(e.target.checked)}
                      className="w-4 h-4 text-nature-900 rounded focus:ring-nature-800"
                    />
                    <span>Mark as Bestseller</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-stone-700">
                    <input
                      type="checkbox"
                      checked={isSpecial}
                      onChange={(e) => setIsSpecial(e.target.checked)}
                      className="w-4 h-4 text-nature-900 rounded focus:ring-nature-800"
                    />
                    <span>Chef's Special</span>
                  </label>
                </div>

                <div>
                  <label className="text-xs uppercase tracking-wider font-bold text-stone-600 block mb-1">
                    Loyalty Classification (Food vs Coffee)
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setItemType('INHERIT')}
                      className={`p-2.5 rounded-xl border text-xs font-bold transition-all text-center ${
                        itemType === 'INHERIT'
                          ? 'border-nature-900 bg-nature-50 text-nature-950 ring-1 ring-nature-900'
                          : 'border-stone-200 text-stone-600 hover:bg-stone-50'
                      }`}
                    >
                      From Category
                    </button>
                    <button
                      type="button"
                      onClick={() => setItemType('FOOD')}
                      className={`p-2.5 rounded-xl border text-xs font-bold transition-all text-center ${
                        itemType === 'FOOD'
                          ? 'border-emerald-700 bg-emerald-50 text-emerald-950 ring-1 ring-emerald-700'
                          : 'border-stone-200 text-stone-600 hover:bg-stone-50'
                      }`}
                    >
                      🍔 Food
                    </button>
                    <button
                      type="button"
                      onClick={() => setItemType('COFFEE')}
                      className={`p-2.5 rounded-xl border text-xs font-bold transition-all text-center ${
                        itemType === 'COFFEE'
                          ? 'border-amber-700 bg-amber-50 text-amber-950 ring-1 ring-amber-700'
                          : 'border-stone-200 text-stone-600 hover:bg-stone-50'
                      }`}
                    >
                      ☕ Coffee & Drinks
                    </button>
                  </div>
                </div>

                <div className="p-3 bg-purple-50/70 rounded-2xl border border-purple-200/80 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs uppercase tracking-wider font-bold text-purple-950 flex items-center gap-1.5">
                      <Gift className="w-3.5 h-3.5 text-purple-700" />
                      <span>Custom Loyalty Points per Item</span>
                    </label>
                    <span className="text-[10px] text-purple-700 font-bold">
                      {Number(loyaltyPoints) > 0 ? `${loyaltyPoints} pts awarded` : 'Default spend rate (0)'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={0}
                      step={1}
                      value={loyaltyPoints}
                      onChange={(e) => setLoyaltyPoints(e.target.value)}
                      onBlur={() => {
                        if (loyaltyPoints === '' || isNaN(Number(loyaltyPoints))) {
                          setLoyaltyPoints(0);
                        }
                      }}
                      placeholder="0"
                      className="w-24 px-3 py-2 rounded-xl border border-purple-300 font-bold text-stone-900 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-purple-600"
                    />
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setLoyaltyPoints((p) => (parseInt(String(p || 0), 10) || 0) + 5)}
                        className="px-2.5 py-1.5 bg-white hover:bg-purple-100 border border-purple-300 text-purple-800 text-xs font-bold rounded-lg transition-colors"
                      >
                        +5 pts
                      </button>
                      <button
                        type="button"
                        onClick={() => setLoyaltyPoints((p) => (parseInt(String(p || 0), 10) || 0) + 10)}
                        className="px-2.5 py-1.5 bg-white hover:bg-purple-100 border border-purple-300 text-purple-800 text-xs font-bold rounded-lg transition-colors"
                      >
                        +10 pts
                      </button>
                      <button
                        type="button"
                        onClick={() => setLoyaltyPoints(0)}
                        className="px-2 py-1.5 bg-purple-200/60 hover:bg-purple-200 text-purple-900 text-xs font-bold rounded-lg transition-colors"
                        title="Use default spend rate"
                      >
                        Clear (0)
                      </button>
                    </div>
                  </div>
                  <p className="text-[10px] text-purple-800/80">
                    Set fixed reward points customer gets per unit of this item. Set 0 to calculate via standard category spend rate.
                  </p>
                </div>

                <div className="pt-4 flex items-center justify-end gap-3 border-t border-stone-100">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setEditingItem(null);
                    }}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-stone-600 hover:bg-stone-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="bg-nature-900 hover:bg-nature-950 text-white px-6 py-2.5 rounded-xl text-xs font-bold shadow"
                  >
                    {submitting ? 'Saving...' : editingItem ? 'Update Item' : 'Save Item'}
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
