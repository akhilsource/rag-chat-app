import clsx from "clsx";
import { type InputHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, id, className, ...props }, ref) => {
    const inputId = id ?? label.toLowerCase().replace(/\s+/g, "-");
    return (
      <div className="flex flex-col gap-1.5">
        <label htmlFor={inputId} className="label-caps !text-mist/45">
          {label}
        </label>
        <input
          ref={ref}
          id={inputId}
          className={clsx(
            "rounded-xl border bg-white/[0.04] px-3.5 py-2.5 font-sans text-sm text-mist",
            "placeholder:text-mist/30 outline-none transition-colors",
            "shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]",
            error
              ? "border-danger/60 focus:border-danger"
              : "border-white/12 focus:border-accent/70",
            className,
          )}
          {...props}
        />
        {error && <p className="font-sans text-xs text-danger">{error}</p>}
      </div>
    );
  },
);
Input.displayName = "Input";
