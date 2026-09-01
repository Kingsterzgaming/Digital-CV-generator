import React from 'react';
import {
  Briefcase,
  FolderGit2,
  Wrench,
  GraduationCap,
  Award,
  Sparkles,
  MapPin,
  Mail,
  ExternalLink,
  Github,
  Linkedin,
} from 'lucide-react';
import type { FullProfileData, CVVersion } from '../../types/index.ts';

interface TemplateProps {
  data: FullProfileData;
  activeVersion?: CVVersion;
  onProjectClick?: (projectId: string) => void;
  onSkillClick?: (skillName: string) => void;
}

export const BentoGridTemplate: React.FC<TemplateProps> = ({
  data,
  activeVersion,
  onProjectClick,
}) => {
  const { profile } = data;
  const headline = activeVersion?.customHeadline || profile.headline;
  const summary = activeVersion?.customSummary || profile.summary;

  let experiences = data.experiences;
  let projects = data.projects;
  let skills = data.skills;

  if (activeVersion) {
    if (activeVersion.selectedExperienceIds?.length) {
      experiences = data.experiences.filter(e => activeVersion.selectedExperienceIds.includes(e.id));
    }
    if (activeVersion.selectedProjectIds?.length) {
      projects = data.projects.filter(p => activeVersion.selectedProjectIds.includes(p.id));
    }
  }

  return (
    <div className="w-full max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-4 text-neutral-200">
      {/* 1. Large Hero Bento Box (Col span 2) */}
      <div className="md:col-span-2 p-6 sm:p-8 rounded-3xl bg-neutral-900/80 border border-neutral-800 flex flex-col justify-between space-y-4">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-950/60 border border-indigo-800/80 text-indigo-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Interactive Portfolio</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">{profile.fullName}</h1>
          <p className="text-base text-indigo-400 font-medium">{headline}</p>
          {summary && <p className="text-xs sm:text-sm text-neutral-300 pt-2 leading-relaxed">{summary}</p>}
        </div>

        <div className="flex flex-wrap items-center gap-4 text-xs text-neutral-400 pt-2 border-t border-neutral-800">
          {profile.location && <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {profile.location}</span>}
          {profile.email && <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5" /> {profile.email}</span>}
        </div>
      </div>

      {/* 2. Skills Bento Box (Col span 1) */}
      <div className="p-6 rounded-3xl bg-neutral-900/80 border border-neutral-800 flex flex-col justify-between space-y-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-400 mb-3">
            <Wrench className="w-4 h-4" />
            <span>Tech Stack</span>
          </div>
          <div className="flex flex-wrap gap-1.5 max-h-52 overflow-y-auto pr-1">
            {skills.slice(0, 16).map(s => (
              <span key={s.id} className="text-xs px-2.5 py-1 rounded-lg bg-neutral-950 border border-neutral-800 text-neutral-200">
                {s.name}
              </span>
            ))}
          </div>
        </div>
        <span className="text-[11px] text-neutral-400">Total skills: {skills.length}</span>
      </div>

      {/* 3. Experience Timeline (Col span 2) */}
      <div className="md:col-span-2 p-6 sm:p-8 rounded-3xl bg-neutral-900/80 border border-neutral-800 space-y-4">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-400">
          <Briefcase className="w-4 h-4" />
          <span>Experience History</span>
        </div>
        <div className="space-y-4">
          {experiences.slice(0, 4).map(e => (
            <div key={e.id} className="p-4 rounded-2xl bg-neutral-950/60 border border-neutral-800/80 space-y-1">
              <div className="flex justify-between items-start">
                <span className="font-bold text-sm text-white">{e.role}</span>
                <span className="text-xs text-neutral-400 font-mono">{e.startDate} – {e.isCurrent ? 'Present' : e.endDate}</span>
              </div>
              <p className="text-xs text-indigo-400">{e.company}</p>
              <p className="text-xs text-neutral-300 line-clamp-2 pt-1">{e.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Featured Projects (Col span 1) */}
      <div className="p-6 rounded-3xl bg-neutral-900/80 border border-neutral-800 space-y-4">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-400">
          <FolderGit2 className="w-4 h-4" />
          <span>Top Projects</span>
        </div>
        <div className="space-y-3">
          {projects.slice(0, 3).map(p => (
            <div
              key={p.id}
              onClick={() => onProjectClick?.(p.id)}
              className="p-3.5 rounded-2xl bg-neutral-950/60 border border-neutral-800 cursor-pointer hover:border-indigo-500/50 transition-colors space-y-1"
            >
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-white">{p.title}</span>
                {p.githubUrl && <Github className="w-3.5 h-3.5 text-neutral-400" />}
              </div>
              <p className="text-[11px] text-neutral-400 line-clamp-2">{p.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
