import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { DemoSwitcherModal } from '../components/DemoSwitcherModal';
import { BookOpen, Shield, User, ArrowRight, Lock, AlertCircle } from 'lucide-react';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [switcherOpen, setSwitcherOpen] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      if (email.includes('admin') || email.includes('support')) {
        navigate('/admin/dashboard');
      } else {
        navigate('/author/books');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (quickEmail: string, quickPass: string, role: 'ADMIN' | 'AUTHOR') => {
    setError('');
    setLoading(true);
    try {
      await login(quickEmail, quickPass);
      if (role === 'ADMIN') {
        navigate('/admin/dashboard');
      } else {
        navigate('/author/books');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to authenticate quick login.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-brand-600 to-brand-400 text-white shadow-xl shadow-brand-500/20 mb-4">
          <BookOpen className="w-8 h-8" />
        </div>
        <h2 className="text-3xl font-extrabold text-white tracking-tight">
          BookLeaf Publishing
        </h2>
        <p className="mt-2 text-sm text-slate-300">
          Author Support & Real-time Communication Portal
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white py-8 px-6 shadow-2xl rounded-2xl sm:px-10 border border-slate-100">
          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. priya.sharma@email.com"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-xl text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 transition shadow-md shadow-brand-500/20 disabled:opacity-50"
            >
              {loading ? 'Signing in...' : 'Sign In to Portal'}
            </button>
          </form>

          {/* Quick Demo Logins for Evaluator */}
          <div className="mt-6 pt-6 border-t border-slate-200">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider text-center mb-3">
              Fast 1-Click Evaluation Logins
            </div>
            <div className="space-y-2">
              <button
                onClick={() => handleQuickLogin('priya.sharma@email.com', 'author123', 'AUTHOR')}
                className="w-full py-2 px-3 rounded-lg text-xs font-medium text-slate-700 bg-slate-50 hover:bg-brand-50 hover:text-brand-700 border border-slate-200 flex items-center justify-between transition group"
              >
                <div className="flex items-center gap-2">
                  <User className="w-3.5 h-3.5 text-brand-600" />
                  <span>Author: <strong>Priya Sharma</strong> (AUTH001)</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-brand-600 transition" />
              </button>

              <button
                onClick={() => handleQuickLogin('rohit.kapoor@email.com', 'author123', 'AUTHOR')}
                className="w-full py-2 px-3 rounded-lg text-xs font-medium text-slate-700 bg-slate-50 hover:bg-brand-50 hover:text-brand-700 border border-slate-200 flex items-center justify-between transition group"
              >
                <div className="flex items-center gap-2">
                  <User className="w-3.5 h-3.5 text-brand-600" />
                  <span>Author: <strong>Rohit Kapoor</strong> (AUTH002)</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-brand-600 transition" />
              </button>

              <button
                onClick={() => handleQuickLogin('admin@bookleafpub.com', 'admin123', 'ADMIN')}
                className="w-full py-2 px-3 rounded-lg text-xs font-medium text-indigo-900 bg-indigo-50/70 hover:bg-indigo-100/70 border border-indigo-200 flex items-center justify-between transition group"
              >
                <div className="flex items-center gap-2">
                  <Shield className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Admin: <strong>Saloni Mourya</strong> (BookLeaf Ops)</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-indigo-600 transition" />
              </button>
            </div>

            <button
              onClick={() => setSwitcherOpen(true)}
              className="mt-3 w-full text-center text-xs text-brand-700 font-semibold hover:underline"
            >
              Browse all 10 pre-seeded author accounts →
            </button>
          </div>
        </div>
      </div>

      <DemoSwitcherModal isOpen={switcherOpen} onClose={() => setSwitcherOpen(false)} />
    </div>
  );
};
