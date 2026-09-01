import React, { useState } from 'react';
import {
  Briefcase,
  FolderGit2,
  Wrench,
  GraduationCap,
  Layers,
  Sparkles,
  Eye,
  FileDown,
  Globe,
  Share2,
  Copy,
  Check,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  TrendingUp,
  FileText,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { api } from '../../lib/api.ts';
import type { DashboardView } from '../layout/Sidebar.tsx';
import { QRShareModal } from '../public/QRShareModal.tsx';

interface DashboardOverviewProps {
  onSelectView: (view: DashboardView) => void;
  onOpenPreview: () => void;
  onOpenReimport: () => void;
  onOpenTailor: () => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  onSelectView,
  onOpenPreview,
  onOpenReimport,
  onOpenTailor,
}) => {
  const { user, fullProfile, setLocalFullProfile } = useAuth();
  const [copied, setCopied] = useState<boolean>(false);
  const [showQRModal, setShowQRModal] = useState<boolean>(false);

  if (!fullProfile) return null;

  const { profile, experiences, projects, skills, education, versions } = fullProfile;
  const publicUrl = `${window.location.origin}/cv/${user?.username || 'user'}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTogglePublic = async () => {
    try {
      const updated = await api.updateProfile({ isPublic: !profile.isPublic });
      setLocalFullProfile(prev => prev ? { ...prev, profile: updated } : null);
    } catch (err) {
      console.error('Failed to toggle visibility:', err);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl">
      {/* If profile is fresh/empty, show onboarding quickstart */}
      {experiences.length === 0 && skills.length === 0 && projects.length === 0 && (
        <div className="p-6 rounded-2xl bg-indigo-950/30 border border-indigo-500/30 space-y-4">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                <span>Welcome to your Digital CV workspace!</span>
              </h2>
              <p className="text-xs text-neutral-400">
                Your profile is currently a clean slate. You can populate it automatically from your existing CV/resume or enter details manually.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3 pt-1">
            <button
              onClick={onOpenReimport}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/30 flex items-center gap-2 transition-all"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Upload Your CV (PDF / DOCX)</span>
            </button>
            <button
              onClick={() => onSelectView('experience')}
              className="px-4 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-neutral-200 text-xs font-semibold flex items-center gap-2 transition-all"
            >
              <Briefcase className="w-3.5 h-3.5 text-indigo-400" />
              <span>Add Experience Manually</span>
            </button>
            <button
              onClick={() => onSelectView('skills')}
              className="px-4 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-neutral-200 text-xs font-semibold flex items-center gap-2 transition-all"
            >
              <Wrench className="w-3.5 h-3.5 text-sky-400" />
              <span>Add Skills</span>
            </button>
          </div>
        </div>
      )}

      {/* Top Banner: Profile Status & Shareable URL */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-indigo-950/50 via-neutral-900 to-neutral-900 border border-indigo-900/40 relative overflow-hidden shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="flex items-center gap-2">
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold flex items-center gap-1.5 ${
                profile.isPublic
                  ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800'
                  : 'bg-amber-950/80 text-amber-300 border border-amber-800'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${profile.isPublic ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                {profile.isPublic ? 'Digital CV is Live & Public' : 'Private (Draft Mode)'}
              </span>
              <span className="text-xs text-neutral-400">
                Template: <strong className="text-white capitalize">{profile.templateConfig?.type || 'Modern Clean'}</strong>
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {profile.fullName}
            </h1>
            <p className="text-sm text-indigo-300 font-medium">
              {profile.headline}
            </p>

            {/* Public Link Box */}
            <div className="flex flex-wrap items-center gap-2 pt-2">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-neutral-950/80 border border-neutral-800 text-xs font-mono text-neutral-300">
                <Globe className="w-3.5 h-3.5 text-indigo-400" />
                <span className="truncate max-w-[260px] sm:max-w-xs">{publicUrl}</span>
              </div>
              <button
                onClick={handleCopyLink}
                className="px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
              <button
                onClick={() => setShowQRModal(true)}
                className="p-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition-colors"
                title="QR Code"
              >
                <Share2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick Actions Column */}
          <div className="flex flex-col gap-2.5 sm:min-w-[190px]">
            <button
              onClick={onOpenPreview}
              className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all hover:scale-[1.02]"
            >
              <Eye className="w-4 h-4" />
              <span>Preview Live CV</span>
            </button>
            <button
              onClick={handleTogglePublic}
              className="w-full py-2 px-4 rounded-xl bg-neutral-800/80 hover:bg-neutral-700 text-neutral-200 text-xs font-medium border border-neutral-700/60 transition-colors"
            >
              {profile.isPublic ? 'Make Profile Private' : 'Publish Profile'}
            </button>
          </div>
        </div>
      </div>

      {/* Grid: Core Database Metrics & Quick Navigation */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          {
            label: 'Experience Entries',
            count: experiences.length,
            view: 'experience',
            icon: Briefcase,
            color: 'text-indigo-400',
          },
          {
            label: 'Portfolio Projects',
            count: projects.length,
            view: 'projects',
            icon: FolderGit2,
            color: 'text-emerald-400',
          },
          {
            label: 'Skills in Matrix',
            count: skills.length,
            view: 'skills',
            icon: Wrench,
            color: 'text-sky-400',
          },
          {
            label: 'Targeted CV Versions',
            count: versions.length,
            view: 'versions',
            icon: Layers,
            color: 'text-amber-400',
          },
        ].map(card => {
          const Icon = card.icon;
          return (
            <div
              key={card.view}
              onClick={() => onSelectView(card.view as DashboardView)}
              className="p-5 rounded-2xl bg-neutral-900/60 border border-neutral-800 hover:border-indigo-500/50 cursor-pointer transition-all hover:scale-[1.02] group space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-white group-hover:text-indigo-300 font-mono">
                  {card.count}
                </span>
                <Icon className={`w-5 h-5 ${card.color}`} />
              </div>
              <p className="text-xs font-medium text-neutral-400">{card.label}</p>
            </div>
          );
        })}
      </div>

      {/* Key Functional Modules & Next Steps */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left: AI & Automation Hub */}
        <div className="p-6 rounded-2xl bg-neutral-900/50 border border-neutral-800 space-y-4">
          <div className="flex items-center gap-2 text-sm font-bold text-white">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <span>AI Enhancement Tools</span>
          </div>
          <p className="text-xs text-neutral-400 leading-relaxed">
            All AI suggestions operate with strict fact integrity. You can tailor your profile to a job description or polish existing bullet points with full review approval.
          </p>
          <div className="space-y-2 pt-2">
            <button
              onClick={onOpenTailor}
              className="w-full p-3 rounded-xl bg-neutral-950 border border-neutral-800 hover:border-indigo-500/60 text-left transition-colors flex items-center justify-between group"
            >
              <div>
                <span className="text-xs font-semibold text-white group-hover:text-indigo-300">
                  Targeted Job Alignment Matcher
                </span>
                <p className="text-[11px] text-neutral-400">Paste job requirements to analyze skill coverage and headlines</p>
              </div>
              <ArrowRight className="w-4 h-4 text-neutral-500 group-hover:text-indigo-400 transition-transform group-hover:translate-x-1" />
            </button>

            <button
              onClick={onOpenReimport}
              className="w-full p-3 rounded-xl bg-neutral-950 border border-neutral-800 hover:border-indigo-500/60 text-left transition-colors flex items-center justify-between group"
            >
              <div>
                <span className="text-xs font-semibold text-white group-hover:text-indigo-300">
                  Re-import New CV Version (Diff Engine)
                </span>
                <p className="text-[11px] text-neutral-400">Upload an updated CV and selectively merge additions</p>
              </div>
              <RefreshCw className="w-4 h-4 text-neutral-500 group-hover:text-indigo-400" />
            </button>
          </div>
        </div>

        {/* Right: Source Document & Data Provenance */}
        <div className="p-6 rounded-2xl bg-neutral-900/50 border border-neutral-800 space-y-4">
          <div className="flex items-center gap-2 text-sm font-bold text-white">
            <FileText className="w-4 h-4 text-emerald-400" />
            <span>Database Source of Truth</span>
          </div>
          <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800 space-y-2 text-xs">
            <div className="flex justify-between text-neutral-400">
              <span>Source File:</span>
              <span className="text-white font-medium truncate max-w-[200px]">
                {profile.originalCvFileName || 'Initial Onboarding CV'}
              </span>
            </div>
            <div className="flex justify-between text-neutral-400">
              <span>Storage Backend:</span>
              <span className="text-emerald-400 font-mono font-semibold">PostgreSQL Relational Entities</span>
            </div>
            <div className="flex justify-between text-neutral-400">
              <span>Recruiter AI:</span>
              <span className="text-indigo-400 font-semibold">Grounded in DB records</span>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => onSelectView('templates')}
              className="flex-1 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-semibold transition-colors"
            >
              Change Template
            </button>
            <button
              onClick={() => onSelectView('pdf')}
              className="flex-1 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
            >
              <FileDown className="w-3.5 h-3.5" />
              <span>Export PDF</span>
            </button>
          </div>
        </div>
      </div>

      <QRShareModal
        isOpen={showQRModal}
        onClose={() => setShowQRModal(false)}
        publicUrl={publicUrl}
        candidateName={profile.fullName}
      />
    </div>
  );
};
