import { forwardRef, HTMLAttributes } from "react";
import { clsx } from "clsx";

export interface ContainerProps extends HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "md" | "lg" | "xl" | "full";
  padding?: "none" | "sm" | "md" | "lg";
}

const Container = forwardRef<HTMLDivElement, ContainerProps>(
  ({ className, size = "lg", padding = "md", ...props }, ref) => {
    const sizeClasses = {
      sm: "max-w-3xl",
      md: "max-w-5xl",
      lg: "max-w-7xl",
      xl: "max-w-8xl",
      full: "max-w-full",
    };

    const paddingClasses = {
      none: "",
      sm: "px-4 sm:px-6",
      md: "px-4 sm:px-6 lg:px-8",
      lg: "px-6 sm:px-8 lg:px-12",
    };

    const combinedClassName = clsx(
      "mx-auto w-full",
      sizeClasses[size],
      paddingClasses[padding],
      className,
    );

    return <div ref={ref} className={combinedClassName} {...props} />;
  },
);

Container.displayName = "Container";

export { Container };
