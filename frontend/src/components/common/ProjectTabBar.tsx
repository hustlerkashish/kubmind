import { useState } from 'react';
import { useProject } from '@/context/ProjectContext';
import { Plus, X, Globe, SlidersHorizontal } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import { useToast } from '@/context/ToastContext';

export function ProjectTabBar() {
  const { projects, activeProjectId, setActiveProjectId, addProject, deleteProject } = useProject();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { success } = useToast();
  const [newTabName, setNewTabName] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const handleTabSwitch = (id: string) => {
    setActiveProjectId(id);
    queryClient.invalidateQueries();
  };

  const handleAddTab = () => {
    if (!newTabName.trim()) {
      setIsAdding(false);
      return;
    }
    const created = addProject(newTabName.trim());
    setNewTabName('');
    setIsAdding(false);
    queryClient.invalidateQueries();
    success('Workspace Created', `Switched active workspace tab to "${created.name}". Configure credentials in Settings.`);
    navigate('/settings');
  };

  return (
    <div className="flex items-center gap-1.5 overflow-x-auto px-6 py-2 border-b border-slate-200 dark:border-slate-800 bg-slate-100/80 dark:bg-slate-950/70 backdrop-blur-md shrink-0">
      <div className="flex items-center gap-1.5 flex-1 min-w-0 overflow-x-auto no-scrollbar">
        {projects.map((proj) => {
          const isActive = proj.id === activeProjectId;
          return (
            <div
              key={proj.id}
              onClick={() => handleTabSwitch(proj.id)}
              className={cn(
                'group relative flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono font-medium cursor-pointer transition-all select-none shrink-0 border',
                isActive
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-cyan-400 border-blue-500/30 dark:border-cyan-500/30 shadow-sm'
                  : 'bg-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-900/40 border-transparent'
              )}
            >
              <Globe className={cn('h-3.5 w-3.5', isActive ? 'text-blue-500 dark:text-cyan-400' : 'text-slate-400')} />
              <span className="truncate max-w-[140px]">{proj.name}</span>

              {proj.githubRepos && (
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-blue-500/10 text-blue-500 dark:text-cyan-400 font-sans font-semibold">
                  {proj.githubRepos.split(',')[0].split('/')[1] || 'repo'}
                </span>
              )}

              {projects.length > 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteProject(proj.id);
                    queryClient.invalidateQueries();
                  }}
                  className="opacity-0 group-hover:opacity-100 hover:text-rose-500 p-0.5 rounded transition-opacity"
                  title="Remove Connection Tab"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          );
        })}

        {/* Add New Tab inline or modal trigger */}
        {isAdding ? (
          <div className="flex items-center gap-1 shrink-0">
            <input
              type="text"
              autoFocus
              value={newTabName}
              onChange={(e) => setNewTabName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddTab();
                if (e.key === 'Escape') setIsAdding(false);
              }}
              placeholder="Workspace / Repo name..."
              className="px-2.5 py-1 text-xs font-mono rounded-lg border border-blue-500 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none w-44"
            />
            <button
              onClick={handleAddTab}
              className="px-2.5 py-1 text-xs bg-blue-600 text-white rounded-lg font-mono font-medium hover:bg-blue-700"
            >
              Add
            </button>
            <button
              onClick={() => setIsAdding(false)}
              className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-medium text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-cyan-400 hover:bg-slate-200/50 dark:hover:bg-slate-900/50 transition-all shrink-0 border border-dashed border-slate-300 dark:border-slate-800"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>New Connection Tab</span>
          </button>
        )}
      </div>

      <button
        onClick={() => navigate('/settings')}
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-900/50 transition-colors shrink-0"
        title="Configure Active Workspace Tokens"
      >
        <SlidersHorizontal className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Configure Tab</span>
      </button>
    </div>
  );
}
