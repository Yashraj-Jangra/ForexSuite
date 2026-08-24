'use client';

import { cn } from '@/lib/utils';
import { ILLUSTRATIONS, type IllustrationName } from '@/illustrations';

export interface IllustrationProps {
  name: IllustrationName;
  alt?: string;
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'hero' | 'avatar';
  float?: boolean;
  width?: number;
  height?: number;
}

const SIZE_CLASSES = {
  avatar: 'size-10 sm:size-12 object-contain',
  xs: 'w-16 h-16 object-contain',
  sm: 'w-28 h-28 object-contain',
  md: 'w-44 h-44 sm:w-52 sm:h-52 object-contain',
  lg: 'w-60 h-60 sm:w-72 sm:h-72 object-contain',
  xl: 'w-80 h-80 sm:w-96 sm:h-96 object-contain',
  hero: 'w-full max-w-lg h-auto max-h-[380px] object-contain',
};

export function Illustration({
  name,
  alt = '',
  className,
  size = 'md',
  float = false,
  width,
  height,
}: IllustrationProps) {
  const src = ILLUSTRATIONS[name] || ILLUSTRATIONS.empty;

  return (
    <img
      src={src}
      alt={alt || `${name} illustration`}
      width={width}
      height={height}
      loading="lazy"
      className={cn(
        'select-none pointer-events-none transition-all duration-300',
        SIZE_CLASSES[size],
        float && 'animate-float',
        className,
      )}
      onError={(e) => {
        const el = e.currentTarget;
        el.style.opacity = '0';
      }}
    />
  );
}