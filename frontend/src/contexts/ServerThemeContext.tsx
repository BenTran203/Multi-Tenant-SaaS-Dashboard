/**
 * SERVER THEME CONTEXT
 */

import { createContext, useContext, useState, ReactNode } from 'react';
import { Server } from '../types';

// Theme color definitions
const THEME_COLORS = {
  nature: {
    primary: '#10b981',  
    secondary: '#059669', 
    accent: '#047857',   
    light: '#d1fae5',    
    dark: '#064e3b',     
    bg: '#f0fdf4',       
    surface: '#dcfce7',   

    darkBg: '#0a2e1f',    
    darkSurface: '#0f3a27', 
  },
  ocean: {
    primary: '#3b82f6',   
    secondary: '#2563eb',
    accent: '#1d4ed8',    
    light: '#dbeafe',  
    dark: '#1e3a8a',     
    bg: '#eff6ff',        
    surface: '#dbeafe',   
  
    darkBg: '#0c1e3a',    
    darkSurface: '#122a4a', 
  },
  sunset: {
    primary: '#f97316',   
    secondary: '#ea580c',
    accent: '#c2410c',    
    light: '#ffedd5', 
    dark: '#7c2d12',    
    bg: '#fff7ed',        
    surface: '#ffedd5', 
 
    darkBg: '#2d1a0a',   
    darkSurface: '#3d2415',
  },
};

interface ServerThemeContextType {
  currentTheme: string;
  setServerTheme: (theme: string) => void;
  applyTheme: (server: Server | null) => void;
}

const ServerThemeContext = createContext<ServerThemeContextType | undefined>(undefined);

export function ServerThemeProvider({ children }: { children: ReactNode }) {
  const [currentTheme, setCurrentTheme] = useState('nature');

  /**
   * Apply CSS variables based on theme
   */
  const applyTheme = (server: Server | null) => {
    const themeName = server?.theme || 'nature';
    setCurrentTheme(themeName);

    const colors = THEME_COLORS[themeName as keyof typeof THEME_COLORS] || THEME_COLORS.nature;

    // Apply CSS custom properties to root
    document.documentElement.style.setProperty('--color-theme-primary', colors.primary);
    document.documentElement.style.setProperty('--color-theme-secondary', colors.secondary);
    document.documentElement.style.setProperty('--color-theme-accent', colors.accent);
    document.documentElement.style.setProperty('--color-theme-light', colors.light);
    document.documentElement.style.setProperty('--color-theme-dark', colors.dark);
    document.documentElement.style.setProperty('--color-theme-bg', colors.bg);
    document.documentElement.style.setProperty('--color-theme-surface', colors.surface);
    document.documentElement.style.setProperty('--color-theme-dark-bg', colors.darkBg);
    document.documentElement.style.setProperty('--color-theme-dark-surface', colors.darkSurface);
  };

  const setServerTheme = (theme: string) => {
    setCurrentTheme(theme);
    const colors = THEME_COLORS[theme as keyof typeof THEME_COLORS] || THEME_COLORS.nature;

    document.documentElement.style.setProperty('--color-theme-primary', colors.primary);
    document.documentElement.style.setProperty('--color-theme-secondary', colors.secondary);
    document.documentElement.style.setProperty('--color-theme-accent', colors.accent);
    document.documentElement.style.setProperty('--color-theme-light', colors.light);
    document.documentElement.style.setProperty('--color-theme-dark', colors.dark);
    document.documentElement.style.setProperty('--color-theme-bg', colors.bg);
    document.documentElement.style.setProperty('--color-theme-surface', colors.surface);
    document.documentElement.style.setProperty('--color-theme-dark-bg', colors.darkBg);
    document.documentElement.style.setProperty('--color-theme-dark-surface', colors.darkSurface);
  };

  return (
    <ServerThemeContext.Provider value={{ currentTheme, setServerTheme, applyTheme }}>
      {children}
    </ServerThemeContext.Provider>
  );
}

export function useServerTheme() {
  const context = useContext(ServerThemeContext);
  if (!context) {
    throw new Error('useServerTheme must be used within ServerThemeProvider');
  }
  return context;
}
