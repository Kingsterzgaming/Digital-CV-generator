import React, { useState } from 'react';
import {
  RefreshCw,
  X,
  Upload,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Plus,
  ArrowRight,
  Loader2,
  Check,
  Sparkles,
  Layers,
  Briefcase,
  GraduationCap,
  Wrench,
  FolderGit2,
  Award,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { api } from '../../lib/api.ts';
import type { ExtractedCVData } from '../../types/index.ts';

interface CVReimportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CVReimportModal: React.FC<CVReimportModalProps> = ({ isOpen, onClose }) => {
  const { fullProfile, setLocalFullProfile } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState<boolean>(false);
  const [extractedData, setExtractedData] = useState<ExtractedCVData | null>(null);
  const [uploadResult, setUploadResult] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'replace' | 'merge'>('replace');
  const [selectedNewExperiences, setSelectedNewExperiences] = useState<string[]>([]);
  const [selectedNewSkills, setSelectedNewSkills] = useState<string[]>([]);
  const [isCommitting, setIsCommitting] = useState<boolean>(false);
  const [commitSuccess, setCommitSuccess] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string>('');

  if (!isOpen || !fullProfile) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (!uploadedFile) return;
    setFile(uploadedFile);
    setIsParsing(true);
    setCommitSuccess(false);

    try {
      const res = await api.uploadCV(uploadedFile);
      setUploadResult(res);
      setExtractedData(res.extractedData);

      // Auto-select skills not currently in DB for merge mode
      const existingSkillNames = new Set(fullProfile.skills.map(s => s.name.toLowerCase()));
      const newSkills = (res.extractedData.skills || []).filter((s: any) => !existingSkillNames.has(s.name.toLowerCase()));
      setSelectedNewSkills(newSkills.map((s: any) => s.name));

      // Auto-select experiences not currently in DB for merge mode
      const existingCompanies = new Set(fullProfile.experiences.map(e => e.company.toLowerCase()));
      const newExps = (res.extractedData.experiences || []).filter((e: any) => !existingCompanies.has(e.company.toLowerCase()));
      setSelectedNewExperiences(newExps.map((_, idx) => `exp_${idx}`));
    } catch (err: any) {
      alert(`CV parsing failed: ${err.message}`);
    } finally {
      setIsParsing(false);
    }
  };

  // Option 1: Complete Rewrite and Overwrite with Fresh CV Data
  const handleFullRewrite = async () => {
    if (!extractedData) return;
    setIsCommitting(true);

    try {
      const res = await api.commitExtractedCV({
        profile: extractedData.profile,
        experiences: extractedData.experiences || [],
        education: extractedData.education || [],
        skills: extractedData.skills || [],
        projects: extractedData.projects || [],
        certifications: extractedData.certifications || [],
        achievements: extractedData.achievements || [],
        publications: extractedData.publications || [],
        socialLinks: extractedData.socialLinks || [],
        originalCvFileName: uploadResult?.originalFileName,
        originalCvFileUrl: uploadResult?.originalFileUrl,
      });

      setLocalFullProfile(res.fullProfile);
      setCommitSuccess(true);
      setSuccessMessage('Your entire profile has been completely rewritten and updated from your new CV!');
    } catch (err: any) {
      alert(`Rewrite failed: ${err.message}`);
    } finally {
      setIsCommitting(false);
    }
  };

  // Option 2: Selective Merge
  const handleSelectiveMerge = async () => {
    if (!extractedData) return;
    setIsCommitting(true);

    try {
      // 1. Save selected new experiences
      const existingCompanies = new Set(fullProfile.experiences.map(e => e.company.toLowerCase()));
      const newExps = (extractedData.experiences || []).filter((e, idx) =>
        selectedNewExperiences.includes(`exp_${idx}`) || !existingCompanies.has(e.company.toLowerCase())
      );

      for (const exp of newExps) {
        await api.saveExperience({
          company: exp.company,
          role: exp.role,
          location: exp.location,
          startDate: exp.startDate,
          endDate: exp.endDate,
          isCurrent: exp.isCurrent,
          description: exp.description,
          highlights: exp.highlights,
          technologies: exp.technologies,
        });
      }

      // 2. Save selected new skills
      const existingSkillNames = new Set(fullProfile.skills.map(s => s.name.toLowerCase()));
      const skillsToSave = (extractedData.skills || []).filter(s =>
        selectedNewSkills.includes(s.name) && !existingSkillNames.has(s.name.toLowerCase())
      );

      for (const skill of skillsToSave) {
        await api.saveSkill({
          name: skill.name,
          category: skill.category as any,
          proficiency: skill.proficiency as any,
        });
      }

      // 3. Refresh profile data
      const refreshed = await api.getMyProfile();
      setLocalFullProfile(refreshed);
      setCommitSuccess(true);
      setSuccessMessage('Selected entries were successfully merged into your database!');
    } catch (err: any) {
      console.error('Merge failed:', err);
      alert(`Merge failed: ${err.message}`);
    } finally {
      setIsCommitting(false);
    }
  };

  const existingCompanyNames = new Set(fullProfile.experiences.map(e => e.company.toLowerCase()));
  const existingSkillNames = new Set(fullProfile.skills.map(s => s.name.toLowerCase()));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="w-full max-w-2xl bg-neutral-900 border border-neutral-800 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-600/30">
              <Upload className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">Upload & Update CV Document</h3>
              <p className="text-[11px] text-neutral-400">
                Extract all details from your latest CV and replace or merge your profile
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {!extractedData ? (
          <div className="space-y-4">
            <label className="border-2 border-dashed border-neutral-700 hover:border-indigo-500 rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer transition-colors text-center block bg-neutral-950/40 group">
              <div className="w-12 h-12 rounded-2xl bg-neutral-900 group-hover:bg-indigo-950/60 border border-neutral-700 group-hover:border-indigo-500/50 flex items-center justify-center mb-3 transition-colors">
                <Upload className="w-5 h-5 text-neutral-400 group-hover:text-indigo-400 transition-colors" />
              </div>
              <span className="text-sm font-bold text-white">Upload Your Latest CV / Resume</span>
              <span className="text-xs text-neutral-400 mt-1">Supports PDF, DOCX, Word, or plain text files</span>
              <span className="text-[11px] text-indigo-400 mt-2 font-medium">Automatic extraction of all jobs, degrees, skills, and projects</span>
              <input
                type="file"
                accept=".pdf,.docx,.doc,.txt"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>

            {isParsing && (
              <div className="flex flex-col items-center justify-center gap-2 py-6 text-center">
                <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
                <p className="text-xs font-semibold text-white">Extracting and reading all sections from your CV...</p>
                <p className="text-[11px] text-neutral-500">Parsing experience history, skills, education, and contact details</p>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-5">
            {/* Mode Switcher */}
            <div className="flex rounded-xl bg-neutral-950 p-1 border border-neutral-800">
              <button
                type="button"
                onClick={() => setActiveTab('replace')}
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === 'replace'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Full Rewrite (Recommended)</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('merge')}
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === 'merge'
                    ? 'bg-neutral-800 text-white'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Selective Merge</span>
              </button>
            </div>

            {/* Extracted Overview Cards */}
            <div className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-white">
                    {extractedData.profile.fullName || 'Candidate Profile'}
                  </h4>
                  <p className="text-[11px] text-indigo-400 font-medium">
                    {extractedData.profile.headline || 'Professional'}
                  </p>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-neutral-400">
                  {extractedData.profile.email && <span>{extractedData.profile.email}</span>}
                </div>
              </div>

              {/* Counts Badge Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-neutral-900">
                <div className="p-2.5 rounded-xl bg-neutral-900/80 border border-neutral-800 flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-indigo-400 shrink-0" />
                  <div>
                    <p className="text-[10px] text-neutral-400">Experience</p>
                    <p className="text-xs font-bold text-white">{extractedData.experiences?.length || 0} roles</p>
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-neutral-900/80 border border-neutral-800 flex items-center gap-2">
                  <Wrench className="w-4 h-4 text-sky-400 shrink-0" />
                  <div>
                    <p className="text-[10px] text-neutral-400">Skills</p>
                    <p className="text-xs font-bold text-white">{extractedData.skills?.length || 0} skills</p>
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-neutral-900/80 border border-neutral-800 flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-emerald-400 shrink-0" />
                  <div>
                    <p className="text-[10px] text-neutral-400">Education</p>
                    <p className="text-xs font-bold text-white">{extractedData.education?.length || 0} degrees</p>
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-neutral-900/80 border border-neutral-800 flex items-center gap-2">
                  <FolderGit2 className="w-4 h-4 text-amber-400 shrink-0" />
                  <div>
                    <p className="text-[10px] text-neutral-400">Projects</p>
                    <p className="text-xs font-bold text-white">{extractedData.projects?.length || 0} projects</p>
                  </div>
                </div>
              </div>

              {/* Mode Specific Body */}
              {activeTab === 'replace' ? (
                <div className="p-3.5 rounded-xl bg-indigo-950/30 border border-indigo-500/20 text-xs space-y-1.5">
                  <p className="font-semibold text-indigo-200 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Complete Profile Replacement</span>
                  </p>
                  <p className="text-[11px] text-neutral-400">
                    Clicking "Rewrite & Replace Entire Profile" will overwrite your previous profile with all {extractedData.experiences?.length || 0} experience roles, {extractedData.skills?.length || 0} skills, and details extracted from your new CV.
                  </p>
                </div>
              ) : (
                <div className="space-y-3 pt-2">
                  {/* Experiences List */}
                  <div className="space-y-2">
                    <span className="text-xs font-semibold text-neutral-300">Select Experiences to Merge:</span>
                    <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                      {extractedData.experiences?.map((exp, idx) => {
                        const isNew = !existingCompanyNames.has(exp.company.toLowerCase());
                        const isChecked = selectedNewExperiences.includes(`exp_${idx}`);
                        return (
                          <div
                            key={idx}
                            onClick={() => {
                              if (isChecked) {
                                setSelectedNewExperiences(prev => prev.filter(id => id !== `exp_${idx}`));
                              } else {
                                setSelectedNewExperiences(prev => [...prev, `exp_${idx}`]);
                              }
                            }}
                            className={`p-2.5 rounded-xl border text-xs flex items-center justify-between cursor-pointer transition-colors ${
                              isNew
                                ? isChecked ? 'bg-emerald-950/40 border-emerald-700 text-white' : 'bg-neutral-900 border-neutral-800 text-neutral-400'
                                : 'bg-neutral-900/40 border-neutral-800/60 text-neutral-500'
                            }`}
                          >
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-2">
                                <span className="font-bold">{exp.role} @ {exp.company}</span>
                                {isNew && (
                                  <span className="px-1.5 py-0.2 rounded text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-800 font-semibold">
                                    New
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] text-neutral-400">{exp.startDate} – {exp.endDate}</span>
                            </div>

                            {isNew && (
                              <div className={`w-4 h-4 rounded flex items-center justify-center ${isChecked ? 'bg-emerald-600 text-white' : 'border border-neutral-700'}`}>
                                {isChecked && <Check className="w-3 h-3" />}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Skills List */}
                  <div className="space-y-1.5 pt-2 border-t border-neutral-900">
                    <span className="text-xs font-semibold text-neutral-300">Select New Skills to Merge:</span>
                    <div className="flex flex-wrap gap-1 max-h-28 overflow-y-auto">
                      {extractedData.skills?.map((s, idx) => {
                        const isNew = !existingSkillNames.has(s.name.toLowerCase());
                        const isSelected = selectedNewSkills.includes(s.name);
                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              if (isSelected) {
                                setSelectedNewSkills(prev => prev.filter(name => name !== s.name));
                              } else {
                                setSelectedNewSkills(prev => [...prev, s.name]);
                              }
                            }}
                            className={`px-2 py-0.5 rounded-lg text-xs font-medium border transition-colors ${
                              isSelected
                                ? 'bg-emerald-950 border-emerald-700 text-emerald-300'
                                : 'bg-neutral-900 border-neutral-800 text-neutral-400'
                            } ${!isNew ? 'opacity-50' : ''}`}
                          >
                            + {s.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-neutral-800">
              <button
                type="button"
                onClick={() => setExtractedData(null)}
                className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-medium transition-colors"
              >
                Upload Different File
              </button>

              {commitSuccess ? (
                <div className="flex items-center gap-3">
                  <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" />
                    {successMessage || 'Updated Successfully!'}
                  </span>
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md transition-colors"
                  >
                    Close & View Profile
                  </button>
                </div>
              ) : activeTab === 'replace' ? (
                <button
                  type="button"
                  onClick={handleFullRewrite}
                  disabled={isCommitting}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-indigo-600/30 disabled:opacity-50 transition-all"
                >
                  {isCommitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  <span>Rewrite & Replace Entire Profile</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSelectiveMerge}
                  disabled={isCommitting}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-emerald-600/30 disabled:opacity-50 transition-all"
                >
                  {isCommitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                  <span>Merge Selected Records</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

