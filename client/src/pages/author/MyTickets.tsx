import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { useSocket } from '../../context/SocketContext';
import { StatusBadge, PriorityBadge, CategoryBadge } from '../../components/Badges';
import { Inbox, PlusCircle, MessageSquare, Clock, ArrowRight, BookOpen, Radio } from 'lucide-react';

interface TicketItem {
  id: string;
  ticketNumber: number;
  subject: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  book?: {
    id: string;
    title: string;
    isbn: string;
  } | null;
  _count?: {
    messages: number;
  };
}

export const MyTickets: React.FC = () => {
  const [tickets, setTickets] = useState<TicketItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { socket, isConnected } = useSocket();

  const fetchTickets = async () => {
    try {
      const res = await api.get('/tickets');
      setTickets(res.data.tickets);
    } catch (err) {
      console.error('Error fetching author tickets', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  // Real-time WebSocket listener
  useEffect(() => {
    if (!socket) return;

    const handleTicketUpdate = (updated: any) => {
      setTickets((prev) =>
        prev.map((t) => (t.id === updated.id ? { ...t, ...updated } : t))
      );
    };

    const handleNewMessage = (payload: any) => {
      // If a message arrives for any of this author's tickets, refresh or increment count
      setTickets((prev) =>
        prev.map((t) => {
          if (t.id === payload.ticketId) {
            return {
              ...t,
              _count: { messages: (t._count?.messages || 0) + 1 },
              updatedAt: new Date().toISOString(),
            };
          }
          return t;
        })
      );
    };

    socket.on('ticket:update', handleTicketUpdate);
    socket.on('ticket:message', handleNewMessage);

    return () => {
      socket.off('ticket:update', handleTicketUpdate);
      socket.off('ticket:message', handleNewMessage);
    };
  }, [socket]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <Inbox className="w-6 h-6 text-brand-600" />
              My Support Queries
            </h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <Radio className="w-3 h-3 text-emerald-500 animate-pulse" />
              Real-time Active
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Track real-time responses from the BookLeaf operations team. No page refresh needed.
          </p>
        </div>

        <Link
          to="/author/submit"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 transition shadow-sm"
        >
          <PlusCircle className="w-4 h-4" />
          Raise New Query
        </Link>
      </div>

      {/* Tickets List */}
      {loading ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-slate-200">
          <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <div className="text-xs text-slate-500">Loading your support tickets...</div>
        </div>
      ) : tickets.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-slate-200">
          <Inbox className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-800">No support tickets found</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            You haven't submitted any queries yet. If you have questions regarding royalties, copies, or status, click below to open a ticket.
          </p>
          <Link
            to="/author/submit"
            className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 transition"
          >
            <PlusCircle className="w-4 h-4" />
            Raise Your First Query
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {tickets.map((t) => (
            <Link
              key={t.id}
              to={`/author/tickets/${t.id}`}
              className="block bg-white p-5 rounded-2xl border border-slate-200 hover:border-brand-300 hover:shadow-md transition group"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-2 max-w-3xl">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold font-mono text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                      #{t.ticketNumber}
                    </span>
                    <StatusBadge status={t.status} />
                    <CategoryBadge category={t.category} />
                    <PriorityBadge priority={t.priority} />
                  </div>

                  <h3 className="text-base font-bold text-slate-900 group-hover:text-brand-700 transition">
                    {t.subject}
                  </h3>

                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                    {t.description}
                  </p>

                  <div className="flex items-center gap-4 text-xs text-slate-400 flex-wrap pt-1">
                    {t.book ? (
                      <span className="flex items-center gap-1 text-slate-600 font-medium">
                        <BookOpen className="w-3.5 h-3.5 text-brand-600" />
                        {t.book.title} ({t.book.id})
                      </span>
                    ) : (
                      <span className="text-slate-400 italic">General Account Query</span>
                    )}

                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      Submitted {new Date(t.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>

                    <span className="flex items-center gap-1 text-brand-700 font-semibold">
                      <MessageSquare className="w-3.5 h-3.5" />
                      {t._count?.messages || 0} Responses
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 group-hover:text-brand-600 transition flex-shrink-0">
                  <span>View Discussion</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};
