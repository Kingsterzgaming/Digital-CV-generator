import React from 'react';
import {
  Briefcase,
  GraduationCap,
  Wrench,
  FolderGit2,
  Award,
  BookOpen,
  ExternalLink,
  Github,
  Linkedin,
  Mail,
  MapPin,
  Calendar,
  Sparkles,
} from 'lucide-react';
import type { FullProfileData, CVVersion } from '../../types/index.ts';

interface TemplateProps {
  data: FullProfileData;
  activeVersion?: CVVersion;
  onProjectClick?: (projectId: string) => void;
  onSkillClick?: (skillName: string) => void;
}

export const ModernCleanTemplate: React.FC<TemplateProps> = ({
  data,
  activeVersion,
  onProjectClick,
  onSkillClick,
}) => {
  const { profile, templateConfig } = data;
  const headline = activeVersion?.customHeadline || profile.headline;
  const summary = activeVersion?.customSummary || profile.summary;

  // Filter items by version
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

  const primaryColor = templateConfig?.primaryColor || '#6366f1';
  const isDarkMode = templateConfig?.themeMode !== 'light';

  return (
    <div className={`w-full max-w-4xl mx-auto space-y-12 ${isDarkMode ? 'text-neutral-200' : 'text-neutral-800'}`}>
      {/* Hero / Header */}
      <section className="relative pt-6 pb-8 border-b border-neutral-800/80">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight font-cabinet text-white">
              {profile.fullName}
            </h1>
            <p className="text-xl font-medium text-indigo-400">
              {headline}
            </p>
            <div className="flex flex-wrap items-center gap-4 text-xs text-neutral-400 pt-1">
              {profile.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-neutral-400" />
                  {profile.location}
                </span>
              )}
              {profile.email && (
                <span className="flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-neutral-400" />
                  {profile.email}
                </span>
              )}
            </div>
          </div>

          {/* Social Links */}
          <div className="flex items-center gap-2">
            {data.socialLinks.map((link, idx) => (
              <a
                key={idx}
                href={link.url}
                target="_blank"
                rel="noreferrer"
                className="p-2.5 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-indigo-500/60 hover:text-indigo-400 transition-all text-neutral-400 hover:scale-105"
                title={link.label}
              >
                {link.platform === 'github' && <Github className="w-4 h-4" />}
                {link.platform === 'linkedin' && <Linkedin className="w-4 h-4" />}
                {link.platform !== 'github' && link.platform !== 'linkedin' && <ExternalLink className="w-4 h-4" />}
              </a>
            ))}
          </div>
        </div>

        {summary && (
          <p className="mt-6 text-sm sm:text-base text-neutral-300 leading-relaxed max-w-3xl">
            {summary}
          </p>
        )}
      </section>

      {/* Experience Section */}
      {experiences.length > 0 && (
        <section className="space-y-6">
          <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-indigo-400">
            <Briefcase className="w-4 h-4" />
            <span>Work Experience</span>
          </div>

          <div className="space-y-8 pl-2 border-l border-neutral-800">
            {experiences.map(exp => (
              <div key={exp.id} className="relative pl-6 group">
                {/* Timeline dot */}
                <div className="absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full bg-indigo-500 ring-4 ring-neutral-950" />

                <div className="space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <h3 className="text-lg font-bold text-white group-hover:text-indigo-300 transition-colors">
                      {exp.role}
                    </h3>
                    <span className="text-xs font-mono text-neutral-400 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {exp.startDate} — {exp.isCurrent ? 'Present' : exp.endDate}
                    </span>
                  </div>

                  <div className="text-xs font-semibold text-neutral-400">
                    <span className="text-indigo-400">{exp.company}</span>
                    {exp.location && ` • ${exp.location}`}
                    {exp.type === 'internship' && <span className="ml-2 px-2 py-0.5 rounded bg-indigo-950/60 text-indigo-300 border border-indigo-800">Internship</span>}
                  </div>

                  <p className="text-sm text-neutral-300 leading-relaxed whitespace-pre-line">
                    {exp.description}
                  </p>

                  {exp.highlights && exp.highlights.length > 0 && (
                    <ul className="space-y-1.5 pt-1 text-xs text-neutral-300">
                      {exp.highlights.map((h, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-indigo-400 mt-0.5">•</span>
                          <span>{h}</span>
                        </li>
                      ))}
                    </ul>
                  )}

                  {exp.technologies && exp.technologies.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-2">
                      {exp.technologies.map((tech, i) => (
                        <span
                          key={i}
                          onClick={() => onSkillClick?.(tech)}
                          className="px-2.5 py-0.5 rounded-md bg-neutral-900 border border-neutral-800 text-[11px] text-neutral-300 hover:border-indigo-500 hover:text-indigo-300 transition-colors cursor-pointer"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Featured Projects */}
      {projects.length > 0 && (
        <section className="space-y-6">
          <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-indigo-400">
            <FolderGit2 className="w-4 h-4" />
            <span>Featured Projects & Systems</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {projects.map(proj => (
              <div
                key={proj.id}
                onClick={() => onProjectClick?.(proj.id)}
                className="p-5 rounded-2xl bg-neutral-900/60 border border-neutral-800/80 hover:border-indigo-500/60 transition-all hover:scale-[1.01] group space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-base text-white group-hover:text-indigo-300 transition-colors">
                      {proj.title}
                    </h3>
                    {proj.tagline && (
                      <p className="text-xs text-neutral-400 mt-0.5">{proj.tagline}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {proj.githubUrl && (
                      <a
                        href={proj.githubUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 rounded-lg bg-neutral-800 text-neutral-400 hover:text-white"
                        onClick={e => e.stopPropagation()}
                      >
                        <Github className="w-3.5 h-3.5" />
                      </a>
                    )}
                    {proj.liveUrl && (
                      <a
                        href={proj.liveUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 rounded-lg bg-neutral-800 text-neutral-400 hover:text-white"
                        onClick={e => e.stopPropagation()}
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                </div>

                <p className="text-xs text-neutral-300 leading-relaxed line-clamp-3">
                  {proj.description}
                </p>

                {proj.technologies && proj.technologies.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {proj.technologies.map((tech, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded bg-neutral-950 border border-neutral-800 text-[10px] font-mono text-indigo-300"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Skills Matrix */}
      {skills.length > 0 && (
        <section className="space-y-6">
          <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-indigo-400">
            <Wrench className="w-4 h-4" />
            <span>Technical Skills & Proficiency</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {['technical', 'languages', 'frameworks', 'tools', 'soft'].map(category => {
              const catSkills = skills.filter(s => (s.category || 'technical') === category);
              if (catSkills.length === 0) return null;
              return (
                <div key={category} className="p-4 rounded-xl bg-neutral-900/50 border border-neutral-800/60 space-y-2">
                  <h4 className="text-xs font-bold uppercase text-neutral-400">{category}</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {catSkills.map(skill => (
                      <span
                        key={skill.id}
                        onClick={() => onSkillClick?.(skill.name)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium cursor-pointer transition-all ${
                          skill.highlighted
                            ? 'bg-indigo-950/80 border border-indigo-700/80 text-indigo-200'
                            : 'bg-neutral-950 border border-neutral-800 text-neutral-300 hover:border-neutral-600'
                        }`}
                      >
                        {skill.name}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Education & Credentials */}
      {(data.education.length > 0 || data.certifications.length > 0) && (
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
          {data.education.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-indigo-400">
                <GraduationCap className="w-4 h-4" />
                <span>Education</span>
              </div>
              <div className="space-y-3">
                {data.education.map(edu => (
                  <div key={edu.id} className="p-4 rounded-xl bg-neutral-900/40 border border-neutral-800 space-y-1">
                    <h4 className="font-bold text-sm text-white">
                      {edu.degree} {edu.fieldOfStudy && `in ${edu.fieldOfStudy}`}
                    </h4>
                    <p className="text-xs text-indigo-400 font-medium">{edu.institution}</p>
                    <p className="text-[11px] text-neutral-400">
                      {edu.startDate} — {edu.endDate || (edu.isCurrent ? 'Present' : '')}
                      {edu.gpa && ` • GPA: ${edu.gpa}`}
                      {edu.honors && ` • ${edu.honors}`}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {data.certifications.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-indigo-400">
                <Award className="w-4 h-4" />
                <span>Certifications</span>
              </div>
              <div className="space-y-3">
                {data.certifications.map(c => (
                  <div key={c.id} className="p-4 rounded-xl bg-neutral-900/40 border border-neutral-800 space-y-1">
                    <h4 className="font-bold text-sm text-white">{c.name}</h4>
                    <p className="text-xs text-indigo-400 font-medium">{c.issuer}</p>
                    <p className="text-[11px] text-neutral-400">Issued: {c.issueDate}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  );
};
