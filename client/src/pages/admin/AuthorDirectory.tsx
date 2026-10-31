import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Users, BookOpen, Inbox, Search, Mail, Phone, MapPin, ArrowRight } from 'lucide-react';

interface AuthorDirectoryItem {
  id: string;
  authorId: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  joinedDate: string;
  _count: {
    books: number;
    tickets: number;
  };
  books: Array<{
    id: string;
    title: string;
    status: string;
    royaltyPending: number;
  }>;
}

export const AuthorDirectory: React.FC = () => {
  const [authors, setAuthors] = useState<AuthorDirectoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const { login } = useAuth();

  useEffect(() => {
    const fetchAuthors = async () => {
      try {
        const res = await api.get('/authors');
        setAuthors(res.data.authors);
      } catch (err) {
        console.error('Failed to load author directory', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAuthors();
  }, []);

  const filteredAuthors = authors.filter(
    (a) =>
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.email.toLowerCase().includes(search.toLowerCase()) ||
      a.city.toLowerCase().includes(search.toLowerCase()) ||
      a.authorId.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-indigo-600" />
            Author Directory
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Browse all 10 pre-seeded BookLeaf authors, their titles, pending royalties, and support queries.
          </p>
        </div>

        <div className="w-full sm:w-72 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search author, city, email..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Directory Grid */}
      {loading ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-slate-200">
          <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <div className="text-xs text-slate-500">Loading author directory...</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredAuthors.map((author) => {
            const totalPending = author.books.reduce((acc, b) => acc + (b.royaltyPending || 0), 0);
            return (
              <div
                key={author.id}
                className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between hover:border-indigo-300 transition"
              >
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold bg-brand-50 text-brand-700 px-2 py-0.5 rounded border border-brand-200">
                          {author.authorId}
                        </span>
                        <span className="text-xs text-slate-400 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          {author.city}
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-slate-900 mt-1">{author.name}</h3>
                    </div>

                    <div className="text-right">
                      <div className="text-[10px] text-slate-400 uppercase font-semibold">Total Pending</div>
                      <div className="text-sm font-bold text-amber-600">
                        ₹{totalPending.toLocaleString('en-IN')}
                      </div>
                    </div>
                  </div>

                  {/* Contact details */}
                  <div className="text-xs text-slate-500 space-y-1">
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      <span>{author.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>{author.phone}</span>
                    </div>
                  </div>

                  {/* Titles */}
                  <div className="pt-3 border-t border-slate-100">
                    <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
                      <span>Published Books ({author._count.books})</span>
                      <span className="text-indigo-600 font-normal">{author._count.tickets} Tickets</span>
                    </div>
                    <div className="space-y-1.5">
                      {author.books.map((b) => (
                        <div
                          key={b.id}
                          className="p-2 rounded-lg bg-slate-50 border border-slate-100 text-xs flex items-center justify-between"
                        >
                          <span className="font-medium text-slate-800 truncate max-w-[240px]">
                            {b.title}
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            {b.status.includes('Live') ? 'Live' : 'In Production'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                  <Link
                    to={`/admin/tickets?search=${encodeURIComponent(author.name)}`}
                    className="text-xs font-semibold text-indigo-600 hover:underline flex items-center gap-1"
                  >
                    <Inbox className="w-3.5 h-3.5" />
                    View Author Tickets
                  </Link>

                  <button
                    onClick={() => login(author.email, 'author123')}
                    className="text-xs font-semibold text-brand-700 bg-brand-50 hover:bg-brand-100 px-3 py-1.5 rounded-lg border border-brand-200 transition flex items-center gap-1"
                  >
                    <span>Test As Author</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
