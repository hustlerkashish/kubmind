import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { Card } from '@/components/ui/Card';
import { copilotApi, CopilotResponse, ChatSession } from '@/services/copilotService';
import { MarkdownMessage } from '@/components/copilot/MarkdownMessage';

import {
  Bot,
  Send,
  Sparkles,
  Cpu,
  Plus,
  MessageSquare,
  Zap,
  RefreshCw,
  AlertTriangle,
  Layers,
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
  const [targetPod, setTargetPod] = useState('payment-processor-78d9b-x92q');
  const [targetNamespace, setTargetNamespace] = useState('payment');
  const [isLoading, setIsLoading] = useState(false);

  const { success } = useToast();

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-0',
      sender: 'assistant',
      content:
        'Hello Operator! I am your **KubeMind LangGraph AI Copilot**. Ask me to analyze container crash logs, diagnose OOMKilled/CrashLoopBackOff alerts, or run automated Root Cause Analysis on target cluster workloads.',
      timestamp: 'Just now',
    },
  ]);

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    const list = await copilotApi.getSessions();
    setSessions(list);
  };

  const handleCreateNewSession = async () => {
    const newTitle = `Incident Analysis #${sessions.length + 1}`;
    const created = await copilotApi.createSession(newTitle);
    setSessions((prev) => [created, ...prev]);
    setActiveSessionId(created.id);
    setMessages([
      {
        id: `msg-${Date.now()}`,
        sender: 'assistant',
        content: `New Chat Session **${newTitle}** initialized. How can I assist you with target pod \`${targetPod}\`?`,
        timestamp: 'Just now',
      },
    ]);
    success('New Chat Session Created', newTitle);
  };

  const handleSendMessage = async (customPrompt?: string) => {
    const text = customPrompt || inputMessage;
    if (!text.trim() || isLoading) return;

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
      const res = await copilotApi.chat(text, targetNamespace, targetPod);
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

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title="ChatGPT-Style AI Copilot Interface"
        description="LangGraph state graph agent orchestrating MCP tools to diagnose CrashLoopBackOff, OOMKilled, ImagePullBackOff & generate fixes"
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Session History Sidebar */}
        <div className="space-y-3">
          <button
            onClick={handleCreateNewSession}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-blue-500/30 bg-blue-600/10 text-blue-400 hover:bg-blue-600/20 text-xs font-semibold font-mono transition-all shadow-sm"
          >
            <Plus className="h-4 w-4" />
            <span>+ New Chat Session</span>
          </button>

          <div className="rounded-xl border border-slate-800 bg-slate-950 p-3 space-y-1 max-h-[500px] overflow-y-auto">
            <p className="text-[10px] uppercase font-mono font-bold text-slate-500 px-2 py-1">
              Recent Conversations ({sessions.length})
            </p>

            {sessions.map((s) => (
              <button
                key={s.id}
                onClick={() => setActiveSessionId(s.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors text-left ${
                  activeSessionId === s.id
                    ? 'bg-slate-800 text-cyan-300 border border-slate-700 font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <MessageSquare className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                <span className="truncate">{s.sessionTitle}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Right Main Chat Interface Container */}
        <div className="lg:col-span-3 space-y-4">
          {/* Target Pod Context Controls Bar */}
          <Card className="p-3 bg-slate-950 border-slate-800">
            <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                  <Bot className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-100">Live Diagnostic Scope</p>
                  <p className="text-[10px] text-slate-400 font-mono">
                    Pod: <code className="text-cyan-400">{targetPod}</code> • Namespace:{' '}
                    <code className="text-purple-400">{targetNamespace}</code>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={targetPod}
                  onChange={(e) => setTargetPod(e.target.value)}
                  placeholder="Target Pod..."
                  className="rounded-lg border border-slate-800 bg-slate-900 py-1 px-2.5 text-xs text-slate-200 focus:border-blue-500 focus:outline-none font-mono w-44"
                />
                <input
                  type="text"
                  value={targetNamespace}
                  onChange={(e) => setTargetNamespace(e.target.value)}
                  placeholder="Namespace..."
                  className="rounded-lg border border-slate-800 bg-slate-900 py-1 px-2.5 text-xs text-slate-200 focus:border-blue-500 focus:outline-none font-mono w-24"
                />
              </div>
            </div>
          </Card>

          {/* Conversation Window */}
          <div className="rounded-xl border border-slate-800 bg-slate-950 p-6 shadow-2xl min-h-[420px] max-h-[520px] overflow-y-auto space-y-6">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex items-start gap-4 ${
                  msg.sender === 'user' ? 'flex-row-reverse' : ''
                }`}
              >
                {/* Sender Avatar */}
                <div
                  className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 shadow-lg ${
                    msg.sender === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gradient-to-tr from-cyan-600 to-blue-600 text-white'
                  }`}
                >
                  {msg.sender === 'user' ? <Cpu className="h-5 w-5" /> : <Bot className="h-5 w-5" />}
                </div>

                {/* Message Box */}
                <div className={`space-y-2 max-w-2xl ${msg.sender === 'user' ? 'text-right' : ''}`}>
                  <div
                    className={`p-4 rounded-xl border text-xs leading-relaxed ${
                      msg.sender === 'user'
                        ? 'bg-blue-600/20 border-blue-500/30 text-slate-100 font-medium'
                        : 'bg-slate-900/80 border-slate-800 text-slate-200'
                    }`}
                  >
                    <MarkdownMessage content={msg.content} />

                    {/* Executed MCP Tools Badge & Execution Trace Chips */}
                    {msg.responseMeta && (
                      <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-[10px] font-mono">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-slate-400">MCP Tools:</span>
                          {msg.responseMeta.toolsExecuted.map((t, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 rounded bg-cyan-950/60 text-cyan-300 border border-cyan-500/30 font-bold"
                            >
                              {t}
                            </span>
                          ))}
                        </div>

                        <span className="text-emerald-400 font-bold bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/20">
                          {msg.responseMeta.diagnosis.confidenceScore}% Match
                        </span>
                      </div>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono block">{msg.timestamp}</span>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex items-center gap-3 p-4 rounded-xl border border-cyan-500/20 bg-cyan-950/20 text-xs text-cyan-300 animate-pulse font-mono">
                <RefreshCw className="h-4 w-4 animate-spin text-cyan-400" />
                <span>Executing LangGraph StateGraph (MCP Tool Ingestion → Stderr Analysis → RCA Synthesis)...</span>
              </div>
            )}
          </div>

          {/* 4 Suggested Prompts Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
            <button
              onClick={() => handleSendMessage("Why did my deployment fail?")}
              className="p-2.5 rounded-xl border border-slate-800 bg-slate-900/80 hover:border-rose-500/40 hover:bg-slate-800 text-slate-300 text-left transition-all flex items-center gap-2"
            >
              <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0" />
              <span>Why did my deployment fail?</span>
            </button>

            <button
              onClick={() => handleSendMessage("Which pod is consuming the most memory?")}
              className="p-2.5 rounded-xl border border-slate-800 bg-slate-900/80 hover:border-amber-500/40 hover:bg-slate-800 text-slate-300 text-left transition-all flex items-center gap-2"
            >
              <Zap className="h-4 w-4 text-amber-400 shrink-0" />
              <span>Which pod is consuming the most memory?</span>
            </button>

            <button
              onClick={() => handleSendMessage("Show recent incidents.")}
              className="p-2.5 rounded-xl border border-slate-800 bg-slate-900/80 hover:border-indigo-500/40 hover:bg-slate-800 text-slate-300 text-left transition-all flex items-center gap-2"
            >
              <Layers className="h-4 w-4 text-indigo-400 shrink-0" />
              <span>Show recent incidents.</span>
            </button>

            <button
              onClick={() => handleSendMessage("Suggest a fix for CrashLoopBackOff.")}
              className="p-2.5 rounded-xl border border-slate-800 bg-slate-900/80 hover:border-cyan-500/40 hover:bg-slate-800 text-slate-300 text-left transition-all flex items-center gap-2"
            >
              <Sparkles className="h-4 w-4 text-cyan-400 shrink-0" />
              <span>Suggest a fix for CrashLoopBackOff.</span>
            </button>
          </div>

          {/* Input Prompt Controls */}
          <div className="relative">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Ask KubeMind AI Copilot to analyze crash logs, diagnose failure modes, or generate fixes..."
              className="w-full rounded-xl border border-slate-800 bg-slate-950 py-3.5 pl-4 pr-12 text-xs text-slate-100 placeholder-slate-500 focus:border-blue-500 focus:outline-none shadow-xl font-sans"
            />
            <button
              onClick={() => handleSendMessage()}
              disabled={isLoading || !inputMessage.trim()}
              className="absolute right-2.5 top-2.5 h-8 w-8 rounded-lg bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center transition-colors disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
