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
  BookOpen,
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
    <div className="w-full max-w-5xl mx-auto space-y-4 text-neutral-200">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

          <div className="flex flex-wrap items-center justify-between gap-4 text-xs text-neutral-400 pt-2 border-t border-neutral-800">
            <div className="flex flex-wrap items-center gap-4">
              {profile.location && <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {profile.location}</span>}
              {profile.email && <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5" /> {profile.email}</span>}
            </div>
            <div className="flex items-center gap-2">
              {data.socialLinks.map((link, idx) => (
                <a
                  key={idx}
                  href={link.url}
                  target="_blank"
                  rel="noreferrer"
                  className="p-2 rounded-xl bg-neutral-950 border border-neutral-800 hover:text-white"
                >
                  {link.platform === 'github' && <Github className="w-3.5 h-3.5" />}
                  {link.platform === 'linkedin' && <Linkedin className="w-3.5 h-3.5" />}
                  {link.platform !== 'github' && link.platform !== 'linkedin' && <ExternalLink className="w-3.5 h-3.5" />}
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* 2. Skills Bento Box (Col span 1) */}
        <div className="p-6 rounded-3xl bg-neutral-900/80 border border-neutral-800 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-400 mb-3">
              <Wrench className="w-4 h-4" />
              <span>Tech Stack ({skills.length})</span>
            </div>
            <div className="flex flex-wrap gap-1.5 max-h-64 overflow-y-auto pr-1">
              {skills.map(s => (
                <span
                  key={s.id}
                  onClick={() => onSkillClick?.(s.name)}
                  className={`text-xs px-2.5 py-1 rounded-lg border cursor-pointer transition-colors ${
                    s.highlighted
                      ? 'bg-indigo-950/80 border-indigo-700 text-indigo-200'
                      : 'bg-neutral-950 border-neutral-800 text-neutral-200 hover:border-neutral-700'
                  }`}
                >
                  {s.name}
                </span>
              ))}
            </div>
          </div>
          <span className="text-[11px] text-neutral-400">Total skills: {skills.length}</span>
        </div>

        {/* 3. Experience Timeline (Col span 2) */}
        {experiences.length > 0 && (
          <div className="md:col-span-2 p-6 sm:p-8 rounded-3xl bg-neutral-900/80 border border-neutral-800 space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-400">
              <Briefcase className="w-4 h-4" />
              <span>Experience History ({experiences.length})</span>
            </div>
            <div className="space-y-4">
              {experiences.map(e => (
                <div key={e.id} className="p-4 rounded-2xl bg-neutral-950/60 border border-neutral-800/80 space-y-2">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1">
                    <span className="font-bold text-sm text-white">{e.role}</span>
                    <span className="text-xs text-neutral-400 font-mono">{e.startDate} – {e.isCurrent ? 'Present' : e.endDate}</span>
                  </div>
                  <p className="text-xs text-indigo-400 font-medium">{e.company} {e.location && `• ${e.location}`}</p>
                  <p className="text-xs text-neutral-300 leading-relaxed whitespace-pre-line">{e.description}</p>
                  {e.highlights && e.highlights.length > 0 && (
                    <ul className="space-y-1 text-xs text-neutral-400 pt-1">
                      {e.highlights.map((h, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <span className="text-indigo-400">•</span>
                          <span>{h}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                  {e.technologies && e.technologies.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {e.technologies.map((t, i) => (
                        <span key={i} className="text-[10px] px-2 py-0.5 rounded bg-neutral-900 text-neutral-300 border border-neutral-800">
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 4. Featured Projects (Col span 1) */}
        {projects.length > 0 && (
          <div className="p-6 rounded-3xl bg-neutral-900/80 border border-neutral-800 space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-400">
              <FolderGit2 className="w-4 h-4" />
              <span>Projects & Work ({projects.length})</span>
            </div>
            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
              {projects.map(p => (
                <div
                  key={p.id}
                  onClick={() => onProjectClick?.(p.id)}
                  className="p-4 rounded-2xl bg-neutral-950/60 border border-neutral-800 cursor-pointer hover:border-indigo-500/50 transition-colors space-y-2"
                >
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-white">{p.title}</span>
                    <div className="flex items-center gap-1.5">
                      {p.githubUrl && <a href={p.githubUrl} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()}><Github className="w-3.5 h-3.5 text-neutral-400 hover:text-white" /></a>}
                      {p.liveUrl && <a href={p.liveUrl} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()}><ExternalLink className="w-3.5 h-3.5 text-neutral-400 hover:text-white" /></a>}
                    </div>
                  </div>
                  <p className="text-xs text-neutral-400 leading-relaxed">{p.description}</p>
                  {p.technologies && p.technologies.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {p.technologies.map((t, i) => (
                        <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-900 text-indigo-300 border border-neutral-800">
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 5. Education & Certifications (Col span 3) */}
        {(data.education.length > 0 || data.certifications.length > 0) && (
          <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.education.length > 0 && (
              <div className="p-6 rounded-3xl bg-neutral-900/80 border border-neutral-800 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-400">
                  <GraduationCap className="w-4 h-4" />
                  <span>Education</span>
                </div>
                <div className="space-y-2">
                  {data.education.map(edu => (
                    <div key={edu.id} className="p-3 rounded-xl bg-neutral-950 border border-neutral-800/80 space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-xs text-white">{edu.degree} {edu.fieldOfStudy && `in ${edu.fieldOfStudy}`}</span>
                        <span className="text-[11px] text-neutral-400">{edu.startDate} – {edu.endDate}</span>
                      </div>
                      <p className="text-xs text-indigo-400">{edu.institution}</p>
                      {edu.gpa && <p className="text-[11px] text-neutral-400">GPA: {edu.gpa}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {data.certifications.length > 0 && (
              <div className="p-6 rounded-3xl bg-neutral-900/80 border border-neutral-800 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-400">
                  <Award className="w-4 h-4" />
                  <span>Certifications</span>
                </div>
                <div className="space-y-2">
                  {data.certifications.map(c => (
                    <div key={c.id} className="p-3 rounded-xl bg-neutral-950 border border-neutral-800/80 space-y-1">
                      <span className="font-bold text-xs text-white block">{c.name}</span>
                      <p className="text-xs text-indigo-400">{c.issuer} • {c.issueDate}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 6. Achievements & Publications */}
        {((data.achievements && data.achievements.length > 0) || (data.publications && data.publications.length > 0)) && (
          <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.achievements && data.achievements.length > 0 && (
              <div className="p-6 rounded-3xl bg-neutral-900/80 border border-neutral-800 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-400">
                  <Sparkles className="w-4 h-4" />
                  <span>Honors & Achievements</span>
                </div>
                <div className="space-y-2">
                  {data.achievements.map(ach => (
                    <div key={ach.id} className="p-3 rounded-xl bg-neutral-950 border border-neutral-800/80 space-y-1">
                      <span className="font-bold text-xs text-white block">{ach.title}</span>
                      <p className="text-xs text-neutral-300">{ach.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {data.publications && data.publications.length > 0 && (
              <div className="p-6 rounded-3xl bg-neutral-900/80 border border-neutral-800 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-400">
                  <BookOpen className="w-4 h-4" />
                  <span>Publications & Research</span>
                </div>
                <div className="space-y-2">
                  {data.publications.map(pub => (
                    <div key={pub.id} className="p-3 rounded-xl bg-neutral-950 border border-neutral-800/80 space-y-1">
                      <span className="font-bold text-xs text-white block">{pub.title}</span>
                      <p className="text-xs text-indigo-400">{pub.publisher} {pub.date && `• ${pub.date}`}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
