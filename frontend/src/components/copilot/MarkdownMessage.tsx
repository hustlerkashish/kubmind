import { useState } from 'react';
import { Copy, Check, Terminal } from 'lucide-react';
import { useToast } from '@/context/ToastContext';

interface MarkdownMessageProps {
  content: string;
}

export function MarkdownMessage({ content }: MarkdownMessageProps) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const { success } = useToast();

  const handleCopyCode = (codeText: string, idx: number) => {
    navigator.clipboard.writeText(codeText.trim());
    setCopiedIndex(idx);
    success('Copied to Clipboard', 'Remediation command copied to clipboard');
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  // Split content by code block delimiters (```)
  const parts = content.split(/```/);

  return (
    <div className="space-y-3 font-sans text-xs leading-relaxed text-slate-800 dark:text-slate-200">
      {parts.map((part, index) => {
        // Odd indexes are code blocks inside ``` ... ```
        if (index % 2 === 1) {
          const firstLineEnd = part.indexOf('\n');
          let language = 'bash';
          let codeText = part;

          if (firstLineEnd !== -1) {
            const possibleLang = part.substring(0, firstLineEnd).trim();
            if (possibleLang && !possibleLang.includes(' ')) {
              language = possibleLang;
              codeText = part.substring(firstLineEnd + 1);
            }
          }

          return (
            <div key={index} className="rounded-xl border border-slate-300 dark:border-slate-800 bg-slate-950 overflow-hidden my-3 shadow-md">
              <div className="flex items-center justify-between px-3.5 py-2 bg-slate-900 border-b border-slate-800 text-[11px] font-mono">
                <span className="uppercase text-cyan-400 font-bold tracking-wider flex items-center gap-1.5">
                  <Terminal className="h-3.5 w-3.5 text-cyan-400" />
                  {language}
                </span>
                <button
                  type="button"
                  onClick={() => handleCopyCode(codeText, index)}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white transition-all text-[11px] font-sans font-medium"
                >
                  {copiedIndex === index ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      <span>Copy Code</span>
                    </>
                  )}
                </button>
              </div>
              <pre className="p-3.5 font-mono text-xs text-emerald-400 overflow-x-auto whitespace-pre leading-relaxed">
                {codeText.trim()}
              </pre>
            </div>
          );
        }

        // Regular markdown text rendering
        const lines = part.split('\n');

        return (
          <div key={index} className="space-y-1.5">
            {lines.map((line, lIdx) => {
              if (line.startsWith('### ')) {
                return (
                  <h3 key={lIdx} className="text-sm sm:text-base font-bold text-slate-900 dark:text-white pt-2.5 pb-1.5 border-b border-slate-200 dark:border-slate-800/80">
                    {line.replace('### ', '')}
                  </h3>
                );
              }
              if (line.startsWith('#### ')) {
                return (
                  <h4 key={lIdx} className="text-xs font-bold uppercase tracking-wide text-blue-600 dark:text-cyan-400 pt-2.5 pb-0.5">
                    {line.replace('#### ', '')}
                  </h4>
                );
              }
              if (!line.trim()) {
                return <div key={lIdx} className="h-1.5" />;
              }

              // Parse bold (**text**) and inline code (`code`)
              const formattedLine = line.split(/(\*\*.*?\*\*|`.*?`)/).map((segment, sIdx) => {
                if (segment.startsWith('**') && segment.endsWith('**')) {
                  return (
                    <strong key={sIdx} className="font-bold text-slate-900 dark:text-white">
                      {segment.slice(2, -2)}
                    </strong>
                  );
                }
                if (segment.startsWith('`') && segment.endsWith('`')) {
                  return (
                    <code key={sIdx} className="font-mono font-semibold bg-slate-200/80 dark:bg-slate-800 text-blue-700 dark:text-cyan-300 px-1.5 py-0.5 rounded text-[11px] border border-slate-300/70 dark:border-slate-700/80 mx-0.5">
                      {segment.slice(1, -1)}
                    </code>
                  );
                }
                return segment;
              });

              return (
                <p key={lIdx} className="text-slate-700 dark:text-slate-300 text-xs leading-relaxed">
                  {formattedLine}
                </p>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
