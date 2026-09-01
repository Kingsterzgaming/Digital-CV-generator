import React, { useState } from 'react';
import {
  Briefcase,
  Plus,
  Trash2,
  Edit2,
  Save,
  X,
  Sparkles,
  Calendar,
  Building,
  MapPin,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { api } from '../../lib/api.ts';
import type { Experience } from '../../types/index.ts';

export const ExperienceManager: React.FC = () => {
  const { fullProfile, setLocalFullProfile } = useAuth();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAddingNew, setIsAddingNew] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [improvingId, setImprovingId] = useState<string | null>(null);

  const [formData, setFormData] = useState<Partial<Experience>>({
    company: '',
    role: '',
    location: '',
    type: 'full-time',
    startDate: '',
    endDate: '',
    isCurrent: false,
    description: '',
    highlights: [],
    technologies: [],
  });

  const [techInput, setTechInput] = useState<string>('');
  const [highlightInput, setHighlightInput] = useState<string>('');

  if (!fullProfile) return null;
  const experiences = fullProfile.experiences || [];

  const handleStartEdit = (exp: Experience) => {
    setEditingId(exp.id);
    setIsAddingNew(false);
    setFormData({ ...exp });
    setTechInput((exp.technologies || []).join(', '));
  };

  const handleStartAdd = () => {
    setIsAddingNew(true);
    setEditingId(null);
    setFormData({
      company: '',
      role: '',
      location: '',
      type: 'full-time',
      startDate: '2023',
      endDate: '',
      isCurrent: true,
      description: '',
      highlights: [],
      technologies: [],
    });
    setTechInput('');
  };

  const handleCancel = () => {
    setEditingId(null);
    setIsAddingNew(false);
  };

  const handleSave = async () => {
    if (!formData.company || !formData.role) return;
    setIsSaving(true);
    try {
      const technologies = techInput
        .split(',')
        .map(t => t.trim())
        .filter(Boolean);

      const saved = await api.saveExperience({
        ...formData,
        technologies,
      });

      setLocalFullProfile(prev => {
        if (!prev) return null;
        const exists = prev.experiences.some(e => e.id === saved.id);
        const updated = exists
          ? prev.experiences.map(e => e.id === saved.id ? saved : e)
          : [saved, ...prev.experiences];
        return { ...prev, experiences: updated };
      });

      handleCancel();
    } catch (err) {
      console.error('Failed to save experience:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this experience record?')) return;
    try {
      await api.deleteExperience(id);
      setLocalFullProfile(prev => prev ? {
        ...prev,
        experiences: prev.experiences.filter(e => e.id !== id),
      } : null);
    } catch (err) {
      console.error('Failed to delete experience:', err);
    }
  };

  const handleImproveDescription = async () => {
    if (!formData.description) return;
    setImprovingId(editingId || 'new');
    try {
      const res = await api.improveText({
        text: formData.description,
        type: 'experience',
        context: `${formData.role} at ${formData.company}`,
      });
      setFormData(prev => ({ ...prev, description: res.improved }));
    } catch (err) {
      console.error('Failed to improve description:', err);
    } finally {
      setImprovingId(null);
    }
  };

  const addHighlight = () => {
    if (!highlightInput.trim()) return;
    setFormData(prev => ({
      ...prev,
      highlights: [...(prev.highlights || []), highlightInput.trim()],
    }));
    setHighlightInput('');
  };

  const removeHighlight = (idx: number) => {
    setFormData(prev => ({
      ...prev,
      highlights: (prev.highlights || []).filter((_, i) => i !== idx),
    }));
  };

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
        <div>
          <h2 className="text-xl font-bold text-white">Work Experience</h2>
          <p className="text-xs text-neutral-400">
            Manage your employment history and internships stored in PostgreSQL.
          </p>
        </div>

        {!isAddingNew && !editingId && (
          <button
            onClick={handleStartAdd}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/30 flex items-center gap-1.5 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Experience</span>
          </button>
        )}
      </div>

      {/* Editor Modal / Form */}
      {(isAddingNew || editingId) && (
        <div className="p-6 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-5 shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
            <h3 className="font-bold text-sm text-white">
              {isAddingNew ? 'Add Work Experience' : 'Edit Work Experience'}
            </h3>
            <button
              onClick={handleCancel}
              className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1">Company / Organization *</label>
              <input
                type="text"
                required
                value={formData.company}
                onChange={e => setFormData({ ...formData, company: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-white text-xs focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1">Role Title *</label>
              <input
                type="text"
                required
                value={formData.role}
                onChange={e => setFormData({ ...formData, role: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-white text-xs focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1">Location</label>
              <input
                type="text"
                value={formData.location || ''}
                onChange={e => setFormData({ ...formData, location: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-white text-xs focus:border-indigo-500 focus:outline-none"
                placeholder="e.g. San Francisco, CA (or Remote)"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1">Employment Type</label>
              <select
                value={formData.type || 'full-time'}
                onChange={e => setFormData({ ...formData, type: e.target.value as any })}
                className="w-full px-3.5 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-white text-xs focus:border-indigo-500 focus:outline-none"
              >
                <option value="full-time">Full-time</option>
                <option value="part-time">Part-time</option>
                <option value="contract">Contract</option>
                <option value="internship">Internship</option>
                <option value="freelance">Freelance</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1">Start Date</label>
              <input
                type="text"
                value={formData.startDate || ''}
                onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-white text-xs focus:border-indigo-500 focus:outline-none"
                placeholder="e.g. 2021-04 or Apr 2021"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-neutral-300">End Date</label>
                <label className="flex items-center gap-1.5 text-xs text-neutral-400 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isCurrent}
                    onChange={e => setFormData({ ...formData, isCurrent: e.target.checked, endDate: e.target.checked ? 'Present' : '' })}
                    className="rounded bg-neutral-950 border-neutral-800 text-indigo-600"
                  />
                  <span>Current Role</span>
                </label>
              </div>
              <input
                type="text"
                disabled={formData.isCurrent}
                value={formData.endDate || ''}
                onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-white text-xs focus:border-indigo-500 focus:outline-none disabled:opacity-50"
                placeholder="e.g. Present or 2023-08"
              />
            </div>

            <div className="md:col-span-2">
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-neutral-300">Description & Responsibilities</label>
                <button
                  type="button"
                  onClick={handleImproveDescription}
                  disabled={improvingId !== null || !formData.description}
                  className="text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                >
                  {improvingId ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                  <span>Polish Description</span>
                </button>
              </div>
              <textarea
                rows={3}
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-white text-xs focus:border-indigo-500 focus:outline-none resize-y"
              />
            </div>

            {/* Bullet Highlights */}
            <div className="md:col-span-2 space-y-2">
              <label className="block text-xs font-semibold text-neutral-300">Key Achievements / Highlights</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={highlightInput}
                  onChange={e => setHighlightInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addHighlight())}
                  placeholder="Add measurable achievement bullet point..."
                  className="flex-1 px-3.5 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-white text-xs focus:border-indigo-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={addHighlight}
                  className="px-3 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white text-xs"
                >
                  Add
                </button>
              </div>
              <div className="space-y-1.5 pt-1">
                {(formData.highlights || []).map((h, i) => (
                  <div key={i} className="flex items-start justify-between gap-2 p-2 rounded-lg bg-neutral-950 border border-neutral-800/80 text-xs text-neutral-300">
                    <span>• {h}</span>
                    <button
                      type="button"
                      onClick={() => removeHighlight(i)}
                      className="text-neutral-500 hover:text-rose-400"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Technologies */}
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-neutral-300 mb-1">Technologies Used (comma separated)</label>
              <input
                type="text"
                value={techInput}
                onChange={e => setTechInput(e.target.value)}
                placeholder="e.g. Go, Rust, PostgreSQL, Kubernetes, Kafka"
                className="w-full px-3.5 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-white text-xs focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-neutral-800">
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-medium"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isSaving || !formData.company || !formData.role}
              onClick={handleSave}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              <span>Save to DB</span>
            </button>
          </div>
        </div>
      )}

      {/* Experience List */}
      <div className="space-y-4">
        {experiences.length === 0 && !isAddingNew && (
          <div className="text-center py-12 bg-neutral-900/40 border border-neutral-800 rounded-2xl text-neutral-400 text-xs space-y-2">
            <Briefcase className="w-8 h-8 text-neutral-600 mx-auto" />
            <p>No work experience entries recorded yet.</p>
            <button
              onClick={handleStartAdd}
              className="text-indigo-400 hover:underline font-semibold"
            >
              Add your first role
            </button>
          </div>
        )}

        {experiences.map(exp => (
          <div
            key={exp.id}
            className="p-5 rounded-2xl bg-neutral-900/60 border border-neutral-800 hover:border-neutral-700 transition-all space-y-3"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-base text-white">{exp.role}</h3>
                  {exp.type === 'internship' && (
                    <span className="px-2 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-800 text-[10px] font-semibold">
                      Internship
                    </span>
                  )}
                </div>
                <div className="text-xs text-neutral-400 flex items-center gap-2 mt-0.5">
                  <span className="text-indigo-400 font-semibold">{exp.company}</span>
                  {exp.location && <span>• {exp.location}</span>}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-neutral-400">
                  {exp.startDate} – {exp.isCurrent ? 'Present' : exp.endDate}
                </span>
                <div className="flex items-center gap-1 ml-2">
                  <button
                    onClick={() => handleStartEdit(exp)}
                    className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(exp.id)}
                    className="p-1.5 text-neutral-400 hover:text-rose-400 rounded-lg hover:bg-neutral-800 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            <p className="text-xs text-neutral-300 leading-relaxed whitespace-pre-line">
              {exp.description}
            </p>

            {exp.highlights && exp.highlights.length > 0 && (
              <ul className="space-y-1 text-xs text-neutral-300 pl-2">
                {exp.highlights.map((h, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="text-indigo-400">•</span>
                    <span>{h}</span>
                  </li>
                ))}
              </ul>
            )}

            {exp.technologies && exp.technologies.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {exp.technologies.map((t, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 rounded bg-neutral-950 border border-neutral-800 text-[10px] text-neutral-300 font-mono"
                  >
                    {t}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
