import React, { useState } from 'react';
import { Gift, Search, UtensilsCrossed, Coffee, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Navbar } from '../../components/layout/Navbar';
import { Footer } from '../../components/layout/Footer';
import { api } from '../../services/api';

type LoyaltyBalance = {
  phone: string;
  name?: string | null;
  foodPoints: number;
  coffeePoints: number;
  lifetimeFoodPoints: number;
  lifetimeCoffeePoints: number;
  foodPointsValue: number;
  coffeePointsValue: number;
  earnRate: { food: string; coffee: string };
};

export const LoyaltyPage: React.FC = () => {
  const [phone, setPhone] = useState('');
  const [balance, setBalance] = useState<LoyaltyBalance | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const checkBalance = async (event: React.FormEvent) => {
    event.preventDefault();
    if (phone.replace(/\D/g, '').length < 10) {
      setError('Please enter a valid 10-digit phone number.');
      setBalance(null);
      return;
    }
    try {
      setLoading(true);
      setError('');
      setBalance(await api.getLoyaltyBalance(phone));
    } catch (err: any) {
      setError(err.message || 'Unable to check points right now.');
      setBalance(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream-100 flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-14">
        <div className="max-w-xl mx-auto text-center mb-10">
          <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-900 flex items-center justify-center mx-auto mb-4">
            <Gift className="w-7 h-7" />
          </div>
          <p className="text-xs uppercase tracking-[0.2em] font-bold text-amber-800 mb-2">RoastFuze Rewards Club</p>
          <h1 className="font-serif text-4xl font-bold text-stone-900">Check your points</h1>
          <p className="text-sm text-stone-600 mt-3">No login needed. Enter the phone number used at checkout.</p>
        </div>

        <form onSubmit={checkBalance} className="max-w-xl mx-auto bg-white rounded-3xl border border-stone-200 p-5 sm:p-7 shadow-soft">
          <label className="text-xs uppercase tracking-wider font-bold text-stone-600 block mb-2">Mobile number</label>
          <div className="flex gap-2">
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              type="tel"
              inputMode="tel"
              placeholder="98765 43210"
              className="min-w-0 flex-1 px-4 py-3 rounded-xl border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-nature-800"
            />
            <button disabled={loading} className="inline-flex items-center gap-2 bg-nature-900 text-white px-5 rounded-xl text-sm font-bold disabled:opacity-60">
              <Search className="w-4 h-4" /> {loading ? 'Checking...' : 'Check'}
            </button>
          </div>
          {error && <p className="text-xs text-red-700 mt-3">{error}</p>}
        </form>

        {balance && (
          <section className="max-w-xl mx-auto mt-6 space-y-4">
            <div className="bg-nature-950 text-white rounded-3xl p-6">
              <p className="text-sm text-nature-200">Welcome back{balance.name ? `, ${balance.name}` : ''}!</p>
              <p className="font-serif text-2xl font-bold mt-1">Your available rewards</p>
              <div className="grid grid-cols-2 gap-3 mt-6">
                <div className="bg-white/10 rounded-2xl p-4"><UtensilsCrossed className="w-5 h-5 text-emerald-300" /><p className="text-xs text-nature-200 mt-3">Food points</p><p className="text-3xl font-bold">{balance.foodPoints}</p><p className="text-[11px] text-nature-300">Worth ₹{balance.foodPointsValue}</p></div>
                <div className="bg-white/10 rounded-2xl p-4"><Coffee className="w-5 h-5 text-amber-300" /><p className="text-xs text-nature-200 mt-3">Coffee points</p><p className="text-3xl font-bold">{balance.coffeePoints}</p><p className="text-[11px] text-nature-300">Worth ₹{balance.coffeePointsValue}</p></div>
              </div>
            </div>
            <div className="bg-white rounded-3xl border border-stone-200 p-5 text-sm text-stone-600 space-y-2">
              <p><strong className="text-stone-900">🍔 Food:</strong> {balance.earnRate.food}</p>
              <p><strong className="text-stone-900">☕ Coffee:</strong> {balance.earnRate.coffee}</p>
              <p className="text-xs text-stone-400 pt-2 border-t border-stone-100">Lifetime earned: {balance.lifetimeFoodPoints} food · {balance.lifetimeCoffeePoints} coffee</p>
            </div>
          </section>
        )}

        <div className="text-center mt-8"><Link to="/menu" className="inline-flex items-center gap-2 text-sm font-bold text-nature-900 hover:underline">Order and earn more <ArrowRight className="w-4 h-4" /></Link></div>
      </main>
      <Footer />
    </div>
  );
};
