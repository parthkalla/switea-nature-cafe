import React, { useEffect, useState } from 'react';
import { Plus, Building2, ExternalLink, Power, Check, AlertCircle } from 'lucide-react';
import { SuperAdminLayout } from '../../components/layout/SuperAdminLayout';
import { api } from '../../services/api';

export const SuperAdminRestaurants: React.FC = () => {
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);

  // Form
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchRestaurants = async () => {
    try {
      const res = await api.getSuperAdminRestaurants();
      setRestaurants(res.restaurants || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRestaurants();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !slug.trim() || !ownerEmail.trim()) return;

    try {
      setSubmitting(true);
      await api.createRestaurant({
        name: name.trim(),
        slug: slug.trim(),
        ownerEmail: ownerEmail.trim(),
        ownerName: ownerName.trim() || undefined,
        phone: phone.trim() || undefined,
        address: address.trim() || undefined,
      });

      setShowAdd(false);
      setName('');
      setSlug('');
      setOwnerEmail('');
      fetchRestaurants();
    } catch (err: any) {
      alert(err.message || 'Failed to create restaurant.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (id: string) => {
    try {
      await api.toggleRestaurantStatus(id);
      fetchRestaurants();
    } catch (err) {
      alert('Failed to toggle status.');
    }
  };

  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-serif text-3xl font-bold text-stone-900">Restaurant Directory</h1>
            <p className="text-xs text-stone-500 mt-1">Multi-tenant accounts, subscription status, and owners</p>
          </div>

          <button
            onClick={() => setShowAdd(true)}
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow"
          >
            <Plus className="w-4 h-4" />
            <span>Onboard Restaurant</span>
          </button>
        </div>

        <div className="bg-white rounded-3xl border border-stone-200 shadow-soft overflow-hidden divide-y divide-stone-100">
          {restaurants.map((r) => {
            const owner = r.memberships?.[0]?.user;
            const sub = r.subscriptions?.[0];
            return (
              <div key={r.id} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <strong className="text-base text-stone-900 font-serif">{r.name}</strong>
                    <span className="text-xs font-mono bg-stone-100 px-2 py-0.5 rounded text-stone-600">
                      /{r.slug}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${r.isOpen ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                      {r.isOpen ? 'Active' : 'Suspended'}
                    </span>
                  </div>

                  <div className="text-xs text-stone-500 flex flex-wrap gap-x-4 gap-y-1">
                    <span>Owner: <strong className="text-stone-800">{owner?.name || 'Owner'} ({owner?.email})</strong></span>
                    <span>• Tables: <strong className="text-stone-800">{r._count?.tables || 0}</strong></span>
                    <span>• Orders: <strong className="text-stone-800">{r._count?.orders || 0}</strong></span>
                    <span>• Plan: <strong className="text-indigo-600">{sub?.plan?.name || 'Pro Suite'}</strong></span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleToggleStatus(r.id)}
                    className="p-2 rounded-xl border border-stone-200 text-stone-600 hover:bg-stone-50 text-xs font-semibold flex items-center gap-1.5"
                  >
                    <Power className="w-3.5 h-3.5" />
                    <span>{r.isOpen ? 'Suspend' : 'Activate'}</span>
                  </button>

                  <a
                    href={`/menu/${r.slug}`}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 rounded-xl bg-indigo-50 text-indigo-700 hover:bg-indigo-100 text-xs font-semibold flex items-center gap-1"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Open Menu</span>
                  </a>
                </div>
              </div>
            );
          })}
        </div>

        {/* Onboard Modal */}
        {showAdd && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
              <h2 className="font-serif font-bold text-xl text-stone-900">Onboard Restaurant Tenant</h2>
              <form onSubmit={handleCreate} className="space-y-4 pt-1">
                <div>
                  <label className="text-xs uppercase tracking-wider font-bold text-stone-600 block mb-1">
                    Restaurant Name
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (!slug) {
                        setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-'));
                      }
                    }}
                    placeholder="e.g. Switea Garden Jaipur"
                    className="w-full px-4 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  />
                </div>

                <div>
                  <label className="text-xs uppercase tracking-wider font-bold text-stone-600 block mb-1">
                    Unique URL Slug
                  </label>
                  <input
                    type="text"
                    required
                    value={slug}
                    onChange={(e) => setSlug(e.target.value.toLowerCase())}
                    placeholder="e.g. switea-garden"
                    className="w-full px-4 py-2.5 rounded-xl border border-stone-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs uppercase tracking-wider font-bold text-stone-600 block mb-1">
                      Owner Name
                    </label>
                    <input
                      type="text"
                      value={ownerName}
                      onChange={(e) => setOwnerName(e.target.value)}
                      placeholder="e.g. Cafe Partner"
                      className="w-full px-4 py-2.5 rounded-xl border border-stone-200 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs uppercase tracking-wider font-bold text-stone-600 block mb-1">
                      Owner Email
                    </label>
                    <input
                      type="email"
                      required
                      value={ownerEmail}
                      onChange={(e) => setOwnerEmail(e.target.value)}
                      placeholder="partner@switea.com"
                      className="w-full px-4 py-2.5 rounded-xl border border-stone-200 text-sm"
                    />
                  </div>
                </div>

                <div className="pt-3 flex justify-end gap-3 border-t border-stone-100">
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
                    className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow"
                  >
                    {submitting ? 'Creating...' : 'Provision Restaurant'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </SuperAdminLayout>
  );
};
