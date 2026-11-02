import React, { useEffect, useState } from 'react';
import {
  Plus,
  Building2,
  ExternalLink,
  Power,
  Check,
  AlertCircle,
  Copy,
  Share2,
  Sparkles,
  X,
  Phone,
  Mail,
  Lock,
  MapPin,
  QrCode,
  Search,
  Eye,
  Palette,
  Layers,
  UtensilsCrossed,
  Trees,
  Coffee,
  Crown,
  Tv,
  Trash2,
  RotateCcw,
  Key,
  EyeOff,
} from 'lucide-react';
import { SuperAdminLayout } from '../../components/layout/SuperAdminLayout';
import { api } from '../../services/api';
import { getOnboardLinks } from '../../utils/tenantHelper';
import { THEME_PRESETS, ThemeTemplateId, ThemePreset } from '../../utils/themePresets';

export const SuperAdminRestaurants: React.FC = () => {
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAdd, setShowAdd] = useState(false);

  // Form inputs
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [isSlugManuallyEdited, setIsSlugManuallyEdited] = useState(false);
  const [ownerEmail, setOwnerEmail] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [ownerPassword, setOwnerPassword] = useState('CafeOwner@2026!');
  const [showOwnerPassword, setShowOwnerPassword] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState<ThemeTemplateId>('GARDEN_CAFE');
  const [themeFilter, setThemeFilter] = useState<'all' | 'outdoor' | 'lounge' | 'heritage' | 'modern' | 'casual'>('all');
  const [previewThemeModal, setPreviewThemeModal] = useState<ThemePreset | null>(null);

  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('Jaipur');
  const [logo, setLogo] = useState('');
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploadingLogo(true);
      const res = await api.uploadImage(file);
      if (res.url) {
        setLogo(res.url);
      }
    } catch (err: any) {
      alert(`Logo upload failed: ${err.message || 'Server error'}`);
    } finally {
      setUploadingLogo(false);
    }
  };

  // Directory filter tabs & Delete modal state
  const [directoryTab, setDirectoryTab] = useState<'active' | 'archived'>('active');
  const [restaurantToDelete, setRestaurantToDelete] = useState<any | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Onboarding success modal
  const [onboardSuccess, setOnboardSuccess] = useState<any | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const fetchRestaurants = async () => {
    try {
      setLoading(true);
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

  const handleNameChange = (val: string) => {
    setName(val);
    if (!isSlugManuallyEdited) {
      const autoSlug = val
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      setSlug(autoSlug);
    }
  };

  const handleSlugChange = (val: string) => {
    setIsSlugManuallyEdited(true);
    setSlug(val.toLowerCase().replace(/[^a-z0-9-]/g, ''));
  };

  const generatePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%';
    let pwd = '';
    for (let i = 0; i < 12; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setOwnerPassword(pwd);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanSlug = slug.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    if (!name.trim() || !cleanSlug || !ownerEmail.trim()) {
      alert('Please fill restaurant name, subdomain slug, and owner email.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await api.createRestaurant({
        name: name.trim(),
        slug: cleanSlug,
        ownerEmail: ownerEmail.trim(),
        ownerName: ownerName.trim() || undefined,
        ownerPassword: ownerPassword || 'CafeOwner@2026!',
        themeTemplate: selectedTheme,
        phone: phone.trim() || undefined,
        address: address.trim() || undefined,
        city: city.trim() || 'Jaipur',
        logo: logo || undefined,
      });

      setShowAdd(false);
      setName('');
      setSlug('');
      setIsSlugManuallyEdited(false);
      setOwnerEmail('');
      setOwnerName('');
      setPhone('');
      setAddress('');
      setLogo('');

      // Generate dynamic onboarding links based on current environment (localhost vs production)
      const links = getOnboardLinks(cleanSlug);

      setOnboardSuccess({
        restaurantName: res.restaurant?.name || name,
        slug: cleanSlug,
        menuUrl: links.subdomainMenuUrl,
        directMenuUrl: links.directMenuUrl,
        adminUrl: links.adminUrl,
        adminDirectUrl: links.adminDirectUrl,
        isLocal: links.isLocal,
        ownerEmail: ownerEmail.trim(),
        password: ownerPassword || 'CafeOwner@2026!',
      });

      fetchRestaurants();
    } catch (err: any) {
      alert(err.message || 'Failed to onboard restaurant.');
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

  const handleDeleteRestaurant = async () => {
    if (!restaurantToDelete) return;
    try {
      setDeleting(true);
      await api.deleteRestaurant(restaurantToDelete.id);
      setRestaurantToDelete(null);
      fetchRestaurants();
    } catch (err: any) {
      alert(err.message || 'Failed to delete restaurant.');
    } finally {
      setDeleting(false);
    }
  };

  const handleRestoreRestaurant = async (id: string) => {
    try {
      await api.restoreRestaurant(id);
      fetchRestaurants();
    } catch (err: any) {
      alert(err.message || 'Failed to restore restaurant.');
    }
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const activeCafes = restaurants.filter((r) => !r.isDeleted);
  const archivedCafes = restaurants.filter((r) => r.isDeleted);

  const displayedRestaurants = (directoryTab === 'active' ? activeCafes : archivedCafes).filter((r) => {
    const q = searchTerm.toLowerCase();
    return (
      r.name.toLowerCase().includes(q) ||
      r.slug.toLowerCase().includes(q) ||
      (r.city && r.city.toLowerCase().includes(q))
    );
  });

  const allThemeKeys = Object.keys(THEME_PRESETS) as ThemeTemplateId[];
  const displayedThemes = allThemeKeys.filter((k) => {
    if (themeFilter === 'all') return true;
    return THEME_PRESETS[k].category === themeFilter;
  });

  return (
    <SuperAdminLayout>
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Header & Quick Action */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900 tracking-tight">
              Restaurant & Cafe Directory
            </h1>
            <p className="text-xs text-stone-500 mt-1">
              Multi-tenant cafe platform • 10 theme templates • Subdomains & instant digital menus
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search cafes or slugs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white border border-stone-200 rounded-xl text-xs text-stone-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
              />
            </div>

            <button
              onClick={() => {
                setShowAdd(true);
                setIsSlugManuallyEdited(false);
              }}
              className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 sm:px-5 py-2.5 rounded-xl font-bold text-xs shadow-lg shadow-indigo-600/20 transition-all flex-shrink-0"
            >
              <Sparkles className="w-4 h-4" />
              <span>Onboard New Cafe</span>
            </button>
          </div>
        </div>

        {/* Directory Tab Selector (Active vs Archived) */}
        <div className="flex items-center gap-2 border-b border-stone-200 pb-2">
          <button
            type="button"
            onClick={() => setDirectoryTab('active')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              directoryTab === 'active'
                ? 'bg-stone-900 text-white shadow-sm'
                : 'bg-white text-stone-600 hover:bg-stone-100 border border-stone-200'
            }`}
          >
            <span>Active Cafes</span>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full ${
                directoryTab === 'active' ? 'bg-stone-700 text-white' : 'bg-stone-100 text-stone-700 font-bold'
              }`}
            >
              {activeCafes.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setDirectoryTab('archived')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              directoryTab === 'archived'
                ? 'bg-red-800 text-white shadow-sm'
                : 'bg-white text-stone-600 hover:bg-stone-100 border border-stone-200'
            }`}
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Archived / Deleted</span>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full ${
                directoryTab === 'archived' ? 'bg-red-950 text-red-200' : 'bg-stone-100 text-stone-700 font-bold'
              }`}
            >
              {archivedCafes.length}
            </span>
          </button>
        </div>

        {/* Directory List */}
        <div className="bg-white rounded-2xl sm:rounded-3xl border border-stone-200 shadow-soft overflow-hidden divide-y divide-stone-100">
          {loading ? (
            <div className="p-12 text-center text-xs text-stone-400">Loading restaurants directory...</div>
          ) : displayedRestaurants.length === 0 ? (
            <div className="p-12 text-center text-xs text-stone-500">
              {directoryTab === 'active'
                ? 'No active cafes found matching your query.'
                : 'No archived or deleted cafes found.'}
            </div>
          ) : (
            displayedRestaurants.map((r) => {
              const owner = r.memberships?.[0]?.user;
              const sub = r.subscriptions?.[0];
              const links = getOnboardLinks(r.slug);
              const theme = THEME_PRESETS[r.themeTemplate as ThemeTemplateId] || THEME_PRESETS.GARDEN_CAFE;

              return (
                <div key={r.id} className="p-5 sm:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:bg-stone-50/50 transition-colors">
                  <div className="space-y-2 min-w-0">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <strong className="text-base sm:text-lg text-stone-900 font-serif">{r.name}</strong>
                      <span className="text-xs font-mono bg-stone-100 px-2 py-0.5 rounded text-stone-600">
                        /{r.slug}
                      </span>
                      {r.themeTemplate && (
                        <span
                          className="text-[10px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1"
                          style={{
                            backgroundColor: `${theme.primaryColor}15`,
                            color: theme.primaryColor,
                            borderColor: `${theme.primaryColor}30`,
                          }}
                        >
                          <span
                            className="w-1.5 h-1.5 rounded-full inline-block"
                            style={{ backgroundColor: theme.primaryColor }}
                          />
                          <span>{theme.label}</span>
                        </span>
                      )}
                      {r.isDeleted ? (
                        <span className="text-[10px] uppercase tracking-wider font-extrabold px-2.5 py-0.5 rounded-full bg-red-100 text-red-800 border border-red-200">
                          Deleted / Offline
                        </span>
                      ) : (
                        <span
                          className={`text-[10px] uppercase tracking-wider font-extrabold px-2.5 py-0.5 rounded-full ${
                            r.isOpen
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              : 'bg-stone-100 text-stone-500 border border-stone-200'
                          }`}
                        >
                          {r.isOpen ? 'Active' : 'Paused'}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-stone-500">
                      {r.city && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-stone-400" />
                          <span>{r.city}</span>
                        </span>
                      )}
                      {owner && (
                        <span className="flex items-center gap-1">
                          <Mail className="w-3.5 h-3.5 text-stone-400" />
                          <span>{owner.email}</span>
                        </span>
                      )}
                      <span className="font-mono text-stone-400 text-[11px]">
                        Plan: {sub?.plan?.name || 'Pro Starter'}
                      </span>
                    </div>

                    {/* Quick Link Pills (Only for active cafes) */}
                    {!r.isDeleted && (
                      <div className="flex flex-wrap items-center gap-2 pt-1 font-mono text-[11px]">
                        <a
                          href={links.subdomainMenuUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 bg-stone-100 hover:bg-stone-200 text-stone-700 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                          title="Subdomain Customer Menu"
                        >
                          <ExternalLink className="w-3 h-3 text-stone-500" />
                          <span>Subdomain: {links.subdomainMenuUrl.replace('http://', '').replace('https://', '')}</span>
                        </a>

                        <a
                          href={links.adminUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                          title="Staff & Owner Portal"
                        >
                          <Lock className="w-3 h-3 text-indigo-500" />
                          <span>Admin Portal</span>
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Actions Column */}
                  <div className="flex items-center gap-2 flex-shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-stone-100">
                    {r.isDeleted ? (
                      <button
                        onClick={() => handleRestoreRestaurant(r.id)}
                        className="px-3.5 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition-colors cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Restore Cafe</span>
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={() => handleToggleStatus(r.id)}
                          className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 border transition-colors cursor-pointer ${
                            r.isOpen
                              ? 'bg-amber-50 text-amber-900 border-amber-200 hover:bg-amber-100'
                              : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                          }`}
                        >
                          <Power className="w-3.5 h-3.5" />
                          <span>{r.isOpen ? 'Pause Cafe' : 'Activate Cafe'}</span>
                        </button>

                        <button
                          onClick={() => setRestaurantToDelete(r)}
                          className="px-2.5 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1 bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 transition-colors cursor-pointer"
                          title="Delete cafe (Takes website offline, DB preserved)"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete</span>
                        </button>

                        <a
                          href={links.subdomainMenuUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="p-2 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-xl"
                          title="Open Live Public Website"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Onboarding Modal with 10 Themes & Category Pills */}
        {showAdd && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
            <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm" onClick={() => setShowAdd(false)} />

            <div className="relative w-full max-w-4xl bg-white rounded-3xl p-5 sm:p-7 shadow-2xl border border-stone-200 z-10 my-8 space-y-5 max-h-[92vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                <div>
                  <h3 className="font-serif font-bold text-lg sm:text-xl text-stone-900">Onboard New Restaurant</h3>
                  <p className="text-xs text-stone-500">
                    Creates tenant database, provisions subdomain, owner login, and clones starter theme menu
                  </p>
                </div>
                <button onClick={() => setShowAdd(false)} className="p-1 rounded-lg text-stone-400 hover:text-stone-700">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreate} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">Restaurant Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Parth Cafe"
                      value={name}
                      onChange={(e) => handleNameChange(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">Subdomain Slug *</label>
                    <input
                      type="text"
                      required
                      placeholder="parth-cafe"
                      value={slug}
                      onChange={(e) => handleSlugChange(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-mono focus:ring-2 focus:ring-indigo-500"
                    />
                    <div className="flex items-center justify-between mt-1 text-[10px] font-mono text-stone-500">
                      <span>Localhost: <strong className="text-indigo-600">http://{slug || 'cafe'}.localhost:5170</strong></span>
                      <span>Prod: <strong className="text-stone-700">https://{slug || 'cafe'}.asrockstudios.in</strong></span>
                    </div>
                  </div>
                </div>

                {/* Cafe Logo & Brand Icon */}
                <div className="space-y-3 pt-2 border-t border-stone-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="block text-xs font-bold text-stone-800">
                        Cafe Logo & Brand Icon *
                      </label>
                      <p className="text-[11px] text-stone-500">
                        Choose a preset icon, upload a custom logo image, or enter an image URL
                      </p>
                    </div>
                    {/* Live Preview */}
                    <div className="flex items-center gap-2 bg-stone-50 px-3 py-1.5 rounded-xl border border-stone-200">
                      <span className="text-[10px] font-bold text-stone-500">Preview:</span>
                      <div
                        className="w-8 h-8 rounded-xl flex items-center justify-center font-serif font-black text-white text-sm shadow-sm overflow-hidden"
                        style={{ backgroundColor: THEME_PRESETS[selectedTheme]?.primaryColor || '#064e3b' }}
                      >
                        {logo ? (
                          <img src={logo} alt="Preview" className="h-full w-full object-cover" />
                        ) : (
                          <span>{name ? name.charAt(0).toUpperCase() : 'C'}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Preset Quick Select Icons */}
                  <div>
                    <span className="text-[11px] font-bold text-stone-700 block mb-1.5">
                      Quick Preset Brand Icons:
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {[
                        { label: '👑 Royal Heritage', url: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=200&q=80' },
                        { label: '☕ Espresso Cafe', url: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=200&q=80' },
                        { label: '🍸 Lounge & Bar', url: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=200&q=80' },
                        { label: '🍕 Stone Pizzeria', url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=200&q=80' },
                        { label: '🌿 Garden Nature', url: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=200&q=80' },
                        { label: '🍰 Bakery & Treats', url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=200&q=80' },
                        { label: '🌮 Bistro Street', url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=200&q=80' },
                        { label: '🍔 Smokehouse', url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=200&q=80' },
                      ].map((item) => (
                        <button
                          key={item.label}
                          type="button"
                          onClick={() => setLogo(item.url)}
                          className={`flex items-center gap-2 p-2 rounded-xl border text-left transition-all ${
                            logo === item.url
                              ? 'border-indigo-600 bg-indigo-50/80 ring-2 ring-indigo-500'
                              : 'border-stone-200 bg-white hover:border-stone-300'
                          }`}
                        >
                          <img src={item.url} alt={item.label} className="w-6 h-6 rounded-lg object-cover" />
                          <span className="text-[10px] font-semibold text-stone-700 truncate">{item.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Custom Upload or URL */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="block text-[11px] font-bold text-stone-700 mb-1">
                        Upload Custom Logo File
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        disabled={uploadingLogo}
                        className="w-full text-xs text-stone-500 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
                      />
                      {uploadingLogo && <span className="text-[10px] text-indigo-600 font-semibold block mt-1">Uploading image...</span>}
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-stone-700 mb-1">
                        Or Enter Direct Logo Image URL
                      </label>
                      <input
                        type="url"
                        placeholder="https://images.unsplash.com/..."
                        value={logo}
                        onChange={(e) => setLogo(e.target.value)}
                        className="w-full px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Theme & Concept Selection */}
                <div className="space-y-2.5 pt-2 border-t border-stone-100">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <label className="block text-xs font-bold text-stone-800">
                        Select Concept & Theme Template (10 Available) *
                      </label>
                      <p className="text-[11px] text-stone-500">
                        Includes color palette, seating spaces, hero typography, and full starter menu
                      </p>
                    </div>

                    {/* Category Filter Pills */}
                    <div className="flex flex-wrap items-center gap-1">
                      {[
                        { id: 'all', label: 'All (10)' },
                        { id: 'outdoor', label: '🌿 Outdoor' },
                        { id: 'lounge', label: '🌆 Rooftop' },
                        { id: 'heritage', label: '👑 Heritage' },
                        { id: 'modern', label: '✨ Modern' },
                        { id: 'casual', label: '📻 Casual' },
                      ].map((tab) => (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => setThemeFilter(tab.id as any)}
                          className={`text-[10px] px-2.5 py-1 rounded-full font-bold transition-all ${
                            themeFilter === tab.id
                              ? 'bg-indigo-600 text-white shadow-sm'
                              : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                          }`}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Themes Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-72 overflow-y-auto pr-1">
                    {displayedThemes.map((tKey) => {
                      const t = THEME_PRESETS[tKey];
                      const isSelected = selectedTheme === tKey;
                      return (
                        <div
                          key={tKey}
                          onClick={() => setSelectedTheme(tKey)}
                          className={`cursor-pointer rounded-2xl border transition-all overflow-hidden flex flex-col justify-between ${
                            isSelected
                              ? 'border-indigo-600 bg-indigo-50/70 shadow-md ring-2 ring-indigo-500'
                              : 'border-stone-200 bg-white hover:border-stone-300 hover:shadow-sm'
                          }`}
                        >
                          <div className="relative h-24 w-full bg-stone-200 overflow-hidden">
                            <img
                              src={t.previewImage}
                              alt={t.label}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-stone-900/80 via-transparent to-black/20" />
                            <div className="absolute top-2 left-2">
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-sm text-white border border-white/20">
                                {t.badge}
                              </span>
                            </div>
                            <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
                              <span className="text-xs font-bold text-white drop-shadow truncate">{t.label}</span>
                              <div className="flex items-center gap-1">
                                <span
                                  className="w-2.5 h-2.5 rounded-full border border-white inline-block shadow-sm"
                                  style={{ backgroundColor: t.primaryColor }}
                                  title="Primary Color"
                                />
                                <span
                                  className="w-2.5 h-2.5 rounded-full border border-white inline-block shadow-sm"
                                  style={{ backgroundColor: t.accentColor }}
                                  title="Accent Color"
                                />
                              </div>
                            </div>
                          </div>

                          <div className="p-2.5 space-y-2">
                            <p className="text-[10px] text-stone-500 line-clamp-2 leading-snug">
                              {t.description}
                            </p>

                            <div className="flex items-center justify-between pt-1 border-t border-stone-100 text-[10px]">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setPreviewThemeModal(t);
                                }}
                                className="text-indigo-600 hover:text-indigo-800 font-semibold inline-flex items-center gap-0.5"
                              >
                                <Eye className="w-3 h-3" /> Preview
                              </button>

                              {isSelected ? (
                                <span className="text-indigo-600 font-extrabold flex items-center gap-0.5">
                                  <Check className="w-3 h-3" /> Selected
                                </span>
                              ) : (
                                <span className="text-stone-400">Click to select</span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Owner Account Login Credentials Section */}
                <div className="bg-gradient-to-br from-indigo-50/80 to-purple-50/60 p-4 rounded-2xl border border-indigo-200/80 space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-xs font-bold shadow-sm shadow-indigo-600/30">
                      <Key className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-stone-900">Owner Account Login Credentials</h4>
                      <p className="text-[11px] text-stone-500">The cafe owner will log into their dashboard using this email & password</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-stone-700 mb-1">
                        Owner Login Email *
                      </label>
                      <input
                        type="email"
                        required
                        placeholder="owner@parthcafe.com"
                        value={ownerEmail}
                        onChange={(e) => setOwnerEmail(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-white border border-stone-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 font-mono shadow-sm"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-bold text-stone-700">
                          Owner Password *
                        </label>
                        <button
                          type="button"
                          onClick={generatePassword}
                          className="text-[10px] text-indigo-600 hover:text-indigo-800 font-bold"
                        >
                          Generate Random
                        </button>
                      </div>
                      <div className="relative">
                        <input
                          type={showOwnerPassword ? 'text' : 'password'}
                          required
                          minLength={6}
                          value={ownerPassword}
                          onChange={(e) => setOwnerPassword(e.target.value)}
                          placeholder="Set owner password..."
                          className="w-full pl-3.5 pr-10 py-2.5 bg-white border border-stone-200 rounded-xl text-xs font-mono focus:ring-2 focus:ring-indigo-500 shadow-sm"
                        />
                        <button
                          type="button"
                          onClick={() => setShowOwnerPassword(!showOwnerPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 p-0.5"
                          title={showOwnerPassword ? 'Hide password' : 'Show password'}
                        >
                          {showOwnerPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Additional Contact Info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">Owner Contact Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Parth Sharma"
                      value={ownerName}
                      onChange={(e) => setOwnerName(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">Contact Phone</label>
                    <input
                      type="text"
                      placeholder="+91 98765 43210"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">City</label>
                    <input
                      type="text"
                      placeholder="Jaipur"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">Address</label>
                    <input
                      type="text"
                      placeholder="Vaishali Nagar, Jaipur"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-100">
                  <button
                    type="button"
                    onClick={() => setShowAdd(false)}
                    disabled={submitting}
                    className="px-4 py-2.5 text-xs font-semibold text-stone-600 hover:text-stone-900 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow transition-colors flex items-center gap-2 disabled:opacity-50"
                  >
                    {submitting ? 'Onboarding Cafe...' : 'Create & Generate Links'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Live Theme Concept Preview Modal */}
        {previewThemeModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
            <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm" onClick={() => setPreviewThemeModal(null)} />
            <div className="relative w-full max-w-2xl bg-white rounded-3xl p-6 shadow-2xl border border-stone-200 z-10 space-y-4 max-h-[85vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700">
                    {previewThemeModal.badge}
                  </span>
                  <h3 className="font-serif font-bold text-lg text-stone-900">{previewThemeModal.label}</h3>
                </div>
                <button onClick={() => setPreviewThemeModal(null)} className="p-1 text-stone-400 hover:text-stone-700">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Cover & Hero */}
              <div className="relative rounded-2xl overflow-hidden h-40 bg-stone-900">
                <img
                  src={previewThemeModal.previewImage}
                  alt={previewThemeModal.label}
                  className="w-full h-full object-cover opacity-75"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex flex-col justify-end p-4 text-white">
                  <span className="text-[10px] uppercase tracking-wider font-bold text-indigo-300">
                    {previewThemeModal.tagLine}
                  </span>
                  <h4 className="text-base font-serif font-bold">{previewThemeModal.heroHeadline}</h4>
                  <p className="text-[11px] text-stone-300 line-clamp-2 mt-0.5">{previewThemeModal.heroSubtitle}</p>
                </div>
              </div>

              {/* Color Palette */}
              <div>
                <span className="text-xs font-bold text-stone-700 block mb-1.5">Theme Color Grading:</span>
                <div className="grid grid-cols-4 gap-2">
                  <div className="p-2 rounded-xl border border-stone-200 text-center space-y-1">
                    <div className="w-full h-6 rounded-lg" style={{ backgroundColor: previewThemeModal.primaryColor }} />
                    <span className="text-[10px] font-mono text-stone-600 block">Primary</span>
                  </div>
                  <div className="p-2 rounded-xl border border-stone-200 text-center space-y-1">
                    <div className="w-full h-6 rounded-lg" style={{ backgroundColor: previewThemeModal.secondaryColor }} />
                    <span className="text-[10px] font-mono text-stone-600 block">Secondary</span>
                  </div>
                  <div className="p-2 rounded-xl border border-stone-200 text-center space-y-1">
                    <div className="w-full h-6 rounded-lg" style={{ backgroundColor: previewThemeModal.accentColor }} />
                    <span className="text-[10px] font-mono text-stone-600 block">Accent</span>
                  </div>
                  <div className="p-2 rounded-xl border border-stone-200 text-center space-y-1">
                    <div className="w-full h-6 rounded-lg border" style={{ backgroundColor: previewThemeModal.bgCream }} />
                    <span className="text-[10px] font-mono text-stone-600 block">Background</span>
                  </div>
                </div>
              </div>

              {/* Seating Spaces */}
              <div>
                <span className="text-xs font-bold text-stone-700 block mb-1.5">Unique Seating Spaces:</span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {previewThemeModal.spaces.map((sp, idx) => (
                    <div key={idx} className="p-2.5 rounded-xl border border-stone-200 bg-stone-50 space-y-1">
                      <span className="text-[11px] font-bold text-stone-900 block">{sp.name}</span>
                      <span className="text-[10px] text-stone-500 block">{sp.subtitle}</span>
                      <span className="text-[9px] font-mono text-indigo-700 font-semibold block">{sp.timing}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setPreviewThemeModal(null)}
                  className="px-4 py-2 text-xs font-semibold text-stone-600 hover:text-stone-900"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedTheme(previewThemeModal.id);
                    setPreviewThemeModal(null);
                  }}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow"
                >
                  Apply This Theme
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Onboarding Complete Success Popup */}
        {onboardSuccess && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
            <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm" onClick={() => setOnboardSuccess(null)} />

            <div className="relative w-full max-w-lg bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-stone-200 z-10 space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
                    <Check className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-serif font-bold text-lg text-stone-900">Cafe Onboarded Successfully!</h3>
                    <p className="text-xs text-stone-500">{onboardSuccess.restaurantName} is live</p>
                  </div>
                </div>
                <button onClick={() => setOnboardSuccess(null)} className="p-1 text-stone-400 hover:text-stone-700">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 bg-stone-50 p-4 rounded-2xl border border-stone-200/80 text-xs">
                {/* Primary Customer Menu Link */}
                <div>
                  <span className="font-bold text-stone-800 block mb-1">
                    {onboardSuccess.isLocal ? '⚡ Localhost Subdomain Menu (Instant Testing):' : '🚀 Live Customer Menu (Subdomain):'}
                  </span>
                  <div className="flex items-center justify-between bg-white px-3 py-2 rounded-xl border border-stone-200 gap-2">
                    <span className="font-mono text-emerald-700 font-semibold truncate">{onboardSuccess.menuUrl}</span>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <a
                        href={onboardSuccess.menuUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-[11px] flex items-center gap-1 cursor-pointer shadow-sm"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>Open</span>
                      </a>
                      <button
                        onClick={() => copyToClipboard(onboardSuccess.menuUrl, 'menuUrl')}
                        className="px-2.5 py-1 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                      >
                        <Copy className="w-3 h-3" />
                        <span>{copiedKey === 'menuUrl' ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Cafe Admin Portal Link */}
                <div>
                  <span className="font-bold text-stone-800 block mb-1">🔐 Cafe Staff & Owner Admin Portal:</span>
                  <div className="flex items-center justify-between bg-white px-3 py-2 rounded-xl border border-stone-200 gap-2">
                    <span className="font-mono text-indigo-700 font-semibold truncate">
                      {onboardSuccess.adminUrl}
                    </span>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <a
                        href={onboardSuccess.adminUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold text-[11px] flex items-center gap-1 cursor-pointer shadow-sm"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>Open</span>
                      </a>
                      <button
                        onClick={() => copyToClipboard(onboardSuccess.adminUrl, 'adminUrl')}
                        className="px-2.5 py-1 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                      >
                        <Copy className="w-3 h-3" />
                        <span>{copiedKey === 'adminUrl' ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Direct Route Backup Menu Link */}
                <div>
                  <span className="font-bold text-stone-800 block mb-1">🌐 Direct Route Backup Menu (Instant Zero-DNS):</span>
                  <div className="flex items-center justify-between bg-white px-3 py-2 rounded-xl border border-stone-200 gap-2">
                    <span className="font-mono text-stone-600 truncate">{onboardSuccess.directMenuUrl}</span>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <a
                        href={onboardSuccess.directMenuUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="px-2.5 py-1 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>Open</span>
                      </a>
                      <button
                        onClick={() => copyToClipboard(onboardSuccess.directMenuUrl, 'directMenuUrl')}
                        className="px-2.5 py-1 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                      >
                        <Copy className="w-3 h-3" />
                        <span>{copiedKey === 'directMenuUrl' ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                  </div>
                  <p className="text-[10px] text-stone-400 mt-1">
                    Direct route works instantly on any server without requiring DNS subdomain provisioning.
                  </p>
                </div>
              </div>

              {/* Owner Credentials */}
                <div className="pt-2 border-t border-stone-200/80">
                  <span className="font-bold text-stone-800 block mb-1">👤 Owner Login Credentials:</span>
                  <div className="bg-white p-3 rounded-xl border border-stone-200 space-y-1.5 font-mono text-[11px]">
                    <div className="flex items-center justify-between">
                      <p>Email: <strong>{onboardSuccess.ownerEmail}</strong></p>
                      <button
                        onClick={() => copyToClipboard(onboardSuccess.ownerEmail, 'ownerEmail')}
                        className="text-indigo-600 hover:text-indigo-800 text-[10px] font-bold"
                      >
                        {copiedKey === 'ownerEmail' ? 'Copied' : 'Copy Email'}
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <p>Password: <strong className="text-emerald-700">{onboardSuccess.password}</strong></p>
                      <button
                        onClick={() => copyToClipboard(onboardSuccess.password, 'ownerPassword')}
                        className="text-indigo-600 hover:text-indigo-800 text-[10px] font-bold"
                      >
                        {copiedKey === 'ownerPassword' ? 'Copied' : 'Copy Password'}
                      </button>
                    </div>
                  </div>
                </div>

              {/* Share & Done Actions */}
              <div className="flex flex-col sm:flex-row items-center gap-2 pt-2">
                <a
                  href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
                    `Hello! Your cafe digital system is live on ASRock Studios platform!\n\n🍽️ Customer Digital Menu: ${onboardSuccess.menuUrl}\n🔐 Admin Login: ${onboardSuccess.adminUrl}\n\nLogin Email: ${onboardSuccess.ownerEmail}\nPassword: ${onboardSuccess.password}`
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full sm:w-auto flex-1 inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2.5 rounded-xl font-bold text-xs shadow transition-colors"
                >
                  <Share2 className="w-4 h-4" />
                  <span>Share on WhatsApp</span>
                </a>

                <button
                  onClick={() => setOnboardSuccess(null)}
                  className="w-full sm:w-auto px-6 py-2.5 bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs rounded-xl shadow transition-colors"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal (Soft delete with DB protection) */}
        {restaurantToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm"
              onClick={() => !deleting && setRestaurantToDelete(null)}
            />
            <div className="relative w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-stone-200 z-10 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center flex-shrink-0">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-lg text-stone-900">Delete Cafe</h3>
                  <p className="text-xs text-stone-500">Soft-delete with database protection</p>
                </div>
              </div>

              <div className="space-y-3 bg-red-50/60 p-4 rounded-2xl border border-red-200/80 text-xs text-stone-700">
                <p>
                  Are you sure you want to delete <strong>{restaurantToDelete.name}</strong> (
                  <code className="text-stone-900 font-bold">/{restaurantToDelete.slug}</code>)?
                </p>

                <div className="bg-white p-3 rounded-xl border border-red-200 text-[11px] space-y-1.5">
                  <p className="font-bold text-stone-900">🛡️ Database Records Protected:</p>
                  <ul className="list-disc pl-4 space-y-1 text-stone-600">
                    <li>Database orders, payments & revenue remain intact.</li>
                    <li>Historical customer loyalty & ratings remain stored.</li>
                    <li>Public website & subdomains are taken offline immediately.</li>
                    <li>Cafe staff portal access is revoked.</li>
                    <li>You can restore this cafe anytime from the Archived tab.</li>
                  </ul>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setRestaurantToDelete(null)}
                  disabled={deleting}
                  className="px-4 py-2 text-xs font-semibold text-stone-600 hover:text-stone-900 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteRestaurant}
                  disabled={deleting}
                  className="px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl shadow transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  {deleting ? (
                    <span>Deleting Cafe...</span>
                  ) : (
                    <>
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Confirm Delete</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </SuperAdminLayout>
  );
};