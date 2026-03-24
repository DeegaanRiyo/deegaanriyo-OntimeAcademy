import { ButtonHTMLAttributes, forwardRef } from "react";

type Variant = "primary" | "secondary" | "outline" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-[var(--teal)] text-white hover:bg-[var(--teal2)] hover:shadow-[0_8px_24px_rgba(193,68,14,.35)] hover:-translate-y-px active:translate-y-0",
  secondary:
    "bg-[var(--dark)] text-white hover:bg-[#222] hover:shadow-[0_8px_24px_rgba(17,17,17,.25)] hover:-translate-y-px active:translate-y-0",
  outline:
    "bg-transparent text-[var(--teal2)] border border-[rgba(193,68,14,.4)] hover:bg-[rgba(193,68,14,.06)] hover:border-[var(--teal2)]",
  ghost:
    "bg-transparent text-[var(--dark)] hover:bg-[rgba(17,17,17,.06)]",
  danger:
    "bg-[var(--red)] text-white hover:bg-red-600 hover:shadow-[0_8px_24px_rgba(239,68,68,.3)] hover:-translate-y-px active:translate-y-0",
};

const sizeClasses: Record<Size, string> = {
  sm: "text-[.72rem] px-4 py-2 gap-1.5",
  md: "text-[.82rem] px-6 py-2.5 gap-2",
  lg: "text-[.9rem] px-8 py-3.5 gap-2.5",
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      loading = false,
      disabled,
      children,
      className = "",
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading;

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        className={[
          "inline-flex items-center justify-center font-[var(--font-jakarta)] font-bold",
          "tracking-[.08em] uppercase rounded-sm border-none",
          "transition-all duration-300 cursor-pointer select-none",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--teal2)] focus-visible:ring-offset-2",
          "disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none",
          variantClasses[variant],
          sizeClasses[size],
          className,
        ].join(" ")}
        {...props}
      >
        {loading && (
          <span className="inline-block w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
export default Button;
