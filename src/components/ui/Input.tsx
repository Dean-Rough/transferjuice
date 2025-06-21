import { forwardRef, InputHTMLAttributes } from 'react';
import { clsx } from 'clsx';

export interface InputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  variant?: 'default' | 'error' | 'success';
  size?: 'sm' | 'md' | 'lg';
  error?: string;
  label?: string;
  helperText?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      variant = 'default',
      size = 'md',
      type = 'text',
      error,
      label,
      helperText,
      ...props
    },
    ref
  ) => {
    const inputVariant = error ? 'error' : variant;

    const baseClasses =
      'flex w-full rounded-lg border bg-secondary px-4 py-3 text-foreground placeholder-muted-foreground transition-colors duration-200 focus-visible:outline-none focus-visible:ring-1 disabled:cursor-not-allowed disabled:opacity-50';

    const variantClasses = {
      default:
        'border-border focus-visible:border-orange-500 focus-visible:ring-orange-500',
      error:
        'border-red-500 focus-visible:border-red-500 focus-visible:ring-red-500',
      success:
        'border-green-500 focus-visible:border-green-500 focus-visible:ring-green-500',
    };

    const sizeClasses = {
      sm: 'h-9 px-3 text-sm',
      md: 'h-11 px-4 text-base',
      lg: 'h-13 px-5 text-lg',
    };

    const combinedClassName = clsx(
      baseClasses,
      variantClasses[inputVariant],
      sizeClasses[size],
      className
    );

    return (
      <div className='space-y-2'>
        {label && (
          <label className='text-sm font-medium text-foreground'>
            {label}
            {props.required && <span className='text-red-500 ml-1'>*</span>}
          </label>
        )}
        <input type={type} className={combinedClassName} ref={ref} {...props} />
        {(error || helperText) && (
          <p
            className={`text-sm ${error ? 'text-red-500' : 'text-muted-foreground'}`}
          >
            {error || helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export { Input };
