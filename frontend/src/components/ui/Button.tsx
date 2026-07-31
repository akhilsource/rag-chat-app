import clsx from "clsx";
import { type ButtonHTMLAttributes, forwardRef } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "ghost" | "soft";
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", loading, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={clsx(
          "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5",
          "font-sans text-sm font-semibold tracking-wide transition-all duration-200",
          "disabled:cursor-not-allowed disabled:opacity-50",
          variant === "primary" &&
            "bg-gradient-to-b from-accent to-accent-dim text-void shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_10px_24px_rgba(74,168,150,0.28)] hover:brightness-110 active:scale-[0.99]",
          variant === "ghost" &&
            "border border-white/15 bg-white/[0.03] text-mist/85 hover:bg-white/[0.07] hover:text-mist",
          variant === "soft" &&
            "border border-white/10 bg-white/[0.06] text-mist hover:bg-white/[0.1]",
          className,
        )}
        {...props}
      >
        {loading ? (
          <span className="inline-flex items-center gap-2">
            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current/30 border-t-current" />
            Working…
          </span>
        ) : (
          children
        )}
      </button>
    );
  },
);
Button.displayName = "Button";
