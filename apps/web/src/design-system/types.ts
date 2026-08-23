export type ThemeMode = 'light' | 'dark' | 'system';

export const ACCENT_PRESETS = [
  { id: 'indigo',  name: 'Indigo (Default)', hsl: '221 83% 53%', hslDark: '217 91% 60%' },
  { id: 'blue',    name: 'Ocean Blue',       hsl: '212 100% 48%', hslDark: '212 100% 60%' },
  { id: 'violet',  name: 'Modern Violet',    hsl: '262 83% 58%', hslDark: '263 70% 66%' },
  { id: 'emerald', name: 'Emerald',          hsl: '160 84% 39%', hslDark: '158 64% 52%' },
  { id: 'rose',    name: 'Rose',             hsl: '346 87% 53%', hslDark: '349 89% 62%' },
  { id: 'amber',   name: 'Amber',            hsl: '38 92% 50%',  hslDark: '43 96% 56%' },
] as const;

export type AccentId = (typeof ACCENT_PRESETS)[number]['id'];

export const RADIUS_PRESETS = [
  { id: 'sharp',   name: 'Sharp' },
  { id: 'rounded', name: 'Rounded' },
  { id: 'pill',    name: 'Pill' },
] as const;

export type RadiusId = (typeof RADIUS_PRESETS)[number]['id'];

export interface ThemeConfig {
  mode: ThemeMode;
  accent: AccentId;
  radius: RadiusId;
  reducedMotion: boolean;
}

export const DEFAULT_THEME: ThemeConfig = {
  mode: 'system',
  accent: 'indigo',
  radius: 'rounded',
  reducedMotion: false,
};