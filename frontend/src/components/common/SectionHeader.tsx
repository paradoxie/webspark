interface SectionHeaderProps {
  title: string;
  description?: string;
  className?: string;
  titleClassName?: string;
  descriptionClassName?: string;
  actions?: React.ReactNode;
}

export default function SectionHeader({
  title,
  description,
  className = "text-center mb-8",
  titleClassName = "text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2",
  descriptionClassName = "text-lg text-slate-600 dark:text-slate-300",
  actions
}: SectionHeaderProps) {
  return (
    <div className={className}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h2 className={titleClassName}>{title}</h2>
          {description && (
            <p className={descriptionClassName}>{description}</p>
          )}
        </div>
        {actions && (
          <div className="ml-4">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}