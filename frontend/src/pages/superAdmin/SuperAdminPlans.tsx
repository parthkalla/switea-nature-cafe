import React, { useEffect, useState } from 'react';
import { CreditCard, Check, Zap, Edit2, Plus, X, AlertCircle } from 'lucide-react';
import { SuperAdminLayout } from '../../components/layout/SuperAdminLayout';
import { api } from '../../services/api';

export const SuperAdminPlans: React.FC = () => {
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Edit Plan State
  const [editingPlan, setEditingPlan] = useState<any | null>(null);
  const [editPrice, setEditPrice] = useState<number | string>('');
  const [editName, setEditName] = useState('');
  const [editInterval, setEditInterval] = useState<'MONTHLY' | 'YEARLY'>('MONTHLY');
  const [editMaxTables, setEditMaxTables] = useState<number | string>('');
  const [editMaxItems, setEditMaxItems] = useState<number | string>('');
  const [savingEdit, setSavingEdit] = useState(false);

  // Create Plan State
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newSlug, setNewSlug] = useState('');
  const [newPrice, setNewPrice] = useState<number | string>('');
  const [newInterval, setNewInterval] = useState<'MONTHLY' | 'YEARLY'>('MONTHLY');
  const [newMaxTables, setNewMaxTables] = useState('50');
  const [newMaxItems, setNewMaxItems] = useState('300');
  const [creating, setCreating] = useState(false);

  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadPlans = async () => {
    try {
      setLoading(true);
      const res = await api.getSuperAdminPlans();
      setPlans(res.plans || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlans();
  }, []);

  const handleOpenEdit = (p: any) => {
    setEditingPlan(p);
    setEditName(p.name);
    setEditPrice(p.price);
    setEditInterval(p.billingInterval === 'YEARLY' ? 'YEARLY' : 'MONTHLY');
    setEditMaxTables(p.maxTables);
    setEditMaxItems(p.maxItems);
    setMessage(null);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlan) return;

    try {
      setSavingEdit(true);
      setMessage(null);
      await api.updateSubscriptionPlan(editingPlan.id, {
        name: editName.trim(),
        price: parseFloat(editPrice.toString()),
        billingInterval: editInterval,
        maxTables: parseInt(editMaxTables.toString(), 10),
        maxItems: parseInt(editMaxItems.toString(), 10),
      });

      setMessage({ type: 'success', text: `Plan "${editName}" updated successfully!` });
      setTimeout(() => {
        setEditingPlan(null);
        loadPlans();
      }, 1200);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to update plan' });
    } finally {
      setSavingEdit(false);
    }
  };

  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newSlug.trim() || newPrice === '') return;

    try {
      setCreating(true);
      setMessage(null);
      await api.createSubscriptionPlan({
        name: newName.trim(),
        slug: newSlug.trim().toLowerCase(),
        price: parseFloat(newPrice.toString()),
        billingInterval: newInterval,
        maxTables: parseInt(newMaxTables, 10),
        maxItems: parseInt(newMaxItems, 10),
        features: [
          'digital_menu',
          'qr_generator',
          'table_ordering',
          'kitchen_display',
          'analytics',
          'landing_page_builder',
          'custom_branding',
        ],
      });

      setShowCreate(false);
      setNewName('');
      setNewSlug('');
      setNewPrice('');
      loadPlans();
    } catch (err: any) {
      alert(err.message || 'Failed to create plan');
    } finally {
      setCreating(false);
    }
  };

  return (
    <SuperAdminLayout>
      <div className="space-y-6 max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900">Subscription Plans & Pricing</h1>
            <p className="text-xs text-stone-500 mt-1">Manage platform pricing tiers, monthly & yearly billing intervals</p>
          </div>

          <button
            onClick={() => {
              setShowCreate(true);
              setMessage(null);
            }}
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 sm:px-5 py-2.5 rounded-xl font-bold text-xs shadow transition-colors self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Plan</span>
          </button>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            <div className="col-span-full p-12 text-center text-xs text-stone-400">Loading subscription tiers...</div>
          ) : plans.length === 0 ? (
            <div className="col-span-full p-12 text-center text-xs text-stone-500">No subscription plans found.</div>
          ) : (
            plans.map((p) => {
              let features: string[] = [];
              try {
                features = JSON.parse(p.features || '[]');
              } catch {}

              const isYearly = p.billingInterval === 'YEARLY';

              return (
                <div
                  key={p.id}
                  className="bg-white rounded-3xl border border-stone-200 p-6 shadow-soft flex flex-col justify-between relative hover:border-indigo-200 transition-colors"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span
                        className={`text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                          isYearly
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                        }`}
                      >
                        {p.billingInterval}
                      </span>

                      <button
                        onClick={() => handleOpenEdit(p)}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-stone-500 hover:text-indigo-600 px-2 py-1 rounded-lg hover:bg-stone-50"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>Edit Plan</span>
                      </button>
                    </div>

                    <h3 className="font-serif text-2xl font-bold text-stone-900 mb-2">{p.name}</h3>

                    <div className="flex items-baseline gap-1 mb-4">
                      <span className="font-serif text-3xl font-extrabold text-stone-900">₹{p.price}</span>
                      <span className="text-xs text-stone-400">/ {isYearly ? 'year' : 'month'}</span>
                    </div>

                    <div className="pt-3 border-t border-stone-100 space-y-2 text-xs text-stone-600 mb-6">
                      <p className="flex justify-between">
                        <span>Max Tables:</span>
                        <strong className="text-stone-900">{p.maxTables}</strong>
                      </p>
                      <p className="flex justify-between">
                        <span>Max Menu Items:</span>
                        <strong className="text-stone-900">{p.maxItems}</strong>
                      </p>
                      <p className="flex justify-between">
                        <span>Active Subscriptions:</span>
                        <strong className="text-indigo-600">{p._count?.subscriptions || 0} cafes</strong>
                      </p>

                      <div className="pt-2 border-t border-stone-50 space-y-1.5">
                        {features.map((f, i) => (
                          <p key={i} className="flex items-center gap-1.5 text-stone-700 text-[11px]">
                            <Check className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                            <span className="capitalize">{f.replace(/_/g, ' ')}</span>
                          </p>
                        ))}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleOpenEdit(p)}
                    className="w-full py-2.5 bg-stone-50 hover:bg-indigo-50 text-stone-700 hover:text-indigo-700 rounded-xl font-bold text-xs border border-stone-200 transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Edit Amount & Billing Interval</span>
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Edit Plan Modal */}
        {editingPlan && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={() => !savingEdit && setEditingPlan(null)} />

            <div className="relative w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-stone-200 z-10 space-y-4">
              <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
                    <Edit2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-serif font-bold text-base text-stone-900">Edit Subscription Plan</h3>
                    <p className="text-[11px] text-stone-500">{editingPlan.slug}</p>
                  </div>
                </div>
                <button onClick={() => setEditingPlan(null)} disabled={savingEdit} className="p-1 text-stone-400 hover:text-stone-700">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {message && (
                <div
                  className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                    message.type === 'success'
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-red-50 text-red-800 border border-red-200'
                  }`}
                >
                  {message.type === 'success' ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                  <span>{message.text}</span>
                </div>
              )}

              <form onSubmit={handleSaveEdit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Plan Name</label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">Price (₹) *</label>
                    <input
                      type="number"
                      required
                      min={0}
                      step="any"
                      value={editPrice}
                      onChange={(e) => setEditPrice(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">Billing Interval</label>
                    <select
                      value={editInterval}
                      onChange={(e) => setEditInterval(e.target.value as any)}
                      className="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-bold text-indigo-700 focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="MONTHLY">MONTHLY (Per Month)</option>
                      <option value="YEARLY">YEARLY (Per Year)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">Max Tables</label>
                    <input
                      type="number"
                      min={1}
                      value={editMaxTables}
                      onChange={(e) => setEditMaxTables(e.target.value)}
                      className="w-full px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">Max Menu Items</label>
                    <input
                      type="number"
                      min={1}
                      value={editMaxItems}
                      onChange={(e) => setEditMaxItems(e.target.value)}
                      className="w-full px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-100">
                  <button
                    type="button"
                    onClick={() => setEditingPlan(null)}
                    disabled={savingEdit}
                    className="px-4 py-2 text-xs font-semibold text-stone-600 hover:text-stone-900 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingEdit}
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow transition-colors flex items-center gap-1.5"
                  >
                    {savingEdit ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Create Plan Modal */}
        {showCreate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={() => !creating && setShowCreate(false)} />

            <div className="relative w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-stone-200 z-10 space-y-4">
              <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
                    <Plus className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-serif font-bold text-base text-stone-900">Create Subscription Plan</h3>
                    <p className="text-[11px] text-stone-500">Monthly or Yearly tier</p>
                  </div>
                </div>
                <button onClick={() => setShowCreate(false)} disabled={creating} className="p-1 text-stone-400 hover:text-stone-700">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreatePlan} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">Plan Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Annual Growth"
                      value={newName}
                      onChange={(e) => {
                        setNewName(e.target.value);
                        if (!newSlug) setNewSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-'));
                      }}
                      className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">Slug *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. annual-growth"
                      value={newSlug}
                      onChange={(e) => setNewSlug(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-mono focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">Price (₹) *</label>
                    <input
                      type="number"
                      required
                      min={0}
                      placeholder="2499"
                      value={newPrice}
                      onChange={(e) => setNewPrice(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">Billing Interval</label>
                    <select
                      value={newInterval}
                      onChange={(e) => setNewInterval(e.target.value as any)}
                      className="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-bold text-indigo-700 focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="MONTHLY">MONTHLY (Per Month)</option>
                      <option value="YEARLY">YEARLY (Per Year)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">Max Tables</label>
                    <input
                      type="number"
                      min={1}
                      value={newMaxTables}
                      onChange={(e) => setNewMaxTables(e.target.value)}
                      className="w-full px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">Max Items</label>
                    <input
                      type="number"
                      min={1}
                      value={newMaxItems}
                      onChange={(e) => setNewMaxItems(e.target.value)}
                      className="w-full px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-100">
                  <button
                    type="button"
                    onClick={() => setShowCreate(false)}
                    disabled={creating}
                    className="px-4 py-2 text-xs font-semibold text-stone-600 hover:text-stone-900 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creating}
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow transition-colors flex items-center gap-1.5"
                  >
                    {creating ? 'Creating...' : 'Create Plan'}
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
