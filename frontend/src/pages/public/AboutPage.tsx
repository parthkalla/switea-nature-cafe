import React from 'react';
import { Link } from 'react-router-dom';
import { Leaf, Heart, Coffee, UtensilsCrossed, Sparkles } from 'lucide-react';
import { Navbar } from '../../components/layout/Navbar';
import { Footer } from '../../components/layout/Footer';

export const AboutPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-cream-100 flex flex-col selection:bg-nature-200">
      <Navbar />

      <main className="flex-1">
        {/* Hero */}
        <section className="py-20 bg-gradient-to-b from-cream-100 to-white text-center px-4">
          <div className="max-w-3xl mx-auto space-y-4">
            <span className="text-xs uppercase tracking-wider font-bold text-nature-700 block">
              The Switea Philosophy
            </span>
            <h1 className="font-serif text-4xl sm:text-5xl font-extrabold text-stone-900 leading-tight">
              A Symphony of Earthen Warmth & Lush Green Calm
            </h1>
            <p className="text-stone-600 text-base sm:text-lg leading-relaxed">
              Switea Nature Cafe (also known as Switea Garden Cafe) was built to offer Jaipur a peaceful breath of fresh air — blending timeless Indian tea rituals with gourmet cafe delights in an enchanting garden sanctuary.
            </p>
          </div>
        </section>

        {/* Content Highlights */}
        <section className="py-16 bg-white border-y border-stone-200/60">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="p-8 rounded-3xl bg-cream-100 border border-cream-200 space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-nature-900 text-cream-100 flex items-center justify-center">
                  <Coffee className="w-6 h-6 text-nature-300" />
                </div>
                <h3 className="font-serif font-bold text-xl text-stone-900">Terracotta Kulhads</h3>
                <p className="text-stone-600 text-sm leading-relaxed">
                  Drinking tea from an unglazed clay kulhad connects us to centuries of Indian heritage, infusing every sip with subtle minerality and earthy warmth.
                </p>
              </div>

              <div className="p-8 rounded-3xl bg-cream-100 border border-cream-200 space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-nature-900 text-cream-100 flex items-center justify-center">
                  <Leaf className="w-6 h-6 text-nature-300" />
                </div>
                <h3 className="font-serif font-bold text-xl text-stone-900">Serene Garden Foliage</h3>
                <p className="text-stone-600 text-sm leading-relaxed">
                  Surrounded by potted flora, hanging greenery, and outdoor garden canopies, our space was thoughtfully arranged to soothe the senses away from urban rush.
                </p>
              </div>

              <div className="p-8 rounded-3xl bg-cream-100 border border-cream-200 space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-nature-900 text-cream-100 flex items-center justify-center">
                  <Heart className="w-6 h-6 text-nature-300" />
                </div>
                <h3 className="font-serif font-bold text-xl text-stone-900">Honest Comfort Food</h3>
                <p className="text-stone-600 text-sm leading-relaxed">
                  From slow-simmered Masala Maggi to hand-tossed artisan pizzas and crispy Kurkure Momos, every plate is cooked fresh when ordered.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Call to Action */}
        <section className="py-20 bg-cream-100 text-center px-4">
          <div className="max-w-2xl mx-auto space-y-6">
            <h2 className="font-serif text-3xl font-bold text-stone-900">
              Ready to Sip Something Sweet?
            </h2>
            <p className="text-stone-600 text-sm">
              Visit our Jaipur cafe or browse our full digital menu right now.
            </p>
            <Link
              to="/menu"
              className="inline-flex items-center gap-2 bg-nature-900 text-white px-8 py-3.5 rounded-full font-bold text-sm shadow hover:bg-nature-950 transition-colors"
            >
              <UtensilsCrossed className="w-4 h-4 text-nature-300" />
              <span>Explore Digital Menu</span>
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};
