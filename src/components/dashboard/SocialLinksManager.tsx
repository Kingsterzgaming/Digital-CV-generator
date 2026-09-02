import React, { useState, useEffect } from 'react';
import {
  Share2,
  Plus,
  Trash2,
  ExternalLink,
  Save,
  CheckCircle2,
  Code,
  Copy,
  Check,
  Globe,
  Github,
  Linkedin,
  Twitter,
  Youtube,
  Dribbble,
  ArrowUp,
  ArrowDown,
  Sparkles,
  RefreshCw,
  FileJson,
  AlertCircle,
  Link2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { api } from '../../lib/api.ts';
import type { SocialLink } from '../../types/index.ts';

// Supported preset platforms with metadata
const PRESET_PLATFORMS = [
  { id: 'github', name: 'GitHub', placeholder: 'https://github.com/username', defaultLabel: 'GitHub', icon: Github, color: 'text-white hover:text-white', bg: 'bg-neutral-900 border-neutral-700' },
  { id: 'linkedin', name: 'LinkedIn', placeholder: 'https://linkedin.com/in/username', defaultLabel: 'LinkedIn', icon: Linkedin, color: 'text-sky-400 hover:text-sky-300', bg: 'bg-sky-950/40 border-sky-800/60' },
  { id: 'twitter', name: 'X / Twitter', placeholder: 'https://x.com/username', defaultLabel: 'X (Twitter)', icon: Twitter, color: 'text-blue-400 hover:text-blue-300', bg: 'bg-blue-950/40 border-blue-800/60' },
  { id: 'portfolio', name: 'Portfolio / Website', placeholder: 'https://yourwebsite.com', defaultLabel: 'Personal Website', icon: Globe, color: 'text-indigo-400 hover:text-indigo-300', bg: 'bg-indigo-950/40 border-indigo-800/60' },
  { id: 'youtube', name: 'YouTube', placeholder: 'https://youtube.com/@channel', defaultLabel: 'YouTube', icon: Youtube, color: 'text-rose-400 hover:text-rose-300', bg: 'bg-rose-950/40 border-rose-800/60' },
  { id: 'dribbble', name: 'Dribbble', placeholder: 'https://dribbble.com/username', defaultLabel: 'Dribbble', icon: Dribbble, color: 'text-pink-400 hover:text-pink-300', bg: 'bg-pink-950/40 border-pink-800/60' },
  { id: 'medium', name: 'Medium', placeholder: 'https://medium.com/@username', defaultLabel: 'Medium Blog', icon: Globe, color: 'text-emerald-400 hover:text-emerald-300', bg: 'bg-emerald-950/40 border-emerald-800/60' },
  { id: 'leetcode', name: 'LeetCode', placeholder: 'https://leetcode.com/u/username', defaultLabel: 'LeetCode', icon: Code, color: 'text-amber-400 hover:text-amber-300', bg: 'bg-amber-950/40 border-amber-800/60' },
  { id: 'discord', name: 'Discord', placeholder: 'https://discord.gg/invite or username', defaultLabel: 'Discord', icon: Share2, color: 'text-indigo-300 hover:text-indigo-200', bg: 'bg-indigo-950/30 border-indigo-800/50' },
  { id: 'instagram', name: 'Instagram', placeholder: 'https://instagram.com/username', defaultLabel: 'Instagram', icon: Share2, color: 'text-purple-400 hover:text-purple-300', bg: 'bg-purple-950/40 border-purple-800/60' },
  { id: 'other', name: 'Other Custom Link', placeholder: 'https://example.com', defaultLabel: 'Web Link', icon: Link2, color: 'text-neutral-300 hover:text-white', bg: 'bg-neutral-900 border-neutral-800' },
];

export const SocialLinksManager: React.FC = () => {
  const { fullProfile, setLocalFullProfile, refreshProfile } = useAuth();
  const [links, setLinks] = useState<SocialLink[]>([]);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showJsonMode, setShowJsonMode] = useState<boolean>(false);
  const [jsonText, setJsonText] = useState<string>('');
  const [jsonCopied, setJsonCopied] = useState<boolean>(false);
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);

  // Sync state from profile or fetch from JSON API on mount
  useEffect(() => {
    if (fullProfile?.socialLinks) {
      setLinks(fullProfile.socialLinks);
      setJsonText(JSON.stringify(fullProfile.socialLinks, null, 2));
    } else {
      fetchLinksFromBackend();
    }
  }, [fullProfile?.socialLinks]);

  const fetchLinksFromBackend = async () => {
    try {
      setIsLoading(true);
      const res = await api.getSocialLinks();
      if (res && res.links) {
        setLinks(res.links);
        setJsonText(JSON.stringify(res.links, null, 2));
      }
    } catch (err: any) {
      console.warn('Could not fetch social links directly:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddPreset = (platformId: string) => {
    const preset = PRESET_PLATFORMS.find(p => p.id === platformId) || PRESET_PLATFORMS[PRESET_PLATFORMS.length - 1];
    const newLink: SocialLink = {
      id: `soc_${Math.random().toString(36).substring(2, 9)}`,
      platform: platformId as any,
      label: preset.defaultLabel,
      url: '',
      username: '',
    };
    const updated = [...links, newLink];
    setLinks(updated);
    setJsonText(JSON.stringify(updated, null, 2));
    setSaveSuccess(false);
  };

  const handleUpdateLink = (index: number, field: keyof SocialLink, value: string) => {
    const updated = [...links];
    updated[index] = { ...updated[index], [field]: value };
    
    // Auto-adjust label if platform is changed
    if (field === 'platform') {
      const preset = PRESET_PLATFORMS.find(p => p.id === value);
      if (preset && (!updated[index].label || updated[index].label === 'Web Link')) {
        updated[index].label = preset.defaultLabel;
      }
    }
    
    setLinks(updated);
    setJsonText(JSON.stringify(updated, null, 2));
    setSaveSuccess(false);
  };

  const handleDeleteLink = (index: number) => {
    const updated = links.filter((_, i) => i !== index);
    setLinks(updated);
    setJsonText(JSON.stringify(updated, null, 2));
    setSaveSuccess(false);
  };

  const handleMoveLink = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === links.length - 1) return;
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    const updated = [...links];
    const temp = updated[index];
    updated[index] = updated[targetIdx];
    updated[targetIdx] = temp;
    setLinks(updated);
    setJsonText(JSON.stringify(updated, null, 2));
    setSaveSuccess(false);
  };

  const handleSaveAll = async () => {
    try {
      setIsSaving(true);
      setErrorMessage(null);
      setSaveSuccess(false);

      // Clean links & ensure formatting
      const cleaned = links.map(link => {
        let url = link.url.trim();
        if (url && !url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('mailto:')) {
          url = `https://${url}`;
        }
        return {
          ...link,
          url,
          label: link.label.trim() || 'Link',
        };
      });

      const res = await api.saveSocialLinks(cleaned);
      if (res && res.links) {
        setLinks(res.links);
        setJsonText(JSON.stringify(res.links, null, 2));
        setLocalFullProfile(prev => prev ? { ...prev, socialLinks: res.links } : null);
        await refreshProfile();
        setSaveSuccess(true);
        setLastSavedTime(new Date().toLocaleTimeString());
        setTimeout(() => setSaveSuccess(false), 4000);
      }
    } catch (err: any) {
      console.error('Failed to save social links to database JSON:', err);
      setErrorMessage(err.message || 'Failed to save social links to JSON');
    } finally {
      setIsSaving(false);
    }
  };

  const handleApplyJson = async () => {
    try {
      setJsonError(null);
      const parsed = JSON.parse(jsonText);
      if (!Array.isArray(parsed)) {
        throw new Error('JSON format must be an array of social link objects: [ { "platform": "...", "label": "...", "url": "..." } ]');
      }

      // Validate items
      const validLinks: SocialLink[] = parsed.map((item: any, idx: number) => ({
        id: item.id || `soc_${idx}_${Math.random().toString(36).substring(2, 7)}`,
        platform: item.platform || 'other',
        label: item.label || item.platform || 'Link',
        url: item.url || '',
        username: item.username,
      }));

      setLinks(validLinks);
      setIsSaving(true);
      const res = await api.saveSocialLinks(validLinks);
      if (res && res.links) {
        setLinks(res.links);
        setJsonText(JSON.stringify(res.links, null, 2));
        setLocalFullProfile(prev => prev ? { ...prev, socialLinks: res.links } : null);
        await refreshProfile();
        setSaveSuccess(true);
        setLastSavedTime(new Date().toLocaleTimeString());
        setShowJsonMode(false);
        setTimeout(() => setSaveSuccess(false), 4000);
      }
    } catch (err: any) {
      setJsonError(err.message || 'Invalid JSON syntax');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopyJson = () => {
    navigator.clipboard.writeText(jsonText);
    setJsonCopied(true);
    setTimeout(() => setJsonCopied(false), 2000);
  };

  const getPlatformIcon = (platform: string) => {
    const found = PRESET_PLATFORMS.find(p => p.id === platform.toLowerCase());
    if (found) {
      const IconComp = found.icon;
      return <IconComp className="w-4 h-4" />;
    }
    return <Globe className="w-4 h-4" />;
  };

  return (
    <div className="max-w-5xl space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-800">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-950/60 border border-indigo-800/80 text-indigo-400">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                Social Media & Web Links
              </h2>
              <p className="text-xs text-neutral-400">
                Configure your social media accounts and developer profiles. All links are automatically stored in the JSON database file (<code className="text-indigo-300 text-[11px] font-mono">data/database.json</code>) and fetched on every app launch.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowJsonMode(!showJsonMode)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
              showJsonMode
                ? 'bg-neutral-800 text-white border-neutral-700'
                : 'bg-neutral-900/80 text-neutral-300 border-neutral-800 hover:text-white hover:bg-neutral-800'
            }`}
            title="View or edit raw JSON representation"
          >
            <FileJson className="w-4 h-4 text-amber-400" />
            <span>{showJsonMode ? 'Visual Editor' : 'JSON Mode'}</span>
          </button>

          <button
            onClick={handleSaveAll}
            disabled={isSaving}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Saving to JSON...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save All Links to JSON</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Persistence Notification Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-neutral-900/60 border border-neutral-800/90 text-xs">
        <div className="flex items-center gap-2 text-neutral-300">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-semibold text-white">JSON Storage File:</span>
          <code className="px-2 py-0.5 rounded bg-black/50 border border-neutral-800 text-indigo-300 font-mono text-[11px]">
            data/database.json &rarr; socialLinks[{links.length}]
          </code>
          {lastSavedTime && (
            <span className="text-neutral-400 text-[11px] hidden sm:inline">
              (Last committed: {lastSavedTime})
            </span>
          )}
        </div>

        {saveSuccess && (
          <div className="flex items-center gap-1.5 text-emerald-400 font-semibold bg-emerald-950/40 border border-emerald-800/60 px-3 py-1 rounded-xl animate-fade-in">
            <CheckCircle2 className="w-4 h-4" />
            <span>Successfully saved and written to database.json!</span>
          </div>
        )}

        {errorMessage && (
          <div className="flex items-center gap-1.5 text-rose-400 font-semibold bg-rose-950/40 border border-rose-800/60 px-3 py-1 rounded-xl">
            <AlertCircle className="w-4 h-4" />
            <span>{errorMessage}</span>
          </div>
        )}
      </div>

      {/* Preset Fast-Add Buttons */}
      <div className="p-4 rounded-2xl bg-neutral-900/40 border border-neutral-800 space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-neutral-300 uppercase tracking-wider">
            Quick Add Popular Platforms:
          </span>
          <span className="text-[11px] text-neutral-400">
            Click any platform to add an account card
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {PRESET_PLATFORMS.map(preset => {
            const Icon = preset.icon;
            const isAdded = links.some(l => l.platform === preset.id);
            return (
              <button
                key={preset.id}
                onClick={() => handleAddPreset(preset.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                  isAdded
                    ? 'bg-neutral-900 border-neutral-700 text-neutral-300 hover:border-neutral-600'
                    : 'bg-neutral-950/80 border-neutral-800 hover:border-indigo-500/60 hover:text-white text-neutral-400 hover:bg-neutral-900'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{preset.name}</span>
                {isAdded ? (
                  <Check className="w-3 h-3 text-emerald-400 ml-1" />
                ) : (
                  <Plus className="w-3 h-3 text-neutral-400 ml-1" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* JSON MODE EDITOR */}
      {showJsonMode ? (
        <div className="p-6 rounded-2xl bg-neutral-900/90 border border-neutral-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileJson className="w-5 h-5 text-amber-400" />
              <div>
                <h3 className="text-sm font-bold text-white">Direct JSON File Editor</h3>
                <p className="text-xs text-neutral-400">
                  Inspect or paste raw JSON array of social links. On apply, the server writes this directly to <code className="text-indigo-300">data/database.json</code>.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyJson}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700"
              >
                {jsonCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{jsonCopied ? 'Copied!' : 'Copy JSON'}</span>
              </button>

              <button
                onClick={handleApplyJson}
                disabled={isSaving}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white shadow"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Apply & Save JSON</span>
              </button>
            </div>
          </div>

          {jsonError && (
            <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{jsonError}</span>
            </div>
          )}

          <textarea
            value={jsonText}
            onChange={e => setJsonText(e.target.value)}
            rows={14}
            className="w-full p-4 rounded-xl bg-black border border-neutral-800 font-mono text-xs text-emerald-400 focus:outline-none focus:border-indigo-500 leading-relaxed resize-y"
            placeholder={`[\n  {\n    "id": "soc_1",\n    "platform": "github",\n    "label": "GitHub",\n    "url": "https://github.com/yourhandle"\n  }\n]`}
          />
        </div>
      ) : (
        /* VISUAL ACCOUNTS LIST */
        <div className="space-y-3">
          {links.length === 0 ? (
            <div className="p-10 rounded-2xl bg-neutral-900/30 border border-dashed border-neutral-800 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-neutral-900 flex items-center justify-center mx-auto text-neutral-400">
                <Share2 className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-neutral-300">No social media links added yet</p>
              <p className="text-xs text-neutral-400 max-w-sm mx-auto">
                Add your GitHub, LinkedIn, Twitter/X, and portfolio links so recruiters and visitors can easily connect with you.
              </p>
              <div className="pt-2 flex justify-center gap-2">
                <button
                  onClick={() => handleAddPreset('github')}
                  className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
                >
                  Add GitHub
                </button>
                <button
                  onClick={() => handleAddPreset('linkedin')}
                  className="px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold"
                >
                  Add LinkedIn
                </button>
              </div>
            </div>
          ) : (
            links.map((link, idx) => {
              const preset = PRESET_PLATFORMS.find(p => p.id === link.platform) || PRESET_PLATFORMS[PRESET_PLATFORMS.length - 1];
              return (
                <div
                  key={link.id || idx}
                  className="p-4 rounded-2xl bg-neutral-900/80 border border-neutral-800 hover:border-neutral-700 transition-all flex flex-col md:flex-row items-start md:items-center gap-3.5 shadow-md"
                >
                  {/* Platform Icon & Order Controls */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <div className="flex flex-col gap-0.5">
                      <button
                        onClick={() => handleMoveLink(idx, 'up')}
                        disabled={idx === 0}
                        className="p-1 rounded bg-neutral-800 text-neutral-400 hover:text-white disabled:opacity-30"
                        title="Move link up"
                      >
                        <ArrowUp className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => handleMoveLink(idx, 'down')}
                        disabled={idx === links.length - 1}
                        className="p-1 rounded bg-neutral-800 text-neutral-400 hover:text-white disabled:opacity-30"
                        title="Move link down"
                      >
                        <ArrowDown className="w-3 h-3" />
                      </button>
                    </div>

                    <div className="p-2.5 rounded-xl bg-black border border-neutral-800 text-neutral-200">
                      {getPlatformIcon(link.platform)}
                    </div>
                  </div>

                  {/* Platform Selector */}
                  <div className="w-full md:w-44 flex-shrink-0">
                    <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1">
                      Platform
                    </label>
                    <select
                      value={link.platform}
                      onChange={e => handleUpdateLink(idx, 'platform', e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-black border border-neutral-800 text-xs text-white focus:outline-none focus:border-indigo-500"
                    >
                      {PRESET_PLATFORMS.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Display Label */}
                  <div className="w-full md:w-44 flex-shrink-0">
                    <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1">
                      Display Label
                    </label>
                    <input
                      type="text"
                      value={link.label}
                      onChange={e => handleUpdateLink(idx, 'label', e.target.value)}
                      placeholder={preset.defaultLabel}
                      className="w-full px-3 py-2 rounded-xl bg-black border border-neutral-800 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  {/* URL Input */}
                  <div className="w-full flex-1">
                    <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1">
                      Target URL / Link Address
                    </label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="url"
                        value={link.url}
                        onChange={e => handleUpdateLink(idx, 'url', e.target.value)}
                        placeholder={preset.placeholder}
                        className="w-full px-3 py-2 rounded-xl bg-black border border-neutral-800 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-indigo-500"
                      />
                      {link.url && (
                        <a
                          href={link.url.startsWith('http') ? link.url : `https://${link.url}`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white border border-neutral-700 flex-shrink-0"
                          title="Test open link"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Delete Action */}
                  <div className="flex items-end pt-5 md:pt-0">
                    <button
                      onClick={() => handleDeleteLink(idx)}
                      className="p-2.5 rounded-xl bg-rose-950/40 border border-rose-800/60 text-rose-400 hover:bg-rose-900/60 hover:text-rose-200 transition-colors"
                      title="Delete link"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}

          {/* Add custom link button */}
          <button
            onClick={() => handleAddPreset('other')}
            className="w-full py-3 rounded-2xl border border-dashed border-neutral-800 hover:border-indigo-500/60 text-neutral-400 hover:text-white bg-neutral-900/20 hover:bg-neutral-900/50 flex items-center justify-center gap-2 text-xs font-semibold transition-all"
          >
            <Plus className="w-4 h-4 text-indigo-400" />
            <span>Add Another Social Link</span>
          </button>
        </div>
      )}

      {/* Live Visual Portfolio Preview Box */}
      <div className="p-6 rounded-3xl bg-neutral-900/40 border border-neutral-800 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-300">
              Live Public CV Header Preview
            </h3>
          </div>
          <span className="text-[11px] text-neutral-400">
            {links.filter(l => l.url).length} active link(s) ready
          </span>
        </div>

        <div className="p-4 sm:p-6 rounded-2xl bg-black border border-neutral-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <p className="text-lg font-bold text-white">
              {fullProfile?.profile?.fullName || 'Candidate Name'}
            </p>
            <p className="text-xs text-indigo-400 font-medium">
              {fullProfile?.profile?.headline || 'Professional Specialist'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {links.filter(l => l.url).length === 0 ? (
              <span className="text-xs text-neutral-600 italic">No social links configured</span>
            ) : (
              links
                .filter(l => l.url)
                .map((link, idx) => {
                  return (
                    <a
                      key={idx}
                      href={link.url.startsWith('http') ? link.url : `https://${link.url}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white hover:border-indigo-500/60 text-xs font-medium transition-all"
                    >
                      {getPlatformIcon(link.platform)}
                      <span>{link.label || link.platform}</span>
                    </a>
                  );
                })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
