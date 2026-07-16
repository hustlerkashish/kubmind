import { GrafanaEmbed } from '@/services/prometheusService';
import { Sliders, ExternalLink } from 'lucide-react';

interface GrafanaEmbedCardProps {
  panel: GrafanaEmbed;
}

export function GrafanaEmbedCard({ panel }: GrafanaEmbedCardProps) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-md relative overflow-hidden flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-400">
              <Sliders className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-100">{panel.title}</h3>
              <p className="text-[11px] text-slate-400">{panel.description}</p>
            </div>
          </div>
          <a
            href={panel.embedUrl}
            target="_blank"
            rel="noreferrer"
            className="text-slate-400 hover:text-white p-1.5 rounded transition-colors"
            title="Open panel in Grafana"
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>

        {/* Grafana Panel Iframe Placeholder Container */}
        <div className="mt-3 h-[180px] rounded-lg border border-slate-800/80 bg-slate-950 flex flex-col items-center justify-center p-4 text-center relative">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent pointer-events-none rounded-lg" />
          <Sliders className="h-8 w-8 text-orange-400/80 mb-2" />
          <p className="text-xs font-semibold text-slate-200">Grafana Panel Endpoint Ready</p>
          <p className="text-[10px] text-slate-500 font-mono mt-1 max-w-xs truncate">
            {panel.embedUrl}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-slate-800/60 mt-4 text-[10px] text-slate-500 font-mono">
        <span>Dashboard UID: {panel.dashboardUid}</span>
        <span className="text-orange-400 font-semibold">Grafana v10.4 Ready</span>
      </div>
    </div>
  );
}
