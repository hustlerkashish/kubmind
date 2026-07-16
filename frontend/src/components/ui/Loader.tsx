import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoaderProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  className?: string;
}

export function Loader({ size = 'md', text, className }: LoaderProps) {
  const sizeMap = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  };

  return (
    <div className={cn('flex flex-col items-center justify-center gap-3 p-6 text-slate-400', className)}>
      <Loader2 className={cn('animate-spin text-blue-500', sizeMap[size])} />
      {text && <p className="text-sm font-medium tracking-wide">{text}</p>}
    </div>
  );
}
