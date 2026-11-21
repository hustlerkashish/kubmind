import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { Sparkles, X, Send, Bot, User, Terminal, ShieldCheck } from 'lucide-react';
import { copilotApi } from '@/services/copilotService';
import { Button } from '@/components/ui/Button';
import { usePods } from '@/hooks/useKubernetes';
import { MarkdownMessage } from './MarkdownMessage';

interface Message {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: string;
  actions?: string[];
}

const timeNow = () =>
  new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

export function GlobalCopilotDrawer() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [error, setError] = useState('');
  const { data: livePods = [] } = usePods('all');
  const [selectedPod, setSelectedPod] = useState('');
  const location = useLocation();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'j') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (isOpen) messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen, isLoading]);

  useEffect(() => {
    if (selectedPod && !livePods.some((pod) => pod.name === selectedPod)) {
      setSelectedPod('');
    }
  }, [livePods, selectedPod]);

  const getContextName = () => {
    if (location.pathname.includes('/pods')) return 'Kubernetes Pods & Workloads';
    if (location.pathname.includes('/logs')) return 'Live Log Explorer';
    if (location.pathname.includes('/metrics')) return 'Prometheus Telemetry';
    if (location.pathname.includes('/incidents')) return 'Incident & RCA Center';
    if (location.pathname.includes('/deployments')) return 'Deployments & CI/CD';
    return 'Cluster Command Center';
  };

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || input).trim();
    if (!query || isLoading) return;

    setError('');
    setMessages((prev) => [
      ...prev,
      { id: `user-${Date.now()}`, sender: 'user', text: query, timestamp: timeNow() },
    ]);
    if (!textToSend) setInput('');
    setIsLoading(true);

    try {
      let activeSessionId = sessionId;

      if (!activeSessionId) {
        const created = await copilotApi.createSession('Global Copilot');
        activeSessionId = created.id;
        setSessionId(created.id);
      }

      const selected = livePods.find((pod) => pod.name === selectedPod);
      const response = await copilotApi.chat(
        activeSessionId,
        query,
        selected?.namespace,
        selected?.name
      );

      setMessages((prev) => [
        ...prev,
        {
          id: `assistant-${Date.now()}`,
          sender: 'bot',
          text: response.reply,
          timestamp: timeNow(),
          actions: response.diagnosis?.remediationCommand
            ? [response.diagnosis.remediationCommand]
            : [],
        },
      ]);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'The Copilot request failed.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyCommand = async (cmd: string) => {
    try {
      await navigator.clipboard.writeText(cmd);
      setError('');
    } catch {
      setError('Could not copy the command. Check your browser clipboard permissions.');
    }
  };

  return (
    <>
      <button
        id="global-ai-copilot-btn"
        onClick={() => setIsOpen(true)}
        aria-label="Open AI Copilot"
        className="fixed bottom-6 right-6 z-40 h-13 w-13 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-400 text-white shadow-xl shadow-blue-500/25 flex items-center justify-center hover:scale-105 active:scale-95 transition-all duration-200 group border border-white/20"
      >
        <Sparkles className="h-6 w-6 transition-transform group-hover:rotate-12" />
      </button>

      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-50 transition-opacity"
        />
      )}

      <div
        className={`fixed top-0 right-0 bottom-0 w-full sm:w-[480px] z-50 bg-white dark:bg-[#0c121e] border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col transition-transform duration-300 ease-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Sparkles className="h-6 w-6 text-blue-500" />
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                KubeMind AI Copilot
              </h2>
              <p className="text-[11px] text-slate-500">
                Context: {getContextName()}
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            aria-label="Close Copilot"
            className="h-8 w-8 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 flex items-center justify-center"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-3 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
          <label htmlFor="drawer-copilot-pod" className="text-xs text-slate-500">
            Optional pod:
          </label>
          <select
            id="drawer-copilot-pod"
            value={selectedPod}
            onChange={(e) => setSelectedPod(e.target.value)}
            className="min-w-0 flex-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-2 text-xs"
          >
            <option value="">No specific pod</option>
            {livePods.map((pod) => (
              <option key={`${pod.namespace}/${pod.name}`} value={pod.name}>
                {pod.name} ({pod.namespace})
              </option>
            ))}
          </select>
        </div>

        <div className="p-3 border-b border-slate-100 dark:border-slate-800 flex gap-2 overflow-x-auto text-[11px]">
          {[
            'Diagnose cluster health',
            'Explain pod CPU throttling',
            'Check OOMKilled logs',
            'Show recent warning events',
          ].map((prompt) => (
            <button
              key={prompt}
              onClick={() => handleSendMessage(prompt)}
              disabled={isLoading}
              className="shrink-0 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 disabled:opacity-50"
            >
              {prompt}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <p className="text-xs text-slate-500 text-center py-8">
              Ask a question about your Kubernetes cluster. Select a pod above if
              your question concerns a specific workload.
            </p>
          )}

          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 text-xs leading-relaxed ${
                msg.sender === 'user' ? 'flex-row-reverse' : ''
              }`}
            >
              <div className="h-7 w-7 rounded-lg shrink-0 flex items-center justify-center bg-indigo-500/10 text-indigo-500">
                {msg.sender === 'user' ? <User className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5" />}
              </div>
              <div className="max-w-[85%] rounded-2xl p-3.5 space-y-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                {msg.sender === 'user' ? (
                  <div className="whitespace-pre-wrap">{msg.text}</div>
                ) : (
                  <MarkdownMessage content={msg.text} />
                )}

                {!!msg.actions?.length && (
                  <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-800 space-y-1.5">
                    <p className="text-[10px] font-semibold text-slate-500 uppercase">
                      Suggested remediation command — not executed
                    </p>
                    {msg.actions.map((command, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => handleCopyCommand(command)}
                        className="w-full p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 font-mono text-[11px] text-cyan-600 dark:text-cyan-400 text-left"
                      >
                        <span className="break-all">{command}</span>
                        <Terminal className="h-3 w-3 shrink-0" />
                      </button>
                    ))}
                  </div>
                )}
                <div className="text-[9px] text-slate-400 text-right">{msg.timestamp}</div>
              </div>
            </div>
          ))}

          {error && (
            <div role="alert" className="rounded-lg border border-rose-300 bg-rose-50 dark:bg-rose-950/30 p-3 text-xs text-rose-700 dark:text-rose-300">
              Copilot request failed: {error}
            </div>
          )}

          {isLoading && (
            <div className="text-xs text-slate-500 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-cyan-500 animate-pulse" />
              Waiting for the Copilot service...
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 border-t border-slate-200 dark:border-slate-800">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask KubeMind Copilot..."
              className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 py-2.5 px-3.5 text-xs"
            />
            <Button
              type="submit"
              size="sm"
              variant="primary"
              disabled={!input.trim() || isLoading}
              className="rounded-xl px-3"
            >
              <Send className="h-3.5 w-3.5" />
            </Button>
          </form>
          <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400">
            <span>Ctrl/Cmd + J</span>
            <span className="flex items-center gap-1">
              <ShieldCheck className="h-3 w-3 text-emerald-500" />
              Read-only requests
            </span>
          </div>
        </div>
      </div>
    </>
  );
}
