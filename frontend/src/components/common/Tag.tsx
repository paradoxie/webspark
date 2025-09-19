import Link from 'next/link';
import { cn } from '@/lib/utils';

interface TagProps {
  name: string;
  slug?: string;
  color?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'category' | 'status';
  icon?: string;
  href?: string;
  onClick?: (e: React.MouseEvent) => void;
  className?: string;
  clickable?: boolean;
}

export default function Tag({
  name,
  slug,
  color,
  size = 'sm',
  variant = 'default',
  icon,
  href,
  onClick,
  className,
  clickable = true
}: TagProps) {
  const sizes = {
    sm: 'px-2.5 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base'
  };

  const variants = {
    default: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    category: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300',
    status: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
  };

  const baseClasses = cn(
    'inline-flex items-center rounded-full font-medium',
    sizes[size],
    !color && variants[variant],
    clickable && 'transition-colors hover:opacity-80',
    className
  );

  const style = color ? {
    backgroundColor: color + '20',
    color: color
  } : {};

  const content = (
    <>
      {icon && <span className="mr-1">{icon}</span>}
      {name}
    </>
  );

  if (href && clickable) {
    return (
      <Link
        href={href}
        className={baseClasses}
        style={style}
        onClick={onClick}
      >
        {content}
      </Link>
    );
  }

  if (onClick && clickable) {
    return (
      <button
        className={baseClasses}
        style={style}
        onClick={onClick}
      >
        {content}
      </button>
    );
  }

  return (
    <span
      className={baseClasses}
      style={style}
    >
      {content}
    </span>
  );
}