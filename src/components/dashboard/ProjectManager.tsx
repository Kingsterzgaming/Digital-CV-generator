import React, { useState } from 'react';
import {
  FolderGit2,
  Plus,
  Trash2,
  Edit2,
  Save,
  X,
  Sparkles,
  Github,
  ExternalLink,
  Star,
  Download,
  Loader2,
  Search,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { api } from '../../lib/api.ts';
import type { Project } from '../../types/index.ts';

export const ProjectManager: React.FC = () => {
  const { fullProfile, setLocalFullProfile } = useAuth();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAddingNew, setIsAddingNew] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [showGithubImport, setShowGithubImport] = useState<boolean>(false);
  const [githubUser, setGithubUser] = useState<string>('');
  const [githubRepos, setGithubRepos] = useState<any[]>([]);
  const [isLoadingGithub, setIsLoadingGithub] = useState<boolean>(false);
  const [improvingId, setImprovingId] = useState<string | null>(null);

  const [formData, setFormData] = useState<Partial<Project>>({
    title: '',
    tagline: '',
    description: '',
    role: '',
    technologies: [],
    githubUrl: '',
    liveUrl: '',
    startDate: '',
    endDate: '',
    featured: false,
  });

  const [techInput, setTechInput] = useState<string>('');

  if (!fullProfile) return null;
  const projects = fullProfile.projects || [];

  const handleStartEdit = (proj: Project) => {
    setEditingId(proj.id);
    setIsAddingNew(false);
    setFormData({ ...proj });
    setTechInput((proj.technologies || []).join(', '));
  };

  const handleStartAdd = () => {
    setIsAddingNew(true);
    setEditingId(null);
    setFormData({
      title: '',
      tagline: '',
      description: '',
      role: '',
      technologies: [],
      githubUrl: '',
      liveUrl: '',
      featured: true,
    });
    setTechInput('');
  };

  const handleCancel = () => {
    setEditingId(null);
    setIsAddingNew(false);
  };

  const handleSave = async () => {
    if (!formData.title) return;
    setIsSaving(true);
    try {
      const technologies = techInput
        .split(',')
        .map(t => t.trim())
        .filter(Boolean);

      const saved = await api.saveProject({
        ...formData,
        technologies,
      });

      setLocalFullProfile(prev => {
        if (!prev) return null;
        const exists = prev.projects.some(p => p.id === saved.id);
        const updated = exists
          ? prev.projects.map(p => p.id === saved.id ? saved : p)
          : [saved, ...prev.projects];
        return { ...prev, projects: updated };
      });

      handleCancel();
    } catch (err) {
      console.error('Failed to save project:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this project?')) return;
    try {
      await api.deleteProject(id);
      setLocalFullProfile(prev => prev ? {
        ...prev,
        projects: prev.projects.filter(p => p.id !== id),
      } : null);
    } catch (err) {
      console.error('Failed to delete project:', err);
    }
  };

  const handleFetchGithubRepos = async () => {
    const userToFetch = githubUser.trim() || 'facebook';
    setIsLoadingGithub(true);
    try {
      const res = await api.getGitHubRepos(userToFetch);
      setGithubRepos(res.repositories || []);
    } catch (err) {
      console.error('GitHub fetch failed:', err);
    } finally {
      setIsLoadingGithub(false);
    }
  };

  const handleImportGithubRepo = (repo: any) => {
    const newProj: Partial<Project> = {
      title: repo.name.replace(/[-_]/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()),
      tagline: repo.description || 'Open-source repository',
      description: repo.description || 'Public GitHub project showcasing modern architecture and clean code.',
      githubUrl: repo.url,
      liveUrl: repo.homepage || '',
      technologies: [repo.language, ...(repo.topics || [])].filter(Boolean),
      featured: true,
    };
    setFormData(newProj);
    setTechInput([repo.language, ...(repo.topics || [])].filter(Boolean).join(', '));
    setShowGithubImport(false);
    setIsAddingNew(true);
  };

  const handleImproveDescription = async () => {
    if (!formData.description) return;
    setImprovingId(editingId || 'new');
    try {
      const res = await api.improveText({
        text: formData.description,
        type: 'project',
        context: `Project title: ${formData.title}. Tech stack: ${techInput}`,
      });
      setFormData(prev => ({ ...prev, description: res.improved }));
    } catch (err) {
      console.error('Failed to polish project description:', err);
    } finally {
      setImprovingId(null);
    }
  };

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-neutral-800">
        <div>
          <h2 className="text-xl font-bold text-white">Projects & Portfolio</h2>
          <p className="text-xs text-neutral-400">
            Showcase systems, open-source repositories, and products stored in PostgreSQL.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowGithubImport(true)}
            className="px-3.5 py-2 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-indigo-500/60 text-neutral-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Github className="w-3.5 h-3.5" />
            <span>Import GitHub Repos</span>
          </button>
          {!isAddingNew && !editingId && (
            <button
              onClick={handleStartAdd}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/30 flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Project</span>
            </button>
          )}
        </div>
      </div>

      {/* GitHub Importer Modal */}
      {showGithubImport && (
        <div className="p-6 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-4 shadow-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Github className="w-5 h-5 text-white" />
              <h3 className="font-bold text-sm text-white">Import Public Repositories from GitHub</h3>
            </div>
            <button
              onClick={() => setShowGithubImport(false)}
              className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={githubUser}
              onChange={e => setGithubUser(e.target.value)}
              placeholder="Enter GitHub username (e.g. torvalds, vercel, elena-rostova)..."
              className="flex-1 px-3.5 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-white text-xs focus:border-indigo-500 focus:outline-none"
            />
            <button
              type="button"
              onClick={handleFetchGithubRepos}
              disabled={isLoadingGithub}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5"
            >
              {isLoadingGithub ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
              <span>Search Repos</span>
            </button>
          </div>

          {githubRepos.length > 0 && (
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {githubRepos.map(repo => (
                <div
                  key={repo.id}
                  className="p-3 rounded-xl bg-neutral-950 border border-neutral-800/80 hover:border-indigo-500/60 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-0.5 max-w-lg">
                    <span className="font-bold text-white">{repo.name}</span>
                    <p className="text-neutral-400 text-[11px] line-clamp-1">{repo.description || 'No description'}</p>
                    <div className="flex items-center gap-3 text-[10px] text-neutral-500 font-mono">
                      <span>{repo.language}</span>
                      <span>★ {repo.stars}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleImportGithubRepo(repo)}
                    className="px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white font-semibold transition-colors flex-shrink-0"
                  >
                    Import
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Editor Form */}
      {(isAddingNew || editingId) && (
        <div className="p-6 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-4 shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
            <h3 className="font-bold text-sm text-white">
              {isAddingNew ? 'Create New Project' : 'Edit Project Details'}
            </h3>
            <button onClick={handleCancel} className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1">Project Title *</label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-white text-xs focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1">Short Tagline / Subtitle</label>
              <input
                type="text"
                value={formData.tagline || ''}
                onChange={e => setFormData({ ...formData, tagline: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-white text-xs focus:border-indigo-500 focus:outline-none"
                placeholder="e.g. Distributed Key-Value Storage Engine"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1">GitHub Repository URL</label>
              <input
                type="text"
                value={formData.githubUrl || ''}
                onChange={e => setFormData({ ...formData, githubUrl: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-white text-xs focus:border-indigo-500 focus:outline-none"
                placeholder="https://github.com/..."
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1">Live Application URL</label>
              <input
                type="text"
                value={formData.liveUrl || ''}
                onChange={e => setFormData({ ...formData, liveUrl: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-white text-xs focus:border-indigo-500 focus:outline-none"
                placeholder="https://..."
              />
            </div>

            <div className="md:col-span-2">
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-neutral-300">Description & Technical Accomplishments</label>
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

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-neutral-300 mb-1">Technologies & Tools (comma separated)</label>
              <input
                type="text"
                value={techInput}
                onChange={e => setTechInput(e.target.value)}
                placeholder="e.g. Rust, Raft, RocksDB, gRPC, Docker"
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
              disabled={isSaving || !formData.title}
              onClick={handleSave}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              <span>Save Project to DB</span>
            </button>
          </div>
        </div>
      )}

      {/* Projects List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {projects.map(proj => (
          <div
            key={proj.id}
            className="p-5 rounded-2xl bg-neutral-900/60 border border-neutral-800 hover:border-neutral-700 transition-all flex flex-col justify-between space-y-3"
          >
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-bold text-base text-white">{proj.title}</h3>
                  {proj.tagline && <p className="text-xs text-neutral-400 mt-0.5">{proj.tagline}</p>}
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleStartEdit(proj)}
                    className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(proj.id)}
                    className="p-1.5 text-neutral-400 hover:text-rose-400 rounded-lg hover:bg-neutral-800"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <p className="text-xs text-neutral-300 leading-relaxed line-clamp-3">
                {proj.description}
              </p>
            </div>

            <div className="space-y-3 pt-2 border-t border-neutral-800/80">
              {proj.technologies && proj.technologies.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {proj.technologies.map((t, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded bg-neutral-950 border border-neutral-800 text-[10px] text-indigo-300 font-mono"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-3 text-xs">
                {proj.githubUrl && (
                  <a
                    href={proj.githubUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-neutral-400 hover:text-indigo-400 flex items-center gap-1"
                  >
                    <Github className="w-3.5 h-3.5" />
                    <span>Repository</span>
                  </a>
                )}
                {proj.liveUrl && (
                  <a
                    href={proj.liveUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-neutral-400 hover:text-indigo-400 flex items-center gap-1"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Live Demo</span>
                  </a>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
