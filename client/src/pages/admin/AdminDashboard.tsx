import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { Inbox, AlertTriangle, CheckCircle, Clock, Users, BookOpen, ArrowRight, ShieldAlert, Sparkles, Filter } from 'lucide-react';

interface Metrics {
  totalTickets: number;
  openTickets: number;
  inProgressTickets: number;
  resolvedTickets: number;
  closedTickets: number;
  criticalTickets: number;
  highTickets: number;
  urgentOldTicketsCount: number;
  totalAuthors: number;
  totalBooks: number;
  byCategory: Array<{ category: string; count: number }>;
}

export const AdminDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/stats/dashboard');
        setMetrics(res.data.metrics);
      } catch (err) {
        console.error('Failed to load dashboard statistics', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading || !metrics) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 text-center text-sm text-slate-500">
        <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
        Loading operations dashboard...
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-8 rounded-3xl shadow-xl border border-indigo-900/50">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
            <Sparkles className="w-3.5 h-3.5 text-indigo-300" />
            BookLeaf Intelligent Operations Center
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Author Support & Triage Control
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
            Real-time queue monitoring, AI-assisted ticket triage, auto-classification, and Knowledge Base-grounded resolution delivery.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/admin/tickets?sortBy=oldest_unresolved"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 transition shadow-lg shadow-indigo-600/30 whitespace-nowrap"
          >
            <ShieldAlert className="w-4 h-4 text-amber-300" />
            Spot Urgent Backlog ({metrics.criticalTickets + metrics.urgentOldTicketsCount})
          </Link>
        </div>
      </div>

      {/* Critical Alerts Banner (if urgent tickets exist) */}
      {(metrics.criticalTickets > 0 || metrics.urgentOldTicketsCount > 0) && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-rose-900">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-rose-200 text-rose-700 flex items-center justify-center flex-shrink-0 animate-pulse">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-rose-700">Urgent Attention Required</div>
              <div className="text-xs text-rose-800">
                You have <strong>{metrics.criticalTickets} critical ticket(s)</strong> and <strong>{metrics.urgentOldTicketsCount} unresolved ticket(s) older than 24 hours</strong>.
              </div>
            </div>
          </div>
          <Link
            to="/admin/tickets?priority=Critical"
            className="text-xs font-bold text-rose-700 hover:text-rose-900 flex items-center gap-1 whitespace-nowrap"
          >
            Review Critical Queue →
          </Link>
        </div>
      )}

      {/* Primary Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider">
            <span>Open Tickets</span>
            <Inbox className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-3xl font-black text-slate-900 mt-2">
            {metrics.openTickets}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Awaiting first response</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider">
            <span>In Progress</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-3xl font-black text-amber-600 mt-2">
            {metrics.inProgressTickets}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Under active investigation</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider">
            <span>Critical Priority</span>
            <AlertTriangle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-3xl font-black text-rose-600 mt-2">
            {metrics.criticalTickets}
          </div>
          <div className="text-[11px] text-rose-700/80 mt-1">High risk / ISBN / delay</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider">
            <span>Resolved</span>
            <CheckCircle className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-3xl font-black text-emerald-600 mt-2">
            {metrics.resolvedTickets}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Successful resolutions</div>
        </div>
      </div>

      {/* Category Breakdown & Operations Health */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Category distribution */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Filter className="w-4 h-4 text-indigo-600" />
              Incoming Tickets by AI Category
            </h2>
            <Link to="/admin/tickets" className="text-xs font-semibold text-indigo-600 hover:underline">
              View all tickets →
            </Link>
          </div>

          <div className="space-y-3 pt-2">
            {metrics.byCategory.map((cat) => {
              const pct = metrics.totalTickets > 0 ? Math.round((cat.count / metrics.totalTickets) * 100) : 0;
              return (
                <div key={cat.category} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-medium">
                    <span className="text-slate-700">{cat.category}</span>
                    <span className="text-slate-500 font-mono">
                      {cat.count} tickets ({pct}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-indigo-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${Math.max(pct, 5)}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Catalog & Author summary */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
          <h2 className="text-base font-bold text-slate-900">
            Publishing Ecosystem
          </h2>

          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-brand-100 text-brand-700 flex items-center justify-center">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs text-slate-400 font-medium">Authors Onboarded</div>
                  <div className="text-lg font-bold text-slate-900">{metrics.totalAuthors} Active</div>
                </div>
              </div>
              <Link to="/admin/authors" className="text-xs font-bold text-brand-700 hover:underline">
                View →
              </Link>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs text-slate-400 font-medium">Catalog Titles</div>
                  <div className="text-lg font-bold text-slate-900">{metrics.totalBooks} Titles</div>
                </div>
              </div>
              <Link to="/admin/tickets" className="text-xs font-bold text-sky-700 hover:underline">
                Queue →
              </Link>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 text-xs text-slate-500">
            Delhi Print Plant & Repro India / Epitome Books pipelines synchronized.
          </div>
        </div>
      </div>
    </div>
  );
};
