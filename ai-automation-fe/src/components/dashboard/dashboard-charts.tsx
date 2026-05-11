"use client";

import { useEffect, useState } from "react";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import { tenantService, TenantStats } from "@/lib/services/tenant.service";
import { TrendingUp, Users, Share2, Bot } from "lucide-react";

const COLORS = ["#3b82f6", "#8b5cf6", "#f59e0b", "#10b981", "#ef4444", "#ec4899"];

const CHANNEL_LABELS: Record<string, string> = {
  FACEBOOK: "Facebook",
  ZALO: "Zalo",
  UNKNOWN: "Khác",
};

function formatDateLabel(value: unknown) {
  const d = new Date(String(value));
  return `${d.getDate()}/${d.getMonth() + 1}`;
}



function ChartSkeleton() {
  return (
    <div className="h-[220px] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
    </div>
  );
}

function EmptyChart({ message }: { message: string }) {
  return (
    <div className="h-[220px] flex flex-col items-center justify-center text-slate-400 gap-2">
      <TrendingUp className="w-8 h-8 opacity-40" />
      <p className="text-sm">{message}</p>
    </div>
  );
}

interface DashboardChartsProps {
  tenantId: string;
}

export function DashboardCharts({ tenantId }: DashboardChartsProps) {
  const [stats, setStats] = useState<TenantStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tenantId) return;
    tenantService
      .getStats(tenantId, 30)
      .then(setStats)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [tenantId]);

  const hasConversations = stats?.dailyConversations.some((d) => d.count > 0);
  const hasCustomers = stats?.dailyCustomers.some((d) => d.count > 0);
  const hasChannels = stats?.channelDistribution && stats.channelDistribution.length > 0;
  const hasBots = stats?.botPerformance && stats.botPerformance.length > 0;


  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Chart 1: Hội thoại theo ngày — span 2 cols */}
      <div className="lg:col-span-2 bg-white dark:bg-slate-950 rounded-2xl border border-slate-200/60 dark:border-slate-800 p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-blue-500" />
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Hội thoại 30 ngày qua</h3>
        </div>
        {loading ? (
          <ChartSkeleton />
        ) : !hasConversations ? (
          <EmptyChart message="Chưa có hội thoại nào" />
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={stats!.dailyConversations} margin={{ left: 10, right: 10 }}>
              <defs>
                <linearGradient id="convGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="dark:opacity-20" />
              <XAxis dataKey="date" tickFormatter={formatDateLabel} tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} interval={2} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} width={30} />
              <Tooltip
                contentStyle={{ background: "#0f172a", border: "none", borderRadius: 12, fontSize: 13, color: "#e2e8f0" }}
                labelFormatter={formatDateLabel}
                formatter={(value: unknown) => [`${value} hội thoại`, ""]}
              />
              <Area type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} fill="url(#convGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Chart 2: Phân bổ kênh — 1 col */}
      <div className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-200/60 dark:border-slate-800 p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Share2 className="w-5 h-5 text-indigo-500" />
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Phân bổ theo kênh</h3>
        </div>
        {loading ? (
          <ChartSkeleton />
        ) : !hasChannels ? (
          <EmptyChart message="Chưa có dữ liệu kênh" />
        ) : (
          <div className="flex flex-col items-center">
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie
                  data={stats!.channelDistribution}
                  dataKey="count"
                  nameKey="channel"
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={65}
                  paddingAngle={3}
                  strokeWidth={0}
                >
                  {stats!.channelDistribution.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: "#0f172a", border: "none", borderRadius: 12, fontSize: 13, color: "#e2e8f0" }}
                  formatter={(value: unknown, name: unknown) => [`${value}`, CHANNEL_LABELS[String(name)] || String(name)]}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap gap-3 mt-2 justify-center">
              {stats!.channelDistribution.map((item, i) => (
                <div key={item.channel} className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                  {CHANNEL_LABELS[item.channel] || item.channel} ({item.count})
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Chart 3: Khách hàng mới — span 2 cols */}
      <div className="lg:col-span-2 bg-white dark:bg-slate-950 rounded-2xl border border-slate-200/60 dark:border-slate-800 p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-5 h-5 text-green-500" />
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Khách hàng mới 30 ngày qua</h3>
        </div>
        {loading ? (
          <ChartSkeleton />
        ) : !hasCustomers ? (
          <EmptyChart message="Chưa có khách hàng mới" />
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={stats!.dailyCustomers} margin={{ left: 10, right: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} className="dark:opacity-20" />
              <XAxis dataKey="date" tickFormatter={formatDateLabel} tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} interval={2} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} width={30} />
              <Tooltip
                contentStyle={{ background: "#0f172a", border: "none", borderRadius: 12, fontSize: 13, color: "#e2e8f0" }}
                labelFormatter={formatDateLabel}
                formatter={(value: unknown) => [`${value} khách`, ""]}
              />
              <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={24} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Chart 4: Hiệu suất Bot — 1 col */}
      <div className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-200/60 dark:border-slate-800 p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Bot className="w-5 h-5 text-purple-500" />
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Hiệu suất Bot</h3>
        </div>
        {loading ? (
          <ChartSkeleton />
        ) : !hasBots ? (
          <EmptyChart message="Chưa có dữ liệu bot" />
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={stats!.botPerformance} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} className="dark:opacity-20" />
              <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <YAxis
                type="category"
                dataKey="botName"
                tick={{ fontSize: 11, fill: "#94a3b8" }}
                axisLine={false}
                tickLine={false}
                width={100}
              />
              <Tooltip
                contentStyle={{ background: "#0f172a", border: "none", borderRadius: 12, fontSize: 13, color: "#e2e8f0" }}
                formatter={(value: unknown) => [`${value} hội thoại`, ""]}
              />
              <Bar dataKey="count" fill="#8b5cf6" radius={[0, 4, 4, 0]} maxBarSize={20} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
