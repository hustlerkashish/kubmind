import { useState } from 'react';
import { NotificationItem } from '@/services/mockTelemetryService';
import { Bell, Check, Trash2, AlertCircle, Info, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NotificationPanel({ isOpen, onClose }: NotificationPanelProps) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  if (!isOpen) return null;

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const toggleRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: !n.read } : n))
    );
  };

  return (
    <div className="absolute right-0 top-12 w-80 sm:w-96 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-2xl shadow-black/80 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
      <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4 text-blue-500" />
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Telemetry Notifications</h3>
          <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-500 border border-blue-500/30">
            {notifications.filter((n) => !n.read).length} Unread
          </span>
        </div>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-900 dark:hover:text-white p-1 rounded">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="max-h-80 overflow-y-auto divide-y divide-slate-200 dark:divide-slate-800/60">
        {notifications.length > 0 ? (
          notifications.map((item) => (
            <div
              key={item.id}
              onClick={() => toggleRead(item.id)}
              className={`p-3.5 transition-colors cursor-pointer flex items-start gap-3 hover:bg-slate-100 dark:hover:bg-slate-900/40 ${
                !item.read ? 'bg-blue-500/5' : 'opacity-70'
              }`}
            >
              {item.severity === 'CRITICAL' ? (
                <AlertCircle className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
              ) : item.severity === 'WARNING' ? (
                <AlertCircle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
              ) : (
                <Info className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
              )}

              <div className="flex-1 text-xs">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-slate-800 dark:text-slate-200">{item.title}</h4>
                  <span className="text-[10px] text-slate-500 font-mono">{item.timeAgo}</span>
                </div>
                <p className="text-slate-500 text-[11px] mt-1 leading-normal">{item.description}</p>
              </div>
            </div>
          ))
        ) : (
          <div className="p-8 text-center text-xs text-slate-500">
            No active telemetry notifications recorded.
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
