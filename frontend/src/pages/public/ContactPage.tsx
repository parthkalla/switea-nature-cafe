import React from 'react';
import { MapPin, Phone, Mail, Clock, MessageSquare, ExternalLink } from 'lucide-react';
import { Navbar } from '../../components/layout/Navbar';
import { Footer } from '../../components/layout/Footer';

export const ContactPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-cream-100 flex flex-col selection:bg-nature-200">
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 flex-1 w-full">
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
          <span className="text-xs uppercase tracking-wider font-bold text-nature-700 block">
            Get In Touch
          </span>
          <h1 className="font-serif text-4xl sm:text-5xl font-bold text-stone-900">
            Contact Switea Nature Cafe
          </h1>
          <p className="text-sm text-stone-600">
            Have questions about table reservations, party hosting, or our menu? We’d love to hear from you.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* Contact Details Cards */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white rounded-3xl border border-stone-200 p-6 shadow-soft space-y-3">
              <div className="w-10 h-10 rounded-xl bg-nature-100 text-nature-900 flex items-center justify-center">
                <MapPin className="w-5 h-5" />
              </div>
              <h3 className="font-serif font-bold text-base text-stone-900">Cafe Address</h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                64A, Garden Cafe, Karni Vihar, Maa Karni Nagar, Gandhipath, near Vaishali Nagar, Jaipur, Rajasthan 302021
              </p>
            </div>

            <div className="bg-white rounded-3xl border border-stone-200 p-6 shadow-soft space-y-3">
              <div className="w-10 h-10 rounded-xl bg-nature-100 text-nature-900 flex items-center justify-center">
                <Phone className="w-5 h-5" />
              </div>
              <h3 className="font-serif font-bold text-base text-stone-900">Phone & WhatsApp</h3>
              <p className="text-xs text-stone-600">
                Call: <a href="tel:+919555495454" className="font-semibold text-nature-900 hover:underline">+91 95554 95454</a>
              </p>
            </div>

            <div className="bg-white rounded-3xl border border-stone-200 p-6 shadow-soft space-y-3">
              <div className="w-10 h-10 rounded-xl bg-nature-100 text-nature-900 flex items-center justify-center">
                <Clock className="w-5 h-5" />
              </div>
              <h3 className="font-serif font-bold text-base text-stone-900">Operating Hours</h3>
              <p className="text-xs text-stone-600">Monday to Sunday: 10:00 AM – 11:30 PM</p>
              <span className="inline-block px-3 py-1 bg-emerald-100 text-emerald-800 text-[11px] font-bold rounded-full">
                ● Open Today
              </span>
            </div>
          </div>

          {/* Interactive Map */}
          <div className="lg:col-span-7 bg-white rounded-3xl border border-stone-200 p-4 shadow-soft overflow-hidden">
            <div className="rounded-2xl overflow-hidden aspect-[16/11]">
              <iframe
                title="Switea Location Map"
                src="https://maps.google.com/maps?q=Karni%20Vihar%20Gandhipath%20Jaipur&t=&z=14&ie=UTF8&iwloc=&output=embed"
                className="w-full h-full border-0"
                loading="lazy"
              />
            </div>
            <div className="p-4 flex items-center justify-between text-xs">
              <span className="font-medium text-stone-600">Near Vaishali Nagar, Jaipur</span>
              <a
                href="https://maps.google.com/?q=Switea+Garden+Cafe+Jaipur"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 font-bold text-nature-900 hover:underline"
              >
                <span>Get Driving Directions</span>
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
