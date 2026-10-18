import React, { useEffect, useState } from 'react';
import { Star, Eye, EyeOff, MessageSquare } from 'lucide-react';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { Review } from '../../types';

export const AdminReviews: React.FC = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadReviews() {
      try {
        const token = localStorage.getItem('switea_token');
        const res = await fetch('/api/admin/reviews', {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const data = await res.json();
        setReviews(data.reviews || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadReviews();
  }, []);

  const handleToggle = async (id: string) => {
    try {
      const token = localStorage.getItem('switea_token');
      await fetch(`/api/admin/reviews/${id}/approval`, {
        method: 'PATCH',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      setReviews((prev) =>
        prev.map((r) => (r.id === id ? { ...r, isApproved: !r.isApproved } : r))
      );
    } catch (err) {
      alert('Failed to toggle review approval.');
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="font-serif text-3xl font-bold text-stone-900">Customer Reviews & Ratings</h1>
          <p className="text-xs text-stone-500 mt-1">Approve or hide feedback visible on your public website</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reviews.map((r) => (
            <div
              key={r.id}
              className={`bg-white rounded-3xl border p-6 shadow-soft flex flex-col justify-between transition-all ${
                !r.isApproved ? 'opacity-60 border-stone-200' : 'border-stone-200/90'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex gap-1 text-amber-500">
                    {Array.from({ length: r.rating }).map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-amber-500" />
                    ))}
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${r.isApproved ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-100 text-stone-600'}`}>
                    {r.isApproved ? 'Visible' : 'Hidden'}
                  </span>
                </div>
                <p className="text-xs text-stone-700 italic leading-relaxed mb-4">"{r.comment}"</p>
                <span className="font-bold text-sm text-stone-900 block">{r.customerName}</span>
              </div>

              <div className="pt-4 border-t border-stone-100 mt-4 flex justify-end">
                <button
                  onClick={() => handleToggle(r.id)}
                  className="text-xs font-semibold text-stone-600 hover:text-nature-900 flex items-center gap-1.5"
                >
                  {r.isApproved ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  <span>{r.isApproved ? 'Hide on Website' : 'Approve & Publish'}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
};
