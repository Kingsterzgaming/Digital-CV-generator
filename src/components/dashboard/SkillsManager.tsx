import React, { useState } from 'react';
import {
  Wrench,
  Plus,
  Trash2,
  Edit2,
  Save,
  X,
  Sparkles,
  Star,
  Check,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { api } from '../../lib/api.ts';
import type { Skill } from '../../types/index.ts';

export const SkillsManager: React.FC = () => {
  const { fullProfile, setLocalFullProfile } = useAuth();
  const [isAdding, setIsAdding] = useState<boolean>(false);
  const [newSkillName, setNewSkillName] = useState<string>('');
  const [newCategory, setNewCategory] = useState<Skill['category']>('technical');
  const [newProficiency, setNewProficiency] = useState<Skill['proficiency']>('advanced');

  if (!fullProfile) return null;
  const skills = fullProfile.skills || [];

  const handleAddSkill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSkillName.trim()) return;

    try {
      const saved = await api.saveSkill({
        name: newSkillName.trim(),
        category: newCategory,
        proficiency: newProficiency,
        highlighted: true,
      });

      setLocalFullProfile(prev => prev ? {
        ...prev,
        skills: [...prev.skills, saved],
      } : null);

      setNewSkillName('');
      setIsAdding(false);
    } catch (err) {
      console.error('Failed to add skill:', err);
    }
  };

  const handleToggleHighlight = async (skill: Skill) => {
    try {
      const updated = await api.saveSkill({
        ...skill,
        highlighted: !skill.highlighted,
      });
      setLocalFullProfile(prev => prev ? {
        ...prev,
        skills: prev.skills.map(s => s.id === skill.id ? updated : s),
      } : null);
    } catch (err) {
      console.error('Failed to toggle highlight:', err);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.deleteSkill(id);
      setLocalFullProfile(prev => prev ? {
        ...prev,
        skills: prev.skills.filter(s => s.id !== id),
      } : null);
    } catch (err) {
      console.error('Failed to delete skill:', err);
    }
  };

  const categories: { id: Skill['category']; label: string }[] = [
    { id: 'technical', label: 'Technical & Systems' },
    { id: 'languages', label: 'Programming Languages' },
    { id: 'frameworks', label: 'Frameworks & Libraries' },
    { id: 'tools', label: 'Cloud, DevOps & Tools' },
    { id: 'soft', label: 'Leadership & Soft Skills' },
  ];

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
        <div>
          <h2 className="text-xl font-bold text-white">Skills Matrix</h2>
          <p className="text-xs text-neutral-400">
            Categorized technical capabilities and proficiencies stored in PostgreSQL.
          </p>
        </div>

        {!isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/30 flex items-center gap-1.5 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Skill</span>
          </button>
        )}
      </div>

      {/* Add Skill Bar */}
      {isAdding && (
        <form onSubmit={handleAddSkill} className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-3 shadow-xl">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-white">Add New Skill to Matrix</h3>
            <button type="button" onClick={() => setIsAdding(false)} className="text-neutral-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input
              type="text"
              required
              autoFocus
              value={newSkillName}
              onChange={e => setNewSkillName(e.target.value)}
              placeholder="e.g. Distributed Consensus (Raft)"
              className="px-3.5 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-white text-xs focus:border-indigo-500 focus:outline-none"
            />
            <select
              value={newCategory}
              onChange={e => setNewCategory(e.target.value as any)}
              className="px-3.5 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-white text-xs focus:border-indigo-500 focus:outline-none"
            >
              <option value="technical">Technical</option>
              <option value="languages">Programming Language</option>
              <option value="frameworks">Framework</option>
              <option value="tools">Cloud & Tool</option>
              <option value="soft">Soft Skill</option>
            </select>
            <select
              value={newProficiency}
              onChange={e => setNewProficiency(e.target.value as any)}
              className="px-3.5 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-white text-xs focus:border-indigo-500 focus:outline-none"
            >
              <option value="expert">Expert</option>
              <option value="advanced">Advanced</option>
              <option value="intermediate">Intermediate</option>
              <option value="beginner">Beginner</option>
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-3 py-1.5 rounded-lg bg-neutral-800 text-neutral-300 text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold"
            >
              Save Skill
            </button>
          </div>
        </form>
      )}

      {/* Categorized Skills Grid */}
      <div className="space-y-6">
        {categories.map(cat => {
          const catSkills = skills.filter(s => (s.category || 'technical') === cat.id);
          return (
            <div key={cat.id} className="p-5 rounded-2xl bg-neutral-900/50 border border-neutral-800/80 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                  {cat.label} ({catSkills.length})
                </h3>
              </div>

              {catSkills.length === 0 ? (
                <p className="text-xs text-neutral-600 italic">No skills listed under {cat.label.toLowerCase()}.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {catSkills.map(skill => (
                    <div
                      key={skill.id}
                      className={`px-3 py-1.5 rounded-xl border flex items-center gap-2 text-xs transition-all ${
                        skill.highlighted
                          ? 'bg-indigo-950/80 border-indigo-700/80 text-indigo-200 shadow-sm'
                          : 'bg-neutral-950 border-neutral-800 text-neutral-300'
                      }`}
                    >
                      <span className="font-medium">{skill.name}</span>
                      <button
                        onClick={() => handleToggleHighlight(skill)}
                        title={skill.highlighted ? 'Remove highlight' : 'Highlight as top skill'}
                        className={`p-0.5 rounded transition-colors ${
                          skill.highlighted ? 'text-amber-400' : 'text-neutral-600 hover:text-neutral-400'
                        }`}
                      >
                        <Star className="w-3 h-3 fill-current" />
                      </button>
                      <button
                        onClick={() => handleDelete(skill.id)}
                        className="text-neutral-600 hover:text-rose-400 p-0.5"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
