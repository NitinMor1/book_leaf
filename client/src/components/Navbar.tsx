import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { DemoSwitcherModal } from './DemoSwitcherModal';
import { BookOpen, LogOut, Radio, UserCheck, Code2, PlusCircle, Inbox, BookMarked, LayoutDashboard } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, logout, isAdmin, isAuthor } = useAuth();
  const { isConnected } = useSocket();
  const location = useLocation();
  const [switcherOpen, setSwitcherOpen] = useState(false);

  return (
    <>
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            {/* Left brand & main navigation */}
            <div className="flex items-center space-x-8">
              <Link to="/" className="flex items-center gap-2.5 group">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-700 to-brand-500 flex items-center justify-center text-white shadow-md shadow-brand-500/20 group-hover:scale-105 transition">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <span className="font-extrabold text-base tracking-tight text-slate-900 flex items-center gap-1.5">
                    BookLeaf
                    <span className="text-[10px] font-semibold tracking-wider uppercase px-1.5 py-0.5 rounded bg-brand-50 text-brand-700 border border-brand-200">
                      Publishing
                    </span>
                  </span>
                  <div className="text-[10px] text-slate-400 font-medium tracking-wide">
                    {isAdmin ? 'Ops & Support Portal' : 'Author Communication Portal'}
                  </div>
                </div>
              </Link>

              {/* Navigation Tabs */}
              {user && (
                <div className="hidden md:flex items-center space-x-1">
                  {isAuthor && (
                    <>
                      <Link
                        to="/author/books"
                        className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition ${
                          location.pathname === '/author/books'
                            ? 'bg-brand-50 text-brand-700'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                        }`}
                      >
                        <BookMarked className="w-4 h-4" />
                        My Books
                      </Link>
                      <Link
                        to="/author/tickets"
                        className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition ${
                          location.pathname.startsWith('/author/tickets')
                            ? 'bg-brand-50 text-brand-700'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                        }`}
                      >
                        <Inbox className="w-4 h-4" />
                        My Tickets
                      </Link>
                      <Link
                        to="/author/submit"
                        className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition ${
                          location.pathname === '/author/submit'
                            ? 'bg-brand-600 text-white shadow-sm hover:bg-brand-700'
                            : 'text-brand-700 bg-brand-50 hover:bg-brand-100'
                        }`}
                      >
                        <PlusCircle className="w-4 h-4" />
                        Raise Query
                      </Link>
                    </>
                  )}

                  {isAdmin && (
                    <>
                      <Link
                        to="/admin/dashboard"
                        className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition ${
                          location.pathname === '/admin/dashboard'
                            ? 'bg-indigo-50 text-indigo-700'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                        }`}
                      >
                        <LayoutDashboard className="w-4 h-4" />
                        Dashboard
                      </Link>
                      <Link
                        to="/admin/tickets"
                        className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition ${
                          location.pathname.startsWith('/admin/tickets')
                            ? 'bg-indigo-50 text-indigo-700'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                        }`}
                      >
                        <Inbox className="w-4 h-4" />
                        Ticket Queue
                      </Link>
                      <Link
                        to="/admin/authors"
                        className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition ${
                          location.pathname === '/admin/authors'
                            ? 'bg-indigo-50 text-indigo-700'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                        }`}
                      >
                        <UserCheck className="w-4 h-4" />
                        Authors Directory
                      </Link>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Right actions */}
            <div className="flex items-center space-x-3">
              {/* Real-time WebSocket connection indicator */}
              <div
                title={isConnected ? 'Real-time WebSocket connected' : 'Connecting to real-time events...'}
                className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200"
              >
                <Radio
                  className={`w-3.5 h-3.5 ${
                    isConnected ? 'text-emerald-500 animate-pulse' : 'text-amber-500'
                  }`}
                />
                <span>{isConnected ? 'Real-time Live' : 'Reconnecting'}</span>
              </div>

              {/* Swagger API docs link */}
              <a
                href="/api/docs"
                target="_blank"
                rel="noreferrer"
                className="hidden lg:inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition border border-slate-200"
              >
                <Code2 className="w-3.5 h-3.5 text-indigo-500" />
                API Docs
              </a>

              {/* Demo Switcher Button */}
              <button
                onClick={() => setSwitcherOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 transition shadow-sm"
              >
                <UserCheck className="w-3.5 h-3.5 text-brand-400" />
                <span>Switch Persona</span>
              </button>

              {/* User badge and logout */}
              {user && (
                <div className="flex items-center space-x-2 pl-2 border-l border-slate-200">
                  <div className="hidden sm:block text-right">
                    <div className="text-xs font-bold text-slate-900 truncate max-w-[140px]">
                      {user.name}
                    </div>
                    <div className="text-[10px] text-slate-500 flex items-center justify-end gap-1">
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          isAdmin ? 'bg-indigo-500' : 'bg-emerald-500'
                        }`}
                      ></span>
                      {user.role}
                    </div>
                  </div>
                  <button
                    onClick={logout}
                    title="Log out"
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Demo Account Switcher Modal */}
      <DemoSwitcherModal isOpen={switcherOpen} onClose={() => setSwitcherOpen(false)} />
    </>
  );
};
