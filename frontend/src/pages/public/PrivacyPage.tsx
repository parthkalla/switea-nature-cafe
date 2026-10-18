import React from 'react';
import { Navbar } from '../../components/layout/Navbar';
import { Footer } from '../../components/layout/Footer';

export const PrivacyPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-cream-100 flex flex-col selection:bg-nature-200">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-16 flex-1 w-full bg-white rounded-3xl my-10 border border-stone-200 p-8 sm:p-12 shadow-soft space-y-6 text-stone-700 leading-relaxed">
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-stone-900">Privacy Policy</h1>
        <p className="text-xs text-stone-400">Last updated: October 2026</p>

        <section className="space-y-3">
          <h2 className="font-serif text-xl font-bold text-stone-800">1. Information We Collect</h2>
          <p className="text-sm">
            At Switea Nature Cafe, we respect your privacy. When using our digital QR table ordering system, you may provide your name and phone number to track orders and receive preparation updates. We do not require customer accounts for simple table ordering.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-serif text-xl font-bold text-stone-800">2. How We Use Your Data</h2>
          <p className="text-sm">
            We use collected dining information solely to fulfill food preparation, associate your tray with the correct table, process verified payments, and calculate aggregated cafe sales metrics.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-serif text-xl font-bold text-stone-800">3. Contact Us</h2>
          <p className="text-sm">
            If you have questions about your data, please contact hello@switeanaturecafe.com or visit us in Jaipur.
          </p>
        </section>
      </main>
      <Footer />
    </div>
  );
};
