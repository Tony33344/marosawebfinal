import React, { useState, useEffect, useCallback } from 'react';
import { 
  getFeatureFlags, 
  isFeatureEnabled, 
  FeatureFlag,
  toggleFeature,
  enableFeature,
  disableFeature
} from '../config/featureFlags';

/**
 * Hook to check if a single feature is enabled
 */
export function useFeatureFlag(featureId: string): boolean {
  const [enabled, setEnabled] = useState(() => isFeatureEnabled(featureId));

  useEffect(() => {
    // Re-check on storage changes (for cross-tab sync)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'kmetija_marosa_feature_flags') {
        setEnabled(isFeatureEnabled(featureId));
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [featureId]);

  return enabled;
}

/**
 * Hook to get multiple feature flags
 */
export function useFeatureFlags(featureIds: string[]): Record<string, boolean> {
  const [flags, setFlags] = useState<Record<string, boolean>>(() => {
    const result: Record<string, boolean> = {};
    featureIds.forEach(id => {
      result[id] = isFeatureEnabled(id);
    });
    return result;
  });

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'kmetija_marosa_feature_flags') {
        const result: Record<string, boolean> = {};
        featureIds.forEach(id => {
          result[id] = isFeatureEnabled(id);
        });
        setFlags(result);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [featureIds]);

  return flags;
}

/**
 * Hook for managing all feature flags
 */
export function useAllFeatureFlags() {
  const [flags, setFlags] = useState<FeatureFlag[]>(() => getFeatureFlags());

  const refresh = useCallback(() => {
    setFlags(getFeatureFlags());
  }, []);

  const toggle = useCallback((featureId: string) => {
    toggleFeature(featureId);
    refresh();
  }, [refresh]);

  const enable = useCallback((featureId: string) => {
    enableFeature(featureId);
    refresh();
  }, [refresh]);

  const disable = useCallback((featureId: string) => {
    disableFeature(featureId);
    refresh();
  }, [refresh]);

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'kmetija_marosa_feature_flags') {
        refresh();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [refresh]);

  return {
    flags,
    refresh,
    toggle,
    enable,
    disable,
    isEnabled: (id: string) => flags.find(f => f.id === id)?.enabled ?? false
  };
}

/**
 * Component wrapper that conditionally renders based on feature flag
 */
export function FeatureGate({ 
  feature, 
  children, 
  fallback = null 
}: { 
  feature: string; 
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const enabled = useFeatureFlag(feature);
  return enabled ? <>{children}</> : <>{fallback}</>;
}
