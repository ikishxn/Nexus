import { ButtonHTMLAttributes, forwardRef, HTMLAttributes, ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../lib/cn';

/* ----------------------------------------------------------------------- */
/* Button                                                                   */
/* ----------------------------------------------------------------------- */

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  icon?: ReactNode;
}

const buttonVariantClasses: Record<ButtonVariant, string> = {
  primary: cn(
    'bg-rose-600 text-white shadow-sm shadow-rose-600/20',
    'hover:bg-rose-500 active:bg-rose-700',
    'disabled:bg-rose-300 disabled:shadow-none',
    'dark:bg-rose-500 dark:shadow-none dark:hover:bg-rose-400 dark:active:bg-rose-600',
    'dark:disabled:bg-rose-500/30 dark:disabled:text-white/40',
  ),
  secondary: cn(
    'bg-white text-zinc-700 border border-zinc-200 shadow-sm',
    'hover:bg-zinc-50 hover:border-zinc-300 active:bg-zinc-100',
    'disabled:text-zinc-300 disabled:bg-zinc-50',
    'dark:bg-white/5 dark:text-zinc-200 dark:border-white/10 dark:shadow-none',
    'dark:hover:bg-white/10 dark:hover:border-white/20 dark:active:bg-white/[0.15]',
    'dark:disabled:text-white/20 dark:disabled:bg-white/[0.03]',
  ),
  ghost: cn(
    'bg-transparent text-zinc-600 hover:bg-zinc-100 active:bg-zinc-200',
    'disabled:text-zinc-300',
    'dark:text-zinc-300 dark:hover:bg-white/10 dark:active:bg-white/[0.15]',
    'dark:disabled:text-white/20',
  ),
  danger: cn(
    'bg-white text-red-600 border border-red-200 shadow-sm',
    'hover:bg-red-50 hover:border-red-300 active:bg-red-100',
    'dark:bg-white/5 dark:text-red-400 dark:border-red-500/20 dark:hover:bg-red-500/10',
  ),
};

const buttonSizeClasses: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-xs gap-1.5 rounded-lg',
  md: 'h-10 px-4 text-sm gap-2 rounded-lg',
  lg: 'h-12 px-6 text-base gap-2 rounded-xl',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { variant = 'primary', size = 'md', isLoading = false, icon, disabled, className, children, ...rest },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          'inline-flex items-center justify-center font-medium whitespace-nowrap',
          'transition-colors duration-150 disabled:cursor-not-allowed',
          buttonVariantClasses[variant],
          buttonSizeClasses[size],
          className,
        )}
        {...rest}
      >
        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : icon}
        {children}
      </button>
    );
  },
);
Button.displayName = 'Button';

/* ----------------------------------------------------------------------- */
/* Card                                                                     */
/* ----------------------------------------------------------------------- */

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padding?: 'none' | 'sm' | 'md' | 'lg';
  interactive?: boolean;
}

const cardPaddingClasses: Record<NonNullable<CardProps['padding']>, string> = {
  none: '',
  sm: 'p-4',
  md: 'p-5',
  lg: 'p-7',
};

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ padding = 'md', interactive = false, className, children, ...rest }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'rounded-2xl bg-white border border-zinc-200 shadow-sm',
          'dark:bg-surface-raised dark:border-white/10 dark:shadow-none',
          interactive &&
            cn(
              'transition-all duration-150 cursor-pointer',
              'hover:border-rose-300 hover:shadow-md',
              'dark:hover:border-white/20 dark:hover:bg-white/[0.03]',
            ),
          cardPaddingClasses[padding],
          className,
        )}
        {...rest}
      >
        {children}
      </div>
    );
  },
);
Card.displayName = 'Card';

export function CardHeader({ className, children, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('mb-4 flex items-start justify-between gap-3', className)} {...rest}>
      {children}
    </div>
  );
}

export function CardTitle({ className, children, ...rest }: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn('text-base font-semibold text-zinc-900 dark:text-white', className)}
      {...rest}
    >
      {children}
    </h3>
  );
}

export function CardFooter({ className, children, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'mt-5 flex items-center gap-2 border-t border-zinc-100 pt-4',
        'dark:border-white/10',
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}
