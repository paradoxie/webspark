import Button from '../ui/Button';

interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  actionHref?: string;
  className?: string;
  children?: React.ReactNode;
}

export default function EmptyState({
  icon = '📝',
  title,
  description,
  actionLabel,
  onAction,
  actionHref,
  className = "text-center py-12",
  children
}: EmptyStateProps) {
  return (
    <div className={className}>
      <div className="text-6xl mb-4">{icon}</div>
      <h3 className="text-xl font-medium text-slate-900 mb-2">{title}</h3>
      {description && (
        <p className="text-slate-600 mb-6">{description}</p>
      )}
      
      {children}
      
      {(actionLabel && (onAction || actionHref)) && (
        <div className="mt-6">
          {actionHref ? (
            <Button
              as="a"
              href={actionHref}
              variant="primary"
            >
              {actionLabel}
            </Button>
          ) : (
            <Button
              onClick={onAction}
              variant="primary"
            >
              {actionLabel}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}