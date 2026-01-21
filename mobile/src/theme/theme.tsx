import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { getThemeColors, LIGHT_COLORS, ThemeColors } from './colors';

export type ThemeMode = 'light' | 'dark' | 'system';

type ThemeContextValue = {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  colors: ThemeColors;
  resolvedMode: 'light' | 'dark';
};

const THEME_STORAGE_KEY = 'ui_theme_mode';

const ThemeContext = createContext<ThemeContextValue>({
  mode: 'system',
  setMode: () => undefined,
  colors: LIGHT_COLORS,
  resolvedMode: 'light',
});

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const systemScheme = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>('system');

  useEffect(() => {
    let isActive = true;
    const loadMode = async () => {
      try {
        const stored = await SecureStore.getItemAsync(THEME_STORAGE_KEY);
        if (!isActive || !stored) {
          return;
        }
        if (stored === 'light' || stored === 'dark' || stored === 'system') {
          setModeState(stored);
        }
      } catch {
        // ignore persistence failures
      }
    };
    void loadMode();
    return () => {
      isActive = false;
    };
  }, []);

  const setMode = useCallback((next: ThemeMode) => {
    setModeState(next);
    void SecureStore.setItemAsync(THEME_STORAGE_KEY, next);
  }, []);

  const resolvedMode = mode === 'system' ? (systemScheme === 'dark' ? 'dark' : 'light') : mode;
  const colors = useMemo(() => getThemeColors(resolvedMode), [resolvedMode]);

  const value = useMemo(
    () => ({ mode, setMode, colors, resolvedMode }),
    [mode, setMode, colors, resolvedMode]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => useContext(ThemeContext);
