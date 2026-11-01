import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Lock, Mail, Store, AlertCircle, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { getTenantSlug } from '../../utils/tenantHelper';

export const AdminLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Dynamic Multi-tenant Cafe Branding
  const [tenantBranding, setTenantBranding] = useState<{
    name: string;
    logo?: string | null;
    tagLine?: string | null;
    primaryColor?: string | null;
    slug?: string;
  } | null>(null);

  useEffect(() => {
    async function loadTenantBranding() {
      try {
        const searchParams = new URLSearchParams(window.location.search);
        const queryCafe = searchParams.get('cafe') || searchParams.get('restaurant') || searchParams.get('slug');
        const slug = getTenantSlug(queryCafe || undefined);

        if (slug) {
          const res = await api.getLandingPage(slug);
          if (res && res.restaurant) {
            setTenantBranding({
              name: res.restaurant.name,
              logo: res.restaurant.logo,
              tagLine: res.restaurant.tagLine,
              primaryColor: res.restaurant.primaryColor || '#d97706',
              slug: res.restaurant.slug,
            });
          }
        }
      } catch (err) {
        console.warn('Could not load cafe branding for login portal:', err);
      }
    }

    loadTenantBranding();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const user = await login({ email: email.trim(), password });
      if (user.role === 'SUPER_ADMIN') {
        navigate('/super-admin/dashboard');
      } else {
        navigate('/admin/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  const cafeName = tenantBranding?.name || 'Cafe Administration Portal';
  const cafeTagline = tenantBranding?.tagLine || 'Sign in to manage orders, tables, KDS, and menu';
  const isRoastFuze = tenantBranding?.slug === 'roastfuze';

  return (
    <div className="min-h-screen bg-stone-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 selection:bg-amber-300">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center px-4">
        {/* Dynamic Cafe Branding Header */}
        <Link to="/" className="inline-block mb-4">
          {tenantBranding?.logo ? (
            <div className="bg-white px-4 py-2.5 rounded-2xl shadow-xl border border-stone-200 inline-block">
              <img
                src={tenantBranding.logo}
                alt={cafeName}
                className="h-12 w-auto max-w-[200px] object-contain mx-auto"
              />
            </div>
          ) : isRoastFuze ? (
            <div className="bg-white px-4 py-2 rounded-2xl shadow-xl border border-stone-200 inline-block">
              <img
                src="/images/roastfuze_logo.png"
                alt="The RoastFuze Coffee Bar"
                className="h-12 w-auto object-contain mx-auto"
              />
            </div>
          ) : tenantBranding?.name ? (
            <div
              className="px-5 py-3 rounded-2xl shadow-xl border border-white/10 inline-flex items-center gap-3 text-white font-serif font-bold text-lg"
              style={{ backgroundColor: tenantBranding.primaryColor || '#4f46e5' }}
            >
              <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center font-mono text-sm uppercase">
                {tenantBranding.name.slice(0, 2)}
              </div>
              <span>{tenantBranding.name}</span>
            </div>
          ) : (
            <div className="w-14 h-14 rounded-2xl bg-stone-900 border border-stone-800 text-amber-400 flex items-center justify-center mx-auto shadow-xl">
              <Store className="w-7 h-7" />
            </div>
          )}
        </Link>

        <h2 className="text-xl sm:text-2xl font-serif font-bold text-cream-100">
          {tenantBranding ? `${tenantBranding.name}` : 'Cafe Administration Portal'}
        </h2>
        <p className="text-xs text-stone-400 mt-1 max-w-sm mx-auto">
          {cafeTagline}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white py-8 px-6 sm:px-10 shadow-2xl rounded-3xl border border-stone-200">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-3 text-red-900 text-xs">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs uppercase tracking-wider font-bold text-stone-600 block mb-1">
                Staff Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  autoComplete="username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter staff email"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-stone-900"
                />
              </div>
            </div>

            <div>
              <label className="text-xs uppercase tracking-wider font-bold text-stone-600 block mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-10 py-3 rounded-xl border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-stone-900 font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 p-0.5"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-stone-900 hover:bg-stone-800 text-white py-3.5 rounded-xl font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 pt-3"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4 text-amber-300" />
                </>
              )}
            </button>
          </form>
        </div>

        <div className="mt-6 text-center">
          <Link
            to="/super-admin/login"
            className="text-xs text-amber-400/80 hover:text-amber-300 underline font-medium"
          >
            Are you a platform administrator? Super Admin Login →
          </Link>
        </div>
      </div>
    </div>
  );
};
