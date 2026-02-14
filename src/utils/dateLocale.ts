import { es } from 'date-fns/locale';
import { enUS } from 'date-fns/locale';
import { ptBR } from 'date-fns/locale';
import type { Locale } from 'date-fns';
import i18n from '@/i18n/config';

const localeMap: Record<string, Locale> = {
  es,
  en: enUS,
  pt: ptBR,
};

export const getDateLocale = (): Locale => {
  const lang = i18n.language?.substring(0, 2) || 'es';
  return localeMap[lang] || es;
};
