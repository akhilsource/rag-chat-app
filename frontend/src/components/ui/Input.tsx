import clsx from "clsx";
import { InputHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, id, className, ...props }, ref) => {
    const inputId = id ?? label.toLowerCase().replace(/\s+/g, "-");
    return (
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor={inputId}
          className="font-mono text-[11px] uppercase tracking-[0.12em] text-ink/50"
        >
          {label}
        </label>
        <input
          ref={ref}
          id={inputId}
          className={clsx(
            "rounded-md border bg-paper/60 px-3 py-2.5 font-sans text-sm text-ink",
            "placeholder:text-ink/35 outline-none transition-colors",
            error
              ? "border-red-400/70 focus:border-red-400"
              : "border-ink/15 focus:border-teal",
            className
          )}
          {...props}
        />
        {error && <p className="font-sans text-xs text-red-500">{error}</p>}
      </div>
    );
  }
);
Input.displayName = "Input";
