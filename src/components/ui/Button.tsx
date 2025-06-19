import { forwardRef, ButtonHTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-lg font-mono font-semibold tracking-wide transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange-500 focus-visible:ring-offset-2 focus-visible:ring-offset-dark-bg disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        primary:
          'bg-orange-gradient text-brand-black hover:shadow-glow focus-visible:shadow-glow-lg transform hover:scale-105 active:scale-95',
        secondary:
          'bg-dark-surface border border-dark-border text-dark-text-primary hover:bg-dark-border hover:border-brand-orange-500 focus-visible:border-brand-orange-500',
        ghost:
          'text-dark-text-secondary hover:text-dark-text-primary hover:bg-dark-surface',
        outline:
          'border border-brand-orange-500 text-brand-orange-500 hover:bg-brand-orange-500 hover:text-brand-black',
        destructive: 'bg-red-600 text-white hover:bg-red-700',
        link: 'text-brand-orange-500 underline-offset-4 hover:underline',
      },
      size: {
        sm: 'h-9 px-4 text-sm',
        md: 'h-11 px-6 text-base',
        lg: 'h-13 px-8 text-lg',
        xl: 'h-16 px-10 text-xl',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant, size, loading = false, children, disabled, ...props },
    ref
  ) => {
    const isDisabled = disabled || loading;

    return (
      <button
        className={buttonVariants({ variant, size, className })}
        ref={ref}
        disabled={isDisabled}
        style={{
          minHeight:
            size === 'xl'
              ? '4rem'
              : size === 'lg'
                ? '3.25rem'
                : size === 'md'
                  ? '2.75rem'
                  : '2.25rem',
        }}
        {...props}
      >
        {loading && (
          <svg
            className='mr-2 h-4 w-4 animate-spin'
            fill='none'
            viewBox='0 0 24 24'
            xmlns='http://www.w3.org/2000/svg'
            aria-hidden='true'
          >
            <circle
              className='opacity-25'
              cx='12'
              cy='12'
              r='10'
              stroke='currentColor'
              strokeWidth='4'
            />
            <path
              className='opacity-75'
              d='m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
              fill='currentColor'
            />
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

export { Button, buttonVariants };
