import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface CardProps extends React.HTMLAttributes<HTMLElement> {
  as?: 'article' | 'section' | 'div' | 'aside' | 'li';
  hover?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const paddings = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8 md:p-10',
};

const Card = forwardRef<HTMLElement, CardProps>(
  ({ className, as: Tag = 'article', hover = false, padding = 'md', children, ...props }, ref) => {
    return (
      <Tag
        ref={ref as never}
        className={cn(
          'rounded-xl border border-border bg-card text-card-foreground shadow-sm transition-all duration-300',
          hover && 'hover:shadow-lg hover:border-accent/20 hover:-translate-y-0.5',
          paddings[padding],
          className,
        )}
        {...props}
      >
        {children}
      </Tag>
    );
  },
);
Card.displayName = 'Card';

export { Card, type CardProps };