import { useState, useEffect, useRef } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { copilotApi, CopilotResponse, ChatSession } from '@/services/copilotService';
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
import { useToast } from '@/context/ToastContext';

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  content: string;
  responseMeta?: CopilotResponse;
  timestamp: string;
}

export function CopilotChatPage() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string>('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d');
  const [inputMessage, setInputMessage] = useState('');
  const [targetPod, setTargetPod] = useState('memory-crash-pod');
  const [targetNamespace, setTargetNamespace] = useState('default');
  const [isLoading, setIsLoading] = useState(false);
  const [showSessionsDropdown, setShowSessionsDropdown] = useState(false);

  const { data: livePods = [] } = usePods('all');
  const { success } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-0',
      sender: 'assistant',
      content:
        'Hello Operator! I am your **KubeMind LangGraph AI Copilot**.\n\nI analyze container crash logs, evaluate Linux Kernel exit codes, diagnose **OOMKilled**, **CrashLoopBackOff**, and **ImagePullBackOff** alerts, and formulate executable remediation fixes.\n\nSelect a live pod above or ask any diagnostic question below!',
      timestamp: 'Just now',
    },
  ]);

  useEffect(() => {
    loadSessions();
  }, []);

  // Auto-select failing pod if found in cluster
  useEffect(() => {
    if (livePods.length > 0) {
      const failingPod = livePods.find((p) => p.status === 'Error' || p.status === 'OOMKilled' || p.status === 'CrashLoopBackOff' || p.name.includes('crash'));
      if (failingPod) {
        setTargetPod(failingPod.name);
        setTargetNamespace(failingPod.namespace);
      } else if (livePods[0]) {
        setTargetPod(livePods[0].name);
        setTargetNamespace(livePods[0].namespace);
      }
    }
  }, [livePods]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const loadSessions = async () => {
    const list = await copilotApi.getSessions();
    setSessions(list);
  };

  const handleCreateNewSession = async () => {
    const newTitle = `Incident Analysis #${sessions.length + 1}`;
    const created = await copilotApi.createSession(newTitle);
    setSessions((prev) => [created, ...prev]);
    setActiveSessionId(created.id);
    setShowSessionsDropdown(false);
    setMessages([
      {
        id: `msg-${Date.now()}`,
        sender: 'assistant',
        content: `New Chat Session **${newTitle}** initialized.\n\nReady to analyze target pod \`${targetPod}\` in namespace \`${targetNamespace}\`. What incident or log stream would you like me to inspect?`,
        timestamp: 'Just now',
      },
    ]);
    success('New Chat Session Created', newTitle);
  };

  const handleSendMessage = async (customPrompt?: string) => {
    const text = customPrompt || inputMessage;
    if (!text.trim() || isLoading) return;

    let podToDiagnose = targetPod;
    let nsToDiagnose = targetNamespace;

    const podMatch = text.match(/(?:pod|crash on|container)\s+([a-zA-Z0-9\-_]+)/i);
    if (podMatch && podMatch[1] && !['the', 'a', 'this', 'in', 'default'].includes(podMatch[1].toLowerCase())) {
      podToDiagnose = podMatch[1];
      setTargetPod(podToDiagnose);
    }

    if (text.toLowerCase().includes('default')) {
      nsToDiagnose = 'default';
      setTargetNamespace('default');
    } else if (text.toLowerCase().includes('payment')) {
      nsToDiagnose = 'payment';
      setTargetNamespace('payment');
    }

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!customPrompt) setInputMessage('');
    setIsLoading(true);

    try {
      const res = await copilotApi.chat(text, nsToDiagnose, podToDiagnose);
      const assistantMsg: ChatMessage = {
        id: `ast-${Date.now()}`,
        sender: 'assistant',
        content: res.reply,
        responseMeta: res,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const activeSessionTitle = sessions.find((s) => s.id === activeSessionId)?.sessionTitle || 'Incident Analysis';

  return (
    <div className="max-w-5xl mx-auto w-full space-y-6 pb-12">
      {/* Page Header with Centered Title & Session Controls */}
      <PageHeader
        title="KubeMind AI Copilot Command Center"
        description="Autonomous LangGraph StateGraph agent orchestrating Model Context Protocol (MCP) tools for Kubernetes incident Root Cause Analysis"
        actions={
          <div className="flex items-center gap-2">
            {/* Session Switcher Dropdown */}
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
                    <span className="text-[10px] font-mono uppercase font-bold text-slate-400">Past Sessions</span>
                    <button
                      onClick={handleCreateNewSession}
                      className="text-[10px] font-mono text-blue-600 dark:text-cyan-400 hover:underline flex items-center gap-1"
                    >
                      <Plus className="h-3 w-3" /> New
                    </button>
                  </div>
                  {sessions.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => {
                        setActiveSessionId(s.id);
                        setShowSessionsDropdown(false);
                      }}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-mono truncate transition-colors ${
                        activeSessionId === s.id
                          ? 'bg-blue-50 dark:bg-slate-800 text-blue-600 dark:text-cyan-400 font-bold'
                          : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                      }`}
                    >
                      {s.sessionTitle}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={handleCreateNewSession}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium font-sans shadow-sm transition-all"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>New Chat</span>
            </button>
          </div>
        }
      />

      {/* Centered Diagnostic Target Scope Bar */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20 shrink-0">
              <Bot className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider font-mono">Diagnostic Target Scope</span>
                <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Cluster Connected
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Target Pod: <span className="font-mono font-bold text-blue-600 dark:text-cyan-400">{targetPod}</span>
                <span className="mx-2 text-slate-300 dark:text-slate-700">•</span>
                Namespace: <span className="font-mono font-bold text-purple-600 dark:text-purple-400">{targetNamespace}</span>
              </p>
            </div>
          </div>

          {/* Pod & Namespace Selector Dropdowns */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={targetPod}
              onChange={(e) => {
                const selected = livePods.find((p) => p.name === e.target.value);
                setTargetPod(e.target.value);
                if (selected) setTargetNamespace(selected.namespace);
              }}
              className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 py-2 px-3 text-xs text-slate-900 dark:text-slate-100 font-mono font-medium focus:border-blue-500 focus:outline-none flex-1 sm:w-60 shadow-sm"
            >
              {livePods.map((p) => (
                <option key={p.name} value={p.name}>
                  {p.name.includes('crash') || p.status === 'Error' ? '💥 ' : '📦 '}
                  {p.name} ({p.namespace})
                </option>
              ))}
              {!livePods.some((p) => p.name === targetPod) && (
                <option value={targetPod}>🎯 {targetPod} ({targetNamespace})</option>
              )}
            </select>

            <button
              onClick={() => handleSendMessage(`Diagnose crash on ${targetPod} in ${targetNamespace} namespace`)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-mono font-bold shadow-md shadow-rose-600/20 transition-all shrink-0"
              title="Run Automated Diagnostic Analysis"
            >
              <ShieldAlert className="h-4 w-4" />
              <span>Diagnose</span>
            </button>
          </div>
        </div>

        {/* Quick Click Live Workloads Pills */}
        {livePods.length > 0 && (
          <div className="mt-3.5 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-mono uppercase font-bold text-slate-400 shrink-0">Live Pods:</span>
            {livePods.slice(0, 6).map((p) => {
              const isCrash = p.name.includes('crash') || p.status === 'Error' || p.status === 'OOMKilled';
              const isSelected = targetPod === p.name;
              return (
                <button
                  key={p.name}
                  onClick={() => {
                    setTargetPod(p.name);
                    setTargetNamespace(p.namespace);
                  }}
                  className={`text-[10px] font-mono px-2.5 py-1 rounded-lg border transition-all flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-blue-600 text-white border-blue-600 shadow-sm font-bold'
                      : isCrash
                      ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-900/60 hover:bg-rose-100 font-bold'
                      : 'bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {isCrash && <AlertCircle className="h-3 w-3 text-rose-500 shrink-0" />}
                  <span className="truncate max-w-[130px]">{p.name}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Main Conversation Stream (Centered & Clean) */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden flex flex-col">
        {/* Chat History Messages */}
        <div className="p-6 md:p-8 space-y-6 min-h-[460px] max-h-[620px] overflow-y-auto">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex items-start gap-4 ${
                msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'
              }`}
            >
              {/* Avatar */}
              <div
                className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 shadow-md ${
                  msg.sender === 'user'
                    ? 'bg-gradient-to-tr from-blue-600 to-indigo-600 text-white'
                    : 'bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 text-white'
                }`}
              >
                {msg.sender === 'user' ? <User className="h-4.5 w-4.5" /> : <Bot className="h-4.5 w-4.5" />}
              </div>

              {/* Message Bubble / Card */}
              <div className={`space-y-1.5 max-w-3xl ${msg.sender === 'user' ? 'text-right' : 'text-left flex-1'}`}>
                {msg.sender === 'user' ? (
                  <div className="inline-block p-4 rounded-2xl rounded-tr-sm bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium text-xs leading-relaxed shadow-md shadow-blue-500/20 text-left">
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  </div>
                ) : (
                  <div className="p-5 rounded-2xl rounded-tl-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-sm text-xs leading-relaxed">
                    <MarkdownMessage content={msg.content} />

                    {/* Executed MCP Tools Badge & Execution Trace Chips */}
                    {msg.responseMeta && (
                      <div className="mt-5 pt-3.5 border-t border-slate-200 dark:border-slate-800/80 flex items-center justify-between text-[11px] font-mono flex-wrap gap-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-slate-500 dark:text-slate-400 font-semibold">MCP Tools Executed:</span>
                          {msg.responseMeta.toolsExecuted.map((t, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 rounded bg-blue-50 dark:bg-cyan-950/40 text-blue-700 dark:text-cyan-300 border border-blue-200 dark:border-cyan-800/60 font-bold"
                            >
                              {t}
                            </span>
                          ))}
                        </div>

                        <span className="text-emerald-700 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-800/60 flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                          {msg.responseMeta.diagnosis.confidenceScore}% Diagnostic Match
                        </span>
                      </div>
                    )}
                  </div>
                )}
                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono block px-1">{msg.timestamp}</span>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex items-center gap-3 p-4 rounded-2xl border border-cyan-500/30 bg-cyan-500/10 text-xs text-cyan-800 dark:text-cyan-200 font-mono shadow-sm">
              <RefreshCw className="h-4 w-4 animate-spin text-cyan-600 dark:text-cyan-400" />
              <span>LangGraph Agent executing StateGraph (MCP Ingestion → Stderr Analysis → RCA Synthesis)...</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Bottom Prompts & Input Area */}
        <div className="p-4 md:p-6 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 space-y-3">
          {/* 4 Quick Suggestion Chips */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-xs font-mono">
            <button
              onClick={() => handleSendMessage(`Diagnose crash on ${targetPod} in ${targetNamespace} namespace`)}
              className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-rose-500/40 hover:bg-rose-500/5 text-slate-700 dark:text-slate-300 text-left transition-all flex items-center gap-2 shadow-sm truncate"
            >
              <AlertTriangle className="h-3.5 w-3.5 text-rose-500 shrink-0" />
              <span className="truncate">Diagnose {targetPod}</span>
            </button>

            <button
              onClick={() => handleSendMessage("Which pod is consuming the most memory?")}
              className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-amber-500/40 hover:bg-amber-500/5 text-slate-700 dark:text-slate-300 text-left transition-all flex items-center gap-2 shadow-sm truncate"
            >
              <Zap className="h-3.5 w-3.5 text-amber-500 shrink-0" />
              <span className="truncate">Top Memory Pods</span>
            </button>

            <button
              onClick={() => handleSendMessage("Show recent cluster warning events.")}
              className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-indigo-500/40 hover:bg-indigo-500/5 text-slate-700 dark:text-slate-300 text-left transition-all flex items-center gap-2 shadow-sm truncate"
            >
              <Layers className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
              <span className="truncate">Cluster Warning Events</span>
            </button>

            <button
              onClick={() => handleSendMessage("Suggest remediation fix for OOMKilled.")}
              className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-cyan-500/40 hover:bg-cyan-500/5 text-slate-700 dark:text-slate-300 text-left transition-all flex items-center gap-2 shadow-sm truncate"
            >
              <Sparkles className="h-3.5 w-3.5 text-cyan-500 shrink-0" />
              <span className="truncate">Fix OOMKilled</span>
            </button>
          </div>

          {/* Centered Floating Prompt Input Bar */}
          <div className="relative flex items-center">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder={`Ask AI Copilot to analyze logs, diagnose ${targetPod}, or generate kubectl fixes...`}
              className="w-full rounded-2xl border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 py-3.5 pl-4 pr-12 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:border-blue-500 focus:outline-none shadow-sm font-sans"
            />
            <button
              onClick={() => handleSendMessage()}
              disabled={isLoading || !inputMessage.trim()}
              className="absolute right-2.5 h-8 w-8 rounded-xl bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center transition-all disabled:opacity-50 shadow-md shadow-blue-500/20"
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
