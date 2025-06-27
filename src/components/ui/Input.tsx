import { forwardRef, InputHTMLAttributes } from "react";
import { clsx } from "clsx";

export interface InputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "size"> {
  variant?: "default" | "error" | "success";
  size?: "sm" | "md" | "lg";
  error?: string;
  label?: string;
  helperText?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      variant = "default",
      size = "md",
      type = "text",
      error,
      label,
      helperText,
      ...props
    },
    ref,
  ) => {
    const inputVariant = error ? "error" : variant;

    const baseClasses =
      "flex w-full rounded-lg border bg-zinc-900 px-4 py-3 font-mono text-zinc-100 placeholder-zinc-500 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-50";

    const variantClasses = {
      default:
        "border-zinc-800 hover:border-zinc-700 focus-visible:border-orange-500 focus-visible:ring-orange-500/20",
      error:
        "border-red-500/50 focus-visible:border-red-500 focus-visible:ring-red-500/20 bg-red-500/5",
      success:
        "border-green-500/50 focus-visible:border-green-500 focus-visible:ring-green-500/20 bg-green-500/5",
    };

    const sizeClasses = {
      sm: "h-8 px-3 text-xs",
      md: "h-10 px-4 text-sm",
      lg: "h-12 px-5 text-base",
    };

    const combinedClassName = clsx(
      baseClasses,
      variantClasses[inputVariant],
      sizeClasses[size],
      className,
    );

    return (
      <div className="space-y-2">
        {label && (
          <label className="text-xs font-mono font-medium text-zinc-300 uppercase tracking-wider">
            {label}
            {props.required && <span className="text-orange-500 ml-1">*</span>}
          </label>
        )}
        <input type={type} className={combinedClassName} ref={ref} {...props} />
        {(error || helperText) && (
          <p
            className={`text-xs font-mono ${error ? "text-red-400" : "text-zinc-500"}`}
          >
            {error || helperText}
          </p>
        )}
      </div>
    );
  },
);

Input.displayName = "Input";

export { Input };
