import React from 'react';
import { Briefcase, FolderGit2, Wrench, GraduationCap, MapPin, Mail, ExternalLink, Award, Sparkles, BookOpen } from 'lucide-react';
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
  onSkillClick,
}) => {
  const { profile } = data;
  const headline = activeVersion?.customHeadline || profile.headline;
  const summary = activeVersion?.customSummary || profile.summary;

  let experiences = data.experiences || [];
  let projects = data.projects || [];
  let skills = data.skills || [];

  if (activeVersion && activeVersion.slug !== 'general' && !activeVersion.isDefault) {
    if (activeVersion.selectedExperienceIds?.length) {
      const filtered = data.experiences.filter(e => activeVersion.selectedExperienceIds.includes(e.id));
      if (filtered.length > 0) experiences = filtered;
    }
    if (activeVersion.selectedProjectIds?.length) {
      const filtered = data.projects.filter(p => activeVersion.selectedProjectIds.includes(p.id));
      if (filtered.length > 0) projects = filtered;
    }
  }

  return (
    <div className="w-full max-w-3xl mx-auto space-y-10 text-neutral-300 font-sans tracking-wide">
      <header className="space-y-3 pb-6 border-b border-neutral-800">
        <h1 className="text-3xl sm:text-4xl font-light text-white tracking-wider">{profile.fullName}</h1>
        <p className="text-sm uppercase tracking-widest text-neutral-400 font-mono">{headline}</p>
        <div className="flex flex-wrap gap-4 text-xs text-neutral-400 font-mono">
          {profile.location && <span>{profile.location}</span>}
          {profile.email && <span>{profile.email}</span>}
          {data.socialLinks.map((s, idx) => (
            <a key={idx} href={s.url} target="_blank" rel="noreferrer" className="underline hover:text-white">
              {s.label || s.platform}
            </a>
          ))}
        </div>
        {summary && <p className="text-xs sm:text-sm text-neutral-300 font-light leading-relaxed pt-2">{summary}</p>}
      </header>

      {experiences.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-xs uppercase tracking-widest text-neutral-400 font-mono">Experience</h2>
          <div className="space-y-6">
            {experiences.map(e => (
              <div key={e.id} className="space-y-1.5">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-white font-medium">{e.role} — {e.company}</span>
                  <span className="text-neutral-400">{e.startDate} – {e.isCurrent ? 'Now' : e.endDate}</span>
                </div>
                <p className="text-xs text-neutral-300 font-light leading-relaxed whitespace-pre-line">{e.description}</p>
                {e.highlights && e.highlights.length > 0 && (
                  <ul className="space-y-1 text-xs text-neutral-400 font-light pl-2">
                    {e.highlights.map((h, i) => (
                      <li key={i}>— {h}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {projects.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-xs uppercase tracking-widest text-neutral-400 font-mono">Works & Systems</h2>
          <div className="space-y-3">
            {projects.map(p => (
              <div
                key={p.id}
                onClick={() => onProjectClick?.(p.id)}
                className="p-3 border-b border-neutral-900 cursor-pointer hover:bg-neutral-900/40 transition-colors space-y-1"
              >
                <div className="flex justify-between items-center text-xs">
                  <span className="text-white font-medium">{p.title}</span>
                  <span className="text-neutral-400 font-mono">{p.technologies?.join(', ')}</span>
                </div>
                <p className="text-xs text-neutral-400 font-light">{p.description}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {skills.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-xs uppercase tracking-widest text-neutral-400 font-mono">Keywords & Stack</h2>
          <div className="flex flex-wrap gap-2 pt-1">
            {skills.map(s => (
              <span
                key={s.id}
                onClick={() => onSkillClick?.(s.name)}
                className="text-xs text-neutral-400 font-mono cursor-pointer hover:text-white"
              >
                {s.name} /
              </span>
            ))}
          </div>
        </section>
      )}

      {data.education && data.education.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-xs uppercase tracking-widest text-neutral-400 font-mono">Education</h2>
          <div className="space-y-3">
            {data.education.map(edu => (
              <div key={edu.id} className="text-xs font-mono">
                <span className="text-white font-medium">{edu.degree} {edu.fieldOfStudy && `in ${edu.fieldOfStudy}`}</span>
                <p className="text-neutral-400">{edu.institution} ({edu.startDate} – {edu.endDate}) {edu.gpa && `• GPA: ${edu.gpa}`}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {((data.certifications && data.certifications.length > 0) || (data.achievements && data.achievements.length > 0)) && (
        <section className="space-y-3">
          <h2 className="text-xs uppercase tracking-widest text-neutral-400 font-mono">Credentials & Honors</h2>
          <div className="space-y-2 text-xs font-mono text-neutral-400">
            {data.certifications?.map(c => (
              <p key={c.id}>• {c.name} — {c.issuer} ({c.issueDate})</p>
            ))}
            {data.achievements?.map(a => (
              <p key={a.id}>• {a.title}: {a.description}</p>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
