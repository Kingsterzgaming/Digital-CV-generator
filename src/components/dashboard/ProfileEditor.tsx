import React, { useState } from 'react';
import {
  User,
  Sparkles,
  Save,
  CheckCircle2,
  Mail,
  Phone,
  MapPin,
  Globe,
  Loader2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { api } from '../../lib/api.ts';

export const ProfileEditor: React.FC = () => {
  const { fullProfile, setLocalFullProfile } = useAuth();
  const [formData, setFormData] = useState({
    fullName: fullProfile?.profile?.fullName || '',
    headline: fullProfile?.profile?.headline || '',
    summary: fullProfile?.profile?.summary || '',
    email: fullProfile?.profile?.email || '',
    phone: fullProfile?.profile?.phone || '',
    location: fullProfile?.profile?.location || '',
    avatarUrl: fullProfile?.profile?.avatarUrl || '',
  });

  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isImprovingSummary, setIsImprovingSummary] = useState<boolean>(false);
  const [isImprovingHeadline, setIsImprovingHeadline] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [aiRationale, setAiRationale] = useState<string | null>(null);

  if (!fullProfile) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      const updated = await api.updateProfile(formData);
      setLocalFullProfile(prev => prev ? { ...prev, profile: updated } : null);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      console.error('Failed to save profile:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleImproveSummary = async () => {
    if (!formData.summary || isImprovingSummary) return;
    setIsImprovingSummary(true);
    setAiRationale(null);
    try {
      const res = await api.improveText({
        text: formData.summary,
        type: 'summary',
        context: `Candidate is ${formData.fullName}, ${formData.headline}`,
      });
      setFormData(prev => ({ ...prev, summary: res.improved }));
      setAiRationale(res.rationale);
    } catch (err) {
      console.error('Failed to improve summary:', err);
    } finally {
      setIsImprovingSummary(false);
    }
  };

  const handleImproveHeadline = async () => {
    if (!formData.headline || isImprovingHeadline) return;
    setIsImprovingHeadline(true);
    setAiRationale(null);
    try {
      const res = await api.improveText({
        text: formData.headline,
        type: 'headline',
        context: `Candidate name is ${formData.fullName}`,
      });
      setFormData(prev => ({ ...prev, headline: res.improved }));
      setAiRationale(res.rationale);
    } catch (err) {
      console.error('Failed to improve headline:', err);
    } finally {
      setIsImprovingHeadline(false);
    }
  };

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
        <div>
          <h2 className="text-xl font-bold text-white">Bio & Contact Information</h2>
          <p className="text-xs text-neutral-400">
            Edit your core personal details. These records reside in the PostgreSQL database source of truth.
          </p>
        </div>

        {saveSuccess && (
          <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold bg-emerald-950/60 border border-emerald-800 px-3 py-1 rounded-lg">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Changes Saved
          </span>
        )}
      </div>

      {aiRationale && (
        <div className="p-3.5 rounded-xl bg-indigo-950/40 border border-indigo-800/80 text-xs text-indigo-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-400 flex-shrink-0" />
            <span>AI Polish: {aiRationale}</span>
          </div>
          <button
            onClick={() => setAiRationale(null)}
            className="text-neutral-400 hover:text-white text-[11px]"
          >
            Dismiss
          </button>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1.5">Full Name</label>
            <input
              type="text"
              required
              value={formData.fullName}
              onChange={e => setFormData({ ...formData, fullName: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-white text-sm focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-neutral-300">Professional Headline</label>
              <button
                type="button"
                onClick={handleImproveHeadline}
                disabled={isImprovingHeadline}
                className="text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
              >
                {isImprovingHeadline ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                <span>Polish Headline</span>
              </button>
            </div>
            <input
              type="text"
              required
              value={formData.headline}
              onChange={e => setFormData({ ...formData, headline: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-white text-sm focus:border-indigo-500 focus:outline-none"
              placeholder="e.g. Senior Full Stack Engineer"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1.5">Primary Email</label>
            <div className="relative">
              <input
                type="email"
                required
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-white text-sm focus:border-indigo-500 focus:outline-none"
              />
              <Mail className="w-4 h-4 text-neutral-500 absolute left-3 top-3" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1.5">Phone</label>
            <div className="relative">
              <input
                type="text"
                value={formData.phone}
                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-white text-sm focus:border-indigo-500 focus:outline-none"
                placeholder="+1 (555) 000-0000"
              />
              <Phone className="w-4 h-4 text-neutral-500 absolute left-3 top-3" />
            </div>
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-neutral-300 mb-1.5">Location</label>
            <div className="relative">
              <input
                type="text"
                value={formData.location}
                onChange={e => setFormData({ ...formData, location: e.target.value })}
                className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-white text-sm focus:border-indigo-500 focus:outline-none"
                placeholder="City, State / Country"
              />
              <MapPin className="w-4 h-4 text-neutral-500 absolute left-3 top-3" />
            </div>
          </div>

          <div className="md:col-span-2">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-neutral-300">Professional Summary</label>
              <button
                type="button"
                onClick={handleImproveSummary}
                disabled={isImprovingSummary}
                className="text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
              >
                {isImprovingSummary ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                <span>AI Polish Summary</span>
              </button>
            </div>
            <textarea
              rows={5}
              value={formData.summary}
              onChange={e => setFormData({ ...formData, summary: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-white text-sm focus:border-indigo-500 focus:outline-none resize-y"
              placeholder="Detailed summary of experience, strengths, and objectives..."
            />
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t border-neutral-800">
          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition-all hover:scale-[1.02] disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>Save Profile to Database</span>
          </button>
        </div>
      </form>
    </div>
  );
};
