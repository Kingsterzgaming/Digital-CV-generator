import React from 'react';
import { Terminal, Github, ExternalLink, Linkedin } from 'lucide-react';
import type { FullProfileData, CVVersion } from '../../types/index.ts';

interface TemplateProps {
  data: FullProfileData;
  activeVersion?: CVVersion;
  onProjectClick?: (projectId: string) => void;
  onSkillClick?: (skillName: string) => void;
}

export const TechTerminalTemplate: React.FC<TemplateProps> = ({
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
    <div className="w-full max-w-4xl mx-auto rounded-2xl bg-black border border-emerald-500/40 p-6 sm:p-8 font-mono text-emerald-400 shadow-2xl shadow-emerald-950/40 space-y-8">
      {/* Terminal Window Header Bar */}
      <div className="flex items-center justify-between pb-4 border-b border-emerald-900/80 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-rose-500/80" />
          <div className="w-3 h-3 rounded-full bg-amber-500/80" />
          <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
          <span className="ml-2 text-emerald-600">user@{profile.fullName.toLowerCase().replace(/\s+/g, '')}:~/digital_cv</span>
        </div>
        <div className="flex items-center gap-1 text-emerald-600">
          <Terminal className="w-4 h-4" />
          <span>zsh - 80x24</span>
        </div>
      </div>

      {/* Profile Command */}
      <div className="space-y-2">
        <p className="text-emerald-500 text-xs">
          $ <span className="text-emerald-200">whoami && cat profile.json</span>
        </p>
        <div className="pl-4 space-y-1 text-sm">
          <p className="text-white font-bold text-xl sm:text-2xl">{profile.fullName}</p>
          <p className="text-emerald-400 text-sm">» {headline}</p>
          <p className="text-emerald-600 text-xs">email: {profile.email} | loc: {profile.location || 'remote'}</p>
          {summary && <p className="text-emerald-300/90 text-xs pt-2 leading-relaxed">{summary}</p>}
          <div className="flex items-center gap-3 pt-2 text-xs">
            {data.socialLinks.map((link, idx) => (
              <a
                key={idx}
                href={link.url}
                target="_blank"
                rel="noreferrer"
                className="text-emerald-500 hover:text-emerald-200 underline flex items-center gap-1"
              >
                {link.platform === 'github' && <Github className="w-3 h-3" />}
                {link.platform === 'linkedin' && <Linkedin className="w-3 h-3" />}
                {link.label || link.platform}
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Experience Command */}
      {experiences.length > 0 && (
        <div className="space-y-4">
          <p className="text-emerald-500 text-xs">
            $ <span className="text-emerald-200">git log --pretty=format:"%h - %an: %s" --experience</span>
          </p>
          <div className="space-y-4 pl-4 border-l border-emerald-900/60">
            {experiences.map(exp => (
              <div key={exp.id} className="space-y-1.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs">
                  <span className="text-white font-bold">{exp.role} @ {exp.company}</span>
                  <span className="text-emerald-600">{exp.startDate}..{exp.isCurrent ? 'HEAD' : exp.endDate}</span>
                </div>
                <p className="text-xs text-emerald-300/80 whitespace-pre-line">{exp.description}</p>
                {exp.highlights && exp.highlights.length > 0 && (
                  <ul className="space-y-1 text-xs text-emerald-400/90 pl-2">
                    {exp.highlights.map((h, i) => (
                      <li key={i}>* {h}</li>
                    ))}
                  </ul>
                )}
                {exp.technologies && (
                  <p className="text-[11px] text-emerald-500 font-mono">
                    deps: [{exp.technologies.join(', ')}]
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Projects Command */}
      {projects.length > 0 && (
        <div className="space-y-4">
          <p className="text-emerald-500 text-xs">
            $ <span className="text-emerald-200">ls -la ./projects/</span>
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-4">
            {projects.map(p => (
              <div
                key={p.id}
                onClick={() => onProjectClick?.(p.id)}
                className="p-3 rounded bg-emerald-950/20 border border-emerald-900/80 space-y-1.5 cursor-pointer hover:border-emerald-500/60 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">./{p.title.toLowerCase().replace(/\s+/g, '-')}</span>
                  <div className="flex items-center gap-1">
                    {p.githubUrl && <a href={p.githubUrl} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()}><Github className="w-3.5 h-3.5 text-emerald-500 hover:text-white" /></a>}
                    {p.liveUrl && <a href={p.liveUrl} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()}><ExternalLink className="w-3.5 h-3.5 text-emerald-500 hover:text-white" /></a>}
                  </div>
                </div>
                <p className="text-[11px] text-emerald-300/80 line-clamp-3">{p.description}</p>
                <div className="text-[10px] text-emerald-500">
                  {p.technologies?.join(' • ')}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Skills Command */}
      {skills.length > 0 && (
        <div className="space-y-2">
          <p className="text-emerald-500 text-xs">
            $ <span className="text-emerald-200">env | grep SKILLS</span>
          </p>
          <div className="pl-4 flex flex-wrap gap-1.5">
            {skills.map(s => (
              <span
                key={s.id}
                onClick={() => onSkillClick?.(s.name)}
                className={`text-[11px] px-2 py-0.5 rounded border cursor-pointer ${
                  s.highlighted
                    ? 'bg-emerald-900/60 border-emerald-400 text-white font-bold'
                    : 'bg-emerald-950/40 border-emerald-800/80 text-emerald-300'
                }`}
              >
                {s.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Education Command */}
      {data.education && data.education.length > 0 && (
        <div className="space-y-2">
          <p className="text-emerald-500 text-xs">
            $ <span className="text-emerald-200">cat education.txt</span>
          </p>
          <div className="pl-4 space-y-2">
            {data.education.map(edu => (
              <div key={edu.id} className="text-xs space-y-0.5">
                <span className="text-white font-bold">{edu.degree} {edu.fieldOfStudy && `in ${edu.fieldOfStudy}`}</span>
                <p className="text-emerald-500">{edu.institution} ({edu.startDate} - {edu.endDate}) {edu.gpa && `GPA: ${edu.gpa}`}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Certifications & Achievements Command */}
      {((data.certifications && data.certifications.length > 0) || (data.achievements && data.achievements.length > 0)) && (
        <div className="space-y-2">
          <p className="text-emerald-500 text-xs">
            $ <span className="text-emerald-200">cat certs_and_awards.json</span>
          </p>
          <div className="pl-4 space-y-2 text-xs">
            {data.certifications?.map(c => (
              <p key={c.id} className="text-emerald-300">
                [CERT] <span className="text-white font-bold">{c.name}</span> — {c.issuer} ({c.issueDate})
              </p>
            ))}
            {data.achievements?.map(a => (
              <p key={a.id} className="text-emerald-300">
                [AWARD] <span className="text-white font-bold">{a.title}</span>: {a.description}
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
