import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Eye,
  FileDown,
  MousePointerClick,
  Bot,
  TrendingUp,
  Globe,
  Calendar,
  Clock,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { api } from '../../lib/api.ts';

export const AnalyticsView: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      setIsRefreshing(true);
      const res = await api.getAnalytics();
      setStats(res);
    } catch (err) {
      console.error('Failed to load analytics:', err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center text-xs text-neutral-400">
        Loading visitor metrics and recruiter activity...
      </div>
    );
  }

  const counts = stats?.counts || { page_view: 0, resume_download: 0, project_click: 0, recruiter_chat: 0 };
  const recentEvents: any[] = stats?.recentEvents || [];

  return (
    <div className="max-w-4xl space-y-8">
      <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-indigo-400" />
            <span>Visitor & Recruiter Activity Tracker</span>
          </h2>
          <p className="text-xs text-neutral-400 mt-1">
            Real-time engagement telemetry from your live public Digital CV profile.
          </p>
        </div>
        <button
          onClick={loadAnalytics}
          disabled={isRefreshing}
          className="px-3.5 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-neutral-200 text-xs font-semibold flex items-center gap-1.5 transition-all"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-indigo-400' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Profile Views', count: counts.page_view || 0, icon: Eye, color: 'text-indigo-400', bg: 'bg-indigo-950/20 border-indigo-500/20' },
          { label: 'CV Downloads (PDF)', count: counts.resume_download || 0, icon: FileDown, color: 'text-emerald-400', bg: 'bg-emerald-950/20 border-emerald-500/20' },
          { label: 'Project Clicks', count: counts.project_click || 0, icon: MousePointerClick, color: 'text-sky-400', bg: 'bg-sky-950/20 border-sky-500/20' },
          { label: 'Recruiter AI Inquiries', count: counts.recruiter_chat || 0, icon: Bot, color: 'text-amber-400', bg: 'bg-amber-950/20 border-amber-500/20' },
        ].map((m, idx) => {
          const Icon = m.icon;
          return (
            <div key={idx} className={`p-5 rounded-2xl bg-neutral-900/60 border ${m.bg} space-y-2`}>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-white font-mono">{m.count}</span>
                <Icon className={`w-5 h-5 ${m.color}`} />
              </div>
              <p className="text-xs text-neutral-400 font-medium">{m.label}</p>
            </div>
          );
        })}
      </div>

      {/* Recent Activity Log */}
      <div className="p-6 rounded-2xl bg-neutral-900/50 border border-neutral-800 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-indigo-400" />
            <span>Live Activity Stream</span>
          </h3>
          <span className="text-[11px] text-neutral-400">Chronological telemetry</span>
        </div>

        {recentEvents.length === 0 ? (
          <div className="py-8 text-center space-y-2">
            <p className="text-xs text-neutral-400">No visitor events recorded yet.</p>
            <p className="text-[11px] text-neutral-500">
              Share your public CV link with recruiters or friends to start tracking live interactions!
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {recentEvents.map((ev: any) => (
              <div
                key={ev.id}
                className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800/80 flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-3">
                  <span className={`w-2.5 h-2.5 rounded-full ${
                    ev.eventType === 'page_view'
                      ? 'bg-indigo-400 shadow-sm shadow-indigo-400/50'
                      : ev.eventType === 'resume_download'
                      ? 'bg-emerald-400 shadow-sm shadow-emerald-400/50'
                      : ev.eventType === 'project_click'
                      ? 'bg-sky-400 shadow-sm shadow-sky-400/50'
                      : 'bg-amber-400 shadow-sm shadow-amber-400/50'
                  }`} />
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-white capitalize">
                        {ev.eventType.replace('_', ' ')}
                      </span>
                      {ev.metadata?.query && (
                        <span className="text-[11px] text-amber-300/80 italic line-clamp-1 max-w-xs">
                          "{ev.metadata.query}"
                        </span>
                      )}
                    </div>
                    {ev.referrer && ev.referrer !== 'direct' && (
                      <p className="text-[10px] text-neutral-500">Referrer: {ev.referrer}</p>
                    )}
                  </div>
                </div>
                <span className="text-[11px] text-neutral-400 font-mono">
                  {new Date(ev.timestamp).toLocaleDateString()} {new Date(ev.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
