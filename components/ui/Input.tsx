import { InputHTMLAttributes, TextareaHTMLAttributes, forwardRef } from "react";

const baseClasses = [
  "w-full bg-[rgba(17,17,17,.03)] border border-[var(--border)]",
  "rounded-lg px-3.5 py-2.5 text-[var(--dark)] font-[inherit] text-[.82rem]",
  "transition-all duration-300 placeholder:text-[var(--muted2)]",
  "focus:outline-none focus:border-[rgba(193,68,14,.35)]",
  "focus:bg-[rgba(193,68,14,.03)] focus:shadow-[0_0_0_3px_rgba(193,68,14,.08)]",
  "disabled:opacity-50 disabled:cursor-not-allowed",
].join(" ");

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, id, className = "", ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-[.65rem] font-bold tracking-[.14em] uppercase text-[var(--muted)]"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={[
            baseClasses,
            error ? "border-[var(--red)] focus:border-[var(--red)] focus:shadow-[0_0_0_3px_rgba(239,68,68,.1)]" : "",
            className,
          ].join(" ")}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
          {...props}
        />
        {error && (
          <p id={`${inputId}-error`} className="text-[.7rem] text-[var(--red)] flex items-center gap-1">
            <i className="fa-solid fa-circle-exclamation" aria-hidden="true" />
            {error}
          </p>
        )}
        {hint && !error && (
          <p id={`${inputId}-hint`} className="text-[.7rem] text-[var(--muted2)]">
            {hint}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, hint, id, className = "", ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-[.65rem] font-bold tracking-[.14em] uppercase text-[var(--muted)]"
          >
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={inputId}
          className={[
            baseClasses,
            "resize-vertical min-h-[100px]",
            error ? "border-[var(--red)] focus:border-[var(--red)] focus:shadow-[0_0_0_3px_rgba(239,68,68,.1)]" : "",
            className,
          ].join(" ")}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
          {...props}
        />
        {error && (
          <p id={`${inputId}-error`} className="text-[.7rem] text-[var(--red)] flex items-center gap-1">
            <i className="fa-solid fa-circle-exclamation" aria-hidden="true" />
            {error}
          </p>
        )}
        {hint && !error && (
          <p id={`${inputId}-hint`} className="text-[.7rem] text-[var(--muted2)]">
            {hint}
          </p>
        )}
      </div>
    );
  }
);

Textarea.displayName = "Textarea";

export { Input, Textarea };
export default Input;
