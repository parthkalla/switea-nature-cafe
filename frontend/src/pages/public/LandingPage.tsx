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
  ExternalLink,
} from 'lucide-react';
import { Navbar } from '../../components/layout/Navbar';
import { Footer } from '../../components/layout/Footer';
import { api } from '../../services/api';
import { MenuItemCard } from '../../components/menu/MenuItemCard';
import { MenuItem, MenuCategory, Review, GalleryImage, LandingPageContent, Restaurant } from '../../types';

export const LandingPage: React.FC = () => {
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
  const [timeMood, setTimeMood] = useState<'day' | 'evening'>('day');

  // Featured Menu Filter
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('all');

  useEffect(() => {
    async function loadLanding() {
      try {
        const res = await api.getLandingPage('switea');
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
          <div className="w-10 h-10 border-2 border-nature-900 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="font-serif text-lg font-bold text-nature-950">Switea Nature Cafe</p>
          <p className="text-xs uppercase tracking-widest text-stone-500">Garden Sanctuary • Jaipur</p>
        </div>
      </div>
    );
  }

  const { restaurant, landingContent, gallery, reviews, categories, bestsellers } = data || {};

  // Verified spaces in the real cafe
  const cafeSpaces = [
    {
      id: 'lawn',
      name: 'The Central Garden Lawn',
      subtitle: 'Open-Air Grass Dining',
      atmosphere: 'Breezy, natural grass, sun-dappled foliage & unhurried quietude',
      bestFor: 'Morning Chai, Casual Banter, Reading & Lazy Brunches',
      timing: 'Best experienced 10:00 AM – 04:30 PM',
      capacity: '4 – 6 guests per table • Table 01 & Table 02',
      image: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=1200&q=80',
      badge: 'Open Lawn',
    },
    {
      id: 'pergola',
      name: 'Sheltered Cabana Pergola',
      subtitle: 'Timber Canopies & Plush Benches',
      atmosphere: 'Deep wooden shade, group intimacy, protected from direct sun',
      bestFor: 'Family Gatherings, Birthday Meetups & Private Discussions',
      timing: 'Comfortable all day • Ambient fairy lights by night',
      capacity: '6 – 8 guests per cabana • Table 03',
      image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80',
      badge: 'Pergola Cabana',
    },
    {
      id: 'rooftop',
      name: 'The Rooftop Deck',
      subtitle: 'Elevated Open Sky Terrace',
      atmosphere: 'Open Jaipur sky, cool evening cross-breezes & sunset vistas',
      bestFor: 'Sunset Coolers, Stargazing & Late Evening Dinners',
      timing: 'Magnificent from 05:30 PM – 11:30 PM',
      capacity: '6 – 8 guests • Table 05',
      image: 'https://images.unsplash.com/photo-1525610553991-2bede1a236e2?auto=format&fit=crop&w=1200&q=80',
      badge: 'Rooftop Deck',
    },
    {
      id: 'lounge',
      name: 'The Indoor AC Lounge',
      subtitle: 'Climate-Controlled Glass Retreat',
      atmosphere: 'Quiet, air-conditioned calm with expansive garden views',
      bestFor: 'Remote Laptop Work, Quiet Meetings & Midday Respite',
      timing: 'Available all hours • Climate controlled',
      capacity: '2 – 4 guests • Table 04',
      image: 'https://images.unsplash.com/photo-1559925393-8be0ec4767c8?auto=format&fit=crop&w=1200&q=80',
      badge: 'Indoor Lounge',
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
    <div className="min-h-screen bg-cream-100 text-stone-800 flex flex-col selection:bg-nature-200">
      <Navbar />

      {/* Optional Top Announcement Strip */}
      {landingContent?.announcementActive && landingContent.announcementText && (
        <div className="bg-nature-950 text-cream-200 text-xs py-2 px-4 text-center font-medium border-b border-nature-900 flex items-center justify-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-nature-300 flex-shrink-0" />
          <span>{landingContent.announcementText}</span>
        </div>
      )}

      {/* 1. HERO: Immersive, Asymmetrical Outdoor Garden Cafe Hero */}
      <section className="relative pt-12 pb-16 lg:pt-20 lg:pb-24 border-b border-stone-200/70 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            
            {/* Left Editorial Narrative */}
            <div className="lg:col-span-7 space-y-6 text-left">
              <div className="inline-flex items-center gap-2.5 px-3.5 py-1 rounded-full bg-stone-200/60 border border-stone-300/80 text-stone-800 text-[11px] font-bold tracking-[0.18em] uppercase">
                <span className="w-1.5 h-1.5 rounded-full bg-nature-700" />
                <span>Jaipur Outpost • Outdoor Garden Cafe</span>
              </div>

              <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold text-nature-950 leading-[1.12] tracking-tight">
                An Open-Air Sanctuary for Slow Sips & Warm Gatherings.
              </h1>

              <p className="text-base sm:text-lg text-stone-600 font-normal max-w-xl leading-relaxed">
                Nestled amidst mature foliage in Karni Vihar, Gandhipath, Switea invites you to escape crowded indoor spaces. Savor authentic slow-simmered earthen kulhad chai, stone-baked bites, and artisan coolers beneath open skies, shaded timber pergolas, and evening fairy lights.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2">
                <Link
                  to="/menu"
                  className="inline-flex items-center justify-center gap-2.5 bg-nature-900 text-white hover:bg-nature-950 px-7 py-3.5 rounded-xl font-bold text-sm shadow-soft transition-all duration-200 hover:-translate-y-0.5"
                >
                  <UtensilsCrossed className="w-4 h-4 text-nature-300" />
                  <span>Explore Menu</span>
                </Link>

                <a
                  href="#location"
                  className="inline-flex items-center justify-center gap-2 bg-white text-stone-900 border border-stone-300 hover:border-stone-800 px-7 py-3.5 rounded-xl font-bold text-sm shadow-xs transition-all duration-200 hover:bg-stone-50"
                >
                  <Compass className="w-4 h-4 text-stone-700" />
                  <span>Visit Our Garden</span>
                </a>
              </div>

              {/* Highlights Micro-list */}
              <div className="pt-4 flex flex-wrap items-center gap-y-2 gap-x-6 text-xs text-stone-600 font-medium border-t border-stone-200/70">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-nature-800" />
                  <span>Clay Kulhad Brews</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-nature-800" />
                  <span>Lawn & Pergola Seating</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-nature-800" />
                  <span>Table QR Digital Ordering</span>
                </div>
              </div>
            </div>

            {/* Right Asymmetrical Landscape Hero Visual */}
            <div className="lg:col-span-5 relative">
              <div className="relative rounded-3xl overflow-hidden border border-stone-200 shadow-card bg-stone-100 aspect-[4/3] lg:aspect-[4/5] group">
                <img
                  src={
                    landingContent?.heroImage ||
                    'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=1600&q=80'
                  }
                  alt="Switea Outdoor Garden Cafe Jaipur"
                  className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-700 ease-out"
                />
                
                {/* Subtle Editorial Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-nature-950/80 via-nature-950/20 to-transparent flex flex-col justify-end p-6 text-white">
                  <span className="text-[10px] tracking-[0.2em] uppercase font-bold text-nature-300 mb-1">
                    Gandhipath • Vaishali Nagar
                  </span>
                  <p className="font-serif text-xl sm:text-2xl font-bold leading-tight">
                    Shaded Pergolas & Natural Grass
                  </p>
                  <p className="text-xs text-stone-300 mt-1">
                    An outdoor cafe created for unhurried conversation.
                  </p>
                </div>
              </div>

              {/* Editorial Floating Tag */}
              <div className="absolute -bottom-5 -left-4 bg-white/95 backdrop-blur-md border border-stone-200 rounded-2xl p-4 shadow-soft hidden sm:flex items-center gap-3 max-w-xs">
                <div className="w-10 h-10 rounded-xl bg-nature-100 flex items-center justify-center text-nature-900 flex-shrink-0">
                  <Coffee className="w-5 h-5" />
                </div>
                <div>
                  <span className="font-serif font-bold text-sm text-stone-900 block leading-tight">
                    Terracotta Clay Chai
                  </span>
                  <span className="text-[11px] text-stone-500">Fresh Adrak, Cardamom & Cold Coffees</span>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Compact Location & Opening-Hours Strip */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-14">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-stone-200 border-y sm:border border-stone-200 bg-white rounded-2xl shadow-xs py-4 px-2 sm:px-4">
            
            <div className="p-3 sm:px-4 flex items-start gap-3">
              <MapPin className="w-4 h-4 text-nature-800 mt-0.5 flex-shrink-0" />
              <div>
                <span className="text-[10px] uppercase tracking-wider font-bold text-stone-400 block">Location</span>
                <span className="text-xs font-semibold text-stone-900 block">64A Karni Vihar, Gandhipath</span>
                <span className="text-[11px] text-stone-500">Near Vaishali Nagar, Jaipur</span>
              </div>
            </div>

            <div className="p-3 sm:px-4 flex items-start gap-3">
              <Clock className="w-4 h-4 text-nature-800 mt-0.5 flex-shrink-0" />
              <div>
                <span className="text-[10px] uppercase tracking-wider font-bold text-stone-400 block">Opening Hours</span>
                <span className="text-xs font-semibold text-stone-900 block">10:00 AM – 11:30 PM</span>
                <span className="text-[11px] text-stone-500">Open 7 Days a Week</span>
              </div>
            </div>

            <div className="p-3 sm:px-4 flex items-start gap-3">
              <Layers className="w-4 h-4 text-nature-800 mt-0.5 flex-shrink-0" />
              <div>
                <span className="text-[10px] uppercase tracking-wider font-bold text-stone-400 block">Environments</span>
                <span className="text-xs font-semibold text-stone-900 block">Lawn, Pergola & Rooftop</span>
                <span className="text-[11px] text-stone-500">Open-Air & Shaded Zones</span>
              </div>
            </div>

            <div className="p-3 sm:px-4 flex items-start gap-3">
              <Phone className="w-4 h-4 text-nature-800 mt-0.5 flex-shrink-0" />
              <div>
                <span className="text-[10px] uppercase tracking-wider font-bold text-stone-400 block">Inquiries</span>
                <a href="tel:+919555495454" className="text-xs font-semibold text-stone-900 hover:underline block">
                  +91 95554 95454
                </a>
                <span className="text-[11px] text-stone-500">WhatsApp & Direct Calls</span>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 2. GARDEN EXPERIENCE: Alternating Image & Narrative Layout */}
      <section id="experience" className="py-20 lg:py-28 bg-white border-b border-stone-200/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="max-w-2xl mx-auto text-center mb-16 lg:mb-20">
            <span className="text-xs uppercase tracking-[0.2em] font-bold text-nature-800 block mb-2">
              The Outdoor Environment
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-stone-900 tracking-tight leading-tight">
              Designed for Natural Light, Fresh Air & Unhurried Dining.
            </h2>
            <p className="text-sm sm:text-base text-stone-600 mt-3 leading-relaxed">
              We shaped Switea as a living outdoor retreat rather than a conventional boxed cafe. Every seating pocket connects you to fresh Jaipur breezes, green lawns, and warm hospitality.
            </p>
          </div>

          <div className="space-y-20 lg:space-y-28">

            {/* Alternating Block 1: The Open Lawn */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center">
              <div className="lg:col-span-7">
                <div className="rounded-3xl overflow-hidden border border-stone-200 aspect-[16/10] shadow-soft group">
                  <img
                    src="https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=1200&q=80"
                    alt="Switea Garden Lawn Seating"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                </div>
              </div>
              <div className="lg:col-span-5 space-y-4">
                <span className="text-xs font-bold uppercase tracking-wider text-nature-700 block">
                  Experience 01 • Open Air
                </span>
                <h3 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900 leading-snug">
                  The Central Lawn & Foliage Canopies
                </h3>
                <p className="text-sm text-stone-600 leading-relaxed">
                  Soft green turf underfoot, shaded by natural trees that break the midday glare into gentle dancing sunbeams. Tables are deliberately spaced with generous breathing room, creating an unhurried haven for morning chai dates, leisurely catch-ups with old friends, and quiet afternoon reads.
                </p>
                <div className="pt-2 space-y-2 text-xs font-medium text-stone-700">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-nature-800" />
                    <span>Generous spacing between tables for conversational privacy</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-nature-800" />
                    <span>Lush grass lawn open to natural morning sun and cross-breezes</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-nature-800" />
                    <span>Table QR ordering right from your lawn seat</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Alternating Block 2: Sheltered Pergola Cabana */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center">
              <div className="lg:col-span-5 order-2 lg:order-1 space-y-4">
                <span className="text-xs font-bold uppercase tracking-wider text-nature-700 block">
                  Experience 02 • Shaded Seating
                </span>
                <h3 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900 leading-snug">
                  Timber Pergolas & Cushioned Cabanas
                </h3>
                <p className="text-sm text-stone-600 leading-relaxed">
                  Crafted with warm natural timber, our canopied pergolas provide deep shade throughout sunny afternoons. Outfitted with comfortable bench seating, they offer the perfect sanctuary for family brunches, group discussions, and relaxed study sessions shielded from direct heat.
                </p>
                <div className="pt-2 space-y-2 text-xs font-medium text-stone-700">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-nature-800" />
                    <span>Comfortable cushioned group benches for 6 to 8 guests</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-nature-800" />
                    <span>Protected overhead shade without sacrificing outdoor air</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-nature-800" />
                    <span>Ideal for informal meetings and shared feasts</span>
                  </div>
                </div>
              </div>
              <div className="lg:col-span-7 order-1 lg:order-2">
                <div className="rounded-3xl overflow-hidden border border-stone-200 aspect-[16/10] shadow-soft group">
                  <img
                    src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80"
                    alt="Switea Pergola Cabana Seating"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                </div>
              </div>
            </div>

            {/* Alternating Block 3: Twilight Fairy Lights */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center">
              <div className="lg:col-span-7">
                <div className="rounded-3xl overflow-hidden border border-stone-200 aspect-[16/10] shadow-soft group">
                  <img
                    src="https://images.unsplash.com/photo-1525610553991-2bede1a236e2?auto=format&fit=crop&w=1200&q=80"
                    alt="Switea Evening Festoon Fairy Lights"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                </div>
              </div>
              <div className="lg:col-span-5 space-y-4">
                <span className="text-xs font-bold uppercase tracking-wider text-nature-700 block">
                  Experience 03 • Twilight Ambience
                </span>
                <h3 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900 leading-snug">
                  The Twilight Garden & Festoon Glow
                </h3>
                <p className="text-sm text-stone-600 leading-relaxed">
                  When sunset sweeps over Jaipur, the garden transforms. Hand-strung warm filament bulbs ignite gently through the tree branches, the desert heat subsides into a crisp evening breeze, and steaming clay kulhads warm your palms under an ambient star-lit canopy.
                </p>
                <div className="pt-2 space-y-2 text-xs font-medium text-stone-700">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-nature-800" />
                    <span>Warm golden festoon bulbs and intimate candlelit mood</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-nature-800" />
                    <span>Cool evening air paired with piping hot earthen kulhad tea</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-nature-800" />
                    <span>Open till 11:30 PM for quiet midnight conversations</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 3. PHOTO COMPOSITION: Asymmetrical Editorial Gallery */}
      <section className="py-20 lg:py-28 bg-cream-100 border-b border-stone-200/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 lg:mb-16">
            <div className="max-w-xl">
              <span className="text-xs uppercase tracking-[0.2em] font-bold text-nature-800 block mb-2">
                Atmosphere & Perspectives
              </span>
              <h2 className="font-serif text-3xl sm:text-4xl font-bold text-stone-900 tracking-tight">
                Moments in the Garden
              </h2>
              <p className="text-sm text-stone-600 mt-2">
                An unhurried visual narrative of everyday pauses, conversations, and garden hospitality.
              </p>
            </div>
            <Link
              to="/gallery"
              className="mt-4 md:mt-0 inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-nature-900 hover:text-nature-950 hover:underline"
            >
              <span>View Full Garden Collection</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Asymmetrical Editorial Composition */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Anchoring Landscape Photograph */}
            <div className="lg:col-span-8 space-y-3">
              <div className="rounded-3xl overflow-hidden border border-stone-200/90 shadow-soft aspect-[16/10] bg-stone-200 group">
                <img
                  src="https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=1600&q=80"
                  alt="The Central Lawn at Golden Hour"
                  className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-700"
                />
              </div>
              <div className="flex items-center justify-between text-xs text-stone-500 px-1">
                <span className="font-serif italic text-stone-800 text-sm">The Central Lawn at Golden Hour</span>
                <span className="font-mono text-[11px]">05:45 PM • Gandhipath Jaipur</span>
              </div>
            </div>

            {/* Smaller Supporting Photographs */}
            <div className="lg:col-span-4 space-y-8">
              
              <div className="space-y-2.5">
                <div className="rounded-2xl overflow-hidden border border-stone-200/90 shadow-xs aspect-[4/3] bg-stone-200 group">
                  <img
                    src="https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=800&q=80"
                    alt="Traditional Clay Kulhad Chai"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <div className="text-[11px] text-stone-500 px-1">
                  <strong className="text-stone-800 block text-xs">Porous Terracotta Clay Kulhads</strong>
                  <span>Infused with freshly crushed ginger, cardamom & pure milk.</span>
                </div>
              </div>

              <div className="space-y-2.5">
                <div className="rounded-2xl overflow-hidden border border-stone-200/90 shadow-xs aspect-[4/3] bg-stone-200 group">
                  <img
                    src="https://images.unsplash.com/photo-1525610553991-2bede1a236e2?auto=format&fit=crop&w=800&q=80"
                    alt="Evening Festoon Bulbs"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <div className="text-[11px] text-stone-500 px-1">
                  <strong className="text-stone-800 block text-xs">Evening Festoon Illuminations</strong>
                  <span>Warm amber filament glow beneath the cool night breeze.</span>
                </div>
              </div>

            </div>

          </div>
        </div>
      </section>

      {/* 4. THE SPACES: Verified Seating Zones as Individual Experiences */}
      <section id="spaces" className="py-20 lg:py-28 bg-white border-b border-stone-200/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="max-w-2xl mx-auto text-center mb-16">
            <span className="text-xs uppercase tracking-[0.2em] font-bold text-nature-800 block mb-2">
              Seating Zones
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-stone-900 tracking-tight">
              Choose Your Corner of the Garden.
            </h2>
            <p className="text-sm sm:text-base text-stone-600 mt-3 leading-relaxed">
              Every dining space at Switea has been verified and thoughtfully arranged for different moods, group sizes, and times of day.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {cafeSpaces.map((space) => (
              <div
                key={space.id}
                className="bg-cream-50 rounded-3xl border border-stone-200/80 overflow-hidden shadow-xs hover:shadow-card transition-all duration-300 flex flex-col justify-between group"
              >
                <div>
                  <div className="relative aspect-[16/11] bg-stone-100 overflow-hidden">
                    <img
                      src={space.image}
                      alt={space.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider text-nature-950 border border-stone-200 shadow-xs">
                      {space.badge}
                    </div>
                  </div>

                  <div className="p-6 space-y-3">
                    <div>
                      <h3 className="font-serif text-xl font-bold text-stone-900 leading-tight">
                        {space.name}
                      </h3>
                      <span className="text-xs font-semibold text-nature-800 block mt-0.5">
                        {space.subtitle}
                      </span>
                    </div>

                    <p className="text-xs text-stone-600 leading-relaxed">
                      {space.atmosphere}
                    </p>

                    <div className="pt-3 border-t border-stone-200/70 space-y-1.5 text-[11px] text-stone-600">
                      <div>
                        <strong className="text-stone-800 font-semibold">Ideal For: </strong>
                        <span>{space.bestFor}</span>
                      </div>
                      <div>
                        <strong className="text-stone-800 font-semibold">Capacity: </strong>
                        <span>{space.capacity}</span>
                      </div>
                      <div>
                        <strong className="text-stone-800 font-semibold">Timing: </strong>
                        <span className="text-nature-700">{space.timing}</span>
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
            ))}
          </div>

        </div>
      </section>

      {/* 5. DAY-TO-EVENING STORYTELLING: Visual & Atmospheric Transition */}
      <section className="py-20 lg:py-28 bg-cream-200/50 border-b border-stone-200/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="max-w-3xl mx-auto text-center mb-12">
            <span className="text-xs uppercase tracking-[0.2em] font-bold text-nature-800 block mb-2">
              Atmospheric Pacing
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-stone-900 tracking-tight">
              Daylight Breeze to Twilight Glow
            </h2>
            <p className="text-sm text-stone-600 mt-2">
              Experience the dual personality of Switea—bright daytime outdoor dining and intimate evening garden ambience.
            </p>

            {/* Interactive Mode Switcher */}
            <div className="inline-flex items-center p-1.5 bg-white border border-stone-300 rounded-full shadow-xs mt-6">
              <button
                type="button"
                onClick={() => setTimeMood('day')}
                className={`inline-flex items-center gap-2 px-5 py-2 rounded-full text-xs font-bold transition-all ${
                  timeMood === 'day'
                    ? 'bg-nature-900 text-white shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <Sun className="w-3.5 h-3.5 text-amber-400" />
                <span>Daytime Garden Dining</span>
              </button>

              <button
                type="button"
                onClick={() => setTimeMood('evening')}
                className={`inline-flex items-center gap-2 px-5 py-2 rounded-full text-xs font-bold transition-all ${
                  timeMood === 'evening'
                    ? 'bg-nature-950 text-white shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <Moon className="w-3.5 h-3.5 text-amber-300" />
                <span>Twilight & Festoon Lights</span>
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
                      src="https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=1200&q=80"
                      alt="Daytime Garden Dining at Switea"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>

                <div className="lg:col-span-5 space-y-4 text-left">
                  <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-800 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
                    <Sun className="w-3.5 h-3.5 text-amber-600" />
                    <span>10:00 AM – 04:30 PM • Sunlight & Fresh Air</span>
                  </div>

                  <h3 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900 leading-snug">
                    Natural Sunlight, Leafy Shadows & Chilled Brews
                  </h3>

                  <p className="text-sm text-stone-600 leading-relaxed">
                    Mornings at Switea begin with birdsong and clean morning breezes. The sun filters gently through the leaves, illuminating comfortable outdoor tables. Perfect for energized catch-ups, creative outdoor laptop work, or breakfast with iced coffees and hot toasties.
                  </p>

                  <div className="pt-2 border-t border-stone-100">
                    <span className="text-[11px] uppercase tracking-wider font-bold text-stone-400 block mb-2">
                      Daytime Recommendations:
                    </span>
                    <div className="flex flex-wrap gap-2">
                      <span className="bg-stone-100 border border-stone-200 text-stone-800 text-xs px-3 py-1 rounded-full font-medium">
                        Garden Fresh Mint Mojito
                      </span>
                      <span className="bg-stone-100 border border-stone-200 text-stone-800 text-xs px-3 py-1 rounded-full font-medium">
                        Gud Ki Chai (Jaggery Tea)
                      </span>
                      <span className="bg-stone-100 border border-stone-200 text-stone-800 text-xs px-3 py-1 rounded-full font-medium">
                        Artisan Cold Coffee
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
                      src="https://images.unsplash.com/photo-1525610553991-2bede1a236e2?auto=format&fit=crop&w=1200&q=80"
                      alt="Evening Festoon Ambience at Switea"
                      className="w-full h-full object-cover opacity-95"
                    />
                  </div>
                </div>

                <div className="lg:col-span-5 space-y-4 text-left">
                  <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                    <Moon className="w-3.5 h-3.5 text-emerald-700" />
                    <span>06:00 PM – 11:30 PM • Warm Filament Glow</span>
                  </div>

                  <h3 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900 leading-snug">
                    Golden Festoons, Pleasant Night Air & Hot Clay Cups
                  </h3>

                  <p className="text-sm text-stone-600 leading-relaxed">
                    As twilight settles over Jaipur, our festoon lights glow warmly through the tree canopy. The desert heat drops, bringing a soothing cool evening breeze. Friends gather around steaming cups of spicy ginger kulhad chai and stone-baked farmhouse pizzas under the night sky.
                  </p>

                  <div className="pt-2 border-t border-stone-100">
                    <span className="text-[11px] uppercase tracking-wider font-bold text-stone-400 block mb-2">
                      Evening Recommendations:
                    </span>
                    <div className="flex flex-wrap gap-2">
                      <span className="bg-stone-100 border border-stone-200 text-stone-800 text-xs px-3 py-1 rounded-full font-medium">
                        Adrak Masala Kulhad Chai
                      </span>
                      <span className="bg-stone-100 border border-stone-200 text-stone-800 text-xs px-3 py-1 rounded-full font-medium">
                        Farmhouse Stone-Baked Pizza
                      </span>
                      <span className="bg-stone-100 border border-stone-200 text-stone-800 text-xs px-3 py-1 rounded-full font-medium">
                        Crispy Kurkure Momos
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

        </div>
      </section>

      {/* 6. FOOD AND DRINKS: Distinctive Featured Menu Layout & Item Shelves */}
      <section className="py-20 lg:py-28 bg-white border-b border-stone-200/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 pb-6 border-b border-stone-200">
            <div>
              <span className="text-xs uppercase tracking-[0.2em] font-bold text-nature-800 block mb-2">
                Culinary Craft
              </span>
              <h2 className="font-serif text-3xl sm:text-4xl font-bold text-stone-900 tracking-tight">
                Wholesome Cafe Fare in the Garden
              </h2>
              <p className="text-sm text-stone-600 mt-2">
                Simmered, brewed and stone-baked fresh to order. No pre-cooked compromises.
              </p>
            </div>

            <Link
              to="/menu"
              className="mt-4 md:mt-0 inline-flex items-center gap-2 bg-nature-900 text-white hover:bg-nature-950 px-6 py-3 rounded-xl text-xs uppercase tracking-wider font-bold shadow-soft transition-all"
            >
              <span>View Complete Digital Menu</span>
              <ArrowRight className="w-4 h-4 text-nature-300" />
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
                    ? 'bg-nature-900 text-white shadow-xs'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                All Signature Bestsellers
              </button>

              {categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setActiveCategoryFilter(cat.slug || cat.id)}
                  className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all ${
                    activeCategoryFilter === (cat.slug || cat.id)
                      ? 'bg-nature-900 text-white shadow-xs'
                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          )}

          {/* Horizontal Scrolling Featured Item Shelf */}
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

          {/* Large Editorial Highlight Box: The Earthen Clay Tradition */}
          <div className="mt-16 bg-cream-100 rounded-3xl border border-stone-200 p-8 sm:p-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-4 rounded-2xl overflow-hidden aspect-[4/3] border border-stone-200 shadow-xs">
                <img
                  src="https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=800&q=80"
                  alt="Authentic Earthen Kulhad Chai Tradition"
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="lg:col-span-8 space-y-3 text-left">
                <span className="text-[11px] uppercase tracking-wider font-bold text-nature-800 block">
                  The Clay Kulhad Ritual
                </span>
                <h3 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900">
                  Why Tea Belongs in Terracotta Clay
                </h3>
                <p className="text-sm text-stone-600 leading-relaxed">
                  Our kulhads are crafted by traditional potters from natural Rajasthan clay and fired once. When freshly brewed hot masala chai touches the unglazed terracotta, it absorbs a subtle mineral sweetness and releases an irreplaceable earthy scent (<em>mitti ki khushboo</em>) that paper cups or glass mugs can never replicate.
                </p>
                <div className="pt-2 flex items-center gap-6 text-xs text-stone-700 font-semibold">
                  <span>• 100% Biodegradable & Natural</span>
                  <span>• Enhanced Thermal Warmth</span>
                  <span>• Rich Native Flavor</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* 7. SOCIAL EXPERIENCE: Gatherings & Leisure */}
      <section className="py-20 lg:py-28 bg-cream-100 border-b border-stone-200/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="max-w-2xl mx-auto text-center mb-16">
            <span className="text-xs uppercase tracking-[0.2em] font-bold text-nature-800 block mb-2">
              Shared Occasions
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-stone-900 tracking-tight">
              Gatherings in the Garden.
            </h2>
            <p className="text-sm sm:text-base text-stone-600 mt-3 leading-relaxed">
              Whether you are meeting an old friend, carving out quiet remote working hours, or organizing a birthday under the pergolas, our outdoor setting accommodates every rhythm.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Occasion 1: Casual Meetups & Tea Dates */}
            <div className="bg-white p-8 rounded-3xl border border-stone-200/80 shadow-soft space-y-4 text-left flex flex-col justify-between">
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-cream-200 text-nature-900 flex items-center justify-center">
                  <Users className="w-6 h-6" />
                </div>
                <h3 className="font-serif text-xl font-bold text-stone-900">
                  Unrushed Tea Dates & Catch-ups
                </h3>
                <p className="text-xs text-stone-600 leading-relaxed">
                  No loud indoor acoustics or waiters rushing your table. Settle in for long, meaningful conversations under the tree canopy with steaming kulhad chai, crispy peri-peri fries, and hot momos.
                </p>
              </div>
              <span className="text-[11px] font-bold text-nature-800 block pt-4 border-t border-stone-100">
                Walk-ins always welcome across lawn tables.
              </span>
            </div>

            {/* Occasion 2: Remote Work & Creative Solitude */}
            <div className="bg-white p-8 rounded-3xl border border-stone-200/80 shadow-soft space-y-4 text-left flex flex-col justify-between">
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-cream-200 text-nature-900 flex items-center justify-center">
                  <Coffee className="w-6 h-6" />
                </div>
                <h3 className="font-serif text-xl font-bold text-stone-900">
                  Open-Air Focus & Creative Hours
                </h3>
                <p className="text-xs text-stone-600 leading-relaxed">
                  Natural daylight, fresh air, and peaceful surroundings keep thoughts clear. Sip on artisan cold coffees while working remotely on laptops or enjoying a good book in our shaded pergolas.
                </p>
              </div>
              <span className="text-[11px] font-bold text-nature-800 block pt-4 border-t border-stone-100">
                High-speed WiFi & shaded plug points available.
              </span>
            </div>

            {/* Occasion 3: Celebrations in the Cabanas */}
            <div className="bg-white p-8 rounded-3xl border border-stone-200/80 shadow-soft space-y-4 text-left flex flex-col justify-between">
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-cream-200 text-nature-900 flex items-center justify-center">
                  <Calendar className="w-6 h-6" />
                </div>
                <h3 className="font-serif text-xl font-bold text-stone-900">
                  Garden Birthdays & Small Celebrations
                </h3>
                <p className="text-xs text-stone-600 leading-relaxed">
                  Celebrate special days with friends and family in our reserved cabana pergolas. Surrounded by garden foliage and warm evening fairy lights, we help arrange custom pizzas, platters, and snacks.
                </p>
              </div>
              <a
                href="https://wa.me/919555495454?text=Hi%20Switea%20Cafe%2C%20I%20would%20like%20to%20inquire%20about%20a%20garden%20table%20reservation"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] font-bold text-nature-900 hover:underline flex items-center gap-1 pt-4 border-t border-stone-100"
              >
                <span>Reserve a cabana via WhatsApp</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

          </div>
        </div>
      </section>

      {/* 8. VERIFIED CUSTOMER REVIEWS: Real Guest Feedback */}
      {reviews && reviews.length > 0 && (
        <section className="py-20 lg:py-24 bg-white border-b border-stone-200/70">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            
            <div className="max-w-xl mx-auto text-center mb-12">
              <span className="text-xs uppercase tracking-[0.2em] font-bold text-nature-800 block mb-2">
                Guest Impressions
              </span>
              <h2 className="font-serif text-3xl sm:text-4xl font-bold text-stone-900 tracking-tight">
                Words from Our Garden Visitors
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

      {/* 9. LOCATION & VISIT: Strong Location Section with Directions, Hours & Map */}
      <section id="location" className="py-20 lg:py-28 bg-cream-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="bg-white rounded-3xl shadow-card border border-stone-200 p-8 sm:p-12 lg:p-14">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
              
              {/* Directions & Information */}
              <div className="lg:col-span-6 space-y-6 text-left">
                <div>
                  <span className="text-xs uppercase tracking-[0.2em] font-bold text-nature-800 block mb-2">
                    Finding Us
                  </span>
                  <h2 className="font-serif text-3xl sm:text-4xl font-bold text-stone-900 leading-tight">
                    Visit Switea Nature Cafe
                  </h2>
                  <p className="text-xs sm:text-sm text-stone-600 mt-2">
                    Located in the peaceful residential lanes of Karni Vihar, Gandhipath, with easy access from Vaishali Nagar.
                  </p>
                </div>

                <div className="space-y-4 text-sm text-stone-700">
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-nature-900 mt-1 flex-shrink-0" />
                    <div>
                      <strong className="block text-stone-900 font-serif">Complete Address</strong>
                      <span className="text-stone-600 leading-relaxed text-xs sm:text-sm">
                        {restaurant?.address || '64A, Garden Cafe, Karni Vihar, Maa Karni Nagar, Gandhipath, near Vaishali Nagar'},{' '}
                        {restaurant?.city || 'Jaipur'}, {restaurant?.state || 'Rajasthan'} ({restaurant?.postalCode || '302021'})
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Clock className="w-5 h-5 text-nature-900 mt-1 flex-shrink-0" />
                    <div>
                      <strong className="block text-stone-900 font-serif">Operating Hours</strong>
                      <span className="text-stone-600 text-xs sm:text-sm">
                        {restaurant?.openingHours || '10:00 AM – 11:30 PM'} (Open Monday through Sunday)
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Phone className="w-5 h-5 text-nature-900 mt-1 flex-shrink-0" />
                    <div>
                      <strong className="block text-stone-900 font-serif">Direct Phone</strong>
                      <a
                        href={`tel:${restaurant?.phone || '+919555495454'}`}
                        className="text-nature-900 hover:underline font-bold text-xs sm:text-sm"
                      >
                        {restaurant?.phone || '+91 95554 95454'}
                      </a>
                    </div>
                  </div>
                </div>

                {/* Visitor Notes */}
                <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 text-xs text-stone-600 space-y-1">
                  <div className="font-bold text-stone-800">Visitor Notes:</div>
                  <div>• Ample open-air parking available along Gandhipath road.</div>
                  <div>• Outdoor lawn and sheltered pergolas available without mandatory advance booking.</div>
                  <div>• Instant table ordering active via QR code on all tables.</div>
                </div>

                {/* Action Buttons */}
                <div className="pt-2 flex flex-wrap gap-3">
                  <a
                    href={restaurant?.mapLink || 'https://maps.google.com/?q=Switea+Garden+Cafe+Jaipur'}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 bg-nature-900 hover:bg-nature-950 text-white px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-sm"
                  >
                    <Compass className="w-4 h-4 text-nature-300" />
                    <span>Get Directions on Google Maps</span>
                  </a>

                  {restaurant?.whatsappNumber && (
                    <a
                      href={`https://wa.me/${restaurant.whatsappNumber.replace(/[^0-9]/g, '')}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-sm"
                    >
                      <MessageCircle className="w-4 h-4 text-emerald-200" />
                      <span>Chat on WhatsApp</span>
                    </a>
                  )}
                </div>
              </div>

              {/* Live Interactive Map */}
              <div className="lg:col-span-6 rounded-2xl overflow-hidden border border-stone-200 aspect-[16/11] relative bg-stone-100 shadow-inner">
                <iframe
                  title="Switea Garden Cafe Location Map"
                  src="https://maps.google.com/maps?q=Karni%20Vihar%20Gandhipath%20Jaipur&t=&z=14&ie=UTF8&iwloc=&output=embed"
                  className="w-full h-full border-0"
                  loading="lazy"
                />
              </div>

            </div>
          </div>

        </div>
      </section>

      <Footer />
    </div>
  );
};
