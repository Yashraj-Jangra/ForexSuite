import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatHSL(h: number, s: number, l: number) {
  return `${h} ${s}% ${l}%`;
}