import React from 'react';
import { Search } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SearchBoxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  className?: string;
}

export function SearchBox({ className, placeholder = 'Search pods, nodes, metrics...', ...props }: SearchBoxProps) {
  return (
    <div className={cn('relative flex items-center w-full max-w-xs', className)}>
      <Search className="absolute left-3 h-4 w-4 text-slate-400 pointer-events-none" />
      <input
        type="text"
        className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 py-2 pl-9 pr-4 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 transition-all focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        placeholder={placeholder}
        {...props}
      />
    </div>
  );
}
