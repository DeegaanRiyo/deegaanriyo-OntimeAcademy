import type { ReactNode } from "react";

interface Props {
  icon: string;
  title: string;
  description?: string;
  action?: ReactNode;
  padding?: string;
}

export default function EmptyState({ icon, title, description, action, padding }: Props) {
  return (
    <div className="empty" style={padding ? { padding } : undefined}>
      <div className="empty-icon">
        <i className={icon} aria-hidden="true" />
      </div>
      <p className="empty-title">{title}</p>
      {description && <p>{description}</p>}
      {action}
    </div>
  );
}
