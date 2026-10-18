import React, { useEffect, useState } from 'react';
import { Plus, Trash2, Edit2, FolderTree, Check } from 'lucide-react';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { ImageUploadField } from '../../components/common/ImageUploadField';
import { api } from '../../services/api';
import { MenuCategory } from '../../types';

export const AdminCategories: React.FC = () => {
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchCategories = async () => {
    try {
      const res = await api.getAdminCategories();
      setCategories(res.categories || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      setSubmitting(true);
      await api.createCategory({
        name: name.trim(),
        description: description.trim(),
        image: image.trim() || undefined,
      });
      setShowAdd(false);
      setName('');
      setDescription('');
      setImage('');
      fetchCategories();
    } catch (err: any) {
      alert('Failed to create category.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this category? Items inside it must be reassigned.')) return;
    try {
      await api.deleteCategory(id);
      fetchCategories();
    } catch (err) {
      alert('Failed to delete category.');
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-serif text-3xl font-bold text-stone-900">Menu Categories</h1>
            <p className="text-xs text-stone-500 mt-1">Organize your digital QR menu into sections</p>
          </div>
          <button
            onClick={() => setShowAdd(true)}
            className="inline-flex items-center gap-2 bg-nature-900 hover:bg-nature-950 text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow transition-colors"
          >
            <Plus className="w-4 h-4 text-nature-300" />
            <span>Add Category</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((cat) => (
            <div key={cat.id} className="bg-white rounded-2xl border border-stone-200 p-5 shadow-soft flex items-start justify-between">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-xl bg-stone-100 overflow-hidden flex-shrink-0">
                  {cat.image ? (
                    <img src={cat.image} alt={cat.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs text-stone-400">
                      Switea
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="font-serif font-bold text-base text-stone-900">{cat.name}</h3>
                  <p className="text-xs text-stone-500 line-clamp-1">{cat.description || 'No description'}</p>
                  <span className="text-[11px] font-semibold text-nature-800 bg-nature-50 px-2 py-0.5 rounded-md mt-2 inline-block">
                    {cat._count?.items || 0} active dishes
                  </span>
                </div>
              </div>

              <button
                onClick={() => handleDelete(cat.id)}
                className="text-stone-400 hover:text-red-600 p-1 rounded"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        {showAdd && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
              <h2 className="font-serif font-bold text-xl text-stone-900">Add Menu Category</h2>
              <form onSubmit={handleCreate} className="space-y-4 pt-1">
                <div>
                  <label className="text-xs uppercase tracking-wider font-bold text-stone-600 block mb-1">
                    Category Name
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Sizzling Starters"
                    className="w-full px-4 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-nature-800"
                  />
                </div>
                <div>
                  <label className="text-xs uppercase tracking-wider font-bold text-stone-600 block mb-1">
                    Description
                  </label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Crispy savory bites cooked fresh..."
                    className="w-full px-4 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-nature-800"
                  />
                </div>
                <div>
                  <ImageUploadField
                    label="Category Cover Photo"
                    value={image}
                    onChange={setImage}
                    placeholder="Upload category photo or paste URL"
                  />
                </div>
                <div className="pt-3 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowAdd(false)}
                    className="px-4 py-2 text-xs font-semibold text-stone-600"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="bg-nature-900 text-white px-5 py-2 rounded-xl text-xs font-bold shadow"
                  >
                    {submitting ? 'Creating...' : 'Create Category'}
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
