'use client';

import { forwardRef } from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cn } from '@/lib/utils';

const variants = {
  primary:
    'bg-primary text-primary-foreground hover:brightness-110 active:brightness-95 shadow-sm',
  secondary:
    'bg-secondary text-secondary-foreground hover:brightness-95 active:brightness-90',
  outline:
    'border border-input bg-transparent hover:bg-accent-soft hover:border-accent/40',
  ghost: 'hover:bg-accent-soft text-muted-foreground hover:text-foreground',
  destructive:
    'bg-destructive text-destructive-foreground hover:brightness-110',
  link: 'text-primary underline-offset-4 hover:underline p-0 h-auto',
} as const;

const sizes = {
  sm: 'h-9 px-3 text-sm gap-1.5 [&>svg]:size-3.5',
  md: 'h-10 px-4 text-sm gap-2 [&>svg]:size-4',
  lg: 'h-12 px-6 text-base gap-2 [&>svg]:size-5',
  xl: 'h-14 px-8 text-lg gap-3 [&>svg]:size-5',
  icon: 'h-10 w-10 p-0',
} as const;

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
  asChild?: boolean;
  loading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', asChild = false, loading, disabled, children, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    const content = (
      <>
        {loading && (
          <svg
            className="animate-spin shrink-0"
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
          </svg>
        )}
        {children}
      </>
    );
    return (
      <Comp
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          'inline-flex items-center justify-center whitespace-nowrap rounded-full font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
          variants[variant],
          sizes[size],
          className,
        )}
        {...props}
      >
        {asChild ? children : content}
      </Comp>
    );
  },
);
Button.displayName = 'Button';

export { Button, type ButtonProps };