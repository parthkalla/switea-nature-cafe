import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { getTenantSlug } from '../utils/tenantHelper';
import { api } from '../services/api';
import { Restaurant } from '../types';

interface TenantContextType {
  slug: string;
  restaurant: Restaurant | null;
  loading: boolean;
  isCustomCafe: boolean;
  isSuperAdmin: boolean;
  refreshTenant: () => Promise<void>;
  setTenantRestaurant: (r: Restaurant | null) => void;
}

const TenantContext = createContext<TenantContextType>({
  slug: 'roastfuze',
  restaurant: null,
  loading: false,
  isCustomCafe: false,
  isSuperAdmin: false,
  refreshTenant: async () => {},
  setTenantRestaurant: () => {},
});

export const TenantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(false);

  // Check if on Super Admin domain or path
  const isSuperAdmin = useMemo(() => {
    if (typeof window === 'undefined') return false;
    const h = window.location.hostname.toLowerCase();
    return (
      h === 'admin.asrockstudios.in' ||
      h === 'admin.localhost' ||
      location.pathname.startsWith('/super-admin')
    );
  }, [location.pathname]);

  // Determine effective tenant slug
  const slug = useMemo(() => {
    // If URL path has /menu/:restaurantSlug
    const menuMatch = location.pathname.match(/^\/menu\/([a-zA-Z0-9_-]+)/);
    if (menuMatch && menuMatch[1] && menuMatch[1] !== 'table') {
      return menuMatch[1].toLowerCase();
    }
    return getTenantSlug();
  }, [location.pathname]);

  const isCustomCafe = Boolean(slug && slug !== 'roastfuze' && slug !== 'all' && !isSuperAdmin);

  // Function to dynamically update Favicon
  const updateFavicon = (iconUrl?: string | null, fallbackLetter?: string, color?: string) => {
    if (typeof document === 'undefined') return;
    let link = document.querySelector<HTMLLinkElement>("link[rel*='icon']");
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }

    if (iconUrl) {
      link.href = iconUrl;
      return;
    }

    if (fallbackLetter && color) {
      // Generate sharp SVG Monogram Favicon
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="16" fill="${color}"/><text x="50%" y="54%" text-anchor="middle" dominant-baseline="middle" font-family="serif" font-weight="900" font-size="34" fill="#ffffff">${fallbackLetter.toUpperCase()}</text></svg>`;
      link.href = `data:image/svg+xml,${encodeURIComponent(svg)}`;
      return;
    }

    link.href = '/favicon.ico';
  };

  // Fetch tenant metadata
  const loadTenant = async () => {
    if (isSuperAdmin) {
      document.title = 'ASRock Studios | Platform Super Administration';
      updateFavicon(null, 'A', '#4f46e5');
      return;
    }

    // Cafe Admin routes
    if (location.pathname.startsWith('/admin')) {
      const cafeName = restaurant?.name || (slug !== 'roastfuze' ? slug.toUpperCase() : 'RoastFuze');
      document.title = `${cafeName} | Cafe Staff & Admin Portal`;
      return;
    }

    try {
      setLoading(true);
      const res = await api.getMenu(slug || 'roastfuze');
      if (res.restaurant) {
        setRestaurant(res.restaurant);

        // Update Document Title
        if (res.restaurant.slug !== 'roastfuze') {
          document.title = `${res.restaurant.name} | ${res.restaurant.tagLine || res.restaurant.city || 'Digital Menu & Table Ordering'}`;
          updateFavicon(res.restaurant.logo, res.restaurant.name?.charAt(0) || 'C', res.restaurant.primaryColor || '#1e293b');
        } else {
          document.title = 'RoastFuze Coffee Bar - Musical Balcony Cafe | Jaipur';
          updateFavicon('/images/roastfuze_logo.png');
        }
      }
    } catch (err) {
      console.warn('Failed to load tenant metadata:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTenant();
  }, [slug, isSuperAdmin, location.pathname]);

  return (
    <TenantContext.Provider
      value={{
        slug,
        restaurant,
        loading,
        isCustomCafe,
        isSuperAdmin,
        refreshTenant: loadTenant,
        setTenantRestaurant: setRestaurant,
      }}
    >
      {children}
    </TenantContext.Provider>
  );
};

export const useTenant = () => useContext(TenantContext);
