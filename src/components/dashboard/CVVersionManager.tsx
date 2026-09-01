import React, { useState } from 'react';
import {
  Layers,
  Plus,
  Trash2,
  Edit2,
  Save,
  X,
  ExternalLink,
  CheckCircle2,
  Star,
  Copy,
  Check,
  FileDown,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { api } from '../../lib/api.ts';
import type { CVVersion } from '../../types/index.ts';
import { generatePDFResume } from '../../lib/pdfGenerator.ts';

export const CVVersionManager: React.FC = () => {
  const { user, fullProfile, setLocalFullProfile } = useAuth();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState<boolean>(false);
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);

  const [formData, setFormData] = useState<Partial<CVVersion>>({
    name: '',
    slug: '',
    targetRole: '',
    customHeadline: '',
    customSummary: '',
    selectedProjectIds: [],
    selectedExperienceIds: [],
    isDefault: false,
  });

  if (!fullProfile) return null;
  const versions = fullProfile.versions || [];
  const projects = fullProfile.projects || [];
  const experiences = fullProfile.experiences || [];

  const handleStartAdd = () => {
    setIsAdding(true);
    setEditingId(null);
    setFormData({
      name: 'Targeted Role Version',
      slug: `targeted-${Date.now().toString().slice(-4)}`,
      targetRole: 'Target Position Title',
      customHeadline: fullProfile.profile.headline,
      customSummary: fullProfile.profile.summary,
      selectedProjectIds: projects.map(p => p.id),
      selectedExperienceIds: experiences.map(e => e.id),
      isDefault: false,
    });
  };

  const handleStartEdit = (v: CVVersion) => {
    setEditingId(v.id);
    setIsAdding(false);
    setFormData({ ...v });
  };

  const handleSave = async () => {
    if (!formData.name || !formData.slug) return;
    try {
      const saved = await api.saveVersion(formData);
      setLocalFullProfile(prev => {
        if (!prev) return null;
        const exists = prev.versions.some(v => v.id === saved.id);
        let updated = exists
          ? prev.versions.map(v => v.id === saved.id ? saved : v)
          : [...prev.versions, saved];

        if (saved.isDefault) {
          updated = updated.map(v => v.id === saved.id ? v : { ...v, isDefault: false });
        }
        return { ...prev, versions: updated };
      });
      setIsAdding(false);
      setEditingId(null);
    } catch (err) {
      console.error('Failed to save version:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (versions.length <= 1) {
      alert('You must maintain at least one default CV version.');
      return;
    }
    if (!confirm('Are you sure you want to delete this targeted CV version?')) return;
    try {
      await api.deleteVersion(id);
      setLocalFullProfile(prev => prev ? {
        ...prev,
        versions: prev.versions.filter(v => v.id !== id),
      } : null);
    } catch (err) {
      console.error('Failed to delete version:', err);
    }
  };

  const handleCopyLink = (slug: string) => {
    const url = `${window.location.origin}/cv/${user?.username || 'user'}?v=${slug}`;
    navigator.clipboard.writeText(url);
    setCopiedSlug(slug);
    setTimeout(() => setCopiedSlug(null), 2000);
  };

  const toggleProjectSelection = (id: string) => {
    const current = formData.selectedProjectIds || [];
    const updated = current.includes(id) ? current.filter(p => p !== id) : [...current, id];
    setFormData({ ...formData, selectedProjectIds: updated });
  };

  const toggleExperienceSelection = (id: string) => {
    const current = formData.selectedExperienceIds || [];
    const updated = current.includes(id) ? current.filter(e => e !== id) : [...current, id];
    setFormData({ ...formData, selectedExperienceIds: updated });
  };

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-neutral-800">
        <div>
          <h2 className="text-xl font-bold text-white">Targeted CV Versions</h2>
          <p className="text-xs text-neutral-400">
            Create tailored CV links for specific job applications with customized headlines and curated projects.
          </p>
        </div>
        {!isAdding && !editingId && (
          <button
            onClick={handleStartAdd}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/30 flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create New Version</span>
          </button>
        )}
      </div>

      {/* Editor Modal */}
      {(isAdding || editingId) && (
        <div className="p-6 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-5 shadow-2xl">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
            <h3 className="font-bold text-sm text-white">
              {isAdding ? 'Configure New CV Version' : 'Edit CV Version'}
            </h3>
            <button onClick={() => { setIsAdding(false); setEditingId(null); }} className="text-neutral-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1">Version Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Distributed Systems & Core Backend"
                className="w-full px-3.5 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-white text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1">URL Identifier Slug *</label>
              <input
                type="text"
                required
                value={formData.slug}
                onChange={e => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') })}
                placeholder="e.g. backend-systems"
                className="w-full px-3.5 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-white text-xs font-mono"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-neutral-300 mb-1">Custom Headline for this Version</label>
              <input
                type="text"
                value={formData.customHeadline || ''}
                onChange={e => setFormData({ ...formData, customHeadline: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-white text-xs"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-neutral-300 mb-1">Tailored Summary / Objective</label>
              <textarea
                rows={3}
                value={formData.customSummary || ''}
                onChange={e => setFormData({ ...formData, customSummary: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-white text-xs resize-y"
              />
            </div>

            {/* Checkbox selector for included projects */}
            <div className="sm:col-span-2 space-y-2">
              <label className="block text-xs font-semibold text-neutral-300">
                Included Projects in this Version ({formData.selectedProjectIds?.length || 0} / {projects.length})
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-44 overflow-y-auto pr-1">
                {projects.map(p => {
                  const isSelected = (formData.selectedProjectIds || []).includes(p.id);
                  return (
                    <div
                      key={p.id}
                      onClick={() => toggleProjectSelection(p.id)}
                      className={`p-2.5 rounded-xl border text-xs cursor-pointer flex items-center justify-between transition-colors ${
                        isSelected
                          ? 'bg-indigo-950/60 border-indigo-700/80 text-white'
                          : 'bg-neutral-950 border-neutral-800 text-neutral-400'
                      }`}
                    >
                      <span className="font-medium truncate max-w-[200px]">{p.title}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${isSelected ? 'bg-indigo-600 text-white' : 'bg-neutral-800 text-neutral-400'}`}>
                        {isSelected ? 'Visible' : 'Hidden'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-neutral-800">
            <label className="flex items-center gap-2 text-xs text-neutral-300 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isDefault}
                onChange={e => setFormData({ ...formData, isDefault: e.target.checked })}
                className="rounded bg-neutral-950 border-neutral-800 text-indigo-600"
              />
              <span>Set as primary default profile version</span>
            </label>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => { setIsAdding(false); setEditingId(null); }}
                className="px-3 py-1.5 rounded-xl bg-neutral-800 text-neutral-300 text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold"
              >
                Save Version
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Versions List */}
      <div className="space-y-4">
        {versions.map(v => {
          const versionUrl = `${window.location.origin}/cv/${user?.username || 'user'}?v=${v.slug}`;
          const isCopied = copiedSlug === v.slug;

          return (
            <div
              key={v.id}
              className="p-5 rounded-2xl bg-neutral-900/60 border border-neutral-800 hover:border-neutral-700 transition-all space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-base text-white">{v.name}</h3>
                  {v.isDefault && (
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-[10px] font-semibold flex items-center gap-1">
                      <Star className="w-2.5 h-2.5 fill-current" />
                      Default Public Version
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => generatePDFResume(fullProfile, { template: 'modern-clean', version: v })}
                    className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800"
                    title="Export Version PDF"
                  >
                    <FileDown className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleStartEdit(v)}
                    className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800"
                    title="Edit Version"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(v.id)}
                    className="p-1.5 text-neutral-400 hover:text-rose-400 rounded-lg hover:bg-neutral-800"
                    title="Delete Version"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <p className="text-xs text-indigo-400 font-medium">{v.customHeadline || fullProfile.profile.headline}</p>

              {v.customSummary && (
                <p className="text-xs text-neutral-300 line-clamp-2">{v.customSummary}</p>
              )}

              {/* Version Link & Stats Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-neutral-800/80 text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-neutral-400">Target URL:</span>
                  <span className="font-mono text-neutral-300 bg-neutral-950 px-2 py-0.5 rounded border border-neutral-800">
                    /cv/{user?.username}?v={v.slug}
                  </span>
                  <button
                    onClick={() => handleCopyLink(v.slug)}
                    className="text-neutral-400 hover:text-white p-1"
                    title="Copy Link"
                  >
                    {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>

                <div className="flex items-center gap-3 text-neutral-400 text-[11px]">
                  <span>{v.selectedProjectIds?.length || 0} projects visible</span>
                  <span>•</span>
                  <span>{v.selectedExperienceIds?.length || 0} experiences visible</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
