'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Mail,
  Phone,
  Building2,
  Tag,
  Calendar,
  User,
  MessageSquare,
  Activity,
  FileText,
  Bot,
  Clock,
  Send,
} from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Spinner } from '@/components/ui/Spinner';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { get, post, patch } from '@/lib/api';
import type {
  Lead,
  LeadStatus,
  Message,
  Conversation,
  User as UserType,
  ApiResponse,
} from '@/types';

const STATUS_OPTIONS = [
  { value: 'new', label: 'New' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'qualified', label: 'Qualified' },
  { value: 'unqualified', label: 'Unqualified' },
  { value: 'meeting_booked', label: 'Meeting Booked' },
  { value: 'won', label: 'Won' },
  { value: 'lost', label: 'Lost' },
];

type Tab = 'overview' | 'notes' | 'conversations' | 'activity';

const tabs: { key: Tab; label: string; icon: typeof FileText }[] = [
  { key: 'overview', label: 'Overview', icon: FileText },
  { key: 'notes', label: 'Notes', icon: MessageSquare },
  { key: 'conversations', label: 'Conversations', icon: MessageSquare },
  { key: 'activity', label: 'Activity', icon: Activity },
];

interface NoteItem {
  id: number;
  content: string;
  author: string;
  created_at: string;
}

interface ActivityItem {
  id: number;
  action: string;
  details: string;
  timestamp: string;
  user?: string;
}

export default function LeadDetailPage() {
  const params = useParams();
  const router = useRouter();
  const leadId = params.id as string;

  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('overview');

  const [statusUpdating, setStatusUpdating] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [assignUserId, setAssignUserId] = useState('');
  const [runningAgent, setRunningAgent] = useState(false);

  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [notesLoading, setNotesLoading] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [noteSubmitting, setNoteSubmitting] = useState(false);

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [conversationsLoading, setConversationsLoading] = useState(false);

  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [activityLoading, setActivityLoading] = useState(false);

  const fetchLead = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await get<ApiResponse<Lead>>(`/leads/${leadId}/`);
      setLead(res.data.data!);
    } catch {
      setError('Failed to load lead details.');
    } finally {
      setLoading(false);
    }
  }, [leadId]);

  useEffect(() => {
    fetchLead();
  }, [fetchLead]);

  const fetchNotes = useCallback(async () => {
    setNotesLoading(true);
    try {
      const res = await get<{ results: NoteItem[] }>(
        `/leads/${leadId}/notes/`
      );
      setNotes(res.data.results || []);
    } catch {
      // notes may not have a dedicated endpoint; fallback to lead data
      if (lead?.notes) {
        setNotes([
          {
            id: 1,
            content: lead.notes,
            author: 'System',
            created_at: lead.created_at,
          },
        ]);
      }
    } finally {
      setNotesLoading(false);
    }
  }, [leadId, lead]);

  const fetchConversations = useCallback(async () => {
    setConversationsLoading(true);
    try {
      const res = await get<{ results: Conversation[] }>('/conversations/', {
        lead_id: leadId,
      });
      setConversations(res.data.results || []);
    } catch {
      setConversations([]);
    } finally {
      setConversationsLoading(false);
    }
  }, [leadId]);

  const fetchActivity = useCallback(async () => {
    setActivityLoading(true);
    try {
      const res = await get<{ results: ActivityItem[] }>(
        `/leads/${leadId}/activity/`
      );
      setActivity(res.data.results || []);
    } catch {
      setActivity([]);
    } finally {
      setActivityLoading(false);
    }
  }, [leadId]);

  useEffect(() => {
    if (activeTab === 'notes') fetchNotes();
    if (activeTab === 'conversations') fetchConversations();
    if (activeTab === 'activity') fetchActivity();
  }, [activeTab, fetchNotes, fetchConversations, fetchActivity]);

  const handleStatusChange = async (newStatus: string) => {
    if (!lead) return;
    setStatusUpdating(true);
    try {
      await patch(`/leads/${lead.id}/`, { status: newStatus });
      setLead({ ...lead, status: newStatus as LeadStatus });
    } catch {
      setError('Failed to update status.');
    } finally {
      setStatusUpdating(false);
    }
  };

  const handleAssign = async () => {
    if (!lead || !assignUserId) return;
    setAssigning(true);
    try {
      const res = await patch<ApiResponse<Lead>>(`/leads/${lead.id}/`, {
        assigned_to: Number(assignUserId),
      });
      setLead(res.data.data!);
      setAssignUserId('');
    } catch {
      setError('Failed to assign lead.');
    } finally {
      setAssigning(false);
    }
  };

  const handleRunAgent = async () => {
    if (!lead) return;
    setRunningAgent(true);
    try {
      await post(`/leads/${lead.id}/run-agent/`);
      fetchLead();
    } catch {
      setError('Failed to run AI agent.');
    } finally {
      setRunningAgent(false);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    setNoteSubmitting(true);
    try {
      await post(`/leads/${leadId}/notes/`, { content: newNote.trim() });
      setNewNote('');
      fetchNotes();
    } catch {
      setError('Failed to add note.');
    } finally {
      setNoteSubmitting(false);
    }
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  const formatShortDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-32">
          <Spinner size="lg" />
        </div>
      </AppLayout>
    );
  }

  if (error && !lead) {
    return (
      <AppLayout>
        <div className="space-y-4">
          <Button variant="ghost" onClick={() => router.push('/leads')}>
            <ArrowLeft className="h-4 w-4" /> Back to Leads
          </Button>
          <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
            <p className="text-red-700">{error}</p>
            <Button onClick={fetchLead} className="mt-4">
              Try Again
            </Button>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!lead) return null;

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Back button + error */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => router.push('/leads')}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Leads
          </Button>
          {error && (
            <span className="text-sm text-red-600">{error}</span>
          )}
        </div>

        {/* Lead Header Card */}
        <Card>
          <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <Avatar name={lead.name} size="lg" />
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold text-gray-900">
                    {lead.name}
                  </h1>
                  <StatusBadge status={lead.status} />
                </div>
                <p className="mt-1 text-sm text-gray-500">
                  {lead.company || 'No company'} &middot;{' '}
                  {lead.source.replace('_', ' ')}
                </p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap items-center gap-2">
              <Select
                options={STATUS_OPTIONS}
                value={lead.status}
                onChange={(e) => handleStatusChange(e.target.value)}
                className="w-44"
                placeholder="Status"
              />
              <div className="flex items-center gap-2">
                <Input
                  value={assignUserId}
                  onChange={(e) => setAssignUserId(e.target.value)}
                  placeholder="User ID"
                  className="w-28"
                />
                <Button
                  variant="outline"
                  size="sm"
                  isLoading={assigning}
                  onClick={handleAssign}
                >
                  Assign
                </Button>
              </div>
              <Button
                variant="secondary"
                size="sm"
                isLoading={runningAgent}
                onClick={handleRunAgent}
              >
                <Bot className="h-4 w-4" />
                Run AI Agent
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex gap-1 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-2 whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
                    activeTab === tab.key
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Info */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Lead Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <dl className="grid gap-4 sm:grid-cols-2">
                    <div className="flex items-center gap-3">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <div>
                        <dt className="text-xs text-gray-500">Email</dt>
                        <dd className="text-sm text-gray-900">
                          {lead.email}
                        </dd>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <div>
                        <dt className="text-xs text-gray-500">Phone</dt>
                        <dd className="text-sm text-gray-900">
                          {lead.phone || '—'}
                        </dd>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Building2 className="h-4 w-4 text-gray-400" />
                      <div>
                        <dt className="text-xs text-gray-500">Company</dt>
                        <dd className="text-sm text-gray-900">
                          {lead.company || '—'}
                        </dd>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Tag className="h-4 w-4 text-gray-400" />
                      <div>
                        <dt className="text-xs text-gray-500">Source</dt>
                        <dd className="text-sm capitalize text-gray-900">
                          {lead.source.replace('_', ' ')}
                        </dd>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <div>
                        <dt className="text-xs text-gray-500">Created</dt>
                        <dd className="text-sm text-gray-900">
                          {formatShortDate(lead.created_at)}
                        </dd>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <User className="h-4 w-4 text-gray-400" />
                      <div>
                        <dt className="text-xs text-gray-500">Assigned To</dt>
                        <dd className="text-sm text-gray-900">
                          {lead.assigned_to
                            ? `${lead.assigned_to.first_name} ${lead.assigned_to.last_name}`
                            : 'Unassigned'}
                        </dd>
                      </div>
                    </div>
                  </dl>
                </CardContent>
              </Card>

              {lead.tags.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Tags</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {lead.tags.map((tag) => (
                        <Badge key={tag} variant="info">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Score Gauge */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Lead Score</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center">
                  <div className="relative h-32 w-32">
                    <svg
                      className="h-32 w-32 -rotate-90"
                      viewBox="0 0 120 120"
                    >
                      <circle
                        cx="60"
                        cy="60"
                        r="50"
                        fill="none"
                        stroke="#e5e7eb"
                        strokeWidth="12"
                      />
                      <circle
                        cx="60"
                        cy="60"
                        r="50"
                        fill="none"
                        stroke={
                          lead.score >= 70
                            ? '#22c55e'
                            : lead.score >= 40
                              ? '#eab308'
                              : '#ef4444'
                        }
                        strokeWidth="12"
                        strokeLinecap="round"
                        strokeDasharray={`${(lead.score / 100) * 314} 314`}
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-3xl font-bold text-gray-900">
                        {lead.score}
                      </span>
                    </div>
                  </div>
                  <p className="mt-2 text-sm text-gray-500">out of 100</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Status Timeline</CardTitle>
                </CardHeader>
                <CardContent>
                  <ol className="space-y-3">
                    {(
                      [
                        'new',
                        'contacted',
                        'qualified',
                        'meeting_booked',
                        'won',
                      ] as LeadStatus[]
                    ).map((s, i) => {
                      const statusIdx = (
                        ['new', 'contacted', 'qualified', 'meeting_booked', 'won'] as LeadStatus[]
                      ).indexOf(lead.status);
                      const isActive = i <= statusIdx;
                      return (
                        <li key={s} className="flex items-center gap-3">
                          <div
                            className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium ${
                              isActive
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-200 text-gray-500'
                            }`}
                          >
                            {i + 1}
                          </div>
                          <span
                            className={`text-sm capitalize ${
                              isActive ? 'text-gray-900 font-medium' : 'text-gray-400'
                            }`}
                          >
                            {s.replace('_', ' ')}
                          </span>
                        </li>
                      );
                    })}
                  </ol>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {activeTab === 'notes' && (
          <div className="space-y-4">
            <Card>
              <CardContent>
                <form onSubmit={handleAddNote} className="flex gap-3">
                  <Input
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="Add a note..."
                    className="flex-1"
                  />
                  <Button type="submit" isLoading={noteSubmitting}>
                    <Send className="h-4 w-4" />
                    Add
                  </Button>
                </form>
              </CardContent>
            </Card>

            {notesLoading ? (
              <div className="flex justify-center py-8">
                <Spinner size="md" />
              </div>
            ) : notes.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-gray-500">
                  No notes yet. Add one above.
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {notes.map((note) => (
                  <Card key={note.id}>
                    <CardContent>
                      <div className="flex items-start justify-between">
                        <p className="text-sm text-gray-900">{note.content}</p>
                      </div>
                      <div className="mt-2 flex items-center gap-2 text-xs text-gray-400">
                        <User className="h-3 w-3" />
                        {note.author}
                        <Clock className="ml-2 h-3 w-3" />
                        {formatDate(note.created_at)}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'conversations' && (
          <div className="space-y-4">
            {conversationsLoading ? (
              <div className="flex justify-center py-8">
                <Spinner size="md" />
              </div>
            ) : conversations.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-gray-500">
                  No conversations with this lead yet.
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {conversations.map((conv) => (
                  <Card
                    key={conv.id}
                    className="cursor-pointer transition-shadow hover:shadow-md"
                    onClick={() =>
                      router.push(`/conversations?id=${conv.id}`)
                    }
                  >
                    <CardContent className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <Avatar name={lead.name} size="sm" />
                        <div>
                          <p className="font-medium text-gray-900">
                            {conv.channel}
                          </p>
                          <p className="text-sm text-gray-500">
                            Status: {conv.status} &middot; Last message:{' '}
                            {formatDate(conv.last_message_at)}
                          </p>
                        </div>
                      </div>
                      <Badge
                        variant={
                          conv.status === 'active'
                            ? 'success'
                            : conv.status === 'paused'
                              ? 'warning'
                              : 'default'
                        }
                      >
                        {conv.status}
                      </Badge>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'activity' && (
          <div className="space-y-4">
            {activityLoading ? (
              <div className="flex justify-center py-8">
                <Spinner size="md" />
              </div>
            ) : activity.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-gray-500">
                  No activity recorded yet.
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent>
                  <ul className="space-y-4">
                    {activity.map((item) => (
                      <li
                        key={item.id}
                        className="flex gap-4 border-b border-gray-100 pb-4 last:border-0 last:pb-0"
                      >
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                          <Activity className="h-4 w-4" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">
                            {item.action}
                          </p>
                          {item.details && (
                            <p className="text-sm text-gray-500">
                              {item.details}
                            </p>
                          )}
                          <div className="mt-1 flex items-center gap-2 text-xs text-gray-400">
                            <Clock className="h-3 w-3" />
                            {formatDate(item.timestamp)}
                            {item.user && (
                              <>
                                <span>&middot;</span>
                                {item.user}
                              </>
                            )}
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
