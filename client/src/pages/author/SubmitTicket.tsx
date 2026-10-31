import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Send, Paperclip, Sparkles, BookOpen, AlertCircle, CheckCircle2, FileText, X } from 'lucide-react';

interface BookOption {
  id: string;
  title: string;
  status: string;
}

export const SubmitTicket: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [books, setBooks] = useState<BookOption[]>([]);
  const [selectedBookId, setSelectedBookId] = useState<string>(searchParams.get('bookId') || '');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [attachment, setAttachment] = useState<File | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successResult, setSuccessResult] = useState<any>(null);

  useEffect(() => {
    const fetchBooks = async () => {
      try {
        const res = await api.get('/books');
        setBooks(res.data.books);
      } catch (err) {
        console.error('Error fetching author books for dropdown', err);
      }
    };

    fetchBooks();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setAttachment(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (subject.trim().length < 5) {
      setError('Please provide a descriptive subject (at least 5 characters).');
      return;
    }

    if (description.trim().length < 10) {
      setError('Please provide more details in the description (at least 10 characters).');
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        bookId: selectedBookId || null,
        subject: subject.trim(),
        description: description.trim(),
        attachmentName: attachment ? attachment.name : null,
      };

      const res = await api.post('/tickets', payload);
      setSuccessResult(res.data.ticket);

      // Brief animation, then navigate to ticket detail
      setTimeout(() => {
        navigate(`/author/tickets/${res.data.ticket.id}`);
      }, 1500);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to submit ticket. Please try again.');
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Header */}
        <div className="p-6 sm:p-8 bg-gradient-to-r from-slate-900 to-slate-800 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-brand-500/20 text-brand-300 border border-brand-500/30 mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              AI-Powered Triage & Support
            </div>
            <h1 className="text-2xl font-bold">Raise a Support Query</h1>
            <p className="text-xs text-slate-300 mt-1 max-w-xl">
              Our automated triage system analyzes your concern, cross-references BookLeaf policies, and routes it to the designated operations team.
            </p>
          </div>

          <div className="hidden sm:block text-right">
            <span className="text-[11px] text-slate-400">Author Account</span>
            <div className="text-sm font-bold text-white">{user?.name}</div>
            <div className="text-xs text-brand-400 font-mono">{user?.email}</div>
          </div>
        </div>

        {/* Content / Form */}
        <div className="p-6 sm:p-8">
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successResult ? (
            <div className="py-12 text-center space-y-4 animate-fade-in">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-md">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900">Ticket #{successResult.ticketNumber} Raised Successfully!</h3>
                <p className="text-xs text-slate-500 mt-1">
                  AI has classified this ticket as <strong>{successResult.category}</strong> with priority <strong>{successResult.priority}</strong>.
                </p>
              </div>
              <div className="text-xs text-brand-600 font-medium">
                Redirecting to your ticket conversation thread...
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Book Selection Dropdown */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-brand-600" />
                  Select Book (or Account Query)
                </label>
                <select
                  value={selectedBookId}
                  onChange={(e) => setSelectedBookId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white transition"
                >
                  <option value="">General / Account Level (Not book-specific)</option>
                  {books.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.title} ({b.id} — {b.status})
                    </option>
                  ))}
                </select>
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Linking a specific book helps the team check exact sales, inventory, and production stages.
                </span>
              </div>

              {/* Subject Line */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Subject Line <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. Royalty payout clarification for Q3 or Amazon listing unavailable"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition"
                />
              </div>

              {/* Detailed Description */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Detailed Query Description <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={6}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Please describe your question or issue in detail. If reporting print defects, inventory mismatch, or royalty questions, include any relevant dates or numbers."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition"
                ></textarea>
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Tip: Be as specific as possible so our AI can accurately draft the best resolution.
                </span>
              </div>

              {/* File Attachment Support (UI Only as requested) */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Attachments (Optional)
                </label>
                <div className="flex items-center gap-3">
                  <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition border border-slate-200">
                    <Paperclip className="w-4 h-4 text-slate-500" />
                    <span>Choose File (Images / PDF / Proofs)</span>
                    <input
                      type="file"
                      className="hidden"
                      onChange={handleFileChange}
                      accept="image/*,.pdf,.doc,.docx"
                    />
                  </label>

                  {attachment && (
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-brand-50 border border-brand-200 text-brand-800 text-xs">
                      <FileText className="w-3.5 h-3.5 text-brand-600" />
                      <span className="font-medium max-w-xs truncate">{attachment.name}</span>
                      <button
                        type="button"
                        onClick={() => setAttachment(null)}
                        className="text-slate-400 hover:text-slate-600"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Helpful for reporting misprinted author copies, binding issues, or retail portal screenshots.
                </span>
              </div>

              {/* Submit Button */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => navigate('/author/books')}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 transition shadow-md shadow-brand-500/20 disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Analyzing & Submitting...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Submit Query</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
