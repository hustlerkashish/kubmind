import { useState, useEffect, useRef } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import {
  copilotApi,
  type CopilotResponse,
  type ChatSession,
  type ChatMessage as StoredChatMessage,
} from '@/services/copilotService';
import { MarkdownMessage } from '@/components/copilot/MarkdownMessage';
import { usePods } from '@/hooks/useKubernetes';
import {
  Bot,
  Send,
  Sparkles,
  User,
  Plus,
  MessageSquare,
  Zap,
  RefreshCw,
  AlertTriangle,
  Layers,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  ShieldAlert,
} from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  content: string;
  timestamp: string;
  responseMeta?: CopilotResponse;
  toolsExecuted?: string[];
  confidenceScore?: number;
  remediationCommand?: string;
}

function formatTime(value?: string): string {
  if (!value) return '';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? ''
    : date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function parseTools(value?: string): string[] {
  if (!value) return [];

  try {
    const parsed: unknown = JSON.parse(value);
    if (Array.isArray(parsed)) {
      return parsed.filter((item): item is string => typeof item === 'string');
    }
  } catch {
    // Older persisted records may contain comma-separated tool names.
  }

  return value.split(',').map((item) => item.trim()).filter(Boolean);
}

function mapStoredMessage(message: StoredChatMessage): ChatMessage {
  return {
    id: message.id,
    sender: message.sender,
    content: message.content,
    timestamp: formatTime(message.createdAt),
    toolsExecuted: parseTools(message.toolsExecuted),
    confidenceScore: message.confidenceScore,
    remediationCommand: message.remediationCommand,
  };
}

export function CopilotChatPage() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [targetPodKey, setTargetPodKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingSessions, setIsLoadingSessions] = useState(true);
  const [showSessionsDropdown, setShowSessionsDropdown] = useState(false);
  const [error, setError] = useState('');

  const { data: livePods = [] } = usePods('all');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesRequestRef = useRef(0);

  const selectedPod = livePods.find(
    (pod) => `${pod.namespace}/${pod.name}` === targetPodKey,
  );

  const activeSessionTitle =
    sessions.find((session) => session.id === activeSessionId)?.sessionTitle ||
    'New conversation';

  useEffect(() => {
    let cancelled = false;

    const initialize = async () => {
      setIsLoadingSessions(true);
      setError('');

      try {
        const list = await copilotApi.getSessions();
        if (cancelled) return;

        setSessions(list);

        if (list.length > 0) {
          const firstSession = list[0];
          setActiveSessionId(firstSession.id);

          const requestId = ++messagesRequestRef.current;
          const history = await copilotApi.getSessionMessages(firstSession.id);

          if (!cancelled && requestId === messagesRequestRef.current) {
            setMessages(history.map(mapStoredMessage));
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : 'Unable to load Copilot sessions.',
          );
        }
      } finally {
        if (!cancelled) setIsLoadingSessions(false);
      }
    };

    initialize();

    return () => {
      cancelled = true;
      messagesRequestRef.current++;
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleCreateNewSession = async () => {
    if (isLoading) return;

    setError('');

    try {
      const created = await copilotApi.createSession('New conversation');

      messagesRequestRef.current++;
      setSessions((previous) => [created, ...previous]);
      setActiveSessionId(created.id);
      setMessages([]);
      setShowSessionsDropdown(false);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Unable to create a new session.',
      );
    }
  };

  const handleSelectSession = async (sessionId: string) => {
    if (sessionId === activeSessionId) {
      setShowSessionsDropdown(false);
      return;
    }

    const requestId = ++messagesRequestRef.current;

    setActiveSessionId(sessionId);
    setMessages([]);
    setError('');
    setShowSessionsDropdown(false);

    try {
      const history = await copilotApi.getSessionMessages(sessionId);

      if (requestId === messagesRequestRef.current) {
        setMessages(history.map(mapStoredMessage));
      }
    } catch (err) {
      if (requestId === messagesRequestRef.current) {
        setError(
          err instanceof Error ? err.message : 'Unable to load conversation history.',
        );
      }
    }
  };

  const handleSendMessage = async (customPrompt?: string) => {
    const text = (customPrompt ?? inputMessage).trim();

    if (!text || isLoading) return;

    setError('');
    setInputMessage('');
    setIsLoading(true);

    const requestId = ++messagesRequestRef.current;

    const userMessage: ChatMessage = {
      id: `local-user-${Date.now()}`,
      sender: 'user',
      content: text,
      timestamp: formatTime(new Date().toISOString()),
    };

    setMessages((previous) => [...previous, userMessage]);

    try {
      let sessionId = activeSessionId;

      // Create a real persisted session only when the first message is sent.
      if (!sessionId) {
        const created = await copilotApi.createSession(
          text.slice(0, 60) || 'New conversation',
        );

        sessionId = created.id;
        setSessions((previous) => [created, ...previous]);
        setActiveSessionId(created.id);
      }

      const response = await copilotApi.chat(
        sessionId,
        text,
        selectedPod?.namespace,
        selectedPod?.name,
      );

      if (requestId !== messagesRequestRef.current) return;

      const assistantMessage: ChatMessage = {
        id: `local-assistant-${Date.now()}`,
        sender: 'assistant',
        content: response.reply,
        timestamp: formatTime(new Date().toISOString()),
        responseMeta: response,
        toolsExecuted: response.toolsExecuted,
        confidenceScore: response.diagnosis?.confidenceScore,
        remediationCommand: response.diagnosis?.remediationCommand,
      };

      setMessages((previous) => [...previous, assistantMessage]);
    } catch (err) {
      if (requestId === messagesRequestRef.current) {
        setError(
          err instanceof Error ? err.message : 'Copilot request failed.',
        );
      }
    } finally {
      if (requestId === messagesRequestRef.current) {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="max-w-5xl mx-auto w-full space-y-6 pb-12">
      <PageHeader
        title="KubeMind AI Copilot Command Center"
        description="Ask questions about your Kubernetes cluster and investigate incidents using available cluster evidence."
        actions={
          <div className="flex items-center gap-2">
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowSessionsDropdown(!showSessionsDropdown)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-mono font-medium text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700 shadow-sm"
              >
                <MessageSquare className="h-3.5 w-3.5 text-blue-500" />
                <span className="truncate max-w-[150px]">{activeSessionTitle}</span>
                <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
              </button>

              {showSessionsDropdown && (
                <div className="absolute right-0 mt-1 w-64 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2 shadow-xl z-30 space-y-1">
                  <div className="flex items-center justify-between px-2 py-1 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-[10px] font-mono uppercase font-bold text-slate-400">
                      Past Sessions
                    </span>
                    <button
                      type="button"
                      onClick={handleCreateNewSession}
                      className="text-[10px] font-mono text-blue-600 dark:text-cyan-400 hover:underline flex items-center gap-1"
                    >
                      <Plus className="h-3 w-3" /> New
                    </button>
                  </div>

                  {sessions.map((session) => (
                    <button
                      type="button"
                      key={session.id}
                      onClick={() => handleSelectSession(session.id)}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-mono truncate transition-colors ${
                        activeSessionId === session.id
                          ? 'bg-blue-50 dark:bg-slate-800 text-blue-600 dark:text-cyan-400 font-bold'
                          : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                      }`}
                    >
                      {session.sessionTitle}
                    </button>
                  ))}

                  {sessions.length === 0 && (
                    <p className="px-2 py-3 text-xs text-slate-400">
                      No saved conversations yet.
                    </p>
                  )}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={handleCreateNewSession}
              disabled={isLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium shadow-sm disabled:opacity-50"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>New Chat</span>
            </button>
          </div>
        }
      />

      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20 shrink-0">
              <Bot className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider font-mono">
                  Diagnostic Target Scope
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                  <span className={`w-1.5 h-1.5 rounded-full ${livePods.length > 0 ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                  {livePods.length > 0 ? `${livePods.length} live pods available` : 'No live pods available'}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Pod:{' '}
                <span className="font-mono font-bold text-blue-600 dark:text-cyan-400">
                  {selectedPod?.name ?? 'None selected'}
                </span>
                <span className="mx-2 text-slate-300 dark:text-slate-700">•</span>
                Namespace:{' '}
                <span className="font-mono font-bold text-purple-600 dark:text-purple-400">
                  {selectedPod?.namespace ?? '—'}
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={targetPodKey}
              onChange={(event) => setTargetPodKey(event.target.value)}
              className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 py-2 px-3 text-xs text-slate-900 dark:text-slate-100 font-mono font-medium focus:border-blue-500 focus:outline-none flex-1 sm:w-60 shadow-sm"
            >
              <option value="">No specific pod</option>
              {livePods.map((pod) => (
                <option
                  key={`${pod.namespace}/${pod.name}`}
                  value={`${pod.namespace}/${pod.name}`}
                >
                  {pod.name} ({pod.namespace})
                </option>
              ))}
            </select>

            <button
              type="button"
              disabled={!selectedPod || isLoading}
              onClick={() =>
                selectedPod &&
                handleSendMessage(
                  `Diagnose pod ${selectedPod.name} in namespace ${selectedPod.namespace}.`,
                )
              }
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-mono font-bold shadow-md disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
              title="Diagnose selected live pod"
            >
              <ShieldAlert className="h-4 w-4" />
              <span>Diagnose</span>
            </button>
          </div>
        </div>

        {livePods.length > 0 && (
          <div className="mt-3.5 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-mono uppercase font-bold text-slate-400 shrink-0">
              Live Pods:
            </span>
            {livePods.slice(0, 6).map((pod) => {
              const key = `${pod.namespace}/${pod.name}`;
              const isSelected = targetPodKey === key;
              const isProblem =
                pod.status === 'Error' ||
                pod.status === 'OOMKilled' ||
                pod.status === 'CrashLoopBackOff';

              return (
                <button
                  type="button"
                  key={key}
                  onClick={() => setTargetPodKey(key)}
                  className={`text-[10px] font-mono px-2.5 py-1 rounded-lg border transition-all flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-blue-600 text-white border-blue-600 shadow-sm font-bold'
                      : isProblem
                        ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-900/60'
                        : 'bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  {isProblem && <AlertCircle className="h-3 w-3 shrink-0" />}
                  <span className="truncate max-w-[130px]">{pod.name}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {error && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-xl border border-rose-300 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/30 p-3 text-xs text-rose-700 dark:text-rose-300"
        >
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{error}</span>
          <button
            type="button"
            onClick={() => setError('')}
            className="ml-auto underline shrink-0"
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden flex flex-col">
        <div className="p-6 md:p-8 space-y-6 min-h-[460px] max-h-[620px] overflow-y-auto">
          {isLoadingSessions && (
            <p className="text-xs text-slate-400 font-mono">Loading saved conversations...</p>
          )}

          {!isLoadingSessions && messages.length === 0 && (
            <div className="min-h-[350px] flex flex-col items-center justify-center text-center gap-3">
              <Bot className="h-10 w-10 text-slate-300 dark:text-slate-700" />
              <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                No messages in this conversation yet.
              </p>
              <p className="text-xs text-slate-400 max-w-md">
                Ask a question about your cluster, or select a live pod to investigate an incident.
              </p>
            </div>
          )}

          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex items-start gap-4 ${
                message.sender === 'user' ? 'flex-row-reverse' : 'flex-row'
              }`}
            >
              <div
                className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 shadow-md ${
                  message.sender === 'user'
                    ? 'bg-gradient-to-tr from-blue-600 to-indigo-600 text-white'
                    : 'bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 text-white'
                }`}
              >
                {message.sender === 'user' ? (
                  <User className="h-4 w-4" />
                ) : (
                  <Bot className="h-4 w-4" />
                )}
              </div>

              <div className={`space-y-1.5 max-w-3xl ${message.sender === 'user' ? 'text-right' : 'text-left flex-1'}`}>
                {message.sender === 'user' ? (
                  <div className="inline-block p-4 rounded-2xl rounded-tr-sm bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium text-xs leading-relaxed shadow-md text-left">
                    <p className="whitespace-pre-wrap">{message.content}</p>
                  </div>
                ) : (
                  <div className="p-5 rounded-2xl rounded-tl-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-sm text-xs leading-relaxed">
                    <MarkdownMessage content={message.content} />

                    {message.toolsExecuted && message.toolsExecuted.length > 0 && (
                      <div className="mt-5 pt-3.5 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2 flex-wrap text-[11px] font-mono">
                        <span className="text-slate-500 dark:text-slate-400 font-semibold">
                          MCP tools:
                        </span>
                        {message.toolsExecuted.map((tool, index) => (
                          <span
                            key={`${tool}-${index}`}
                            className="px-2 py-0.5 rounded bg-blue-50 dark:bg-cyan-950/40 text-blue-700 dark:text-cyan-300 border border-blue-200 dark:border-cyan-800/60 font-bold"
                          >
                            {tool}
                          </span>
                        ))}
                      </div>
                    )}

                    {typeof message.confidenceScore === 'number' && (
                      <div className="mt-3 flex items-center gap-1.5 text-[11px] font-mono text-emerald-700 dark:text-emerald-400">
                        <CheckCircle2 className="h-3 w-3" />
                        Confidence: {message.confidenceScore}%
                      </div>
                    )}

                    {message.remediationCommand && (
                      <div className="mt-3 rounded-lg border border-amber-300 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/20 p-3">
                        <p className="text-[10px] font-bold uppercase tracking-wide text-amber-700 dark:text-amber-400 mb-2">
                          Suggested remediation command — not executed
                        </p>
                        <pre className="whitespace-pre-wrap break-all text-xs text-slate-800 dark:text-slate-200">
                          {message.remediationCommand}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono block px-1">
                  {message.timestamp}
                </span>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex items-center gap-3 p-4 rounded-2xl border border-cyan-500/30 bg-cyan-500/10 text-xs text-cyan-800 dark:text-cyan-200 font-mono">
              <RefreshCw className="h-4 w-4 animate-spin text-cyan-600 dark:text-cyan-400" />
              <span>Waiting for the Copilot response...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 md:p-6 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-xs font-mono">
            <button
              type="button"
              disabled={!selectedPod || isLoading}
              onClick={() =>
                selectedPod &&
                handleSendMessage(
                  `Diagnose pod ${selectedPod.name} in namespace ${selectedPod.namespace}.`,
                )
              }
              className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-left flex items-center gap-2 disabled:opacity-40"
            >
              <AlertTriangle className="h-3.5 w-3.5 text-rose-500 shrink-0" />
              <span className="truncate">
                {selectedPod ? `Diagnose ${selectedPod.name}` : 'Select a pod to diagnose'}
              </span>
            </button>

            <button
              type="button"
              disabled={isLoading}
              onClick={() => handleSendMessage('Which pod is consuming the most memory?')}
              className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-left flex items-center gap-2 disabled:opacity-40"
            >
              <Zap className="h-3.5 w-3.5 text-amber-500 shrink-0" />
              <span className="truncate">Top Memory Pods</span>
            </button>

            <button
              type="button"
              disabled={isLoading}
              onClick={() => handleSendMessage('Show recent cluster warning events.')}
              className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-left flex items-center gap-2 disabled:opacity-40"
            >
              <Layers className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
              <span className="truncate">Cluster Warning Events</span>
            </button>

            <button
              type="button"
              disabled={isLoading}
              onClick={() => handleSendMessage('Explain how to investigate an OOMKilled pod.')}
              className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-left flex items-center gap-2 disabled:opacity-40"
            >
              <Sparkles className="h-3.5 w-3.5 text-cyan-500 shrink-0" />
              <span className="truncate">Investigate OOMKilled</span>
            </button>
          </div>

          <div className="relative flex items-center">
            <input
              type="text"
              value={inputMessage}
              onChange={(event) => setInputMessage(event.target.value)}
              onKeyDown={(event) => event.key === 'Enter' && handleSendMessage()}
              placeholder="Ask about your Kubernetes cluster..."
              className="w-full rounded-2xl border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 py-3.5 pl-4 pr-12 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:border-blue-500 focus:outline-none shadow-sm"
            />
            <button
              type="button"
              onClick={() => handleSendMessage()}
              disabled={isLoading || !inputMessage.trim()}
              className="absolute right-2.5 h-8 w-8 rounded-xl bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center disabled:opacity-50 shadow-md"
              title="Send Message"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
