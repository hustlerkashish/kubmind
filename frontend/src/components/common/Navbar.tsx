import { useState } from 'react';
import { Bell, Command } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { SearchBox } from '@/components/ui/SearchBox';
import { ThemeToggle } from '@/components/common/ThemeToggle';
import { Button } from '@/components/ui/Button';
import { SearchModal } from './SearchModal';
import { NotificationPanel } from './NotificationPanel';
import { UserProfileMenu } from './UserProfileMenu';

import { useIncidents } from '@/hooks/useIncidents';

export function Navbar() {
  const { user } = useAuth();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const { data: incidents = [] } = useIncidents('all', 'all');
  const openCount = incidents.filter((i) => i.status !== 'RESOLVED').length;

  return (
    <header className="h-16 border-b px-6 flex items-center justify-between sticky top-0 z-40 backdrop-blur-md transition-colors duration-200 border-slate-200 dark:border-slate-800/80 bg-white/95 dark:bg-[#0c121e]/90 shadow-sm">
      {/* Search */}
      <div className="flex items-center gap-4 flex-1">
        <div className="w-full max-w-xs cursor-pointer" onClick={() => setIsSearchOpen(true)}>
          <SearchBox placeholder="Search pods, nodes, metrics... (Ctrl+K)" readOnly />
        </div>
        <button
          onClick={() => setIsSearchOpen(true)}
          className="hidden md:flex items-center gap-1.5 text-[11px] font-mono border rounded-lg px-2.5 py-1 transition-colors text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700"
        >
          <Command className="h-3 w-3 text-blue-500" />
          <span>Ctrl + K</span>
        </button>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3 relative">
        <ThemeToggle />

        <div className="relative">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => { setIsNotifOpen((p) => !p); setIsProfileOpen(false); }}
            className="relative text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
            title="Notifications"
          >
            <Bell className="h-4 w-4" />
            {openCount > 0 && (
              <span className="absolute -top-1 -right-1 h-4 min-w-[16px] px-1 rounded-full bg-rose-500 text-[9px] font-bold text-white flex items-center justify-center animate-pulse ring-2 ring-white dark:ring-slate-900 font-mono">
                {openCount}
              </span>
            )}
          </Button>
          <NotificationPanel isOpen={isNotifOpen} onClose={() => setIsNotifOpen(false)} />
        </div>

        <div className="h-4 w-px bg-slate-200 dark:bg-slate-800" />

        <div className="relative">
          {user ? (
            <button
              onClick={() => { setIsProfileOpen((p) => !p); setIsNotifOpen(false); }}
              className="flex items-center gap-2.5 p-1 rounded-lg transition-colors hover:bg-slate-100 dark:hover:bg-slate-900"
            >
              <div className="h-8 w-8 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-500 font-semibold text-xs">
                {user.username.charAt(0).toUpperCase()}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-xs font-semibold leading-tight text-slate-800 dark:text-slate-200">
                  {user.fullName || user.username}
                </p>
                <p className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
                  {user.email}
                </p>
              </div>
            </button>
          ) : (
            <a href="/login" className="text-xs font-medium text-blue-500 hover:underline">Sign In</a>
          )}
          <UserProfileMenu isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />
        </div>
      </div>

      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </header>
  );
}
