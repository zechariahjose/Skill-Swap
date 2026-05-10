import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import { Colors } from '../constants/Colors';

type ThemeMode = 'light' | 'dark';

const lightPalette: typeof Colors = {
  ...Colors,
};

const darkPalette: typeof Colors = {
  background: '#0B1221',
  paper: '#0B1221',
  surface: '#141C2E',
  softSurface: '#1E2940',
  border: '#34415B',
  muted: '#9AA8C4',
  body: '#E6EAF3',
  ink: '#F8FAFF',
  accent: '#8EA8FF',
  accentSurface: '#2A3B6E',
  statusGreen: '#7FD1B8',
  statusRed: '#F38E99',
  statusPending: '#8E9ACA',
  white: '#FFFFFF',
  overlay: 'rgba(255,255,255,0.10)',
  cream: '#0B1221',
  terracotta: '#8EA8FF',
  sage: '#84E1C5',
  charcoal: '#E6EAF3',
  sand: '#1B243B',
  sandDark: '#162038',
  tabActive: '#F8FAFF',
  tabInactive: '#8E9ACA',
  pendingBg: '#172039',
  acceptedBg: '#172039',
  rejectedBg: '#172039',
  completedBg: '#172039',
  base: '#F8FAFF',
  surface2: '#1E2940',
  subtle: '#34415B',
  accentDim: '#1F2B47',
  accentLight: '#1F2B47',
  blush: '#1F2B47',
  forest: '#84E1C5',
  marigold: '#8EA8FF',
  lavender: '#8EA8FF',
  clay: '#8EA8FF',
};

type ThemeContextValue = {
  themeMode: ThemeMode;
  colors: typeof Colors;
  setThemeMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue>({
  themeMode: 'light',
  colors: lightPalette,
  setThemeMode: () => {},
  toggleTheme: () => {},
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themeMode, setThemeMode] = useState<ThemeMode>('light');
  const colors = useMemo(() => (themeMode === 'dark' ? darkPalette : lightPalette), [themeMode]);

  const toggleTheme = () => setThemeMode((mode) => (mode === 'dark' ? 'light' : 'dark'));

  return (
    <ThemeContext.Provider value={{ themeMode, colors, setThemeMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
