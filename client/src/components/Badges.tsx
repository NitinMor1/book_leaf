import React from 'react';
import { AlertCircle, AlertTriangle, CheckCircle2, Clock, ShieldAlert } from 'lucide-react';

export const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  switch (status) {
    case 'Open':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
          Open
        </span>
      );
    case 'In Progress':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
          <Clock className="w-3 h-3 text-amber-500" />
          In Progress
        </span>
      );
    case 'Resolved':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle2 className="w-3 h-3 text-emerald-500" />
          Resolved
        </span>
      );
    case 'Closed':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
          Closed
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
          {status}
        </span>
      );
  }
};

export const PriorityBadge: React.FC<{ priority: string; isAi?: boolean }> = ({ priority, isAi = false }) => {
  switch (priority) {
    case 'Critical':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300 shadow-sm animate-pulse">
          <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
          Critical {isAi && <span className="text-[10px] bg-rose-200 px-1 rounded ml-1 font-normal">AI</span>}
        </span>
      );
    case 'High':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-orange-50 text-orange-700 border border-orange-200">
          <AlertCircle className="w-3 h-3 text-orange-500" />
          High {isAi && <span className="text-[10px] bg-orange-100 px-1 rounded ml-1 font-normal">AI</span>}
        </span>
      );
    case 'Medium':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
          <AlertTriangle className="w-3 h-3 text-amber-500" />
          Medium {isAi && <span className="text-[10px] bg-amber-100 px-1 rounded ml-1 font-normal">AI</span>}
        </span>
      );
    case 'Low':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
          Low {isAi && <span className="text-[10px] bg-slate-200 px-1 rounded ml-1 font-normal">AI</span>}
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
          {priority}
        </span>
      );
  }
};

export const CategoryBadge: React.FC<{ category: string; isAi?: boolean }> = ({ category, isAi = false }) => {
  let color = 'bg-slate-100 text-slate-700 border-slate-200';

  if (category.includes('Royalty')) {
    color = 'bg-emerald-50 text-emerald-800 border-emerald-200';
  } else if (category.includes('ISBN')) {
    color = 'bg-purple-50 text-purple-800 border-purple-200';
  } else if (category.includes('Printing')) {
    color = 'bg-amber-50 text-amber-800 border-amber-200';
  } else if (category.includes('Distribution')) {
    color = 'bg-sky-50 text-sky-800 border-sky-200';
  } else if (category.includes('Production') || category.includes('Status')) {
    color = 'bg-indigo-50 text-indigo-800 border-indigo-200';
  }

  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-medium border ${color}`}>
      {category}
      {isAi && (
        <span className="text-[10px] opacity-75 font-mono ml-0.5">🤖 AI</span>
      )}
    </span>
  );
};

export const BookStatusBadge: React.FC<{ status: string }> = ({ status }) => {
  if (status.includes('Published & Live')) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
        Published & Live
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
      <Clock className="w-3 h-3 text-amber-500" />
      {status}
    </span>
  );
};
