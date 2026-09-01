import React from 'react';
import { Briefcase, FolderGit2, Wrench, GraduationCap, MapPin, Mail, ExternalLink } from 'lucide-react';
import type { FullProfileData, CVVersion } from '../../types/index.ts';

interface TemplateProps {
  data: FullProfileData;
  activeVersion?: CVVersion;
  onProjectClick?: (projectId: string) => void;
  onSkillClick?: (skillName: string) => void;
}

export const MinimalistLineTemplate: React.FC<TemplateProps> = ({
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
    <div className="w-full max-w-3xl mx-auto space-y-10 text-neutral-300 font-sans tracking-wide">
      <header className="space-y-3 pb-6 border-b border-neutral-800">
        <h1 className="text-3xl sm:text-4xl font-light text-white tracking-wider">{profile.fullName}</h1>
        <p className="text-sm uppercase tracking-widest text-neutral-400 font-mono">{headline}</p>
        <div className="flex gap-4 text-xs text-neutral-400 font-mono">
          {profile.location && <span>{profile.location}</span>}
          {profile.email && <span>{profile.email}</span>}
        </div>
        {summary && <p className="text-xs sm:text-sm text-neutral-300 font-light leading-relaxed pt-2">{summary}</p>}
      </header>

      {experiences.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-xs uppercase tracking-widest text-neutral-400 font-mono">Experience</h2>
          <div className="space-y-6">
            {experiences.map(e => (
              <div key={e.id} className="space-y-1">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-white font-medium">{e.role} — {e.company}</span>
                  <span className="text-neutral-400">{e.startDate} – {e.isCurrent ? 'Now' : e.endDate}</span>
                </div>
                <p className="text-xs text-neutral-300 font-light leading-relaxed">{e.description}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {projects.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-xs uppercase tracking-widest text-neutral-400 font-mono">Works</h2>
          <div className="space-y-3">
            {projects.map(p => (
              <div
                key={p.id}
                onClick={() => onProjectClick?.(p.id)}
                className="p-3 border-b border-neutral-900 cursor-pointer hover:bg-neutral-900/40 transition-colors"
              >
                <div className="flex justify-between items-center text-xs">
                  <span className="text-white font-medium">{p.title}</span>
                  <span className="text-neutral-400 font-mono">{p.technologies?.slice(0, 3).join(', ')}</span>
                </div>
                <p className="text-xs text-neutral-400 font-light mt-1">{p.description}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {skills.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-xs uppercase tracking-widest text-neutral-400 font-mono">Keywords</h2>
          <p className="text-xs text-neutral-400 font-mono leading-relaxed">
            {skills.map(s => s.name).join('  /  ')}
          </p>
        </section>
      )}
    </div>
  );
};
