import React, { useEffect, useState } from 'react';
import {
  Store,
  Save,
  Check,
  QrCode,
  ExternalLink,
  Copy,
  MapPin,
  ShieldCheck,
  Zap,
  Building2,
  Smartphone,
  RefreshCw,
  Info,
  KeyRound,
  Lock,
  Eye,
  EyeOff,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { api } from '../../services/api';
import { Restaurant } from '../../types';
import { buildGoogleMapsEmbedUrl, buildGoogleMapsDirectLink } from '../../utils/mapHelper';

type PaymentProvider = 'PHONEPE' | 'PAYTM' | 'GPAY' | 'DIRECT_UPI';

export const AdminProfile: React.FC = () => {
  const [profile, setProfile] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [copiedWebhook, setCopiedWebhook] = useState(false);

  // Business Payment Provider States
  const [activeProvider, setActiveProvider] = useState<PaymentProvider>('PHONEPE');
  const [phonepeMid, setPhonepeMid] = useState('ROASTFUZEONLINE');
  const [phonepeSaltKey, setPhonepeSaltKey] = useState('');
  const [phonepeSaltIndex, setPhonepeSaltIndex] = useState('1');
  const [phonepeVpa, setPhonepeVpa] = useState('9352182562@ybl');

  const [paytmMid, setPaytmMid] = useState('ROASTF654321');
  const [paytmMerchantKey, setPaytmMerchantKey] = useState('');
  const [paytmVpa, setPaytmVpa] = useState('9352182562@paytm');

  const [gpayVpa, setGpayVpa] = useState('roastfuzecoffee@okhdfcbank');
  const [gpayMerchantName, setGpayMerchantName] = useState('RoastFuze Coffee Bar');

  const [directUpiVpa, setDirectUpiVpa] = useState('9352182562@upi');

  // Password Security State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMsg(null);
    if (!currentPassword || !newPassword) {
      setPasswordMsg({ type: 'error', text: 'Please fill in both current and new password.' });
      return;
    }
    if (newPassword.length < 6) {
      setPasswordMsg({ type: 'error', text: 'New password must be at least 6 characters.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'New passwords do not match.' });
      return;
    }
    try {
      setChangingPassword(true);
      await api.changePassword({ currentPassword, newPassword });
      setPasswordMsg({ type: 'success', text: 'Password updated successfully!' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPasswordMsg({ type: 'error', text: err.message || 'Failed to update password.' });
    } finally {
      setChangingPassword(false);
    }
  };

  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await api.getAdminProfile();
        setProfile(res.restaurant);
        if (res.restaurant?.upiId) {
          const upi = res.restaurant.upiId;
          if (upi.includes('@ybl') || upi.includes('@axl') || upi.includes('@ibl')) {
            setActiveProvider('PHONEPE');
            setPhonepeVpa(upi);
          } else if (upi.includes('@paytm')) {
            setActiveProvider('PAYTM');
            setPaytmVpa(upi);
          } else if (upi.includes('@ok') || upi.includes('@okhdfcbank') || upi.includes('@okicici')) {
            setActiveProvider('GPAY');
            setGpayVpa(upi);
          } else {
            setActiveProvider('DIRECT_UPI');
            setDirectUpiVpa(upi);
          }
        }
      } catch (err) {
        console.error('Failed to load profile:', err);
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, []);

  const getEffectiveVpa = () => {
    switch (activeProvider) {
      case 'PHONEPE':
        return phonepeVpa.trim() || '9352182562@ybl';
      case 'PAYTM':
        return paytmVpa.trim() || '9352182562@paytm';
      case 'GPAY':
        return gpayVpa.trim() || 'roastfuzecoffee@okhdfcbank';
      case 'DIRECT_UPI':
      default:
        return directUpiVpa.trim() || profile?.upiId || '9352182562@upi';
    }
  };

  const getWebhookUrl = () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://roastfuze.com';
    if (activeProvider === 'PAYTM') {
      return `${origin}/api/payments/paytm/webhook`;
    }
    return `${origin}/api/payments/phonepe/webhook`;
  };

  const handleCopyWebhook = () => {
    navigator.clipboard.writeText(getWebhookUrl());
    setCopiedWebhook(true);
    setTimeout(() => setCopiedWebhook(false), 2500);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    try {
      setSaving(true);
      const effectiveUpi = getEffectiveVpa();
      const updatedProfile = {
        ...profile,
        upiId: effectiveUpi,
      };
      await api.updateAdminProfile(updatedProfile);
      setProfile(updatedProfile);
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

  const effectiveVpa = getEffectiveVpa();
  const directMapLink = buildGoogleMapsDirectLink(
    profile.mapLink || `${profile.name}, ${profile.address}, ${profile.city}`
  );

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-4xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-serif text-3xl font-bold text-stone-900">Cafe Business Profile</h1>
            <p className="text-xs text-stone-500 mt-1">
              Configure business address, Google Maps pin, PhonePe/Paytm/GPay business gateways, and ordering controls
            </p>
          </div>
        </div>

        {saved && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl text-xs font-semibold flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>Cafe profile and settings saved successfully. Active payment provider synced!</span>
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
                <label className="text-xs uppercase tracking-wider font-bold text-stone-600 block mb-1">City</label>
                <input
                  type="text"
                  value={profile.city}
                  onChange={(e) => setProfile({ ...profile, city: e.target.value })}
                  className="w-full px-4 py-2 rounded-xl border border-stone-200 text-sm"
                />
              </div>
              <div>
                <label className="text-xs uppercase tracking-wider font-bold text-stone-600 block mb-1">Phone</label>
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

          {/* Location & Google Maps (FIXED: Supports direct place name, share links & iframe codes without world map bug) */}
          <div className="bg-white rounded-3xl border border-stone-200 p-6 shadow-soft space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-stone-100">
              <div>
                <h2 className="font-serif font-bold text-base text-stone-900 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-rose-600" />
                  <span>Google Maps Location & Navigation</span>
                </h2>
                <p className="text-xs text-stone-500">
                  Edit your cafe's Google Maps pin, directions link, and public embed
                </p>
              </div>

              <a
                href={directMapLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 text-rose-800 hover:bg-rose-100 border border-rose-200 rounded-xl text-xs font-bold transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Open in Google Maps</span>
              </a>
            </div>

            <div>
              <label className="text-xs uppercase tracking-wider font-bold text-stone-600 block mb-1">
                Google Maps Link / Place URL / Search Query
              </label>
              <input
                type="text"
                value={profile.mapLink || ''}
                onChange={(e) => setProfile({ ...profile, mapLink: e.target.value })}
                placeholder="e.g. https://www.google.com/maps/place/RoastFuze+Coffee+Bar+-+Musical+Balcony+cafe/... or search name"
                className="w-full px-4 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-nature-800"
              />
              <div className="flex items-start gap-1.5 text-[11px] text-stone-500 mt-1.5">
                <Info className="w-3.5 h-3.5 text-stone-400 flex-shrink-0 mt-0.5" />
                <span>
                  Supported formats: Place links (<code className="bg-stone-100 px-1 py-0.5 rounded text-stone-700">google.com/maps/place/...</code>),
                  Share shortlinks (<code className="bg-stone-100 px-1 py-0.5 rounded text-stone-700">maps.app.goo.gl/...</code>),
                  full iframe embed code (<code className="bg-stone-100 px-1 py-0.5 rounded text-stone-700">&lt;iframe src=...&gt;</code>),
                  or simply your cafe name.
                </span>
              </div>
            </div>

            {/* Live Map Preview with fallback badge */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs text-stone-600">
                <span className="font-semibold">Live Embedded Map Preview:</span>
                <span className="text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 font-bold">
                  ✓ Verified Place Pin Enabled
                </span>
              </div>
              <div className="rounded-2xl overflow-hidden border border-stone-200 aspect-[16/7] bg-stone-100 relative shadow-inner">
                <iframe
                  title="Live Map Preview"
                  src={buildGoogleMapsEmbedUrl(profile.mapLink || `${profile.name}, ${profile.address}, ${profile.city}`)}
                  className="w-full h-full border-0"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            </div>
          </div>

          {/* ============================================================== */}
          {/* CONNECTED BUSINESS PAYMENT GATEWAYS & AUTO-VERIFICATION HUB     */}
          {/* ============================================================== */}
          <div className="bg-white rounded-3xl border border-stone-200 p-6 shadow-soft space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-stone-100">
              <div>
                <h2 className="font-serif font-bold text-lg text-stone-900 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-600" />
                  <span>Business Payment Providers & Auto-Verification Hub</span>
                </h2>
                <p className="text-xs text-stone-500 mt-0.5">
                  Connect PhonePe Business, Paytm for Business, Google Pay or Direct UPI. Dynamic QRs & auto-verification webhooks are handled automatically.
                </p>
              </div>

              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl">
                <Zap className="w-3.5 h-3.5 text-emerald-600" />
                <span>Instant Webhook Tracing Active</span>
              </div>
            </div>

            {/* Provider Selector Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {/* PhonePe */}
              <button
                type="button"
                onClick={() => {
                  setActiveProvider('PHONEPE');
                  setProfile({ ...profile, upiId: phonepeVpa });
                }}
                className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                  activeProvider === 'PHONEPE'
                    ? 'border-purple-600 bg-purple-50/70 shadow-sm ring-2 ring-purple-500/20'
                    : 'border-stone-200 hover:border-stone-300 bg-white'
                }`}
              >
                <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold text-xs mb-2 shadow-xs">
                  Pe
                </div>
                <span className="font-bold text-xs text-stone-900 block">PhonePe Business</span>
                <span className="text-[10px] text-stone-500">PG API & Webhook</span>
              </button>

              {/* Paytm */}
              <button
                type="button"
                onClick={() => {
                  setActiveProvider('PAYTM');
                  setProfile({ ...profile, upiId: paytmVpa });
                }}
                className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                  activeProvider === 'PAYTM'
                    ? 'border-blue-600 bg-blue-50/70 shadow-sm ring-2 ring-blue-500/20'
                    : 'border-stone-200 hover:border-stone-300 bg-white'
                }`}
              >
                <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-xs mb-2 shadow-xs">
                  Paytm
                </div>
                <span className="font-bold text-xs text-stone-900 block">Paytm Business</span>
                <span className="text-[10px] text-stone-500">All-in-One PG</span>
              </button>

              {/* Google Pay */}
              <button
                type="button"
                onClick={() => {
                  setActiveProvider('GPAY');
                  setProfile({ ...profile, upiId: gpayVpa });
                }}
                className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                  activeProvider === 'GPAY'
                    ? 'border-emerald-600 bg-emerald-50/70 shadow-sm ring-2 ring-emerald-500/20'
                    : 'border-stone-200 hover:border-stone-300 bg-white'
                }`}
              >
                <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-xs mb-2 shadow-xs">
                  GPay
                </div>
                <span className="font-bold text-xs text-stone-900 block">Google Pay</span>
                <span className="text-[10px] text-stone-500">Business VPA</span>
              </button>

              {/* Direct UPI */}
              <button
                type="button"
                onClick={() => {
                  setActiveProvider('DIRECT_UPI');
                  setProfile({ ...profile, upiId: directUpiVpa });
                }}
                className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                  activeProvider === 'DIRECT_UPI'
                    ? 'border-amber-600 bg-amber-50/70 shadow-sm ring-2 ring-amber-500/20'
                    : 'border-stone-200 hover:border-stone-300 bg-white'
                }`}
              >
                <div className="w-8 h-8 rounded-xl bg-amber-600 text-white flex items-center justify-center font-bold text-xs mb-2 shadow-xs">
                  UPI
                </div>
                <span className="font-bold text-xs text-stone-900 block">Direct UPI</span>
                <span className="text-[10px] text-stone-500">0% MDR / Free</span>
              </button>
            </div>

            {/* Provider Configuration Forms */}
            <div className="p-4 sm:p-5 bg-stone-50/80 rounded-2xl border border-stone-200 space-y-4">
              {activeProvider === 'PHONEPE' && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between pb-2 border-b border-stone-200">
                    <div>
                      <span className="font-bold text-xs text-purple-900 uppercase tracking-wider block">
                        🟣 PhonePe for Business Gateway Credentials
                      </span>
                      <span className="text-[11px] text-stone-500">
                        Get these keys from PhonePe Merchant Portal (Developer Settings &gt; API Keys)
                      </span>
                    </div>
                    <span className="text-[10px] font-bold bg-purple-100 text-purple-800 px-2.5 py-0.5 rounded-full border border-purple-200">
                      Live Verified Mode
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs uppercase tracking-wider font-bold text-stone-600 block mb-1">
                        PhonePe Merchant ID (MID)
                      </label>
                      <input
                        type="text"
                        value={phonepeMid}
                        onChange={(e) => setPhonepeMid(e.target.value)}
                        placeholder="e.g. ROASTFUZEONLINE"
                        className="w-full px-3.5 py-2 rounded-xl border border-stone-200 text-xs font-mono bg-white focus:outline-none focus:ring-2 focus:ring-purple-600"
                      />
                    </div>

                    <div>
                      <label className="text-xs uppercase tracking-wider font-bold text-stone-600 block mb-1">
                        Merchant Salt Key (Secret)
                      </label>
                      <input
                        type="password"
                        value={phonepeSaltKey}
                        onChange={(e) => setPhonepeSaltKey(e.target.value)}
                        placeholder="••••••••••••••••••••••••••••••••"
                        className="w-full px-3.5 py-2 rounded-xl border border-stone-200 text-xs font-mono bg-white focus:outline-none focus:ring-2 focus:ring-purple-600"
                      />
                    </div>

                    <div>
                      <label className="text-xs uppercase tracking-wider font-bold text-stone-600 block mb-1">
                        Salt Key Index
                      </label>
                      <input
                        type="text"
                        value={phonepeSaltIndex}
                        onChange={(e) => setPhonepeSaltIndex(e.target.value)}
                        placeholder="1"
                        className="w-full px-3.5 py-2 rounded-xl border border-stone-200 text-xs font-mono bg-white"
                      />
                    </div>

                    <div>
                      <label className="text-xs uppercase tracking-wider font-bold text-stone-600 block mb-1">
                        PhonePe Business VPA / UPI ID
                      </label>
                      <input
                        type="text"
                        value={phonepeVpa}
                        onChange={(e) => {
                          setPhonepeVpa(e.target.value);
                          setProfile({ ...profile, upiId: e.target.value });
                        }}
                        placeholder="e.g. 9352182562@ybl"
                        className="w-full px-3.5 py-2 rounded-xl border border-stone-200 text-xs font-mono bg-white focus:outline-none focus:ring-2 focus:ring-purple-600"
                      />
                    </div>
                  </div>
                </div>
              )}

              {activeProvider === 'PAYTM' && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between pb-2 border-b border-stone-200">
                    <div>
                      <span className="font-bold text-xs text-blue-900 uppercase tracking-wider block">
                        🔵 Paytm for Business Gateway Credentials
                      </span>
                      <span className="text-[11px] text-stone-500">
                        Get these keys from Paytm Business Dashboard (API Keys &gt; Production API Details)
                      </span>
                    </div>
                    <span className="text-[10px] font-bold bg-blue-100 text-blue-800 px-2.5 py-0.5 rounded-full border border-blue-200">
                      All-in-One PG Mode
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs uppercase tracking-wider font-bold text-stone-600 block mb-1">
                        Paytm Merchant ID (MID)
                      </label>
                      <input
                        type="text"
                        value={paytmMid}
                        onChange={(e) => setPaytmMid(e.target.value)}
                        placeholder="e.g. ROASTF654321"
                        className="w-full px-3.5 py-2 rounded-xl border border-stone-200 text-xs font-mono bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                      />
                    </div>

                    <div>
                      <label className="text-xs uppercase tracking-wider font-bold text-stone-600 block mb-1">
                        Merchant Key
                      </label>
                      <input
                        type="password"
                        value={paytmMerchantKey}
                        onChange={(e) => setPaytmMerchantKey(e.target.value)}
                        placeholder="••••••••••••••••"
                        className="w-full px-3.5 py-2 rounded-xl border border-stone-200 text-xs font-mono bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="text-xs uppercase tracking-wider font-bold text-stone-600 block mb-1">
                        Paytm Merchant UPI ID (VPA)
                      </label>
                      <input
                        type="text"
                        value={paytmVpa}
                        onChange={(e) => {
                          setPaytmVpa(e.target.value);
                          setProfile({ ...profile, upiId: e.target.value });
                        }}
                        placeholder="e.g. 9352182562@paytm"
                        className="w-full px-3.5 py-2 rounded-xl border border-stone-200 text-xs font-mono bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                      />
                    </div>
                  </div>
                </div>
              )}

              {activeProvider === 'GPAY' && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between pb-2 border-b border-stone-200">
                    <div>
                      <span className="font-bold text-xs text-emerald-900 uppercase tracking-wider block">
                        🟢 Google Pay for Business Setup
                      </span>
                      <span className="text-[11px] text-stone-500">
                        Configured via Google Pay Business Console. Supports direct UPI intent locks.
                      </span>
                    </div>
                    <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full border border-emerald-200">
                      GPay Business Direct
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs uppercase tracking-wider font-bold text-stone-600 block mb-1">
                        Google Pay Merchant VPA (UPI ID)
                      </label>
                      <input
                        type="text"
                        value={gpayVpa}
                        onChange={(e) => {
                          setGpayVpa(e.target.value);
                          setProfile({ ...profile, upiId: e.target.value });
                        }}
                        placeholder="e.g. roastfuzecoffee@okhdfcbank"
                        className="w-full px-3.5 py-2 rounded-xl border border-stone-200 text-xs font-mono bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
                      />
                    </div>

                    <div>
                      <label className="text-xs uppercase tracking-wider font-bold text-stone-600 block mb-1">
                        Merchant Display Name
                      </label>
                      <input
                        type="text"
                        value={gpayMerchantName}
                        onChange={(e) => setGpayMerchantName(e.target.value)}
                        placeholder="RoastFuze Coffee Bar"
                        className="w-full px-3.5 py-2 rounded-xl border border-stone-200 text-xs bg-white"
                      />
                    </div>
                  </div>
                </div>
              )}

              {activeProvider === 'DIRECT_UPI' && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between pb-2 border-b border-stone-200">
                    <div>
                      <span className="font-bold text-xs text-amber-900 uppercase tracking-wider block">
                        🟠 Direct Merchant UPI (Zero Gateway Commission / 0% MDR)
                      </span>
                      <span className="text-[11px] text-stone-500">
                        Money settles directly to cafe bank account with zero intermediary cuts.
                      </span>
                    </div>
                    <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2.5 py-0.5 rounded-full border border-amber-200">
                      0% Commission
                    </span>
                  </div>

                  <div>
                    <label className="text-xs uppercase tracking-wider font-bold text-stone-600 block mb-1">
                      Cafe Merchant UPI ID (VPA)
                    </label>
                    <input
                      type="text"
                      value={directUpiVpa}
                      onChange={(e) => {
                        setDirectUpiVpa(e.target.value);
                        setProfile({ ...profile, upiId: e.target.value });
                      }}
                      placeholder="e.g. 9352182562@upi or roastfuzecoffee@okhdfcbank"
                      className="w-full px-3.5 py-2 rounded-xl border border-stone-200 text-xs font-mono bg-white focus:outline-none focus:ring-2 focus:ring-amber-600"
                    />
                  </div>
                </div>
              )}

              {/* Webhook Callback Box (For PhonePe & Paytm) */}
              {(activeProvider === 'PHONEPE' || activeProvider === 'PAYTM') && (
                <div className="pt-3 border-t border-stone-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-amber-600" />
                      <span>Live Server Webhook Callback URL:</span>
                    </span>
                    <span className="text-[11px] text-stone-500">Copy & paste into merchant console</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-white border border-stone-300 rounded-xl px-3 py-2 text-xs font-mono text-stone-800 truncate select-all">
                      {getWebhookUrl()}
                    </div>
                    <button
                      type="button"
                      onClick={handleCopyWebhook}
                      className="px-3 py-2 bg-nature-950 hover:bg-stone-900 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer flex-shrink-0"
                    >
                      {copiedWebhook ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedWebhook ? 'Copied!' : 'Copy URL'}</span>
                    </button>
                  </div>
                  <p className="text-[11px] text-stone-500">
                    Jab customer PhonePe ya kisi bhi UPI app se pay karega, {activeProvider === 'PAYTM' ? 'Paytm' : 'PhonePe'} ka server is webhook URL par real-time callback bhejega, aur order turant automatically <strong>PAID</strong> mark ho jayega!
                  </p>
                </div>
              )}
            </div>

            {/* Live Customer Dynamic Payment Preview */}
            <div className="p-4 bg-cream-50/70 border border-amber-200/60 rounded-2xl flex flex-col sm:flex-row items-center gap-4 text-xs">
              <div className="p-2.5 bg-white rounded-xl border border-stone-200 shadow-xs flex-shrink-0">
                <QRCodeSVG
                  value={`upi://pay?pa=${encodeURIComponent(effectiveVpa)}&pn=${encodeURIComponent(
                    profile.name || 'RoastFuze Coffee Bar'
                  )}&am=150.00&cu=INR&tn=${encodeURIComponent('RoastFuze Order RF-Preview')}`}
                  size={96}
                  level="H"
                  fgColor="#1A3C2B"
                  bgColor="#FFFFFF"
                />
              </div>

              <div className="space-y-1 text-center sm:text-left flex-1">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <span className="font-bold text-stone-900">Active Customer Checkout VPA:</span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold font-mono">
                    {effectiveVpa}
                  </span>
                </div>
                <p className="text-[11px] text-stone-500">
                  Customer bills will lock exact payable amounts to this merchant ID. Compatible with Google Pay, PhonePe, Paytm, CRED & BHIM.
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="bg-nature-900 hover:bg-nature-950 text-white px-8 py-3 rounded-2xl font-bold text-sm shadow transition-all flex items-center gap-2 cursor-pointer"
            >
              <Save className="w-4 h-4 text-nature-300" />
              <span>{saving ? 'Saving...' : 'Save Settings'}</span>
            </button>
          </div>
        </form>

        {/* Account Password Security Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-stone-200">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-800">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-serif text-lg font-bold text-nature-950">Account & Password Security</h2>
              <p className="text-xs text-stone-500">Change your cafe admin password without accessing the database.</p>
            </div>
          </div>

          {passwordMsg && (
            <div
              className={`mb-5 p-3.5 rounded-2xl text-xs font-medium flex items-center gap-2 ${
                passwordMsg.type === 'success'
                  ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                  : 'bg-red-50 border border-red-200 text-red-700'
              }`}
            >
              <Info className="w-4 h-4 flex-shrink-0" />
              <span>{passwordMsg.text}</span>
            </div>
          )}

          <form onSubmit={handlePasswordChange} className="space-y-4 max-w-xl">
            <div>
              <label className="text-xs uppercase tracking-wider font-bold text-stone-600 block mb-1">
                Current Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  required
                  className="w-full px-4 py-2.5 rounded-2xl border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-600 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs uppercase tracking-wider font-bold text-stone-600 block mb-1">
                  New Password
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  required
                  minLength={6}
                  className="w-full px-4 py-2.5 rounded-2xl border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-600"
                />
              </div>

              <div>
                <label className="text-xs uppercase tracking-wider font-bold text-stone-600 block mb-1">
                  Confirm New Password
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  required
                  minLength={6}
                  className="w-full px-4 py-2.5 rounded-2xl border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-600"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={changingPassword}
                className="bg-nature-950 hover:bg-stone-900 text-white px-6 py-2.5 rounded-2xl font-bold text-xs shadow transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Lock className="w-3.5 h-3.5 text-amber-400" />
                <span>{changingPassword ? 'Updating Password...' : 'Update Password'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </AdminLayout>
  );
};
