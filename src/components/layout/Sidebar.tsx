import React from 'react';
import {
  LayoutDashboard,
  User,
  Briefcase,
  FolderGit2,
  Wrench,
  GraduationCap,
  Layers,
  Palette,
  BarChart3,
  FileDown,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';

export type DashboardView =
  | 'overview'
  | 'profile'
  | 'experience'
  | 'projects'
  | 'skills'
  | 'education'
  | 'versions'
  | 'templates'
  | 'pdf'
  | 'analytics';

interface SidebarProps {
  currentView: DashboardView;
  onSelectView: (view: DashboardView) => void;
  onOpenReimport: () => void;
  onOpenTailor: () => void;
  onOpenAIKeys?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onSelectView,
  onOpenReimport,
  onOpenTailor,
  onOpenAIKeys,
}) => {
  const { fullProfile } = useAuth();

  const navItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'profile', label: 'Bio & Contact', icon: User },
    {
      id: 'experience',
      label: 'Work Experience',
      icon: Briefcase,
      count: fullProfile?.experiences?.length,
    },
    {
      id: 'projects',
      label: 'Projects & Repos',
      icon: FolderGit2,
      count: fullProfile?.projects?.length,
    },
    {
      id: 'skills',
      label: 'Skills Matrix',
      icon: Wrench,
      count: fullProfile?.skills?.length,
    },
    {
      id: 'education',
      label: 'Education & Certs',
      icon: GraduationCap,
      count: (fullProfile?.education?.length || 0) + (fullProfile?.certifications?.length || 0),
    },
    {
      id: 'versions',
      label: 'CV Versions (Targeted)',
      icon: Layers,
      count: fullProfile?.versions?.length,
    },
    { id: 'templates', label: 'Design & Templates', icon: Palette },
    { id: 'pdf', label: 'PDF / ATS Resume Export', icon: FileDown },
    { id: 'analytics', label: 'Visitor Analytics', icon: BarChart3 },
  ];

  return (
    <aside className="w-64 bg-neutral-950 border-r border-neutral-800/80 flex flex-col justify-between p-4 flex-shrink-0">
      <div className="space-y-6">
        <div className="space-y-1">
          <p className="px-3 text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
            CV Sections
          </p>
          <nav className="space-y-1">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectView(item.id as DashboardView)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                      : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </div>
                  {item.count !== undefined && item.count > 0 && (
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
                        isActive
                          ? 'bg-white/20 text-white'
                          : 'bg-neutral-900 text-neutral-400 border border-neutral-800'
                      }`}
                    >
                      {item.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* AI & Automation Utilities */}
        <div className="space-y-2 pt-2 border-t border-neutral-900">
          <p className="px-3 text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
            AI Operations
          </p>
          {onOpenAIKeys && (
            <button
              onClick={onOpenAIKeys}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium bg-neutral-900/60 border border-neutral-800 hover:border-amber-500/50 text-neutral-300 hover:text-white transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>AI Key Switcher</span>
              </div>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-950/60 text-amber-300 border border-amber-800 font-mono">
                Pool
              </span>
            </button>
          )}
          <button
            onClick={onOpenTailor}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium bg-neutral-900/60 border border-neutral-800 hover:border-indigo-500/50 text-neutral-300 hover:text-white transition-colors"
          >
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <span>AI Job Description Tailor</span>
          </button>
          <button
            onClick={onOpenReimport}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium bg-neutral-900/60 border border-neutral-800 hover:border-neutral-700 text-neutral-300 hover:text-white transition-colors"
          >
            <RefreshCw className="w-4 h-4 text-neutral-400" />
            <span>Re-import CV (Diff Check)</span>
          </button>
        </div>
      </div>

      {/* Profile Status Indicator */}
      <div className="p-3 rounded-xl bg-neutral-900/40 border border-neutral-800/80 text-[11px] space-y-1">
        <div className="flex items-center justify-between text-neutral-400">
          <span>Digital CV</span>
          <span className="flex items-center gap-1 text-emerald-400 font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Live & Active
          </span>
        </div>
        <p className="text-neutral-400 text-[10px]">
          Changes reflect immediately across templates.
        </p>
      </div>
    </aside>
  );
};
