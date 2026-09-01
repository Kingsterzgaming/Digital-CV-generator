import React, { useState } from 'react';
import {
  FileDown,
  FileText,
  Layers,
  Sparkles,
  CheckCircle2,
  Download,
  Eye,
  Sliders,
  Check,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { generatePDFResume } from '../../lib/pdfGenerator.ts';

export const PDFResumeGenerator: React.FC = () => {
  const { fullProfile } = useAuth();
  const [selectedStyle, setSelectedStyle] = useState<'modern-clean' | 'executive' | 'minimalist'>('modern-clean');
  const [selectedVersionId, setSelectedVersionId] = useState<string>('default');
  const [includeProjects, setIncludeProjects] = useState<boolean>(true);
  const [includeCerts, setIncludeCerts] = useState<boolean>(true);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  if (!fullProfile) return null;

  const versions = fullProfile.versions || [];
  const selectedVersion = versions.find(v => v.id === selectedVersionId);

  const handleExportPDF = () => {
    setIsGenerating(true);
    try {
      generatePDFResume(fullProfile, {
        template: selectedStyle,
        version: selectedVersion,
      });
    } catch (err) {
      console.error('Failed to generate PDF:', err);
    } finally {
      setTimeout(() => setIsGenerating(false), 500);
    }
  };

  return (
    <div className="max-w-4xl space-y-8">
      <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
        <div>
          <h2 className="text-xl font-bold text-white">ATS-Optimized PDF Resume Generator</h2>
          <p className="text-xs text-neutral-400">
            Generate vector PDF resumes parsed accurately by Applicant Tracking Systems (ATS).
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left: Configuration Controls */}
        <div className="md:col-span-2 space-y-6">
          {/* 1. Target Version */}
          <div className="p-5 rounded-2xl bg-neutral-900/60 border border-neutral-800 space-y-3">
            <label className="block text-xs font-bold text-white uppercase tracking-wider">
              1. Select CV Version Content
            </label>
            <div className="space-y-2">
              <div
                onClick={() => setSelectedVersionId('default')}
                className={`p-3 rounded-xl border cursor-pointer text-xs flex items-center justify-between transition-colors ${
                  selectedVersionId === 'default'
                    ? 'bg-indigo-950/60 border-indigo-500 text-white'
                    : 'bg-neutral-950 border-neutral-800 text-neutral-400'
                }`}
              >
                <div>
                  <span className="font-semibold text-white">Full Standard Profile</span>
                  <p className="text-[11px] text-neutral-400">Includes all database experiences and projects</p>
                </div>
                {selectedVersionId === 'default' && <Check className="w-4 h-4 text-indigo-400" />}
              </div>

              {versions.map(v => (
                <div
                  key={v.id}
                  onClick={() => setSelectedVersionId(v.id)}
                  className={`p-3 rounded-xl border cursor-pointer text-xs flex items-center justify-between transition-colors ${
                    selectedVersionId === v.id
                      ? 'bg-indigo-950/60 border-indigo-500 text-white'
                      : 'bg-neutral-950 border-neutral-800 text-neutral-400'
                  }`}
                >
                  <div>
                    <span className="font-semibold text-white">{v.name}</span>
                    <p className="text-[11px] text-neutral-400">{v.customHeadline || 'Tailored version'}</p>
                  </div>
                  {selectedVersionId === v.id && <Check className="w-4 h-4 text-indigo-400" />}
                </div>
              ))}
            </div>
          </div>

          {/* 2. PDF Formatting Style */}
          <div className="p-5 rounded-2xl bg-neutral-900/60 border border-neutral-800 space-y-3">
            <label className="block text-xs font-bold text-white uppercase tracking-wider">
              2. PDF Typography & Structure
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { id: 'modern-clean', name: 'Modern Clean', desc: 'Helvetica bold headers with navy accents' },
                { id: 'executive', name: 'Executive Classic', desc: 'Times Serif font with traditional rules' },
                { id: 'minimalist', name: 'Tech Minimalist', desc: 'Strict linear layout with concise spacing' },
              ].map(s => (
                <div
                  key={s.id}
                  onClick={() => setSelectedStyle(s.id as any)}
                  className={`p-3.5 rounded-xl border cursor-pointer text-xs space-y-1 transition-colors ${
                    selectedStyle === s.id
                      ? 'bg-indigo-950/60 border-indigo-500 text-white'
                      : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-neutral-700'
                  }`}
                >
                  <span className="font-bold text-white">{s.name}</span>
                  <p className="text-[10px] text-neutral-400 leading-tight">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Summary Card & Action */}
        <div className="space-y-4">
          <div className="p-6 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-4">
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-400" />
              <span>Export Specifications</span>
            </h3>

            <div className="space-y-2 text-xs text-neutral-300">
              <div className="flex justify-between py-1 border-b border-neutral-800">
                <span className="text-neutral-500">Format:</span>
                <span className="font-mono text-white">Standard Letter PDF</span>
              </div>
              <div className="flex justify-between py-1 border-b border-neutral-800">
                <span className="text-neutral-500">ATS Rating:</span>
                <span className="text-emerald-400 font-semibold">100% Text Scannable</span>
              </div>
              <div className="flex justify-between py-1 border-b border-neutral-800">
                <span className="text-neutral-500">Roles:</span>
                <span className="font-mono text-white">{fullProfile.experiences.length} positions</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-neutral-500">Skills:</span>
                <span className="font-mono text-white">{fullProfile.skills.length} keywords</span>
              </div>
            </div>

            <button
              onClick={handleExportPDF}
              disabled={isGenerating}
              className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all hover:scale-[1.02] disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>{isGenerating ? 'Compiling Vector PDF...' : 'Download ATS PDF'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
