import React from 'react';
import {
  Briefcase,
  GraduationCap,
  Award,
  FolderGit2,
  MapPin,
  Mail,
  Calendar,
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

export const ExecutiveSerifTemplate: React.FC<TemplateProps> = ({
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
    <div className="w-full max-w-4xl mx-auto space-y-12 text-stone-200 font-sans">
      {/* Header with Serif Typography */}
      <header className="text-center space-y-3 pb-8 border-b border-stone-800">
        <h1 className="text-4xl sm:text-5xl font-serif tracking-tight text-stone-100 font-normal">
          {profile.fullName}
        </h1>
        <p className="text-lg font-serif italic text-amber-300/90 max-w-2xl mx-auto">
          {headline}
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-stone-400 pt-2 font-mono">
          {profile.location && (
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" />
              {profile.location}
            </span>
          )}
          {profile.email && (
            <span className="flex items-center gap-1">
              <Mail className="w-3.5 h-3.5" />
              {profile.email}
            </span>
          )}
        </div>

        {summary && (
          <p className="mt-4 text-sm sm:text-base text-stone-300 font-serif leading-relaxed max-w-2xl mx-auto text-justify">
            {summary}
          </p>
        )}
      </header>

      {/* Experience */}
      {experiences.length > 0 && (
        <section className="space-y-6">
          <h2 className="text-xs font-serif uppercase tracking-widest text-amber-400 font-bold border-b border-stone-800 pb-2">
            Leadership & Experience
          </h2>
          <div className="space-y-8">
            {experiences.map(exp => (
              <div key={exp.id} className="space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-baseline justify-between">
                  <h3 className="text-lg font-serif font-bold text-stone-100">
                    {exp.role} — <span className="font-normal text-amber-200/90">{exp.company}</span>
                  </h3>
                  <span className="text-xs font-mono text-stone-400">
                    {exp.startDate} – {exp.isCurrent ? 'Present' : exp.endDate}
                  </span>
                </div>
                <p className="text-sm text-stone-300 font-serif leading-relaxed">
                  {exp.description}
                </p>
                {exp.highlights && exp.highlights.length > 0 && (
                  <ul className="list-disc list-inside space-y-1 text-xs text-stone-300 font-serif pl-2">
                    {exp.highlights.map((h, i) => (
                      <li key={i}>{h}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Projects */}
      {projects.length > 0 && (
        <section className="space-y-6">
          <h2 className="text-xs font-serif uppercase tracking-widest text-amber-400 font-bold border-b border-stone-800 pb-2">
            Selected Works & Architecture
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {projects.map(proj => (
              <div
                key={proj.id}
                onClick={() => onProjectClick?.(proj.id)}
                className="p-5 rounded-lg bg-stone-900/40 border border-stone-800/80 space-y-2 cursor-pointer hover:border-amber-500/40 transition-colors"
              >
                <h3 className="font-serif font-bold text-base text-stone-100">{proj.title}</h3>
                <p className="text-xs font-serif text-stone-300 leading-relaxed">{proj.description}</p>
                {proj.technologies && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {proj.technologies.map((t, i) => (
                      <span key={i} className="text-[10px] font-mono px-2 py-0.5 rounded bg-stone-950 text-stone-400 border border-stone-800">
                        {t}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Skills */}
      {skills.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-xs font-serif uppercase tracking-widest text-amber-400 font-bold border-b border-stone-800 pb-2">
            Core Competencies
          </h2>
          <div className="flex flex-wrap gap-2">
            {skills.map(s => (
              <span key={s.id} className="px-3 py-1 rounded bg-stone-900 border border-stone-800 text-xs font-serif text-stone-300">
                {s.name}
              </span>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
