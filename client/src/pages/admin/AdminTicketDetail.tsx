import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { StatusBadge, PriorityBadge, CategoryBadge, BookStatusBadge } from '../../components/Badges';
import {
  ArrowLeft,
  Sparkles,
  RefreshCw,
  Send,
  Lock,
  User,
  BookOpen,
  DollarSign,
  Shield,
  Clock,
  Radio,
  CheckCircle2,
  Copy,
  AlertTriangle,
  Edit3,
} from 'lucide-react';

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
  aiCategory?: string;
  isCategoryOverridden: boolean;
  priority: string;
  aiPriority?: string;
  isPriorityOverridden: boolean;
  status: string;
  aiDraftResponse: string | null;
  createdAt: string;
  assignedToId: string | null;
  assignedTo?: {
    id: string;
    name: string;
    email: string;
  } | null;
  author: {
    id: string;
    authorId: string;
    name: string;
    email: string;
    phone: string;
    city: string;
    joinedDate: string;
  };
  book?: {
    id: string;
    title: string;
    isbn: string;
    genre: string;
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
  } | null;
  messages: TicketMessage[];
}

const CATEGORIES = [
  'Royalty & Payments',
  'ISBN & Metadata Issues',
  'Printing & Quality',
  'Distribution & Availability',
  'Book Status & Production Updates',
  'General Inquiry',
];

const PRIORITIES = ['Critical', 'High', 'Medium', 'Low'];
const STATUSES = ['Open', 'In Progress', 'Resolved', 'Closed'];

export const AdminTicketDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { socket } = useSocket();

  const [ticket, setTicket] = useState<TicketDetailData | null>(null);
  const [loading, setLoading] = useState(true);

  // Editable draft in the reply area
  const [draftMessage, setDraftMessage] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [newStatus, setNewStatus] = useState<string>('In Progress');
  const [sending, setSending] = useState(false);
  const [regeneratingDraft, setRegeneratingDraft] = useState(false);
  const [copiedDraft, setCopiedDraft] = useState(false);

  // Overrides dropdown state
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedPriority, setSelectedPriority] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [savingOverrides, setSavingOverrides] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchTicket = async () => {
    try {
      const res = await api.get(`/tickets/${id}`);
      const t = res.data.ticket;
      setTicket(t);
      setSelectedCategory(t.category);
      setSelectedPriority(t.priority);
      setSelectedStatus(t.status);

      // Pre-fill reply text area with AI draft if empty
      if (!draftMessage && t.aiDraftResponse) {
        setDraftMessage(t.aiDraftResponse);
      }
    } catch (err) {
      console.error('Error fetching ticket', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTicket();
  }, [id]);

  // Real-time socket events
  useEffect(() => {
    if (!socket || !id) return;

    socket.emit('join:ticket', id);

    const handleTicketUpdate = (updated: any) => {
      if (updated.id === id) {
        setTicket((prev) => (prev ? { ...prev, ...updated } : prev));
        setSelectedCategory(updated.category);
        setSelectedPriority(updated.priority);
        setSelectedStatus(updated.status);
      }
    };

    const handleNewMessage = (payload: any) => {
      if (payload.ticketId === id) {
        setTicket((prev) => {
          if (!prev) return prev;
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

  // Handle saving category / priority override or status change
  const handleSaveOverrides = async () => {
    if (!id || !ticket) return;
    setSavingOverrides(true);
    try {
      const res = await api.patch(`/tickets/${id}`, {
        category: selectedCategory,
        priority: selectedPriority,
        status: selectedStatus,
      });
      setTicket(res.data.ticket);
    } catch (err) {
      console.error('Error updating ticket properties', err);
    } finally {
      setSavingOverrides(false);
    }
  };

  // Assign to current admin user
  const handleAssignToMe = async () => {
    if (!id || !user) return;
    try {
      const res = await api.patch(`/tickets/${id}`, {
        assignedToId: user.id,
      });
      setTicket(res.data.ticket);
    } catch (err) {
      console.error('Error assigning ticket', err);
    }
  };

  // Regenerate AI Draft on demand
  const handleRegenerateDraft = async () => {
    if (!id) return;
    setRegeneratingDraft(true);
    try {
      const res = await api.post(`/tickets/${id}/regenerate-draft`);
      const freshDraft = res.data.aiDraftResponse;
      setTicket((prev) => (prev ? { ...prev, aiDraftResponse: freshDraft } : prev));
      setDraftMessage(freshDraft);
    } catch (err) {
      console.error('Error regenerating AI draft', err);
    } finally {
      setRegeneratingDraft(false);
    }
  };

  // Copy AI draft to editor
  const handleApplyDraft = () => {
    if (ticket?.aiDraftResponse) {
      setDraftMessage(ticket.aiDraftResponse);
      setIsInternal(false);
      setCopiedDraft(true);
      setTimeout(() => setCopiedDraft(false), 2000);
    }
  };

  // Send message / internal note
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draftMessage.trim() || !id) return;

    setSending(true);
    try {
      const res = await api.post(`/tickets/${id}/messages`, {
        message: draftMessage.trim(),
        isInternal,
        updateStatus: !isInternal ? newStatus : undefined,
      });

      setTicket((prev) => {
        if (!prev) return prev;
        if (prev.messages.some((m) => m.id === res.data.ticketMessage.id)) return prev;
        return {
          ...prev,
          status: res.data.ticketStatus || prev.status,
          messages: [...prev.messages, res.data.ticketMessage],
        };
      });

      setSelectedStatus(res.data.ticketStatus || ticket?.status || 'In Progress');
      setDraftMessage('');
    } catch (err) {
      console.error('Failed to send message', err);
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 text-center text-sm text-slate-500">
        <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
        Loading ticket triage console...
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 text-center">
        <h3 className="text-base font-bold text-slate-800">Ticket not found</h3>
        <Link to="/admin/tickets" className="text-indigo-600 font-semibold text-xs mt-2 inline-block">
          ← Back to Ticket Queue
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-fade-in">
      {/* Top navigation */}
      <div className="flex items-center justify-between">
        <Link
          to="/admin/tickets"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Ticket Queue
        </Link>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <Radio className="w-3 h-3 text-emerald-500 animate-pulse" />
            Live Sync
          </span>
        </div>
      </div>

      {/* Main 2-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Author info, Linked book, Triage controls, and Overrides (1 col) */}
        <div className="space-y-6">
          {/* Author Profile Card */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Author Profile
              </span>
              <span className="text-xs font-mono font-bold bg-brand-50 text-brand-700 px-2 py-0.5 rounded border border-brand-200">
                {ticket.author.authorId}
              </span>
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-900">{ticket.author.name}</h3>
              <div className="text-xs text-slate-500">{ticket.author.email}</div>
              <div className="text-xs text-slate-400 mt-1">{ticket.author.phone} • {ticket.author.city}</div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
              <span>Onboarded:</span>
              <span className="font-medium text-slate-700">
                {new Date(ticket.author.joinedDate).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
              </span>
            </div>
          </div>

          {/* Associated Book Card */}
          {ticket.book ? (
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Associated Title
                </span>
                <span className="text-xs font-mono font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                  {ticket.book.id}
                </span>
              </div>

              <div>
                <h4 className="text-sm font-bold text-slate-900 leading-snug">{ticket.book.title}</h4>
                <div className="text-xs text-slate-400 font-mono mt-0.5">ISBN: {ticket.book.isbn}</div>
                <div className="mt-1.5">
                  <BookStatusBadge status={ticket.book.status} />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <div className="text-slate-400 text-[10px] uppercase">Sold</div>
                  <div className="font-bold text-slate-900">{ticket.book.totalCopiesSold} copies</div>
                </div>
                <div>
                  <div className="text-slate-400 text-[10px] uppercase">Pending Royalty</div>
                  <div className="font-bold text-amber-600">₹{ticket.book.royaltyPending.toLocaleString('en-IN')}</div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 text-xs text-slate-500">
                Print Partner: <strong>{ticket.book.printPartner || 'In-House'}</strong>
              </div>
            </div>
          ) : (
            <div className="bg-white p-4 rounded-2xl border border-slate-200 text-xs text-slate-500 italic">
              No specific book linked (General / Account inquiry)
            </div>
          )}

          {/* AI Triage & Admin Overrides Card */}
          <div className="bg-white p-5 rounded-2xl border border-indigo-100 shadow-sm space-y-4 ring-1 ring-indigo-50">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-900 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                AI Triage & Override Controls
              </h3>
            </div>

            {/* Category Override */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-medium text-slate-700">Category:</span>
                {ticket.isCategoryOverridden ? (
                  <span className="text-[10px] text-amber-600 font-bold">Admin Overridden</span>
                ) : (
                  <span className="text-[10px] text-indigo-600 font-mono font-medium">🤖 AI Classified</span>
                )}
              </div>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full p-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-800 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Priority Override */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-medium text-slate-700">Priority Score:</span>
                {ticket.isPriorityOverridden ? (
                  <span className="text-[10px] text-amber-600 font-bold">Admin Overridden</span>
                ) : (
                  <span className="text-[10px] text-indigo-600 font-mono font-medium">🤖 AI Scored</span>
                )}
              </div>
              <select
                value={selectedPriority}
                onChange={(e) => setSelectedPriority(e.target.value)}
                className="w-full p-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-800 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                {PRIORITIES.map((pr) => (
                  <option key={pr} value={pr}>
                    {pr}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Change */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Ticket Status:
              </label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full p-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-800 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                {STATUSES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handleSaveOverrides}
              disabled={savingOverrides}
              className="w-full py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition disabled:opacity-50"
            >
              {savingOverrides ? 'Saving Overrides...' : 'Update Ticket Properties'}
            </button>

            {/* Assignment */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-500">
                Assigned to: <strong>{ticket.assignedTo?.name || 'Unassigned'}</strong>
              </span>
              <button
                onClick={handleAssignToMe}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
              >
                Assign to Me
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Original Query, AI-Drafted Response, Message Thread & Reply Console (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Ticket Header & Query */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-bold font-mono text-slate-900 bg-slate-100 px-2.5 py-0.5 rounded">
                  #{ticket.ticketNumber}
                </span>
                <StatusBadge status={ticket.status} />
                <CategoryBadge category={ticket.category} isAi={!ticket.isCategoryOverridden} />
                <PriorityBadge priority={ticket.priority} isAi={!ticket.isPriorityOverridden} />
              </div>

              <div className="text-xs text-slate-400 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                Received {new Date(ticket.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>

            <h1 className="text-xl font-bold text-slate-900">
              {ticket.subject}
            </h1>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">
              {ticket.description}
            </div>

            {ticket.attachmentName && (
              <div className="text-xs text-slate-500 flex items-center gap-1">
                <span>Attachment:</span>
                <span className="font-semibold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
                  {ticket.attachmentName}
                </span>
              </div>
            )}
          </div>

          {/* AI-Drafted Response Panel (Requirement: presented when admin opens ticket, editable before sending) */}
          {ticket.aiDraftResponse && (
            <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-indigo-950 text-white p-6 rounded-2xl shadow-lg border border-indigo-700/40 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-indigo-500/30 text-indigo-300 flex items-center justify-center">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-200">
                      AI-Drafted Response (BookLeaf KB Grounded)
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Calibrated with 80/20 royalty policy, 48h resolution SLA, and empathetic tone guidelines.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleRegenerateDraft}
                    disabled={regeneratingDraft}
                    title="Regenerate AI Draft"
                    className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-indigo-200 transition text-xs flex items-center gap-1 disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${regeneratingDraft ? 'animate-spin' : ''}`} />
                    <span className="hidden sm:inline">Regenerate</span>
                  </button>

                  <button
                    onClick={handleApplyDraft}
                    className="px-3 py-1.5 rounded-lg bg-indigo-500 hover:bg-indigo-400 text-white text-xs font-semibold transition flex items-center gap-1 shadow-md shadow-indigo-500/30"
                  >
                    {copiedDraft ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
                        <span>Applied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Apply to Editor</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Draft Preview Box */}
              <div className="p-4 rounded-xl bg-slate-950/70 border border-indigo-500/20 text-xs text-slate-200 font-mono whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto">
                {ticket.aiDraftResponse}
              </div>
            </div>
          )}

          {/* Conversation History / Message Thread */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Message Thread ({ticket.messages.length} messages)
            </h3>

            {ticket.messages.length === 0 ? (
              <div className="p-4 rounded-xl bg-white border border-slate-200 text-xs text-slate-400 text-center">
                No replies posted yet. Use the response console below to send the first answer.
              </div>
            ) : (
              ticket.messages.map((msg) => {
                const isAdminMsg = msg.senderRole === 'ADMIN';
                return (
                  <div
                    key={msg.id}
                    className={`p-5 rounded-2xl border shadow-sm flex items-start gap-4 animate-fade-in ${
                      msg.isInternal
                        ? 'bg-amber-50/70 border-amber-300 ring-1 ring-amber-200'
                        : isAdminMsg
                        ? 'bg-gradient-to-br from-indigo-50/60 to-white border-indigo-200'
                        : 'bg-white border-slate-200'
                    }`}
                  >
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 font-bold text-xs ${
                        msg.isInternal
                          ? 'bg-amber-500 text-white'
                          : isAdminMsg
                          ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                          : 'bg-brand-100 text-brand-800'
                      }`}
                    >
                      {msg.isInternal ? <Lock className="w-4 h-4" /> : isAdminMsg ? <Shield className="w-4 h-4" /> : msg.senderName[0]}
                    </div>

                    <div className="space-y-2 flex-grow">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900">{msg.senderName}</span>
                          {msg.isInternal && (
                            <span className="text-[10px] font-bold bg-amber-200 text-amber-900 px-2 py-0.2 rounded-full">
                              Internal Admin Note (Hidden from Author)
                            </span>
                          )}
                          {!msg.isInternal && isAdminMsg && (
                            <span className="text-[10px] font-semibold bg-indigo-100 text-indigo-800 px-2 py-0.2 rounded-full">
                              Public Response
                            </span>
                          )}
                          {!isAdminMsg && (
                            <span className="text-[10px] font-semibold bg-brand-100 text-brand-800 px-2 py-0.2 rounded-full">
                              Author
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
              })
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Admin Response & Internal Note Composer */}
          <form onSubmit={handleSendMessage} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-indigo-600" />
                <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Admin Response Console
                </span>
              </div>

              {/* Mode Toggle: Public Response vs Internal Note */}
              <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setIsInternal(false)}
                  className={`px-3 py-1 rounded-lg transition ${
                    !isInternal ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Send Public to Author
                </button>
                <button
                  type="button"
                  onClick={() => setIsInternal(true)}
                  className={`px-3 py-1 rounded-lg transition flex items-center gap-1 ${
                    isInternal ? 'bg-amber-500 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Lock className="w-3 h-3" />
                  Internal Note Only
                </button>
              </div>
            </div>

            {/* Note alert banner */}
            {isInternal ? (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
                <Lock className="w-4 h-4 flex-shrink-0" />
                <span>
                  <strong>Internal Note Mode:</strong> This message will only be visible to BookLeaf ops team members. The author cannot see it.
                </span>
              </div>
            ) : (
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>
                  Editing AI draft response before sending. The author will see this response in real-time.
                </span>
                <button
                  type="button"
                  onClick={handleApplyDraft}
                  className="text-xs font-semibold text-indigo-600 hover:underline"
                >
                  Reset to AI Draft
                </button>
              </div>
            )}

            <textarea
              rows={6}
              value={draftMessage}
              onChange={(e) => setDraftMessage(e.target.value)}
              placeholder={isInternal ? 'Add private notes regarding bank verification, print partner status, etc...' : 'Draft response to author...'}
              className={`w-full px-4 py-3 rounded-xl border text-sm focus:outline-none transition ${
                isInternal
                  ? 'border-amber-300 focus:ring-2 focus:ring-amber-500 bg-amber-50/20'
                  : 'border-slate-300 focus:ring-2 focus:ring-indigo-500 bg-white'
              }`}
            ></textarea>

            {/* Status Update on Send & Action button */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
              {!isInternal ? (
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-slate-600 font-medium">After sending, set status to:</span>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="p-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-800 bg-slate-50"
                  >
                    <option value="In Progress">In Progress</option>
                    <option value="Resolved">Resolved</option>
                    <option value="Open">Keep Open</option>
                  </select>
                </div>
              ) : (
                <span className="text-xs text-slate-400">Internal notes do not alter author-facing ticket status.</span>
              )}

              <button
                type="submit"
                disabled={sending || !draftMessage.trim()}
                className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold text-white transition shadow-sm disabled:opacity-50 ${
                  isInternal
                    ? 'bg-amber-600 hover:bg-amber-700'
                    : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/20'
                }`}
              >
                {sending ? (
                  <span>Saving...</span>
                ) : isInternal ? (
                  <>
                    <Lock className="w-3.5 h-3.5" />
                    <span>Save Internal Note</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Send Response to Author</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
