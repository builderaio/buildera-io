import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { resources } from './resources';

const detectionOptions = {
  order: ['localStorage', 'navigator', 'htmlTag'],
  caches: ['localStorage'],
  lookupLocalStorage: 'i18nextLng',
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'es',
    supportedLngs: ['es', 'en', 'pt'],
    defaultNS: 'common',
    ns: [
      'common',
      'company',
      'landing',
      'auth',
      'dashboard',
      'marketing',
      'analytics',
      'campaigns',
      'admin',
      'errors',
      'validation',
      'notifications',
      'creatify',
      'legal',
      'pricing',
      'governance',
    ],
    detection: detectionOptions,
    initImmediate: false, // Synchronous init - prevents render before translations are ready
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
  });

export default i18n;
