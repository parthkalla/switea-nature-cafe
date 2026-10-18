import React, { useEffect, useState } from 'react';
import { Plus, Trash2, Image as ImageIcon } from 'lucide-react';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { ImageUploadField } from '../../components/common/ImageUploadField';
import { api } from '../../services/api';
import { GalleryImage } from '../../types';

export const AdminGallery: React.FC = () => {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [title, setTitle] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchGallery = async () => {
    try {
      const res = await api.getGallery();
      setImages(res.images || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGallery();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageUrl.trim()) return;
    try {
      setSubmitting(true);
      await api.addGalleryImage({ title: title.trim() || 'Cafe Image', imageUrl: imageUrl.trim() });
      setShowAdd(false);
      setTitle('');
      setImageUrl('');
      fetchGallery();
    } catch (err) {
      alert('Failed to add image.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this gallery photo?')) return;
    try {
      await api.deleteGalleryImage(id);
      fetchGallery();
    } catch (err) {
      alert('Failed to delete.');
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-serif text-3xl font-bold text-stone-900">Garden Photo Gallery</h1>
            <p className="text-xs text-stone-500 mt-1">Manage food, drink, and garden ambiance photos</p>
          </div>
          <button
            onClick={() => setShowAdd(true)}
            className="inline-flex items-center gap-2 bg-nature-900 hover:bg-nature-950 text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow"
          >
            <Plus className="w-4 h-4 text-nature-300" />
            <span>Add Photo</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {images.map((img) => (
            <div key={img.id} className="bg-white rounded-3xl border border-stone-200 p-4 shadow-soft">
              <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-stone-100 mb-3">
                <img src={img.imageUrl} alt={img.title} className="w-full h-full object-cover" />
              </div>
              <div className="flex items-center justify-between">
                <span className="font-serif font-bold text-sm text-stone-900">{img.title}</span>
                <button
                  onClick={() => handleDelete(img.id)}
                  className="p-1.5 text-stone-400 hover:text-red-600 rounded-lg"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {showAdd && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
              <h2 className="font-serif font-bold text-xl text-stone-900">Add Gallery Image</h2>
              <form onSubmit={handleCreate} className="space-y-4 pt-1">
                <div>
                  <label className="text-xs uppercase tracking-wider font-bold text-stone-600 block mb-1">
                    Image Caption / Title
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Garden Cabana Evening Lights"
                    className="w-full px-4 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-nature-800"
                  />
                </div>
                <div>
                  <ImageUploadField
                    label="Gallery Photo"
                    value={imageUrl}
                    onChange={setImageUrl}
                    required
                    placeholder="Upload a photo from your device or paste URL"
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
                    {submitting ? 'Adding...' : 'Add Image'}
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
