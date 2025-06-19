import { forwardRef, HTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

const containerVariants = cva('mx-auto w-full', {
  variants: {
    size: {
      sm: 'max-w-3xl',
      md: 'max-w-5xl',
      lg: 'max-w-7xl',
      xl: 'max-w-8xl',
      full: 'max-w-full',
    },
    padding: {
      none: '',
      sm: 'px-4 sm:px-6',
      md: 'px-4 sm:px-6 lg:px-8',
      lg: 'px-6 sm:px-8 lg:px-12',
    },
  },
  defaultVariants: {
    size: 'lg',
    padding: 'md',
  },
});

export interface ContainerProps
  extends HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof containerVariants> {}

const Container = forwardRef<HTMLDivElement, ContainerProps>(
  ({ className, size, padding, ...props }, ref) => (
    <div
      ref={ref}
      className={containerVariants({ size, padding, className })}
      {...props}
    />
  )
);

Container.displayName = 'Container';

export { Container, containerVariants };
