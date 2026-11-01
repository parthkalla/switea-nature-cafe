import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { UtensilsCrossed, ShoppingBag, Menu, X, Coffee, Music, Sparkles } from 'lucide-react';
import { useCart } from '../../context/CartContext';

interface NavbarProps {
  restaurant?: any;
}

export const Navbar: React.FC<NavbarProps> = ({ restaurant }) => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const { totalItemCount, tableInfo } = useCart();
  const isCustomCafe = restaurant && restaurant.slug && restaurant.slug !== 'roastfuze';

  const navLinks = [
    { label: 'Explore Menu', path: '/menu' },
    { label: 'Musical Balcony', path: '/#experience' },
    { label: 'Balcony Club & Events', path: '/community' },
    { label: 'Our Spaces', path: '/#spaces' },
    { label: 'Find Us', path: '/#location' },
    { label: 'My Points', path: '/loyalty' },
  ];

  const handleNavClick = (path: string) => {
    setIsOpen(false);
    if (path.startsWith('/#')) {
      const targetId = path.replace('/#', '');
      if (location.pathname === '/') {
        const elem = document.getElementById(targetId);
        if (elem) {
          elem.scrollIntoView({ behavior: 'smooth' });
          return;
        }
      }
    }
  };

  const isActive = (path: string) => {
    if (path === '/menu') return location.pathname === '/menu';
    return false;
  };

  return (
    <header className="sticky top-0 z-50 bg-cream-100/90 backdrop-blur-md border-b border-stone-200/60 transition-all duration-300">
      {/* Table session banner if seated via QR */}
      {tableInfo && (
        <div className="bg-stone-900 text-cream-100 text-xs py-1.5 px-4 text-center font-medium flex items-center justify-center gap-2 border-b border-stone-800">
          <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
          <span>Ordering for <strong className="text-amber-200">{tableInfo.tableNumber} ({tableInfo.name})</strong></span>
          <span className="text-stone-500">•</span>
          <Link to="/menu" className="underline hover:text-white font-semibold">View Table Menu</Link>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Brand Logo - Dynamic for custom cafe or RoastFuze */}
          <Link to="/" className="flex items-center gap-3 group">
            {isCustomCafe ? (
              <>
                <div
                  className="w-10 h-10 rounded-2xl flex items-center justify-center font-serif font-black text-lg text-white shadow-sm border border-black/10"
                  style={{ backgroundColor: restaurant.primaryColor || '#064e3b' }}
                >
                  {restaurant.logo ? (
                    <img src={restaurant.logo} alt={restaurant.name} className="h-8 w-auto object-contain" />
                  ) : (
                    <span>{restaurant.name?.charAt(0) || 'C'}</span>
                  )}
                </div>
                <div className="hidden sm:block">
                  <span className="text-sm font-serif font-bold text-stone-900 block leading-tight">
                    {restaurant.name}
                  </span>
                  <span className="text-[10px] text-stone-500 font-medium block truncate max-w-[200px]">
                    {restaurant.tagLine || `${restaurant.city || 'Jaipur'}, ${restaurant.state || 'Rajasthan'}`}
                  </span>
                </div>
              </>
            ) : (
              <>
                <div className="bg-white px-2 py-1 rounded-xl shadow-sm border border-stone-200/80 group-hover:shadow-md transition-all">
                  <img
                    src="/images/roastfuze_logo.png"
                    alt="The RoastFuze Coffee Bar"
                    className="h-10 w-auto object-contain"
                  />
                </div>
                <div className="hidden sm:block">
                  <span className="text-[10px] tracking-[0.2em] uppercase text-amber-900 font-bold block">
                    Musical Balcony Cafe
                  </span>
                  <span className="text-[9px] text-stone-500 font-medium block">
                    Vaishali Nagar, Jaipur
                  </span>
                </div>
              </>
            )}
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-3">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                to={link.path}
                onClick={() => handleNavClick(link.path)}
                className={`px-4 py-2 rounded-full text-xs uppercase tracking-wider font-semibold transition-all ${
                  isActive(link.path)
                    ? 'bg-stone-900 text-white shadow-xs'
                    : 'text-stone-600 hover:text-stone-950 hover:bg-stone-200/50'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* CTA Buttons & Cart */}
          <div className="flex items-center gap-3">
            <Link
              to="/menu"
              className="hidden sm:inline-flex items-center gap-2 bg-stone-900 text-cream-100 px-5 py-2.5 rounded-full text-sm font-semibold hover:bg-stone-800 shadow-soft transition-all duration-200 hover:-translate-y-0.5"
            >
              <UtensilsCrossed className="w-4 h-4 text-amber-300" />
              <span>Explore Menu</span>
            </Link>

            <Link
              to="/cart"
              className="relative p-2.5 rounded-full bg-cream-200 text-stone-900 hover:bg-cream-300 transition-colors"
              aria-label="View Cart"
            >
              <ShoppingBag className="w-5 h-5" />
              {totalItemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-amber-600 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-sm animate-bounce">
                  {totalItemCount}
                </span>
              )}
            </Link>

            <Link
              to="/admin/login"
              className="hidden lg:inline-flex text-xs font-medium text-stone-500 hover:text-stone-900 border border-stone-200 px-3 py-1.5 rounded-full transition-colors"
            >
              Staff Portal
            </Link>

            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="md:hidden p-2 rounded-lg text-stone-700 hover:text-stone-900 hover:bg-cream-200"
              aria-label="Toggle Menu"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {isOpen && (
        <div className="md:hidden border-t border-stone-200 bg-cream-50 px-4 pt-3 pb-6 space-y-2 shadow-lg animate-in slide-in-from-top duration-200">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              to={link.path}
              onClick={() => handleNavClick(link.path)}
              className={`block px-4 py-2.5 rounded-lg text-sm font-semibold tracking-wide ${
                isActive(link.path)
                  ? 'bg-stone-900 text-white'
                  : 'text-stone-700 hover:bg-stone-200/60'
              }`}
            >
              {link.label}
            </Link>
          ))}
          <div className="pt-3 border-t border-cream-200 flex flex-col gap-2">
            <Link
              to="/menu"
              onClick={() => setIsOpen(false)}
              className="w-full text-center bg-stone-900 text-white py-3 rounded-xl font-semibold shadow"
            >
              Order Online / View Menu
            </Link>
            <Link
              to="/admin/login"
              onClick={() => setIsOpen(false)}
              className="text-center text-xs text-stone-500 hover:text-stone-800 py-1"
            >
              Restaurant Admin / Staff Login
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};
