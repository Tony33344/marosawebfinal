import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { slovenian } from './languages/sl'; // Default language
import { english } from './languages/en';
import { croatian } from './languages/hr';
import { german } from './languages/de';

// Initialize i18next
i18n
  .use(initReactI18next) // passes i18n down to react-i18next
  .use(LanguageDetector) // detect user language
  .init({
    resources: {
      // Include all languages in the initial load for simplicity
      sl: { translation: slovenian },
      en: { translation: english },
      hr: { translation: croatian },
      de: { translation: german }
    },
    fallbackLng: 'sl', // default language if detection fails
    supportedLngs: ['sl', 'hr', 'de', 'en'], // available languages
    interpolation: {
      escapeValue: false, // react already safes from xss
    },
    detection: {
      // order and from where user language should be detected
      order: ['localStorage', 'navigator', 'querystring', 'cookie', 'htmlTag', 'path', 'subdomain'],
      // keys or params to lookup language from
      lookupQuerystring: 'lang',
      lookupCookie: 'i18next',
      lookupLocalStorage: 'i18nextLng',
      lookupFromPathIndex: 0,
      lookupFromSubdomainIndex: 0,
      // cache user language on
      caches: ['localStorage'], // cache language preference in localStorage
    },
    load: 'languageOnly', // Only load the language code, not the region (e.g. 'en' instead of 'en-US')
    ns: ['translation'], // Use 'translation' namespace by default
    defaultNS: 'translation',
    saveMissing: import.meta.env.DEV, // Save missing translations in development mode
    missingKeyHandler: (lng, _ns, key, _fallbackValue) => {
      if (import.meta.env.DEV) {
        console.warn(`Missing translation: ${key} (${lng})`);
      }
    },
  });

// Set up language change listener to load database translations if available
i18n.on('languageChanged', async (language) => {
  try {
    // Only try to load from database in production
    if (import.meta.env.PROD) {
      // Dynamically import the translation service to avoid circular dependencies
      const { default: translationService } = await import('../services/translationService');

      // Load translations for the new language
      await translationService.loadTranslations(language);
    }
  } catch (error) {
    console.error(`Error loading translations for ${language}:`, error);
  }
});

// Log the current language for debugging
if (import.meta.env.DEV) {
  console.log('Current language:', i18n.language);
  console.log('Available languages:', i18n.languages);
}

export default i18n;
