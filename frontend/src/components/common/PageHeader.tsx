import React from 'react';
import { Breadcrumb } from './Breadcrumb';

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}

export function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <div className="mb-6 pb-4 border-b border-slate-200 dark:border-slate-800/80 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <Breadcrumb />
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white mt-2 font-sans">{title}</h1>
        {description && <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-3 shrink-0">{actions}</div>}
    </div>
  );
}
