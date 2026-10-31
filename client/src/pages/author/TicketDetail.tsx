import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { StatusBadge, PriorityBadge, CategoryBadge } from '../../components/Badges';
import { ArrowLeft, Send, Shield, User, Clock, BookOpen, Paperclip, Radio, CheckCircle } from 'lucide-react';

interface TicketMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  message: string;
  isInternal: boolean;
  createdAt: string;
}

interface TicketDetailData {
  id: string;
  ticketNumber: number;
  subject: string;
  description: string;
  attachmentName: string | null;
  category: string;
  priority: string;
  status: string;
  createdAt: string;
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
    genre: string;
    status: string;
    mrp: number | null;
    royaltyPending: number;
    availableOn: string[];
  } | null;
  messages: TicketMessage[];
}

export const AuthorTicketDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { socket, isConnected } = useSocket();

  const [ticket, setTicket] = useState<TicketDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchTicket = async () => {
    try {
      const res = await api.get(`/tickets/${id}`);
      setTicket(res.data.ticket);
    } catch (err) {
      console.error('Error fetching ticket details', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTicket();
  }, [id]);

  // Real-time room join & listeners
  useEffect(() => {
    if (!socket || !id) return;

    socket.emit('join:ticket', id);

    const handleTicketUpdate = (updated: any) => {
      if (updated.id === id) {
        setTicket((prev) => (prev ? { ...prev, ...updated } : prev));
      }
    };

    const handleNewMessage = (payload: any) => {
      if (payload.ticketId === id) {
        setTicket((prev) => {
          if (!prev) return prev;
          // Avoid duplicate messages if already present
          if (prev.messages.some((m) => m.id === payload.message.id)) return prev;
          return {
            ...prev,
            messages: [...prev.messages, payload.message],
          };
        });
      }
    };

    socket.on('ticket:update', handleTicketUpdate);
    socket.on('ticket:message', handleNewMessage);

    return () => {
      socket.emit('leave:ticket', id);
      socket.off('ticket:update', handleTicketUpdate);
      socket.off('ticket:message', handleNewMessage);
    };
  }, [socket, id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [ticket?.messages]);

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !id) return;

    setSending(true);
    try {
      const res = await api.post(`/tickets/${id}/messages`, {
        message: replyText.trim(),
        isInternal: false,
      });

      // Optimistically add message if socket doesn't loopback immediately
      setTicket((prev) => {
        if (!prev) return prev;
        if (prev.messages.some((m) => m.id === res.data.ticketMessage.id)) return prev;
        return {
          ...prev,
          messages: [...prev.messages, res.data.ticketMessage],
        };
      });

      setReplyText('');
    } catch (err) {
      console.error('Failed to post reply', err);
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center text-sm text-slate-500">
        <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
        Loading ticket conversation...
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <h3 className="text-base font-bold text-slate-800">Ticket not found</h3>
        <Link to="/author/tickets" className="text-brand-600 font-semibold text-xs mt-2 inline-block">
          ← Back to My Tickets
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-fade-in">
      {/* Back button & status strip */}
      <div className="flex items-center justify-between">
        <Link
          to="/author/tickets"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Tickets Queue
        </Link>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <Radio className="w-3 h-3 text-emerald-500 animate-pulse" />
            Live Sync
          </span>
        </div>
      </div>

      {/* Ticket Header Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-bold font-mono text-slate-900 bg-slate-100 px-2.5 py-0.5 rounded">
              Ticket #{ticket.ticketNumber}
            </span>
            <StatusBadge status={ticket.status} />
            <CategoryBadge category={ticket.category} />
            <PriorityBadge priority={ticket.priority} />
          </div>

          <div className="text-xs text-slate-400 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            Created {new Date(ticket.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>

        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 leading-tight">
          {ticket.subject}
        </h1>

        {/* Linked Book Info Pill */}
        {ticket.book && (
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between flex-wrap gap-2 text-xs">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-brand-600" />
              <span className="font-bold text-slate-900">{ticket.book.title}</span>
              <span className="text-slate-400 font-mono">({ticket.book.isbn})</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-slate-500">Status: <strong>{ticket.book.status}</strong></span>
              <span className="text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                Pending Royalty: ₹{ticket.book.royaltyPending.toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Message Thread */}
      <div className="space-y-4">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Conversation History
        </h2>

        {/* Initial Author Query */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-start gap-4">
          <div className="w-9 h-9 rounded-xl bg-brand-100 text-brand-800 flex items-center justify-center flex-shrink-0 font-bold text-xs">
            {ticket.author.name[0]}
          </div>
          <div className="space-y-2 flex-grow">
            <div className="flex items-center justify-between">
              <div className="text-xs font-bold text-slate-900">
                {ticket.author.name} <span className="font-normal text-slate-400">(Author)</span>
              </div>
              <div className="text-[11px] text-slate-400">
                {new Date(ticket.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
            <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
              {ticket.description}
            </p>

            {ticket.attachmentName && (
              <div className="pt-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-100 text-slate-700 text-xs font-medium">
                  <Paperclip className="w-3.5 h-3.5 text-slate-500" />
                  Attachment: {ticket.attachmentName}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Subsequent Responses */}
        {ticket.messages.map((msg) => {
          const isAdminMsg = msg.senderRole === 'ADMIN';
          return (
            <div
              key={msg.id}
              className={`p-5 rounded-2xl border shadow-sm flex items-start gap-4 animate-fade-in ${
                isAdminMsg
                  ? 'bg-gradient-to-br from-indigo-50/60 to-white border-indigo-200 ring-1 ring-indigo-50'
                  : 'bg-white border-slate-200'
              }`}
            >
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 font-bold text-xs ${
                  isAdminMsg
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                    : 'bg-brand-100 text-brand-800'
                }`}
              >
                {isAdminMsg ? <Shield className="w-4 h-4" /> : msg.senderName[0]}
              </div>

              <div className="space-y-2 flex-grow">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900">{msg.senderName}</span>
                    {isAdminMsg && (
                      <span className="text-[10px] font-semibold bg-indigo-100 text-indigo-800 px-2 py-0.2 rounded-full">
                        BookLeaf Ops Team
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    {new Date(msg.createdAt).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </div>

                <div className="text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">
                  {msg.message}
                </div>
              </div>
            </div>
          );
        })}

        <div ref={messagesEndRef} />
      </div>

      {/* Reply input box for author */}
      {ticket.status !== 'Closed' ? (
        <form onSubmit={handleSendReply} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
            Reply to BookLeaf Support Team
          </label>
          <textarea
            rows={4}
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder="Type your reply or additional details here..."
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition"
          ></textarea>

          <div className="flex items-center justify-between pt-1">
            <span className="text-[11px] text-slate-400">
              Responses appear immediately on the operations team console.
            </span>
            <button
              type="submit"
              disabled={sending || !replyText.trim()}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 transition shadow-sm disabled:opacity-50"
            >
              {sending ? (
                <span>Sending...</span>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Reply</span>
                </>
              )}
            </button>
          </div>
        </form>
      ) : (
        <div className="p-4 rounded-xl bg-slate-100 text-slate-600 text-xs text-center border border-slate-200">
          This support ticket has been closed. If you need further assistance, please open a new support query.
        </div>
      )}
    </div>
  );
};
