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
  Leaf,
  CheckCircle2,
  Star,
  MessageCircle,
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
        <div className="text-center">
          <div className="w-12 h-12 rounded-full border-4 border-nature-900 border-t-transparent animate-spin mx-auto mb-4" />
          <p className="font-serif text-lg font-bold text-nature-950">Switea Nature Cafe</p>
          <p className="text-xs text-stone-500">Brewing fresh experiences...</p>
        </div>
      </div>
    );
  }

  const { restaurant, landingContent, gallery, reviews, categories, bestsellers } = data || {};

  return (
    <div className="min-h-screen bg-cream-100 text-stone-800 flex flex-col selection:bg-nature-200">
      <Navbar />

      {/* Announcement Bar */}
      {landingContent?.announcementActive && landingContent.announcementText && (
        <div className="bg-nature-950 text-cream-100 text-xs sm:text-sm py-2 px-4 text-center font-medium border-b border-nature-900 flex items-center justify-center gap-2">
          <Sparkles className="w-4 h-4 text-nature-300 flex-shrink-0" />
          <span>{landingContent.announcementText}</span>
        </div>
      )}

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-32 bg-gradient-to-b from-cream-100 via-nature-50/40 to-cream-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Copy */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-nature-100/90 text-nature-900 text-xs sm:text-sm font-semibold tracking-wide border border-nature-200">
                <Leaf className="w-4 h-4 text-nature-700" />
                <span>Jaipur’s Premier Garden Cafe Oasis</span>
              </div>

              <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-extrabold text-nature-950 leading-[1.15] tracking-tight">
                {landingContent?.heroTitle || 'Switea Nature Cafe'}
              </h1>

              <p className="text-lg sm:text-xl text-stone-600 font-normal max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                {landingContent?.heroSubtitle ||
                  'Step into a serene garden escape serving handcrafted kulhad teas, artisan coffees, and delectable comfort bites in the heart of Jaipur.'}
              </p>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-4">
                <Link
                  to="/menu"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 bg-nature-900 text-white hover:bg-nature-950 px-8 py-4 rounded-full font-bold text-base shadow-card transition-all duration-300 hover:-translate-y-1"
                >
                  <UtensilsCrossed className="w-5 h-5 text-nature-300" />
                  <span>{landingContent?.heroCtaText || 'Explore Digital Menu'}</span>
                </Link>

                <a
                  href="#visit-section"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white text-nature-950 border border-stone-200 hover:border-nature-800 px-8 py-4 rounded-full font-bold text-base shadow-soft transition-all duration-300 hover:bg-stone-50"
                >
                  <MapPin className="w-5 h-5 text-nature-700" />
                  <span>Find Location</span>
                </a>
              </div>

              {/* Feature Tags */}
              <div className="pt-6 flex flex-wrap items-center justify-center lg:justify-start gap-6 text-xs sm:text-sm text-stone-600 font-medium">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-nature-700" />
                  <span>Authentic Kulhad Teas</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-nature-700" />
                  <span>Open Garden & Cabana Seating</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-nature-700" />
                  <span>Table QR Instant Ordering</span>
                </div>
              </div>
            </div>

            {/* Right Hero Image Card */}
            <div className="lg:col-span-5 relative">
              <div className="relative mx-auto max-w-md lg:max-w-none">
                <div className="relative rounded-3xl overflow-hidden shadow-2xl border-4 border-white aspect-[4/5]">
                  <img
                    src={
                      landingContent?.heroImage ||
                      'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=1600&q=80'
                    }
                    alt="Switea Nature Cafe Garden Ambience"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-nature-950/80 via-transparent to-transparent flex flex-col justify-end p-6 text-white">
                    <span className="text-xs tracking-wider uppercase text-nature-300 font-semibold mb-1">
                      A Sip of Sweetness
                    </span>
                    <p className="font-serif text-xl font-bold">Nature-Inspired Dining</p>
                    <p className="text-xs text-stone-300">Gandhipath, near Vaishali Nagar, Jaipur</p>
                  </div>
                </div>

                {/* Floating Experience Badge */}
                <div className="absolute -bottom-6 -left-6 bg-white rounded-2xl p-4 shadow-xl border border-stone-100 hidden sm:flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-nature-100 flex items-center justify-center text-nature-900">
                    <Coffee className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="font-serif font-bold text-base text-stone-900 block leading-tight">
                      Fresh Clay Kulhads
                    </span>
                    <span className="text-xs text-stone-500">Desi Chai, Cold Coffees & Maggi</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About The Cafe Section */}
      <section className="py-20 bg-white border-y border-stone-200/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-6 relative">
              <div className="rounded-3xl overflow-hidden shadow-xl aspect-[4/3]">
                <img
                  src={
                    landingContent?.aboutImage ||
                    'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1000&q=80'
                  }
                  alt="Switea Cafe Ambience"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            <div className="lg:col-span-6 space-y-6">
              <div className="inline-block px-3 py-1 bg-nature-100 text-nature-900 text-xs font-bold rounded-full uppercase tracking-wider">
                Our Story
              </div>
              <h2 className="font-serif text-3xl sm:text-4xl font-bold text-stone-900 leading-tight">
                {landingContent?.aboutTitle || 'Nature, Calm & Freshly Brewed Joy'}
              </h2>
              <p className="text-stone-600 leading-relaxed">
                {landingContent?.aboutText ||
                  'Nestled amidst lush greenery in Jaipur, Switea Nature Cafe was founded on a simple vision: to bring people together over steaming cups of pure, traditional chai and delicious comfort food in an earthy, open-air ambience.'}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                <div className="p-4 rounded-2xl bg-cream-100 border border-cream-200">
                  <div className="w-8 h-8 rounded-lg bg-nature-900 text-cream-100 flex items-center justify-center font-bold text-xs mb-2">
                    01
                  </div>
                  <h3 className="font-serif font-bold text-sm text-stone-900 mb-1">
                    {landingContent?.aboutHighlight1 || 'Kulhad Chai'}
                  </h3>
                  <p className="text-xs text-stone-500">Steaming desi chai in fresh terracotta cups.</p>
                </div>

                <div className="p-4 rounded-2xl bg-cream-100 border border-cream-200">
                  <div className="w-8 h-8 rounded-lg bg-nature-900 text-cream-100 flex items-center justify-center font-bold text-xs mb-2">
                    02
                  </div>
                  <h3 className="font-serif font-bold text-sm text-stone-900 mb-1">
                    {landingContent?.aboutHighlight2 || 'Garden Seating'}
                  </h3>
                  <p className="text-xs text-stone-500">Lush open-air greenery & comfortable cabanas.</p>
                </div>

                <div className="p-4 rounded-2xl bg-cream-100 border border-cream-200">
                  <div className="w-8 h-8 rounded-lg bg-nature-900 text-cream-100 flex items-center justify-center font-bold text-xs mb-2">
                    03
                  </div>
                  <h3 className="font-serif font-bold text-sm text-stone-900 mb-1">
                    {landingContent?.aboutHighlight3 || 'Made Fresh'}
                  </h3>
                  <p className="text-xs text-stone-500">Piping hot food crafted fresh on order.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Menu Bestsellers */}
      {bestsellers && bestsellers.length > 0 && (
        <section className="py-20 bg-cream-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-12">
              <div>
                <span className="text-xs uppercase tracking-wider font-bold text-nature-700 block mb-1">
                  Crowd Favorites
                </span>
                <h2 className="font-serif text-3xl sm:text-4xl font-bold text-stone-900">
                  Signature Cafe Bestsellers
                </h2>
              </div>
              <Link
                to="/menu"
                className="mt-4 sm:mt-0 inline-flex items-center gap-1.5 text-nature-900 font-bold hover:underline"
              >
                <span>View Full Menu</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {bestsellers.map((item) => (
                <MenuItemCard key={item.id} item={item} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Categories Showcase */}
      {categories && categories.length > 0 && (
        <section className="py-20 bg-white border-y border-stone-200/60">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center mb-12">
            <span className="text-xs uppercase tracking-wider font-bold text-nature-700 block mb-1">
              Curated Menu
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-stone-900">
              Explore By Category
            </h2>
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  to={`/menu?category=${cat.slug}`}
                  className="group relative rounded-2xl overflow-hidden aspect-[4/3] bg-stone-100 shadow-soft hover:shadow-card transition-all"
                >
                  <img
                    src={
                      cat.image ||
                      'https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=500&q=80'
                    }
                    alt={cat.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-nature-950/85 via-nature-950/40 to-transparent flex flex-col justify-end p-4 text-white">
                    <h3 className="font-serif font-bold text-base sm:text-lg group-hover:text-nature-200 transition-colors">
                      {cat.name}
                    </h3>
                    <p className="text-[11px] text-stone-300">
                      {cat.items?.length || 0} items
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Gallery Section */}
      {gallery && gallery.length > 0 && (
        <section className="py-20 bg-cream-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center mb-12">
            <span className="text-xs uppercase tracking-wider font-bold text-nature-700 block mb-1">
              Atmosphere
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-stone-900">
              Moments at Switea Garden
            </h2>
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
              {gallery.map((img) => (
                <div
                  key={img.id}
                  className="rounded-2xl overflow-hidden shadow-soft aspect-[4/3] group relative"
                >
                  <img
                    src={img.imageUrl}
                    alt={img.title}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4 text-white">
                    <p className="text-xs font-semibold">{img.title}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Customer Reviews */}
      {reviews && reviews.length > 0 && (
        <section className="py-20 bg-white border-t border-stone-200/60">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center mb-12">
            <span className="text-xs uppercase tracking-wider font-bold text-nature-700 block mb-1">
              Guest Feedback
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-stone-900">
              What Jaipur Loves About Us
            </h2>
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {reviews.map((r) => (
                <div
                  key={r.id}
                  className="p-6 rounded-3xl bg-cream-50 border border-stone-200/80 shadow-soft flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center gap-1 text-amber-500">
                      {Array.from({ length: r.rating }).map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-amber-500 text-amber-500" />
                      ))}
                    </div>
                    <p className="text-stone-700 text-sm italic leading-relaxed">
                      "{r.comment}"
                    </p>
                  </div>
                  <div className="pt-4 border-t border-cream-200/80 flex items-center justify-between text-xs font-bold text-stone-900 mt-4">
                    <span>{r.customerName}</span>
                    <span className="text-stone-400 font-normal">Verified Visitor</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Location, Timing, and Map Section */}
      <section id="visit-section" className="py-20 bg-cream-200/40 border-t border-stone-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-3xl shadow-card border border-stone-200 p-8 sm:p-12">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-6 space-y-6">
                <div>
                  <span className="text-xs uppercase tracking-wider font-bold text-nature-700 block mb-1">
                    Jaipur Outpost
                  </span>
                  <h2 className="font-serif text-3xl font-bold text-stone-900">
                    Visit Switea Nature Cafe
                  </h2>
                </div>

                <div className="space-y-4 text-sm text-stone-700">
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-nature-800 mt-1 flex-shrink-0" />
                    <div>
                      <strong className="block text-stone-900">Address:</strong>
                      <span>{restaurant?.address}, {restaurant?.city}, {restaurant?.state} ({restaurant?.postalCode})</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Clock className="w-5 h-5 text-nature-800 mt-0.5 flex-shrink-0" />
                    <div>
                      <strong className="block text-stone-900">Opening Hours:</strong>
                      <span>{restaurant?.openingHours} (Mon – Sun)</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Phone className="w-5 h-5 text-nature-800 mt-0.5 flex-shrink-0" />
                    <div>
                      <strong className="block text-stone-900">Contact Number:</strong>
                      <a href={`tel:${restaurant?.phone}`} className="text-nature-900 hover:underline font-semibold">
                        {restaurant?.phone}
                      </a>
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex flex-wrap gap-4">
                  <a
                    href={restaurant?.mapLink || 'https://maps.google.com/?q=Switea+Garden+Cafe+Jaipur'}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 bg-nature-900 text-white px-6 py-3 rounded-full font-bold text-sm hover:bg-nature-950 transition-colors shadow"
                  >
                    <MapPin className="w-4 h-4 text-nature-300" />
                    <span>Open in Google Maps</span>
                  </a>

                  {restaurant?.whatsappNumber && (
                    <a
                      href={`https://wa.me/${restaurant.whatsappNumber.replace(/[^0-9]/g, '')}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 bg-emerald-700 text-white px-6 py-3 rounded-full font-bold text-sm hover:bg-emerald-800 transition-colors shadow"
                    >
                      <MessageCircle className="w-4 h-4 text-emerald-200" />
                      <span>WhatsApp Inquiries</span>
                    </a>
                  )}
                </div>
              </div>

              {/* Map embed placeholder / visual */}
              <div className="lg:col-span-6 rounded-2xl overflow-hidden border border-stone-200 bg-cream-100 aspect-[16/10] relative flex items-center justify-center">
                <iframe
                  title="Switea Cafe Location Map"
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
