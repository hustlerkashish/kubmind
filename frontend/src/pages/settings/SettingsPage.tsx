import { useState, useEffect } from 'react';
import { useProject } from '@/context/ProjectContext';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { GitBranch, Server, Activity, Eye, EyeOff, Save, Trash2, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/context/ToastContext';
import { useQueryClient } from '@tanstack/react-query';

export function SettingsPage() {
  const { activeProject, updateProject, deleteProject, projects } = useProject();
  const { success } = useToast();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState(activeProject);
  const [showGithubToken, setShowGithubToken] = useState(false);
  const [showK8sToken, setShowK8sToken] = useState(false);
  const [showGrafanaKey, setShowGrafanaKey] = useState(false);

  useEffect(() => {
    setFormData(activeProject);
  }, [activeProject]);

  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    updateProject(activeProject.id, formData);
    queryClient.invalidateQueries();
    success('Workspace Settings Saved', `Updated configuration for "${formData.name}". Telemetry re-synced.`);
  };

  const handleDelete = () => {
    if (projects.length <= 1) return;
    deleteProject(activeProject.id);
    queryClient.invalidateQueries();
    success('Workspace Deleted', 'Removed workspace connection tab.');
  };

  return (
    <div className="space-y-6 pb-12 max-w-4xl">
      <PageHeader
        title="Workspace Connection & Token Settings"
        description="Configure custom GitHub tokens, repositories, Kubernetes cluster endpoints, Prometheus, and Grafana URLs for the active connection tab."
      />

      {/* Active Tab Workspace Header Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Active Workspace Tab: {activeProject.name}</CardTitle>
              <CardDescription>All token credentials entered below are isolated strictly to this workspace tab.</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {projects.length > 1 && (
                <Button variant="ghost" size="sm" onClick={handleDelete} className="text-rose-500 hover:text-rose-600">
                  <Trash2 className="h-4 w-4 mr-1" /> Delete Tab
                </Button>
              )}
              <Button variant="primary" size="sm" onClick={handleSave}>
                <Save className="h-4 w-4 mr-1.5" /> Save Configuration
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-xs font-mono font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Workspace Tab Display Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="e.g. My Portfolio Site, Production Cluster..."
              className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 py-2 px-3 text-xs text-slate-800 dark:text-slate-100 font-mono focus:border-blue-500 focus:outline-none"
            />
          </div>
        </CardContent>
      </Card>

      {/* 1. GitHub Integration Form */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-500">
              <GitBranch className="h-5 w-5" />
            </div>
            <div>
              <CardTitle>GitHub Actions & Deployment Integration</CardTitle>
              <CardDescription>Personal Access Token (PAT) and connected target repositories</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-xs font-mono font-semibold text-slate-700 dark:text-slate-300 mb-1">
              GitHub Personal Access Token (classic with `repo` & `workflow` scope)
            </label>
            <div className="relative">
              <input
                type={showGithubToken ? 'text' : 'password'}
                value={formData.githubToken}
                onChange={(e) => handleChange('githubToken', e.target.value)}
                placeholder="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 py-2 pl-3 pr-10 text-xs text-slate-800 dark:text-slate-100 font-mono focus:border-blue-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowGithubToken(!showGithubToken)}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                {showGithubToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Generate a token at <a href="https://github.com/settings/tokens" target="_blank" rel="noreferrer" className="text-blue-500 underline">github.com/settings/tokens</a>.
            </p>
          </div>

          <div>
            <label className="block text-xs font-mono font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Connected Repositories (comma-separated `owner/repo`)
            </label>
            <input
              type="text"
              value={formData.githubRepos}
              onChange={(e) => handleChange('githubRepos', e.target.value)}
              placeholder="hustlerkashish/my_portfolio_website, owner/another-repo"
              className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 py-2 px-3 text-xs text-slate-800 dark:text-slate-100 font-mono focus:border-blue-500 focus:outline-none"
            />
          </div>
        </CardContent>
      </Card>

      {/* 2. Kubernetes Cluster Endpoint Form */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-500">
              <Server className="h-5 w-5" />
            </div>
            <div>
              <CardTitle>Kubernetes Cluster Endpoint</CardTitle>
              <CardDescription>Target API server host and service account bearer token</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono font-semibold text-slate-700 dark:text-slate-300 mb-1">
                API Server Host URL
              </label>
              <input
                type="text"
                value={formData.k8sUrl}
                onChange={(e) => handleChange('k8sUrl', e.target.value)}
                placeholder="https://127.0.0.1:6443 or https://k8s.my-server.com"
                className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 py-2 px-3 text-xs text-slate-800 dark:text-slate-100 font-mono focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-mono font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Service Account Token (Bearer)
              </label>
              <div className="relative">
                <input
                  type={showK8sToken ? 'text' : 'password'}
                  value={formData.k8sToken}
                  onChange={(e) => handleChange('k8sToken', e.target.value)}
                  placeholder="eyJhbGciOiJSUzI1NiIs..."
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 py-2 pl-3 pr-10 text-xs text-slate-800 dark:text-slate-100 font-mono focus:border-blue-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowK8sToken(!showK8sToken)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  {showK8sToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 3. Prometheus & Grafana Configuration */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-500">
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <CardTitle>Prometheus & Grafana Ingestion</CardTitle>
              <CardDescription>PromQL time-series server URL and Grafana alert endpoints</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Prometheus Server URL
              </label>
              <input
                type="text"
                value={formData.prometheusUrl}
                onChange={(e) => handleChange('prometheusUrl', e.target.value)}
                placeholder="http://localhost:9090 or http://prometheus-server:80"
                className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 py-2 px-3 text-xs text-slate-800 dark:text-slate-100 font-mono focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-mono font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Grafana Server Host URL
              </label>
              <input
                type="text"
                value={formData.grafanaUrl}
                onChange={(e) => handleChange('grafanaUrl', e.target.value)}
                placeholder="http://localhost:3000 or http://grafana.internal"
                className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 py-2 px-3 text-xs text-slate-800 dark:text-slate-100 font-mono focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Grafana Service API Key / Service Token
            </label>
            <div className="relative">
              <input
                type={showGrafanaKey ? 'text' : 'password'}
                value={formData.grafanaApiKey}
                onChange={(e) => handleChange('grafanaApiKey', e.target.value)}
                placeholder="glsa_xxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 py-2 pl-3 pr-10 text-xs text-slate-800 dark:text-slate-100 font-mono focus:border-blue-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowGrafanaKey(!showGrafanaKey)}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                {showGrafanaKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Action Bar */}
      <div className="flex justify-end gap-3 pt-2">
        <Button variant="primary" size="md" onClick={handleSave}>
          <CheckCircle2 className="h-4 w-4 mr-2" /> Save Workspace Configuration
        </Button>
      </div>
    </div>
  );
}
