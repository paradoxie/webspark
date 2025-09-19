import { cn } from '@/lib/utils';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
  showInfo?: boolean;
  total?: number;
  pageSize?: number;
}

export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  className = "flex items-center justify-center space-x-2 mt-8",
  showInfo = false,
  total,
  pageSize
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages = [];
  
  // 显示页码范围
  let startPage = Math.max(1, currentPage - 2);
  let endPage = Math.min(totalPages, currentPage + 2);

  // 确保显示5页（如果可能）
  if (endPage - startPage < 4) {
    if (startPage === 1) {
      endPage = Math.min(totalPages, startPage + 4);
    } else {
      startPage = Math.max(1, endPage - 4);
    }
  }

  for (let i = startPage; i <= endPage; i++) {
    pages.push(
      <button
        key={i}
        onClick={() => onPageChange(i)}
        className={cn(
          "px-3 py-2 rounded-md text-sm font-medium transition-colors",
          i === currentPage
            ? 'bg-blue-600 text-white'
            : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-300'
        )}
      >
        {i}
      </button>
    );
  }

  return (
    <div className="space-y-4">
      {showInfo && total && pageSize && (
        <div className="text-center text-sm text-slate-600">
          显示第 {(currentPage - 1) * pageSize + 1}-{Math.min(currentPage * pageSize, total)} 项，共 {total} 项
        </div>
      )}
      
      <div className={className}>
        {currentPage > 1 && (
          <button
            onClick={() => onPageChange(currentPage - 1)}
            className="px-3 py-2 rounded-md text-sm font-medium bg-white text-slate-700 hover:bg-slate-50 border border-slate-300 transition-colors"
          >
            上一页
          </button>
        )}
        
        {startPage > 1 && (
          <>
            <button
              onClick={() => onPageChange(1)}
              className="px-3 py-2 rounded-md text-sm font-medium bg-white text-slate-700 hover:bg-slate-50 border border-slate-300 transition-colors"
            >
              1
            </button>
            {startPage > 2 && <span className="text-slate-400">...</span>}
          </>
        )}
        
        {pages}
        
        {endPage < totalPages && (
          <>
            {endPage < totalPages - 1 && <span className="text-slate-400">...</span>}
            <button
              onClick={() => onPageChange(totalPages)}
              className="px-3 py-2 rounded-md text-sm font-medium bg-white text-slate-700 hover:bg-slate-50 border border-slate-300 transition-colors"
            >
              {totalPages}
            </button>
          </>
        )}
        
        {currentPage < totalPages && (
          <button
            onClick={() => onPageChange(currentPage + 1)}
            className="px-3 py-2 rounded-md text-sm font-medium bg-white text-slate-700 hover:bg-slate-50 border border-slate-300 transition-colors"
          >
            下一页
          </button>
        )}
      </div>
    </div>
  );
}