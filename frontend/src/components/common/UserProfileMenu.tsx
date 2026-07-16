import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { User as UserIcon, Settings, Shield, LogOut, X } from 'lucide-react';

interface UserProfileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export function UserProfileMenu({ isOpen, onClose }: UserProfileMenuProps) {
  const { user, logout } = useAuth();

  if (!isOpen) return null;

  const roles = user?.roles
    ? Array.isArray(user.roles)
      ? user.roles
      : Array.from(user.roles)
    : [user?.role || 'ROLE_DEVELOPER'];

  return (
    <div className="absolute right-0 top-12 w-64 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-500 font-bold text-sm">
            {user?.username?.charAt(0).toUpperCase() || 'O'}
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-800 dark:text-slate-100">{user?.fullName || user?.username}</p>
            <p className="text-[10px] text-slate-500 font-mono">{user?.email}</p>
          </div>
        </div>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-900 dark:hover:text-white">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="p-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-slate-500 font-mono">Assigned Role</span>
          <span className="flex items-center gap-1 font-mono font-semibold text-purple-600 dark:text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/30 text-[10px]">
            <Shield className="h-3 w-3" />
            {roles.join(', ')}
          </span>
        </div>
      </div>

      <div className="p-1 space-y-0.5">
        <Link
          to="/profile"
          onClick={onClose}
          className="flex items-center gap-2.5 px-3 py-2 text-xs text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-900 rounded-lg transition-colors"
        >
          <UserIcon className="h-4 w-4 text-blue-500" />
          <span>Operator Profile</span>
        </Link>

        <Link
          to="/settings"
          onClick={onClose}
          className="flex items-center gap-2.5 px-3 py-2 text-xs text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-900 rounded-lg transition-colors"
        >
          <Settings className="h-4 w-4 text-slate-400" />
          <span>System Settings</span>
        </Link>
      </div>

      <div className="p-1 border-t border-slate-200 dark:border-slate-800">
        <button
          onClick={() => {
            onClose();
            logout();
          }}
          className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors"
        >
          <LogOut className="h-4 w-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
}
