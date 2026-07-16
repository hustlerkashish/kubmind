import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ToastProps {
  id: string;
  type?: 'success' | 'error' | 'info';
  title: string;
  message?: string;
  onClose: (id: string) => void;
}

export function Toast({ id, type = 'info', title, message, onClose }: ToastProps) {
  const iconMap = {
    success: <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />,
    error: <AlertCircle className="h-5 w-5 text-rose-400 shrink-0" />,
    info: <Info className="h-5 w-5 text-blue-400 shrink-0" />,
  };

  const borderMap = {
    success: 'border-emerald-500/40 bg-emerald-950/20 text-emerald-100',
    error: 'border-rose-500/40 bg-rose-950/20 text-rose-100',
    info: 'border-blue-500/40 bg-blue-950/20 text-blue-100',
  };

  return (
    <div
      className={cn(
        'flex items-start gap-3 rounded-lg border p-4 shadow-xl backdrop-blur-md transition-all duration-300 animate-in slide-in-from-right-5',
        borderMap[type]
      )}
    >
      {iconMap[type]}
      <div className="flex-1 text-sm">
        <h4 className="font-semibold">{title}</h4>
        {message && <p className="mt-1 text-xs opacity-80">{message}</p>}
      </div>
      <button
        onClick={() => onClose(id)}
        className="rounded p-1 opacity-60 hover:opacity-100 transition-opacity"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
