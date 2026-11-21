import { apiClient } from './apiClient';

export interface ChatSession {
  id: string;
  sessionTitle: string;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  sessionId: string;
  sender: 'user' | 'assistant';
  content: string;
  toolsExecuted?: string;
  confidenceScore?: number;
  remediationCommand?: string;
  createdAt: string;
}

export interface Diagnosis {
  reason: string;
  confidenceScore: number;
  summary: string;
  remediationCommand: string;
}

export interface CopilotResponse {
  status: string;
  reply: string;
  toolsExecuted: string[];
  diagnosis: Diagnosis | null;
}

interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

function requireData<T>(response: { data: ApiEnvelope<T> }): T {
  if (!response.data?.success || response.data.data == null) {
    throw new Error(response.data?.message || 'The server returned an unsuccessful response.');
  }
  return response.data.data;
}

export const copilotApi = {
  getSessions: async (): Promise<ChatSession[]> => {
    const response = await apiClient.get<ApiEnvelope<ChatSession[]>>(
      '/copilot/sessions'
    );
    return requireData(response);
  },

  createSession: async (sessionTitle: string): Promise<ChatSession> => {
    const response = await apiClient.post<ApiEnvelope<ChatSession>>(
      '/copilot/sessions',
      { sessionTitle }
    );
    return requireData(response);
  },

  getSessionMessages: async (sessionId: string): Promise<ChatMessage[]> => {
    const response = await apiClient.get<ApiEnvelope<ChatMessage[]>>(
      `/copilot/sessions/${encodeURIComponent(sessionId)}/messages`
    );
    return requireData(response);
  },

  chat: async (
    sessionId: string,
    message: string,
    namespace?: string,
    podName?: string
  ): Promise<CopilotResponse> => {
    const response = await apiClient.post<ApiEnvelope<CopilotResponse>>(
      `/copilot/sessions/${encodeURIComponent(sessionId)}/chat`,
      {
        message,
        namespace: namespace || null,
        podName: podName || null,
      }
    );
    return requireData(response);
  },
};
