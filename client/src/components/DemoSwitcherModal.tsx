import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Users, Shield, ArrowRight, X } from 'lucide-react';

interface DemoSwitcherModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DEMO_AUTHORS = [
  { id: 'AUTH001', name: 'Priya Sharma', email: 'priya.sharma@email.com', city: 'Mumbai', books: '2 Books (₹3,570 pending royalty)' },
  { id: 'AUTH002', name: 'Rohit Kapoor', email: 'rohit.kapoor@email.com', city: 'Delhi', books: '2 Books (Bestseller, ₹7,744 pending)' },
  { id: 'AUTH003', name: 'Ananya Reddy', email: 'ananya.reddy@email.com', city: 'Hyderabad', books: '1 Book (Zero payouts yet, ₹2,546 pending)' },
  { id: 'AUTH004', name: 'Vikram Joshi', email: 'vikram.joshi@email.com', city: 'Pune', books: '2 Books (₹3,350 pending)' },
  { id: 'AUTH005', name: 'Meera Nair', email: 'meera.nair@email.com', city: 'Kochi', books: '2 Books (₹3,055 pending)' },
  { id: 'AUTH006', name: 'Arjun Malhotra', email: 'arjun.malhotra@email.com', city: 'Chandigarh', books: '1 Book (Recent release, ₹2,464 pending)' },
  { id: 'AUTH007', name: 'Sneha Kulkarni', email: 'sneha.kulkarni@email.com', city: 'Bangalore', books: '3 Books (1 in production, 1,567 sold)' },
  { id: 'AUTH008', name: 'Farhan Sheikh', email: 'farhan.sheikh@email.com', city: 'Lucknow', books: '1 Book (All royalties settled)' },
  { id: 'AUTH009', name: 'Kavita Deshmukh', email: 'kavita.deshmukh@email.com', city: 'Nagpur', books: '2 Books (1 in typesetting, 1 live)' },
  { id: 'AUTH010', name: 'Diya Chatterjee', email: 'diya.chatterjee@email.com', city: 'Kolkata', books: '2 Books (612 copies sold)' },
];

const DEMO_ADMINS = [
  { name: 'Saloni Mourya (BookLeaf Ops)', email: 'admin@bookleafpub.com', role: 'Lead Operations & Triage' },
  { name: 'BookLeaf Support Team', email: 'support@bookleafpub.com', role: 'Author Success Desk' },
];

export const DemoSwitcherModal: React.FC<DemoSwitcherModalProps> = ({ isOpen, onClose }) => {
  const { login, user } = useAuth();

  if (!isOpen) return null;

  const handleSelectUser = async (email: string, password?: string) => {
    try {
      await login(email, password);
      onClose();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div>
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-brand-600" />
              1-Click Demo Account Switcher
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Instantly test the Author and Admin portals using official sample dataset personas.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-6">
          {/* Admin Accounts */}
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5">
              <Shield className="w-3.5 h-3.5 text-indigo-600" />
              BookLeaf Operations Team (Admin Portal)
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {DEMO_ADMINS.map((adm) => {
                const isCurrent = user?.email === adm.email;
                return (
                  <button
                    key={adm.email}
                    onClick={() => handleSelectUser(adm.email, 'admin123')}
                    className={`text-left p-3 rounded-xl border transition flex items-center justify-between group ${
                      isCurrent
                        ? 'border-indigo-500 bg-indigo-50/50 ring-1 ring-indigo-500'
                        : 'border-slate-200 hover:border-indigo-300 hover:bg-slate-50'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-semibold text-slate-900 flex items-center gap-1.5">
                        {adm.name}
                        {isCurrent && <span className="text-[10px] bg-indigo-600 text-white px-1.5 py-0.2 rounded-full">Current</span>}
                      </div>
                      <div className="text-[11px] text-slate-500">{adm.email}</div>
                      <div className="text-[10px] text-indigo-600 font-medium mt-0.5">{adm.role}</div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition" />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Seeded Authors */}
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5">
              <Users className="w-3.5 h-3.5 text-brand-600" />
              Pre-seeded Authors (10 Sample Accounts)
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-72 overflow-y-auto pr-1">
              {DEMO_AUTHORS.map((auth) => {
                const isCurrent = user?.email === auth.email;
                return (
                  <button
                    key={auth.id}
                    onClick={() => handleSelectUser(auth.email, 'author123')}
                    className={`text-left p-2.5 rounded-xl border transition flex items-center justify-between group ${
                      isCurrent
                        ? 'border-brand-500 bg-brand-50/50 ring-1 ring-brand-500'
                        : 'border-slate-200 hover:border-brand-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="overflow-hidden">
                      <div className="text-xs font-semibold text-slate-900 truncate flex items-center gap-1.5">
                        {auth.name}
                        <span className="text-[10px] text-slate-400 font-mono">({auth.city})</span>
                        {isCurrent && <span className="text-[10px] bg-brand-600 text-white px-1.5 py-0.2 rounded-full">Current</span>}
                      </div>
                      <div className="text-[11px] text-slate-500 truncate">{auth.email}</div>
                      <div className="text-[10px] text-emerald-700 font-medium mt-0.5 truncate">{auth.books}</div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-brand-600 group-hover:translate-x-0.5 transition flex-shrink-0 ml-1.5" />
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3.5 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <div>
            Default passwords: <code className="bg-slate-200 px-1 py-0.5 rounded text-[11px]">admin123</code> (Admin), <code className="bg-slate-200 px-1 py-0.5 rounded text-[11px]">author123</code> (Author)
          </div>
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-slate-600 hover:bg-slate-200/60 rounded-lg font-medium transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
