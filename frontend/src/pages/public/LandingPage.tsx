import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  UtensilsCrossed,
  MapPin,
  Clock,
  Phone,
  Sparkles,
  ArrowRight,
  Coffee,
  CheckCircle2,
  Star,
  MessageCircle,
  Sun,
  Moon,
  ChevronRight,
  Compass,
  Users,
  Calendar,
  Layers,
  Heart,
  Music,
  ExternalLink,
} from 'lucide-react';
import { Navbar } from '../../components/layout/Navbar';
import { Footer } from '../../components/layout/Footer';
import { api } from '../../services/api';
import { MenuItemCard } from '../../components/menu/MenuItemCard';
import { MenuItem, MenuCategory, Review, GalleryImage, LandingPageContent, Restaurant } from '../../types';
import { buildGoogleMapsEmbedUrl } from '../../utils/mapHelper';
import { useFoodParallax } from '../../hooks/useFoodParallax';
import { getTenantSlug } from '../../utils/tenantHelper';
import { THEME_PRESETS, ThemeTemplateId } from '../../utils/themePresets';

export const LandingPage: React.FC = () => {
  useFoodParallax();
  const [data, setData] = useState<{
    restaurant: Restaurant;
    landingContent: LandingPageContent;
    gallery: GalleryImage[];
    reviews: Review[];
    categories: MenuCategory[];
    bestsellers: MenuItem[];
  } | null>(null);
  const [loading, setLoading] = useState(true);

  // Day to Evening Ambience Switcher
  const [timeMood, setTimeMood] = useState<'day' | 'evening'>('evening');

  // Featured Menu Filter
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('all');

  useEffect(() => {
    async function loadLanding() {
      try {
        const slug = getTenantSlug();
        const res = await api.getLandingPage(slug);
        setData(res);
      } catch (err) {
        console.error('Failed to load landing content:', err);
      } finally {
        setLoading(false);
      }
    }
    loadLanding();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-cream-100 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-2 border-amber-900 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="font-serif text-lg font-bold text-stone-900">RoastFuze Coffee Bar</p>
          <p className="text-xs uppercase tracking-widest text-amber-800">Musical Balcony Cafe • Jaipur</p>
        </div>
      </div>
    );
  }

  const { restaurant, landingContent, gallery, reviews, categories, bestsellers } = data || {};

  const isCustom = restaurant && restaurant.slug && restaurant.slug !== 'roastfuze';
  const currentThemeId = (restaurant?.themeTemplate && restaurant.themeTemplate in THEME_PRESETS
    ? restaurant.themeTemplate
    : 'BALCONY_MUSICAL') as ThemeTemplateId;
  const baseTheme = THEME_PRESETS[currentThemeId];

  // Dynamic theme colors merged from database overrides
  const theme = {
    ...baseTheme,
    primaryColor: restaurant?.primaryColor || baseTheme.primaryColor,
    secondaryColor: restaurant?.secondaryColor || baseTheme.secondaryColor,
    accentColor: restaurant?.accentColor || baseTheme.accentColor,
    bgCream: restaurant?.bgCream || baseTheme.bgCream || '#fdfbf7',
  };

  const photoLayout = (restaurant?.photoLayout || 'bento') as 'bento' | 'magazine' | 'cinematic' | 'split' | 'zen';

  // Dynamic spaces tailored to cafe theme
  const cafeSpaces = isCustom ? theme.spaces : [
    {
      name: 'The Musical Sunset Balcony',
      subtitle: 'Open-Air Balcony Seating',
      atmosphere: 'Breezy sunset vistas over Gandhi Path West, ambient fairy lights, and live acoustic chords',
      bestFor: 'Sunset Dates, Thick Frappes, Live Acoustic Evenings & Relaxed Chats',
      timing: 'Best experienced 04:30 PM – 11:00 PM',
      capacity: '2 – 4 guests per table • Table B01 & Table B02',
      image: '/images/roastfuze_interior.jpg',
      badge: 'Musical Balcony',
    },
    {
      name: 'Acoustic Stage & Artist Corner',
      subtitle: 'Live Jamming & Musical Nook',
      atmosphere: 'Acoustic guitar melodies, artist hours, cozy warm lighting, and soulful live performances',
      bestFor: 'Music Lovers, Artist Hours, Espresso Sips & Musical Gatherings',
      timing: 'Evenings 06:00 PM – 10:30 PM',
      capacity: '4 – 6 guests • Table B02 & Table L05',
      image: '/images/roastfuze_corner.jpg',
      badge: 'Acoustic Corner',
    },
    {
      name: 'The Artisan Coffee Lounge',
      subtitle: 'Warm Wooden Indoor Coffee Bar',
      atmosphere: 'Rich aroma of freshly ground espresso roasts, plush booths & quiet intimacy',
      bestFor: 'Laptop Work, Espresso Tasting, Pizza Feasts & Catch-ups',
      timing: 'Open all day from 10:00 AM – 11:00 PM',
      capacity: '4 – 6 guests • Table L04',
      image: '/images/roastfuze_pasta_neon.jpg',
      badge: 'Indoor Lounge',
    },
    {
      name: 'Balcony High-Top Bar',
      subtitle: 'Elevated Railing Stools',
      atmosphere: 'Front-row balcony breezes overlooking Vaishali Nagar’s vibrant evening pulse',
      bestFor: 'Quick Sips, Ice-Cream Frappes, Solo Reading & Sunset Photography',
      timing: 'Available all hours • Breezy throughout',
      capacity: '2 guests • Table B03',
      image: '/images/roastfuze_shake_sandwich.jpg',
      badge: 'Balcony High-Top',
    },
  ];

  // Filtered menu items for the featured food section
  const filteredBestsellers =
    activeCategoryFilter === 'all'
      ? bestsellers || []
      : (bestsellers || []).filter((item) => {
          const cat = categories?.find((c) => c.id === item.categoryId);
          return cat?.slug === activeCategoryFilter || item.categoryId === activeCategoryFilter;
        });

  return (
    <div
      className="min-h-screen text-stone-800 flex flex-col selection:bg-amber-200"
      style={{ backgroundColor: theme.bgCream || '#fdfbf7' }}
    >
      <Navbar restaurant={restaurant} />

      {/* Optional Top Announcement Strip */}
      {landingContent?.announcementActive && landingContent.announcementText && (
        <div className="bg-stone-950 text-cream-200 text-xs py-2 px-4 text-center font-medium border-b border-stone-800 flex items-center justify-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
          <span>{landingContent.announcementText}</span>
        </div>
      )}

      {/* 1. HERO: Immersive Musical Balcony Hero */}
      <section className="relative pt-12 pb-16 lg:pt-20 lg:pb-24 border-b border-stone-200/70 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            
            {/* Left Editorial Narrative */}
            <div className="lg:col-span-7 space-y-6 text-left">
              <div
                className="inline-flex items-center gap-2.5 px-3.5 py-1 rounded-full text-[11px] font-bold tracking-[0.18em] uppercase border"
                style={{
                  backgroundColor: `${theme.primaryColor}15`,
                  borderColor: `${theme.primaryColor}40`,
                  color: theme.primaryColor,
                }}
              >
                <span>{theme.badge}</span>
                <span>•</span>
                <span>{restaurant?.city || 'Jaipur'} • {restaurant?.tagLine || theme.tagLine}</span>
              </div>

              <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold text-stone-900 leading-[1.12] tracking-tight">
                {landingContent?.heroTitle || (isCustom ? `${restaurant?.name} - ${theme.tagLine}` : 'A Symphony of Roasted Aromas, Golden Sunsets & Live Melodies.')}
              </h1>

              <p className="text-base sm:text-lg text-stone-600 font-normal max-w-xl leading-relaxed">
                {landingContent?.heroSubtitle || (isCustom ? restaurant?.description || theme.heroSubtitle : 'Perched high on Gandhi Path West in Vaishali Nagar, RoastFuze blends the magic of an open-air musical balcony with the craft of an authentic specialty coffee bar. Savor freshly ground espresso roasts, velvety ice-cream frappes, stone-baked pizzas, and Belgian waffles while enjoying acoustic live music under twinkling fairy lights.')}
              </p>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2">
                <Link
                  to="/menu"
                  className="inline-flex items-center justify-center gap-2.5 text-white px-7 py-3.5 rounded-xl font-bold text-sm shadow-soft transition-all duration-200 hover:-translate-y-0.5"
                  style={{ backgroundColor: theme.primaryColor || '#1c1917' }}
                >
                  <UtensilsCrossed className="w-4 h-4 text-amber-300" />
                  <span>Explore Menu</span>
                </Link>

                <a
                  href="#location"
                  className="inline-flex items-center justify-center gap-2 bg-white text-stone-900 border border-stone-300 hover:border-stone-800 px-7 py-3.5 rounded-xl font-bold text-sm shadow-xs transition-all duration-200 hover:bg-stone-50"
                >
                  <Compass className="w-4 h-4 text-stone-700" />
                  <span>Find Location</span>
                </a>
              </div>

              {/* Highlights Micro-list */}
              <div className="pt-4 flex flex-wrap items-center gap-y-2 gap-x-6 text-xs text-stone-600 font-medium border-t border-stone-200/70">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" style={{ color: theme.secondaryColor }} />
                  <span>{landingContent?.aboutHighlight1 || theme.aboutHighlights[0]}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" style={{ color: theme.secondaryColor }} />
                  <span>{landingContent?.aboutHighlight2 || theme.aboutHighlights[1]}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" style={{ color: theme.secondaryColor }} />
                  <span>{landingContent?.aboutHighlight3 || theme.aboutHighlights[2]}</span>
                </div>
              </div>
            </div>

            {/* Right Hero Visuals — Dynamic Layout System */}
            <div className="lg:col-span-5 relative">
              {(() => {
                const heroMainImg =
                  landingContent?.heroImage ||
                  restaurant?.coverImage ||
                  theme.spaces[0]?.image ||
                  'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=1600&q=80';

                if (photoLayout === 'bento') {
                  return (
                    <div className="grid grid-cols-12 gap-3 aspect-[4/3] lg:aspect-[4/5]">
                      <div className="col-span-7 relative rounded-3xl overflow-hidden border border-stone-200 shadow-card bg-stone-100 group">
                        <img
                          src={heroMainImg}
                          alt={restaurant?.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-stone-950/80 via-transparent to-transparent flex flex-col justify-end p-4 text-white">
                          <span className="text-[9px] tracking-widest uppercase font-bold text-amber-400">
                            {restaurant?.city || 'Jaipur'}
                          </span>
                          <p className="font-serif font-bold text-base leading-tight truncate">{restaurant?.name}</p>
                          <p className="text-[10px] text-stone-300 truncate mt-0.5">{restaurant?.tagLine || theme.tagLine}</p>
                        </div>
                      </div>

                      <div className="col-span-5 grid grid-rows-2 gap-3">
                        <div className="relative rounded-2xl overflow-hidden border border-stone-200 shadow-xs bg-stone-100 group">
                          <img
                            src={cafeSpaces[1]?.image || heroMainImg}
                            alt="Ambience"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                          />
                          <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-full text-[9px] font-bold text-white">
                            {cafeSpaces[1]?.badge || 'Lounge'}
                          </div>
                        </div>
                        <div className="relative rounded-2xl overflow-hidden border border-stone-200 shadow-xs bg-stone-100 group">
                          <img
                            src={cafeSpaces[2]?.image || heroMainImg}
                            alt="Specialty"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                          />
                          <div className="absolute bottom-2 left-2 bg-white/90 backdrop-blur-md px-2 py-0.5 rounded-full text-[9px] font-bold text-stone-900">
                            {cafeSpaces[2]?.badge || 'Fresh Brews'}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                }

                if (photoLayout === 'magazine') {
                  return (
                    <div className="relative aspect-[4/3] lg:aspect-[4/5] pb-8 pr-6">
                      <div className="w-[88%] h-[88%] rounded-3xl overflow-hidden border-2 border-stone-800 shadow-xl bg-stone-100 group">
                        <img
                          src={heroMainImg}
                          alt={restaurant?.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                        />
                        <div className="absolute top-4 left-4 bg-stone-900/90 backdrop-blur-md text-white text-[10px] font-serif px-3 py-1 rounded-full uppercase tracking-widest border border-white/20">
                          Signature Concept
                        </div>
                      </div>
                      <div className="absolute bottom-0 right-0 w-[55%] aspect-[4/3] bg-white p-2 rounded-2xl shadow-2xl border border-stone-200 transform rotate-2 hover:rotate-0 transition-transform duration-300">
                        <div className="w-full h-[75%] rounded-xl overflow-hidden bg-stone-100">
                          <img
                            src={cafeSpaces[1]?.image || heroMainImg}
                            alt="Detail"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="p-1 text-center">
                          <span className="font-serif italic text-[11px] font-bold text-stone-900 truncate block">
                            {cafeSpaces[1]?.name || 'Curated Corner'}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                }

                if (photoLayout === 'cinematic') {
                  return (
                    <div className="relative rounded-3xl overflow-hidden border-2 border-stone-900 shadow-2xl bg-black aspect-[4/3] lg:aspect-[4/5] group">
                      <img
                        src={heroMainImg}
                        alt={restaurant?.name}
                        className="w-full h-full object-cover opacity-90 group-hover:scale-105 transition-transform duration-700"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-black/40 flex flex-col justify-between p-6 text-white">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] uppercase font-mono tracking-widest px-2.5 py-1 rounded-full bg-white/20 backdrop-blur-md border border-white/30">
                            🎬 Panoramic View
                          </span>
                          <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-amber-400 text-stone-950">
                            ★ 4.9 Rating
                          </span>
                        </div>
                        <div>
                          <p className="font-serif text-2xl font-bold leading-tight">{restaurant?.name}</p>
                          <p className="text-xs text-stone-300 mt-1">{restaurant?.tagLine || theme.tagLine}</p>
                        </div>
                      </div>
                    </div>
                  );
                }

                if (photoLayout === 'split') {
                  return (
                    <div className="relative aspect-[4/3] lg:aspect-[4/5] flex items-center justify-center">
                      <div className="w-[75%] h-[80%] rounded-3xl overflow-hidden border-2 border-stone-900 shadow-lg transform -rotate-3 hover:-rotate-1 transition-transform duration-300">
                        <img
                          src={heroMainImg}
                          alt={restaurant?.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div
                        className="absolute -bottom-2 -right-2 w-[55%] h-[60%] rounded-2xl overflow-hidden border-2 shadow-2xl transform rotate-6 hover:rotate-3 transition-transform duration-300"
                        style={{ borderColor: theme.accentColor }}
                      >
                        <img
                          src={cafeSpaces[1]?.image || heroMainImg}
                          alt="Space"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute bottom-2 left-2 bg-stone-950/80 px-2 py-0.5 rounded text-[9px] text-white font-bold">
                          {cafeSpaces[1]?.badge || 'Specialty'}
                        </div>
                      </div>
                    </div>
                  );
                }

                // Default / zen layout
                return (
                  <div className="relative aspect-square rounded-2xl overflow-hidden border border-stone-300 shadow-xs bg-white p-3 group">
                    <div className="w-full h-full rounded-xl overflow-hidden bg-stone-100 relative">
                      <img
                        src={heroMainImg}
                        alt={restaurant?.name}
                        className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-700"
                      />
                      <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur-md px-3 py-1 rounded-lg border border-stone-200 text-stone-900 text-xs font-serif font-bold">
                        {restaurant?.name}
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Editorial Floating Tag */}
              <div className="absolute -bottom-5 -left-4 bg-white/95 backdrop-blur-md border border-stone-200 rounded-2xl p-3.5 shadow-soft hidden sm:flex items-center gap-3 max-w-xs z-10">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-white flex-shrink-0"
                  style={{ backgroundColor: theme.primaryColor }}
                >
                  <Coffee className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-serif font-bold text-xs text-stone-900 block leading-tight truncate">
                    {bestsellers?.[0]?.name || 'Specialty Cold Brew'}
                  </span>
                  <span className="text-[10px] text-stone-500">Handcrafted Fresh Daily</span>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Compact Location & Opening-Hours Strip */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-14">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-stone-200 border-y sm:border border-stone-200 bg-white rounded-2xl shadow-xs py-4 px-2 sm:px-4">
            
            <div className="p-3 sm:px-4 flex items-start gap-3">
              <MapPin className="w-4 h-4 text-amber-800 mt-0.5 flex-shrink-0" />
              <div>
                <span className="text-[10px] uppercase tracking-wider font-bold text-stone-400 block">Address</span>
                <span className="text-xs font-semibold text-stone-900 block">A-26 Vivek Vihar, Gandhi Path W</span>
                <span className="text-[11px] text-stone-500">Vaishali Nagar, Jaipur</span>
              </div>
            </div>

            <div className="p-3 sm:px-4 flex items-start gap-3">
              <Clock className="w-4 h-4 text-amber-800 mt-0.5 flex-shrink-0" />
              <div>
                <span className="text-[10px] uppercase tracking-wider font-bold text-stone-400 block">Balcony Timings</span>
                <span className="text-xs font-semibold text-stone-900 block">10:00 AM – 11:00 PM</span>
                <span className="text-[11px] text-stone-500">Live Music Every Evening</span>
              </div>
            </div>

            <div className="p-3 sm:px-4 flex items-start gap-3">
              <Layers className="w-4 h-4 text-amber-800 mt-0.5 flex-shrink-0" />
              <div>
                <span className="text-[10px] uppercase tracking-wider font-bold text-stone-400 block">Environments</span>
                <span className="text-xs font-semibold text-stone-900 block">Musical Balcony & Lounge</span>
                <span className="text-[11px] text-stone-500">Sunset Deck & High-Tops</span>
              </div>
            </div>

            <div className="p-3 sm:px-4 flex items-start gap-3">
              <Phone className="w-4 h-4 text-amber-800 mt-0.5 flex-shrink-0" />
              <div>
                <span className="text-[10px] uppercase tracking-wider font-bold text-stone-400 block">Balcony Desk</span>
                <a href="tel:+919352182562" className="text-xs font-semibold text-stone-900 hover:underline block">
                  +91 93521 82562
                </a>
                <span className="text-[11px] text-stone-500">WhatsApp & Direct Calls</span>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 2. BALCONY EXPERIENCE: Alternating Image & Narrative Layout */}
      <section id="experience" className="py-20 lg:py-28 bg-white border-b border-stone-200/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="max-w-2xl mx-auto text-center mb-16 lg:mb-20">
            <span className="text-xs uppercase tracking-[0.2em] font-bold block mb-2" style={{ color: theme.secondaryColor }}>
              {isCustom ? theme.label : 'The Musical Balcony Concept'}
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-stone-900 tracking-tight leading-tight">
              {isCustom ? theme.aboutTitle : 'Where Specialty Coffee Meets Live Acoustic Chords.'}
            </h2>
            <p className="text-sm sm:text-base text-stone-600 mt-3 leading-relaxed">
              {landingContent?.aboutText || (isCustom ? theme.aboutText : 'We created RoastFuze as an open-air artistic sanctuary. Every balcony table offers sunset skies, ambient evening fairy lights, handcrafted roasts, and soulful acoustic melodies.')}
            </p>
          </div>

          <div className="space-y-20 lg:space-y-28">

            {/* Alternating Block 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center">
              <div className="lg:col-span-7">
                <div className="rounded-3xl overflow-hidden border border-stone-200 aspect-[16/10] shadow-soft group">
                  <img
                    src={isCustom ? (cafeSpaces[0]?.image || '/images/roastfuze_interior.jpg') : '/images/roastfuze_interior.jpg'}
                    alt={isCustom ? cafeSpaces[0]?.name : 'Sunset Balcony Seating'}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                </div>
              </div>
              <div className="lg:col-span-5 space-y-4">
                <span className="text-xs font-bold uppercase tracking-wider block" style={{ color: theme.secondaryColor }}>
                  {isCustom ? `Atmosphere 01 • ${cafeSpaces[0]?.badge}` : 'Experience 01 • Open-Air Balcony'}
                </span>
                <h3 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900 leading-snug">
                  {isCustom ? cafeSpaces[0]?.name : 'Sunset Skies & Fairy-Lit Balcony Railings'}
                </h3>
                <p className="text-sm text-stone-600 leading-relaxed">
                  {isCustom ? cafeSpaces[0]?.atmosphere : 'Catch the golden hour breeze while sipping thick ice-cream frappes or steaming hot cappuccinos. Our musical balcony looks out over the Jaipur skyline, creating an intimate space for dates, friend reunions, and acoustic evenings.'}
                </p>
                <div className="pt-2 space-y-2 text-xs font-medium text-stone-700">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: theme.primaryColor }} />
                    <span>{isCustom ? `Ideal for: ${cafeSpaces[0]?.bestFor}` : 'Open-air balcony seating with Jaipur golden-hour views'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: theme.primaryColor }} />
                    <span>{isCustom ? `Seating capacity: ${cafeSpaces[0]?.capacity}` : 'Warm fairy lights and comfortable intimate seating'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: theme.primaryColor }} />
                    <span>{isCustom ? `Prime hours: ${cafeSpaces[0]?.timing}` : 'Table QR ordering right from your balcony seat'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Alternating Block 2 */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center">
              <div className="lg:col-span-5 order-2 lg:order-1 space-y-4">
                <span className="text-xs font-bold uppercase tracking-wider block" style={{ color: theme.secondaryColor }}>
                  {isCustom ? `Atmosphere 02 • ${cafeSpaces[1]?.badge}` : 'Experience 02 • Acoustic Vibes'}
                </span>
                <h3 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900 leading-snug">
                  {isCustom ? cafeSpaces[1]?.name : 'Live Acoustic Music & Artist Jamming'}
                </h3>
                <p className="text-sm text-stone-600 leading-relaxed">
                  {isCustom ? cafeSpaces[1]?.atmosphere : 'Hosting local musicians, guitarists, and singer-songwriters. Enjoy unplugged acoustic tunes, soulful melodies, and vibrant artist hours while indulging in stone-baked pizzas and warm Belgian waffles.'}
                </p>
                <div className="pt-2 space-y-2 text-xs font-medium text-stone-700">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: theme.primaryColor }} />
                    <span>{isCustom ? `Ideal for: ${cafeSpaces[1]?.bestFor}` : 'Live acoustic jamming sessions every evening'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: theme.primaryColor }} />
                    <span>{isCustom ? `Seating: ${cafeSpaces[1]?.capacity}` : 'A platform for local artists, musicians & creatives'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: theme.primaryColor }} />
                    <span>{isCustom ? `Hours: ${cafeSpaces[1]?.timing}` : 'Cozy soulful atmosphere that stays with you'}</span>
                  </div>
                </div>
              </div>
              <div className="lg:col-span-7 order-1 lg:order-2">
                <div className="rounded-3xl overflow-hidden border border-stone-200 aspect-[16/10] shadow-soft group">
                  <img
                    src={isCustom ? (cafeSpaces[1]?.image || '/images/roastfuze_pasta_neon.jpg') : '/images/roastfuze_pasta_neon.jpg'}
                    alt={isCustom ? cafeSpaces[1]?.name : 'Acoustic Artist Hours'}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                </div>
              </div>
            </div>

            {/* Alternating Block 3 */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center">
              <div className="lg:col-span-7">
                <div className="rounded-3xl overflow-hidden border border-stone-200 aspect-[16/10] shadow-soft group">
                  <img
                    src={isCustom ? (cafeSpaces[2]?.image || '/images/roastfuze_coffee_cup.png') : '/images/roastfuze_coffee_cup.png'}
                    alt={isCustom ? cafeSpaces[2]?.name : 'Signature Brews & Craft'}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                </div>
              </div>
              <div className="lg:col-span-5 space-y-4">
                <span className="text-xs font-bold uppercase tracking-wider block" style={{ color: theme.secondaryColor }}>
                  {isCustom ? `Atmosphere 03 • ${cafeSpaces[2]?.badge}` : 'Experience 03 • Artisan Coffee Craft'}
                </span>
                <h3 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900 leading-snug">
                  {isCustom ? cafeSpaces[2]?.name : 'Artisan Espresso Roasts & Thick Frappes'}
                </h3>
                <p className="text-sm text-stone-600 leading-relaxed">
                  {isCustom ? cafeSpaces[2]?.atmosphere : 'From bold double-shot Americanos and silky flat whites to thick ice-cream blended Oreo, Hazelnut, and Biscoff frappes, every cup is crafted with precision by baristas who genuinely care about coffee.'}
                </p>
                <div className="pt-2 space-y-2 text-xs font-medium text-stone-700">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: theme.primaryColor }} />
                    <span>{isCustom ? `Ideal for: ${cafeSpaces[2]?.bestFor}` : 'Specialty roasted coffee beans ground fresh per order'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: theme.primaryColor }} />
                    <span>{isCustom ? `Capacity: ${cafeSpaces[2]?.capacity}` : 'Rich frappes blended with premium gourmet ice creams'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: theme.primaryColor }} />
                    <span>{isCustom ? `Recommended hours: ${cafeSpaces[2]?.timing}` : 'Plant-based oat & almond milk choices available'}</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 3. PHOTO COMPOSITION: Atmosphere Gallery */}
      <section className="py-20 lg:py-28 border-b border-stone-200/70" style={{ backgroundColor: theme.bgCream }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 lg:mb-16">
            <div className="max-w-xl">
              <span className="text-xs uppercase tracking-[0.2em] font-bold block mb-2" style={{ color: theme.secondaryColor }}>
                Atmosphere & Perspectives
              </span>
              <h2 className="font-serif text-3xl sm:text-4xl font-bold text-stone-900 tracking-tight">
                {isCustom ? `Moments at ${restaurant?.name}` : 'Moments at RoastFuze'}
              </h2>
              <p className="text-sm text-stone-600 mt-2">
                {isCustom ? `A glimpse into our serene ambience, artisan beverages, and culinary moments.` : 'A glimpse into sunset balcony views, thick frappes, stone-baked pizzas, and live musical sessions.'}
              </p>
            </div>
            <Link
              to="/menu"
              className="mt-4 md:mt-0 inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider hover:underline"
              style={{ color: theme.primaryColor }}
            >
              <span>Explore Digital Menu</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Asymmetrical Editorial Composition */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Anchoring Landscape Photograph */}
            <div className="lg:col-span-8 space-y-3">
              <div className="rounded-3xl overflow-hidden border border-stone-200/90 shadow-soft aspect-[16/10] bg-stone-200 group">
                <img
                  src={gallery?.[0]?.imageUrl || (isCustom ? cafeSpaces[0]?.image : '/images/dishes/cafe_balcony_hd.jpg')}
                  alt={`${restaurant?.name} Atmosphere`}
                  className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-700"
                />
              </div>
              <div className="flex items-center justify-between text-xs text-stone-500 px-1">
                <span className="font-serif italic text-stone-800 text-sm">{isCustom ? cafeSpaces[0]?.name : 'The Warm Coffee Lounge & Musical Balcony'}</span>
                <span className="font-mono text-[11px]">{restaurant?.name} • {restaurant?.city || 'Jaipur'}</span>
              </div>
            </div>

            {/* Smaller Supporting Photographs */}
            <div className="lg:col-span-4 space-y-8">
              
              <div className="space-y-2.5">
                <div className="rounded-2xl overflow-hidden border border-stone-200/90 shadow-xs aspect-[4/3] bg-stone-200 group">
                  <img
                    src={gallery?.[1]?.imageUrl || (isCustom ? cafeSpaces[1]?.image : '/images/dishes/oreo_frappe.jpg')}
                    alt={isCustom ? cafeSpaces[1]?.name : 'Signature Oreo Overload Cold Frappe'}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <div className="text-[11px] text-stone-500 px-1">
                  <strong className="text-stone-800 block text-xs">{isCustom ? cafeSpaces[1]?.name : 'Signature Oreo Overload Cold Frappe'}</strong>
                  <span>{isCustom ? cafeSpaces[1]?.atmosphere : 'Whipped with dark chocolate cookies, double espresso, and creamy ice cream.'}</span>
                </div>
              </div>

              <div className="space-y-2.5">
                <div className="rounded-2xl overflow-hidden border border-stone-200/90 shadow-xs aspect-[4/3] bg-stone-200 group">
                  <img
                    src={gallery?.[2]?.imageUrl || (isCustom ? cafeSpaces[2]?.image : '/images/dishes/sandwich_fries.jpg')}
                    alt={isCustom ? cafeSpaces[2]?.name : 'Triple-Decker Grilled Sandwich & Golden French Fries'}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <div className="text-[11px] text-stone-500 px-1">
                  <strong className="text-stone-800 block text-xs">{isCustom ? cafeSpaces[2]?.name : 'Triple-Decker Grilled Sandwich & Fries'}</strong>
                  <span>{isCustom ? cafeSpaces[2]?.atmosphere : 'Golden grilled jumbo sandwich with spiced fillings and crisp fries.'}</span>
                </div>
              </div>

            </div>

          </div>
        </div>
      </section>

      {/* 4. THE SPACES: Verified Seating Zones */}
      <section id="spaces" className="py-20 lg:py-28 bg-white border-b border-stone-200/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="max-w-2xl mx-auto text-center mb-16">
            <span className="text-xs uppercase tracking-[0.2em] font-bold block mb-2" style={{ color: theme.secondaryColor }}>
              Seating Environments
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-stone-900 tracking-tight">
              {isCustom ? 'Explore Our Curated Spaces' : 'Choose Your Balcony Corner.'}
            </h2>
            <p className="text-sm sm:text-base text-stone-600 mt-3 leading-relaxed">
              {isCustom ? `Every table at ${restaurant?.name} is configured with a digital QR code for instantaneous ordering directly to our kitchen.` : 'Every table at RoastFuze is configured with a digital QR code for instantaneous ordering directly to our kitchen and barista bar.'}
            </p>
          </div>

          {/* Dynamic Spaces Presentation According to photoLayout */}
          {(() => {
            // 1. Bento Asymmetrical Grid Layout
            if (photoLayout === 'bento') {
              return (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {cafeSpaces.map((space, idx) => {
                    const isFeature = idx === 0;
                    return (
                      <div
                        key={space.name || idx}
                        className={`bg-cream-50 rounded-3xl border border-stone-200/80 overflow-hidden shadow-xs hover:shadow-card transition-all duration-300 flex flex-col justify-between group ${
                          isFeature ? 'md:col-span-2' : ''
                        }`}
                      >
                        <div>
                          <div className={`relative ${isFeature ? 'aspect-[21/10]' : 'aspect-[16/11]'} bg-stone-100 overflow-hidden`}>
                            <img
                              src={space.image}
                              alt={space.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                            <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider text-stone-950 border border-stone-200 shadow-xs">
                              {space.badge}
                            </div>
                            {isFeature && (
                              <div className="absolute bottom-3 right-3 bg-stone-900/80 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold text-amber-300">
                                ⭐ Signature Seating
                              </div>
                            )}
                          </div>

                          <div className="p-6 space-y-3">
                            <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
                              <div>
                                <h3 className="font-serif text-xl font-bold text-stone-900 leading-tight">
                                  {space.name}
                                </h3>
                                <span className="text-xs font-semibold block mt-0.5" style={{ color: theme.secondaryColor }}>
                                  {space.subtitle}
                                </span>
                              </div>
                              <span className="text-xs font-mono font-bold text-stone-600 bg-white px-2.5 py-1 rounded-lg border border-stone-200">
                                {space.timing}
                              </span>
                            </div>

                            <p className="text-xs text-stone-600 leading-relaxed">{space.atmosphere}</p>

                            <div className="pt-3 border-t border-stone-200/70 flex flex-wrap gap-4 text-[11px] text-stone-600">
                              <div>
                                <strong className="text-stone-800 font-semibold">Ideal For: </strong>
                                <span>{space.bestFor}</span>
                              </div>
                              <div>
                                <strong className="text-stone-800 font-semibold">Capacity: </strong>
                                <span>{space.capacity}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="p-6 pt-0">
                          <Link
                            to="/menu"
                            className="w-full inline-flex items-center justify-center gap-1.5 bg-white hover:bg-stone-100 border border-stone-300 text-stone-800 py-2.5 rounded-xl text-xs font-bold transition-colors"
                          >
                            <span>View Menu For This Space</span>
                            <ChevronRight className="w-3.5 h-3.5 text-stone-500" />
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            }

            // 2. Editorial Magazine Staggered Portrait Cards
            if (photoLayout === 'magazine') {
              return (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {cafeSpaces.map((space, idx) => (
                    <div
                      key={space.name || idx}
                      className="bg-white rounded-2xl border-2 border-stone-800 overflow-hidden shadow-lg flex flex-col justify-between group transform hover:-translate-y-1 transition-all duration-300"
                    >
                      <div>
                        <div className="relative aspect-[3/4] bg-stone-100 overflow-hidden border-b-2 border-stone-800">
                          <img
                            src={space.image}
                            alt={space.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                          />
                          <div className="absolute top-3 left-3 bg-stone-900 text-white font-serif italic text-xs px-2.5 py-1 rounded-md shadow-sm">
                            0{idx + 1}
                          </div>
                          <div className="absolute bottom-3 left-3 right-3 bg-stone-950/80 backdrop-blur-md p-2.5 rounded-xl text-white">
                            <span className="text-[10px] tracking-widest uppercase font-mono text-amber-300 block">
                              {space.badge}
                            </span>
                            <strong className="font-serif text-sm block leading-tight">{space.name}</strong>
                          </div>
                        </div>

                        <div className="p-5 space-y-2">
                          <p className="text-xs text-stone-600 line-clamp-3 leading-relaxed">{space.atmosphere}</p>
                          <div className="pt-2 text-[10px] text-stone-500 font-mono space-y-0.5">
                            <p>Capacity: {space.capacity}</p>
                            <p className="text-indigo-800 font-bold">{space.timing}</p>
                          </div>
                        </div>
                      </div>

                      <div className="p-5 pt-0">
                        <Link
                          to="/menu"
                          className="w-full inline-flex items-center justify-center gap-1.5 text-white py-2.5 rounded-xl text-xs font-bold shadow transition-colors"
                          style={{ backgroundColor: theme.primaryColor }}
                        >
                          <span>Reserve Space</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              );
            }

            // 3. Cinematic Horizontal Filmstrip Carousel
            if (photoLayout === 'cinematic') {
              return (
                <div className="overflow-x-auto flex gap-6 pb-6 pt-2 snap-x scrollbar-thin">
                  {cafeSpaces.map((space, idx) => (
                    <div
                      key={space.name || idx}
                      className="min-w-[320px] sm:min-w-[420px] bg-stone-900 text-white rounded-3xl overflow-hidden shadow-2xl snap-start flex flex-col justify-between group border border-stone-800 flex-shrink-0"
                    >
                      <div className="relative aspect-[16/10] overflow-hidden">
                        <img
                          src={space.image}
                          alt={space.name}
                          className="w-full h-full object-cover opacity-85 group-hover:scale-105 transition-transform duration-700"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-transparent to-black/40 flex flex-col justify-between p-4">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] uppercase font-mono tracking-widest px-2.5 py-1 rounded-full bg-white/20 backdrop-blur-md">
                              {space.badge}
                            </span>
                            <span className="text-[10px] font-bold text-amber-400">★ High Comfort</span>
                          </div>
                          <div>
                            <h3 className="font-serif text-xl font-bold">{space.name}</h3>
                            <p className="text-xs text-stone-300 mt-0.5">{space.subtitle}</p>
                          </div>
                        </div>
                      </div>

                      <div className="p-5 space-y-3 bg-stone-950">
                        <p className="text-xs text-stone-400 leading-relaxed">{space.atmosphere}</p>
                        <div className="flex items-center justify-between pt-2 border-t border-stone-800 text-[11px] text-stone-400">
                          <span>{space.capacity}</span>
                          <span className="text-amber-400 font-bold">{space.timing}</span>
                        </div>
                        <Link
                          to="/menu"
                          className="w-full inline-flex items-center justify-center gap-1.5 bg-white hover:bg-stone-200 text-stone-950 py-2.5 rounded-xl text-xs font-bold transition-colors mt-2"
                        >
                          <span>Explore Menu</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              );
            }

            // 4. Dynamic Split-Screen Alternating Rows
            if (photoLayout === 'split') {
              return (
                <div className="space-y-6">
                  {cafeSpaces.map((space, idx) => {
                    const isEven = idx % 2 === 0;
                    return (
                      <div
                        key={space.name || idx}
                        className="bg-white rounded-3xl border border-stone-200 overflow-hidden shadow-soft grid grid-cols-1 md:grid-cols-12 items-center group"
                      >
                        <div className={`md:col-span-6 relative aspect-[16/10] overflow-hidden ${isEven ? 'order-1' : 'order-1 md:order-2'}`}>
                          <img
                            src={space.image}
                            alt={space.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                          />
                          <div className="absolute top-3 left-3 bg-stone-950/85 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider text-white">
                            {space.badge}
                          </div>
                        </div>

                        <div className={`md:col-span-6 p-6 sm:p-10 space-y-4 ${isEven ? 'order-2' : 'order-2 md:order-1'}`}>
                          <div>
                            <span className="text-xs uppercase font-mono tracking-widest font-bold" style={{ color: theme.secondaryColor }}>
                              Space 0{idx + 1}
                            </span>
                            <h3 className="font-serif text-2xl font-bold text-stone-900 mt-1">{space.name}</h3>
                            <p className="text-xs text-stone-500 font-semibold">{space.subtitle}</p>
                          </div>

                          <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">{space.atmosphere}</p>

                          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-stone-100 text-xs text-stone-600">
                            <div>
                              <strong className="block text-stone-900">Capacity:</strong>
                              <span>{space.capacity}</span>
                            </div>
                            <div>
                              <strong className="block text-stone-900">Best Timing:</strong>
                              <span style={{ color: theme.primaryColor }} className="font-bold">{space.timing}</span>
                            </div>
                          </div>

                          <Link
                            to="/menu"
                            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-bold text-white shadow transition-colors"
                            style={{ backgroundColor: theme.primaryColor }}
                          >
                            <span>Browse Digital Menu</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            }

            // 5. Minimalist Japanese Zen Layout (Square Balanced Grid)
            return (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {cafeSpaces.map((space, idx) => (
                  <div
                    key={space.name || idx}
                    className="bg-white rounded-2xl border border-stone-300 overflow-hidden shadow-xs p-3 space-y-3 group"
                  >
                    <div className="relative aspect-square rounded-xl bg-stone-100 overflow-hidden">
                      <img
                        src={space.image}
                        alt={space.name}
                        className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500"
                      />
                      <div className="absolute top-2 left-2 bg-white/95 px-2 py-0.5 rounded text-[9px] font-mono uppercase text-stone-800 border border-stone-200">
                        {space.badge}
                      </div>
                    </div>

                    <div className="space-y-1.5 p-1">
                      <h3 className="font-serif text-base font-bold text-stone-900 truncate">{space.name}</h3>
                      <p className="text-[11px] text-stone-500 line-clamp-2 leading-relaxed">{space.atmosphere}</p>
                      <div className="pt-2 text-[10px] text-stone-400 font-mono flex items-center justify-between">
                        <span>{space.capacity}</span>
                        <span className="text-stone-800 font-bold">{space.timing}</span>
                      </div>
                    </div>

                    <Link
                      to="/menu"
                      className="w-full inline-flex items-center justify-center gap-1 bg-stone-50 hover:bg-stone-100 border border-stone-200 text-stone-800 py-2 rounded-lg text-[11px] font-bold transition-colors"
                    >
                      <span>Explore</span>
                      <ChevronRight className="w-3 h-3 text-stone-400" />
                    </Link>
                  </div>
                ))}
              </div>
            );
          })()}

        </div>
      </section>

      {/* 5. DAY-TO-EVENING STORYTELLING */}
      <section className="py-20 lg:py-28 border-b border-stone-200/70" style={{ backgroundColor: theme.bgCream }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="max-w-3xl mx-auto text-center mb-12">
            <span className="text-xs uppercase tracking-[0.2em] font-bold block mb-2" style={{ color: theme.secondaryColor }}>
              Atmospheric Pacing
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-stone-900 tracking-tight">
              {isCustom ? 'Daytime Serenity to Evening Glow' : 'Daytime Sips to Evening Acoustic Glow'}
            </h2>
            <p className="text-sm text-stone-600 mt-2">
              {isCustom ? `Experience the unique charm of ${restaurant?.name} — bright daytime calm and enchanting evening ambiance.` : 'Experience the dual charm of RoastFuze — bright daytime coffee lounge and intimate musical balcony by night.'}
            </p>

            {/* Interactive Mode Switcher */}
            <div className="inline-flex items-center p-1.5 bg-white border border-stone-300 rounded-full shadow-xs mt-6">
              <button
                type="button"
                onClick={() => setTimeMood('day')}
                className={`inline-flex items-center gap-2 px-5 py-2 rounded-full text-xs font-bold transition-all ${
                  timeMood === 'day'
                    ? 'text-white shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
                style={timeMood === 'day' ? { backgroundColor: theme.primaryColor } : {}}
              >
                <Sun className="w-3.5 h-3.5 text-amber-400" />
                <span>Daytime Ambience</span>
              </button>

              <button
                type="button"
                onClick={() => setTimeMood('evening')}
                className={`inline-flex items-center gap-2 px-5 py-2 rounded-full text-xs font-bold transition-all ${
                  timeMood === 'evening'
                    ? 'bg-stone-950 text-white shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <Moon className="w-3.5 h-3.5 text-amber-300" />
                <span>Evening Glow</span>
              </button>
            </div>
          </div>

          {/* Smooth Ambience Presentation Card */}
          <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-10 shadow-soft overflow-hidden transition-all duration-500">
            {timeMood === 'day' ? (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center animate-in fade-in duration-300">
                <div className="lg:col-span-7">
                  <div className="rounded-2xl overflow-hidden aspect-[16/10] border border-stone-200 bg-stone-100 shadow-xs">
                    <img
                      src={isCustom ? (cafeSpaces[2]?.image || cafeSpaces[0]?.image) : '/images/roastfuze_coffee_cup.png'}
                      alt={`Daytime Ambience at ${restaurant?.name}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>

                <div className="lg:col-span-5 space-y-4 text-left">
                  <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full border" style={{ backgroundColor: `${theme.primaryColor}15`, borderColor: `${theme.primaryColor}30`, color: theme.primaryColor }}>
                    <Sun className="w-3.5 h-3.5" />
                    <span>10:00 AM – 04:30 PM • Sunlight & Calm</span>
                  </div>

                  <h3 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900 leading-snug">
                    Natural Light, Fresh Brews & Unrushed Calm
                  </h3>

                  <p className="text-sm text-stone-600 leading-relaxed">
                    {isCustom ? `Mornings at ${restaurant?.name} are relaxed and tranquil. Crisp sunlight fills our seating areas while our baristas brew freshly roasted coffee and teas. Ideal for focused work, intimate chats, or peaceful morning meetings.` : 'Mornings at RoastFuze are relaxed and tranquil. Crisp sunlight enters the lounge while our espresso machine hums with fresh roasts. Ideal for focused laptop work, coffee tastings, or peaceful brunch meetings.'}
                  </p>

                  <div className="pt-2 border-t border-stone-100">
                    <span className="text-[11px] uppercase tracking-wider font-bold text-stone-400 block mb-2">
                      Daytime Experience:
                    </span>
                    <div className="flex flex-wrap gap-2">
                      <span className="bg-stone-100 border border-stone-200 text-stone-800 text-xs px-3 py-1 rounded-full font-medium">
                        Artisan Fresh Brews
                      </span>
                      <span className="bg-stone-100 border border-stone-200 text-stone-800 text-xs px-3 py-1 rounded-full font-medium">
                        Quiet Work Friendly
                      </span>
                      <span className="bg-stone-100 border border-stone-200 text-stone-800 text-xs px-3 py-1 rounded-full font-medium">
                        Handcrafted Delights
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center animate-in fade-in duration-300">
                <div className="lg:col-span-7">
                  <div className="rounded-2xl overflow-hidden aspect-[16/10] border border-stone-200 bg-stone-900 shadow-xs">
                    <img
                      src={isCustom ? (cafeSpaces[1]?.image || cafeSpaces[0]?.image) : '/images/roastfuze_pasta_neon.jpg'}
                      alt={`Evening Glow at ${restaurant?.name}`}
                      className="w-full h-full object-cover opacity-95"
                    />
                  </div>
                </div>

                <div className="lg:col-span-5 space-y-4 text-left">
                  <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full border border-amber-800/20 bg-amber-50 text-amber-900">
                    <Moon className="w-3.5 h-3.5 text-amber-700" />
                    <span>05:30 PM – 11:00 PM • Ambient Evening Lights</span>
                  </div>

                  <h3 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900 leading-snug">
                    Golden Sunset Glow, Ambient Music & Fresh Slices
                  </h3>

                  <p className="text-sm text-stone-600 leading-relaxed">
                    {isCustom ? `When twilight arrives, ${restaurant?.name} comes alive with warm glowing lights, soothing background tunes, and guests savoring fresh artisanal food and beverages.` : 'When the sunset dips beneath Vaishali Nagar, the musical balcony ignites. Fairy lights twinkle, acoustic guitar strings ring out, and guests savor hot Cheesy Margherita pizzas, Alfredo pasta, and thick double choco-chip frappes.'}
                  </p>

                  <div className="pt-2 border-t border-stone-100">
                    <span className="text-[11px] uppercase tracking-wider font-bold text-stone-400 block mb-2">
                      Evening Highlights:
                    </span>
                    <div className="flex flex-wrap gap-2">
                      <span className="bg-stone-100 border border-stone-200 text-stone-800 text-xs px-3 py-1 rounded-full font-medium">
                        Warm Ambient Lights
                      </span>
                      <span className="bg-stone-100 border border-stone-200 text-stone-800 text-xs px-3 py-1 rounded-full font-medium">
                        Stone-Baked Slices
                      </span>
                      <span className="bg-stone-100 border border-stone-200 text-stone-800 text-xs px-3 py-1 rounded-full font-medium">
                        Chilled Beverages
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

        </div>
      </section>

      {/* 6. FOOD AND DRINKS: Featured Menu */}
      <section className="py-20 lg:py-28 bg-white border-b border-stone-200/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 pb-6 border-b border-stone-200">
            <div>
              <span className="text-xs uppercase tracking-[0.2em] font-bold text-amber-800 block mb-2">
                Crafted Offerings
              </span>
              <h2 className="font-serif text-3xl sm:text-4xl font-bold text-stone-900 tracking-tight">
                Specialty Menu on the Balcony
              </h2>
              <p className="text-sm text-stone-600 mt-2">
                Artisan roasts, thick frappes, crisp waffles, stone-baked pizzas, and savory pasta cooked fresh to order.
              </p>
            </div>

            <Link
              to="/menu"
              className="mt-4 md:mt-0 inline-flex items-center gap-2 bg-stone-900 text-white hover:bg-stone-800 px-6 py-3 rounded-xl text-xs uppercase tracking-wider font-bold shadow-soft transition-all"
            >
              <span>View Full Digital Menu</span>
              <ArrowRight className="w-4 h-4 text-amber-300" />
            </Link>
          </div>

          {/* Category Filter Shelf */}
          {categories && categories.length > 0 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-8 scrollbar-none">
              <button
                type="button"
                onClick={() => setActiveCategoryFilter('all')}
                className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all ${
                  activeCategoryFilter === 'all'
                    ? 'bg-stone-900 text-white shadow-xs'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                All Bestsellers
              </button>

              {categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setActiveCategoryFilter(cat.slug || cat.id)}
                  className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all ${
                    activeCategoryFilter === (cat.slug || cat.id)
                      ? 'bg-stone-900 text-white shadow-xs'
                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          )}

          {/* Featured Item Shelf */}
          {filteredBestsellers && filteredBestsellers.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {filteredBestsellers.slice(0, 8).map((item) => (
                <MenuItemCard key={item.id} item={item} />
              ))}
            </div>
          ) : (
            <div className="py-12 text-center text-xs text-stone-400">
              No dishes found under this category. Visit full menu.
            </div>
          )}

          {/* Editorial Highlight: Signature Craft */}
          <div className="mt-16 rounded-3xl border border-stone-200 p-8 sm:p-10" style={{ backgroundColor: theme.bgCream }}>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-4 rounded-2xl overflow-hidden aspect-[4/3] border border-stone-200 shadow-xs">
                <img
                  src={isCustom ? (cafeSpaces[1]?.image || cafeSpaces[0]?.image) : '/images/roastfuze_coffee_cup.png'}
                  alt={isCustom ? `${restaurant?.name} Signature Craft` : 'Thick Ice Cream Frappes at RoastFuze'}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="lg:col-span-8 space-y-3 text-left">
                <span className="text-[11px] uppercase tracking-wider font-bold block" style={{ color: theme.secondaryColor }}>
                  {isCustom ? `The ${restaurant?.name} Philosophy` : 'The RoastFuze Frappe Philosophy'}
                </span>
                <h3 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900">
                  {isCustom ? 'Crafted with Freshness, Passion & Pure Ingredients' : 'Thick, Velvety & Blended with Premium Ice Cream'}
                </h3>
                <p className="text-sm text-stone-600 leading-relaxed">
                  {isCustom ? `At ${restaurant?.name}, we believe every visit should be an experience. From sourcing quality ingredients to handcrafting each dish and beverage fresh to order, our commitment is unmatched taste and warm hospitality.` : 'Unlike watered-down cold coffees, every RoastFuze frappe is slow-whipped with scoops of real dairy ice cream, crushed ice crystals, and double-pulled espresso shots. Whether you choose Crunchy Oreo, Double Choco Chip, or Belgian Biscoff, it\'s a dessert in a glass.'}
                </p>
                <div className="pt-2 flex flex-wrap items-center gap-6 text-xs text-stone-700 font-semibold">
                  <span>• Handcrafted Fresh Per Order</span>
                  <span>• Pure Quality Ingredients</span>
                  <span>• Warm Welcoming Hospitality</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* 7. SOCIAL OCCASIONS */}
      <section className="py-20 lg:py-28 border-b border-stone-200/70" style={{ backgroundColor: theme.bgCream }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="max-w-2xl mx-auto text-center mb-16">
            <span className="text-xs uppercase tracking-[0.2em] font-bold block mb-2" style={{ color: theme.secondaryColor }}>
              Shared Occasions
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-stone-900 tracking-tight">
              {isCustom ? `Moments at ${restaurant?.name}` : 'Moments on the Balcony.'}
            </h2>
            <p className="text-sm sm:text-base text-stone-600 mt-3 leading-relaxed">
              {isCustom ? `From lively group catch-ups with friends to focused daytime laptop hours or relaxing evening dates.` : 'From lively acoustic jamming nights with friends to focused daytime laptop hours or sunset coffee dates.'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Occasion 1 */}
            <div className="bg-white p-8 rounded-3xl border border-stone-200/80 shadow-soft space-y-4 text-left flex flex-col justify-between">
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ backgroundColor: `${theme.primaryColor}15`, color: theme.primaryColor }}>
                  <Heart className="w-6 h-6" />
                </div>
                <h3 className="font-serif text-xl font-bold text-stone-900">
                  {isCustom ? 'Relaxed Dates & Unhurried Catch-ups' : 'Sunset Dates & Unhurried Catch-ups'}
                </h3>
                <p className="text-xs text-stone-600 leading-relaxed">
                  {isCustom ? 'No rushing, no noise. Take a comfortable seat, enjoy the ambiance, and chat over fresh artisanal beverages and hot comfort food.' : 'No rushing, no noise. Take a seat by the balcony railing, enjoy the breeze, and chat over thick frappes and hot Belgian waffles under golden twilight.'}
                </p>
              </div>
              <span className="text-[11px] font-bold block pt-4 border-t border-stone-100" style={{ color: theme.secondaryColor }}>
                Walk-ins always welcome across all tables.
              </span>
            </div>

            {/* Occasion 2 */}
            <div className="bg-white p-8 rounded-3xl border border-stone-200/80 shadow-soft space-y-4 text-left flex flex-col justify-between">
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ backgroundColor: `${theme.primaryColor}15`, color: theme.primaryColor }}>
                  <Coffee className="w-6 h-6" />
                </div>
                <h3 className="font-serif text-xl font-bold text-stone-900">
                  Daytime Focus & Laptop Hours
                </h3>
                <p className="text-xs text-stone-600 leading-relaxed">
                  Clean air, rich espresso cups, delicious bites, and calm surroundings to fuel your productive morning or afternoon working hours.
                </p>
              </div>
              <span className="text-[11px] font-bold block pt-4 border-t border-stone-100" style={{ color: theme.secondaryColor }}>
                High-speed WiFi & serene environment.
              </span>
            </div>

            {/* Occasion 3 */}
            <div className="bg-white p-8 rounded-3xl border border-stone-200/80 shadow-soft space-y-4 text-left flex flex-col justify-between">
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ backgroundColor: `${theme.primaryColor}15`, color: theme.primaryColor }}>
                  <Music className="w-6 h-6" />
                </div>
                <h3 className="font-serif text-xl font-bold text-stone-900">
                  {isCustom ? 'Celebrations & Evening Gatherings' : 'Live Acoustic Jamming Sessions'}
                </h3>
                <p className="text-xs text-stone-600 leading-relaxed">
                  {isCustom ? `Gather your friends and family for birthdays, celebrations, or spontaneous dinners with exquisite food and warm hospitality.` : 'Live guitar melodies and singing performances from local artists. Enjoy the music while munching on piping hot momos and stone-baked pizza slices.'}
                </p>
              </div>
              <a
                href={`https://wa.me/${(restaurant?.whatsappNumber || restaurant?.phone || '919352182562').replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hi ${restaurant?.name || 'Cafe'}, I would like to inquire about table reservations`)}`}
                target="_blank"
                rel="noreferrer"
                className="text-[11px] font-bold hover:underline flex items-center gap-1 pt-4 border-t border-stone-100"
                style={{ color: theme.primaryColor }}
              >
                <span>Reserve via WhatsApp</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

          </div>
        </div>
      </section>

      {/* 8. VERIFIED CUSTOMER REVIEWS */}
      {reviews && reviews.length > 0 && (
        <section className="py-20 lg:py-24 bg-white border-b border-stone-200/70">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            
            <div className="max-w-xl mx-auto text-center mb-12">
              <span className="text-xs uppercase tracking-[0.2em] font-bold block mb-2" style={{ color: theme.secondaryColor }}>
                Guest Impressions
              </span>
              <h2 className="font-serif text-3xl sm:text-4xl font-bold text-stone-900 tracking-tight">
                {isCustom ? `Words from Our Guests` : 'Words from Our Balcony Guests'}
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {reviews.map((r) => (
                <div
                  key={r.id}
                  className="p-8 rounded-3xl bg-cream-50 border border-stone-200/80 shadow-xs flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center gap-1 text-amber-500">
                      {Array.from({ length: r.rating }).map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-amber-500 text-amber-500" />
                      ))}
                    </div>
                    <p className="text-stone-700 text-sm italic leading-relaxed font-serif">
                      "{r.comment}"
                    </p>
                  </div>
                  <div className="pt-4 border-t border-stone-200/60 flex items-center justify-between text-xs font-bold text-stone-900 mt-6">
                    <span>{r.customerName}</span>
                    <span className="text-stone-400 font-normal">Verified Visitor</span>
                  </div>
                </div>
              ))}
            </div>

          </div>
        </section>
      )}

      {/* 9. LOCATION & VISIT */}
      <section id="location" className="py-20 lg:py-28" style={{ backgroundColor: theme.bgCream }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="bg-white rounded-3xl shadow-card border border-stone-200 p-8 sm:p-12 lg:p-14">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
              
              {/* Directions & Information */}
              <div className="lg:col-span-6 space-y-6 text-left">
                <div>
                  <span className="text-xs uppercase tracking-[0.2em] font-bold block mb-2" style={{ color: theme.secondaryColor }}>
                    Finding Us
                  </span>
                  <h2 className="font-serif text-3xl sm:text-4xl font-bold text-stone-900 leading-tight">
                    Visit {restaurant?.name || 'RoastFuze Coffee Bar'}
                  </h2>
                  <p className="text-xs sm:text-sm text-stone-600 mt-2">
                    Located in {restaurant?.address || `${restaurant?.city || 'Jaipur'}, ${restaurant?.state || 'Rajasthan'}`}.
                  </p>
                </div>

                <div className="space-y-4 text-sm text-stone-700">
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 mt-1 flex-shrink-0" style={{ color: theme.primaryColor }} />
                    <div>
                      <strong className="block text-stone-900 font-serif">Complete Address</strong>
                      <span className="text-stone-600 leading-relaxed text-xs sm:text-sm">
                        {restaurant?.address || (isCustom ? `${restaurant?.city || 'Jaipur'}, ${restaurant?.state || 'Rajasthan'}` : 'A-26, Vivek Vihar, Lalarpura Road, Gandhi Path West, Vaishali Nagar, Jaipur, Rajasthan 302021')}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Clock className="w-5 h-5 mt-1 flex-shrink-0" style={{ color: theme.primaryColor }} />
                    <div>
                      <strong className="block text-stone-900 font-serif">Operating Hours</strong>
                      <span className="text-stone-600 text-xs sm:text-sm">
                        {restaurant?.openingHours || '10:00 AM – 11:00 PM (Open Monday through Sunday)'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Phone className="w-5 h-5 mt-1 flex-shrink-0" style={{ color: theme.primaryColor }} />
                    <div>
                      <strong className="block text-stone-900 font-serif">Phone & Inquiries</strong>
                      <a
                        href={`tel:${(restaurant?.phone || '+91 93521 82562').replace(/\s+/g, '')}`}
                        className="hover:underline font-bold text-xs sm:text-sm"
                        style={{ color: theme.primaryColor }}
                      >
                        {restaurant?.phone || '+91 93521 82562'}
                      </a>
                    </div>
                  </div>
                </div>

                {/* Visitor Notes */}
                <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 text-xs text-stone-600 space-y-1">
                  <div className="font-bold text-stone-800">Visiting Notes:</div>
                  <div>• Comfortable seating environments available without mandatory advance reservation.</div>
                  <div>• Fresh culinary items prepared to order for optimal taste and quality.</div>
                  <div>• Digital QR ordering active at each table for instant orders.</div>
                </div>

                {/* Action Buttons */}
                <div className="pt-2 flex flex-wrap gap-3">
                  <a
                    href={restaurant?.mapLink || (isCustom ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${restaurant?.name} ${restaurant?.address || restaurant?.city || 'Jaipur'}`)}` : 'https://www.google.com/maps/place/RoastFuze+Coffee+Bar+-+Musical+Balcony+cafe/@26.9056268,75.7271802,20.2z/data=!4m6!3m5!1s0x396db5fadc6985e1:0xec2fb39c9113ff9e!8m2!3d26.9056268!4d75.7271802!16s%2Fg%2F11xhbpgh0x')}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 bg-stone-900 hover:bg-stone-800 text-white px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-sm"
                  >
                    <Compass className="w-4 h-4 text-amber-300" />
                    <span>Get Directions on Google Maps</span>
                  </a>

                  <a
                    href={`https://wa.me/${(restaurant?.whatsappNumber || restaurant?.phone || '919352182562').replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-sm"
                  >
                    <MessageCircle className="w-4 h-4 text-emerald-200" />
                    <span>Chat on WhatsApp</span>
                  </a>
                </div>
              </div>

              {/* Live Interactive Map */}
              <div className="lg:col-span-6 rounded-2xl overflow-hidden border border-stone-200 aspect-[16/11] relative bg-stone-100 shadow-inner">
                <iframe
                  title={`${restaurant?.name || 'Cafe'} Location Map`}
                  src={buildGoogleMapsEmbedUrl((data?.restaurant as any)?.mapEmbedUrl || data?.restaurant?.mapLink || (isCustom ? `${restaurant?.address || restaurant?.city || 'Jaipur'}, India` : '26.9056268,75.7271802'))}
                  className="w-full h-full border-0"
                  loading="lazy"
                />
              </div>

            </div>
          </div>

        </div>
      </section>

      <Footer restaurant={restaurant} />
    </div>
  );
};
