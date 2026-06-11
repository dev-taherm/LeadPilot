import { create } from 'zustand';
import type { Conversation, Message, PaginatedResponse } from '@/types';
import { get, post } from '@/lib/api';

interface ConversationState {
  conversations: Conversation[];
  selectedConversation: Conversation | null;
  messages: Message[];
  isLoading: boolean;
}

interface ConversationActions {
  fetchConversations: (params?: Record<string, unknown>) => Promise<void>;
  fetchMessages: (conversationId: number) => Promise<void>;
  sendMessage: (conversationId: number, content: string) => Promise<Message>;
  pauseAI: (conversationId: number) => Promise<void>;
  resumeAI: (conversationId: number) => Promise<void>;
  setSelectedConversation: (conversation: Conversation | null) => void;
}

export const useConversationStore = create<ConversationState & ConversationActions>((set, get) => ({
  conversations: [],
  selectedConversation: null,
  messages: [],
  isLoading: false,

  fetchConversations: async (params?) => {
    set({ isLoading: true });
    try {
      const { data } = await get<PaginatedResponse<Conversation>>('/conversations/', params);
      set({ conversations: data.results, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  fetchMessages: async (conversationId) => {
    set({ isLoading: true });
    try {
      const { data } = await get<PaginatedResponse<Message>>(
        `/conversations/${conversationId}/messages/`
      );
      set({ messages: data.results, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  sendMessage: async (conversationId, content) => {
    const { data } = await post<{ data: Message }>(
      `/conversations/${conversationId}/messages/`,
      { content }
    );
    const message = data.data;
    set((state) => ({ messages: [...state.messages, message] }));
    return message;
  },

  pauseAI: async (conversationId) => {
    await post(`/conversations/${conversationId}/pause_ai/`);
    set((state) => ({
      conversations: state.conversations.map((c) =>
        c.id === conversationId ? { ...c, ai_paused: true, status: 'paused' as const } : c
      ),
      selectedConversation:
        state.selectedConversation?.id === conversationId
          ? { ...state.selectedConversation, ai_paused: true, status: 'paused' as const }
          : state.selectedConversation,
    }));
  },

  resumeAI: async (conversationId) => {
    await post(`/conversations/${conversationId}/resume_ai/`);
    set((state) => ({
      conversations: state.conversations.map((c) =>
        c.id === conversationId ? { ...c, ai_paused: false, status: 'active' as const } : c
      ),
      selectedConversation:
        state.selectedConversation?.id === conversationId
          ? { ...state.selectedConversation, ai_paused: false, status: 'active' as const }
          : state.selectedConversation,
    }));
  },

  setSelectedConversation: (conversation) => set({ selectedConversation: conversation }),
}));
