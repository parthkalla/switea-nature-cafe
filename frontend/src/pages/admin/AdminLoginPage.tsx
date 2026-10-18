import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Lock, Mail, Leaf, AlertCircle, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const AdminLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState('owner@switea.com');
  const [password, setPassword] = useState('Password123!');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const user = await login({ email, password });
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

  const handleQuickLogin = (quickEmail: string) => {
    setEmail(quickEmail);
    setPassword('Password123!');
  };

  return (
    <div className="min-h-screen bg-nature-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 selection:bg-nature-300">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link to="/" className="inline-flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-full bg-nature-800 flex items-center justify-center shadow-lg">
            <Leaf className="w-6 h-6 text-nature-300" />
          </div>
          <span className="font-serif text-3xl font-bold text-white tracking-tight">Switea</span>
        </Link>
        <h2 className="text-xl font-bold text-cream-100">Cafe Administration Portal</h2>
        <p className="text-xs text-nature-300 mt-1">Sign in to manage orders, tables, and menu</p>
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
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="owner@switea.com"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-nature-800"
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
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-nature-800"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-nature-900 hover:bg-nature-950 text-white py-3.5 rounded-xl font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 pt-3"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4 text-nature-300" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Credentials Buttons */}
          <div className="mt-6 pt-6 border-t border-stone-100">
            <span className="text-[11px] uppercase tracking-wider font-bold text-stone-400 block mb-2 text-center">
              Quick One-Click Test Accounts
            </span>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleQuickLogin('owner@switea.com')}
                className="py-1.5 px-2 bg-stone-100 hover:bg-stone-200 rounded-lg text-stone-700 font-medium text-center"
              >
                Owner
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('manager@switea.com')}
                className="py-1.5 px-2 bg-stone-100 hover:bg-stone-200 rounded-lg text-stone-700 font-medium text-center"
              >
                Manager
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('kitchen@switea.com')}
                className="py-1.5 px-2 bg-stone-100 hover:bg-stone-200 rounded-lg text-stone-700 font-medium text-center"
              >
                Kitchen
              </button>
            </div>
          </div>
        </div>

        <div className="mt-6 text-center">
          <Link to="/super-admin/login" className="text-xs text-nature-400 hover:text-white underline">
            Are you a platform administrator? Super Admin Login →
          </Link>
        </div>
      </div>
    </div>
  );
};
