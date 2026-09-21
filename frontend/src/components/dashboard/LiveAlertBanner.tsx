import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertOctagon, Sparkles, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface LiveAlertBannerProps {
  podName?: string;
  namespace?: string;
  reason?: string;
}

export function LiveAlertBanner({
  podName,
  namespace = 'production',
  reason = 'CrashLoopBackOff (Exit Code 137)',
}: LiveAlertBannerProps) {
  const [isDismissed, setIsDismissed] = useState(false);
  const navigate = useNavigate();

  // Strictly do not render if no real incident pod is active
  if (isDismissed || !podName) return null;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-rose-500/30 bg-gradient-to-r from-rose-500/10 via-rose-500/5 to-amber-500/10 p-4 shadow-lg backdrop-blur-xl animate-in fade-in slide-in-from-top-4 duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3">
          <div className="p-2 rounded-xl bg-rose-500/20 text-rose-500 border border-rose-500/30 shrink-0 animate-pulse">
            <AlertOctagon className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-rose-500/20 text-rose-600 dark:text-rose-300 border border-rose-500/30">
                Critical Incident
              </span>
              <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
                Namespace: <span className="text-slate-800 dark:text-slate-200 font-semibold">{namespace}</span>
              </span>
            </div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-white mt-1 font-mono">
              Pod <span className="text-rose-600 dark:text-rose-400 underline">{podName}</span> entered {reason}
            </h4>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate('/copilot')}
            className="bg-gradient-to-r from-rose-600 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 text-white shadow-md shadow-rose-500/20 rounded-xl text-xs"
          >
            <Sparkles className="h-3.5 w-3.5 mr-1.5" />
            Run AI Diagnosis
          </Button>

          <button
            onClick={() => setIsDismissed(true)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800/60 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
