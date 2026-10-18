import React, { useEffect, useState } from 'react';
import { Plus, Search, Trash2, Edit2, Check, AlertCircle, Sparkles, Flame, Eye, EyeOff } from 'lucide-react';
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
  const [submitting, setSubmitting] = useState(false);

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
      await api.createMenuItem({
        name: name.trim(),
        categoryId,
        description: description.trim(),
        price: Number(price),
        isVeg,
        isBestseller,
        isSpecial,
        image: image.trim() || undefined,
        prepTimeMinutes: Number(prepTime),
      });

      setShowModal(false);
      setName('');
      setDescription('');
      setImage('');
      fetchMenuData();
    } catch (err: any) {
      alert(err.message || 'Failed to create item.');
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
            onClick={() => setShowModal(true)}
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
                      Switea Cafe
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

                <button
                  onClick={() => handleDeleteItem(item.id)}
                  className="p-1.5 text-stone-400 hover:text-red-600 rounded-lg hover:bg-red-50"
                  title="Delete item"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Add Item Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
              <h2 className="font-serif font-bold text-xl text-stone-900">Add Menu Item</h2>

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

                <div className="pt-4 flex items-center justify-end gap-3 border-t border-stone-100">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-stone-600 hover:bg-stone-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="bg-nature-900 hover:bg-nature-950 text-white px-6 py-2.5 rounded-xl text-xs font-bold shadow"
                  >
                    {submitting ? 'Saving...' : 'Save Item'}
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
