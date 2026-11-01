import React from 'react';
import { Link } from 'react-router-dom';
import { Coffee, Music, Heart, UtensilsCrossed, Sparkles } from 'lucide-react';
import { Navbar } from '../../components/layout/Navbar';
import { Footer } from '../../components/layout/Footer';

export const AboutPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-cream-100 flex flex-col selection:bg-amber-200">
      <Navbar />

      <main className="flex-1">
        {/* Hero */}
        <section className="py-20 bg-gradient-to-b from-cream-100 to-white text-center px-4">
          <div className="max-w-3xl mx-auto space-y-4">
            <span className="text-xs uppercase tracking-wider font-bold text-amber-800 block">
              The RoastFuze Story
            </span>
            <h1 className="font-serif text-4xl sm:text-5xl font-extrabold text-stone-900 leading-tight">
              A Symphony of Fresh Coffee Roasts & Musical Balcony Evenings
            </h1>
            <p className="text-stone-600 text-base sm:text-lg leading-relaxed">
              RoastFuze Coffee Bar was founded on a simple passion: to bring together authentic specialty coffee roasts and Jaipur’s most atmospheric open-air musical balcony in Vaishali Nagar.
            </p>
          </div>
        </section>

        {/* Content Highlights */}
        <section className="py-16 bg-white border-y border-stone-200/60">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="p-8 rounded-3xl bg-cream-100 border border-cream-200 space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-900 text-cream-100 flex items-center justify-center">
                  <Coffee className="w-6 h-6 text-amber-200" />
                </div>
                <h3 className="font-serif font-bold text-xl text-stone-900">Artisan Coffee Craft</h3>
                <p className="text-stone-600 text-sm leading-relaxed">
                  We treat coffee roasting as an art. From golden crema espresso pulls and micro-foamed lattes to thick ice-cream blended frappes, every cup is crafted with obsessive attention to temperature and flavor profile.
                </p>
              </div>

              <div className="p-8 rounded-3xl bg-cream-100 border border-cream-200 space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-900 text-cream-100 flex items-center justify-center">
                  <Music className="w-6 h-6 text-amber-200" />
                </div>
                <h3 className="font-serif font-bold text-xl text-stone-900">Musical Balcony Sessions</h3>
                <p className="text-stone-600 text-sm leading-relaxed">
                  Perched high above Gandhi Path West, our balcony hosts regular live acoustic performances, open mic sessions, and artist hours for Jaipur’s musical soul.
                </p>
              </div>

              <div className="p-8 rounded-3xl bg-cream-100 border border-cream-200 space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-900 text-cream-100 flex items-center justify-center">
                  <Heart className="w-6 h-6 text-amber-200" />
                </div>
                <h3 className="font-serif font-bold text-xl text-stone-900">Comforting Gourmet Fare</h3>
                <p className="text-stone-600 text-sm leading-relaxed">
                  Stone-baked 8-inch pizzas, creamy Alfredo penne, warm Nutella Belgian waffles, and crispy Peri Peri fries. Cooked fresh when ordered from your table.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Story Section */}
        <section className="py-20 bg-cream-50">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 text-stone-700 leading-relaxed">
            <h2 className="font-serif text-3xl font-bold text-stone-900">Our Home in Vaishali Nagar</h2>
            <p>
              Located in Vivek Vihar on Lalarpura Road (just off Gandhi Path West), RoastFuze is your friendly neighborhood hub. Whether you are seeking a quiet corner with high-speed WiFi for daytime laptop sessions, a romantic sunset balcony view, or an energetic evening surrounded by acoustic guitar chords, our doors are open 7 days a week from 10:00 AM to 11:00 PM.
            </p>
            <p>
              With our digital QR menu system, there's no waiting in long queues. Simply scan the token at your table, browse our live kitchen menu, and receive hot food and cold brews delivered straight to your seat.
            </p>
            <div className="pt-4 flex gap-4">
              <Link
                to="/menu"
                className="inline-flex items-center gap-2 bg-stone-900 text-white px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-stone-800 transition-all shadow-sm"
              >
                <UtensilsCrossed className="w-4 h-4 text-amber-300" />
                <span>Explore Balcony Menu</span>
              </Link>
              <Link
                to="/contact"
                className="inline-flex items-center gap-2 bg-white text-stone-800 border border-stone-300 px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-stone-100 transition-all"
              >
                <span>Find Our Balcony</span>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};
