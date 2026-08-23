import { cn } from '@/lib/utils';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'soft' | 'outline' | 'success' | 'warning' | 'destructive';
}

const variantStyles = {
  default: 'bg-primary text-primary-foreground',
  soft: 'bg-accent-soft text-accent-soft-foreground',
  outline: 'border border-input bg-transparent text-muted-foreground',
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/10 text-warning',
  destructive: 'bg-destructive/10 text-destructive',
};

export function Badge({ className, variant = 'soft', children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors',
        variantStyles[variant],
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}