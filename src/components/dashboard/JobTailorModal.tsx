import React, { useState } from 'react';
import {
  Sparkles,
  X,
  Briefcase,
  CheckCircle2,
  AlertCircle,
  Plus,
  Loader2,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { api } from '../../lib/api.ts';
import type { TailorJobResponse } from '../../types/index.ts';

interface JobTailorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const JobTailorModal: React.FC<JobTailorModalProps> = ({ isOpen, onClose }) => {
  const { fullProfile, setLocalFullProfile } = useAuth();
  const [jobTitle, setJobTitle] = useState<string>('');
  const [jobDescription, setJobDescription] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [result, setResult] = useState<TailorJobResponse | null>(null);
  const [createdVersionSuccess, setCreatedVersionSuccess] = useState<boolean>(false);

  if (!isOpen || !fullProfile) return null;

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobDescription.trim()) return;

    setIsAnalyzing(true);
    setResult(null);
    setCreatedVersionSuccess(false);

    try {
      const res = await api.tailorForJob({
        jobTitle: jobTitle.trim() || 'Software Engineer',
        jobDescription: jobDescription.trim(),
      });
      setResult(res);
    } catch (err: any) {
      alert(`Job analysis failed: ${err.message}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCreateTargetedVersion = async () => {
    if (!result) return;
    try {
      const slug = `job-${Date.now().toString().slice(-4)}`;
      const savedVersion = await api.saveVersion({
        name: `${jobTitle || 'Targeted'} Version`,
        slug,
        targetRole: jobTitle || 'Target Role',
        customHeadline: result.tailoredHeadline,
        customSummary: result.tailoredSummary,
        selectedProjectIds: fullProfile.projects.map(p => p.id),
        selectedExperienceIds: fullProfile.experiences.map(e => e.id),
        isDefault: false,
      });

      setLocalFullProfile(prev => prev ? {
        ...prev,
        versions: [...prev.versions, savedVersion],
      } : null);

      setCreatedVersionSuccess(true);
    } catch (err: any) {
      console.error('Failed to create version from tailor:', err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-2xl bg-neutral-900 border border-neutral-800 rounded-3xl p-6 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">AI Job Tailoring & Skill Matcher</h3>
              <p className="text-[11px] text-neutral-400">
                Aligns verified candidate facts against target job requirements
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800">
            <X className="w-4 h-4" />
          </button>
        </div>

        {!result ? (
          <form onSubmit={handleAnalyze} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1">Target Job Title</label>
              <input
                type="text"
                value={jobTitle}
                onChange={e => setJobTitle(e.target.value)}
                placeholder="e.g. Senior Distributed Systems Engineer at Cloudflare"
                className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-white text-xs focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1">Job Description / Requirements *</label>
              <textarea
                rows={7}
                required
                value={jobDescription}
                onChange={e => setJobDescription(e.target.value)}
                placeholder="Paste the full job posting, key qualifications, required tech stack, and responsibilities here..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-white text-xs focus:border-indigo-500 focus:outline-none resize-y"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-neutral-800 text-neutral-300 text-xs font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isAnalyzing || !jobDescription.trim()}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-indigo-600/30 disabled:opacity-50"
              >
                {isAnalyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                <span>Analyze Job Alignment</span>
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-5">
            {/* Score / Match Summary */}
            <div className="p-4 rounded-2xl bg-indigo-950/40 border border-indigo-800/80 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-indigo-300">Target Match Analysis</span>
                <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-800 font-bold">
                  {result.matchingSkills?.length || 0} Matched Skills
                </span>
              </div>

              {/* Skills matched & missing */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
                <div>
                  <span className="text-[11px] font-semibold text-emerald-400">✓ Strong Matching Skills:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {result.matchingSkills?.map((s, i) => (
                      <span key={i} className="px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-800 text-[10px] text-emerald-300 font-mono">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="text-[11px] font-semibold text-amber-400">⚠ Unmentioned / Skill Gaps:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {result.missingSkills?.map((s, i) => (
                      <span key={i} className="px-2 py-0.5 rounded bg-amber-950/60 border border-amber-800 text-[10px] text-amber-300 font-mono">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Proposed Tailored Headline */}
            <div className="space-y-1 text-xs">
              <span className="font-semibold text-neutral-400">Proposed Tailored Headline:</span>
              <p className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 text-white font-medium">
                {result.tailoredHeadline}
              </p>
            </div>

            {/* Proposed Tailored Summary */}
            <div className="space-y-1 text-xs">
              <span className="font-semibold text-neutral-400">Proposed Tailored Summary:</span>
              <p className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 text-neutral-200 leading-relaxed">
                {result.tailoredSummary}
              </p>
            </div>

            {/* Strategic Recommendations */}
            {result.recommendations && result.recommendations.length > 0 && (
              <div className="space-y-1 text-xs">
                <span className="font-semibold text-neutral-400">Strategic Recommendations:</span>
                <ul className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 space-y-1 text-neutral-300">
                  {result.recommendations.map((r, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-indigo-400">•</span>
                      <span>{r}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Action Bar */}
            <div className="flex items-center justify-between pt-3 border-t border-neutral-800">
              <button
                onClick={() => setResult(null)}
                className="px-4 py-2 rounded-xl bg-neutral-800 text-neutral-300 text-xs"
              >
                Analyze Another
              </button>

              {createdVersionSuccess ? (
                <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-bold">
                  <CheckCircle2 className="w-4 h-4" />
                  Targeted CV Version Created!
                </span>
              ) : (
                <button
                  onClick={handleCreateTargetedVersion}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-indigo-600/30"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Targeted CV Version</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
