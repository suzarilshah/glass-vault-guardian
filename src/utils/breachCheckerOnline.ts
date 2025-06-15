import { supabase } from '@/integrations/supabase/client';

interface OnlineBreachResult {
  isBreached: boolean;
  severity: 'low' | 'medium' | 'high';
  message: string;
  source: 'azure' | 'local';
  passwordsChecked?: number;
}

// Cache interface
interface CacheEntry {
  result: OnlineBreachResult;
  timestamp: number;
}

const CACHE_KEY = 'password_breach_cache';
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

class BreachCache {
  private getCache(): Map<string, CacheEntry> {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const entries = JSON.parse(cached);
        return new Map(Object.entries(entries));
      }
    } catch (error) {
      console.warn('Failed to load breach cache:', error);
    }
    return new Map();
  }

  private saveCache(cache: Map<string, CacheEntry>): void {
    try {
      const entries = Object.fromEntries(cache);
      localStorage.setItem(CACHE_KEY, JSON.stringify(entries));
    } catch (error) {
      console.warn('Failed to save breach cache:', error);
    }
  }

  get(password: string): OnlineBreachResult | null {
    const cache = this.getCache();
    const key = this.hashPassword(password);
    const entry = cache.get(key);
    
    if (entry && Date.now() - entry.timestamp < CACHE_TTL) {
      return entry.result;
    }
    
    if (entry) {
      // Remove expired entry
      cache.delete(key);
      this.saveCache(cache);
    }
    
    return null;
  }

  set(password: string, result: OnlineBreachResult): void {
    const cache = this.getCache();
    const key = this.hashPassword(password);
    
    cache.set(key, {
      result,
      timestamp: Date.now()
    });
    
    // Cleanup old entries (keep max 1000)
    if (cache.size > 1000) {
      const entries = Array.from(cache.entries());
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
      
      const toKeep = entries.slice(-800); // Keep newest 800
      cache.clear();
      toKeep.forEach(([k, v]) => cache.set(k, v));
    }
    
    this.saveCache(cache);
  }

  private hashPassword(password: string): string {
    // Simple hash for caching (not for security)
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
      const char = password.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString();
  }
}

const cache = new BreachCache();

export const checkPasswordBreachOnline = async (password: string): Promise<OnlineBreachResult> => {
  if (!password || password.length === 0) {
    return {
      isBreached: false,
      severity: 'low',
      message: 'Enter a password to check',
      source: 'local'
    };
  }

  // Check cache first
  const cached = cache.get(password);
  if (cached) {
    return cached;
  }

  try {
    console.log('Checking password breach online...');
    
    const { data, error } = await supabase.functions.invoke('check-password-breach', {
      body: { password }
    });

    if (error) {
      console.warn('Online breach check failed:', error);
      throw error;
    }

    if (data?.isBreached !== undefined) {
      const result: OnlineBreachResult = {
        isBreached: data.isBreached,
        severity: data.isBreached ? 'high' : 'low',
        message: data.isBreached 
          ? 'This password appears in the rockyou breach database and has been compromised'
          : 'Password not found in breach databases',
        source: 'azure',
        passwordsChecked: 14000000 // 14M+ from rockyou2024
      };

      // Cache the result
      cache.set(password, result);
      return result;
    }

    throw new Error('Invalid response from breach check service');

  } catch (error) {
    console.warn('Online breach check failed, will fallback to local:', error);
    throw error;
  }
};
