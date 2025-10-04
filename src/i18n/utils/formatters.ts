import { useTranslation } from 'react-i18next';

export const useDateFormatter = () => {
  const { i18n } = useTranslation();

  const formatDate = (date: Date | string, options?: Intl.DateTimeFormatOptions) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const defaultOptions: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      ...options,
    };
    return new Intl.DateTimeFormat(i18n.language, defaultOptions).format(dateObj);
  };

  const formatTime = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat(i18n.language, {
      hour: '2-digit',
      minute: '2-digit',
    }).format(dateObj);
  };

  const formatDateTime = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat(i18n.language, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(dateObj);
  };

  return { formatDate, formatTime, formatDateTime };
};

export const useNumberFormatter = () => {
  const { i18n } = useTranslation();

  const formatNumber = (value: number, options?: Intl.NumberFormatOptions) => {
    return new Intl.NumberFormat(i18n.language, options).format(value);
  };

  const formatCurrency = (value: number, currency = 'USD') => {
    return new Intl.NumberFormat(i18n.language, {
      style: 'currency',
      currency,
    }).format(value);
  };

  const formatPercent = (value: number, decimals = 1) => {
    return new Intl.NumberFormat(i18n.language, {
      style: 'percent',
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(value / 100);
  };

  const formatCompact = (value: number) => {
    return new Intl.NumberFormat(i18n.language, {
      notation: 'compact',
      compactDisplay: 'short',
    }).format(value);
  };

  return { formatNumber, formatCurrency, formatPercent, formatCompact };
};
