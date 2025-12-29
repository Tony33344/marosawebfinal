import i18n from 'i18next';

/**
 * Lazy loads translations for a specific language
 * This helps reduce the initial bundle size by only loading
 * the translations that are needed
 */
export const loadLanguageAsync = async (language: string): Promise<void> => {
  // Skip if the language is already loaded
  if (i18n.hasResourceBundle(language, 'translation')) {
    return;
  }

  try {
    let translations;

    // Dynamically import the language file
    switch (language) {
      case 'en': {
        const { english } = await import('./languages/en');
        translations = english;
        break;
      }
      case 'sl': {
        const { slovenian } = await import('./languages/sl');
        translations = slovenian;
        break;
      }
      case 'hr': {
        const { croatian } = await import('./languages/hr');
        translations = croatian;
        break;
      }
      case 'de': {
        const { german } = await import('./languages/de');
        translations = german;
        break;
      }
      default:
        console.warn(`Language ${language} is not supported for lazy loading`);
        return;
    }

    // Add the translations to i18next
    i18n.addResourceBundle(language, 'translation', translations);
    console.log(`Loaded translations for ${language}`);
  } catch (error) {
    console.error(`Failed to load translations for ${language}:`, error);
  }
};

/**
 * Hook up the language change event to lazy load translations
 */
export const setupLazyLoading = (): void => {
  // Pre-load the current language
  const currentLanguage = i18n.language;
  if (currentLanguage) {
    loadLanguageAsync(currentLanguage);
  }

  // Set up listener for language changes
  i18n.on('languageChanged', (newLanguage) => {
    loadLanguageAsync(newLanguage);
  });
};
