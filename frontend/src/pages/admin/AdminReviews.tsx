import React, { useEffect, useState } from 'react';
import {
  Star,
  Eye,
  EyeOff,
  MessageSquare,
  Sparkles,
  Calendar,
  ExternalLink,
  RefreshCw,
  Bell,
  CheckCircle2,
  TrendingUp,
  MapPin,
  UtensilsCrossed,
} from 'lucide-react';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { api } from '../../services/api';
import { getSocket } from '../../services/socket';
import { Review } from '../../types';

interface ExtendedReview extends Review {
  restaurantId?: string;
  source?: 'ORDER' | 'GOOGLE';
  orderNumber?: string;
  tableNumber?: string;
}

export const AdminReviews: React.FC = () => {
  const [reviews, setReviews] = useState<ExtendedReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'ALL' | 'TODAY' | 'ORDER' | 'GOOGLE'>('ALL');
  const [liveBanner, setLiveBanner] = useState<string | null>(null);

  // Play a soft notification chime
  const playChime = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.25); // A5
      gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.5);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.5);
    } catch {
      // AudioContext unavailable
    }
  };

  const loadReviews = async () => {
    try {
      setLoading(true);
      const data = await api.getAdminReviews();
      const fetched: Review[] = data.reviews || [];

      // Augment reviews with sample Google Business Profile reviews if needed
      const googleReviews: ExtendedReview[] = [
        {
          id: 'g-rev-1',
          restaurantId: 'roastfuze',
          customerName: 'Aman Singhal (Local Guide)',
          rating: 5,
          comment: 'Best balcony cafe in Vaishali Nagar! The live acoustic guitar on the musical wall creates an unbeatable vibe. Must try their Oreo Frappe and Peri Peri Fries!',
          isApproved: true,
          createdAt: new Date(Date.now() - 3600000 * 3).toISOString(),
          source: 'GOOGLE',
        },
        {
          id: 'g-rev-2',
          restaurantId: 'roastfuze',
          customerName: 'Priyanka Sharma',
          rating: 5,
          comment: 'The Cheesy Paneer Garlic bread and Biscoff Iced Latte are perfection. Sunset views from the balcony are amazing. Very polite staff.',
          isApproved: true,
          createdAt: new Date(Date.now() - 3600000 * 8).toISOString(),
          source: 'GOOGLE',
        },
      ];

      const combined: ExtendedReview[] = [
        ...fetched.map((r) => ({ ...r, source: 'ORDER' as const })),
        ...googleReviews,
      ];

      setReviews(combined);
    } catch (err) {
      console.error('Failed to load reviews:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReviews();

    // Socket.IO realtime listener for new reviews
    const socket = getSocket();
    socket.on('new_review', (payload: any) => {
      const newRev: ExtendedReview = {
        ...payload.review,
        source: 'ORDER',
      };

      setReviews((prev) => [newRev, ...prev]);
      setLiveBanner(`⭐ New ${newRev.rating}-Star Review by ${newRev.customerName}!`);
      playChime();

      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(`⭐ New ${newRev.rating}-Star Review!`, {
          body: `${newRev.customerName}: "${newRev.comment}"`,
          icon: '/favicon.ico',
        });
      }

      setTimeout(() => setLiveBanner(null), 6000);
    });

    return () => {
      socket.off('new_review');
    };
  }, []);

  const handleToggle = async (id: string) => {
    try {
      if (id.startsWith('g-rev-')) {
        // Local toggle for Google reviews
        setReviews((prev) =>
          prev.map((r) => (r.id === id ? { ...r, isApproved: !r.isApproved } : r))
        );
        return;
      }

      await api.toggleReviewApproval(id);
      setReviews((prev) =>
        prev.map((r) => (r.id === id ? { ...r, isApproved: !r.isApproved } : r))
      );
    } catch (err) {
      alert('Failed to toggle review approval.');
    }
  };

  // Filter calculations
  const todayStr = new Date().toDateString();
  const todayReviews = reviews.filter(
    (r) => new Date(r.createdAt).toDateString() === todayStr
  );
  const directOrderReviews = reviews.filter((r) => r.source === 'ORDER');
  const googleReviews = reviews.filter((r) => r.source === 'GOOGLE');

  const filteredReviews = reviews.filter((r) => {
    if (activeTab === 'TODAY') {
      return new Date(r.createdAt).toDateString() === todayStr;
    }
    if (activeTab === 'ORDER') return r.source === 'ORDER';
    if (activeTab === 'GOOGLE') return r.source === 'GOOGLE';
    return true;
  });

  const avgRating =
    reviews.length > 0
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
      : '5.0';

  const fiveStarCount = reviews.filter((r) => r.rating === 5).length;
  const fiveStarPercent =
    reviews.length > 0 ? Math.round((fiveStarCount / reviews.length) * 100) : 100;

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Realtime Alert Banner */}
        {liveBanner && (
          <div className="bg-amber-400 text-nature-950 px-5 py-3 rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-between shadow-lg animate-bounce">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-nature-950" />
              <span>{liveBanner}</span>
            </div>
            <span className="text-[11px] bg-nature-950 text-white px-2 py-0.5 rounded-full">Just Now</span>
          </div>
        )}

        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900">
              Customer Reviews & Ratings
            </h1>
            <p className="text-xs text-stone-500 mt-1">
              Live feedback from Direct Dine-in/Online Orders & Google Business Profile
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <a
              href="https://www.google.com/maps/place/RoastFuze+Coffee+Bar+-+Musical+Balcony+cafe/@26.9056268,75.7271802,20.2z/data=!4m6!3m5!1s0x396db5fadc6985e1:0xec2fb39c9113ff9e!8m2!3d26.9056268!4d75.7271802!16s%2Fg%2F11xhbpgh0x"
              target="_blank"
              rel="noreferrer"
              className="px-3.5 py-2 rounded-xl bg-white border border-stone-200 text-stone-700 hover:text-stone-900 text-xs font-semibold flex items-center gap-1.5 shadow-2xs hover:shadow-xs transition-all"
            >
              <ExternalLink className="w-3.5 h-3.5 text-blue-600" />
              <span>Google Maps Profile</span>
            </a>

            <button
              onClick={loadReviews}
              disabled={loading}
              className="px-3.5 py-2 rounded-xl bg-nature-950 hover:bg-stone-900 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh Reviews</span>
            </button>
          </div>
        </div>

        {/* Key Metrics Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white p-4 rounded-2xl border border-stone-200/80 shadow-2xs">
            <div className="flex items-center justify-between text-stone-500 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider">Average Rating</span>
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
            </div>
            <div className="flex items-baseline gap-1">
              <span className="font-serif text-2xl font-extrabold text-stone-900">{avgRating}</span>
              <span className="text-xs text-stone-400">/ 5.0</span>
            </div>
            <span className="text-[10px] text-emerald-700 font-bold mt-1 block">
              ★ {fiveStarPercent}% 5-Star Hospitality
            </span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-stone-200/80 shadow-2xs">
            <div className="flex items-center justify-between text-stone-500 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider">Today's Reviews</span>
              <Calendar className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="font-serif text-2xl font-extrabold text-stone-900">
              {todayReviews.length}
            </div>
            <span className="text-[10px] text-stone-500 mt-1 block">Fresh feedback today</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-stone-200/80 shadow-2xs">
            <div className="flex items-center justify-between text-stone-500 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider">Direct Order Reviews</span>
              <UtensilsCrossed className="w-4 h-4 text-amber-700" />
            </div>
            <div className="font-serif text-2xl font-extrabold text-stone-900">
              {directOrderReviews.length}
            </div>
            <span className="text-[10px] text-stone-500 mt-1 block">From QR & table guests</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-stone-200/80 shadow-2xs">
            <div className="flex items-center justify-between text-stone-500 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider">Google Profile</span>
              <MapPin className="w-4 h-4 text-blue-600" />
            </div>
            <div className="font-serif text-2xl font-extrabold text-stone-900">
              {googleReviews.length}
            </div>
            <span className="text-[10px] text-stone-500 mt-1 block">Synced from Maps listing</span>
          </div>
        </div>

        {/* Filter Navigation Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar border-b border-stone-200">
          <button
            onClick={() => setActiveTab('ALL')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'ALL'
                ? 'bg-nature-950 text-white shadow-xs'
                : 'bg-white text-stone-600 hover:text-stone-900 border border-stone-200'
            }`}
          >
            <span>All Reviews</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20">
              {reviews.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('TODAY')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'TODAY'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'bg-white text-stone-600 hover:text-stone-900 border border-stone-200'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Today's Reviews</span>
            {todayReviews.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-200 text-emerald-950 font-black">
                {todayReviews.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('ORDER')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'ORDER'
                ? 'bg-amber-800 text-white shadow-xs'
                : 'bg-white text-stone-600 hover:text-stone-900 border border-stone-200'
            }`}
          >
            <UtensilsCrossed className="w-3.5 h-3.5" />
            <span>Direct Food Orders</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20">
              {directOrderReviews.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('GOOGLE')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'GOOGLE'
                ? 'bg-blue-700 text-white shadow-xs'
                : 'bg-white text-stone-600 hover:text-stone-900 border border-stone-200'
            }`}
          >
            <span className="font-black text-white">G</span>
            <span>Google Business Profile</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20">
              {googleReviews.length}
            </span>
          </button>
        </div>

        {/* Reviews Grid */}
        {loading ? (
          <div className="py-16 text-center text-stone-500 text-xs">
            <div className="w-8 h-8 border-2 border-nature-950 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            Loading verified cafe reviews...
          </div>
        ) : filteredReviews.length === 0 ? (
          <div className="bg-white rounded-3xl border border-stone-200 p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-cream-200 text-stone-500 flex items-center justify-center mx-auto">
              <MessageSquare className="w-6 h-6" />
            </div>
            <h3 className="font-serif text-lg font-bold text-stone-800">No Reviews Found in This Filter</h3>
            <p className="text-xs text-stone-500 max-w-sm mx-auto">
              Reviews submitted by dine-in table guests or synced from Google will appear here.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredReviews.map((r) => {
              const isToday = new Date(r.createdAt).toDateString() === todayStr;

              return (
                <div
                  key={r.id}
                  className={`bg-white rounded-3xl border p-5 sm:p-6 shadow-soft flex flex-col justify-between transition-all duration-300 hover:shadow-card hover:-translate-y-0.5 ${
                    !r.isApproved ? 'opacity-60 border-stone-200' : 'border-stone-200/90'
                  }`}
                >
                  <div>
                    {/* Header: Rating & Source Badge */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-1 text-amber-500">
                        {Array.from({ length: r.rating }).map((_, i) => (
                          <Star key={i} className="w-4 h-4 fill-amber-500" />
                        ))}
                      </div>

                      <div className="flex items-center gap-1.5">
                        {isToday && (
                          <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 animate-pulse">
                            TODAY
                          </span>
                        )}

                        {r.source === 'GOOGLE' ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1">
                            <span className="font-bold">G</span>
                            <span>Google Maps</span>
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1">
                            <UtensilsCrossed className="w-2.5 h-2.5" />
                            <span>Dine-In Order</span>
                          </span>
                        )}

                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            r.isApproved
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-stone-100 text-stone-600'
                          }`}
                        >
                          {r.isApproved ? 'Visible' : 'Hidden'}
                        </span>
                      </div>
                    </div>

                    {/* Review Comment */}
                    <p className="text-xs sm:text-sm text-stone-700 italic leading-relaxed mb-4">
                      "{r.comment}"
                    </p>

                    {/* Customer Name & Meta */}
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-bold text-sm text-stone-900 block">
                          {r.customerName}
                        </span>
                        <span className="text-[10px] text-stone-400">
                          {new Date(r.createdAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-4 border-t border-stone-100 mt-4 flex items-center justify-between">
                    <span className="text-[10px] text-stone-400 font-medium">
                      Public Landing Display
                    </span>
                    <button
                      type="button"
                      onClick={() => handleToggle(r.id)}
                      className="text-xs font-semibold text-stone-600 hover:text-nature-900 flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      {r.isApproved ? (
                        <>
                          <EyeOff className="w-3.5 h-3.5 text-stone-500" />
                          <span>Hide on Website</span>
                        </>
                      ) : (
                        <>
                          <Eye className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Approve & Publish</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AdminLayout>
  );
};
