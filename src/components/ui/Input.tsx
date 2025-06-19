import { forwardRef, InputHTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

const inputVariants = cva(
  'flex w-full rounded-lg border bg-dark-surface px-4 py-3 text-dark-text-primary placeholder-dark-text-muted transition-colors duration-200 focus-visible:outline-none focus-visible:ring-1 disabled:cursor-not-allowed disabled:opacity-50',
  {
    variants: {
      variant: {
        default:
          'border-dark-border focus-visible:border-brand-orange-500 focus-visible:ring-brand-orange-500',
        error:
          'border-red-500 focus-visible:border-red-500 focus-visible:ring-red-500',
        success:
          'border-green-500 focus-visible:border-green-500 focus-visible:ring-green-500',
      },
      size: {
        sm: 'h-9 px-3 text-sm',
        md: 'h-11 px-4 text-base',
        lg: 'h-13 px-5 text-lg',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

export interface InputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'>,
    VariantProps<typeof inputVariants> {
  error?: string;
  label?: string;
  helperText?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      variant,
      size,
      type = 'text',
      error,
      label,
      helperText,
      ...props
    },
    ref
  ) => {
    const inputVariant = error ? 'error' : variant;

    return (
      <div className='space-y-2'>
        {label && (
          <label className='text-sm font-medium text-dark-text-primary'>
            {label}
            {props.required && <span className='text-red-500 ml-1'>*</span>}
          </label>
        )}
        <input
          type={type}
          className={inputVariants({ variant: inputVariant, size, className })}
          ref={ref}
          {...props}
        />
        {(error || helperText) && (
          <p
            className={`text-sm ${error ? 'text-red-500' : 'text-dark-text-muted'}`}
          >
            {error || helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export { Input, inputVariants };
