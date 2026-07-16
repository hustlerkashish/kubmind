import { Incident } from '@/services/incidentService';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Bot, Clock, CheckCircle2, AlertCircle } from 'lucide-react';

interface IncidentTimelineModalProps {
  incident: Incident | null;
  onClose: () => void;
  onUpdateStatus: (id: string, newStatus: string) => void;
}

export function IncidentTimelineModal({ incident, onClose, onUpdateStatus }: IncidentTimelineModalProps) {
  if (!incident) return null;

  return (
    <Modal isOpen={!!incident} onClose={onClose} title={`Incident Investigation - ${incident.incidentCode}`} className="max-w-2xl">
      <div className="space-y-5">
        {/* Incident Summary Metadata Card */}
        <div className="p-4 rounded-xl border border-slate-800 bg-slate-950 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-slate-100 font-mono">{incident.podName}</span>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                  incident.severity === 'CRITICAL'
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                }`}
              >
                {incident.severity}
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono mt-1">
              Cluster: {incident.clusterName} • Namespace: {incident.namespace} • Container: {incident.containerName}
            </p>
          </div>

          <div className="text-right">
            <span className="text-[10px] uppercase font-mono text-slate-500 block">Current Status</span>
            <span
              className={`inline-flex items-center gap-1 text-xs font-mono font-bold ${
                incident.status === 'RESOLVED'
                  ? 'text-emerald-400'
                  : incident.status === 'INVESTIGATING'
                  ? 'text-amber-400'
                  : 'text-rose-400'
              }`}
            >
              {incident.status}
            </span>
          </div>
        </div>

        {/* AI Copilot RCA Synthesis */}
        <div className="p-4 rounded-xl border border-cyan-500/30 bg-cyan-950/20 space-y-2">
          <div className="flex items-center gap-2">
            <Bot className="h-4 w-4 text-cyan-400" />
            <h4 className="text-xs font-bold text-cyan-300">AI Copilot Incident Diagnostic Report</h4>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed font-sans">{incident.aiSummary}</p>
        </div>

        {/* Stderr Crash Snippet */}
        <div>
          <p className="text-[11px] font-semibold text-slate-400 mb-1 font-mono">Container Stderr Dump:</p>
          <pre className="p-3 rounded-xl border border-slate-800 bg-slate-950 text-xs text-rose-300 font-mono overflow-x-auto">
            {incident.logSnippet}
          </pre>
        </div>

        {/* Incident Lifecycle Timeline Event Stream */}
        <div>
          <h4 className="text-xs font-bold text-slate-200 mb-3 flex items-center gap-2">
            <Clock className="h-4 w-4 text-blue-400" />
            <span>Incident Lifecycle History Timeline</span>
          </h4>

          <div className="space-y-3 relative before:absolute before:inset-0 before:left-3.5 before:w-0.5 before:bg-slate-800 pl-8">
            <div className="relative">
              <span className="absolute -left-8 top-0.5 h-3.5 w-3.5 rounded-full bg-rose-500 ring-4 ring-slate-950" />
              <p className="text-xs font-semibold text-slate-200">Incident Detected: {incident.reason}</p>
              <p className="text-[10px] text-slate-500 font-mono">{incident.detectedAt}</p>
            </div>

            <div className="relative">
              <span className="absolute -left-8 top-0.5 h-3.5 w-3.5 rounded-full bg-blue-500 ring-4 ring-slate-950" />
              <p className="text-xs font-semibold text-slate-200">AI RCA Diagnostic Engine Executed</p>
              <p className="text-[10px] text-slate-500 font-mono">Root cause mapped with 98% match</p>
            </div>

            {incident.status === 'RESOLVED' && (
              <div className="relative">
                <span className="absolute -left-8 top-0.5 h-3.5 w-3.5 rounded-full bg-emerald-500 ring-4 ring-slate-950" />
                <p className="text-xs font-semibold text-emerald-400">Incident Resolved & Closed</p>
                <p className="text-[10px] text-slate-500 font-mono">{incident.resolvedAt || 'Recently'}</p>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-800">
          <div className="flex items-center gap-2">
            {incident.status !== 'INVESTIGATING' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onUpdateStatus(incident.id, 'INVESTIGATING')}
              >
                <AlertCircle className="h-3.5 w-3.5 mr-1.5 text-amber-400" />
                Mark Investigating
              </Button>
            )}

            {incident.status !== 'RESOLVED' && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => onUpdateStatus(incident.id, 'RESOLVED')}
              >
                <CheckCircle2 className="h-3.5 w-3.5 mr-1.5 text-emerald-400" />
                Mark Resolved
              </Button>
            )}
          </div>

          <Button variant="ghost" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
}
