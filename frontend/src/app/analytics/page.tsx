'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  TrendingUp,
  Users,
  UserPlus,
  CheckCircle,
  Calendar,
  Percent,
  Clock,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from 'recharts';
import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { get } from '@/lib/api';
import type { AnalyticsSnapshot } from '@/types';

type DateRange = 'today' | 'week' | 'month' | 'quarter' | 'custom';

const dateRangeOptions: { value: DateRange; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'This Week' },
  { value: 'month', label: 'This Month' },
  { value: 'quarter', label: 'This Quarter' },
  { value: 'custom', label: 'Custom' },
];

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

const mockPipelineData = [
  { status: 'New', count: 45, fill: '#3B82F6' },
  { status: 'Contacted', count: 32, fill: '#6B7280' },
  { status: 'Qualified', count: 28, fill: '#10B981' },
  { status: 'Meeting', count: 15, fill: '#F59E0B' },
  { status: 'Won', count: 12, fill: '#22C55E' },
  { status: 'Lost', count: 8, fill: '#EF4444' },
];

const mockSourceData = [
  { name: 'Website', value: 35, fill: '#3B82F6' },
  { name: 'Referral', value: 25, fill: '#10B981' },
  { name: 'Social', value: 20, fill: '#F59E0B' },
  { name: 'Cold Call', value: 12, fill: '#8B5CF6' },
  { name: 'Ads', value: 8, fill: '#EC4899' },
];

const mockFunnelData = [
  { stage: 'Leads', value: 100, fill: '#3B82F6' },
  { stage: 'Contacted', value: 72, fill: '#6366F1' },
  { stage: 'Qualified', value: 45, fill: '#8B5CF6' },
  { stage: 'Meeting', value: 25, fill: '#A855F7' },
  { stage: 'Won', value: 12, fill: '#10B981' },
];

const mockResponseTimeData = [
  { day: 'Mon', minutes: 4.2 },
  { day: 'Tue', minutes: 3.8 },
  { day: 'Wed', minutes: 5.1 },
  { day: 'Thu', minutes: 3.5 },
  { day: 'Fri', minutes: 4.8 },
  { day: 'Sat', minutes: 6.2 },
  { day: 'Sun', minutes: 5.5 },
];

const mockAiUsageData = [
  { day: 'Mon', interactions: 45 },
  { day: 'Tue', interactions: 52 },
  { day: 'Wed', interactions: 61 },
  { day: 'Thu', interactions: 48 },
  { day: 'Fri', interactions: 73 },
  { day: 'Sat', interactions: 35 },
  { day: 'Sun', interactions: 28 },
];

export default function AnalyticsPage() {
  const [dateRange, setDateRange] = useState<DateRange>('month');
  const [isLoading, setIsLoading] = useState(true);
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [snapshots, setSnapshots] = useState<AnalyticsSnapshot[]>([]);

  const [kpis, setKpis] = useState({
    totalLeads: 140,
    newLeads: 45,
    qualified: 28,
    meetings: 15,
    conversionRate: 8.6,
    avgResponseTime: 4.6,
  });

  const [pipelineData, setPipelineData] = useState(mockPipelineData);
  const [sourceData, setSourceData] = useState(mockSourceData);
  const [funnelData, setFunnelData] = useState(mockFunnelData);
  const [responseTimeData, setResponseTimeData] = useState(mockResponseTimeData);
  const [aiUsageData, setAiUsageData] = useState(mockAiUsageData);

  const fetchAnalytics = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: Record<string, string> = { range: dateRange };
      if (dateRange === 'custom' && customStart && customEnd) {
        params.start_date = customStart;
        params.end_date = customEnd;
      }
      const res = await get<{ results: AnalyticsSnapshot[] }>(
        '/dashboard/',
        params
      );
      const data = res.data.results || [];
      setSnapshots(data);

      if (data.length > 0) {
        const latest = data[data.length - 1];
        setKpis({
          totalLeads: latest.total_leads,
          newLeads: latest.new_leads,
          qualified: latest.qualified_leads,
          meetings: latest.meetings_booked,
          conversionRate: latest.conversion_rate,
          avgResponseTime: latest.avg_response_time,
        });
      }
    } catch {
      // use mock data on error
    } finally {
      setIsLoading(false);
    }
  }, [dateRange, customStart, customEnd]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const kpiCards = [
    {
      title: 'Total Leads',
      value: kpis.totalLeads,
      icon: Users,
      color: 'text-blue-600',
      bg: 'bg-blue-100',
    },
    {
      title: 'New Leads',
      value: kpis.newLeads,
      icon: UserPlus,
      color: 'text-green-600',
      bg: 'bg-green-100',
    },
    {
      title: 'Qualified',
      value: kpis.qualified,
      icon: CheckCircle,
      color: 'text-purple-600',
      bg: 'bg-purple-100',
    },
    {
      title: 'Meetings',
      value: kpis.meetings,
      icon: Calendar,
      color: 'text-yellow-600',
      bg: 'bg-yellow-100',
    },
    {
      title: 'Conversion Rate',
      value: `${kpis.conversionRate}%`,
      icon: Percent,
      color: 'text-emerald-600',
      bg: 'bg-emerald-100',
    },
    {
      title: 'Avg Response Time',
      value: `${kpis.avgResponseTime}m`,
      icon: Clock,
      color: 'text-orange-600',
      bg: 'bg-orange-100',
    },
  ];

  return (
    <AppLayout>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <div className="flex flex-wrap items-center gap-2">
            {dateRangeOptions.map((option) => (
              <Button
                key={option.value}
                variant={dateRange === option.value ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setDateRange(option.value)}
              >
                {option.label}
              </Button>
            ))}
          </div>
        </div>

        {dateRange === 'custom' && (
          <div className="flex items-center gap-4">
            <input
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
            <span className="text-sm text-gray-500">to</span>
            <input
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Spinner size="lg" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
              {kpiCards.map((kpi) => (
                <Card key={kpi.title}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg ${kpi.bg}`}>
                        <kpi.icon className={`h-5 w-5 ${kpi.color}`} />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">{kpi.title}</p>
                        <p className="text-lg font-bold text-gray-900">{kpi.value}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Lead Pipeline</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={pipelineData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                      <XAxis dataKey="status" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip
                        contentStyle={{
                          borderRadius: '8px',
                          border: '1px solid #E5E7EB',
                          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                        }}
                      />
                      <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                        {pipelineData.map((entry, index) => (
                          <Cell key={index} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Lead Sources</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={sourceData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={3}
                        dataKey="value"
                        label={({ name, percent }: { name: string; percent?: number }) =>
                          `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
                        }
                      >
                        {sourceData.map((entry, index) => (
                          <Cell key={index} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          borderRadius: '8px',
                          border: '1px solid #E5E7EB',
                          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Conversion Funnel</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart
                      data={funnelData}
                      layout="vertical"
                      margin={{ left: 20 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" horizontal={false} />
                      <XAxis type="number" tick={{ fontSize: 12 }} />
                      <YAxis
                        dataKey="stage"
                        type="category"
                        tick={{ fontSize: 12 }}
                        width={80}
                      />
                      <Tooltip
                        contentStyle={{
                          borderRadius: '8px',
                          border: '1px solid #E5E7EB',
                          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                        }}
                      />
                      <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                        {funnelData.map((entry, index) => (
                          <Cell key={index} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Response Time Trend</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={responseTimeData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                      <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                      <YAxis
                        tick={{ fontSize: 12 }}
                        label={{
                          value: 'Minutes',
                          angle: -90,
                          position: 'insideLeft',
                          style: { fontSize: 12 },
                        }}
                      />
                      <Tooltip
                        contentStyle={{
                          borderRadius: '8px',
                          border: '1px solid #E5E7EB',
                          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                        }}
                        formatter={(value) => [`${value} min`, 'Response Time']}
                      />
                      <Line
                        type="monotone"
                        dataKey="minutes"
                        stroke="#F59E0B"
                        strokeWidth={2}
                        dot={{ fill: '#F59E0B', strokeWidth: 2 }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="text-base">AI Usage</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={aiUsageData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                      <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip
                        contentStyle={{
                          borderRadius: '8px',
                          border: '1px solid #E5E7EB',
                          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                        }}
                      />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="interactions"
                        stroke="#8B5CF6"
                        strokeWidth={2}
                        dot={{ fill: '#8B5CF6', strokeWidth: 2 }}
                        activeDot={{ r: 6 }}
                        name="AI Interactions"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
}
