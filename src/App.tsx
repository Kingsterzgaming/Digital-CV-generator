import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { Navbar } from './components/layout/Navbar.tsx';
import { Sidebar, type DashboardView } from './components/layout/Sidebar.tsx';
import { DashboardOverview } from './components/dashboard/DashboardOverview.tsx';
import { ProfileEditor } from './components/dashboard/ProfileEditor.tsx';
import { ExperienceManager } from './components/dashboard/ExperienceManager.tsx';
import { ProjectManager } from './components/dashboard/ProjectManager.tsx';
import { SkillsManager } from './components/dashboard/SkillsManager.tsx';
import { EducationManager } from './components/dashboard/EducationManager.tsx';
import { CVVersionManager } from './components/dashboard/CVVersionManager.tsx';
import { TemplateCustomizer } from './components/dashboard/TemplateCustomizer.tsx';
import { PDFResumeGenerator } from './components/dashboard/PDFResumeGenerator.tsx';
import { AnalyticsView } from './components/dashboard/AnalyticsView.tsx';
import { OnboardingFlow } from './components/onboarding/OnboardingFlow.tsx';
import { PublicCVPage } from './components/public/PublicCVPage.tsx';
import { JobTailorModal } from './components/dashboard/JobTailorModal.tsx';
import { CVReimportModal } from './components/dashboard/CVReimportModal.tsx';
import { AIKeyManagerModal } from './components/dashboard/AIKeyManagerModal.tsx';
import {
  Sparkles,
  ArrowRight,
  UploadCloud,
  FileCheck2,
  Database,
  Layers,
  Bot,
  UserCheck,
  ShieldCheck,
  Zap,
} from 'lucide-react';

function AppContent() {
  const { user, fullProfile, isLoading } = useAuth();
  const [currentView, setCurrentView] = useState<DashboardView>('overview');
  const [isViewingPublic, setIsViewingPublic] = useState<boolean>(false);
  const [isOnboarding, setIsOnboarding] = useState<boolean>(false);
  const [showTailorModal, setShowTailorModal] = useState<boolean>(false);
  const [showReimportModal, setShowReimportModal] = useState<boolean>(false);
  const [showAIKeysModal, setShowAIKeysModal] = useState<boolean>(false);
  const [publicUrlUsername, setPublicUrlUsername] = useState<string | null>(null);

  // Check URL query or path for direct public CV viewing (e.g. /cv/:username)
  useEffect(() => {
    const path = window.location.pathname;
    if (path.startsWith('/cv/')) {
      const extracted = path.replace(/^\/cv\//, '').split('/')[0].split('?')[0].trim();
      if (extracted) {
        setPublicUrlUsername(extracted);
      }
    }
  }, []);

  // 1. Direct Public CV Link Mode (for external visitors, recruiters, or shared links)
  if (publicUrlUsername) {
    return (
      <PublicCVPage
        username={publicUrlUsername}
        previewMode={false}
      />
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center text-white">
        <div className="w-10 h-10 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin mb-4" />
        <p className="text-xs text-neutral-400 font-medium">Loading Digital CV...</p>
      </div>
    );
  }

  // 2. Owner Preview Mode (opened from within Dashboard)
  if (isViewingPublic) {
    return (
      <PublicCVPage
        username={user?.username || fullProfile?.profile?.fullName?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'prateek'}
        onBackToDashboard={() => setIsViewingPublic(false)}
        previewMode={true}
      />
    );
  }

  // 2. Onboarding Flow (CV Upload -> Extraction -> Review -> DB Commit)
  if (isOnboarding || (!fullProfile && user)) {
    return (
      <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col justify-between">
        <header className="p-4 sm:p-6 flex items-center justify-between border-b border-neutral-900">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center font-bold text-white text-xs">
              DC
            </div>
            <span className="font-bold text-sm text-white">DigitalCV Onboarding</span>
          </div>
          {fullProfile && (
            <button
              onClick={() => setIsOnboarding(false)}
              className="text-xs text-neutral-400 hover:text-white px-3 py-1.5 rounded-lg bg-neutral-900 border border-neutral-800"
            >
              Back to Dashboard
            </button>
          )}
        </header>

        <main className="flex-1 py-8 px-4 flex items-center justify-center">
          <OnboardingFlow
            onComplete={() => {
              setIsOnboarding(false);
              setCurrentView('overview');
            }}
          />
        </main>
      </div>
    );
  }

  // 3. Main SaaS Management Dashboard
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col">
      {/* Top Application Bar */}
      <Navbar
        onOpenPreview={() => setIsViewingPublic(true)}
        onOpenReimport={() => setShowReimportModal(true)}
        onOpenTailor={() => setShowTailorModal(true)}
        onOpenAIKeys={() => setShowAIKeysModal(true)}
      />

      {/* Main Container with Sticky Sidebar */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar */}
        <Sidebar
          currentView={currentView}
          onSelectView={setCurrentView}
          onOpenReimport={() => setShowReimportModal(true)}
          onOpenTailor={() => setShowTailorModal(true)}
          onOpenAIKeys={() => setShowAIKeysModal(true)}
        />

        {/* Viewport Content Area */}
        <main className="flex-1 overflow-y-auto p-6 sm:p-8 bg-neutral-950">
          {currentView === 'overview' && (
            <DashboardOverview
              onSelectView={setCurrentView}
              onOpenPreview={() => setIsViewingPublic(true)}
              onOpenReimport={() => setShowReimportModal(true)}
              onOpenTailor={() => setShowTailorModal(true)}
            />
          )}
          {currentView === 'profile' && <ProfileEditor />}
          {currentView === 'experience' && <ExperienceManager />}
          {currentView === 'projects' && <ProjectManager />}
          {currentView === 'skills' && <SkillsManager />}
          {currentView === 'education' && <EducationManager />}
          {currentView === 'versions' && <CVVersionManager />}
          {currentView === 'templates' && (
            <TemplateCustomizer onOpenPreview={() => setIsViewingPublic(true)} />
          )}
          {currentView === 'pdf' && <PDFResumeGenerator />}
          {currentView === 'analytics' && <AnalyticsView />}
        </main>
      </div>

      {/* Global Modals */}
      <JobTailorModal
        isOpen={showTailorModal}
        onClose={() => setShowTailorModal(false)}
      />

      <CVReimportModal
        isOpen={showReimportModal}
        onClose={() => setShowReimportModal(false)}
      />

      <AIKeyManagerModal
        isOpen={showAIKeysModal}
        onClose={() => setShowAIKeysModal(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
