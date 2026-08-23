'use client';

import { cn } from '@/lib/utils';
import { ILLUSTRATIONS, type IllustrationName } from '@/illustrations';

interface IllustrationProps {
  name: IllustrationName;
  alt?: string;
  className?: string;
  width?: number;
  height?: number;
}

export function Illustration({ name, alt = '', className, width, height }: IllustrationProps) {
  const src = ILLUSTRATIONS[name];

  return (
    <img
      src={src}
      alt={alt}
      width={width}
      height={height}
      loading="lazy"
      className={cn('select-none pointer-events-none', className)}
      onError={(e) => {
        const el = e.currentTarget;
        el.style.display = 'none';
      }}
    />
  );
}