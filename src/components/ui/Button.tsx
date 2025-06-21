import { forwardRef, ButtonHTMLAttributes } from 'react';
import { clsx } from 'clsx';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:
    | 'primary'
    | 'secondary'
    | 'ghost'
    | 'outline'
    | 'destructive'
    | 'link';
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'icon';
  loading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      loading = false,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading;

    const baseClasses =
      'inline-flex items-center justify-center rounded-full font-mono font-semibold tracking-wide transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50';

    const variantClasses = {
      primary:
        'bg-orange-600 text-white hover:bg-orange-700 transform hover:scale-105 active:scale-95',
      secondary:
        'bg-secondary border border-border text-foreground hover:bg-muted hover:border-orange-500',
      ghost: 'text-muted-foreground hover:text-foreground hover:bg-muted',
      outline:
        'border border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-black',
      destructive: 'bg-red-600 text-white hover:bg-red-700',
      link: 'text-orange-500 underline-offset-4 hover:underline',
    };

    const sizeClasses = {
      sm: 'h-9 px-4 text-sm',
      md: 'h-11 px-6 text-base',
      lg: 'h-13 px-8 text-lg',
      xl: 'h-16 px-10 text-xl',
      icon: 'h-10 w-10',
    };

    const combinedClassName = clsx(
      baseClasses,
      variantClasses[variant],
      sizeClasses[size],
      className
    );

    return (
      <button
        className={combinedClassName}
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

export { Button };
