import { useState } from 'react';
import { Bell, Command } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { SearchBox } from '@/components/ui/SearchBox';
import { ThemeToggle } from '@/components/common/ThemeToggle';
import { Button } from '@/components/ui/Button';
import { SearchModal } from './SearchModal';
import { NotificationPanel } from './NotificationPanel';
import { UserProfileMenu } from './UserProfileMenu';
import { useThemeContext } from '@/context/ThemeContext';
import { cn } from '@/lib/utils';

export function Navbar() {
  const { user } = useAuth();
  const { isLight } = useThemeContext();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  return (
    <header className={cn(
      'h-16 border-b px-6 flex items-center justify-between sticky top-0 z-40 backdrop-blur-md transition-colors duration-200',
      isLight
        ? 'border-slate-200 bg-white/90'
        : 'border-slate-800/80 bg-slate-950/80'
    )}>
      {/* Search */}
      <div className="flex items-center gap-4 flex-1">
        <div className="w-full max-w-xs cursor-pointer" onClick={() => setIsSearchOpen(true)}>
          <SearchBox placeholder="Search pods, nodes, metrics... (Ctrl+K)" readOnly />
        </div>
        <button
          onClick={() => setIsSearchOpen(true)}
          className={cn(
            'hidden md:flex items-center gap-1.5 text-[11px] font-mono border rounded px-2.5 py-1 transition-colors',
            isLight
              ? 'text-slate-500 border-slate-200 bg-slate-100 hover:border-slate-300'
              : 'text-slate-400 border-slate-800 bg-slate-900/80 hover:border-slate-700'
          )}
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
            className={cn('relative', isLight ? 'text-slate-500 hover:text-slate-900' : 'text-slate-400 hover:text-slate-100')}
            title="Notifications"
          >
            <Bell className="h-4 w-4" />
            <span className={cn(
              'absolute top-2 right-2 h-2 w-2 rounded-full bg-rose-500 animate-pulse',
              isLight ? 'ring-2 ring-white' : 'ring-4 ring-slate-950'
            )} />
          </Button>
          <NotificationPanel isOpen={isNotifOpen} onClose={() => setIsNotifOpen(false)} />
        </div>

        <div className={cn('h-4 w-px', isLight ? 'bg-slate-200' : 'bg-slate-800')} />

        <div className="relative">
          {user ? (
            <button
              onClick={() => { setIsProfileOpen((p) => !p); setIsNotifOpen(false); }}
              className={cn(
                'flex items-center gap-2.5 p-1 rounded-lg transition-colors',
                isLight ? 'hover:bg-slate-100' : 'hover:bg-slate-900'
              )}
            >
              <div className="h-8 w-8 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-500 font-semibold text-xs">
                {user.username.charAt(0).toUpperCase()}
              </div>
              <div className="hidden sm:block text-left">
                <p className={cn('text-xs font-semibold leading-tight', isLight ? 'text-slate-800' : 'text-slate-200')}>
                  {user.fullName || user.username}
                </p>
                <p className={cn('text-[10px] font-mono', isLight ? 'text-slate-500' : 'text-slate-400')}>
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
