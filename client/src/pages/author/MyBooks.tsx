import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { BookStatusBadge } from '../../components/Badges';
import { BookOpen, DollarSign, ShoppingCart, Clock, CheckCircle, PlusCircle, HelpCircle, AlertCircle, ExternalLink } from 'lucide-react';

interface Book {
  id: string;
  title: string;
  isbn: string;
  genre: string;
  publicationDate: string | null;
  status: string;
  mrp: number | null;
  authorRoyaltyPerCopy: number | null;
  totalCopiesSold: number;
  totalRoyaltyEarned: number;
  royaltyPaid: number;
  royaltyPending: number;
  lastRoyaltyPayoutDate: string | null;
  printPartner: string | null;
  availableOn: string[];
}

interface Summary {
  totalBooks: number;
  totalCopiesSold: number;
  totalRoyaltyEarned: number;
  totalRoyaltyPaid: number;
  totalRoyaltyPending: number;
}

export const MyBooks: React.FC = () => {
  const { user } = useAuth();
  const [books, setBooks] = useState<Book[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBooks = async () => {
      try {
        const res = await api.get('/books');
        setBooks(res.data.books);
        setSummary(res.data.summary);
      } catch (err) {
        console.error('Failed to load author books', err);
      } finally {
        setLoading(false);
      }
    };

    fetchBooks();
  }, []);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 flex justify-center items-center">
        <div className="flex items-center gap-3 text-slate-500 text-sm">
          <div className="w-5 h-5 border-2 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
          Loading your published catalog & royalties...
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      {/* Welcome header & quick action */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-brand-50 text-brand-700 border border-brand-200">
              Author ID: {user?.authorId || 'AUTH'}
            </span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs text-slate-500">{user?.city}, India</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">
            Welcome back, {user?.name}
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Manage your published titles, track real-time royalties, and monitor quarterly disbursements.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/author/submit"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 transition shadow-sm"
          >
            <PlusCircle className="w-4 h-4" />
            Submit Support Ticket
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider">
              <span>Catalog Titles</span>
              <BookOpen className="w-4 h-4 text-brand-600" />
            </div>
            <div className="text-2xl font-black text-slate-900 mt-2">
              {summary.totalBooks}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">Active in catalog</div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider">
              <span>Copies Sold</span>
              <ShoppingCart className="w-4 h-4 text-sky-600" />
            </div>
            <div className="text-2xl font-black text-slate-900 mt-2">
              {summary.totalCopiesSold.toLocaleString('en-IN')}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">Across all retail channels</div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider">
              <span>Total Earned</span>
              <DollarSign className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-black text-emerald-700 mt-2">
              ₹{summary.totalRoyaltyEarned.toLocaleString('en-IN')}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">80% author profit split</div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider">
              <span>Royalty Disbursed</span>
              <CheckCircle className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-2xl font-black text-slate-900 mt-2">
              ₹{summary.totalRoyaltyPaid.toLocaleString('en-IN')}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">Paid via bank transfer</div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm bg-gradient-to-br from-amber-50/50 to-white">
            <div className="flex items-center justify-between text-amber-700 text-xs font-semibold uppercase tracking-wider">
              <span>Pending Payout</span>
              <Clock className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-2xl font-black text-amber-600 mt-2">
              ₹{summary.totalRoyaltyPending.toLocaleString('en-IN')}
            </div>
            <div className="text-[11px] text-amber-700/80 mt-1">
              {summary.totalRoyaltyPending >= 1000
                ? 'Queued for next quarterly cycle'
                : 'Rolls over (min ₹1,000 threshold)'}
            </div>
          </div>
        </div>
      )}

      {/* BookLeaf Royalty Transparency Policy Banner */}
      <div className="p-4 rounded-xl bg-slate-900 text-slate-200 text-xs flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-md">
        <div className="flex items-start gap-3">
          <HelpCircle className="w-4 h-4 text-brand-400 flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-white">BookLeaf Royalty Policy Summary: </span>
            80% of net profits (MRP - print cost - retailer fee - shipping) are paid quarterly within 45 days. Minimum payout threshold is ₹1,000.
          </div>
        </div>
        <Link
          to="/author/submit"
          className="text-brand-300 hover:text-brand-200 font-semibold whitespace-nowrap inline-flex items-center gap-1"
        >
          Have questions? Ask AI Support →
        </Link>
      </div>

      {/* Books Catalog Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-brand-600" />
            Your Books Catalog ({books.length})
          </h2>
          <span className="text-xs text-slate-400">All data synced with master publisher imprint</span>
        </div>

        {books.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-2xl border border-slate-200">
            <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-slate-700">No books found</h3>
            <p className="text-xs text-slate-400 mt-1">You do not have any published or in-production books registered yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {books.map((b) => {
              const inProduction = !b.status.includes('Published & Live');
              return (
                <div
                  key={b.id}
                  className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col justify-between hover:border-slate-300 transition"
                >
                  <div className="p-6">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-bold">
                            {b.id}
                          </span>
                          <span className="text-xs text-slate-500 font-medium">{b.genre}</span>
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 leading-snug">
                          {b.title}
                        </h3>
                        <div className="text-xs text-slate-400 font-mono mt-0.5">
                          ISBN: {b.isbn}
                        </div>
                      </div>
                      <BookStatusBadge status={b.status} />
                    </div>

                    {/* Financial & Performance breakdown */}
                    <div className="mt-6 pt-5 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-3 gap-4">
                      <div>
                        <div className="text-[11px] text-slate-400 uppercase font-semibold">MRP</div>
                        <div className="text-sm font-bold text-slate-900 mt-0.5">
                          {b.mrp ? `₹${b.mrp}` : <span className="text-slate-400 text-xs italic">In Production</span>}
                        </div>
                      </div>

                      <div>
                        <div className="text-[11px] text-slate-400 uppercase font-semibold">Author Royalty/Copy</div>
                        <div className="text-sm font-bold text-slate-900 mt-0.5">
                          {b.authorRoyaltyPerCopy ? `₹${b.authorRoyaltyPerCopy}` : <span className="text-slate-400 text-xs italic">N/A</span>}
                        </div>
                      </div>

                      <div>
                        <div className="text-[11px] text-slate-400 uppercase font-semibold">Copies Sold</div>
                        <div className="text-sm font-bold text-slate-900 mt-0.5">
                          {b.totalCopiesSold.toLocaleString('en-IN')}
                        </div>
                      </div>

                      <div>
                        <div className="text-[11px] text-slate-400 uppercase font-semibold">Royalty Earned</div>
                        <div className="text-sm font-bold text-emerald-700 mt-0.5">
                          ₹{b.totalRoyaltyEarned.toLocaleString('en-IN')}
                        </div>
                      </div>

                      <div>
                        <div className="text-[11px] text-slate-400 uppercase font-semibold">Royalty Paid</div>
                        <div className="text-sm font-bold text-slate-900 mt-0.5">
                          ₹{b.royaltyPaid.toLocaleString('en-IN')}
                        </div>
                      </div>

                      <div>
                        <div className="text-[11px] text-slate-400 uppercase font-semibold">Royalty Pending</div>
                        <div className="text-sm font-bold text-amber-600 mt-0.5">
                          ₹{b.royaltyPending.toLocaleString('en-IN')}
                        </div>
                      </div>
                    </div>

                    {/* Extra details: Print partner, last payout, channels */}
                    <div className="mt-5 pt-4 border-t border-slate-100 text-xs space-y-2">
                      <div className="flex items-center justify-between text-slate-500">
                        <span>Publication Date:</span>
                        <span className="font-medium text-slate-800">
                          {b.publicationDate ? new Date(b.publicationDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Pending Release'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-slate-500">
                        <span>Print Partner:</span>
                        <span className="font-medium text-slate-800">
                          {b.printPartner || 'In-House Facility (Delhi)'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-slate-500">
                        <span>Last Payout:</span>
                        <span className="font-medium text-slate-800">
                          {b.lastRoyaltyPayoutDate ? new Date(b.lastRoyaltyPayoutDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'No payouts processed yet'}
                        </span>
                      </div>

                      {/* Retail Platforms */}
                      <div className="pt-2">
                        <div className="text-[11px] text-slate-400 mb-1.5 font-medium">Available Retail Channels:</div>
                        <div className="flex flex-wrap gap-1.5">
                          {b.availableOn && b.availableOn.length > 0 ? (
                            b.availableOn.map((ch) => (
                              <span
                                key={ch}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700 border border-slate-200"
                              >
                                {ch}
                                <ExternalLink className="w-2.5 h-2.5 text-slate-400" />
                              </span>
                            ))
                          ) : (
                            <span className="text-[11px] text-slate-400 italic">Distribution setup pending release</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card Action footer */}
                  <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400">
                      {inProduction ? 'Need an update on this title?' : 'Questions about sales or royalties?'}
                    </span>
                    <Link
                      to={`/author/submit?bookId=${b.id}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-brand-700 bg-white border border-brand-200 hover:bg-brand-50 transition shadow-sm"
                    >
                      <PlusCircle className="w-3.5 h-3.5 text-brand-600" />
                      Raise Ticket for this Book
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
