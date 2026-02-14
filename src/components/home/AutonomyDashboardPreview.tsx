import React from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import {
  Activity,
  Shield,
  Brain,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Zap,
  TrendingUp,
  Users,
  DollarSign,
  Scale,
  Settings2,
  ShoppingCart,
  Eye,
} from "lucide-react";

/* ── Static mock data (no DB) ── */
const departments = [
  { id: "marketing", icon: TrendingUp, status: "active", agents: 8, tasks: 24 },
  { id: "sales", icon: ShoppingCart, status: "active", agents: 5, tasks: 12 },
  { id: "finance", icon: DollarSign, status: "active", agents: 4, tasks: 9 },
  { id: "legal", icon: Scale, status: "monitoring", agents: 3, tasks: 4 },
  { id: "hr", icon: Users, status: "active", agents: 3, tasks: 7 },
  { id: "operations", icon: Settings2, status: "active", agents: 6, tasks: 18 },
];

const pendingApprovals = [
  { id: 1, type: "budget", dept: "Marketing", amount: "$2,400", risk: "medium", time: "2m" },
  { id: 2, type: "content", dept: "Marketing", amount: "3 posts", risk: "low", time: "5m" },
  { id: 3, type: "contract", dept: "Legal", amount: "NDA v3", risk: "high", time: "12m" },
];

const guardrailAlerts = [
  { id: 1, level: "warning", message: "guardrail1", dept: "Marketing", value: "87%" },
  { id: 2, level: "info", message: "guardrail2", dept: "Finance", value: "$1.2K" },
  { id: 3, level: "success", message: "guardrail3", dept: "Legal", value: "100%" },
];

const executionLogs = [
  { id: 1, agent: "Content Strategist", action: "log1", status: "success", time: "09:42" },
  { id: 2, agent: "Lead Scorer", action: "log2", status: "success", time: "09:38" },
  { id: 3, agent: "Cashflow Monitor", action: "log3", status: "success", time: "09:35" },
  { id: 4, agent: "Compliance Monitor", action: "log4", status: "warning", time: "09:31" },
  { id: 5, agent: "Process Optimizer", action: "log5", status: "success", time: "09:28" },
];

const capabilities = [
  { id: 1, name: "cap1", status: "active", score: 94 },
  { id: 2, name: "cap2", status: "active", score: 87 },
  { id: 3, name: "cap3", status: "trial", score: 72 },
  { id: 4, name: "cap4", status: "active", score: 91 },
];

/* ── Helpers ── */
const StatusDot = ({ status }: { status: string }) => {
  const colors: Record<string, string> = {
    active: "bg-emerald-400",
    monitoring: "bg-amber-400",
    inactive: "bg-zinc-500",
  };
  return (
    <span className="relative flex h-2 w-2">
      <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${colors[status] || colors.active}`} />
      <span className={`relative inline-flex rounded-full h-2 w-2 ${colors[status] || colors.active}`} />
    </span>
  );
};

const RiskBadge = ({ risk }: { risk: string }) => {
  const styles: Record<string, string> = {
    low: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    medium: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    high: "bg-red-500/20 text-red-400 border-red-500/30",
  };
  return (
    <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${styles[risk]}`}>
      {risk.toUpperCase()}
    </span>
  );
};

const AlertIcon = ({ level }: { level: string }) => {
  if (level === "warning") return <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />;
  if (level === "success") return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />;
  return <Activity className="w-3.5 h-3.5 text-blue-400" />;
};

const MiniBar = ({ value, max = 100 }: { value: number; max?: number }) => (
  <div className="w-full h-1.5 bg-zinc-700 rounded-full overflow-hidden">
    <div
      className="h-full rounded-full bg-gradient-to-r from-blue-500 to-emerald-400 transition-all"
      style={{ width: `${(value / max) * 100}%` }}
    />
  </div>
);

const AutonomyDashboardPreview = () => {
  const { t } = useTranslation("landing");

  return (
    <section className="py-24 bg-background relative overflow-hidden scroll-mt-24">
      <div className="container mx-auto px-6 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center max-w-4xl mx-auto mb-14"
        >
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4 font-mono">
            <Eye className="w-4 h-4" />
            {t("dashboardPreview.badge")}
          </span>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-heading font-bold mb-6">
            {t("dashboardPreview.title")}
          </h2>
          <p className="text-xl text-muted-foreground leading-relaxed">
            {t("dashboardPreview.subtitle")}
          </p>
        </motion.div>

        {/* Dashboard container — dark mode */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="max-w-7xl mx-auto rounded-2xl border border-zinc-700/60 bg-zinc-950 shadow-2xl shadow-black/40 overflow-hidden"
        >
          {/* Top bar */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-zinc-800 bg-zinc-900/80">
            <div className="flex items-center gap-3">
              <div className="flex gap-1.5">
                <span className="w-3 h-3 rounded-full bg-red-500/80" />
                <span className="w-3 h-3 rounded-full bg-amber-500/80" />
                <span className="w-3 h-3 rounded-full bg-emerald-500/80" />
              </div>
              <span className="text-zinc-400 text-xs font-mono ml-2">
                {t("dashboardPreview.topbar")}
              </span>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-emerald-400 text-xs font-mono">
                <StatusDot status="active" />
                {t("dashboardPreview.status")}
              </div>
              <span className="text-zinc-500 text-xs font-mono">14:32 UTC</span>
            </div>
          </div>

          {/* Dashboard grid */}
          <div className="p-4 md:p-6 grid grid-cols-1 md:grid-cols-12 gap-4">
            {/* ── Left: IQ + Departments ── */}
            <div className="md:col-span-3 space-y-4">
              {/* IQ Score */}
              <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Brain className="w-4 h-4 text-blue-400" />
                  <span className="text-zinc-400 text-xs font-mono uppercase tracking-wider">
                    {t("dashboardPreview.iq.label")}
                  </span>
                </div>
                <div className="text-5xl font-heading font-bold text-white mb-1">147</div>
                <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-mono">
                  <TrendingUp className="w-3 h-3" />
                  +12 {t("dashboardPreview.iq.period")}
                </div>
                <div className="mt-3">
                  <MiniBar value={74} />
                  <span className="text-zinc-500 text-[10px] font-mono mt-1 block">
                    {t("dashboardPreview.iq.nextLevel")}
                  </span>
                </div>
              </div>

              {/* Active Departments */}
              <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Activity className="w-4 h-4 text-blue-400" />
                  <span className="text-zinc-400 text-xs font-mono uppercase tracking-wider">
                    {t("dashboardPreview.departments.label")}
                  </span>
                </div>
                <div className="space-y-2.5">
                  {departments.map((dept) => (
                    <div key={dept.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <StatusDot status={dept.status} />
                        <dept.icon className="w-3.5 h-3.5 text-zinc-400" />
                        <span className="text-zinc-300 text-xs">
                          {t(`dashboardPreview.departments.items.${dept.id}`)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-zinc-500 text-[10px] font-mono">{dept.agents}A</span>
                        <span className="text-zinc-600 text-[10px]">|</span>
                        <span className="text-zinc-500 text-[10px] font-mono">{dept.tasks}T</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ── Center: Logs + Guardrails ── */}
            <div className="md:col-span-5 space-y-4">
              {/* Execution Logs */}
              <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-400" />
                    <span className="text-zinc-400 text-xs font-mono uppercase tracking-wider">
                      {t("dashboardPreview.logs.label")}
                    </span>
                  </div>
                  <span className="text-emerald-400 text-[10px] font-mono bg-emerald-500/10 px-2 py-0.5 rounded-full">
                    142 {t("dashboardPreview.logs.today")}
                  </span>
                </div>
                <div className="space-y-1.5">
                  {executionLogs.map((log) => (
                    <div
                      key={log.id}
                      className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-zinc-800/50 transition-colors"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        {log.status === "success" ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        ) : (
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        )}
                        <div className="min-w-0">
                          <span className="text-zinc-300 text-xs block truncate">{log.agent}</span>
                          <span className="text-zinc-500 text-[10px] font-mono block truncate">
                            {t(`dashboardPreview.logs.items.${log.action}`)}
                          </span>
                        </div>
                      </div>
                      <span className="text-zinc-600 text-[10px] font-mono shrink-0 ml-2">{log.time}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Budget Guardrails */}
              <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Shield className="w-4 h-4 text-blue-400" />
                  <span className="text-zinc-400 text-xs font-mono uppercase tracking-wider">
                    {t("dashboardPreview.guardrails.label")}
                  </span>
                </div>
                <div className="space-y-2">
                  {guardrailAlerts.map((alert) => (
                    <div
                      key={alert.id}
                      className="flex items-center justify-between py-2 px-3 rounded-lg bg-zinc-800/40 border border-zinc-800"
                    >
                      <div className="flex items-center gap-2.5">
                        <AlertIcon level={alert.level} />
                        <div>
                          <span className="text-zinc-300 text-xs block">
                            {t(`dashboardPreview.guardrails.items.${alert.message}`)}
                          </span>
                          <span className="text-zinc-500 text-[10px] font-mono">{alert.dept}</span>
                        </div>
                      </div>
                      <span className="text-zinc-400 text-xs font-mono">{alert.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ── Right: Approvals + Capabilities ── */}
            <div className="md:col-span-4 space-y-4">
              {/* Pending Approvals */}
              <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-400" />
                    <span className="text-zinc-400 text-xs font-mono uppercase tracking-wider">
                      {t("dashboardPreview.approvals.label")}
                    </span>
                  </div>
                  <span className="bg-amber-500/20 text-amber-400 text-[10px] font-mono px-2 py-0.5 rounded-full border border-amber-500/30">
                    3 {t("dashboardPreview.approvals.pending")}
                  </span>
                </div>
                <div className="space-y-2">
                  {pendingApprovals.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between py-2.5 px-3 rounded-lg bg-zinc-800/40 border border-zinc-800"
                    >
                      <div>
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-zinc-300 text-xs font-medium">{item.dept}</span>
                          <RiskBadge risk={item.risk} />
                        </div>
                        <span className="text-zinc-500 text-[10px] font-mono">{item.amount} · {item.time} ago</span>
                      </div>
                      <div className="flex gap-1.5">
                        <button className="px-2 py-1 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-mono border border-emerald-500/30 hover:bg-emerald-500/30 transition-colors">
                          ✓
                        </button>
                        <button className="px-2 py-1 rounded bg-zinc-700/50 text-zinc-400 text-[10px] font-mono border border-zinc-600/30 hover:bg-zinc-700 transition-colors">
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Active Capabilities */}
              <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-violet-400" />
                    <span className="text-zinc-400 text-xs font-mono uppercase tracking-wider">
                      {t("dashboardPreview.capabilities.label")}
                    </span>
                  </div>
                  <span className="text-violet-400 text-[10px] font-mono bg-violet-500/10 px-2 py-0.5 rounded-full">
                    {capabilities.length} {t("dashboardPreview.capabilities.active")}
                  </span>
                </div>
                <div className="space-y-2.5">
                  {capabilities.map((cap) => (
                    <div key={cap.id}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                            cap.status === "trial"
                              ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                              : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                          }`}>
                            {cap.status === "trial" ? "TRIAL" : "LIVE"}
                          </span>
                          <span className="text-zinc-300 text-xs">
                            {t(`dashboardPreview.capabilities.items.${cap.name}`)}
                          </span>
                        </div>
                        <span className="text-zinc-400 text-xs font-mono">{cap.score}%</span>
                      </div>
                      <MiniBar value={cap.score} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Bottom status bar */}
          <div className="flex items-center justify-between px-5 py-2.5 border-t border-zinc-800 bg-zinc-900/60">
            <div className="flex items-center gap-4">
              <span className="text-zinc-500 text-[10px] font-mono">
                {t("dashboardPreview.footer.cycle")} #1,247
              </span>
              <span className="text-zinc-600 text-[10px]">|</span>
              <span className="text-zinc-500 text-[10px] font-mono">
                29 {t("dashboardPreview.footer.agents")}
              </span>
              <span className="text-zinc-600 text-[10px]">|</span>
              <span className="text-zinc-500 text-[10px] font-mono">
                348 {t("dashboardPreview.footer.credits")}
              </span>
            </div>
            <span className="text-emerald-500/60 text-[10px] font-mono">
              {t("dashboardPreview.footer.nextCycle")} 00:04:32
            </span>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default AutonomyDashboardPreview;
