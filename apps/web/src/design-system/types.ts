export type ThemeMode = 'light' | 'dark' | 'system';

export const ACCENT_PRESETS = [
  { id: 'sage',    name: 'Sage',    hsl: '155 40% 35%', hslDark: '155 50% 48%' },
  { id: 'mint',    name: 'Mint',    hsl: '160 55% 40%', hslDark: '160 50% 50%' },
  { id: 'teal',    name: 'Teal',    hsl: '175 50% 38%', hslDark: '175 45% 48%' },
  { id: 'olive',   name: 'Olive',   hsl: '65 30% 35%',  hslDark: '65 30% 47%'  },
  { id: 'forest',  name: 'Forest',  hsl: '145 35% 28%', hslDark: '145 38% 40%' },
  { id: 'emerald', name: 'Emerald', hsl: '150 50% 42%', hslDark: '150 45% 52%' },
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
  accent: 'sage',
  radius: 'rounded',
  reducedMotion: false,
};