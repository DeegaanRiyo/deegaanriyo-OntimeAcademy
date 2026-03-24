import { HTMLAttributes, forwardRef } from "react";

type CardVariant = "default" | "bordered" | "elevated" | "filled";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
}

const variantClasses: Record<CardVariant, string> = {
  default:
    "bg-white border border-[var(--border)] rounded-xl",
  bordered:
    "bg-white border-2 border-[rgba(193,68,14,.2)] rounded-xl hover:border-[rgba(193,68,14,.4)] transition-colors duration-300",
  elevated:
    "bg-white rounded-xl shadow-[0_4px_24px_rgba(17,17,17,.08)] hover:shadow-[0_8px_40px_rgba(17,17,17,.12)] transition-shadow duration-300",
  filled:
    "bg-[var(--dark2)] border border-[var(--border)] rounded-xl",
};

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ variant = "default", className = "", children, ...props }, ref) => (
    <div
      ref={ref}
      className={[variantClasses[variant], className].join(" ")}
      {...props}
    >
      {children}
    </div>
  )
);
Card.displayName = "Card";

const CardHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className = "", children, ...props }, ref) => (
    <div
      ref={ref}
      className={["px-6 py-5 border-b border-[var(--border)]", className].join(" ")}
      {...props}
    >
      {children}
    </div>
  )
);
CardHeader.displayName = "CardHeader";

const CardBody = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className = "", children, ...props }, ref) => (
    <div ref={ref} className={["px-6 py-5", className].join(" ")} {...props}>
      {children}
    </div>
  )
);
CardBody.displayName = "CardBody";

const CardFooter = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className = "", children, ...props }, ref) => (
    <div
      ref={ref}
      className={["px-6 py-4 border-t border-[var(--border)] bg-[rgba(17,17,17,.02)] rounded-b-xl", className].join(" ")}
      {...props}
    >
      {children}
    </div>
  )
);
CardFooter.displayName = "CardFooter";

export { Card, CardHeader, CardBody, CardFooter };
export default Card;
