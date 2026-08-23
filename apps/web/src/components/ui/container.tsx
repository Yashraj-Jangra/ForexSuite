import { cn } from '@/lib/utils';

interface ContainerProps extends React.HTMLAttributes<HTMLElement> {
  as?: 'main' | 'section' | 'article' | 'header' | 'footer' | 'nav' | 'div';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

const widths = {
  xs: 'max-w-md',
  sm: 'max-w-3xl',
  md: 'max-w-5xl',
  lg: 'max-w-6xl',
  xl: 'max-w-7xl',
  full: '',
};

export function Container({ className, as: Tag = 'section', size = 'lg', children, ...props }: ContainerProps) {
  return (
    <Tag
      className={cn('mx-auto w-full px-4 sm:px-6 lg:px-8', widths[size], className)}
      {...props}
    >
      {children}
    </Tag>
  );
}