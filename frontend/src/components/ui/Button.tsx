import clsx from "clsx";
import { ButtonHTMLAttributes, forwardRef } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "ghost";
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", loading, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={clsx(
          "w-full rounded-md px-4 py-2.5 font-sans text-sm font-medium tracking-wide transition-all duration-150",
          "disabled:cursor-not-allowed disabled:opacity-60",
          variant === "primary" &&
            "bg-teal text-paper hover:bg-teal-dark active:scale-[0.99]",
          variant === "ghost" &&
            "bg-transparent text-ink/70 hover:bg-ink/5 border border-ink/15",
          className
        )}
        {...props}
      >
        {loading ? (
          <span className="inline-flex items-center gap-2">
            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-paper/40 border-t-paper" />
            Working…
          </span>
        ) : (
          children
        )}
      </button>
    );
  }
);
Button.displayName = "Button";
