import React, { useState } from 'react';
import {
  Palette,
  Check,
  Eye,
  Sliders,
  Type,
  LayoutGrid,
  Code2,
  BookOpen,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { api } from '../../lib/api.ts';
import type { TemplateType, TemplateConfig } from '../../types/index.ts';

interface TemplateCustomizerProps {
  onOpenPreview: () => void;
}

export const TemplateCustomizer: React.FC<TemplateCustomizerProps> = ({ onOpenPreview }) => {
  const { fullProfile, setLocalFullProfile } = useAuth();
  const [isSaving, setIsSaving] = useState<boolean>(false);

  if (!fullProfile) return null;

  const currentConfig: TemplateConfig = fullProfile.profile.templateConfig || {
    type: 'modern-clean',
    theme: 'dark',
    accentColor: '#6366f1',
    fontFamily: 'sans',
    showGithubStats: true,
    showVisitorCounter: true,
    enableRecruiterChat: true,
    layoutSpacing: 'normal',
  };

  const templates: {
    id: TemplateType;
    name: string;
    description: string;
    recommendedFor: string;
    previewBadge: string;
  }[] = [
    {
      id: 'modern-clean',
      name: 'Modern Clean',
      description: 'Sleek dark canvas with high-contrast typography, interactive role cards, and clean accent highlights.',
      recommendedFor: 'Full-Stack Developers, Product Engineers & Tech Leads',
      previewBadge: 'Most Popular',
    },
    {
      id: 'executive',
      name: 'Executive Serif',
      description: 'Prestigious editorial layout with warm gold accents, refined typography, and formal leadership structure.',
      recommendedFor: 'Staff / Principal Engineers, VPs of Eng & Founders',
      previewBadge: 'Leadership',
    },
    {
      id: 'terminal',
      name: 'Tech Terminal',
      description: 'Retro hacker aesthetic with CRT scanlines, neon emerald prompts, and an interactive CLI command line.',
      recommendedFor: 'Systems Programmers, DevOps, Kernel & Security Engineers',
      previewBadge: 'Geek / CLI',
    },
    {
      id: 'bento',
      name: 'Bento Grid',
      description: 'Modular high-density grid cards showcasing metrics, live project links, and skills simultaneously.',
      recommendedFor: 'Engineers with high project volume, Designers & Multi-disciplinary roles',
      previewBadge: 'Modular',
    },
    {
      id: 'minimalist',
      name: 'Minimalist Line',
      description: 'Strict typography and subtle hairline rules with generous negative space.',
      recommendedFor: 'Architects & Minimalist Purists',
      previewBadge: 'Ultra Clean',
    },
  ];

  const handleSelectTemplate = async (templateId: TemplateType) => {
    setIsSaving(true);
    try {
      const updatedConfig: TemplateConfig = {
        ...currentConfig,
        type: templateId,
      };
      const updatedProfile = await api.updateProfile({ templateConfig: updatedConfig });
      setLocalFullProfile(prev => prev ? { ...prev, profile: updatedProfile } : null);
    } catch (err) {
      console.error('Failed to change template:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleOption = async (key: keyof TemplateConfig) => {
    try {
      const updatedConfig: TemplateConfig = {
        ...currentConfig,
        [key]: !currentConfig[key],
      };
      const updatedProfile = await api.updateProfile({ templateConfig: updatedConfig });
      setLocalFullProfile(prev => prev ? { ...prev, profile: updatedProfile } : null);
    } catch (err) {
      console.error('Failed to update config:', err);
    }
  };

  return (
    <div className="max-w-4xl space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-neutral-800">
        <div>
          <h2 className="text-xl font-bold text-white">Design & Portfolio Templates</h2>
          <p className="text-xs text-neutral-400">
            Switch template layouts instantly without altering your confirmed database records.
          </p>
        </div>
        <button
          onClick={onOpenPreview}
          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/30 flex items-center gap-1.5"
        >
          <Eye className="w-3.5 h-3.5" />
          <span>Preview Current Template</span>
        </button>
      </div>

      {/* Template Selection Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {templates.map(t => {
          const isSelected = currentConfig.type === t.id;
          return (
            <div
              key={t.id}
              onClick={() => handleSelectTemplate(t.id)}
              className={`p-5 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between space-y-4 ${
                isSelected
                  ? 'bg-indigo-950/40 border-indigo-500 shadow-xl shadow-indigo-500/10'
                  : 'bg-neutral-900/60 border-neutral-800 hover:border-neutral-700'
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-base text-white">{t.name}</h3>
                    <span className="px-2 py-0.5 rounded text-[10px] bg-neutral-950 border border-neutral-800 text-neutral-400 font-medium">
                      {t.previewBadge}
                    </span>
                  </div>
                  {isSelected && (
                    <span className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center text-white">
                      <Check className="w-3.5 h-3.5" />
                    </span>
                  )}
                </div>
                <p className="text-xs text-neutral-300 leading-relaxed">{t.description}</p>
              </div>

              <div className="pt-3 border-t border-neutral-800/80 flex items-center justify-between text-xs">
                <span className="text-[11px] text-indigo-400 font-medium">{t.recommendedFor}</span>
                <span className="text-neutral-400 font-semibold">{isSelected ? 'Active' : 'Select'}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Interactive Options Configuration */}
      <div className="p-6 rounded-2xl bg-neutral-900/50 border border-neutral-800 space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Sliders className="w-4 h-4 text-indigo-400" />
          <span>Interactive Template Features</span>
        </h3>

        <div className="space-y-3">
          {[
            {
              key: 'enableRecruiterChat',
              label: 'Enable Grounded Recruiter AI Assistant Widget',
              desc: 'Allows visiting recruiters to ask conversational questions verified directly against your database facts.',
            },
            {
              key: 'showGithubStats',
              label: 'Show GitHub Repository Stats & Topics',
              desc: 'Displays stars, languages, and direct repository links for projects.',
            },
            {
              key: 'showVisitorCounter',
              label: 'Display Professional Footer Provenance',
              desc: 'Adds database synchronization indicator to assure recruiters of fact accuracy.',
            },
          ].map(opt => {
            const isEnabled = !!currentConfig[opt.key as keyof TemplateConfig];
            return (
              <div
                key={opt.key}
                onClick={() => handleToggleOption(opt.key as keyof TemplateConfig)}
                className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800/80 flex items-center justify-between gap-4 cursor-pointer hover:border-neutral-700 transition-colors"
              >
                <div className="space-y-0.5">
                  <p className="text-xs font-semibold text-white">{opt.label}</p>
                  <p className="text-[11px] text-neutral-400">{opt.desc}</p>
                </div>
                <div className={`w-10 h-6 rounded-full p-1 transition-colors flex-shrink-0 ${isEnabled ? 'bg-indigo-600' : 'bg-neutral-800'}`}>
                  <div className={`w-4 h-4 rounded-full bg-white transition-transform ${isEnabled ? 'translate-x-4' : 'translate-x-0'}`} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
