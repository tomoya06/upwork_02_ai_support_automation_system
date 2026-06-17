"use client";

import { useQuery } from "@tanstack/react-query";
import {
  BarChart2,
  TrendingUp,
  Ticket,
  CheckCircle2,
  AlertTriangle,
  Bot,
  BookOpen,
  Zap,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

interface AnalyticsOverview {
  totalTickets: number;
  openTickets: number;
  resolvedTickets: number;
  escalatedTickets: number;
  resolutionRate: number;
  aiAdoptionRate: number;
  pipelineRuns: number;
  knowledgeDocs: number;
}

interface AnalyticsData {
  overview: AnalyticsOverview;
  recentTickets: { created_at: string; status: string; category: string }[];
  categoryBreakdown: { name: string; value: number }[];
}

async function fetchAnalytics(): Promise<AnalyticsData> {
  const res = await fetch("/api/analytics/overview");
  if (!res.ok) throw new Error("Failed to load analytics");
  return res.json();
}

const CATEGORY_COLORS = [
  "#3b82f6", "#8b5cf6", "#10b981", "#f59e0b", "#ef4444", "#06b6d4",
];

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  color = "text-foreground",
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub?: string;
  color?: string;
}) {
  return (
    <div className="rounded-xl border bg-card p-4 space-y-2">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
          <Icon className={`h-4 w-4 ${color}`} />
        </div>
        <span className="text-sm text-muted-foreground">{label}</span>
      </div>
      <div>
        <span className={`text-2xl font-bold ${color}`}>{value}</span>
        {sub && <span className="text-xs text-muted-foreground ml-1.5">{sub}</span>}
      </div>
    </div>
  );
}

export default function AnalyticsPage() {
  const { data, isLoading, error } = useQuery<AnalyticsData>({
    queryKey: ["analytics-overview"],
    queryFn: fetchAnalytics,
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <BarChart2 className="h-6 w-6" />
          Analytics
        </h1>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-24 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <BarChart2 className="h-6 w-6" />
          Analytics
        </h1>
        <p className="text-muted-foreground text-sm">
          Connect Supabase to see live analytics data.
        </p>
      </div>
    );
  }

  const { overview, categoryBreakdown } = data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <BarChart2 className="h-6 w-6" />
          Analytics
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          AI pipeline performance and ticket resolution metrics.
        </p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard
          icon={Ticket}
          label="Total Tickets"
          value={overview.totalTickets}
          color="text-blue-600"
        />
        <StatCard
          icon={CheckCircle2}
          label="Resolved"
          value={overview.resolvedTickets}
          sub={`${overview.resolutionRate}% rate`}
          color="text-green-600"
        />
        <StatCard
          icon={AlertTriangle}
          label="Escalated"
          value={overview.escalatedTickets}
          color="text-red-500"
        />
        <StatCard
          icon={TrendingUp}
          label="Open"
          value={overview.openTickets}
          color="text-yellow-600"
        />
        <StatCard
          icon={Bot}
          label="AI Analyzed"
          sub={`${overview.aiAdoptionRate}% adoption`}
          value={`${overview.aiAdoptionRate}%`}
          color="text-purple-600"
        />
        <StatCard
          icon={Zap}
          label="Pipeline Runs"
          value={overview.pipelineRuns}
          color="text-primary"
        />
        <StatCard
          icon={BookOpen}
          label="Knowledge Docs"
          value={overview.knowledgeDocs}
          color="text-teal-600"
        />
        <StatCard
          icon={CheckCircle2}
          label="Resolution Rate"
          value={`${overview.resolutionRate}%`}
          color="text-green-600"
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Category breakdown bar chart */}
        <div className="rounded-xl border bg-card p-4">
          <h3 className="text-sm font-semibold mb-4">Tickets by Category</h3>
          {categoryBreakdown.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-sm text-muted-foreground">
              No data yet
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={categoryBreakdown} margin={{ top: 0, right: 8, left: -16, bottom: 0 }}>
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11 }}
                  tickFormatter={(v) => v.slice(0, 6)}
                />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ fontSize: 12 }}
                  formatter={(v) => [`${v} tickets`, "Count"]}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {categoryBreakdown.map((_, i) => (
                    <Cell key={i} fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Resolution rate pie chart */}
        <div className="rounded-xl border bg-card p-4">
          <h3 className="text-sm font-semibold mb-4">Ticket Status Distribution</h3>
          {overview.totalTickets === 0 ? (
            <div className="h-48 flex items-center justify-center text-sm text-muted-foreground">
              No data yet
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <ResponsiveContainer width="60%" height={180}>
                <PieChart>
                  <Pie
                    data={[
                      { name: "Open", value: overview.openTickets },
                      { name: "Resolved", value: overview.resolvedTickets },
                      { name: "Escalated", value: overview.escalatedTickets },
                    ].filter((d) => d.value > 0)}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={75}
                    dataKey="value"
                  >
                    {[0, 1, 2].map((i) => (
                      <Cell
                        key={i}
                        fill={["#3b82f6", "#10b981", "#ef4444"][i]}
                      />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-2 text-xs">
                {[
                  { label: "Open", value: overview.openTickets, color: "#3b82f6" },
                  { label: "Resolved", value: overview.resolvedTickets, color: "#10b981" },
                  { label: "Escalated", value: overview.escalatedTickets, color: "#ef4444" },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-2">
                    <span
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-muted-foreground">{item.label}</span>
                    <span className="ml-auto font-semibold">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* AI adoption section */}
      <div className="rounded-xl border bg-card p-4">
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <Bot className="h-4 w-4 text-primary" />
          AI Pipeline Performance
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">AI Adoption Rate</p>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full bg-purple-500 rounded-full"
                style={{ width: `${overview.aiAdoptionRate}%` }}
              />
            </div>
            <p className="text-xs font-semibold">{overview.aiAdoptionRate}%</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Resolution Rate</p>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full bg-green-500 rounded-full"
                style={{ width: `${overview.resolutionRate}%` }}
              />
            </div>
            <p className="text-xs font-semibold">{overview.resolutionRate}%</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Total Pipeline Runs</p>
            <p className="text-lg font-bold text-primary">{overview.pipelineRuns}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
