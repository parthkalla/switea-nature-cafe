import React from 'react';
import { MapPin, Phone, Mail, Clock, MessageSquare, ExternalLink } from 'lucide-react';
import { Navbar } from '../../components/layout/Navbar';
import { Footer } from '../../components/layout/Footer';
import { api } from '../../services/api';

import { buildGoogleMapsEmbedUrl } from '../../utils/mapHelper';

export const ContactPage: React.FC = () => {
  const [data, setData] = React.useState<any>(null);

  React.useEffect(() => {
    async function loadInfo() {
      try {
        const res = await api.getLandingPage('roastfuze');
        setData(res?.restaurant);
      } catch (err) {
        console.error('Failed to load contact info:', err);
      }
    }
    loadInfo();
  }, []);

  const address = data?.address || 'A-26, Vivek Vihar, Lalarpura Road, Gandhi Path West, Vaishali Nagar, Jaipur, Rajasthan 302021';
  const phone = data?.phone || '+91 93521 82562';
  const hours = data?.openingHours || 'Monday to Sunday: 10:00 AM – 11:00 PM';
  const mapEmbedUrl = buildGoogleMapsEmbedUrl(data?.mapEmbedUrl || data?.mapLink || '26.9056268,75.7271802');
  const directionsUrl = data?.mapLink || 'https://www.google.com/maps/place/RoastFuze+Coffee+Bar+-+Musical+Balcony+cafe/@26.9056268,75.7271802,20.2z/data=!4m6!3m5!1s0x396db5fadc6985e1:0xec2fb39c9113ff9e!8m2!3d26.9056268!4d75.7271802!16s%2Fg%2F11xhbpgh0x';

  return (
    <div className="min-h-screen bg-cream-100 flex flex-col selection:bg-amber-200">
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 flex-1 w-full">
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
          <span className="text-xs uppercase tracking-wider font-bold text-amber-800 block">
            Visit RoastFuze
          </span>
          <h1 className="font-serif text-4xl sm:text-5xl font-bold text-stone-900">
            Contact & Directions
          </h1>
          <p className="text-sm text-stone-600">
            Questions about acoustic sessions, table reservations, or our menu? We'd love to connect.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* Contact Details Cards */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white rounded-3xl border border-stone-200 p-6 shadow-soft space-y-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center">
                <MapPin className="w-5 h-5" />
              </div>
              <h3 className="font-serif font-bold text-base text-stone-900">Balcony Address</h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                {address}
              </p>
            </div>

            <div className="bg-white rounded-3xl border border-stone-200 p-6 shadow-soft space-y-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center">
                <Phone className="w-5 h-5" />
              </div>
              <h3 className="font-serif font-bold text-base text-stone-900">Phone & WhatsApp</h3>
              <p className="text-xs text-stone-600">
                Direct Call: <a href={`tel:${phone.replace(/\s+/g, '')}`} className="font-semibold text-amber-900 hover:underline">{phone}</a>
              </p>
              <a
                href={`https://wa.me/${phone.replace(/[^0-9]/g, '')}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:underline pt-1"
              >
                <span>Chat with Barista Desk on WhatsApp</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div className="bg-white rounded-3xl border border-stone-200 p-6 shadow-soft space-y-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center">
                <Clock className="w-5 h-5" />
              </div>
              <h3 className="font-serif font-bold text-base text-stone-900">Balcony Hours</h3>
              <p className="text-xs text-stone-600">{hours}</p>
              <div className="flex items-center gap-2 pt-1">
                <span className="inline-block px-3 py-1 bg-emerald-100 text-emerald-800 text-[11px] font-bold rounded-full">
                  ● Open Today (10 AM - 11 PM)
                </span>
                <span className="text-[11px] text-amber-800 font-medium">
                  Live Music Evening
                </span>
              </div>
            </div>
          </div>

          {/* Interactive Map */}
          <div className="lg:col-span-7 bg-white rounded-3xl border border-stone-200 p-4 shadow-soft overflow-hidden">
            <div className="rounded-2xl overflow-hidden aspect-[16/11]">
              <iframe
                title="RoastFuze Coffee Bar Location Map"
                src={mapEmbedUrl}
                className="w-full h-full border-0"
                loading="lazy"
              />
            </div>
            <div className="p-4 flex items-center justify-between text-xs">
              <span className="font-medium text-stone-600">Vivek Vihar, Vaishali Nagar, Jaipur</span>
              <a
                href={directionsUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 font-bold text-amber-900 hover:underline"
              >
                <span>Open in Google Maps</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};
