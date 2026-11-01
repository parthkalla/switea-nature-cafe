import React, { useEffect, useState } from 'react';
import {
  Palette,
  Check,
  Save,
  ExternalLink,
  Sparkles,
  Eye,
  Globe,
  Radio,
  Sliders,
  Layers,
  MapPin,
  Clock,
  Phone,
  MessageCircle,
  Instagram,
  Facebook,
  Type,
  Share2,
  AlertCircle,
  ToggleLeft,
  ToggleRight,
  LayoutGrid,
  Maximize2,
  Columns,
  Grid,
  Square,
  Wand2,
} from 'lucide-react';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { ImageUploadField } from '../../components/common/ImageUploadField';
import { api } from '../../services/api';
import { THEME_PRESETS, ThemeTemplateId } from '../../utils/themePresets';
import { getOnboardLinks } from '../../utils/tenantHelper';

export const COLOR_PALETTES = [
  {
    id: 'emerald_garden',
    name: '🌿 Emerald Lawn & Sage',
    primary: '#064e3b',
    secondary: '#047857',
    accent: '#10b981',
    bgCream: '#f0fdf4',
    desc: 'Lush botanicals, organic flora, and fresh morning garden vibes',
  },
  {
    id: 'espresso_velvet',
    name: '☕ Dark Roast Espresso',
    primary: '#3e2723',
    secondary: '#5d4037',
    accent: '#d97706',
    bgCream: '#fef3c7',
    desc: 'Rich roasted beans, caramel warmth, and artisan cafe comfort',
  },
  {
    id: 'sunset_terracotta',
    name: '🌆 Sunset Rooftop & Terracotta',
    primary: '#9a3412',
    secondary: '#c2410c',
    accent: '#f59e0b',
    bgCream: '#fff7ed',
    desc: 'Baked clay, warm twilight horizons, and golden hour magic',
  },
  {
    id: 'royal_heritage',
    name: '👑 Royal Heritage & Gold',
    primary: '#4a0e17',
    secondary: '#881337',
    accent: '#eab308',
    bgCream: '#fffbeb',
    desc: 'Regal crimson wine, antique gold chandeliers, and fine dining elegance',
  },
  {
    id: 'tropical_coastal',
    name: '🌊 Tropical Coastal Breeze',
    primary: '#0c4a6e',
    secondary: '#0284c7',
    accent: '#f43f5e',
    bgCream: '#f0fdfa',
    desc: 'Deep marine ocean, turquoise waves, and vibrant coral pink',
  },
  {
    id: 'zen_matcha',
    name: '🍵 Zen Matcha & Sakura',
    primary: '#365314',
    secondary: '#4d7c0f',
    accent: '#ec4899',
    bgCream: '#fafaf9',
    desc: 'Wabi-sabi simplicity, earthy Uji matcha, and cherry blossom rose',
  },
  {
    id: 'midnight_cyber',
    name: '⚡ Midnight Minimalist Noir',
    primary: '#09090b',
    secondary: '#1e293b',
    accent: '#8b5cf6',
    bgCream: '#030712',
    desc: 'Futuristic obsidian black, slate architecture, and electric purple',
  },
  {
    id: 'retro_80s',
    name: '📻 Retro 80s Diner & Vinyl',
    primary: '#991b1b',
    secondary: '#06b6d4',
    accent: '#facc15',
    bgCream: '#fefce8',
    desc: 'Vibrant jukebox red, neon cyan glow, and vanilla milkshake cream',
  },
];

export const PHOTO_LAYOUTS = [
  {
    id: 'bento',
    name: '🍱 Modern Bento Mosaic',
    badge: '3-Tile Asymmetric Collage',
    heroDesc: 'Focal landscape card framed by two stacked dynamic ambiance shots with floating signature beverage tag.',
    spacesDesc: 'Unequal masonry tiles with 2-span feature hero and complementary seating zones.',
    icon: LayoutGrid,
  },
  {
    id: 'magazine',
    name: '📰 Editorial Magazine & Polaroid',
    badge: 'Staggered Fashion Cutaways',
    heroDesc: 'Editorial main visual with overlapping Polaroid floating card, subtle shadow lift, and serif typography.',
    spacesDesc: 'Tall portrait cards (3:4 ratio) with elegant serif numbering (01, 02) and minimalist borders.',
    icon: Columns,
  },
  {
    id: 'cinematic',
    name: '🎬 Panoramic Cinematic & Filmstrip',
    badge: 'Full-Bleed Panoramic View',
    heroDesc: 'Wide cinematic panoramic visual with film reel aesthetic, dark vignette, and golden rating badge.',
    spacesDesc: 'Smooth horizontal filmstrip carousel with glassmorphic space badges and high-res views.',
    icon: Maximize2,
  },
  {
    id: 'split',
    name: '⚡ Dynamic Angled & Split Cards',
    badge: 'Tilted Cards & Vibrant Neon',
    heroDesc: 'Two dynamically tilted photo cards (polaroid angle) with overlapping depth and exciting sticker.',
    spacesDesc: 'Alternating full-width split cards (photo left / text right and vice versa).',
    icon: Grid,
  },
  {
    id: 'zen',
    name: '🍃 Minimalist Japanese Zen',
    badge: 'Geometric 1:1 Squares',
    heroDesc: 'Clean 1:1 square ratio with generous negative space, hairline 1px border, and serene Wabi-Sabi tag.',
    spacesDesc: 'Harmonious 3-column square grid with generous breathing room and delicate captions.',
    icon: Square,
  },
];

export const AdminWebsiteCustomizer: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Active customizer tab
  const [activeTab, setActiveTab] = useState<'template' | 'colors' | 'layout' | 'hero' | 'sections' | 'contact'>('template');

  // Restaurant & Landing Content state
  const [restaurant, setRestaurant] = useState<any>({
    name: '',
    slug: '',
    tagLine: '',
    themeTemplate: 'GARDEN_CAFE',
    primaryColor: '#064e3b',
    secondaryColor: '#047857',
    accentColor: '#10b981',
    bgCream: '#f0fdf4',
    photoLayout: 'bento',
    description: '',
    logo: '',
    coverImage: '',
    address: '',
    city: 'Jaipur',
    phone: '',
    email: '',
    whatsappNumber: '',
    mapLink: '',
    openingHours: '10:00 AM – 11:00 PM',
    isOpen: true,
  });

  const [landingContent, setLandingContent] = useState<any>({
    heroTitle: '',
    heroSubtitle: '',
    heroCtaText: 'Explore Digital Menu',
    heroImage: '',
    aboutTitle: '',
    aboutText: '',
    aboutHighlight1: '',
    aboutHighlight2: '',
    aboutHighlight3: '',
    aboutImage: '',
    announcementText: '',
    announcementActive: false,
    instagramUrl: '',
    facebookUrl: '',
    mapEmbedUrl: '',
    metaTitle: '',
    metaDescription: '',
    isPublished: true,
  });

  // Section visibility toggles
  const [sectionToggles, setSectionToggles] = useState({
    hero: true,
    conceptStory: true,
    spaces: true,
    dayEvening: true,
    menuHighlights: true,
    occasions: true,
    reviews: true,
    locationMap: true,
  });

  const loadCustomizerData = async () => {
    try {
      setLoading(true);
      const res = await api.getWebsiteCustomizer();
      if (res.restaurant) {
        setRestaurant((prev: any) => ({ ...prev, ...res.restaurant }));
      }
      if (res.landingContent) {
        setLandingContent((prev: any) => ({ ...prev, ...res.landingContent }));
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg('Failed to load website customization data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomizerData();
  }, []);

  const handleApplyThemePreset = (themeKey: ThemeTemplateId) => {
    const t = THEME_PRESETS[themeKey];
    if (!t) return;
    setRestaurant((prev: any) => ({
      ...prev,
      themeTemplate: themeKey,
      primaryColor: t.primaryColor,
      secondaryColor: t.secondaryColor,
      accentColor: t.accentColor,
      bgCream: t.bgCream,
      tagLine: t.tagLine,
      description: t.description,
    }));
    setLandingContent((prev: any) => ({
      ...prev,
      heroSubtitle: t.heroSubtitle,
      aboutTitle: t.aboutTitle,
      aboutText: t.aboutText,
      aboutHighlight1: t.aboutHighlights[0],
      aboutHighlight2: t.aboutHighlights[1],
      aboutHighlight3: t.aboutHighlights[2],
    }));
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    try {
      setSaving(true);
      setErrorMsg(null);
      await api.updateWebsiteCustomizer({
        restaurant,
        landingContent,
      });
      setSuccessMsg('Website customization saved successfully!');
      setTimeout(() => setSuccessMsg(null), 3500);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save changes.');
    } finally {
      setSaving(false);
    }
  };

  const handleTogglePublish = async () => {
    try {
      setPublishing(true);
      const res = await api.toggleWebsitePublish();
      setLandingContent((prev: any) => ({ ...prev, isPublished: res.isPublished }));
      setSuccessMsg(
        res.isPublished
          ? 'Website is now LIVE and accessible to all public visitors!'
          : 'Website switched to DRAFT mode (hidden from public visitors).'
      );
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      alert(err.message || 'Failed to toggle publication status.');
    } finally {
      setPublishing(false);
    }
  };

  const links = getOnboardLinks(restaurant.slug || 'roastfuze');
  const previewUrl = `${links.subdomainMenuUrl}?preview=true`;

  if (loading) {
    return (
      <AdminLayout>
        <div className="py-24 text-center text-xs text-stone-400">
          <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <span>Loading visual website studio...</span>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-6xl mx-auto pb-16">
        {/* Header Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-stone-200 pb-5">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900">
                Visual Website Studio
              </h1>
              <span
                className={`text-[11px] font-bold px-3 py-1 rounded-full border ${
                  landingContent.isPublished
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : 'bg-amber-50 text-amber-800 border-amber-200'
                }`}
              >
                {landingContent.isPublished ? '● Website is Live' : '○ Draft Mode'}
              </span>
            </div>
            <p className="text-xs text-stone-500 mt-1">
              Customize your cafe website branding, ambiance templates, colors, sections, and live status without coding
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <a
              href={previewUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl text-xs font-bold transition-colors border border-stone-300"
            >
              <Eye className="w-3.5 h-3.5 text-stone-600" />
              <span>Preview Draft</span>
              <ExternalLink className="w-3 h-3 text-stone-400" />
            </a>

            <button
              type="button"
              onClick={handleTogglePublish}
              disabled={publishing}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-colors border ${
                landingContent.isPublished
                  ? 'bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-300'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-600 shadow-sm'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>{landingContent.isPublished ? 'Unpublish to Draft' : 'Publish Live Now'}</span>
            </button>

            <button
              type="button"
              onClick={() => handleSave()}
              disabled={saving}
              className="inline-flex items-center gap-1.5 px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow transition-colors disabled:opacity-50"
            >
              {saving ? (
                <span>Saving...</span>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Feedback Alerts */}
        {successMsg && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl text-xs font-semibold flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-900 rounded-2xl text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Studio Navigation Tabs */}
        <div className="flex overflow-x-auto gap-2 border-b border-stone-200 pb-2">
          {[
            { id: 'template', label: '1. Ambiance & Concept', icon: Palette },
            { id: 'colors', label: '2. Colors & Visual Grading', icon: Sliders },
            { id: 'layout', label: '3. Photo & Gallery Layout', icon: LayoutGrid },
            { id: 'hero', label: '4. Hero & Banner Studio', icon: Sparkles },
            { id: 'sections', label: '5. Section Visibility', icon: Layers },
            { id: 'contact', label: '6. Contact, Hours & Map', icon: MapPin },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-stone-900 text-white shadow-xs'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab 1: Ambiance & Template */}
        {activeTab === 'template' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-soft space-y-6">
              <div>
                <h2 className="font-serif font-bold text-lg text-stone-900">
                  Select Restaurant Concept Template
                </h2>
                <p className="text-xs text-stone-500 mt-0.5">
                  Changing template adapts the layout, atmosphere narrative, seating spaces, and color palette
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {(Object.keys(THEME_PRESETS) as ThemeTemplateId[]).map((tKey) => {
                  const t = THEME_PRESETS[tKey];
                  const isSelected = restaurant.themeTemplate === tKey;
                  return (
                    <div
                      key={tKey}
                      onClick={() => handleApplyThemePreset(tKey)}
                      className={`cursor-pointer p-5 rounded-2xl border transition-all flex flex-col justify-between ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-50/70 shadow-md ring-2 ring-indigo-500/30'
                          : 'border-stone-200 bg-stone-50/60 hover:bg-stone-100/80 hover:border-stone-300'
                      }`}
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-extrabold text-stone-900 font-serif">
                            {t.label}
                          </span>
                          <div className="flex items-center gap-1.5">
                            <span
                              className="w-3.5 h-3.5 rounded-full border border-black/10 inline-block shadow-xs"
                              style={{ backgroundColor: t.primaryColor }}
                              title="Primary Brand Tone"
                            />
                            <span
                              className="w-3.5 h-3.5 rounded-full border border-black/10 inline-block shadow-xs"
                              style={{ backgroundColor: t.accentColor }}
                              title="Accent Tone"
                            />
                          </div>
                        </div>

                        <span className="text-[11px] font-bold text-indigo-700 bg-indigo-100/70 px-2 py-0.5 rounded-full inline-block">
                          {t.badge}
                        </span>

                        <p className="text-xs text-stone-600 leading-relaxed">
                          {t.description}
                        </p>
                      </div>

                      <div className="mt-4 pt-3 border-t border-stone-200/70 flex items-center justify-between text-xs font-semibold">
                        <span className="text-stone-500 text-[11px] truncate max-w-[150px]">
                          {t.tagLine}
                        </span>
                        {isSelected ? (
                          <span className="text-indigo-700 font-bold flex items-center gap-1">
                            <Check className="w-3.5 h-3.5" /> Active
                          </span>
                        ) : (
                          <span className="text-stone-400 group-hover:text-stone-700">Click to Apply</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="pt-4 border-t border-stone-100 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Restaurant Brand Name
                  </label>
                  <input
                    type="text"
                    value={restaurant.name}
                    onChange={(e) => setRestaurant({ ...restaurant, name: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-stone-200 text-sm focus:ring-2 focus:ring-indigo-500"
                    placeholder="e.g. Parth Garden Cafe"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Brand Tagline / Micro-Headline
                  </label>
                  <input
                    type="text"
                    value={restaurant.tagLine || ''}
                    onChange={(e) => setRestaurant({ ...restaurant, tagLine: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-stone-200 text-sm focus:ring-2 focus:ring-indigo-500"
                    placeholder="e.g. Garden Lawns & Artisanal Fresh Brews"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Colors & Visual Grading */}
        {activeTab === 'colors' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-soft space-y-6">
              <div>
                <h2 className="font-serif font-bold text-lg text-stone-900">Full Website Color Grading Studio</h2>
                <p className="text-xs text-stone-500 mt-0.5">
                  Change the entire website ambiance: Primary buttons, Subtitles, Accent highlights, and Background tone
                </p>
              </div>

              {/* 1-Click Curated Color Palettes */}
              <div className="space-y-3 p-5 rounded-2xl bg-stone-50 border border-stone-200">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
                      <Wand2 className="w-3.5 h-3.5 text-indigo-600" />
                      <span>1-Click Curated Color Palettes (8 Ready-to-Use Themes)</span>
                    </label>
                    <p className="text-[11px] text-stone-500">
                      Click any palette to instantly apply harmonized colors across your entire website
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
                  {COLOR_PALETTES.map((pal) => {
                    const isSelected =
                      restaurant.primaryColor === pal.primary &&
                      restaurant.accentColor === pal.accent &&
                      restaurant.bgCream === pal.bgCream;
                    return (
                      <div
                        key={pal.id}
                        onClick={() => {
                          setRestaurant((prev: any) => ({
                            ...prev,
                            primaryColor: pal.primary,
                            secondaryColor: pal.secondary,
                            accentColor: pal.accent,
                            bgCream: pal.bgCream,
                          }));
                        }}
                        className={`cursor-pointer p-3 rounded-2xl border transition-all flex flex-col justify-between ${
                          isSelected
                            ? 'border-indigo-600 bg-white ring-2 ring-indigo-500 shadow-sm'
                            : 'border-stone-200 bg-white hover:border-stone-300 hover:shadow-xs'
                        }`}
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-stone-900 truncate">{pal.name}</span>
                            {isSelected && <Check className="w-3.5 h-3.5 text-indigo-600 flex-shrink-0" />}
                          </div>

                          {/* Color bar swatch */}
                          <div className="h-6 w-full rounded-lg overflow-hidden flex border border-black/10 shadow-xs">
                            <div className="flex-1" style={{ backgroundColor: pal.primary }} title="Primary" />
                            <div className="flex-1" style={{ backgroundColor: pal.secondary }} title="Secondary" />
                            <div className="flex-1" style={{ backgroundColor: pal.accent }} title="Accent" />
                            <div className="flex-1 border-l border-black/5" style={{ backgroundColor: pal.bgCream }} title="Background" />
                          </div>

                          <p className="text-[10px] text-stone-500 line-clamp-2 leading-tight">{pal.desc}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 4 Interactive Color Pickers */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* 1. Primary Color */}
                <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-stone-800">1. Primary Brand</label>
                    <span
                      className="w-5 h-5 rounded-md border border-black/20 shadow-xs"
                      style={{ backgroundColor: restaurant.primaryColor }}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={restaurant.primaryColor || '#064e3b'}
                      onChange={(e) => setRestaurant({ ...restaurant, primaryColor: e.target.value })}
                      className="w-9 h-9 rounded-xl cursor-pointer border border-stone-300 p-0.5 flex-shrink-0"
                    />
                    <input
                      type="text"
                      value={restaurant.primaryColor || ''}
                      onChange={(e) => setRestaurant({ ...restaurant, primaryColor: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-white rounded-lg border border-stone-200 font-mono text-[11px] uppercase"
                      placeholder="#064E3B"
                    />
                  </div>
                  <p className="text-[10px] text-stone-500">CTA buttons, headers, prominent badges</p>
                </div>

                {/* 2. Secondary Color */}
                <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-stone-800">2. Secondary Tone</label>
                    <span
                      className="w-5 h-5 rounded-md border border-black/20 shadow-xs"
                      style={{ backgroundColor: restaurant.secondaryColor || '#047857' }}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={restaurant.secondaryColor || '#047857'}
                      onChange={(e) => setRestaurant({ ...restaurant, secondaryColor: e.target.value })}
                      className="w-9 h-9 rounded-xl cursor-pointer border border-stone-300 p-0.5 flex-shrink-0"
                    />
                    <input
                      type="text"
                      value={restaurant.secondaryColor || ''}
                      onChange={(e) => setRestaurant({ ...restaurant, secondaryColor: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-white rounded-lg border border-stone-200 font-mono text-[11px] uppercase"
                      placeholder="#047857"
                    />
                  </div>
                  <p className="text-[10px] text-stone-500">Subtitles, section taglines, subtle borders</p>
                </div>

                {/* 3. Accent Highlight Color */}
                <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-stone-800">3. Accent Highlight</label>
                    <span
                      className="w-5 h-5 rounded-md border border-black/20 shadow-xs"
                      style={{ backgroundColor: restaurant.accentColor || '#10b981' }}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={restaurant.accentColor || '#10b981'}
                      onChange={(e) => setRestaurant({ ...restaurant, accentColor: e.target.value })}
                      className="w-9 h-9 rounded-xl cursor-pointer border border-stone-300 p-0.5 flex-shrink-0"
                    />
                    <input
                      type="text"
                      value={restaurant.accentColor || ''}
                      onChange={(e) => setRestaurant({ ...restaurant, accentColor: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-white rounded-lg border border-stone-200 font-mono text-[11px] uppercase"
                      placeholder="#10B981"
                    />
                  </div>
                  <p className="text-[10px] text-stone-500">Bestseller badges, ratings, special chips</p>
                </div>

                {/* 4. Page Background / Cream */}
                <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-stone-800">4. Page Background</label>
                    <span
                      className="w-5 h-5 rounded-md border border-black/20 shadow-xs"
                      style={{ backgroundColor: restaurant.bgCream || '#f0fdf4' }}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={restaurant.bgCream || '#f0fdf4'}
                      onChange={(e) => setRestaurant({ ...restaurant, bgCream: e.target.value })}
                      className="w-9 h-9 rounded-xl cursor-pointer border border-stone-300 p-0.5 flex-shrink-0"
                    />
                    <input
                      type="text"
                      value={restaurant.bgCream || ''}
                      onChange={(e) => setRestaurant({ ...restaurant, bgCream: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-white rounded-lg border border-stone-200 font-mono text-[11px] uppercase"
                      placeholder="#F0FDF4"
                    />
                  </div>
                  <p className="text-[10px] text-stone-500">Overall website canvas, surface tint</p>
                </div>
              </div>

              {/* Live Palette Harmonizer Preview Box */}
              <div
                className="p-6 rounded-2xl border border-stone-200 transition-all duration-300 space-y-3"
                style={{ backgroundColor: restaurant.bgCream || '#f0fdf4' }}
              >
                <div className="flex items-center justify-between">
                  <span
                    className="text-[10px] uppercase font-bold tracking-widest px-2.5 py-1 rounded-full border"
                    style={{
                      color: restaurant.primaryColor || '#064e3b',
                      backgroundColor: `${restaurant.primaryColor || '#064e3b'}15`,
                      borderColor: `${restaurant.primaryColor || '#064e3b'}30`,
                    }}
                  >
                    Live Ambiance Harmonizer
                  </span>
                  <span
                    className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white shadow-xs"
                    style={{ backgroundColor: restaurant.accentColor || '#10b981' }}
                  >
                    ⭐ Bestseller Highlight
                  </span>
                </div>

                <div className="space-y-1">
                  <h3 className="font-serif font-bold text-xl text-stone-900">
                    Experience {restaurant.name || 'Your Cafe'}
                  </h3>
                  <p
                    className="text-xs font-medium"
                    style={{ color: restaurant.secondaryColor || '#047857' }}
                  >
                    {restaurant.tagLine || 'Artisanal roasts, comfortable seating, and curated culinary storytelling'}
                  </p>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    className="px-4 py-2 rounded-xl text-xs font-bold text-white shadow-sm flex items-center gap-1.5"
                    style={{ backgroundColor: restaurant.primaryColor || '#064e3b' }}
                  >
                    <span>Sample Primary CTA Button</span>
                  </button>
                  <span className="text-[11px] text-stone-500 font-mono">
                    Surface Tone: {restaurant.bgCream || '#f0fdf4'}
                  </span>
                </div>
              </div>

              {/* Logo & Cover Image */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-stone-100">
                <ImageUploadField
                  label="Restaurant Logo"
                  value={restaurant.logo || ''}
                  onChange={(url) => setRestaurant({ ...restaurant, logo: url })}
                  placeholder="https://... or upload PNG logo"
                />

                <ImageUploadField
                  label="Cover / Social Share Banner"
                  value={restaurant.coverImage || ''}
                  onChange={(url) => setRestaurant({ ...restaurant, coverImage: url })}
                  placeholder="https://... or upload cafe landscape"
                />
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Photo & Gallery Layout Studio */}
        {activeTab === 'layout' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-soft space-y-6">
              <div>
                <h2 className="font-serif font-bold text-lg text-stone-900">
                  Unique Photo & Gallery Layout Arrangements
                </h2>
                <p className="text-xs text-stone-500 mt-0.5">
                  Give your cafe a completely distinctive visual signature instead of the default layout
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {PHOTO_LAYOUTS.map((layout) => {
                  const isSelected = (restaurant.photoLayout || 'bento') === layout.id;
                  const Icon = layout.icon;
                  return (
                    <div
                      key={layout.id}
                      onClick={() => setRestaurant({ ...restaurant, photoLayout: layout.id })}
                      className={`cursor-pointer rounded-2xl border p-5 transition-all flex flex-col justify-between space-y-4 ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-50/50 ring-2 ring-indigo-500 shadow-sm'
                          : 'border-stone-200 bg-white hover:border-stone-300 hover:shadow-xs'
                      }`}
                    >
                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div
                              className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                                isSelected ? 'bg-indigo-600 text-white' : 'bg-stone-100 text-stone-700'
                              }`}
                            >
                              <Icon className="w-4 h-4" />
                            </div>
                            <div>
                              <strong className="text-xs font-bold text-stone-900 block">{layout.name}</strong>
                              <span className="text-[10px] text-indigo-700 font-semibold">{layout.badge}</span>
                            </div>
                          </div>
                          {isSelected && <Check className="w-4 h-4 text-indigo-600" />}
                        </div>

                        {/* Layout Wireframe Representation */}
                        <div className="h-20 w-full rounded-xl bg-stone-100 p-2 border border-stone-200 flex gap-1.5 items-center justify-center overflow-hidden">
                          {layout.id === 'bento' && (
                            <div className="w-full h-full grid grid-cols-12 gap-1">
                              <div className="col-span-7 bg-stone-300 rounded-md" />
                              <div className="col-span-5 grid grid-rows-2 gap-1">
                                <div className="bg-stone-400 rounded-md" />
                                <div className="bg-stone-300 rounded-md" />
                              </div>
                            </div>
                          )}
                          {layout.id === 'magazine' && (
                            <div className="w-full h-full relative flex items-center justify-center">
                              <div className="w-16 h-14 bg-stone-300 rounded-md border border-white shadow-xs" />
                              <div className="w-12 h-10 bg-stone-400 rounded-md border-2 border-white shadow-md absolute -bottom-1 -right-2 transform rotate-3" />
                            </div>
                          )}
                          {layout.id === 'cinematic' && (
                            <div className="w-full h-full bg-stone-800 rounded-md p-1.5 flex flex-col justify-between">
                              <div className="flex justify-between">
                                <span className="w-2 h-1 bg-white/40 rounded-xs" />
                                <span className="w-2 h-1 bg-white/40 rounded-xs" />
                                <span className="w-2 h-1 bg-white/40 rounded-xs" />
                              </div>
                              <div className="h-6 w-full bg-stone-600 rounded-xs" />
                              <div className="flex justify-between">
                                <span className="w-2 h-1 bg-white/40 rounded-xs" />
                                <span className="w-2 h-1 bg-white/40 rounded-xs" />
                                <span className="w-2 h-1 bg-white/40 rounded-xs" />
                              </div>
                            </div>
                          )}
                          {layout.id === 'split' && (
                            <div className="w-full h-full flex items-center justify-center gap-2">
                              <div className="w-12 h-14 bg-stone-400 rounded-md transform -rotate-6 shadow-xs" />
                              <div className="w-12 h-14 bg-stone-300 rounded-md transform rotate-6 shadow-xs" />
                            </div>
                          )}
                          {layout.id === 'zen' && (
                            <div className="w-full h-full flex items-center justify-center gap-1.5">
                              <div className="w-10 h-10 bg-stone-300 rounded-xs border border-stone-400" />
                              <div className="w-10 h-10 bg-stone-300 rounded-xs border border-stone-400" />
                              <div className="w-10 h-10 bg-stone-300 rounded-xs border border-stone-400" />
                            </div>
                          )}
                        </div>

                        <div className="space-y-1 text-[11px] text-stone-600">
                          <p>
                            <strong>Hero Visual:</strong> {layout.heroDesc}
                          </p>
                          <p>
                            <strong>Seating Spaces:</strong> {layout.spacesDesc}
                          </p>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-[11px]">
                        <span className="font-semibold text-stone-500">
                          {isSelected ? '✓ Currently Selected' : 'Click to Apply'}
                        </span>
                        {isSelected && (
                          <span className="text-indigo-600 font-extrabold text-[10px] uppercase tracking-wider">
                            Active
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Hero & Banner Studio */}
        {activeTab === 'hero' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-soft space-y-6">
              <div>
                <h2 className="font-serif font-bold text-lg text-stone-900">Hero Section & Announcement Strip</h2>
                <p className="text-xs text-stone-500 mt-0.5">
                  Configure the primary above-the-fold narrative, CTA buttons, and top announcements
                </p>
              </div>

              {/* Top Announcement Bar */}
              <div className="p-5 bg-stone-50 rounded-2xl border border-stone-200 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-stone-800">Top Announcement Banner</label>
                  <label className="flex items-center gap-2 text-xs font-bold text-stone-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(landingContent.announcementActive)}
                      onChange={(e) =>
                        setLandingContent({ ...landingContent, announcementActive: e.target.checked })
                      }
                      className="w-4 h-4 text-indigo-600 rounded"
                    />
                    <span>Show on Website</span>
                  </label>
                </div>
                <input
                  type="text"
                  value={landingContent.announcementText || ''}
                  onChange={(e) =>
                    setLandingContent({ ...landingContent, announcementText: e.target.value })
                  }
                  placeholder="e.g. Welcome! Enjoy 10% off your first table order with code WELCOME10"
                  className="w-full px-3.5 py-2.5 bg-white rounded-xl border border-stone-200 text-xs focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Hero Main Headline
                  </label>
                  <input
                    type="text"
                    value={landingContent.heroTitle || ''}
                    onChange={(e) => setLandingContent({ ...landingContent, heroTitle: e.target.value })}
                    placeholder="e.g. Parth Garden Cafe - Garden Lawns & Artisanal Fresh Brews"
                    className="w-full px-4 py-2.5 rounded-xl border border-stone-200 text-sm font-serif font-bold focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Hero Narrative Subtitle
                  </label>
                  <textarea
                    rows={3}
                    value={landingContent.heroSubtitle || ''}
                    onChange={(e) => setLandingContent({ ...landingContent, heroSubtitle: e.target.value })}
                    placeholder="Describe your atmosphere, specialty brews, and culinary highlights..."
                    className="w-full px-4 py-2.5 rounded-xl border border-stone-200 text-xs leading-relaxed focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      Call-to-Action (CTA) Button Text
                    </label>
                    <input
                      type="text"
                      value={landingContent.heroCtaText || 'Explore Digital Menu'}
                      onChange={(e) =>
                        setLandingContent({ ...landingContent, heroCtaText: e.target.value })
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-xs focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <ImageUploadField
                    label="Hero Visual / High-Res Landscape"
                    value={landingContent.heroImage || ''}
                    onChange={(url) => setLandingContent({ ...landingContent, heroImage: url })}
                    placeholder="https://... or upload hero photograph"
                  />
                </div>
              </div>

              {/* Story / About narrative */}
              <div className="pt-4 border-t border-stone-100 space-y-4">
                <h3 className="font-serif font-bold text-sm text-stone-900">
                  Brand Philosophy & Story Highlights
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-stone-600 mb-1">Highlight 1</label>
                    <input
                      type="text"
                      value={landingContent.aboutHighlight1 || ''}
                      onChange={(e) =>
                        setLandingContent({ ...landingContent, aboutHighlight1: e.target.value })
                      }
                      placeholder="e.g. Organic Teas & Kulhad Specials"
                      className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-stone-600 mb-1">Highlight 2</label>
                    <input
                      type="text"
                      value={landingContent.aboutHighlight2 || ''}
                      onChange={(e) =>
                        setLandingContent({ ...landingContent, aboutHighlight2: e.target.value })
                      }
                      placeholder="e.g. Garden & Nature Ambience"
                      className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-stone-600 mb-1">Highlight 3</label>
                    <input
                      type="text"
                      value={landingContent.aboutHighlight3 || ''}
                      onChange={(e) =>
                        setLandingContent({ ...landingContent, aboutHighlight3: e.target.value })
                      }
                      placeholder="e.g. Fresh Wood-Fired Crust Pizzas"
                      className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Section Visibility Toggles */}
        {activeTab === 'sections' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-soft space-y-6">
              <div>
                <h2 className="font-serif font-bold text-lg text-stone-900">Content Sections Visibility</h2>
                <p className="text-xs text-stone-500 mt-0.5">
                  Control which modular blocks appear on your public website
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { key: 'hero', label: '1. Immersive Hero & CTA Banner', desc: 'Main headline, tagline, and instant digital menu CTA', fixed: true },
                  { key: 'conceptStory', label: '2. Ambiance & Brand Concept', desc: 'Narrative storytelling with alternating atmosphere images' },
                  { key: 'spaces', label: '3. Curated Seating Environments', desc: 'Seating zones (Cabana, Lawn, Deck) with capacities and timings' },
                  { key: 'dayEvening', label: '4. Day-to-Evening Lighting Pacing', desc: 'Interactive switcher showcasing daytime calm to evening glow' },
                  { key: 'menuHighlights', label: '5. Featured Signature Bestsellers', desc: 'Interactive category shelves displaying live dishes & prices' },
                  { key: 'occasions', label: '6. Social Occasions & Gatherings', desc: 'Dates, remote work, acoustic nights with WhatsApp reservations' },
                  { key: 'reviews', label: '7. Verified Customer Reviews', desc: 'Star ratings & real guest impressions' },
                  { key: 'locationMap', label: '8. Interactive Map & Contact Details', desc: 'Live embedded Google map with direct driving directions' },
                ].map((s) => {
                  const isEnabled = (sectionToggles as any)[s.key] !== false;
                  return (
                    <div
                      key={s.key}
                      className="p-4 rounded-2xl border border-stone-200 bg-stone-50/60 flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <strong className="text-xs text-stone-900 block truncate">{s.label}</strong>
                        <span className="text-[11px] text-stone-500 block truncate">{s.desc}</span>
                      </div>

                      <button
                        type="button"
                        disabled={s.fixed}
                        onClick={() =>
                          setSectionToggles((prev) => ({
                            ...prev,
                            [s.key]: !(prev as any)[s.key],
                          }))
                        }
                        className={`p-1.5 rounded-xl transition-colors ${
                          isEnabled
                            ? 'text-emerald-700 bg-emerald-100'
                            : 'text-stone-400 bg-stone-200'
                        } ${s.fixed ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
                      >
                        {isEnabled ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Tab 5: Contact, Hours & Map */}
        {activeTab === 'contact' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-soft space-y-6">
              <div>
                <h2 className="font-serif font-bold text-lg text-stone-900">
                  Location, Operating Hours & Social Channels
                </h2>
                <p className="text-xs text-stone-500 mt-0.5">
                  Accurate details visitors need to find, call, and visit your cafe
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Physical Street Address
                  </label>
                  <input
                    type="text"
                    value={restaurant.address || ''}
                    onChange={(e) => setRestaurant({ ...restaurant, address: e.target.value })}
                    placeholder="e.g. A-26, Gandhi Path West, Vaishali Nagar"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-xs focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">City & State</label>
                  <input
                    type="text"
                    value={restaurant.city || ''}
                    onChange={(e) => setRestaurant({ ...restaurant, city: e.target.value })}
                    placeholder="Jaipur, Rajasthan"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-xs focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Phone / Booking Calls
                  </label>
                  <input
                    type="text"
                    value={restaurant.phone || ''}
                    onChange={(e) => setRestaurant({ ...restaurant, phone: e.target.value })}
                    placeholder="+91 95554 95454"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-xs focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    WhatsApp Reservation Number
                  </label>
                  <input
                    type="text"
                    value={restaurant.whatsappNumber || ''}
                    onChange={(e) => setRestaurant({ ...restaurant, whatsappNumber: e.target.value })}
                    placeholder="+91 95554 95454"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-xs focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Daily Operating Hours
                  </label>
                  <input
                    type="text"
                    value={restaurant.openingHours || ''}
                    onChange={(e) => setRestaurant({ ...restaurant, openingHours: e.target.value })}
                    placeholder="10:00 AM – 11:00 PM (Daily)"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-xs focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Google Maps Link or GPS Coordinates
                  </label>
                  <input
                    type="text"
                    value={restaurant.mapLink || ''}
                    onChange={(e) => setRestaurant({ ...restaurant, mapLink: e.target.value })}
                    placeholder="https://maps.google.com/... or 26.9056,75.7271"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-xs focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Instagram Profile URL
                  </label>
                  <input
                    type="text"
                    value={landingContent.instagramUrl || ''}
                    onChange={(e) =>
                      setLandingContent({ ...landingContent, instagramUrl: e.target.value })
                    }
                    placeholder="https://instagram.com/mycafe"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-xs focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Facebook Page URL
                  </label>
                  <input
                    type="text"
                    value={landingContent.facebookUrl || ''}
                    onChange={(e) =>
                      setLandingContent({ ...landingContent, facebookUrl: e.target.value })
                    }
                    placeholder="https://facebook.com/mycafe"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-xs focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Floating Bottom Sticky Bar */}
        <div className="sticky bottom-4 z-40 bg-white/95 backdrop-blur-md p-4 rounded-2xl border border-stone-300 shadow-xl flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs text-stone-600">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                landingContent.isPublished ? 'bg-emerald-500' : 'bg-amber-500'
              }`}
            />
            <span>
              Status: <strong>{landingContent.isPublished ? 'Live & Published' : 'Draft Mode'}</strong>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={previewUrl}
              target="_blank"
              rel="noreferrer"
              className="px-3.5 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-bold transition-colors"
            >
              Preview Draft
            </a>

            <button
              type="button"
              onClick={() => handleSave()}
              disabled={saving}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow transition-colors flex items-center gap-1.5 disabled:opacity-50"
            >
              {saving ? <span>Saving...</span> : <span>Save All Changes</span>}
            </button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};
