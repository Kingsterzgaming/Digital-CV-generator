import { GoogleGenAI } from '@google/genai';
import type { AIKeyEntry, AIKeyPoolStatus, AIKeyStatus } from '../types/index.ts';

export interface InternalKeyItem {
  id: string;
  name: string;
  rawKey: string;
  source: 'env' | 'custom';
  status: AIKeyStatus;
  failureCount: number;
  successCount: number;
  totalCalls: number;
  lastUsedAt?: string;
  lastTestedAt?: string;
  lastError?: string;
  latencyMs?: number;
  exhaustedUntil?: number; // timestamp in ms
}

class AIKeyPoolManager {
  private keys: InternalKeyItem[] = [];
  private activeKeyId: string | null = null;
  private clientCache: Map<string, GoogleGenAI> = new Map();
  private readonly COOLDOWN_DURATION_MS = 3 * 60 * 1000; // 3 minutes cooldown for exhausted keys

  constructor() {
    this.discoverEnvKeys();
  }

  /**
   * Helper to mask API keys safely: e.g. "AIzaSyDa...7x9Q"
   */
  private maskKey(key: string): string {
    if (!key) return '';
    const trimmed = key.trim();
    if (trimmed.length <= 10) return `${trimmed.slice(0, 3)}...${trimmed.slice(-2)}`;
    return `${trimmed.slice(0, 6)}...${trimmed.slice(-4)}`;
  }

  /**
   * Scan process.env for all GEMINI keys and populate the initial pool
   */
  public discoverEnvKeys(): void {
    const existingRawKeys = new Set(this.keys.map(k => k.rawKey.trim()));
    const discovered: { name: string; key: string }[] = [];

    // 1. Primary GEMINI_API_KEY
    if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim()) {
      discovered.push({ name: 'Primary Key (GEMINI_API_KEY)', key: process.env.GEMINI_API_KEY.trim() });
    }

    // 2. Comma/space/newline separated GEMINI_API_KEYS / GEMINI_API_KEY_POOL / GEMINI_BACKUP_KEYS
    const multiEnvVars = [
      { name: 'GEMINI_API_KEYS', val: process.env.GEMINI_API_KEYS },
      { name: 'GEMINI_API_KEY_POOL', val: process.env.GEMINI_API_KEY_POOL },
      { name: 'GEMINI_BACKUP_KEYS', val: process.env.GEMINI_BACKUP_KEYS },
    ];

    multiEnvVars.forEach(({ name, val }) => {
      if (val) {
        const parts = val.split(/[\s,;]+/).map(p => p.trim()).filter(Boolean);
        parts.forEach((k, idx) => {
          discovered.push({ name: `${name} [${idx + 1}]`, key: k });
        });
      }
    });

    // 3. Numbered keys GEMINI_API_KEY_1 to 10
    for (let i = 1; i <= 10; i++) {
      const numberedKey = process.env[`GEMINI_API_KEY_${i}`];
      if (numberedKey && numberedKey.trim()) {
        discovered.push({ name: `Backup Key #${i} (GEMINI_API_KEY_${i})`, key: numberedKey.trim() });
      }
    }

    // Add unique keys to pool
    discovered.forEach((item, index) => {
      if (!existingRawKeys.has(item.key)) {
        const keyItem: InternalKeyItem = {
          id: `key_env_${Date.now()}_${index}`,
          name: item.name,
          rawKey: item.key,
          source: 'env',
          status: 'healthy',
          failureCount: 0,
          successCount: 0,
          totalCalls: 0,
        };
        this.keys.push(keyItem);
        existingRawKeys.add(item.key);
      }
    });

    // Set active key if not already set
    if (!this.activeKeyId && this.keys.length > 0) {
      this.activeKeyId = this.keys[0].id;
    }
  }

  /**
   * Get cached or create new GoogleGenAI client for a specific raw key
   */
  public getClientForKey(rawKey: string): GoogleGenAI {
    if (!this.clientCache.has(rawKey)) {
      const client = new GoogleGenAI({
        apiKey: rawKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });
      this.clientCache.set(rawKey, client);
    }
    return this.clientCache.get(rawKey)!;
  }

  /**
   * Checks cooldowns and returns the best available key entry and its client
   */
  public getActiveClientAndKey(): { client: GoogleGenAI; keyItem: InternalKeyItem } | null {
    this.refreshCooldowns();

    if (this.keys.length === 0) {
      this.discoverEnvKeys();
    }

    if (this.keys.length === 0) {
      return null;
    }

    // Try currently selected active key first
    let activeKey = this.keys.find(k => k.id === this.activeKeyId);
    if (activeKey && activeKey.status !== 'exhausted' && activeKey.status !== 'error') {
      return {
        client: this.getClientForKey(activeKey.rawKey),
        keyItem: activeKey,
      };
    }

    // If active key is exhausted or invalid, rotate to the next healthy key in the pool
    const nextAvailable = this.keys.find(k => k.status === 'healthy' || k.status === 'untested');
    if (nextAvailable) {
      this.activeKeyId = nextAvailable.id;
      console.log(`[AI Key Switcher] Switched active key to: ${nextAvailable.name} (${this.maskKey(nextAvailable.rawKey)})`);
      return {
        client: this.getClientForKey(nextAvailable.rawKey),
        keyItem: nextAvailable,
      };
    }

    // If all are exhausted, check if any key has expired cooldown
    const now = Date.now();
    const leastCooldown = this.keys
      .filter(k => k.status === 'exhausted' && k.exhaustedUntil)
      .sort((a, b) => (a.exhaustedUntil || 0) - (b.exhaustedUntil || 0))[0];

    if (leastCooldown && (leastCooldown.exhaustedUntil || 0) <= now) {
      leastCooldown.status = 'healthy';
      leastCooldown.exhaustedUntil = undefined;
      this.activeKeyId = leastCooldown.id;
      return {
        client: this.getClientForKey(leastCooldown.rawKey),
        keyItem: leastCooldown,
      };
    }

    return null;
  }

  /**
   * Refresh cooldown timers for keys
   */
  private refreshCooldowns(): void {
    const now = Date.now();
    for (const key of this.keys) {
      if (key.status === 'exhausted' && key.exhaustedUntil && key.exhaustedUntil <= now) {
        key.status = 'healthy';
        key.exhaustedUntil = undefined;
        key.failureCount = 0;
        console.log(`[AI Key Switcher] Cooldown expired for ${key.name}. Re-marked as healthy.`);
      }
    }
  }

  /**
   * Detect if an error is due to quota/rate limiting
   */
  public isQuotaOrRateLimitError(err: any): boolean {
    const msg = String(err?.message || err?.statusText || err || '').toLowerCase();
    const code = err?.status || err?.statusCode || err?.code;
    return (
      code === 429 ||
      msg.includes('429') ||
      msg.includes('resource_exhausted') ||
      msg.includes('resourceexhausted') ||
      msg.includes('quota') ||
      msg.includes('rate limit') ||
      msg.includes('too many requests') ||
      msg.includes('exhausted')
    );
  }

  /**
   * Detect if an error is due to invalid key / authentication
   */
  public isAuthenticationError(err: any): boolean {
    const msg = String(err?.message || err?.statusText || err || '').toLowerCase();
    const code = err?.status || err?.statusCode || err?.code;
    return (
      code === 400 ||
      code === 401 ||
      code === 403 ||
      msg.includes('api_key_invalid') ||
      msg.includes('invalid api key') ||
      msg.includes('permission_denied') ||
      msg.includes('unauthenticated')
    );
  }

  /**
   * Report success for a key
   */
  public reportSuccess(keyId: string, latencyMs?: number): void {
    const key = this.keys.find(k => k.id === keyId);
    if (key) {
      key.status = 'healthy';
      key.successCount += 1;
      key.totalCalls += 1;
      key.lastUsedAt = new Date().toISOString();
      if (latencyMs) key.latencyMs = latencyMs;
      key.lastError = undefined;
    }
  }

  /**
   * Report failure for a key and trigger automatic switcher
   */
  public reportFailure(keyId: string, error: any): void {
    const key = this.keys.find(k => k.id === keyId);
    if (!key) return;

    key.failureCount += 1;
    key.totalCalls += 1;
    key.lastUsedAt = new Date().toISOString();
    key.lastError = error?.message || String(error);

    if (this.isQuotaOrRateLimitError(error)) {
      key.status = 'exhausted';
      key.exhaustedUntil = Date.now() + this.COOLDOWN_DURATION_MS;
      console.warn(`[AI Key Switcher] Key ${key.name} (${this.maskKey(key.rawKey)}) quota exhausted! Marked exhausted for 3m.`);
      
      // Auto-switch to another healthy key
      const nextHealthy = this.keys.find(k => k.id !== keyId && (k.status === 'healthy' || k.status === 'untested'));
      if (nextHealthy) {
        this.activeKeyId = nextHealthy.id;
        console.log(`[AI Key Switcher] Automatically switched active key to: ${nextHealthy.name}`);
      }
    } else if (this.isAuthenticationError(error)) {
      key.status = 'error';
      console.error(`[AI Key Switcher] Key ${key.name} (${this.maskKey(key.rawKey)}) has invalid authentication / permissions.`);
      
      const nextHealthy = this.keys.find(k => k.id !== keyId && (k.status === 'healthy' || k.status === 'untested'));
      if (nextHealthy) {
        this.activeKeyId = nextHealthy.id;
      }
    }
  }

  /**
   * Execute an AI operation with automatic failover across pool keys
   */
  public async executeWithFailover<T>(
    operationName: string,
    operation: (client: GoogleGenAI, keyItem: InternalKeyItem) => Promise<T>,
    heuristicFallback: () => Promise<T> | T
  ): Promise<T> {
    this.refreshCooldowns();

    // Get list of candidate keys (prioritize active key, then other healthy keys)
    const availableKeys = this.keys.filter(k => k.status !== 'exhausted' && k.status !== 'error');

    if (availableKeys.length === 0) {
      console.warn(`[AI Key Pool] No healthy API keys available in pool for "${operationName}". Utilizing heuristic fallback.`);
      return await heuristicFallback();
    }

    // Sort to put current activeKeyId first
    availableKeys.sort((a, b) => {
      if (a.id === this.activeKeyId) return -1;
      if (b.id === this.activeKeyId) return 1;
      return 0;
    });

    let lastError: any = null;

    for (const keyItem of availableKeys) {
      const startTime = Date.now();
      try {
        const client = this.getClientForKey(keyItem.rawKey);
        this.activeKeyId = keyItem.id;
        
        const result = await operation(client, keyItem);
        const latency = Date.now() - startTime;
        this.reportSuccess(keyItem.id, latency);
        return result;
      } catch (err: any) {
        lastError = err;
        this.reportFailure(keyItem.id, err);

        // If error is quota exhausted or rate limit, log and loop to next key immediately
        if (this.isQuotaOrRateLimitError(err)) {
          console.warn(`[AI Key Switcher] Failover: Key "${keyItem.name}" exhausted for "${operationName}". Retrying with next pooled key...`);
          continue;
        }

        // For other non-fatal errors, attempt next key if available
        console.warn(`[AI Key Switcher] Key "${keyItem.name}" failed: ${err.message}. Trying next available key...`);
      }
    }

    console.error(`[AI Key Pool] All ${availableKeys.length} available pool keys exhausted or failed for "${operationName}". Switching to resilient heuristic fallback.`);
    return await heuristicFallback();
  }

  /**
   * Test a specific key with a lightweight ping to verify functionality and measure latency
   */
  public async testKey(keyId: string): Promise<{ success: boolean; latencyMs?: number; message: string }> {
    const key = this.keys.find(k => k.id === keyId);
    if (!key) {
      return { success: false, message: 'Key not found in pool' };
    }

    const startTime = Date.now();
    try {
      const client = this.getClientForKey(key.rawKey);
      const res = await client.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: 'Respond with "OK"',
      });

      const latency = Date.now() - startTime;
      key.status = 'healthy';
      key.lastTestedAt = new Date().toISOString();
      key.latencyMs = latency;
      key.lastError = undefined;
      key.exhaustedUntil = undefined;
      return {
        success: true,
        latencyMs: latency,
        message: `Key is healthy & operational (Response: ${res.text?.trim() || 'OK'}, Latency: ${latency}ms)`,
      };
    } catch (err: any) {
      const latency = Date.now() - startTime;
      key.lastTestedAt = new Date().toISOString();
      key.latencyMs = latency;
      key.lastError = err.message || String(err);

      if (this.isQuotaOrRateLimitError(err)) {
        key.status = 'exhausted';
        key.exhaustedUntil = Date.now() + this.COOLDOWN_DURATION_MS;
        return {
          success: false,
          latencyMs: latency,
          message: `Quota Exhausted (429 / Rate Limited): ${err.message}`,
        };
      } else {
        key.status = 'error';
        return {
          success: false,
          latencyMs: latency,
          message: `Authentication / Connection Error: ${err.message}`,
        };
      }
    }
  }

  /**
   * Test all keys in pool in parallel
   */
  public async testAllKeys(): Promise<{ tested: number; results: Record<string, { success: boolean; latencyMs?: number; message: string }> }> {
    const results: Record<string, { success: boolean; latencyMs?: number; message: string }> = {};
    const promises = this.keys.map(async key => {
      const res = await this.testKey(key.id);
      results[key.id] = res;
    });

    await Promise.all(promises);
    return { tested: this.keys.length, results };
  }

  /**
   * Add a custom backup API key to the pool
   */
  public addCustomKey(rawKey: string, customName?: string): { success: boolean; key?: AIKeyEntry; message: string } {
    const trimmed = (rawKey || '').trim();
    if (!trimmed) {
      return { success: false, message: 'Key cannot be empty' };
    }

    // Check duplicate
    const existing = this.keys.find(k => k.rawKey.trim() === trimmed);
    if (existing) {
      return {
        success: true,
        key: this.toPublicEntry(existing),
        message: 'Key is already present in the pool.',
      };
    }

    const newKey: InternalKeyItem = {
      id: `key_custom_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      name: customName?.trim() || `Custom Pool Key #${this.keys.length + 1}`,
      rawKey: trimmed,
      source: 'custom',
      status: 'untested',
      failureCount: 0,
      successCount: 0,
      totalCalls: 0,
    };

    this.keys.push(newKey);
    if (!this.activeKeyId) {
      this.activeKeyId = newKey.id;
    }

    return {
      success: true,
      key: this.toPublicEntry(newKey),
      message: 'Custom key added to pool successfully.',
    };
  }

  /**
   * Remove a custom key
   */
  public removeCustomKey(keyId: string): { success: boolean; message: string } {
    const index = this.keys.findIndex(k => k.id === keyId);
    if (index === -1) {
      return { success: false, message: 'Key not found' };
    }

    const removed = this.keys.splice(index, 1)[0];
    this.clientCache.delete(removed.rawKey);

    if (this.activeKeyId === keyId) {
      const nextHealthy = this.keys.find(k => k.status === 'healthy' || k.status === 'untested');
      this.activeKeyId = nextHealthy ? nextHealthy.id : (this.keys[0]?.id || null);
    }

    return { success: true, message: 'Key removed from pool' };
  }

  /**
   * Set the active key manually
   */
  public setActiveKey(keyId: string): { success: boolean; message: string } {
    const key = this.keys.find(k => k.id === keyId);
    if (!key) {
      return { success: false, message: 'Key not found' };
    }
    this.activeKeyId = key.id;
    return { success: true, message: `Active key switched to ${key.name}` };
  }

  /**
   * Reset cooldown and error statuses
   */
  public resetKeyStatus(keyId?: string): { success: boolean; message: string } {
    if (keyId) {
      const key = this.keys.find(k => k.id === keyId);
      if (key) {
        key.status = 'healthy';
        key.exhaustedUntil = undefined;
        key.failureCount = 0;
        key.lastError = undefined;
      }
    } else {
      this.keys.forEach(k => {
        k.status = 'healthy';
        k.exhaustedUntil = undefined;
        k.failureCount = 0;
        k.lastError = undefined;
      });
    }
    return { success: true, message: 'Key statuses reset successfully' };
  }

  /**
   * Convert internal item to safe public AIKeyEntry
   */
  private toPublicEntry(item: InternalKeyItem): AIKeyEntry {
    const now = Date.now();
    let cooldownRemainingSeconds: number | undefined;
    if (item.exhaustedUntil && item.exhaustedUntil > now) {
      cooldownRemainingSeconds = Math.ceil((item.exhaustedUntil - now) / 1000);
    }

    return {
      id: item.id,
      name: item.name,
      masked: this.maskKey(item.rawKey),
      source: item.source,
      status: item.status,
      isActive: item.id === this.activeKeyId,
      failureCount: item.failureCount,
      successCount: item.successCount,
      totalCalls: item.totalCalls,
      lastUsedAt: item.lastUsedAt,
      lastTestedAt: item.lastTestedAt,
      lastError: item.lastError,
      latencyMs: item.latencyMs,
      cooldownRemainingSeconds,
    };
  }

  /**
   * Return the overall AI pool status
   */
  public getPoolStatus(): AIKeyPoolStatus {
    this.refreshCooldowns();

    const publicKeys = this.keys.map(k => this.toPublicEntry(k));
    const healthyCount = publicKeys.filter(k => k.status === 'healthy' || k.status === 'untested').length;
    const exhaustedCount = publicKeys.filter(k => k.status === 'exhausted').length;
    const errorCount = publicKeys.filter(k => k.status === 'error').length;

    return {
      activeKeyId: this.activeKeyId,
      totalKeys: publicKeys.length,
      healthyKeys: healthyCount,
      exhaustedKeys: exhaustedCount,
      errorKeys: errorCount,
      isFallbackMode: healthyCount === 0,
      keys: publicKeys,
    };
  }
}

export const aiKeyPool = new AIKeyPoolManager();
