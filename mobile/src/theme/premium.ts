import type { ThemeColors } from './colors';

export type PremiumTokens = {
  isDark: boolean;
  backgroundColors: string[];
  cardBorder: string;
  cardSurface: string;
  stripeColors: string[];
  shadowOpacity: number;
};

export const getPremiumTokens = (colors: ThemeColors, mode: 'light' | 'dark'): PremiumTokens => {
  const isDark = mode === 'dark';
  return {
    isDark,
    backgroundColors: isDark ? ['#0A0F1C', '#101A2E', '#0C1323'] : ['#F7F4F0', '#EEF2F7', '#F7FAFF'],
    cardBorder: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(15,23,42,0.1)',
    cardSurface: isDark ? 'rgba(12, 18, 30, 0.9)' : 'rgba(255, 255, 255, 0.92)',
    stripeColors: isDark
      ? ['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.03)', 'rgba(255,255,255,0.1)']
      : ['rgba(15, 23, 42, 0.07)', 'rgba(15, 23, 42, 0.025)', 'rgba(15, 23, 42, 0.07)'],
    shadowOpacity: isDark ? 0.22 : 0.1,
  };
};
