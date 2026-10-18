import React from 'react';
import { Link } from 'react-router-dom';
import { Leaf, MapPin, Phone, Mail, Clock, Instagram, Facebook } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-nature-950 text-cream-200 border-t border-nature-900 pt-16 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          {/* Brand Info */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-nature-800 flex items-center justify-center">
                <Leaf className="w-5 h-5 text-nature-300" />
              </div>
              <div>
                <span className="font-serif text-2xl font-bold tracking-tight text-white block">
                  Switea
                </span>
                <span className="text-xs tracking-wider uppercase text-nature-300 font-medium">
                  Nature Cafe Jaipur
                </span>
              </div>
            </div>
            <p className="text-sm text-stone-300 leading-relaxed mb-6">
              A serene garden escape in Jaipur serving authentic clay-baked kulhad chai, artisan coffees, and comfort delicacies enveloped in calming greenery.
            </p>
            <div className="flex items-center gap-3">
              <a
                href="https://instagram.com/switeacafe"
                target="_blank"
                rel="noreferrer"
                className="w-9 h-9 rounded-full bg-nature-900 flex items-center justify-center hover:bg-nature-800 transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="w-4 h-4 text-cream-100" />
              </a>
              <a
                href="https://facebook.com/switeacafe"
                target="_blank"
                rel="noreferrer"
                className="w-9 h-9 rounded-full bg-nature-900 flex items-center justify-center hover:bg-nature-800 transition-colors"
                aria-label="Facebook"
              >
                <Facebook className="w-4 h-4 text-cream-100" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-serif text-lg font-semibold text-white mb-4">Explore</h3>
            <ul className="space-y-2.5 text-sm text-stone-300">
              <li>
                <Link to="/" className="hover:text-nature-200 transition-colors">Home</Link>
              </li>
              <li>
                <Link to="/menu" className="hover:text-nature-200 transition-colors">Digital QR Menu</Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-nature-200 transition-colors">About Our Story</Link>
              </li>
              <li>
                <Link to="/gallery" className="hover:text-nature-200 transition-colors">Garden Gallery</Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-nature-200 transition-colors">Find Location & Hours</Link>
              </li>
            </ul>
          </div>

          {/* Location & Contact */}
          <div>
            <h3 className="font-serif text-lg font-semibold text-white mb-4">Visit Us</h3>
            <ul className="space-y-3 text-sm text-stone-300">
              <li className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-nature-400 mt-1 flex-shrink-0" />
                <span>64A, Garden Cafe, Karni Vihar, Maa Karni Nagar, Gandhipath, near Vaishali Nagar, Jaipur (302021)</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-nature-400 flex-shrink-0" />
                <a href="tel:+919555495454" className="hover:text-nature-200">+91 95554 95454</a>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-nature-400 flex-shrink-0" />
                <a href="mailto:hello@switeanaturecafe.com" className="hover:text-nature-200">hello@switeanaturecafe.com</a>
              </li>
            </ul>
          </div>

          {/* Opening Hours */}
          <div>
            <h3 className="font-serif text-lg font-semibold text-white mb-4">Opening Hours</h3>
            <div className="space-y-2 text-sm text-stone-300">
              <div className="flex items-center gap-2 text-nature-300 font-medium">
                <Clock className="w-4 h-4" />
                <span>Open 7 Days a Week</span>
              </div>
              <p className="text-white font-semibold">Monday – Sunday:</p>
              <p>10:00 AM – 11:30 PM IST</p>
              <div className="mt-4 pt-3 border-t border-nature-900">
                <span className="inline-block px-3 py-1 bg-nature-800 text-nature-200 text-xs rounded-full font-medium">
                  🌿 Dine-in & Takeaway Available
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-nature-900 flex flex-col sm:flex-row items-center justify-between text-xs text-stone-400 gap-4">
          <p>© {new Date().getFullYear()} Switea Nature Cafe. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <Link to="/privacy-policy" className="hover:text-nature-200">Privacy Policy</Link>
            <Link to="/terms-and-conditions" className="hover:text-nature-200">Terms & Conditions</Link>
            <Link to="/admin/login" className="hover:text-nature-200">Admin Portal</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
