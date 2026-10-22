import React, { useEffect, useState } from 'react';
import { Store, Save, Check } from 'lucide-react';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { api } from '../../services/api';
import { Restaurant } from '../../types';

export const AdminProfile: React.FC = () => {
  const [profile, setProfile] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await api.getAdminProfile();
        setProfile(res.restaurant);
      } catch (err) {
        console.error('Failed to load profile:', err);
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    try {
      setSaving(true);
      await api.updateAdminProfile(profile);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      alert('Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  if (loading || !profile) {
    return (
      <AdminLayout>
        <div className="py-20 text-center text-xs text-stone-400">Loading cafe settings...</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-4xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-serif text-3xl font-bold text-stone-900">Cafe Business Profile</h1>
            <p className="text-xs text-stone-500 mt-1">Configure business address, opening hours, tax rates, and ordering controls</p>
          </div>
        </div>

        {saved && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl text-xs font-semibold flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>Cafe profile and settings saved successfully.</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Status Switches */}
          <div className="bg-white rounded-3xl border border-stone-200 p-6 shadow-soft grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-4 rounded-2xl border border-stone-100 bg-cream-50">
              <div>
                <span className="font-bold text-sm text-stone-900 block">Restaurant Open/Closed</span>
                <span className="text-xs text-stone-500">Controls whether customers can place orders</span>
              </div>
              <input
                type="checkbox"
                checked={profile.isOpen}
                onChange={(e) => setProfile({ ...profile, isOpen: e.target.checked })}
                className="w-5 h-5 text-nature-900 rounded"
              />
            </div>

            <div className="flex items-center justify-between p-4 rounded-2xl border border-stone-100 bg-cream-50">
              <div>
                <span className="font-bold text-sm text-stone-900 block">Digital Table Ordering</span>
                <span className="text-xs text-stone-500">Enable/disable digital cart ordering</span>
              </div>
              <input
                type="checkbox"
                checked={profile.isOrderingEnabled}
                onChange={(e) => setProfile({ ...profile, isOrderingEnabled: e.target.checked })}
                className="w-5 h-5 text-nature-900 rounded"
              />
            </div>
          </div>

          {/* Details */}
          <div className="bg-white rounded-3xl border border-stone-200 p-6 shadow-soft space-y-4">
            <h2 className="font-serif font-bold text-base text-stone-900 pb-2 border-b border-stone-100">
              Basic Information
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs uppercase tracking-wider font-bold text-stone-600 block mb-1">
                  Restaurant Name
                </label>
                <input
                  type="text"
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-nature-800"
                />
              </div>

              <div>
                <label className="text-xs uppercase tracking-wider font-bold text-stone-600 block mb-1">
                  Brand Tagline
                </label>
                <input
                  type="text"
                  value={profile.tagLine || ''}
                  onChange={(e) => setProfile({ ...profile, tagLine: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-nature-800"
                />
              </div>
            </div>

            <div>
              <label className="text-xs uppercase tracking-wider font-bold text-stone-600 block mb-1">
                Full Street Address
              </label>
              <input
                type="text"
                value={profile.address}
                onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-nature-800"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-xs uppercase tracking-wider font-bold text-stone-600 block mb-1">
                  City
                </label>
                <input
                  type="text"
                  value={profile.city}
                  onChange={(e) => setProfile({ ...profile, city: e.target.value })}
                  className="w-full px-4 py-2 rounded-xl border border-stone-200 text-sm"
                />
              </div>
              <div>
                <label className="text-xs uppercase tracking-wider font-bold text-stone-600 block mb-1">
                  Phone
                </label>
                <input
                  type="text"
                  value={profile.phone}
                  onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                  className="w-full px-4 py-2 rounded-xl border border-stone-200 text-sm"
                />
              </div>
              <div>
                <label className="text-xs uppercase tracking-wider font-bold text-stone-600 block mb-1">
                  Tax GST Rate (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={profile.taxPercent}
                  onChange={(e) => setProfile({ ...profile, taxPercent: Number(e.target.value) })}
                  className="w-full px-4 py-2 rounded-xl border border-stone-200 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="text-xs uppercase tracking-wider font-bold text-stone-600 block mb-1">
                Daily Opening Hours
              </label>
              <input
                type="text"
                value={profile.openingHours}
                onChange={(e) => setProfile({ ...profile, openingHours: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-stone-200 text-sm"
              />
            </div>
          </div>

          {/* Location & Google Maps */}
          <div className="bg-white rounded-3xl border border-stone-200 p-6 shadow-soft space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-stone-100">
              <div>
                <h2 className="font-serif font-bold text-base text-stone-900">Google Maps Location & Navigation</h2>
                <p className="text-xs text-stone-500">Edit your cafe's Google Maps pin, directions link and embed</p>
              </div>
            </div>

            <div>
              <label className="text-xs uppercase tracking-wider font-bold text-stone-600 block mb-1">
                Google Maps Link / Search Query
              </label>
              <input
                type="text"
                value={profile.mapLink || ''}
                onChange={(e) => setProfile({ ...profile, mapLink: e.target.value })}
                placeholder="e.g. Switea Garden Cafe, Karni Vihar, Gandhipath, Jaipur or https://maps.google.com/?q=..."
                className="w-full px-4 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-nature-800"
              />
              <p className="text-[11px] text-stone-400 mt-1">
                Enter your cafe location name or Google Maps URL. The public Contact and About pages will automatically display this map.
              </p>
            </div>

            {/* Live Map Preview */}
            <div className="mt-3 rounded-2xl overflow-hidden border border-stone-200 aspect-[16/7] bg-stone-100 relative">
              <iframe
                title="Live Map Preview"
                src={`https://maps.google.com/maps?q=${encodeURIComponent(
                  profile.mapLink || `${profile.address}, ${profile.city}`
                )}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
                className="w-full h-full border-0"
                loading="lazy"
              />
            </div>
          </div>

          {/* Payment & UPI Configuration */}
          <div className="bg-white rounded-3xl border border-stone-200 p-6 shadow-soft space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-stone-100">
              <div>
                <h2 className="font-serif font-bold text-base text-stone-900">UPI & Dynamic QR Payment Setup</h2>
                <p className="text-xs text-stone-500">Configure your cafe's UPI VPA for locked-amount GPay, PhonePe & Paytm customer payments</p>
              </div>
            </div>

            <div>
              <label className="text-xs uppercase tracking-wider font-bold text-stone-600 block mb-1">
                Cafe Merchant UPI ID (VPA)
              </label>
              <input
                type="text"
                value={profile.upiId || ''}
                onChange={(e) => setProfile({ ...profile, upiId: e.target.value })}
                placeholder="e.g. 9555495454@paytm or switeanaturecafe@okhdfcbank"
                className="w-full px-4 py-2.5 rounded-xl border border-stone-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-nature-800"
              />
              <p className="text-[11px] text-stone-400 mt-1">
                Customer payments will generate dynamic UPI QR codes and GPay links with this exact VPA and locked bill amounts.
              </p>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="bg-nature-900 hover:bg-nature-950 text-white px-8 py-3 rounded-2xl font-bold text-sm shadow transition-all flex items-center gap-2"
            >
              <Save className="w-4 h-4 text-nature-300" />
              <span>{saving ? 'Saving...' : 'Save Settings'}</span>
            </button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
};
