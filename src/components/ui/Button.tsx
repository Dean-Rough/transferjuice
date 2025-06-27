import { forwardRef, ButtonHTMLAttributes } from "react";
import { clsx } from "clsx";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:
    | "primary"
    | "secondary"
    | "ghost"
    | "outline"
    | "destructive"
    | "link";
  size?: "sm" | "md" | "lg" | "xl" | "icon";
  loading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      loading = false,
      children,
      disabled,
      ...props
    },
    ref,
  ) => {
    const isDisabled = disabled || loading;

    const baseClasses =
      "inline-flex items-center justify-center rounded-lg font-mono font-medium tracking-wide transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 focus-visible:ring-offset-black disabled:pointer-events-none disabled:opacity-50";

    const variantClasses = {
      primary:
        "bg-orange-600 text-white hover:bg-orange-700 shadow-medium hover-lift active:scale-[0.98]",
      secondary:
        "bg-zinc-900 border border-zinc-800 text-zinc-100 hover:bg-zinc-800 hover:border-zinc-700",
      ghost: "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50",
      outline:
        "border border-orange-500/30 text-orange-400 hover:bg-orange-500/10 hover:border-orange-500/50",
      destructive: "bg-red-600 text-white hover:bg-red-700 shadow-medium",
      link: "text-orange-400 underline-offset-4 hover:underline hover:text-orange-300",
    };

    const sizeClasses = {
      sm: "h-8 px-3 text-xs",
      md: "h-10 px-5 text-sm",
      lg: "h-12 px-6 text-base",
      xl: "h-14 px-8 text-lg",
      icon: "h-10 w-10",
    };

    const combinedClassName = clsx(
      baseClasses,
      variantClasses[variant],
      sizeClasses[size],
      className,
    );

    return (
      <button
        className={combinedClassName}
        ref={ref}
        disabled={isDisabled}
        style={{
          minHeight:
            size === "xl"
              ? "4rem"
              : size === "lg"
                ? "3.25rem"
                : size === "md"
                  ? "2.75rem"
                  : "2.25rem",
        }}
        {...props}
      >
        {loading && (
          <svg
            className="mr-2 h-4 w-4 animate-spin"
            fill="none"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              fill="currentColor"
            />
          </svg>
        )}
        {children}
      </button>
    );
  },
);

Button.displayName = "Button";

export { Button };
