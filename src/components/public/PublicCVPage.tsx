import React, { useState, useEffect } from 'react';
import {
  FileDown,
  Share2,
  Eye,
  SlidersHorizontal,
  ChevronDown,
  Layers,
  ArrowLeft,
  Mail,
  Copy,
  Check,
} from 'lucide-react';
import { api } from '../../lib/api.ts';
import type { FullProfileData, CVVersion, TemplateType } from '../../types/index.ts';
import { ModernCleanTemplate } from '../templates/ModernCleanTemplate.tsx';
import { ExecutiveSerifTemplate } from '../templates/ExecutiveSerifTemplate.tsx';
import { TechTerminalTemplate } from '../templates/TechTerminalTemplate.tsx';
import { BentoGridTemplate } from '../templates/BentoGridTemplate.tsx';
import { MinimalistLineTemplate } from '../templates/MinimalistLineTemplate.tsx';
import { QRShareModal } from './QRShareModal.tsx';
import { generatePDFResume } from '../../lib/pdfGenerator.ts';

interface PublicCVPageProps {
  username: string;
  initialVersionSlug?: string;
  onBackToDashboard?: () => void;
  previewMode?: boolean;
}

export const PublicCVPage: React.FC<PublicCVPageProps> = ({
  username,
  initialVersionSlug,
  onBackToDashboard,
  previewMode = false,
}) => {
  const [profileData, setProfileData] = useState<FullProfileData | null>(null);
  const [activeVersionSlug, setActiveVersionSlug] = useState<string>(initialVersionSlug || 'general');
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateType>('modern-clean');
  const [showQRModal, setShowQRModal] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showContactModal, setShowContactModal] = useState<boolean>(false);

  useEffect(() => {
    loadPublicProfile();
  }, [username, activeVersionSlug]);

  const loadPublicProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getPublicProfile(username, activeVersionSlug);
      setProfileData(res.fullProfile);
      if (res.fullProfile.profile.templateConfig?.templateId) {
        setSelectedTemplate(res.fullProfile.profile.templateConfig.templateId as TemplateType);
      } else if (res.fullProfile.profile.templateConfig?.type) {
        setSelectedTemplate(res.fullProfile.profile.templateConfig.type);
      }

      // Record page view analytics event for tracking visitor activity
      if (!previewMode && res.fullProfile?.profile?.id) {
        api.recordEvent({
          profileId: res.fullProfile.profile.id,
          eventType: 'page_view',
          referrer: document.referrer || 'direct',
          metadata: { version: activeVersionSlug },
        }).catch(() => {});
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load public profile');
    } finally {
      setLoading(false);
    }
  };

  const currentVersion: CVVersion | undefined = profileData?.versions?.find(
    v => v.slug === activeVersionSlug
  ) || profileData?.versions?.[0];

  const handleDownloadPDF = () => {
    if (!profileData) return;
    api.recordEvent({
      profileId: profileData.profile.id,
      eventType: 'resume_download',
      metadata: { versionSlug: activeVersionSlug },
    });
    generatePDFResume(profileData, {
      template: selectedTemplate === 'executive' ? 'executive' : 'modern-clean',
      version: currentVersion,
    });
  };

  const handleProjectClick = (projectId: string) => {
    if (!profileData) return;
    api.recordEvent({
      profileId: profileData.profile.id,
      eventType: 'project_click',
      targetId: projectId,
    });
  };

  const publicUrl = `${window.location.origin}/cv/${username}${activeVersionSlug !== 'general' ? `?v=${activeVersionSlug}` : ''}`;

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center p-4">
        <div className="w-10 h-10 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin mb-4" />
        <p className="text-sm text-neutral-400">Loading digital CV profile...</p>
      </div>
    );
  }

  if (error || !profileData) {
    return (
      <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center p-4 text-center">
        <div className="p-6 rounded-2xl bg-neutral-900 border border-neutral-800 max-w-md space-y-4">
          <h2 className="text-xl font-bold text-white">Profile Not Found</h2>
          <p className="text-sm text-neutral-400">{error || 'This digital CV may be set to private or does not exist.'}</p>
          {onBackToDashboard && (
            <button
              onClick={onBackToDashboard}
              className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold"
            >
              Return to Dashboard
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col selection:bg-indigo-500/30">
      {/* Top Floating Action Bar */}
      <header className="sticky top-0 z-40 bg-neutral-950/90 backdrop-blur-xl border-b border-neutral-800/80 px-4 sm:px-8 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {previewMode && onBackToDashboard && (
              <button
                onClick={onBackToDashboard}
                className="px-3 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Exit Preview</span>
              </button>
            )}

            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white text-xs shadow-md">
                {profileData.profile.fullName ? profileData.profile.fullName.charAt(0) : 'D'}
              </div>
              <span className="font-bold text-sm text-white">
                {profileData.profile.fullName || 'Digital CV'}
              </span>
            </div>

            {/* CV Version Switcher (if user created multiple targeted versions) */}
            {profileData.versions && profileData.versions.length > 1 && (
              <div className="flex items-center gap-1 bg-neutral-900 border border-neutral-800 rounded-xl p-1 text-xs">
                <Layers className="w-3.5 h-3.5 text-neutral-400 ml-1.5" />
                <select
                  value={activeVersionSlug}
                  onChange={e => setActiveVersionSlug(e.target.value)}
                  className="bg-transparent text-neutral-200 text-xs font-medium outline-none pr-2 cursor-pointer"
                >
                  {profileData.versions.map(v => (
                    <option key={v.id} value={v.slug} className="bg-neutral-900 text-white">
                      {v.name} {v.isDefault ? '(Default)' : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Right Action Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Template Selector (In owner preview mode only) */}
            {previewMode && (
              <div className="hidden lg:flex items-center gap-1 bg-neutral-900 border border-neutral-800 rounded-xl p-1 text-xs">
                <select
                  value={selectedTemplate}
                  onChange={e => setSelectedTemplate(e.target.value as TemplateType)}
                  className="bg-transparent text-neutral-300 text-xs font-medium outline-none px-2 py-0.5 cursor-pointer"
                >
                  <option value="modern-clean" className="bg-neutral-900">Modern Clean</option>
                  <option value="executive" className="bg-neutral-900">Executive Serif</option>
                  <option value="terminal" className="bg-neutral-900">Tech Terminal</option>
                  <option value="bento" className="bg-neutral-900">Bento Grid</option>
                  <option value="minimalist" className="bg-neutral-900">Minimalist Line</option>
                </select>
              </div>
            )}

            {/* Share QR */}
            <button
              onClick={() => setShowQRModal(true)}
              className="p-2 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-neutral-700 text-neutral-300 hover:text-white text-xs transition-colors"
              title="Share QR Code"
            >
              <Share2 className="w-4 h-4" />
            </button>

            {/* Download PDF ATS Resume */}
            <button
              onClick={handleDownloadPDF}
              className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/30 flex items-center gap-1.5 transition-all hover:scale-105"
            >
              <FileDown className="w-4 h-4" />
              <span className="hidden sm:inline">Download CV (PDF)</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Digital CV Content Canvas */}
      <main className="flex-1 py-10 px-4 sm:px-6 lg:px-8">
        {selectedTemplate === 'modern-clean' && (
          <ModernCleanTemplate
            data={profileData}
            activeVersion={currentVersion}
            onProjectClick={handleProjectClick}
          />
        )}
        {selectedTemplate === 'executive' && (
          <ExecutiveSerifTemplate
            data={profileData}
            activeVersion={currentVersion}
            onProjectClick={handleProjectClick}
          />
        )}
        {selectedTemplate === 'terminal' && (
          <TechTerminalTemplate
            data={profileData}
            activeVersion={currentVersion}
            onProjectClick={handleProjectClick}
          />
        )}
        {selectedTemplate === 'bento' && (
          <BentoGridTemplate
            data={profileData}
            activeVersion={currentVersion}
            onProjectClick={handleProjectClick}
          />
        )}
        {selectedTemplate === 'minimalist' && (
          <MinimalistLineTemplate
            data={profileData}
            activeVersion={currentVersion}
            onProjectClick={handleProjectClick}
          />
        )}
      </main>

      {/* Bottom Footer */}
      <footer className="border-t border-neutral-900 py-8 text-center text-xs text-neutral-500">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 px-4">
          <p>© {new Date().getFullYear()} {profileData.profile.fullName}.</p>
          <div className="flex items-center gap-2 text-neutral-400">
            <span>Interactive Digital Portfolio</span>
          </div>
        </div>
      </footer>

      {/* QR Share Modal */}
      <QRShareModal
        isOpen={showQRModal}
        onClose={() => setShowQRModal(false)}
        publicUrl={publicUrl}
        candidateName={profileData.profile.fullName}
      />
    </div>
  );
};
