import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface ThemeState {
  theme: 'dark' | 'light' | 'system';
  accentColor: string;
  setTheme: (theme: 'dark' | 'light' | 'system') => void;
  setAccentColor: (color: string) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: 'dark',
      accentColor: '#6366f1', // Indigo primary
      setTheme: (theme) => {
        set({ theme });
        if (theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      },
      setAccentColor: (accentColor) => {
        set({ accentColor });
        document.documentElement.style.setProperty('--color-accent', accentColor);
      },
    }),
    {
      name: 'flowshare_theme',
    }
  )
);
