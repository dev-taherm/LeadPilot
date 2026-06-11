'use client';

import { useState, useEffect, useCallback } from 'react';
import { Save, Play, Clock, MessageSquare, Bot, Settings } from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Spinner } from '@/components/ui/Spinner';
import { Badge } from '@/components/ui/Badge';
import { get, put } from '@/lib/api';

interface AIConfig {
  system_prompt: string;
  qualification_criteria: string;
  personality_tone: string;
  working_hours_start: string;
  working_hours_end: string;
  response_delay_min: number;
  response_delay_max: number;
  max_messages_per_conversation: number;
}

const toneOptions = [
  { value: 'professional', label: 'Professional' },
  { value: 'friendly', label: 'Friendly' },
  { value: 'casual', label: 'Casual' },
];

const defaultConfig: AIConfig = {
  system_prompt:
    'You are a helpful AI assistant for a business. Your goal is to qualify leads by asking relevant questions about their needs, budget, and timeline. Be professional, friendly, and helpful.',
  qualification_criteria:
    'Lead qualifies if they have a budget over $1000, need services within 3 months, and are a decision maker.',
  personality_tone: 'professional',
  working_hours_start: '09:00',
  working_hours_end: '17:00',
  response_delay_min: 2,
  response_delay_max: 5,
  max_messages_per_conversation: 20,
};

export default function AISettingsPage() {
  const [config, setConfig] = useState<AIConfig>(defaultConfig);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const fetchConfig = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await get<AIConfig>('/businesses/ai-config/');
      if (res.data) {
        setConfig({
          system_prompt: res.data.system_prompt || defaultConfig.system_prompt,
          qualification_criteria:
            res.data.qualification_criteria || defaultConfig.qualification_criteria,
          personality_tone: res.data.personality_tone || defaultConfig.personality_tone,
          working_hours_start:
            res.data.working_hours_start || defaultConfig.working_hours_start,
          working_hours_end:
            res.data.working_hours_end || defaultConfig.working_hours_end,
          response_delay_min:
            res.data.response_delay_min ?? defaultConfig.response_delay_min,
          response_delay_max:
            res.data.response_delay_max ?? defaultConfig.response_delay_max,
          max_messages_per_conversation:
            res.data.max_messages_per_conversation ??
            defaultConfig.max_messages_per_conversation,
        });
      }
    } catch {
      setConfig(defaultConfig);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  const handleSave = async () => {
    setIsSaving(true);
    setSaveMessage(null);
    try {
      await put('/businesses/ai-config/', config);
      setSaveMessage({ type: 'success', text: 'Settings saved successfully' });
      setTimeout(() => setSaveMessage(null), 3000);
    } catch {
      setSaveMessage({ type: 'error', text: 'Failed to save settings' });
      setTimeout(() => setSaveMessage(null), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestAI = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await put<{ response: string }>('/businesses/ai-config/test/', {
        system_prompt: config.system_prompt,
        personality_tone: config.personality_tone,
        qualification_criteria: config.qualification_criteria,
      });
      setTestResult(
        res.data?.response ||
          'Hello! I am interested in your services. Can you tell me more about what you offer and how it can help my business?'
      );
    } catch {
      setTestResult(
        'Sample AI Response: Hello! Thank you for reaching out. I would be happy to help you with your inquiry. Could you tell me more about your specific needs and how we can assist you today?'
      );
    } finally {
      setIsTesting(false);
    }
  };

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
          <h1 className="text-2xl font-bold text-gray-900">AI Settings</h1>
          <div className="flex items-center gap-3">
            {saveMessage && (
              <Badge variant={saveMessage.type === 'success' ? 'success' : 'danger'}>
                {saveMessage.text}
              </Badge>
            )}
            <Button onClick={handleSave} isLoading={isSaving}>
              <Save className="h-4 w-4" />
              Save Settings
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Bot className="h-5 w-5 text-blue-600" />
                  <CardTitle className="text-base">System Prompt</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="mb-3 text-sm text-gray-500">
                  Define how your AI assistant behaves and responds to leads.
                </p>
                <textarea
                  value={config.system_prompt}
                  onChange={(e) =>
                    setConfig({ ...config, system_prompt: e.target.value })
                  }
                  rows={6}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  placeholder="Enter the system prompt for your AI assistant..."
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Settings className="h-5 w-5 text-purple-600" />
                  <CardTitle className="text-base">Qualification Criteria</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="mb-3 text-sm text-gray-500">
                  Define what criteria qualify a lead as a good fit.
                </p>
                <textarea
                  value={config.qualification_criteria}
                  onChange={(e) =>
                    setConfig({ ...config, qualification_criteria: e.target.value })
                  }
                  rows={4}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  placeholder="Describe what qualifies a lead..."
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-green-600" />
                  <CardTitle className="text-base">Personality Settings</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Select
                    label="Tone"
                    value={config.personality_tone}
                    onChange={(e) =>
                      setConfig({ ...config, personality_tone: e.target.value })
                    }
                    options={toneOptions}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-yellow-600" />
                  <CardTitle className="text-base">Working Hours</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="mb-3 text-sm text-gray-500">
                  Set the hours when the AI assistant is active.
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Start Time"
                    type="time"
                    value={config.working_hours_start}
                    onChange={(e) =>
                      setConfig({ ...config, working_hours_start: e.target.value })
                    }
                  />
                  <Input
                    label="End Time"
                    type="time"
                    value={config.working_hours_end}
                    onChange={(e) =>
                      setConfig({ ...config, working_hours_end: e.target.value })
                    }
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-orange-600" />
                  <CardTitle className="text-base">Response Settings</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="Min Delay (seconds)"
                      type="number"
                      min={0}
                      max={60}
                      value={config.response_delay_min}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          response_delay_min: parseInt(e.target.value) || 0,
                        })
                      }
                    />
                    <Input
                      label="Max Delay (seconds)"
                      type="number"
                      min={0}
                      max={120}
                      value={config.response_delay_max}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          response_delay_max: parseInt(e.target.value) || 0,
                        })
                      }
                    />
                  </div>
                  <Input
                    label="Max Messages per Conversation"
                    type="number"
                    min={1}
                    max={100}
                    value={config.max_messages_per_conversation}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        max_messages_per_conversation:
                          parseInt(e.target.value) || 20,
                      })
                    }
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Play className="h-5 w-5 text-blue-600" />
                  <CardTitle className="text-base">Test AI Response</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="mb-3 text-sm text-gray-500">
                  Test how your AI assistant responds with the current settings.
                </p>
                <Button
                  onClick={handleTestAI}
                  isLoading={isTesting}
                  variant="outline"
                >
                  <Play className="h-4 w-4" />
                  Test AI Response
                </Button>
                {testResult && (
                  <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
                    <p className="mb-2 text-xs font-medium text-gray-500">
                      AI Response:
                    </p>
                    <p className="text-sm text-gray-700">{testResult}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
