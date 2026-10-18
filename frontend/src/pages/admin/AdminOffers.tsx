import React, { useEffect, useState } from 'react';
import { Plus, Trash2, Tag, Percent, Sparkles, Check } from 'lucide-react';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { api } from '../../services/api';

export const AdminOffers: React.FC = () => {
  const [discounts, setDiscounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);

  // Form State
  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState('PERCENTAGE');
  const [value, setValue] = useState<number | string>(10);
  const [minOrder, setMinOrder] = useState<number | string>(199);
  const [maxDiscount, setMaxDiscount] = useState<number | string>(100);
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const fetchDiscounts = async () => {
    try {
      const res = await api.getDiscounts();
      setDiscounts(res.discounts || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDiscounts();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;

    try {
      setSubmitting(true);
      await api.createDiscount({
        code: code.trim().toUpperCase(),
        discountType,
        value: Number(value),
        minOrderAmount: Number(minOrder || 0),
        maxDiscount: maxDiscount ? Number(maxDiscount) : undefined,
      });

      setShowAdd(false);
      setCode('');
      fetchDiscounts();
      setMsg('Discount code created successfully.');
      setTimeout(() => setMsg(null), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to create discount.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this discount code?')) return;
    try {
      await api.deleteDiscount(id);
      fetchDiscounts();
    } catch (err) {
      alert('Failed to delete discount.');
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-serif text-3xl font-bold text-stone-900">Discount Coupons & Offers</h1>
            <p className="text-xs text-stone-500 mt-1">Create promo codes validated on the server for table carts</p>
          </div>
          <button
            onClick={() => setShowAdd(true)}
            className="inline-flex items-center gap-2 bg-nature-900 hover:bg-nature-950 text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow transition-colors"
          >
            <Plus className="w-4 h-4 text-nature-300" />
            <span>New Promo Code</span>
          </button>
        </div>

        {msg && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl text-xs font-semibold flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>{msg}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {discounts.map((d) => (
            <div key={d.id} className="bg-white rounded-3xl border border-stone-200 p-6 shadow-soft flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Tag className="w-4 h-4 text-nature-800" />
                    <span className="font-mono text-base font-bold text-stone-900 tracking-wider">
                      {d.code}
                    </span>
                  </div>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                    Active
                  </span>
                </div>

                <div className="space-y-1.5 text-xs text-stone-600 mb-4">
                  <p>
                    Benefit: <strong className="text-nature-950">{d.value}{d.discountType === 'PERCENTAGE' ? '%' : ' ₹'} OFF</strong>
                  </p>
                  <p>Min Order: ₹{d.minOrderAmount}</p>
                  {d.maxDiscount && <p>Max Discount: ₹{d.maxDiscount}</p>}
                  <p className="text-stone-400">Times Used: {d.timesUsed || 0}</p>
                </div>
              </div>

              <div className="pt-3 border-t border-stone-100 flex justify-end">
                <button
                  onClick={() => handleDelete(d.id)}
                  className="text-xs text-red-600 hover:text-red-800 font-medium flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          ))}
        </div>

        {showAdd && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
              <h2 className="font-serif font-bold text-xl text-stone-900">Create Discount Coupon</h2>
              <form onSubmit={handleCreate} className="space-y-4 pt-1">
                <div>
                  <label className="text-xs uppercase tracking-wider font-bold text-stone-600 block mb-1">
                    Coupon Code
                  </label>
                  <input
                    type="text"
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="e.g. SWITEA20"
                    className="w-full px-4 py-2.5 rounded-xl border border-stone-200 text-sm uppercase font-mono tracking-wider focus:outline-none focus:ring-2 focus:ring-nature-800"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs uppercase tracking-wider font-bold text-stone-600 block mb-1">
                      Type
                    </label>
                    <select
                      value={discountType}
                      onChange={(e) => setDiscountType(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-nature-800 bg-white"
                    >
                      <option value="PERCENTAGE">Percentage (%)</option>
                      <option value="FIXED">Fixed Amount (₹)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs uppercase tracking-wider font-bold text-stone-600 block mb-1">
                      Discount Value
                    </label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={value}
                      onChange={(e) => setValue(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-nature-800"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs uppercase tracking-wider font-bold text-stone-600 block mb-1">
                      Min Order (₹)
                    </label>
                    <input
                      type="number"
                      value={minOrder}
                      onChange={(e) => setMinOrder(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-nature-800"
                    />
                  </div>
                  <div>
                    <label className="text-xs uppercase tracking-wider font-bold text-stone-600 block mb-1">
                      Max Cap (₹)
                    </label>
                    <input
                      type="number"
                      value={maxDiscount}
                      onChange={(e) => setMaxDiscount(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-nature-800"
                    />
                  </div>
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
                    {submitting ? 'Creating...' : 'Save Coupon'}
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
