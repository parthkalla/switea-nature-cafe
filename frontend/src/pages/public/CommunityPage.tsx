import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  Music,
  Calendar,
  Clock,
  MapPin,
  Gift,
  Award,
  Crown,
  Coffee,
  Heart,
  Send,
  CheckCircle2,
  AlertCircle,
  Users,
  Flame,
  ArrowRight,
  Disc,
} from 'lucide-react';
import { Navbar } from '../../components/layout/Navbar';
import { Footer } from '../../components/layout/Footer';
import { api } from '../../services/api';
import { getSocket } from '../../services/socket';

export const CommunityPage: React.FC = () => {
  const [events, setEvents] = useState<any[]>([]);
  const [songRequests, setSongRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // RSVP Modal
  const [rsvpModalEvent, setRsvpModalEvent] = useState<any | null>(null);
  const [rsvpName, setRsvpName] = useState('');
  const [rsvpPhone, setRsvpPhone] = useState('');
  const [rsvpGuests, setRsvpGuests] = useState(2);
  const [rsvpNotes, setRsvpNotes] = useState('');
  const [submittingRsvp, setSubmittingRsvp] = useState(false);
  const [rsvpSuccess, setRsvpSuccess] = useState(false);

  // Song Request Form
  const [songName, setSongName] = useState('');
  const [songArtist, setSongArtist] = useState('');
  const [custName, setCustName] = useState('');
  const [tableNum, setTableNum] = useState('');
  const [songNotes, setSongNotes] = useState('');
  const [submittingSong, setSubmittingSong] = useState(false);
  const [songSuccessMsg, setSongSuccessMsg] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const evRes = await api.getCommunityEvents();
      setEvents(evRes.events || []);

      const sqRes = await api.getSongRequests();
      setSongRequests(sqRes.requests || []);
    } catch (err) {
      console.error('Failed to load community data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    // Listen for live song requests
    const socket = getSocket();
    socket.on('new_song_request', (req: any) => {
      setSongRequests((prev) => [req, ...prev.filter((p) => p.id !== req.id)]);
    });

    socket.on('song_request_updated', (req: any) => {
      setSongRequests((prev) => prev.map((p) => (p.id === req.id ? req : p)));
    });

    return () => {
      socket.off('new_song_request');
      socket.off('song_request_updated');
    };
  }, []);

  const handleRsvpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rsvpName.trim() || !rsvpPhone.trim()) return;

    try {
      setSubmittingRsvp(true);
      await api.createEventRsvp({
        eventId: rsvpModalEvent.id,
        eventTitle: rsvpModalEvent.title,
        name: rsvpName.trim(),
        phone: rsvpPhone.trim(),
        guestsCount: Number(rsvpGuests),
        notes: rsvpNotes.trim() || undefined,
      });
      setRsvpSuccess(true);
      setTimeout(() => {
        setRsvpModalEvent(null);
        setRsvpSuccess(false);
        setRsvpName('');
        setRsvpPhone('');
      }, 2500);
    } catch (err) {
      alert('Failed to register RSVP. Please try again.');
    } finally {
      setSubmittingRsvp(false);
    }
  };

  const handleSongSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!songName.trim() || !custName.trim()) return;

    try {
      setSubmittingSong(true);
      setSongSuccessMsg(null);
      await api.createSongRequest({
        customerName: custName.trim(),
        tableNumber: tableNum.trim() || 'Balcony Guest',
        songTitle: songName.trim(),
        artist: songArtist.trim() || 'Indie / Acoustic',
        notes: songNotes.trim() || undefined,
      });

      setSongSuccessMsg('Song requested! Our barista will queue it up on the balcony sound system.');
      setSongName('');
      setSongArtist('');
      setSongNotes('');
      setTimeout(() => setSongSuccessMsg(null), 5000);
    } catch (err) {
      alert('Failed to submit song request.');
    } finally {
      setSubmittingSong(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-100 flex flex-col selection:bg-amber-200">
      <Navbar />

      {/* Hero Header */}
      <section className="relative bg-nature-950 text-white py-16 sm:py-24 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Background Ambient Glows */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-emerald-600/20 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-5xl mx-auto text-center relative z-10 space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold uppercase tracking-widest">
            <Sparkles className="w-3.5 h-3.5" />
            <span>The Musical Balcony Club & Community</span>
          </div>

          <h1 className="font-serif text-3xl sm:text-5xl font-black text-white leading-tight">
            Live Music, Balcony Sunsets <br />
            <span className="text-amber-400 font-serif italic">&amp; VIP Regulars Club</span>
          </h1>

          <p className="max-w-2xl mx-auto text-stone-300 text-xs sm:text-sm leading-relaxed">
            Welcome to RoastFuze Coffee Bar’s creative sanctuary in Vaishali Nagar, Jaipur. Join our festive acoustic nights, earn Super Customer status, and request live songs for the balcony.
          </p>

          <div className="pt-4 flex flex-wrap items-center justify-center gap-3">
            <a
              href="#events"
              className="bg-amber-500 hover:bg-amber-400 text-nature-950 font-bold text-xs sm:text-sm px-6 py-3 rounded-full shadow-lg transition-all"
            >
              Upcoming Events &amp; Diwali Night 🪔
            </a>
            <a
              href="#super-customers"
              className="bg-white/10 hover:bg-white/20 text-white font-bold text-xs sm:text-sm px-6 py-3 rounded-full border border-white/20 transition-all"
            >
              VIP Customer Tiers 👑
            </a>
            <a
              href="#song-request"
              className="bg-white/10 hover:bg-white/20 text-white font-bold text-xs sm:text-sm px-6 py-3 rounded-full border border-white/20 transition-all flex items-center gap-1.5"
            >
              <Music className="w-3.5 h-3.5" />
              <span>Song Request</span>
            </a>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex-1 space-y-16 w-full">
        {/* Section 1: Upcoming Events & Festivities */}
        <section id="events" className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 pb-3 border-b border-stone-200">
            <div>
              <span className="text-xs font-extrabold uppercase tracking-widest text-amber-800 flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                <span>Live On The Balcony</span>
              </span>
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900 mt-1">
                Upcoming Cafe Experiences
              </h2>
            </div>
            <p className="text-xs text-stone-500">
              Free entry for cafe patrons • Limited balcony railing seating
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {events.map((ev) => (
              <div
                key={ev.id}
                className="bg-white rounded-3xl border border-stone-200 overflow-hidden shadow-card hover:shadow-xl transition-all flex flex-col group"
              >
                <div className="h-44 bg-stone-900 relative overflow-hidden">
                  <img
                    src={ev.image || '/uploads/gallery_musical_interior.jpg'}
                    alt={ev.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <span className="absolute top-3 left-3 bg-amber-500 text-nature-950 text-[10px] font-extrabold uppercase tracking-wider px-3 py-1 rounded-full shadow-sm">
                    {ev.badge}
                  </span>
                  <div className="absolute bottom-3 left-3 right-3 text-white">
                    <span className="text-[11px] font-semibold text-amber-300 block">
                      {ev.date} • {ev.time}
                    </span>
                  </div>
                </div>

                <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    <h3 className="font-serif text-lg font-bold text-stone-900 group-hover:text-amber-900 transition-colors">
                      {ev.title}
                    </h3>
                    <p className="text-xs text-stone-500 mt-2 leading-relaxed">
                      {ev.description}
                    </p>
                  </div>

                  <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200/80 space-y-1">
                    <span className="text-[10px] uppercase font-bold text-amber-900 tracking-wider flex items-center gap-1">
                      <Gift className="w-3 h-3 text-amber-700" />
                      <span>Special Balcony Offer</span>
                    </span>
                    <p className="text-xs font-semibold text-stone-800">
                      {ev.offerText}
                    </p>
                    {ev.couponCode && (
                      <div className="pt-1 flex items-center justify-between text-[11px]">
                        <span className="text-stone-500">Coupon:</span>
                        <span className="font-mono font-bold text-amber-900 bg-white px-2 py-0.5 rounded border border-amber-200">
                          {ev.couponCode} ({ev.discountPercent}% OFF)
                        </span>
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => setRsvpModalEvent(ev)}
                    className="w-full bg-nature-950 hover:bg-stone-900 text-white text-xs font-bold py-3 rounded-xl shadow-sm transition-all flex items-center justify-center gap-1.5"
                  >
                    <span>RSVP / Reserve Balcony Table</span>
                    <ArrowRight className="w-3.5 h-3.5 text-amber-400" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Section 2: The VIP Tiers & Super Customer Badges */}
        <section id="super-customers" className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-10 shadow-card space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-extrabold uppercase tracking-widest text-amber-800 flex items-center justify-center gap-1.5">
              <Crown className="w-4 h-4 text-amber-600" />
              <span>Customer Loyalty &amp; VIP Badges</span>
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900">
              The RoastFuze VIP Tiers
            </h2>
            <p className="text-xs text-stone-500">
              Every order earns you points and progresses you towards the prestigious <strong>Super Customer</strong> badge!
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Tier 1 */}
            <div className="p-6 rounded-3xl bg-cream-50 border border-stone-200 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-3xl">🥉</span>
                <span className="text-[10px] font-bold bg-stone-200 text-stone-700 px-2.5 py-0.5 rounded-full">
                  1 – 4 Visits
                </span>
              </div>
              <div>
                <h3 className="font-serif text-lg font-bold text-stone-900">Balcony Regular</h3>
                <p className="text-xs text-stone-500 mt-1">For our valued neighborhood coffee lovers.</p>
              </div>
              <ul className="text-xs text-stone-600 space-y-2 pt-2 border-t border-stone-200/60">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                  <span>Dual Loyalty Points (☕ + 🍔) on every order</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                  <span>10% Reward Value (1 Point = ₹1)</span>
                </li>
              </ul>
            </div>

            {/* Tier 2 */}
            <div className="p-6 rounded-3xl bg-cream-50 border border-stone-200 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-3xl">🥈</span>
                <span className="text-[10px] font-bold bg-amber-100 text-amber-900 px-2.5 py-0.5 rounded-full">
                  5 – 9 Visits
                </span>
              </div>
              <div>
                <h3 className="font-serif text-lg font-bold text-stone-900">Coffee Connoisseur</h3>
                <p className="text-xs text-stone-500 mt-1">Passionate about great roasts &amp; live music.</p>
              </div>
              <ul className="text-xs text-stone-600 space-y-2 pt-2 border-t border-stone-200/60">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                  <span>Complimentary Flavored Syrup upgrade</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                  <span>15% Special Birthday Celebration discount</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                  <span>Early RSVP access to Jam Nights</span>
                </li>
              </ul>
            </div>

            {/* Tier 3: Super Customer */}
            <div className="p-6 rounded-3xl bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-emerald-500/10 border-2 border-amber-400 space-y-4 relative shadow-md">
              <span className="absolute -top-3 right-6 bg-amber-500 text-nature-950 text-[10px] font-extrabold uppercase tracking-wider px-3 py-0.5 rounded-full shadow-sm">
                Top Honor 👑
              </span>
              <div className="flex items-center justify-between">
                <span className="text-3xl">🥇</span>
                <span className="text-[10px] font-bold bg-amber-200 text-amber-950 px-2.5 py-0.5 rounded-full">
                  10+ Visits
                </span>
              </div>
              <div>
                <h3 className="font-serif text-lg font-bold text-stone-900 flex items-center gap-1.5">
                  <span>Super Customer</span>
                </h3>
                <p className="text-xs text-amber-900 font-medium mt-1">
                  The true legends of the RoastFuze Balcony!
                </p>
              </div>
              <ul className="text-xs text-stone-700 space-y-2 pt-2 border-t border-amber-200">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-700 flex-shrink-0" />
                  <span><strong>Reserved Balcony Sunset Railing Table</strong> on priority call</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-700 flex-shrink-0" />
                  <span>Free Gourmet Shake or Dessert on every 10th visit</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-700 flex-shrink-0" />
                  <span>Direct WhatsApp VIP Concierge for table reservations</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Section 3: Interactive Balcony Song Request */}
        <section id="song-request" className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-6 bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-card space-y-5">
            <div>
              <span className="text-xs font-extrabold uppercase tracking-widest text-emerald-800 flex items-center gap-1.5">
                <Disc className="w-4 h-4 text-emerald-700" />
                <span>Balcony Live Sound Desk</span>
              </span>
              <h2 className="font-serif text-2xl font-bold text-stone-900 mt-1">
                Request a Song to the Barista
              </h2>
              <p className="text-xs text-stone-500 mt-1">
                Sitting on the musical balcony? Request your favorite song to play on the cafe speakers.
              </p>
            </div>

            {songSuccessMsg && (
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>{songSuccessMsg}</span>
              </div>
            )}

            <form onSubmit={handleSongSubmit} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-stone-600 block mb-1">Your Name</label>
                  <input
                    type="text"
                    required
                    value={custName}
                    onChange={(e) => setCustName(e.target.value)}
                    placeholder="e.g. Parth"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-nature-800"
                  />
                </div>
                <div>
                  <label className="font-bold text-stone-600 block mb-1">Table Number</label>
                  <input
                    type="text"
                    value={tableNum}
                    onChange={(e) => setTableNum(e.target.value)}
                    placeholder="e.g. Table B01"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-nature-800"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-stone-600 block mb-1">Song Name</label>
                <input
                  type="text"
                  required
                  value={songName}
                  onChange={(e) => setSongName(e.target.value)}
                  placeholder="e.g. Iktara / Hotel California / Kesariya"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-nature-800"
                />
              </div>

              <div>
                <label className="font-bold text-stone-600 block mb-1">Artist / Band</label>
                <input
                  type="text"
                  value={songArtist}
                  onChange={(e) => setSongArtist(e.target.value)}
                  placeholder="e.g. Amit Trivedi / The Eagles"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-nature-800"
                />
              </div>

              <div>
                <label className="font-bold text-stone-600 block mb-1">Dedication / Vibe Note (Optional)</label>
                <input
                  type="text"
                  value={songNotes}
                  onChange={(e) => setSongNotes(e.target.value)}
                  placeholder="e.g. Watching the sunset with a cold frappe ❤️"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-nature-800"
                />
              </div>

              <button
                type="submit"
                disabled={submittingSong}
                className="w-full bg-nature-950 hover:bg-stone-900 text-white font-bold py-3 rounded-xl shadow-sm transition-all flex items-center justify-center gap-2"
              >
                <Send className="w-3.5 h-3.5 text-amber-400" />
                <span>Submit Song to Balcony Desk</span>
              </button>
            </form>
          </div>

          {/* Right: Live Queue */}
          <div className="lg:col-span-6 bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-card space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <h3 className="font-serif font-bold text-base text-stone-900 flex items-center gap-2">
                <Music className="w-4 h-4 text-amber-700" />
                <span>Live Balcony Song Queue</span>
              </h3>
              <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full animate-pulse">
                ● Live Updates
              </span>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
              {songRequests.map((s) => (
                <div
                  key={s.id}
                  className={`p-3.5 rounded-2xl border text-xs transition-all ${
                    s.status === 'PLAYING'
                      ? 'bg-amber-50/80 border-amber-300 ring-2 ring-amber-400/20'
                      : 'bg-cream-50 border-stone-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-stone-900 text-sm">{s.songTitle}</span>
                    <span
                      className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                        s.status === 'PLAYING'
                          ? 'bg-amber-400 text-nature-950 animate-bounce'
                          : 'bg-stone-200 text-stone-700'
                      }`}
                    >
                      {s.status === 'PLAYING' ? '▶ NOW PLAYING' : 'UP NEXT'}
                    </span>
                  </div>
                  <span className="text-stone-600 block mt-0.5 font-medium">{s.artist}</span>
                  <div className="mt-2 pt-2 border-t border-stone-200/60 flex items-center justify-between text-[11px] text-stone-500">
                    <span>Requested by {s.customerName} ({s.tableNumber})</span>
                    {s.notes && <span className="italic text-stone-400 truncate max-w-[45%]">"{s.notes}"</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Section 4: Secret Cafe Passwords & Perks */}
        <section className="bg-gradient-to-r from-stone-900 via-nature-950 to-stone-900 text-white rounded-3xl p-8 sm:p-12 shadow-2xl relative overflow-hidden">
          <div className="max-w-2xl space-y-3 relative z-10">
            <span className="text-xs uppercase font-extrabold text-amber-400 tracking-widest flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Secret Balcony Password of the Week</span>
            </span>
            <h3 className="font-serif text-2xl sm:text-3xl font-black text-white">
              Say &ldquo;FuzeTheSunset&rdquo; at the Barista Counter
            </h3>
            <p className="text-xs sm:text-sm text-stone-300 leading-relaxed">
              Whisper this secret phrase to our barista on the musical balcony when ordering any frappe or cold coffee to get a complimentary swirl of Belgian chocolate drizzle or whipped cream on the house!
            </p>
            <div className="pt-2">
              <Link
                to="/menu"
                className="inline-flex items-center gap-2 bg-amber-400 hover:bg-amber-300 text-nature-950 font-bold text-xs px-6 py-3 rounded-full shadow-lg transition-transform active:scale-95"
              >
                <span>Order Now &amp; Claim Perk</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* RSVP Modal */}
      {rsvpModalEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-stone-200 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div>
                <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block">
                  RSVP Registration
                </span>
                <h3 className="font-serif font-bold text-lg text-stone-900">
                  {rsvpModalEvent.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setRsvpModalEvent(null)}
                className="w-8 h-8 rounded-full bg-stone-100 text-stone-500 hover:text-stone-800 flex items-center justify-center text-sm"
              >
                ✕
              </button>
            </div>

            {rsvpSuccess ? (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                <h4 className="font-serif font-bold text-base text-emerald-950">RSVP Confirmed!</h4>
                <p className="text-xs text-emerald-800">
                  Your seat on the musical balcony is reserved. We look forward to seeing you!
                </p>
              </div>
            ) : (
              <form onSubmit={handleRsvpSubmit} className="space-y-3.5 text-xs">
                <div>
                  <label className="font-bold text-stone-700 block mb-1">Your Full Name</label>
                  <input
                    type="text"
                    required
                    value={rsvpName}
                    onChange={(e) => setRsvpName(e.target.value)}
                    placeholder="e.g. Parth Kalla"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-nature-800"
                  />
                </div>

                <div>
                  <label className="font-bold text-stone-700 block mb-1">WhatsApp Phone Number</label>
                  <input
                    type="tel"
                    required
                    value={rsvpPhone}
                    onChange={(e) => setRsvpPhone(e.target.value)}
                    placeholder="+91 95717 14005"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-nature-800"
                  />
                </div>

                <div>
                  <label className="font-bold text-stone-700 block mb-1">Number of Guests</label>
                  <select
                    value={rsvpGuests}
                    onChange={(e) => setRsvpGuests(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-nature-800 bg-white"
                  >
                    {[1, 2, 3, 4, 5, 6, 8, 10].map((num) => (
                      <option key={num} value={num}>
                        {num} {num === 1 ? 'Person' : 'People'}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-stone-700 block mb-1">Special Seating Request</label>
                  <input
                    type="text"
                    value={rsvpNotes}
                    onChange={(e) => setRsvpNotes(e.target.value)}
                    placeholder="e.g. Sunset view railing table please"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-nature-800"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submittingRsvp}
                  className="w-full bg-nature-950 hover:bg-stone-900 text-white font-bold py-3.5 rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
                >
                  {submittingRsvp ? 'Confirming...' : 'Confirm RSVP & Reserve'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};
