'use client';

import { useState, useEffect, useCallback } from 'react';
import { Save, Play, Clock, MessageSquare, Bot, Settings, Key, Globe, Cpu, Thermometer, Hash } from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Spinner } from '@/components/ui/Spinner';
import { Badge } from '@/components/ui/Badge';
import { get, put, post } from '@/lib/api';

interface AIConfig {
  ai_prompt_config: Record<string, string>;
  ai_provider: string;
  ai_api_key: string;
  ai_api_key_display: string;
  ai_base_url: string;
  ai_model: string;
  ai_temperature: number;
  ai_max_tokens: number;
  system_prompt: string;
  qualification_criteria: string;
  personality_tone: string;
  working_hours_start: string;
  working_hours_end: string;
  response_delay_min: number;
  response_delay_max: number;
  max_messages_per_conversation: number;
}

const providerOptions = [
  { value: 'openai', label: 'OpenAI (GPT-4, GPT-4o, etc.)' },
  { value: 'openai_compatible', label: 'OpenAI-Compatible (OpenRouter, Together, Groq, etc.)' },
  { value: 'ollama', label: 'Ollama (Local AI)' },
  { value: 'ollama_cloud', label: 'Ollama Cloud' },
  { value: 'anthropic', label: 'Anthropic (Claude)' },
  { value: 'google', label: 'Google Gemini' },
  { value: 'mistral', label: 'Mistral AI' },
  { value: 'local', label: 'Local LLM (LM Studio, vLLM, etc.)' },
];

const providerDefaults: Record<string, { base_url: string; model: string; placeholder_key: string }> = {
  openai: { base_url: 'https://api.openai.com/v1', model: 'gpt-4o', placeholder_key: 'sk-...' },
  openai_compatible: { base_url: 'https://openrouter.ai/api/v1', model: 'openai/gpt-4o', placeholder_key: 'sk-or-...' },
  ollama: { base_url: 'http://localhost:11434/v1', model: 'llama3', placeholder_key: '' },
  ollama_cloud: { base_url: 'https://ollama.com/v1', model: 'gpt-oss:120b-cloud', placeholder_key: 'ollama_...' },
  anthropic: { base_url: '', model: 'claude-sonnet-4-20250514', placeholder_key: 'sk-ant-...' },
  google: { base_url: '', model: 'gemini-2.0-flash', placeholder_key: 'AIza...' },
  mistral: { base_url: '', model: 'mistral-large-latest', placeholder_key: '' },
  local: { base_url: 'http://localhost:1234/v1', model: '', placeholder_key: '' },
};

const toneOptions = [
  { value: 'professional', label: 'Professional' },
  { value: 'friendly', label: 'Friendly' },
  { value: 'casual', label: 'Casual' },
];

const defaultConfig: AIConfig = {
  ai_prompt_config: {},
  ai_provider: '',
  ai_api_key: '',
  ai_api_key_display: '',
  ai_base_url: '',
  ai_model: '',
  ai_temperature: 0.7,
  ai_max_tokens: 1024,
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
  const [providerChanged, setProviderChanged] = useState(false);

  const fetchConfig = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await get<AIConfig>('/businesses/ai-config/');
      if (res.data) {
        const data = res.data;
        setConfig({
          ai_prompt_config: data.ai_prompt_config || {},
          ai_provider: data.ai_provider || '',
          ai_api_key: '',
          ai_api_key_display: data.ai_api_key_display || '',
          ai_base_url: data.ai_base_url || '',
          ai_model: data.ai_model || '',
          ai_temperature: data.ai_temperature ?? 0.7,
          ai_max_tokens: data.ai_max_tokens ?? 1024,
          system_prompt: data.system_prompt || data.ai_prompt_config?.system_prompt || defaultConfig.system_prompt,
          qualification_criteria: data.qualification_criteria || data.ai_prompt_config?.qualification_criteria || defaultConfig.qualification_criteria,
          personality_tone: data.personality_tone || data.ai_prompt_config?.personality_tone || defaultConfig.personality_tone,
          working_hours_start: data.working_hours_start || defaultConfig.working_hours_start,
          working_hours_end: data.working_hours_end || defaultConfig.working_hours_end,
          response_delay_min: data.response_delay_min ?? defaultConfig.response_delay_min,
          response_delay_max: data.response_delay_max ?? defaultConfig.response_delay_max,
          max_messages_per_conversation: data.max_messages_per_conversation ?? defaultConfig.max_messages_per_conversation,
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

  const handleProviderChange = (provider: string) => {
    const defaults = providerDefaults[provider] || providerDefaults.mock;
    setConfig((prev) => ({
      ...prev,
      ai_provider: provider,
      ai_base_url: defaults.base_url,
      ai_model: defaults.model,
    }));
    setProviderChanged(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveMessage(null);
    try {
      const payload: Record<string, unknown> = {
        ai_provider: config.ai_provider,
        ai_base_url: config.ai_base_url,
        ai_model: config.ai_model,
        ai_temperature: config.ai_temperature,
        ai_max_tokens: config.ai_max_tokens,
        ai_prompt_config: {
          system_prompt: config.system_prompt,
          qualification_criteria: config.qualification_criteria,
          personality_tone: config.personality_tone,
          working_hours_start: config.working_hours_start,
          working_hours_end: config.working_hours_end,
          response_delay_min: config.response_delay_min,
          response_delay_max: config.response_delay_max,
          max_messages_per_conversation: config.max_messages_per_conversation,
        },
      };
      if (config.ai_api_key) {
        payload.ai_api_key = config.ai_api_key;
      }
      await put('/businesses/ai-config/', payload);
      setSaveMessage({ type: 'success', text: 'Settings saved successfully' });
      setProviderChanged(false);
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
      const res = await post<{ response: string }>('/businesses/ai-config/test/', {
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
        'Error: Failed to get AI response. Make sure your provider is configured correctly and try again.'
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

  const isProviderActive = config.ai_provider !== '';
  const defaults = providerDefaults[config.ai_provider] || { base_url: '', model: '', placeholder_key: '' };

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

        {/* AI Provider Configuration */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Cpu className="h-5 w-5 text-indigo-600" />
              <CardTitle className="text-base">AI Provider Configuration</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-sm text-gray-500">
              Choose your AI provider and configure API credentials. The agent uses this to generate responses to leads.
            </p>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Select
                label="AI Provider"
                value={config.ai_provider}
                onChange={(e) => handleProviderChange(e.target.value)}
                options={providerOptions}
              />
              <Input
                label="Model Name"
                value={config.ai_model}
                onChange={(e) => setConfig({ ...config, ai_model: e.target.value })}
                placeholder={defaults.model || 'e.g. gpt-4o'}
                icon={Cpu}
              />
            </div>

            {isProviderActive && (
              <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                <Input
                  label="API Key"
                  type="password"
                  value={config.ai_api_key}
                  onChange={(e) => setConfig({ ...config, ai_api_key: e.target.value })}
                  placeholder={
                    config.ai_api_key_display
                      ? `Current: ${config.ai_api_key_display} (leave blank to keep)`
                      : defaults.placeholder_key || 'Enter your API key'
                  }
                  icon={Key}
                />
                <Input
                  label="Base URL"
                  value={config.ai_base_url}
                  onChange={(e) => setConfig({ ...config, ai_base_url: e.target.value })}
                  placeholder={defaults.base_url || 'Leave blank for default'}
                  icon={Globe}
                />
              </div>
            )}

            {config.ai_provider === 'local' && isProviderActive && (
              <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3">
                <p className="text-sm text-amber-800">
                  <strong>Local LLM:</strong> Make sure your local server (LM Studio, vLLM, etc.) is running and accessible at the Base URL. No API key is required.
                </p>
              </div>
            )}

            {config.ai_provider === 'ollama' && isProviderActive && (
              <div className="mt-3 rounded-lg border border-purple-200 bg-purple-50 p-3">
                <p className="text-sm text-purple-800">
                  <strong>Ollama:</strong> Make sure Ollama is running (<code>ollama serve</code>). Default endpoint is <code>http://localhost:11434/v1</code>. No API key needed. Install models with <code>ollama pull llama3</code>.
                </p>
              </div>
            )}

            {config.ai_provider === 'ollama_cloud' && isProviderActive && (
              <div className="mt-3 rounded-lg border border-purple-200 bg-purple-50 p-3">
                <p className="text-sm text-purple-800">
                  <strong>Ollama Cloud:</strong> Uses Ollama&apos;s cloud API at <code>https://ollama.com/v1</code>. Get your API key at <a href="https://ollama.com/settings/keys" target="_blank" rel="noopener noreferrer" className="underline">ollama.com/settings/keys</a>. Cloud models use the <code>-cloud</code> suffix (e.g. <code>gpt-oss:120b-cloud</code>).
                </p>
              </div>
            )}

            {config.ai_provider === 'openai_compatible' && isProviderActive && (
              <div className="mt-3 rounded-lg border border-blue-200 bg-blue-50 p-3">
                <p className="text-sm text-blue-800">
                  <strong>OpenAI-Compatible:</strong> Works with OpenRouter, Together AI, Groq, Fireworks, Deepseek, and any OpenAI-compatible API. Set the Base URL to your provider&apos;s endpoint.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

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
                  <Thermometer className="h-5 w-5 text-orange-600" />
                  <CardTitle className="text-base">Model Parameters</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Temperature: {config.ai_temperature}
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="2"
                      step="0.1"
                      value={config.ai_temperature}
                      onChange={(e) =>
                        setConfig({ ...config, ai_temperature: parseFloat(e.target.value) })
                      }
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-gray-400">
                      <span>Precise (0)</span>
                      <span>Balanced (1)</span>
                      <span>Creative (2)</span>
                    </div>
                  </div>
                  <Input
                    label="Max Tokens"
                    type="number"
                    min={256}
                    max={8192}
                    value={config.ai_max_tokens}
                    onChange={(e) =>
                      setConfig({ ...config, ai_max_tokens: parseInt(e.target.value) || 1024 })
                    }
                    icon={Hash}
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
