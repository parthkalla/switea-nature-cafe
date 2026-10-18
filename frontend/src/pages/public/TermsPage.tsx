import React from 'react';
import { Navbar } from '../../components/layout/Navbar';
import { Footer } from '../../components/layout/Footer';

export const TermsPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-cream-100 flex flex-col selection:bg-nature-200">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-16 flex-1 w-full bg-white rounded-3xl my-10 border border-stone-200 p-8 sm:p-12 shadow-soft space-y-6 text-stone-700 leading-relaxed">
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-stone-900">Terms & Conditions</h1>
        <p className="text-xs text-stone-400">Last updated: October 2026</p>

        <section className="space-y-3">
          <h2 className="font-serif text-xl font-bold text-stone-800">1. Ordering & Dine-In Guidelines</h2>
          <p className="text-sm">
            By scanning a Switea table QR code or placing a digital order, you agree to submit genuine orders intended for consumption at the designated table. Prices and item availability are resolved directly from our live kitchen database.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-serif text-xl font-bold text-stone-800">2. Cancellations & Adjustments</h2>
          <p className="text-sm">
            Once an order is accepted and entered into active preparation by our chef, cancellations can only be accommodated by notifying our floor staff directly.
          </p>
        </section>
      </main>
      <Footer />
    </div>
  );
};
