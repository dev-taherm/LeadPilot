'use client';

import { Suspense, useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Search,
  Pause,
  Play,
  ArrowRightLeft,
  Send,
  MessageSquare,
  Bot,
  User,
  Clock,
  ArrowLeft,
} from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { get, post, patch } from '@/lib/api';
import type { Conversation, Message, PaginatedResponse } from '@/types';

function timeAgo(dateStr: string): string {
  const seconds = Math.floor(
    (Date.now() - new Date(dateStr).getTime()) / 1000
  );
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function ConversationsPage() {
  return (
    <Suspense
      fallback={
        <AppLayout>
          <div className="flex items-center justify-center py-32">
            <Spinner size="lg" />
          </div>
        </AppLayout>
      }
    >
      <ConversationsContent />
    </Suspense>
  );
}

function ConversationsContent() {
  const searchParams = useSearchParams();
  const preselectedId = searchParams.get('id');

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [conversationsLoading, setConversationsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedId, setSelectedId] = useState<number | null>(
    preselectedId ? Number(preselectedId) : null
  );

  const [messages, setMessages] = useState<Message[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);

  const [togglingPause, setTogglingPause] = useState(false);
  const [handoffing, setHandoffing] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchConversations = useCallback(async () => {
    setConversationsLoading(true);
    try {
      const params: Record<string, unknown> = {};
      if (searchQuery) params.search = searchQuery;
      const res = await get<PaginatedResponse<Conversation>>(
        '/conversations/',
        params
      );
      setConversations(res.data.results);
    } catch {
      setConversations([]);
    } finally {
      setConversationsLoading(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  const selectedConversation = conversations.find(
    (c) => c.id === selectedId
  );

  const fetchMessages = useCallback(async (convId: number) => {
    setMessagesLoading(true);
    try {
      const res = await get<{ results: Message[] }>(
        `/conversations/${convId}/messages/`
      );
      setMessages(res.data.results || []);
    } catch {
      setMessages([]);
    } finally {
      setMessagesLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedId) {
      fetchMessages(selectedId);
    }
  }, [selectedId, fetchMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedId) return;
    setSending(true);
    try {
      await post(`/conversations/${selectedId}/messages/`, {
        content: newMessage.trim(),
      });
      setNewMessage('');
      fetchMessages(selectedId);
    } catch {
      // failed to send
    } finally {
      setSending(false);
    }
  };

  const handleTogglePause = async () => {
    if (!selectedConversation) return;
    setTogglingPause(true);
    try {
      const newPaused = !selectedConversation.ai_paused;
      await patch(`/conversations/${selectedConversation.id}/`, {
        ai_paused: newPaused,
      });
      setConversations((prev) =>
        prev.map((c) =>
          c.id === selectedConversation.id
            ? { ...c, ai_paused: newPaused }
            : c
        )
      );
    } catch {
      // failed
    } finally {
      setTogglingPause(false);
    }
  };

  const handleHandoff = async () => {
    if (!selectedConversation) return;
    setHandoffing(true);
    try {
      await patch(`/conversations/${selectedConversation.id}/`, {
        status: 'ai_handoff',
      });
      setConversations((prev) =>
        prev.map((c) =>
          c.id === selectedConversation.id
            ? { ...c, status: 'ai_handoff' as const }
            : c
        )
      );
    } catch {
      // failed
    } finally {
      setHandoffing(false);
    }
  };

  return (
    <AppLayout>
      <div className="flex h-[calc(100vh-8rem)] overflow-hidden rounded-xl border border-gray-200 bg-white">
        {/* Conversation List */}
        <div
          className={`flex w-full flex-col border-r border-gray-200 sm:w-80 lg:w-96 ${
            selectedId ? 'hidden sm:flex' : 'flex'
          }`}
        >
          <div className="border-b border-gray-200 p-4">
            <h2 className="mb-3 text-lg font-semibold text-gray-900">
              Conversations
            </h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search conversations..."
                className="w-full rounded-lg border border-gray-300 bg-gray-50 py-2 pl-10 pr-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {conversationsLoading ? (
              <div className="flex items-center justify-center py-12">
                <Spinner size="md" />
              </div>
            ) : conversations.length === 0 ? (
              <EmptyState
                icon={MessageSquare}
                title="No conversations"
                description="Conversations will appear here when leads interact with the AI."
              />
            ) : (
              <ul className="divide-y divide-gray-100">
                {conversations.map((conv) => (
                  <li key={conv.id}>
                    <button
                      onClick={() => setSelectedId(conv.id)}
                      className={`w-full px-4 py-3 text-left transition-colors hover:bg-gray-50 ${
                        selectedId === conv.id ? 'bg-blue-50' : ''
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <Avatar name={conv.lead.name} size="sm" />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-900">
                              {conv.lead.name}
                            </span>
                            <span className="text-xs text-gray-400">
                              {timeAgo(conv.last_message_at)}
                            </span>
                          </div>
                          <div className="mt-0.5 flex items-center gap-2">
                            {conv.ai_paused && (
                              <Badge variant="warning" className="text-[10px]">
                                AI Paused
                              </Badge>
                            )}
                            {conv.status === 'ai_handoff' && (
                              <Badge variant="danger" className="text-[10px]">
                                Handoff
                              </Badge>
                            )}
                            {conv.status === 'active' && !conv.ai_paused && (
                              <span className="flex h-2 w-2 rounded-full bg-green-500" />
                            )}
                          </div>
                          <p className="mt-1 truncate text-xs text-gray-500">
                            {conv.channel}
                          </p>
                        </div>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Conversation Detail */}
        <div
          className={`flex flex-1 flex-col ${
            selectedId ? 'flex' : 'hidden sm:flex'
          }`}
        >
          {!selectedId ? (
            <div className="flex flex-1 items-center justify-center">
              <EmptyState
                icon={MessageSquare}
                title="Select a conversation"
                description="Choose a conversation from the list to view messages."
              />
            </div>
          ) : !selectedConversation ? (
            <div className="flex flex-1 items-center justify-center">
              <Spinner size="lg" />
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
                <div className="flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="sm:hidden"
                    onClick={() => setSelectedId(null)}
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <Avatar name={selectedConversation.lead.name} size="sm" />
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900">
                      {selectedConversation.lead.name}
                    </h3>
                    <p className="text-xs text-gray-500">
                      {selectedConversation.channel} &middot;{' '}
                      <span
                        className={
                          selectedConversation.status === 'active'
                            ? 'text-green-600'
                            : 'text-yellow-600'
                        }
                      >
                        {selectedConversation.status}
                      </span>
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    isLoading={togglingPause}
                    onClick={handleTogglePause}
                  >
                    {selectedConversation.ai_paused ? (
                      <>
                        <Play className="h-4 w-4" /> Resume AI
                      </>
                    ) : (
                      <>
                        <Pause className="h-4 w-4" /> Pause AI
                      </>
                    )}
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    isLoading={handoffing}
                    onClick={handleHandoff}
                  >
                    <ArrowRightLeft className="h-4 w-4" /> Handoff
                  </Button>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-4 py-4">
                {messagesLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Spinner size="md" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <MessageSquare className="mb-3 h-8 w-8 text-gray-300" />
                    <p className="text-sm text-gray-500">No messages yet.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {messages.map((msg) => (
                      <MessageBubble key={msg.id} message={msg} />
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </div>

              {/* Input */}
              <div className="border-t border-gray-200 px-4 py-3">
                <form onSubmit={handleSendMessage} className="flex gap-3">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message as staff..."
                    className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    disabled={sending}
                  />
                  <Button type="submit" size="md" isLoading={sending}>
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </div>
            </>
          )}
        </div>
      </div>
    </AppLayout>
  );
}

function MessageBubble({ message }: { message: Message }) {
  const isLead = message.sender_type === 'lead';
  const isAI = message.sender_type === 'ai';
  const isStaff = message.sender_type === 'staff';
  const isSystem = message.sender_type === 'system';

  if (isSystem) {
    return (
      <div className="flex justify-center">
        <span className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-500">
          {message.content}
        </span>
      </div>
    );
  }

  return (
    <div
      className={`flex ${isLead ? 'justify-start' : 'justify-end'}`}
    >
      <div
        className={`flex max-w-xs items-end gap-2 lg:max-w-md ${
          isLead ? 'flex-row' : 'flex-row-reverse'
        }`}
      >
        <div
          className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-medium ${
            isAI
              ? 'bg-purple-100 text-purple-700'
              : isStaff
                ? 'bg-blue-100 text-blue-700'
                : 'bg-gray-100 text-gray-700'
          }`}
        >
          {isAI ? (
            <Bot className="h-3.5 w-3.5" />
          ) : isStaff ? (
            <User className="h-3.5 w-3.5" />
          ) : (
            <User className="h-3.5 w-3.5" />
          )}
        </div>
        <div>
          <div
            className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
              isLead
                ? 'bg-gray-100 text-gray-900 rounded-bl-sm'
                : isAI
                  ? 'bg-purple-600 text-white rounded-br-sm'
                  : 'bg-blue-600 text-white rounded-br-sm'
            }`}
          >
            {message.content}
          </div>
          <div
            className={`mt-1 flex items-center gap-1.5 text-[10px] text-gray-400 ${
              isLead ? '' : 'justify-end'
            }`}
          >
            {isAI && <Bot className="h-3 w-3" />}
            <span className="capitalize">{message.sender_type}</span>
            <Clock className="h-3 w-3" />
            {new Date(message.created_at).toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
