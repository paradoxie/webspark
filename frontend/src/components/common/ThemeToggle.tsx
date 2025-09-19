'use client';

import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';

interface ThemeToggleProps {
  className?: string;
  variant?: 'icon' | 'dropdown';
}

export default function ThemeToggle({ className, variant = 'icon' }: ThemeToggleProps) {
  const { theme, setTheme, resolvedTheme } = useTheme();

  if (variant === 'dropdown') {
    return (
      <div className={cn('relative inline-block text-left', className)}>
        <select
          value={theme}
          onChange={(e) => setTheme(e.target.value as any)}
          className="block w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="light">浅色模式</option>
          <option value="dark">深色模式</option>
          <option value="system">跟随系统</option>
        </select>
      </div>
    );
  }

  const handleToggle = () => {
    if (theme === 'system') {
      setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
    } else {
      setTheme(theme === 'light' ? 'dark' : 'light');
    }
  };

  return (
    <button
      onClick={handleToggle}
      className={cn(
        'p-2 rounded-lg transition-colors',
        'text-slate-600 hover:text-slate-900 hover:bg-slate-100',
        'dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-800',
        className
      )}
      title={`当前: ${theme === 'system' ? '跟随系统' : theme === 'light' ? '浅色模式' : '深色模式'}`}
    >
      {resolvedTheme === 'dark' ? (
        // 太阳图标 (浅色模式)
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
          />
        </svg>
      ) : (
        // 月亮图标 (深色模式)
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
          />
        </svg>
      )}
    </button>
  );
}