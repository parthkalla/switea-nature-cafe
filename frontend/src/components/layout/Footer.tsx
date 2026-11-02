import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Phone, Mail } from 'lucide-react';
import { useTenant } from '../../context/TenantContext';

interface FooterProps {
  restaurant?: any;
}

export const Footer: React.FC<FooterProps> = ({ restaurant: propRestaurant }) => {
  const { restaurant: contextRestaurant } = useTenant();
  const restaurant = propRestaurant || contextRestaurant;

  const isCustom = restaurant && restaurant.slug && restaurant.slug !== 'roastfuze';
  const cafeName = restaurant?.name || 'RoastFuze Coffee Bar';
  const cafeTagline = restaurant?.tagLine || 'Musical Balcony Cafe • Jaipur';
  const cafeAddress = restaurant?.address || (isCustom ? `${restaurant?.city || 'Jaipur'}, Rajasthan` : 'A-26, Vivek Vihar, Lalarpura Road, Gandhi Path West, Vaishali Nagar, Jaipur, Rajasthan 302021');
  const cafePhone = restaurant?.phone || (isCustom ? '+91 95554 95454' : '+91 93521 82562');
  const cafeEmail = restaurant?.email || (isCustom ? `contact@${restaurant?.slug}.asrockstudios.in` : 'hello@roastfuze.com');

  return (
    <footer className="bg-stone-950 text-cream-200 border-t border-stone-800 pt-16 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          {/* Brand Info */}
          <div>
            <div className="mb-4">
              {isCustom ? (
                <div className="flex items-center gap-2.5 mb-2">
                  <div
                    className="w-10 h-10 rounded-2xl flex items-center justify-center font-serif font-black text-white text-lg shadow-sm overflow-hidden"
                    style={{ backgroundColor: restaurant.primaryColor || '#064e3b' }}
                  >
                    {restaurant.logo ? (
                      <img src={restaurant.logo} alt={cafeName} className="h-full w-full object-cover" />
                    ) : (
                      <span>{cafeName.charAt(0)}</span>
                    )}
                  </div>
                  <div>
                    <span className="font-serif font-bold text-lg text-white block leading-tight">{cafeName}</span>
                    <span className="text-[10px] text-amber-400 font-semibold uppercase tracking-wider">{cafeTagline}</span>
                  </div>
                </div>
              ) : (
                <>
                  <div className="bg-white px-3 py-1.5 rounded-xl inline-block shadow-sm mb-3">
                    <img
                      src="/images/roastfuze_logo.png"
                      alt="The RoastFuze Coffee Bar"
                      className="h-10 w-auto object-contain"
                    />
                  </div>
                  <span className="text-xs tracking-wider uppercase text-amber-400 font-semibold block">
                    Musical Balcony Cafe • Jaipur
                  </span>
                </>
              )}
            </div>
            <p className="text-xs text-stone-400 leading-relaxed mb-6">
              {restaurant?.description ||
                (isCustom
                  ? `${cafeName} offers signature artisan menus, premium dine-in ambience, and seamless digital table ordering.`
                  : 'Serving hand-crafted espresso roasts, velvety ice cream frappes, stone-baked pizzas, Belgian waffles, and live acoustic sessions.')}
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-serif text-lg font-semibold text-white mb-4">Quick Links</h3>
            <ul className="space-y-2.5 text-xs text-stone-300">
              <li>
                <Link to="/menu" className="hover:text-amber-300 transition-colors">Digital QR Menu</Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-amber-300 transition-colors">About Our Cafe</Link>
              </li>
              {!isCustom && (
                <li>
                  <Link to="/community" className="hover:text-amber-300 transition-colors">Events & VIP Club</Link>
                </li>
              )}
              <li>
                <Link to="/loyalty" className="hover:text-amber-300 transition-colors">Customer Loyalty Points</Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-amber-300 transition-colors">Contact & Directions</Link>
              </li>
            </ul>
          </div>

          {/* Opening Hours */}
          <div>
            <h3 className="font-serif text-lg font-semibold text-white mb-4">Hours</h3>
            <ul className="space-y-2 text-xs text-stone-300">
              <li className="flex justify-between border-b border-stone-800 pb-1.5">
                <span>Monday – Sunday</span>
                <span className="font-semibold text-white">{restaurant?.openingHours || '10:00 AM – 11:00 PM'}</span>
              </li>
              <li className="flex justify-between border-b border-stone-800 pb-1.5">
                <span>Kitchen Status</span>
                <span className="font-semibold text-emerald-400">Open For Dining</span>
              </li>
            </ul>
          </div>

          {/* Contact Details */}
          <div>
            <h3 className="font-serif text-lg font-semibold text-white mb-4">Visit Us</h3>
            <ul className="space-y-3 text-xs text-stone-300">
              <li className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span className="leading-snug">{cafeAddress}</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-amber-400 shrink-0" />
                <span>{cafePhone}</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="truncate">{cafeEmail}</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-stone-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-stone-500">
          <p>© {new Date().getFullYear()} {cafeName}. Powered by ASRock Studios Platform.</p>
          <div className="flex gap-6 text-[11px]">
            <Link to="/privacy" className="hover:text-stone-400">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-stone-400">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
