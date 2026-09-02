import React, { useState, useEffect } from 'react';
import {
  Key,
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
  Plus,
  Trash2,
  CheckCircle2,
  XCircle,
  Clock,
  Zap,
  Activity,
  Cpu,
  HelpCircle,
  Check,
  ExternalLink,
} from 'lucide-react';
import { api } from '../../lib/api.ts';
import type { AIKeyPoolStatus, AIKeyEntry } from '../../types/index.ts';

interface AIKeyManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AIKeyManagerModal: React.FC<AIKeyManagerModalProps> = ({ isOpen, onClose }) => {
  const [status, setStatus] = useState<AIKeyPoolStatus | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isTestingAll, setIsTestingAll] = useState<boolean>(false);
  const [testingKeyId, setTestingKeyId] = useState<string | null>(null);
  const [switchingKeyId, setSwitchingKeyId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [newKeyValue, setNewKeyValue] = useState<string>('');
  const [newKeyName, setNewKeyName] = useState<string>('');
  const [addError, setAddError] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState<boolean>(false);
  const [actionNotice, setActionNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchStatus = async () => {
    try {
      const data = await api.getAIKeyPoolStatus();
      setStatus(data);
    } catch (err) {
      console.error('Failed to load AI key status:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      fetchStatus();
      const interval = setInterval(fetchStatus, 10000); // refresh every 10s while open
      return () => clearInterval(interval);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTestKey = async (keyId: string) => {
    setTestingKeyId(keyId);
    setActionNotice(null);
    try {
      const res = await api.testAIKeys(keyId);
      setStatus(res.poolStatus);
      if (res.result?.success) {
        setActionNotice({
          type: 'success',
          text: `Key ping succeeded: ${res.result.message}`,
        });
      } else {
        setActionNotice({
          type: 'error',
          text: `Key test returned: ${res.result?.message || 'Error'}`,
        });
      }
    } catch (err: any) {
      setActionNotice({ type: 'error', text: err.message || 'Key test failed' });
    } finally {
      setTestingKeyId(null);
    }
  };

  const handleTestAll = async () => {
    setIsTestingAll(true);
    setActionNotice(null);
    try {
      const res = await api.testAIKeys();
      setStatus(res.poolStatus);
      setActionNotice({
        type: 'success',
        text: `Diagnostic ping completed for ${res.tested || res.poolStatus.totalKeys} keys.`,
      });
    } catch (err: any) {
      setActionNotice({ type: 'error', text: err.message || 'Diagnostic ping failed' });
    } finally {
      setIsTestingAll(false);
    }
  };

  const handleSwitchKey = async (keyId: string) => {
    setSwitchingKeyId(keyId);
    setActionNotice(null);
    try {
      const res = await api.switchActiveAIKey(keyId);
      setStatus(res.poolStatus);
      setActionNotice({ type: 'success', text: res.result.message });
    } catch (err: any) {
      setActionNotice({ type: 'error', text: err.message || 'Failed to switch active key' });
    } finally {
      setSwitchingKeyId(null);
    }
  };

  const handleAddKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyValue.trim()) {
      setAddError('Please enter a valid Gemini API key.');
      return;
    }

    setIsAdding(true);
    setAddError(null);
    setActionNotice(null);

    try {
      const res = await api.addCustomAIKey(newKeyValue.trim(), newKeyName.trim() || undefined);
      setStatus(res.poolStatus);
      setNewKeyValue('');
      setNewKeyName('');
      setShowAddForm(false);
      setActionNotice({
        type: 'success',
        text: `Key added to pool! ${res.testResult?.message || 'Operational.'}`,
      });
    } catch (err: any) {
      setAddError(err.message || 'Failed to add key to pool');
    } finally {
      setIsAdding(false);
    }
  };

  const handleRemoveKey = async (keyId: string) => {
    if (!window.confirm('Remove this key from the AI pool?')) return;
    try {
      const res = await api.removeCustomAIKey(keyId);
      setStatus(res.poolStatus);
      setActionNotice({ type: 'success', text: 'Key removed from pool.' });
    } catch (err: any) {
      setActionNotice({ type: 'error', text: err.message || 'Failed to delete key' });
    }
  };

  const handleResetCooldowns = async () => {
    try {
      const res = await api.resetAIKeyStatus();
      setStatus(res.poolStatus);
      setActionNotice({ type: 'success', text: 'All key cooldowns & error flags reset to healthy.' });
    } catch (err: any) {
      setActionNotice({ type: 'error', text: err.message || 'Failed to reset keys' });
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="p-6 border-b border-neutral-800 flex items-center justify-between bg-neutral-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white">AI Engine & API Key Pool Manager</h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-indigo-950 text-indigo-300 border border-indigo-800">
                  Smart Failover
                </span>
              </div>
              <p className="text-xs text-neutral-400">
                Automated multi-key pool rotation, live quota health checker, and failover diagnostics.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white flex items-center justify-center text-sm font-semibold transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          {/* Action notice banner */}
          {actionNotice && (
            <div
              className={`p-3.5 rounded-2xl flex items-center justify-between gap-3 border ${
                actionNotice.type === 'success'
                  ? 'bg-emerald-950/60 border-emerald-800 text-emerald-300'
                  : 'bg-rose-950/60 border-rose-800 text-rose-300'
              }`}
            >
              <div className="flex items-center gap-2">
                {actionNotice.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                )}
                <span>{actionNotice.text}</span>
              </div>
              <button
                onClick={() => setActionNotice(null)}
                className="text-neutral-400 hover:text-white text-xs px-2 py-0.5 rounded"
              >
                ✕
              </button>
            </div>
          )}

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 rounded-2xl bg-neutral-950/80 border border-neutral-800 flex flex-col justify-between">
              <span className="text-[11px] text-neutral-400 font-medium">Total Pool Keys</span>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-xl font-bold text-white">{status?.totalKeys ?? 0}</span>
                <span className="text-[10px] text-neutral-500">Configured</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-neutral-950/80 border border-neutral-800 flex flex-col justify-between">
              <span className="text-[11px] text-neutral-400 font-medium">Healthy / Ready</span>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-xl font-bold text-emerald-400">{status?.healthyKeys ?? 0}</span>
                <span className="text-[10px] text-emerald-600">Active pool</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-neutral-950/80 border border-neutral-800 flex flex-col justify-between">
              <span className="text-[11px] text-neutral-400 font-medium">Exhausted (429)</span>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-xl font-bold text-amber-400">{status?.exhaustedKeys ?? 0}</span>
                <span className="text-[10px] text-amber-600">Cooldown mode</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-neutral-950/80 border border-neutral-800 flex flex-col justify-between">
              <span className="text-[11px] text-neutral-400 font-medium">Engine Mode</span>
              <div className="flex items-center gap-1.5 mt-2">
                {status?.isFallbackMode ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-800">
                    Heuristic Fallback
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                    Gemini 3.7 Flash Active
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Controls Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-2">
              <button
                onClick={handleTestAll}
                disabled={isTestingAll || isLoading}
                className="px-3.5 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-2 transition-colors border border-neutral-700"
              >
                <Activity className={`w-3.5 h-3.5 ${isTestingAll ? 'animate-spin text-indigo-400' : 'text-emerald-400'}`} />
                <span>{isTestingAll ? 'Testing All Keys...' : 'Health Check (Test All)'}</span>
              </button>

              <button
                onClick={handleResetCooldowns}
                className="px-3 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors border border-neutral-700"
              >
                <RefreshCw className="w-3.5 h-3.5 text-neutral-400" />
                <span>Reset Cooldowns</span>
              </button>
            </div>

            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-indigo-600/30"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Backup Key to Pool</span>
            </button>
          </div>

          {/* Add Key Form */}
          {showAddForm && (
            <form
              onSubmit={handleAddKey}
              className="p-5 rounded-2xl bg-neutral-950 border border-indigo-900/60 space-y-4 shadow-xl"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Key className="w-4 h-4 text-indigo-400" />
                  <span className="font-bold text-white text-xs">Register New Gemini API Key</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="text-neutral-500 hover:text-white"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-neutral-400 mb-1">
                    API Key Value <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="password"
                    value={newKeyValue}
                    onChange={e => setNewKeyValue(e.target.value)}
                    placeholder="AIzaSy..."
                    required
                    className="w-full px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-white text-xs focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-neutral-400 mb-1">
                    Label / Description (Optional)
                  </label>
                  <input
                    type="text"
                    value={newKeyName}
                    onChange={e => setNewKeyName(e.target.value)}
                    placeholder="e.g. Backup Key (Project B)"
                    className="w-full px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-white text-xs focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {addError && (
                <p className="text-[11px] text-rose-400 font-medium">{addError}</p>
              )}

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-3 py-1.5 rounded-xl bg-neutral-800 text-neutral-300 hover:text-white text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isAdding}
                  className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-indigo-600/30"
                >
                  {isAdding && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>Add & Verify Key</span>
                </button>
              </div>
            </form>
          )}

          {/* Key Pool Table / Cards */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-neutral-300 tracking-wide uppercase">
              Configured API Keys ({status?.keys.length || 0})
            </h3>

            {isLoading ? (
              <div className="p-8 text-center text-neutral-400">
                <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-indigo-400" />
                <p>Loading AI key statuses...</p>
              </div>
            ) : !status || status.keys.length === 0 ? (
              <div className="p-8 rounded-2xl bg-neutral-950 border border-neutral-800 text-center space-y-3">
                <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto" />
                <p className="font-semibold text-white">No API Keys Detected</p>
                <p className="text-neutral-400 max-w-md mx-auto text-[11px]">
                  Add a key above or configure <code className="text-indigo-300 bg-neutral-900 px-1 py-0.5 rounded">GEMINI_API_KEY</code> in environment variables.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {status.keys.map(key => {
                  const isCurrentActive = key.isActive;
                  const isExhausted = key.status === 'exhausted';
                  const isError = key.status === 'error';
                  const isHealthy = key.status === 'healthy';

                  return (
                    <div
                      key={key.id}
                      className={`p-4 rounded-2xl border transition-all ${
                        isCurrentActive
                          ? 'bg-neutral-950 border-indigo-600/80 shadow-lg shadow-indigo-950/40 ring-1 ring-indigo-500/40'
                          : 'bg-neutral-950/70 border-neutral-800 hover:border-neutral-700'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                              isCurrentActive
                                ? 'bg-indigo-950/80 border-indigo-700 text-indigo-400'
                                : isExhausted
                                ? 'bg-amber-950/80 border-amber-700 text-amber-400'
                                : isError
                                ? 'bg-rose-950/80 border-rose-700 text-rose-400'
                                : 'bg-neutral-900 border-neutral-800 text-neutral-400'
                            }`}
                          >
                            <Key className="w-4 h-4" />
                          </div>

                          <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-bold text-white text-xs">{key.name}</span>
                              {isCurrentActive && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-900/60 text-indigo-200 border border-indigo-700">
                                  ● Active Key
                                </span>
                              )}
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                                  isHealthy
                                    ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                                    : isExhausted
                                    ? 'bg-amber-950 text-amber-300 border-amber-800'
                                    : isError
                                    ? 'bg-rose-950 text-rose-300 border-rose-800'
                                    : 'bg-neutral-900 text-neutral-400 border-neutral-800'
                                }`}
                              >
                                {isHealthy && '🟢 Healthy'}
                                {isExhausted && `🔴 Quota Exhausted (${key.cooldownRemainingSeconds ? `${key.cooldownRemainingSeconds}s cooldown` : 'cooling down'})`}
                                {isError && '⚠️ Invalid / Auth Error'}
                                {key.status === 'untested' && '⚪ Untested'}
                              </span>

                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-neutral-400">
                                {key.source === 'env' ? 'ENV' : 'Custom'}
                              </span>
                            </div>

                            <div className="flex flex-wrap items-center gap-3 text-[11px] text-neutral-400">
                              <span className="font-mono text-neutral-300">{key.masked}</span>
                              {key.latencyMs !== undefined && (
                                <span className="flex items-center gap-1 text-emerald-400 font-medium">
                                  <Clock className="w-3 h-3" />
                                  <span>{key.latencyMs}ms</span>
                                </span>
                              )}
                              <span>Calls: {key.totalCalls} ({key.successCount} ok, {key.failureCount} fail)</span>
                            </div>

                            {key.lastError && (
                              <p className="text-[11px] text-rose-400 bg-rose-950/40 px-2 py-1 rounded-lg border border-rose-900/50 mt-1 max-w-xl truncate">
                                Error: {key.lastError}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Action Controls */}
                        <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                          <button
                            onClick={() => handleTestKey(key.id)}
                            disabled={testingKeyId === key.id}
                            className="px-2.5 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-800 text-xs font-medium flex items-center gap-1.5 transition-colors"
                          >
                            <Activity className={`w-3 h-3 ${testingKeyId === key.id ? 'animate-spin text-indigo-400' : 'text-neutral-400'}`} />
                            <span>{testingKeyId === key.id ? 'Testing...' : 'Test'}</span>
                          </button>

                          {!isCurrentActive && (
                            <button
                              onClick={() => handleSwitchKey(key.id)}
                              disabled={switchingKeyId === key.id}
                              className="px-2.5 py-1.5 rounded-xl bg-indigo-950/70 hover:bg-indigo-900 text-indigo-200 border border-indigo-800 text-xs font-semibold flex items-center gap-1 transition-colors"
                            >
                              <Check className="w-3 h-3" />
                              <span>Switch to Key</span>
                            </button>
                          )}

                          {key.source === 'custom' && (
                            <button
                              onClick={() => handleRemoveKey(key.id)}
                              className="p-1.5 rounded-xl bg-neutral-900 hover:bg-rose-950/60 text-neutral-400 hover:text-rose-400 border border-neutral-800 transition-colors"
                              title="Delete Key"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Automatic Switcher Logic Explanation Box */}
          <div className="p-4 rounded-2xl bg-neutral-950/60 border border-neutral-800/80 space-y-2 text-[11px] text-neutral-400">
            <div className="flex items-center gap-2 font-semibold text-neutral-200">
              <ShieldCheck className="w-4 h-4 text-indigo-400" />
              <span>How Automatic Failover & Pool Rotation Works</span>
            </div>
            <ul className="list-disc list-inside space-y-1 text-neutral-400 pl-1 leading-relaxed">
              <li>When any Gemini API call encounters a <strong className="text-white">429 / Quota Exhausted</strong> error, the exhausted key is marked with a 3-minute cooldown.</li>
              <li>The engine <strong className="text-white">instantly switches</strong> to the next healthy key in the pool and transparently retries the candidate extraction or chat request.</li>
              <li>If all keys in the pool are exhausted, DigitalCV seamlessly switches to high-accuracy <strong className="text-white">verified database heuristics</strong> so the user experience never crashes or stalls.</li>
            </ul>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-neutral-800 bg-neutral-950/80 flex items-center justify-between text-xs">
          <span className="text-neutral-500">Auto-refreshes every 10 seconds</span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-semibold transition-colors"
          >
            Close Manager
          </button>
        </div>
      </div>
    </div>
  );
};
