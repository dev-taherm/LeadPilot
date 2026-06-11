'use client';

import { useState, useEffect, useCallback } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { Spinner } from '@/components/ui/Spinner';
import { get } from '@/lib/api';
import ChannelCard from '@/components/channels/ChannelCard';
import { Radio, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface ChannelIntegration {
  id: string;
  channel_type: string;
  name: string;
  is_active: boolean;
  config: Record<string, string>;
  status: string;
  last_error: string;
  last_connected_at: string | null;
  created_at: string;
}

const CHANNEL_TYPES = [
  { type: 'whatsapp', label: 'WhatsApp' },
  { type: 'telegram', label: 'Telegram' },
  { type: 'sms', label: 'SMS (Twilio)' },
  { type: 'email', label: 'Email' },
  { type: 'slack', label: 'Slack' },
  { type: 'discord', label: 'Discord' },
  { type: 'instagram', label: 'Instagram DM' },
  { type: 'facebook', label: 'Facebook Messenger' },
];

export default function ChannelsPage() {
  const [integrations, setIntegrations] = useState<ChannelIntegration[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  const fetchIntegrations = useCallback(async () => {
    try {
      const res = await get<{ results: ChannelIntegration[] }>('/channels/');
      setIntegrations(res.data?.results || []);
    } catch {
      setIntegrations([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchIntegrations();
  }, [fetchIntegrations]);

  const getIntegrationForType = (type: string) =>
    integrations.find((i) => i.channel_type === type) || null;

  const configuredTypes = new Set(integrations.map((i) => i.channel_type));

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-20">
          <Spinner size="lg" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Channels & Integrations</h1>
            <p className="mt-1 text-sm text-gray-500">
              Connect your messaging platforms to receive and send messages to leads.
            </p>
          </div>
          <Button onClick={() => setShowAddModal(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Channel
          </Button>
        </div>

        {integrations.length > 0 && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {integrations.map((integration) => (
              <ChannelCard
                key={integration.id}
                integration={integration}
                onUpdate={fetchIntegrations}
              />
            ))}
          </div>
        )}

        {integrations.length === 0 && (
          <div className="rounded-xl border-2 border-dashed border-gray-300 p-12 text-center">
            <Radio className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">No channels connected</h3>
            <p className="mt-2 text-sm text-gray-500">
              Connect your first messaging channel to start receiving and sending messages to leads.
            </p>
            <Button className="mt-4" onClick={() => setShowAddModal(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Your First Channel
            </Button>
          </div>
        )}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">Add a Channel</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="rounded-lg p-1 text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-2">
              {CHANNEL_TYPES.map((ct) => {
                const exists = configuredTypes.has(ct.type);
                return (
                  <button
                    key={ct.type}
                    disabled={exists}
                    onClick={() => {
                      setShowAddModal(false);
                    }}
                    className={`flex w-full items-center justify-between rounded-lg border p-3 text-left transition-colors ${
                      exists
                        ? 'cursor-not-allowed border-gray-100 bg-gray-50 text-gray-400'
                        : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                    }`}
                  >
                    <span className="font-medium">{ct.label}</span>
                    {exists ? (
                      <span className="text-xs text-gray-400">Already added</span>
                    ) : (
                      <span className="text-xs text-blue-600">+ Add</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
