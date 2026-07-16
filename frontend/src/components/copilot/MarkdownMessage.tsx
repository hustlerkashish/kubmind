import { useState } from 'react';
import { Copy, Check } from 'lucide-react';
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
    success('Copied Code', 'Code block copied to system clipboard');
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  // Split content by code block delimiters (```)
  const parts = content.split(/```/);

  return (
    <div className="space-y-3 font-sans text-xs leading-relaxed text-slate-200">
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
            <div key={index} className="rounded-xl border border-slate-800 bg-slate-950 overflow-hidden my-3 shadow-md">
              <div className="flex items-center justify-between px-3 py-1.5 bg-slate-900 border-b border-slate-800 text-[10px] font-mono text-slate-400">
                <span className="uppercase text-cyan-400 font-semibold">{language}</span>
                <button
                  onClick={() => handleCopyCode(codeText, index)}
                  className="flex items-center gap-1 hover:text-white px-2 py-0.5 rounded transition-colors"
                >
                  {copiedIndex === index ? (
                    <>
                      <Check className="h-3 w-3 text-emerald-400" />
                      <span className="text-emerald-400">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3" />
                      <span>Copy Code</span>
                    </>
                  )}
                </button>
              </div>
              <pre className="p-3 font-mono text-xs text-cyan-300 overflow-x-auto whitespace-pre">
                {codeText.trim()}
              </pre>
            </div>
          );
        }

        // Regular markdown text rendering
        const lines = part.split('\n');

        return (
          <div key={index} className="space-y-1">
            {lines.map((line, lIdx) => {
              if (line.startsWith('### ')) {
                return (
                  <h3 key={lIdx} className="text-sm font-bold text-white pt-2 pb-1 border-b border-slate-800">
                    {line.replace('### ', '')}
                  </h3>
                );
              }
              if (line.startsWith('#### ')) {
                return (
                  <h4 key={lIdx} className="text-xs font-bold text-cyan-400 pt-2 pb-0.5">
                    {line.replace('#### ', '')}
                  </h4>
                );
              }
              if (!line.trim()) {
                return <div key={lIdx} className="h-1" />;
              }

              // Parse bold (**text**) and inline code (`code`)
              const formattedLine = line.split(/(\*\*.*?\*\*|`.*?`)/).map((segment, sIdx) => {
                if (segment.startsWith('**') && segment.endsWith('**')) {
                  return (
                    <strong key={sIdx} className="font-semibold text-white">
                      {segment.slice(2, -2)}
                    </strong>
                  );
                }
                if (segment.startsWith('`') && segment.endsWith('`')) {
                  return (
                    <code key={sIdx} className="font-mono bg-slate-800 text-cyan-300 px-1.5 py-0.5 rounded text-[11px] mx-0.5">
                      {segment.slice(1, -1)}
                    </code>
                  );
                }
                return segment;
              });

              return <p key={lIdx} className="text-slate-300">{formattedLine}</p>;
            })}
          </div>
        );
      })}
    </div>
  );
}
