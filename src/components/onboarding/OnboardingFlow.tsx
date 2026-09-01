import React, { useState } from 'react';
import {
  UploadCloud,
  FileText,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  ArrowRight,
  ArrowLeft,
  Briefcase,
  GraduationCap,
  Wrench,
  FolderGit2,
  Award,
  BookOpen,
  Link2,
  Edit3,
  Loader2,
} from 'lucide-react';
import { api } from '../../lib/api.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import confetti from 'canvas-confetti';

interface OnboardingFlowProps {
  onComplete: () => void;
}

type OnboardingStep = 'upload' | 'parsing' | 'review' | 'saving';

export const OnboardingFlow: React.FC<OnboardingFlowProps> = ({ onComplete }) => {
  const { user, refreshProfile } = useAuth();
  const [step, setStep] = useState<OnboardingStep>('upload');
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parseProgress, setParseProgress] = useState<string>('Initializing document parser...');
  const [parsePercent, setParsePercent] = useState<number>(10);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Extracted and editable data state
  const [extractedData, setExtractedData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'profile' | 'experience' | 'skills' | 'projects' | 'education' | 'other'>('profile');
  const [originalFileName, setOriginalFileName] = useState<string>('');
  const [originalFileUrl, setOriginalFileUrl] = useState<string>('');

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = async (file: File) => {
    const validExts = ['.pdf', '.docx', '.doc', '.txt'];
    const hasValidExt = validExts.some(ext => file.name.toLowerCase().endsWith(ext));
    if (!hasValidExt) {
      setErrorMessage('Please upload a PDF or DOCX format document.');
      return;
    }

    setErrorMessage(null);
    setSelectedFile(file);
    setStep('parsing');
    setParsePercent(25);
    setParseProgress('Reading document buffer and binary streams...');

    try {
      setTimeout(() => {
        setParsePercent(50);
        setParseProgress('Extracting raw text and identifying CV sections...');
      }, 700);

      setTimeout(() => {
        setParsePercent(75);
        setParseProgress('Structuring work history, technical skills, and projects...');
      }, 1500);

      const result = await api.uploadCV(file);

      setParsePercent(100);
      setParseProgress('Extraction complete! Loading verification review...');
      setOriginalFileName(result.originalFileName);
      setOriginalFileUrl(result.originalFileUrl);
      setExtractedData(result.extractedData);

      setTimeout(() => {
        setStep('review');
      }, 600);
    } catch (err: any) {
      console.error('Extraction failed:', err);
      setErrorMessage(err.message || 'Failed to process document. Please check the file format or create manually.');
      setStep('upload');
    }
  };

  const handleStartBlank = () => {
    setErrorMessage(null);
    setOriginalFileName('');
    setOriginalFileUrl('');
    setExtractedData({
      profile: {
        fullName: user?.name || 'Prateek Chauhan',
        headline: '',
        summary: '',
        email: user?.email || 'prateekchauhan948@gmail.com',
        phone: '',
        location: '',
      },
      experiences: [],
      education: [],
      skills: [],
      projects: [],
      certifications: [],
      achievements: [],
      publications: [],
      socialLinks: [
        { platform: 'github', label: 'GitHub', url: '' },
        { platform: 'linkedin', label: 'LinkedIn', url: '' },
      ],
    });
    setStep('review');
  };

  // Commit reviewed data to PostgreSQL database as official source of truth
  const handleConfirmAndSave = async () => {
    try {
      setStep('saving');
      await api.commitExtractedCV({
        profile: {
          ...extractedData.profile,
          email: extractedData.profile.email || user?.email || '',
        },
        experiences: extractedData.experiences,
        education: extractedData.education,
        skills: extractedData.skills,
        projects: extractedData.projects,
        certifications: extractedData.certifications,
        achievements: extractedData.achievements,
        publications: extractedData.publications,
        socialLinks: extractedData.socialLinks,
        originalCvFileName: originalFileName,
        originalCvFileUrl: originalFileUrl,
      });

      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });

      await refreshProfile();
      onComplete();
    } catch (err: any) {
      setErrorMessage(`Failed to save profile: ${err.message}`);
      setStep('review');
    }
  };

  // State manipulation helpers during review
  const updateProfileField = (field: string, val: string) => {
    setExtractedData({
      ...extractedData,
      profile: { ...extractedData.profile, [field]: val },
    });
  };

  const updateExperience = (index: number, field: string, val: any) => {
    const updated = [...extractedData.experiences];
    updated[index] = { ...updated[index], [field]: val };
    setExtractedData({ ...extractedData, experiences: updated });
  };

  const addExperience = () => {
    const newExp = {
      company: 'New Organization',
      role: 'Role Title',
      location: '',
      type: 'full-time',
      startDate: '2023-01',
      endDate: 'Present',
      isCurrent: true,
      description: 'Key accomplishments and responsibilities...',
      highlights: [],
      technologies: [],
    };
    setExtractedData({ ...extractedData, experiences: [newExp, ...extractedData.experiences] });
  };

  const removeExperience = (index: number) => {
    const updated = extractedData.experiences.filter((_: any, i: number) => i !== index);
    setExtractedData({ ...extractedData, experiences: updated });
  };

  const updateSkill = (index: number, field: string, val: any) => {
    const updated = [...extractedData.skills];
    updated[index] = { ...updated[index], [field]: val };
    setExtractedData({ ...extractedData, skills: updated });
  };

  const addSkill = () => {
    const newSkill = { name: 'New Skill', category: 'technical', proficiency: 'advanced', highlighted: true };
    setExtractedData({ ...extractedData, skills: [...extractedData.skills, newSkill] });
  };

  const removeSkill = (index: number) => {
    const updated = extractedData.skills.filter((_: any, i: number) => i !== index);
    setExtractedData({ ...extractedData, skills: updated });
  };

  const updateProject = (index: number, field: string, val: any) => {
    const updated = [...extractedData.projects];
    updated[index] = { ...updated[index], [field]: val };
    setExtractedData({ ...extractedData, projects: updated });
  };

  const addProject = () => {
    const newProj = {
      title: 'New Project Showcase',
      tagline: 'Short description of the system or application',
      description: 'Comprehensive project architecture, problem solved, and technical outcomes.',
      technologies: ['TypeScript', 'React', 'Node.js'],
      githubUrl: '',
      liveUrl: '',
      featured: true,
    };
    setExtractedData({ ...extractedData, projects: [newProj, ...extractedData.projects] });
  };

  const removeProject = (index: number) => {
    const updated = extractedData.projects.filter((_: any, i: number) => i !== index);
    setExtractedData({ ...extractedData, projects: updated });
  };

  return (
    <div id="onboarding-container" className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8">
      {/* Top Brand Header */}
      <div className="w-full max-w-5xl mb-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center shadow-lg shadow-indigo-500/20 font-bold text-white tracking-wider">
            DC
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">DigitalCV</h1>
            <p className="text-xs text-neutral-400">CV-to-Interactive-Portfolio Platform</p>
          </div>
        </div>
        <div className="text-right">
          <span className="text-xs px-3 py-1 rounded-full bg-neutral-900 border border-neutral-800 text-neutral-300">
            {step === 'upload' && 'Step 1 of 3: Upload Source CV'}
            {step === 'parsing' && 'Step 2 of 3: AI Document Processing'}
            {step === 'review' && 'Step 3 of 3: Structured Data Verification'}
            {step === 'saving' && 'Committing to Database...'}
          </span>
        </div>
      </div>

      {/* Main Card */}
      <div className="w-full max-w-5xl bg-neutral-900/90 border border-neutral-800/80 rounded-2xl p-6 sm:p-8 lg:p-10 shadow-2xl backdrop-blur-xl">
        {errorMessage && (
          <div className="mb-6 p-4 rounded-xl bg-rose-950/40 border border-rose-800/60 text-rose-300 flex items-center gap-3 text-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* STEP 1: UPLOAD */}
        {step === 'upload' && (
          <div className="space-y-8">
            <div className="text-center max-w-2xl mx-auto space-y-3">
              <h2 className="text-3xl font-extrabold text-white tracking-tight">
                Transform your CV into an interactive digital portfolio
              </h2>
              <p className="text-neutral-400 text-base leading-relaxed">
                Upload your existing resume (PDF or DOCX). Our parser will extract your experience, projects, skills, and education into a normalized database profile you can review and customize.
              </p>
            </div>

            {/* Drag and Drop Zone */}
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className={`relative border-2 border-dashed rounded-2xl p-10 text-center transition-all cursor-pointer ${
                dragActive
                  ? 'border-indigo-500 bg-indigo-500/10 scale-[1.01]'
                  : 'border-neutral-700/80 hover:border-neutral-500 bg-neutral-950/40'
              }`}
            >
              <input
                type="file"
                id="cv-file-input"
                accept=".pdf,.docx,.doc,.txt"
                onChange={handleFileInput}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="flex flex-col items-center justify-center space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center shadow-inner">
                  <UploadCloud className="w-8 h-8" />
                </div>
                <div>
                  <p className="text-base font-semibold text-white">
                    Click to browse or drop your CV file here
                  </p>
                  <p className="text-xs text-neutral-400 mt-1">
                    Supports PDF, Word (DOCX/DOC), and Text documents (Max 15MB)
                  </p>
                </div>
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md transition-colors">
                  <FileText className="w-4 h-4" />
                  Select Document
                </div>
              </div>
            </div>

            {/* Or create manually */}
            <div className="pt-4 border-t border-neutral-800/80 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold text-neutral-300">
                  Don't have a CV file ready right now?
                </p>
                <p className="text-xs text-neutral-500 mt-0.5">
                  You can start with a clean blank profile and fill out your experience, skills, and projects manually.
                </p>
              </div>
              <button
                type="button"
                onClick={handleStartBlank}
                className="px-4 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-neutral-200 hover:text-white text-xs font-semibold transition-all flex items-center gap-2 whitespace-nowrap shadow-sm"
              >
                <Edit3 className="w-3.5 h-3.5 text-indigo-400" />
                <span>Start with Blank Profile</span>
              </button>
            </div>

            {/* Process Guarantees */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 text-xs text-neutral-400">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Zero fabrication — strictly extracts verified facts</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>PostgreSQL database source of truth</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Full user editing & confirmation before publish</span>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: PARSING LOADER */}
        {step === 'parsing' && (
          <div className="py-16 text-center space-y-6 max-w-md mx-auto">
            <div className="relative w-20 h-20 mx-auto">
              <div className="absolute inset-0 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin" />
              <div className="absolute inset-2 rounded-full bg-neutral-950 flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-indigo-400 animate-pulse" />
              </div>
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Analyzing CV Structure</h3>
              <p className="text-sm text-neutral-400 mt-2">{parseProgress}</p>
            </div>
            {/* Progress bar */}
            <div className="w-full bg-neutral-800 rounded-full h-2 overflow-hidden">
              <div
                className="bg-gradient-to-r from-indigo-500 to-emerald-500 h-full transition-all duration-300 ease-out"
                style={{ width: `${parsePercent}%` }}
              />
            </div>
            <p className="text-xs text-neutral-400">
              Normalizing experience history, skills taxonomy, and project links...
            </p>
          </div>
        )}

        {/* STEP 3: REVIEW & EDIT EXTRACTED DATA */}
        {step === 'review' && extractedData && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-800">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-bold text-white">Review & Confirm Extracted Profile</h2>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-950/60 border border-emerald-800/80 text-emerald-300 text-xs font-semibold">
                    {extractedData.confidenceScore}% Extraction Match
                  </span>
                </div>
                <p className="text-xs text-neutral-400 mt-1">
                  Source: <span className="text-neutral-200">{originalFileName}</span>. Review all fields below. You can add, edit, or remove items before saving.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setStep('upload')}
                  className="px-3.5 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-medium transition-colors flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Re-upload
                </button>
                <button
                  onClick={handleConfirmAndSave}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-2 hover:scale-[1.02]"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Confirm & Save to Database
                </button>
              </div>
            </div>

            {/* Navigation Tabs for Review */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-neutral-800 text-xs">
              {[
                { id: 'profile', label: 'Personal & Bio', icon: Edit3 },
                { id: 'experience', label: `Experience (${extractedData.experiences?.length || 0})`, icon: Briefcase },
                { id: 'skills', label: `Skills (${extractedData.skills?.length || 0})`, icon: Wrench },
                { id: 'projects', label: `Projects (${extractedData.projects?.length || 0})`, icon: FolderGit2 },
                { id: 'education', label: `Education (${extractedData.education?.length || 0})`, icon: GraduationCap },
                { id: 'other', label: 'Certs & Links', icon: Award },
              ].map(tab => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`px-3.5 py-2 rounded-lg font-semibold flex items-center gap-2 whitespace-nowrap transition-all ${
                      isActive
                        ? 'bg-indigo-600 text-white shadow-md'
                        : 'bg-neutral-950/60 text-neutral-400 hover:text-white hover:bg-neutral-800'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* TAB CONTENT */}
            <div className="min-h-[380px]">
              {/* TAB 1: PERSONAL & BIO */}
              {activeTab === 'profile' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-300 mb-1">Full Name</label>
                    <input
                      type="text"
                      value={extractedData.profile.fullName}
                      onChange={e => updateProfileField('fullName', e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-white text-sm focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-neutral-300 mb-1">Professional Headline</label>
                    <input
                      type="text"
                      value={extractedData.profile.headline}
                      onChange={e => updateProfileField('headline', e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-white text-sm focus:border-indigo-500 focus:outline-none"
                      placeholder="e.g. Senior Full Stack Engineer"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-neutral-300 mb-1">Email Address</label>
                    <input
                      type="email"
                      value={extractedData.profile.email}
                      onChange={e => updateProfileField('email', e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-white text-sm focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-neutral-300 mb-1">Phone Number</label>
                    <input
                      type="text"
                      value={extractedData.profile.phone || ''}
                      onChange={e => updateProfileField('phone', e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-white text-sm focus:border-indigo-500 focus:outline-none"
                      placeholder="+1 (555) 000-0000"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-neutral-300 mb-1">Location</label>
                    <input
                      type="text"
                      value={extractedData.profile.location || ''}
                      onChange={e => updateProfileField('location', e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-white text-sm focus:border-indigo-500 focus:outline-none"
                      placeholder="City, State / Country"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-neutral-300 mb-1">Professional Summary</label>
                    <textarea
                      rows={4}
                      value={extractedData.profile.summary}
                      onChange={e => updateProfileField('summary', e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-white text-sm focus:border-indigo-500 focus:outline-none resize-y"
                      placeholder="Brief overview of background and core strengths..."
                    />
                  </div>
                </div>
              )}

              {/* TAB 2: EXPERIENCE */}
              {activeTab === 'experience' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-neutral-400">
                      Work experience & internships extracted from your CV:
                    </span>
                    <button
                      onClick={addExperience}
                      className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-medium flex items-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add Position
                    </button>
                  </div>

                  {extractedData.experiences.length === 0 && (
                    <div className="text-center py-10 text-neutral-400 text-sm">
                      No experience items detected in document. Click "Add Position" above to add one.
                    </div>
                  )}

                  {extractedData.experiences.map((exp: any, idx: number) => (
                    <div key={idx} className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-indigo-400 uppercase">Position #{idx + 1}</span>
                        <button
                          onClick={() => removeExperience(idx)}
                          className="text-neutral-500 hover:text-rose-400 text-xs flex items-center gap-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Remove
                        </button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-[11px] text-neutral-400 mb-1">Company</label>
                          <input
                            type="text"
                            value={exp.company}
                            onChange={e => updateExperience(idx, 'company', e.target.value)}
                            className="w-full px-3 py-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-white text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] text-neutral-400 mb-1">Role Title</label>
                          <input
                            type="text"
                            value={exp.role}
                            onChange={e => updateExperience(idx, 'role', e.target.value)}
                            className="w-full px-3 py-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-white text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] text-neutral-400 mb-1">Dates</label>
                          <input
                            type="text"
                            value={`${exp.startDate} - ${exp.endDate || (exp.isCurrent ? 'Present' : '')}`}
                            onChange={e => updateExperience(idx, 'startDate', e.target.value)}
                            className="w-full px-3 py-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-white text-xs"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[11px] text-neutral-400 mb-1">Description & Highlights</label>
                        <textarea
                          rows={2}
                          value={exp.description}
                          onChange={e => updateExperience(idx, 'description', e.target.value)}
                          className="w-full px-3 py-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-white text-xs resize-y"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* TAB 3: SKILLS */}
              {activeTab === 'skills' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-neutral-400">
                      Verified skills categorized from document:
                    </span>
                    <button
                      onClick={addSkill}
                      className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-medium flex items-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add Skill
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                    {extractedData.skills.map((skill: any, idx: number) => (
                      <div key={idx} className="p-2.5 rounded-xl bg-neutral-950 border border-neutral-800 flex items-center justify-between gap-2">
                        <input
                          type="text"
                          value={skill.name}
                          onChange={e => updateSkill(idx, 'name', e.target.value)}
                          className="px-2 py-1 rounded bg-neutral-900 border border-neutral-800 text-xs text-white flex-1 font-medium"
                        />
                        <select
                          value={skill.category || 'technical'}
                          onChange={e => updateSkill(idx, 'category', e.target.value)}
                          className="px-1.5 py-1 rounded bg-neutral-900 border border-neutral-800 text-[11px] text-neutral-300"
                        >
                          <option value="technical">Technical</option>
                          <option value="languages">Language</option>
                          <option value="frameworks">Framework</option>
                          <option value="tools">Tool</option>
                          <option value="soft">Soft Skill</option>
                        </select>
                        <button
                          onClick={() => removeSkill(idx)}
                          className="text-neutral-500 hover:text-rose-400 p-1"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 4: PROJECTS */}
              {activeTab === 'projects' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-neutral-400">
                      Projects and portfolio repositories extracted from CV:
                    </span>
                    <button
                      onClick={addProject}
                      className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-medium flex items-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add Project
                    </button>
                  </div>

                  {extractedData.projects.map((proj: any, idx: number) => (
                    <div key={idx} className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-indigo-400">Project #{idx + 1}</span>
                        <button
                          onClick={() => removeProject(idx)}
                          className="text-neutral-500 hover:text-rose-400 text-xs flex items-center gap-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Remove
                        </button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] text-neutral-400 mb-1">Project Title</label>
                          <input
                            type="text"
                            value={proj.title}
                            onChange={e => updateProject(idx, 'title', e.target.value)}
                            className="w-full px-3 py-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-white text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] text-neutral-400 mb-1">GitHub / Live URL</label>
                          <input
                            type="text"
                            value={proj.githubUrl || proj.liveUrl || ''}
                            onChange={e => updateProject(idx, 'githubUrl', e.target.value)}
                            className="w-full px-3 py-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-white text-xs"
                            placeholder="https://github.com/..."
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[11px] text-neutral-400 mb-1">Description</label>
                        <textarea
                          rows={2}
                          value={proj.description}
                          onChange={e => updateProject(idx, 'description', e.target.value)}
                          className="w-full px-3 py-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-white text-xs resize-y"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* TAB 5: EDUCATION */}
              {activeTab === 'education' && (
                <div className="space-y-4">
                  {extractedData.education.map((edu: any, idx: number) => (
                    <div key={idx} className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] text-neutral-400 mb-1">Institution</label>
                          <input
                            type="text"
                            value={edu.institution}
                            onChange={e => {
                              const updated = [...extractedData.education];
                              updated[idx].institution = e.target.value;
                              setExtractedData({ ...extractedData, education: updated });
                            }}
                            className="w-full px-3 py-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-white text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] text-neutral-400 mb-1">Degree & Field</label>
                          <input
                            type="text"
                            value={`${edu.degree} in ${edu.fieldOfStudy || ''}`}
                            onChange={e => {
                              const updated = [...extractedData.education];
                              updated[idx].degree = e.target.value;
                              setExtractedData({ ...extractedData, education: updated });
                            }}
                            className="w-full px-3 py-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-white text-xs"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* TAB 6: CERTS & SOCIAL */}
              {activeTab === 'other' && (
                <div className="space-y-4">
                  <div>
                    <h4 className="text-xs font-semibold text-neutral-300 uppercase mb-2">Certifications</h4>
                    <div className="space-y-2">
                      {(extractedData.certifications || []).map((c: any, idx: number) => (
                        <div key={idx} className="p-3 rounded-lg bg-neutral-950 border border-neutral-800 text-xs flex justify-between">
                          <span className="font-medium text-white">{c.name}</span>
                          <span className="text-neutral-400">{c.issuer}</span>
                        </div>
                      ))}
                      {extractedData.certifications?.length === 0 && (
                        <p className="text-xs text-neutral-500 italic">No certifications in source CV.</p>
                      )}
                    </div>
                  </div>

                  <div className="pt-2">
                    <h4 className="text-xs font-semibold text-neutral-300 uppercase mb-2">Social & External Links</h4>
                    <div className="space-y-2">
                      {(extractedData.socialLinks || []).map((s: any, idx: number) => (
                        <div key={idx} className="p-3 rounded-lg bg-neutral-950 border border-neutral-800 text-xs flex items-center justify-between">
                          <span className="font-medium text-indigo-400 capitalize">{s.platform}</span>
                          <span className="text-neutral-300">{s.url}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center justify-between pt-6 border-t border-neutral-800">
              <div className="text-xs text-neutral-400 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Extracted data will become your PostgreSQL database source of truth.</span>
              </div>
              <button
                onClick={handleConfirmAndSave}
                className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold shadow-xl shadow-indigo-600/30 transition-all flex items-center gap-2 hover:scale-[1.02]"
              >
                <span>Confirm & Generate Digital CV</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: SAVING TO DATABASE */}
        {step === 'saving' && (
          <div className="py-20 text-center space-y-4">
            <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mx-auto" />
            <h3 className="text-xl font-bold text-white">Saving Profile to Database</h3>
            <p className="text-sm text-neutral-400 max-w-sm mx-auto">
              Creating normalized records for work experiences, skills matrix, projects, and digital CV versions...
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
