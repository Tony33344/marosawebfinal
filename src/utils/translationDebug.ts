import i18n from '../i18n';

/**
 * Utility for debugging translation issues
 */

/**
 * Check for missing translations in the current language
 * @param keys Array of translation keys to check
 * @returns Object with missing keys and their counts
 */
export const checkMissingTranslations = (
  keys: string[] = []
): { missing: string[], total: number, missingCount: number } => {
  const currentLanguage = i18n.language;
  
  // If no keys provided, try to extract from the translation resources
  const keysToCheck = keys.length > 0 
    ? keys 
    : extractAllTranslationKeys();
  
  // Check which keys are missing
  const missing = keysToCheck.filter(key => {
    // Check if the key exists in the current language
    return !i18n.exists(key, { lng: currentLanguage });
  });
  
  return {
    missing,
    total: keysToCheck.length,
    missingCount: missing.length
  };
};

/**
 * Extract all translation keys from the default language
 * @returns Array of all translation keys
 */
export const extractAllTranslationKeys = (): string[] => {
  // Get the default language resources
  const defaultLanguage = i18n.options.fallbackLng as string;
  const resources = i18n.getResourceBundle(defaultLanguage, 'translation');
  
  if (!resources) {
    console.warn('No translation resources found for the default language');
    return [];
  }
  
  // Extract keys recursively
  return extractKeysFromObject(resources);
};

/**
 * Recursively extract keys from a nested object
 * @param obj The object to extract keys from
 * @param prefix The prefix for nested keys
 * @returns Array of keys
 */
const extractKeysFromObject = (
  obj: any, 
  prefix: string = ''
): string[] => {
  if (!obj || typeof obj !== 'object') {
    return [];
  }
  
  let keys: string[] = [];
  
  Object.entries(obj).forEach(([key, value]) => {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    
    if (typeof value === 'object' && value !== null) {
      // Recursively extract keys from nested objects
      keys = [...keys, ...extractKeysFromObject(value, fullKey)];
    } else {
      // Add leaf node keys
      keys.push(fullKey);
    }
  });
  
  return keys;
};

/**
 * Log missing translations to the console
 * @param language The language to check (defaults to current language)
 */
export const logMissingTranslations = (language?: string): void => {
  const currentLanguage = language || i18n.language;
  i18n.changeLanguage(currentLanguage);
  
  const { missing, total, missingCount } = checkMissingTranslations();
  
  console.group(`Translation Status for ${currentLanguage}`);
  console.log(`Total keys: ${total}`);
  console.log(`Missing translations: ${missingCount} (${Math.round(missingCount / total * 100)}%)`);
  
  if (missing.length > 0) {
    console.group('Missing keys:');
    missing.forEach(key => {
      console.log(`- ${key}`);
    });
    console.groupEnd();
  }
  
  console.groupEnd();
};

/**
 * Compare translation coverage between languages
 * @returns Object with coverage statistics for each language
 */
export const compareTranslationCoverage = (): Record<string, { 
  total: number, 
  missing: number, 
  coverage: number 
}> => {
  const supportedLanguages = i18n.options.supportedLngs || [];
  const allKeys = extractAllTranslationKeys();
  const result: Record<string, { total: number, missing: number, coverage: number }> = {};
  
  supportedLanguages.forEach(lang => {
    if (typeof lang === 'string' && lang !== 'cimode') {
      const missing = allKeys.filter(key => !i18n.exists(key, { lng: lang }));
      
      result[lang] = {
        total: allKeys.length,
        missing: missing.length,
        coverage: Math.round((allKeys.length - missing.length) / allKeys.length * 100)
      };
    }
  });
  
  return result;
};

/**
 * Highlight missing translations in the UI (development mode only)
 * @param enable Whether to enable highlighting
 */
export const highlightMissingTranslations = (enable: boolean = true): void => {
  if (!import.meta.env.DEV) {
    console.warn('Translation highlighting is only available in development mode');
    return;
  }
  
  if (enable) {
    // Override the t function to highlight missing translations
    const originalT = i18n.t.bind(i18n);
    
    (i18n as any).t = (key: string, options?: any) => {
      const translation = originalT(key, options);
      
      // Check if this is a missing translation (equals the key or fallback)
      const isMissing = translation === key || 
        (options?.defaultValue && translation === options.defaultValue);
      
      if (isMissing) {
        // Return a special format for missing translations
        return `[MISSING: ${key}]`;
      }
      
      return translation;
    };
    
    console.log('Missing translation highlighting enabled');
  } else {
    // Restore the original t function
    (i18n as any).t = i18n.t.bind(i18n);
    console.log('Missing translation highlighting disabled');
  }
};
