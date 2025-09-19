interface LoadingGridProps {
  count?: number;
  className?: string;
  cardClassName?: string;
}

export default function LoadingGrid({ 
  count = 6, 
  className = "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6",
  cardClassName = "bg-white dark:bg-slate-800 rounded-lg shadow-md p-6 animate-pulse border border-transparent dark:border-slate-700"
}: LoadingGridProps) {
  return (
    <div className={className}>
      {[...Array(count)].map((_, i) => (
        <div key={i} className={cardClassName}>
          <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-3/4 mb-4"></div>
          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-full mb-2"></div>
          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-2/3 mb-4"></div>
          <div className="flex gap-2 mb-4">
            <div className="h-6 bg-slate-100 dark:bg-slate-600 rounded-full w-16"></div>
            <div className="h-6 bg-slate-100 dark:bg-slate-600 rounded-full w-16"></div>
          </div>
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-8 h-8 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
            <div>
              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-24 mb-1"></div>
              <div className="h-3 bg-slate-100 dark:bg-slate-600 rounded w-16"></div>
            </div>
          </div>
          <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-700">
            <div className="flex space-x-4">
              <div className="h-4 bg-slate-100 dark:bg-slate-600 rounded w-12"></div>
              <div className="h-4 bg-slate-100 dark:bg-slate-600 rounded w-16"></div>
            </div>
            <div className="flex space-x-2">
              <div className="w-8 h-8 bg-slate-100 dark:bg-slate-600 rounded"></div>
              <div className="w-8 h-8 bg-slate-100 dark:bg-slate-600 rounded"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}