import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../../services/api';
import { useSocket } from '../../context/SocketContext';
import { StatusBadge, PriorityBadge, CategoryBadge } from '../../components/Badges';
import { Inbox, Search, Filter, ArrowUpDown, Clock, ShieldAlert, BookOpen, User, Check, MessageSquare, Radio } from 'lucide-react';

interface TicketQueueItem {
  id: string;
  ticketNumber: number;
  subject: string;
  description: string;
  category: string;
  aiCategory?: string;
  isCategoryOverridden: boolean;
  priority: string;
  aiPriority?: string;
  isPriorityOverridden: boolean;
  status: string;
  createdAt: string;
  updatedAt: string;
  author: {
    id: string;
    authorId: string;
    name: string;
    email: string;
    city: string;
  };
  book?: {
    id: string;
    title: string;
    isbn: string;
    status: string;
    royaltyPending: number;
  } | null;
  assignedTo?: {
    id: string;
    name: string;
    email: string;
  } | null;
  _count?: {
    messages: number;
  };
}

const CATEGORIES = [
  'ALL',
  'Royalty & Payments',
  'ISBN & Metadata Issues',
  'Printing & Quality',
  'Distribution & Availability',
  'Book Status & Production Updates',
  'General Inquiry',
];

const PRIORITIES = ['ALL', 'Critical', 'High', 'Medium', 'Low'];
const STATUSES = ['ALL', 'Open', 'In Progress', 'Resolved', 'Closed'];

export const AdminTicketQueue: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { socket } = useSocket();

  const [tickets, setTickets] = useState<TicketQueueItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters state initialized from URL search params
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'ALL');
  const [categoryFilter, setCategoryFilter] = useState(searchParams.get('category') || 'ALL');
  const [priorityFilter, setPriorityFilter] = useState(searchParams.get('priority') || 'ALL');
  const [sortBy, setSortBy] = useState(searchParams.get('sortBy') || 'oldest_unresolved');
  const [search, setSearch] = useState(searchParams.get('search') || '');

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (statusFilter !== 'ALL') params.status = statusFilter;
      if (categoryFilter !== 'ALL') params.category = categoryFilter;
      if (priorityFilter !== 'ALL') params.priority = priorityFilter;
      if (sortBy) params.sortBy = sortBy;
      if (search.trim()) params.search = search.trim();

      const res = await api.get('/tickets', { params });
      setTickets(res.data.tickets);
    } catch (err) {
      console.error('Error fetching admin ticket queue', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [statusFilter, categoryFilter, priorityFilter, sortBy]);

  // Real-time socket events for admin queue
  useEffect(() => {
    if (!socket) return;

    const handleNewTicket = (newTicket: TicketQueueItem) => {
      setTickets((prev) => [newTicket, ...prev]);
    };

    const handleTicketUpdate = (updated: any) => {
      setTickets((prev) =>
        prev.map((t) => (t.id === updated.id ? { ...t, ...updated } : t))
      );
    };

    socket.on('ticket:new', handleNewTicket);
    socket.on('ticket:update', handleTicketUpdate);

    return () => {
      socket.off('ticket:new', handleNewTicket);
      socket.off('ticket:update', handleTicketUpdate);
    };
  }, [socket]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchTickets();
  };

  // Helper to determine if a ticket is an urgent unresolved backlog item (>24 hours and unresolved)
  const isUrgentOldUnresolved = (ticket: TicketQueueItem) => {
    if (ticket.status === 'Resolved' || ticket.status === 'Closed') return false;
    const diffHours = (Date.now() - new Date(ticket.createdAt).getTime()) / (1000 * 3600);
    return diffHours >= 24;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <Inbox className="w-6 h-6 text-indigo-600" />
              Incoming Ticket Queue
            </h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <Radio className="w-3 h-3 text-emerald-500 animate-pulse" />
              Socket Listening
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Monitor, prioritize, and respond to incoming author queries using AI assistance and BookLeaf Knowledge Base policies.
          </p>
        </div>

        <div className="text-right">
          <span className="text-xs text-slate-400">Total in Queue</span>
          <div className="text-xl font-bold text-slate-900">{tickets.length} Tickets</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-grow">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by author name, email, subject, description, or book title..."
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition"
          >
            Search
          </button>
        </form>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-100">
          {/* Status Filter */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full p-2 text-xs rounded-lg border border-slate-200 bg-slate-50 font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              {STATUSES.map((st) => (
                <option key={st} value={st}>
                  {st === 'ALL' ? 'All Statuses' : st}
                </option>
              ))}
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Category
            </label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full p-2 text-xs rounded-lg border border-slate-200 bg-slate-50 font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat === 'ALL' ? 'All Categories' : cat}
                </option>
              ))}
            </select>
          </div>

          {/* Priority Filter */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Priority
            </label>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="w-full p-2 text-xs rounded-lg border border-slate-200 bg-slate-50 font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              {PRIORITIES.map((pr) => (
                <option key={pr} value={pr}>
                  {pr === 'ALL' ? 'All Priorities' : pr}
                </option>
              ))}
            </select>
          </div>

          {/* Sort By */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Sort By
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full p-2 text-xs rounded-lg border border-slate-200 bg-slate-50 font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="oldest_unresolved">⚠️ Oldest Unresolved (Urgent First)</option>
              <option value="priority">🔥 Priority Score (Critical First)</option>
              <option value="newest">🕒 Newest Received</option>
              <option value="oldest">📅 Oldest Overall</option>
            </select>
          </div>
        </div>
      </div>

      {/* Ticket List */}
      {loading ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-slate-200">
          <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <div className="text-xs text-slate-500">Refreshing ticket queue...</div>
        </div>
      ) : tickets.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-slate-200">
          <Inbox className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-800">No tickets matching selected filters</h3>
          <p className="text-xs text-slate-400 mt-1">Try resetting the status or category filter.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tickets.map((t) => {
            const isOldBacklog = isUrgentOldUnresolved(t);
            const isCritical = t.priority === 'Critical';

            return (
              <Link
                key={t.id}
                to={`/admin/tickets/${t.id}`}
                className={`block bg-white p-5 rounded-2xl border transition group relative overflow-hidden ${
                  isCritical
                    ? 'border-rose-300 hover:border-rose-400 shadow-sm bg-rose-50/20'
                    : isOldBacklog
                    ? 'border-amber-300 hover:border-amber-400 bg-amber-50/20'
                    : 'border-slate-200 hover:border-indigo-300 hover:shadow-md'
                }`}
              >
                {/* Visual indicator bar on left for urgent flags */}
                {isCritical && (
                  <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-rose-600"></div>
                )}
                {!isCritical && isOldBacklog && (
                  <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-amber-500"></div>
                )}

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-2 max-w-3xl">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold font-mono text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                        #{t.ticketNumber}
                      </span>
                      <StatusBadge status={t.status} />
                      <CategoryBadge category={t.category} isAi={!t.isCategoryOverridden} />
                      <PriorityBadge priority={t.priority} isAi={!t.isPriorityOverridden} />

                      {/* Urgent warning flags */}
                      {isOldBacklog && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300 animate-pulse">
                          <Clock className="w-3 h-3 text-amber-700" />
                          Oldest Unresolved (&gt;24h)
                        </span>
                      )}

                      {t.isCategoryOverridden && (
                        <span className="text-[10px] text-slate-400 font-mono italic">
                          (Category overridden by admin)
                        </span>
                      )}
                    </div>

                    <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition">
                      {t.subject}
                    </h3>

                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                      {t.description}
                    </p>

                    {/* Metadata strip: Author, Book, Messages, Date */}
                    <div className="flex items-center gap-4 text-xs text-slate-500 flex-wrap pt-1">
                      <span className="flex items-center gap-1 font-medium text-slate-800">
                        <User className="w-3.5 h-3.5 text-brand-600" />
                        {t.author.name} <span className="text-slate-400 font-mono">({t.author.city})</span>
                      </span>

                      {t.book ? (
                        <span className="flex items-center gap-1 text-slate-600">
                          <BookOpen className="w-3.5 h-3.5 text-indigo-500" />
                          {t.book.title}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">General Query</span>
                      )}

                      <span className="flex items-center gap-1 text-slate-400">
                        <Clock className="w-3.5 h-3.5" />
                        Received {new Date(t.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </span>

                      <span className="flex items-center gap-1 text-indigo-600 font-semibold">
                        <MessageSquare className="w-3.5 h-3.5" />
                        {t._count?.messages || 0} msgs
                      </span>

                      {t.assignedTo && (
                        <span className="text-[11px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full font-medium">
                          Assigned: {t.assignedTo.name.split(' ')[0]}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-xs font-bold text-indigo-600 group-hover:translate-x-0.5 transition">
                      Open Triage & Draft →
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
};
