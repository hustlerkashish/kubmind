import { useState } from 'react';
import { useIncidents } from '@/hooks/useIncidents';
import { useNavigate } from 'react-router-dom';
import { Bell, Check, Trash2, AlertCircle, Info, X, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NotificationPanel({ isOpen, onClose }: NotificationPanelProps) {
  const { data: incidents = [] } = useIncidents('all', 'all');
  const navigate = useNavigate();
  const [readIds, setReadIds] = useState<string[]>([]);
  const [cleared, setCleared] = useState(false);

  if (!isOpen) return null;

  const displayIncidents = cleared ? [] : incidents;
  const unreadCount = displayIncidents.filter((i) => !readIds.includes(i.id) && i.status !== 'RESOLVED').length;

  const markAllAsRead = () => {
    setReadIds(displayIncidents.map((i) => i.id));
  };

  const clearAll = () => {
    setCleared(true);
  };

  const handleItemClick = (id: string) => {
    if (!readIds.includes(id)) {
      setReadIds((prev) => [...prev, id]);
    }
    onClose();
    navigate('/incidents');
  };

  return (
    <div className="absolute right-0 top-12 w-80 sm:w-96 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-2xl shadow-black/80 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
      <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4 text-blue-500" />
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Cluster Live Notifications</h3>
          {unreadCount > 0 && (
            <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-500 border border-rose-500/30">
              {unreadCount} Active
            </span>
          )}
        </div>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-900 dark:hover:text-white p-1 rounded">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="max-h-80 overflow-y-auto divide-y divide-slate-200 dark:divide-slate-800/60">
        {displayIncidents.length > 0 ? (
          displayIncidents.map((item) => {
            const isRead = readIds.includes(item.id) || item.status === 'RESOLVED';
            return (
              <div
                key={item.id}
                onClick={() => handleItemClick(item.id)}
                className={`p-3.5 transition-colors cursor-pointer flex items-start gap-3 hover:bg-slate-100 dark:hover:bg-slate-900/40 ${
                  !isRead ? 'bg-rose-500/5 dark:bg-rose-950/15' : 'opacity-70'
                }`}
              >
                {item.severity === 'CRITICAL' ? (
                  <AlertCircle className="h-4 w-4 text-rose-500 shrink-0 mt-0.5 animate-pulse" />
                ) : item.severity === 'WARNING' ? (
                  <AlertCircle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                ) : (
                  <Info className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
                )}

                <div className="flex-1 text-xs">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <span>[{item.reason}] {item.podName}</span>
                    </h4>
                    <span className="text-[10px] text-slate-500 font-mono">{item.status}</span>
                  </div>
                  <p className="text-slate-500 text-[11px] mt-1 leading-normal">
                    {item.namespace} • {item.aiSummary ? item.aiSummary.slice(0, 85) + '...' : 'Container crash event detected'}
                  </p>
                  <div className="mt-2 flex items-center gap-1 text-[10px] text-blue-500 font-medium">
                    <span>Inspect in Incident Center</span>
                    <ExternalLink className="h-2.5 w-2.5" />
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="p-8 text-center text-xs text-slate-500">
            No active container incidents or crash events recorded. Cluster is healthy.
          </div>
        )}
      </div>

      <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/30 flex items-center justify-between text-xs">
        <Button variant="ghost" size="sm" onClick={markAllAsRead} className="h-7 text-xs text-slate-500">
          <Check className="h-3.5 w-3.5 mr-1" />
          Mark all read
        </Button>
        <Button variant="ghost" size="sm" onClick={clearAll} className="h-7 text-xs text-rose-500 hover:text-rose-600">
          <Trash2 className="h-3.5 w-3.5 mr-1" />
          Clear list
        </Button>
      </div>
    </div>
  );
}
