"use client";

import { useEffect, useState } from "react";
import {
  Users,
  UserCheck,
  CalendarCheck,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  MessageSquare,
  Clock,
  Bot,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { get } from "@/lib/api";
import type { ApiResponse, Lead, Conversation } from "@/types";

interface DashboardData {
  total_leads: number;
  qualified_leads: number;
  meetings_booked: number;
  conversion_rate: number;
  leads_by_status: { status: string; count: number }[];
  recent_activities: {
    id: number;
    type: string;
    description: string;
    timestamp: string;
    user?: string;
  }[];
  active_conversations: Conversation[];
}

interface KPICardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  trend?: number;
}

function KPICard({ icon, label, value, trend }: KPICardProps) {
  const isPositive = trend && trend > 0;
  const isNegative = trend && trend < 0;

  return (
    <Card>
      <CardContent className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            {icon}
          </div>
          <div>
            <p className="text-sm text-gray-500">{label}</p>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
          </div>
        </div>
        {trend !== undefined && (
          <div
            className={`flex items-center gap-1 text-sm font-medium ${
              isPositive
                ? "text-green-600"
                : isNegative
                ? "text-red-600"
                : "text-gray-500"
            }`}
          >
            {isPositive ? (
              <ArrowUpRight className="h-4 w-4" />
            ) : isNegative ? (
              <ArrowDownRight className="h-4 w-4" />
            ) : null}
            {Math.abs(trend)}%
          </div>
        )}
      </CardContent>
    </Card>
  );
}

const statusColors: Record<string, string> = {
  new: "info",
  contacted: "warning",
  qualified: "success",
  unqualified: "danger",
  meeting_booked: "success",
  won: "success",
  lost: "danger",
};

function formatStatus(status: string): string {
  return status
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatTimeAgo(timestamp: string): string {
  const now = new Date();
  const date = new Date(timestamp);
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const response = await get<ApiResponse<DashboardData>>("/dashboard/");
        if (response.data.data) {
          setData(response.data.data);
        }
      } catch {
        setError("Failed to load dashboard data");
      } finally {
        setIsLoading(false);
      }
    }
    fetchDashboard();
  }, []);

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex h-96 items-center justify-center">
          <Spinner size="lg" />
        </div>
      </AppLayout>
    );
  }

  if (error) {
    return (
      <AppLayout>
        <div className="flex h-96 items-center justify-center">
          <div className="text-center">
            <p className="text-gray-500">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 text-sm font-medium text-blue-600 hover:text-blue-500"
            >
              Try again
            </button>
          </div>
        </div>
      </AppLayout>
    );
  }

  const kpis: KPICardProps[] = [
    {
      icon: <Users className="h-6 w-6" />,
      label: "Total Leads",
      value: data?.total_leads ?? 0,
      trend: 12,
    },
    {
      icon: <UserCheck className="h-6 w-6" />,
      label: "Qualified Leads",
      value: data?.qualified_leads ?? 0,
      trend: 8,
    },
    {
      icon: <CalendarCheck className="h-6 w-6" />,
      label: "Meetings Booked",
      value: data?.meetings_booked ?? 0,
      trend: -3,
    },
    {
      icon: <TrendingUp className="h-6 w-6" />,
      label: "Conversion Rate",
      value: `${data?.conversion_rate ?? 0}%`,
      trend: 5,
    },
  ];

  const chartData = data?.leads_by_status?.map((item) => ({
    name: formatStatus(item.status),
    count: item.count,
  })) ?? [];

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {kpis.map((kpi) => (
            <KPICard key={kpi.label} {...kpi} />
          ))}
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Leads by Status</CardTitle>
            </CardHeader>
            <CardContent>
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 12 }}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 12 }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        borderRadius: "8px",
                        border: "1px solid #e5e7eb",
                        boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                      }}
                    />
                    <Bar
                      dataKey="count"
                      fill="#3b82f6"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-[300px] items-center justify-center text-gray-400">
                  No data available
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data?.recent_activities?.length ? (
                  data.recent_activities.slice(0, 5).map((activity) => (
                    <div key={activity.id} className="flex items-start gap-3">
                      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100">
                        {activity.type === "lead_created" ? (
                          <Users className="h-4 w-4 text-gray-600" />
                        ) : activity.type === "message_sent" ? (
                          <MessageSquare className="h-4 w-4 text-gray-600" />
                        ) : activity.type === "meeting_booked" ? (
                          <CalendarCheck className="h-4 w-4 text-gray-600" />
                        ) : (
                          <Bot className="h-4 w-4 text-gray-600" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-gray-700">
                          {activity.description}
                        </p>
                        <p className="mt-0.5 text-xs text-gray-400">
                          {formatTimeAgo(activity.timestamp)}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-8 text-center text-sm text-gray-400">
                    No recent activity
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Active Conversations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-gray-100">
              {data?.active_conversations?.length ? (
                data.active_conversations.map((conv) => (
                  <div
                    key={conv.id}
                    className="flex items-center justify-between py-3"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar
                        name={conv.lead.name}
                        size="sm"
                      />
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {conv.lead.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {conv.lead.company || conv.lead.email}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge
                        variant={
                          (statusColors[conv.status] as "success" | "warning" | "info" | "danger") || "default"
                        }
                      >
                        {formatStatus(conv.status)}
                      </Badge>
                      <div className="flex items-center gap-1 text-xs text-gray-400">
                        <Clock className="h-3 w-3" />
                        {formatTimeAgo(conv.last_message_at)}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-sm text-gray-400">
                  No active conversations
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
