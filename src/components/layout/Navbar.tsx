import React, { useState, useEffect } from 'react';
import {
  ExternalLink,
  Eye,
  FileText,
  User,
  LogOut,
  RefreshCw,
  Sparkles,
  ChevronDown,
  Globe,
  Trash2,
  Upload,
  Zap,
  Key,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { api } from '../../lib/api.ts';

interface NavbarProps {
  onOpenPreview: () => void;
  onOpenReimport: () => void;
  onOpenTailor: () => void;
  onOpenAIKeys: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenPreview,
  onOpenReimport,
  onOpenTailor,
  onOpenAIKeys,
}) => {
  const { user, fullProfile, resetAllData, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState<boolean>(false);
  const [isResetting, setIsResetting] = useState<boolean>(false);
  const [keyCount, setKeyCount] = useState<{ total: number; healthy: number }>({ total: 1, healthy: 1 });

  useEffect(() => {
    api.getAIKeyPoolStatus().then(status => {
      setKeyCount({ total: status.totalKeys, healthy: status.healthyKeys });
    }).catch(() => {});
  }, []);

  const handleResetData = async () => {
    if (window.confirm('Are you sure you want to reset and clear all CV data? This will clear all entries to a blank slate.')) {
      setIsResetting(true);
      try {
        await resetAllData();
      } catch (err) {
        console.error('Reset failed:', err);
      } finally {
        setIsResetting(false);
        setShowUserMenu(false);
      }
    }
  };

  return (
    <header className="h-16 bg-neutral-950 border-b border-neutral-800/80 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30">
      {/* Brand */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-600/30 text-sm">
          DC
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-base text-white tracking-tight">DigitalCV</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-800 font-semibold">
              PostgreSQL Core
            </span>
          </div>
        </div>
      </div>

      {/* Center Action Shortcuts */}
      <div className="hidden md:flex items-center gap-2">
        {/* AI Key Switcher & Status Pill */}
        <button
          onClick={onOpenAIKeys}
          className="px-3 py-1.5 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-indigo-500/60 text-neutral-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
          title="Open AI Engine & API Key Pool Manager"
        >
          <Zap className="w-3.5 h-3.5 text-amber-400" />
          <span>AI Engine</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-indigo-950 text-indigo-300 font-mono">
            {keyCount.healthy}/{keyCount.total} Keys
          </span>
        </button>

        <button
          onClick={onOpenTailor}
          className="px-3 py-1.5 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-indigo-500/60 text-neutral-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
        >
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          <span>Tailor for Job</span>
        </button>

        <button
          onClick={onOpenReimport}
          className="px-3 py-1.5 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-neutral-700 text-neutral-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5 text-neutral-400" />
          <span>Upload / Re-import CV</span>
        </button>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {/* AI Keys button on mobile */}
        <button
          onClick={onOpenAIKeys}
          className="md:hidden p-1.5 rounded-xl bg-neutral-900 border border-neutral-800 text-amber-400"
          title="AI Key Pool"
        >
          <Zap className="w-4 h-4" />
        </button>

        {/* Live Public CV Preview Link */}
        <button
          onClick={onOpenPreview}
          className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/30 flex items-center gap-1.5 transition-all hover:scale-105"
        >
          <Eye className="w-3.5 h-3.5" />
          <span>View Public CV</span>
        </button>

        {/* User Account Menu */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="p-1.5 sm:px-3 sm:py-1.5 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-neutral-700 text-neutral-300 hover:text-white text-xs font-medium flex items-center gap-2 transition-colors"
          >
            <div className="w-6 h-6 rounded-full bg-indigo-900/60 border border-indigo-700 flex items-center justify-center text-indigo-300 text-xs font-bold">
              {user?.name?.charAt(0) || 'P'}
            </div>
            <span className="hidden sm:inline font-semibold text-white">{user?.name || 'Prateek Chauhan'}</span>
            <ChevronDown className="w-3.5 h-3.5 text-neutral-500" />
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-64 bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl p-2 space-y-1 z-50 text-xs">
              <div className="px-3 py-2 border-b border-neutral-800">
                <p className="font-semibold text-white">{user?.name || 'Prateek Chauhan'}</p>
                <p className="text-[11px] text-neutral-400 truncate">{user?.email || 'prateekchauhan948@gmail.com'}</p>
              </div>

              <div className="py-1">
                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    onOpenAIKeys();
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl hover:bg-neutral-800 text-neutral-300 flex items-center gap-2"
                >
                  <Key className="w-3.5 h-3.5 text-amber-400" />
                  <span>Manage AI API Keys & Pool</span>
                </button>

                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    onOpenReimport();
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl hover:bg-neutral-800 text-neutral-300 flex items-center gap-2"
                >
                  <Upload className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Upload Real CV Document</span>
                </button>

                <button
                  onClick={handleResetData}
                  disabled={isResetting}
                  className="w-full text-left px-3 py-2 rounded-xl hover:bg-rose-950/40 text-rose-400 flex items-center gap-2"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                  <span>Reset & Clear All Data</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

