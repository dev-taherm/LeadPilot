'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { post, put } from '@/lib/api';
import {
  MessageSquare,
  Send,
  Bot,
  Mail,
  Phone,
  Hash,
  Disc,
  Image,
  Globe,
  Settings,
  Link2,
  Copy,
  Check,
  AlertCircle,
} from 'lucide-react';

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

const CHANNEL_INFO: Record<string, {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
  borderColor: string;
  fields: { key: string; label: string; type?: string; placeholder: string }[];
  description: string;
}> = {
  whatsapp: {
    label: 'WhatsApp',
    icon: MessageSquare,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    fields: [
      { key: 'phone_number_id', label: 'Phone Number ID', placeholder: '1234567890' },
      { key: 'access_token', label: 'Access Token', type: 'password', placeholder: 'EAA...' },
      { key: 'verify_token', label: 'Verify Token', placeholder: 'your-verify-token' },
      { key: 'business_account_id', label: 'Business Account ID', placeholder: '123456789' },
      { key: 'app_secret', label: 'App Secret', type: 'password', placeholder: 'App secret for webhook verification' },
    ],
    description: 'Send and receive WhatsApp messages via Meta Business Cloud API.',
  },
  telegram: {
    label: 'Telegram',
    icon: Send,
    color: 'text-blue-500',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    fields: [
      { key: 'bot_token', label: 'Bot Token', type: 'password', placeholder: '123456:ABC-DEF...' },
    ],
    description: 'Connect a Telegram bot via Bot API. Get your token from @BotFather.',
  },
  sms: {
    label: 'SMS (Twilio)',
    icon: Phone,
    color: 'text-red-500',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    fields: [
      { key: 'account_sid', label: 'Account SID', placeholder: 'AC...' },
      { key: 'auth_token', label: 'Auth Token', type: 'password', placeholder: 'Your auth token' },
      { key: 'phone_number', label: 'Twilio Phone Number', placeholder: '+1234567890' },
    ],
    description: 'Send and receive SMS via Twilio.',
  },
  email: {
    label: 'Email',
    icon: Mail,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
    fields: [
      { key: 'smtp_host', label: 'SMTP Host', placeholder: 'smtp.gmail.com' },
      { key: 'smtp_port', label: 'SMTP Port', placeholder: '587' },
      { key: 'smtp_user', label: 'SMTP Username', placeholder: 'you@gmail.com' },
      { key: 'smtp_password', label: 'SMTP Password', type: 'password', placeholder: 'Your password' },
      { key: 'from_email', label: 'From Email', placeholder: 'noreply@yourdomain.com' },
      { key: 'imap_host', label: 'IMAP Host (for receiving)', placeholder: 'imap.gmail.com' },
      { key: 'imap_port', label: 'IMAP Port', placeholder: '993' },
      { key: 'imap_user', label: 'IMAP Username', placeholder: 'you@gmail.com' },
      { key: 'imap_password', label: 'IMAP Password', type: 'password', placeholder: 'Your password' },
    ],
    description: 'Send and receive emails via SMTP/IMAP.',
  },
  slack: {
    label: 'Slack',
    icon: Hash,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    fields: [
      { key: 'bot_token', label: 'Bot Token', type: 'password', placeholder: 'xoxb-...' },
      { key: 'signing_secret', label: 'Signing Secret', type: 'password', placeholder: 'Your signing secret' },
    ],
    description: 'Connect a Slack bot. Create an app at api.slack.com.',
  },
  discord: {
    label: 'Discord',
    icon: Disc,
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50',
    borderColor: 'border-indigo-200',
    fields: [
      { key: 'bot_token', label: 'Bot Token', type: 'password', placeholder: 'MTI...' },
      { key: 'application_id', label: 'Application ID', placeholder: 'Your app ID' },
    ],
    description: 'Connect a Discord bot. Create one at discord.com/developers.',
  },
  instagram: {
    label: 'Instagram DM',
    icon: Image,
    color: 'text-pink-600',
    bgColor: 'bg-pink-50',
    borderColor: 'border-pink-200',
    fields: [
      { key: 'page_access_token', label: 'Page Access Token', type: 'password', placeholder: 'EAA...' },
      { key: 'page_id', label: 'Page ID', placeholder: 'Your Instagram page ID' },
      { key: 'verify_token', label: 'Verify Token', placeholder: 'your-verify-token' },
      { key: 'app_secret', label: 'App Secret', type: 'password', placeholder: 'App secret for webhook verification' },
    ],
    description: 'Receive Instagram DMs via Meta Graph API. Requires a Professional account.',
  },
  facebook: {
    label: 'Facebook Messenger',
    icon: Globe,
    color: 'text-blue-700',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    fields: [
      { key: 'page_access_token', label: 'Page Access Token', type: 'password', placeholder: 'EAA...' },
      { key: 'page_id', label: 'Page ID', placeholder: 'Your Facebook page ID' },
      { key: 'verify_token', label: 'Verify Token', placeholder: 'your-verify-token' },
      { key: 'app_secret', label: 'App Secret', type: 'password', placeholder: 'App secret for webhook verification' },
    ],
    description: 'Receive Facebook Messenger messages via Meta Graph API.',
  },
};

export default function ChannelCard({
  integration,
  onUpdate,
}: {
  integration: ChannelIntegration | null;
  onUpdate: () => void;
}) {
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [config, setConfig] = useState<Record<string, string>>(integration?.config || {});
  const [name, setName] = useState(integration?.name || '');
  const [webhookUrl, setWebhookUrl] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const channelType = integration?.channel_type || '';
  const info = CHANNEL_INFO[channelType];
  if (!info) return null;
  const Icon = info.icon;
  const isConnected = integration?.status === 'connected';
  const isActive = integration?.is_active;

  const handleSave = async () => {
    setIsSaving(true);
    setError('');
    setSuccess('');
    try {
      if (integration) {
        await put(`/channels/${integration.id}/`, {
          name,
          config,
        });
      } else {
        await post('/channels/', {
          channel_type: channelType,
          name,
          config,
        });
      }
      setSuccess('Settings saved successfully');
      onUpdate();
      setTimeout(() => setSuccess(''), 3000);
    } catch {
      setError('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleTest = async () => {
    if (!integration) return;
    setIsTesting(true);
    setError('');
    try {
      const res = await post<{ success: boolean; message?: string }>(`/channels/${integration.id}/test-connection/`);
      if (res.data?.success) {
        setSuccess(res.data.message || 'Connected successfully');
        onUpdate();
      } else {
        setError(res.data?.message || 'Connection failed');
      }
    } catch {
      setError('Connection test failed');
    } finally {
      setIsTesting(false);
      setTimeout(() => { setSuccess(''); setError(''); }, 5000);
    }
  };

  const handleToggle = async () => {
    if (!integration) return;
    try {
      await post(`/channels/${integration.id}/toggle/`);
      onUpdate();
    } catch {
      setError('Failed to toggle channel');
    }
  };

  const handleCopyWebhook = () => {
    if (webhookUrl) {
      navigator.clipboard.writeText(webhookUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const fetchWebhookUrl = async () => {
    if (!integration) return;
    try {
      const res = await get<{ webhook_url: string }>(`/channels/${integration.id}/webhook-url/`);
      if (res.data?.webhook_url) {
        setWebhookUrl(res.data.webhook_url);
      }
    } catch {
      // ignore
    }
  };

  return (
    <Card className="relative overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${info.bgColor}`}>
              <Icon className={`h-6 w-6 ${info.color}`} />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{info.label}</h3>
              <p className="text-sm text-gray-500">{integration?.name || 'Not configured'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {integration && (
              <Badge variant={isConnected ? 'success' : isActive ? 'warning' : 'default'}>
                {isConnected ? 'Connected' : isActive ? 'Active' : 'Disconnected'}
              </Badge>
            )}
          </div>
        </div>

        <p className="mt-3 text-sm text-gray-500">{info.description}</p>

        {integration && !isActive && (
          <div className="mt-2 flex items-center gap-1 text-sm text-amber-600">
            <AlertCircle className="h-4 w-4" />
            <span>Channel is disabled</span>
          </div>
        )}

        {error && (
          <div className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
        )}
        {success && (
          <div className="mt-3 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">{success}</div>
        )}

        <div className="mt-4 flex flex-wrap gap-2">
          {!isConfigOpen ? (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setIsConfigOpen(true);
                  if (integration) fetchWebhookUrl();
                }}
              >
                <Settings className="mr-1 h-4 w-4" />
                {integration ? 'Configure' : 'Connect'}
              </Button>
              {integration && (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleTest}
                    isLoading={isTesting}
                  >
                    Test Connection
                  </Button>
                  <Button
                    size="sm"
                    variant={isActive ? 'danger' : 'success'}
                    onClick={handleToggle}
                  >
                    {isActive ? 'Disable' : 'Enable'}
                  </Button>
                </>
              )}
            </>
          ) : (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setIsConfigOpen(false)}
            >
              Close
            </Button>
          )}
        </div>

        {isConfigOpen && (
          <div className="mt-4 space-y-4 border-t border-gray-200 pt-4">
            <Input
              label="Integration Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={`${info.label} - My Business`}
            />

            {info.fields.map((field) => (
              <Input
                key={field.key}
                label={field.label}
                type={field.type || 'text'}
                value={config[field.key] || ''}
                onChange={(e) => setConfig({ ...config, [field.key]: e.target.value })}
                placeholder={field.placeholder}
              />
            ))}

            {integration && webhookUrl && (
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                <p className="mb-2 text-xs font-medium text-gray-500">Webhook URL</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 truncate text-xs text-gray-700">{webhookUrl}</code>
                  <button
                    onClick={handleCopyWebhook}
                    className="shrink-0 rounded p-1 text-gray-400 hover:text-gray-600"
                  >
                    {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                  </button>
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  Configure this URL in your {info.label} settings as the webhook endpoint.
                </p>
              </div>
            )}

            <div className="flex gap-2">
              <Button onClick={handleSave} isLoading={isSaving} size="sm">
                Save Settings
              </Button>
              {integration && !webhookUrl && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchWebhookUrl}
                >
                  <Link2 className="mr-1 h-4 w-4" />
                  Show Webhook URL
                </Button>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
