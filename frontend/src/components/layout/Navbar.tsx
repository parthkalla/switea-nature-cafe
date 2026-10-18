import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { UtensilsCrossed, ShoppingBag, Menu, X, Leaf, Sparkles, Phone } from 'lucide-react';
import { useCart } from '../../context/CartContext';

export const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const { totalItemCount, tableInfo } = useCart();

  const navLinks = [
    { label: 'Home', path: '/' },
    { label: 'Digital Menu', path: '/menu' },
    { label: 'About Us', path: '/about' },
    { label: 'Garden Gallery', path: '/gallery' },
    { label: 'Contact', path: '/contact' },
  ];

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <header className="sticky top-0 z-50 glass-nature transition-all duration-200 shadow-soft">
      {/* Table session banner if seated via QR */}
      {tableInfo && (
        <div className="bg-nature-900 text-cream-100 text-xs py-1.5 px-4 text-center font-medium flex items-center justify-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-nature-300 animate-pulse" />
          <span>Ordering for <strong className="text-earth-200">{tableInfo.tableNumber} ({tableInfo.name})</strong></span>
          <span className="text-nature-400">|</span>
          <Link to="/menu" className="underline hover:text-white">View Table Menu</Link>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-12 h-12 rounded-full bg-nature-900 flex items-center justify-center shadow-md group-hover:scale-105 transition-transform duration-200">
              <Leaf className="w-6 h-6 text-nature-200" />
            </div>
            <div>
              <span className="font-serif text-2xl font-bold tracking-tight text-nature-950 block leading-tight">
                Switea
              </span>
              <span className="text-xs tracking-wider uppercase text-nature-700 font-semibold flex items-center gap-1">
                Nature Cafe <span className="text-earth-600 font-normal">Jaipur</span>
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  isActive(link.path)
                    ? 'bg-nature-100 text-nature-900 font-semibold'
                    : 'text-stone-700 hover:text-nature-900 hover:bg-cream-200/60'
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
              className="hidden sm:inline-flex items-center gap-2 bg-nature-900 text-cream-100 px-5 py-2.5 rounded-full text-sm font-semibold hover:bg-nature-950 shadow-soft transition-all duration-200 hover:-translate-y-0.5"
            >
              <UtensilsCrossed className="w-4 h-4 text-nature-300" />
              <span>Explore Menu</span>
            </Link>

            <Link
              to="/cart"
              className="relative p-2.5 rounded-full bg-cream-200 text-nature-950 hover:bg-cream-300 transition-colors"
              aria-label="View Cart"
            >
              <ShoppingBag className="w-5 h-5" />
              {totalItemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-terracotta-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-sm animate-bounce">
                  {totalItemCount}
                </span>
              )}
            </Link>

            <Link
              to="/admin/login"
              className="hidden lg:inline-flex text-xs font-medium text-stone-500 hover:text-nature-900 border border-stone-200 px-3 py-1.5 rounded-full transition-colors"
            >
              Staff Portal
            </Link>

            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="md:hidden p-2 rounded-lg text-stone-700 hover:text-nature-900 hover:bg-cream-200"
              aria-label="Toggle Menu"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {isOpen && (
        <div className="md:hidden border-t border-nature-100 bg-cream-50 px-4 pt-3 pb-6 space-y-2 shadow-lg animate-in slide-in-from-top duration-200">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              onClick={() => setIsOpen(false)}
              className={`block px-4 py-2.5 rounded-lg text-base font-medium ${
                isActive(link.path)
                  ? 'bg-nature-900 text-white font-semibold'
                  : 'text-stone-700 hover:bg-cream-200'
              }`}
            >
              {link.label}
            </Link>
          ))}
          <div className="pt-3 border-t border-cream-200 flex flex-col gap-2">
            <Link
              to="/menu"
              onClick={() => setIsOpen(false)}
              className="w-full text-center bg-nature-900 text-white py-3 rounded-xl font-semibold shadow"
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
