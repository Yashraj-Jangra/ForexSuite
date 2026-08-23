import { cn } from '@/lib/utils';

interface DividerProps extends React.HTMLAttributes<HTMLHRElement> {
  label?: string;
}

export function Divider({ className, label, ...props }: DividerProps) {
  if (label) {
    return (
      <fieldset className={cn('flex items-center gap-4', className)}>
        <hr className="flex-1 border-t border-border" {...props} />
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        <hr className="flex-1 border-t border-border" {...props} />
      </fieldset>
    );
  }

  return <hr className={cn('border-t border-border', className)} {...props} />;
}