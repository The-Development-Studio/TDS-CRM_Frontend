import { useEffect, useMemo, useState } from "react";
import {
  Activity as ActivityIcon,
  BarChart3,
  CheckCircle2,
  Clock3,
  Target,
  TrendingUp,
  UserRound,
  UsersRound
} from "lucide-react";
import type { StaffUser } from "./StaffLogin";
import type { Activity, Lead, Opportunity } from "../types/crm";
import { formatCompactINR } from "../utils/currency";

interface SalesReportsProps {
  activities: Activity[];
  leads: Lead[];
  opportunities: Opportunity[];
  currentUser: StaffUser;
  onSelectLead: (leadId: string) => void;
}

type ReportTab = "mine" | "team" | "kpi";
type Period = "7" | "30" | "90" | "all";

const periodLabel: Record<Period, string> = {
  "7": "Last 7 days",
  "30": "Last 30 days",
  "90": "Last 90 days",
  all: "All time"
};

const sameOwner = (left: string | undefined, right: string) =>
  (left ?? "").trim().toLocaleLowerCase() === right.trim().toLocaleLowerCase();

const periodStart = (period: Period) => {
  if (period === "all") return "";
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - Number(period) + 1);
  return date.toISOString().slice(0, 10);
};

const inPeriod = (date: string, start: string) => !start || date >= start;

export default function SalesReports({ activities, leads, opportunities, currentUser, onSelectLead }: SalesReportsProps) {
  const [tab, setTab] = useState<ReportTab>("mine");
  const [period, setPeriod] = useState<Period>("30");
  const [staff, setStaff] = useState<StaffUser[]>([currentUser]);
  const [teamError, setTeamError] = useState("");

  useEffect(() => {
    if (currentUser.role !== "manager") return;
    fetch("/api/staff-auth/users", { credentials: "include" })
      .then(async (response) => {
        const result = await response.json().catch(() => ({})) as { data?: StaffUser[]; error?: string };
        if (!response.ok || !result.data) throw new Error(result.error || `Could not load team (${response.status})`);
        setStaff(result.data);
      })
      .catch((reason: unknown) => setTeamError(reason instanceof Error ? reason.message : "Could not load team."));
  }, [currentUser]);

  const start = periodStart(period);
  const directReports = useMemo(() => staff.filter((user) =>
    user.active && user.role === "user" && user.reportingManagerId === currentUser.id
  ), [currentUser.id, staff]);
  const teamMembers = useMemo(() => currentUser.role === "manager" ? directReports : [currentUser], [currentUser, directReports]);
  const teamNames = useMemo(() => new Set(teamMembers.map((user) => user.name.trim().toLocaleLowerCase())), [teamMembers]);

  const myActivities = useMemo(() => activities.filter((activity) =>
    sameOwner(activity.user, currentUser.name) && inPeriod(activity.date, start)
  ), [activities, currentUser.name, start]);
  const teamActivities = useMemo(() => activities.filter((activity) =>
    teamNames.has(activity.user.trim().toLocaleLowerCase()) && inPeriod(activity.date, start)
  ), [activities, start, teamNames]);

  const selectedActivities = tab === "mine" ? myActivities : teamActivities;
  const completed = selectedActivities.filter((activity) => activity.status === "Completed").length;
  const overdue = selectedActivities.filter((activity) =>
    activity.status !== "Completed" && activity.date < new Date().toISOString().slice(0, 10)
  ).length;
  const completionRate = selectedActivities.length ? Math.round((completed / selectedActivities.length) * 100) : 0;

  const memberKpis = teamMembers.map((member) => {
    const memberLeads = leads.filter((lead) => sameOwner(lead.leadOwner, member.name) && inPeriod(lead.createdDate, start));
    const memberActivities = activities.filter((activity) => sameOwner(activity.user, member.name) && inPeriod(activity.date, start));
    const memberOpportunities = opportunities.filter((opportunity) => sameOwner(opportunity.owner, member.name));
    const converted = memberLeads.filter((lead) => ["Won", "Converted"].includes(lead.status)).length;
    const completedActivities = memberActivities.filter((activity) => activity.status === "Completed").length;
    return {
      ...member,
      leads: memberLeads.length,
      converted,
      conversionRate: memberLeads.length ? Math.round((converted / memberLeads.length) * 100) : 0,
      activities: memberActivities.length,
      completedActivities,
      activityRate: memberActivities.length ? Math.round((completedActivities / memberActivities.length) * 100) : 0,
      pipeline: memberOpportunities.filter((opportunity) => !["Won", "Lost"].includes(opportunity.stage))
        .reduce((sum, opportunity) => sum + opportunity.amount, 0)
    };
  });

  const totals = memberKpis.reduce((result, member) => ({
    leads: result.leads + member.leads,
    converted: result.converted + member.converted,
    activities: result.activities + member.activities,
    completedActivities: result.completedActivities + member.completedActivities,
    pipeline: result.pipeline + member.pipeline
  }), { leads: 0, converted: 0, activities: 0, completedActivities: 0, pipeline: 0 });

  const tabs: Array<{ id: ReportTab; label: string; icon: typeof UserRound; managerOnly?: boolean }> = [
    { id: "mine", label: "My Activity", icon: UserRound },
    { id: "team", label: "Team Activity", icon: UsersRound, managerOnly: true },
    { id: "kpi", label: "Team KPI Tracking", icon: BarChart3, managerOnly: true }
  ];

  return <div className="mx-auto max-w-7xl space-y-4 sm:space-y-5">
    <header className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-3">
          <span className="rounded-xl bg-orange-50 p-2.5 text-[#ff6600]"><BarChart3 className="h-5 w-5" /></span>
          <div>
            <h1 className="text-lg font-extrabold text-slate-900 sm:text-xl">Sales Reports</h1>
            <p className="mt-1 text-xs text-slate-500">Review personal activity, team execution, and sales performance.</p>
          </div>
        </div>
        <label className="text-xs font-semibold text-slate-600">Reporting period
          <select value={period} onChange={(event) => setPeriod(event.target.value as Period)} className="ml-2 h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-700">
            {Object.entries(periodLabel).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </label>
      </div>
      <nav aria-label="Sales report sections" className="mt-5 flex gap-1 overflow-x-auto border-b border-slate-200">
        {tabs.filter((item) => !item.managerOnly || currentUser.role === "manager").map((item) => {
          const Icon = item.icon;
          return <button key={item.id} type="button" onClick={() => setTab(item.id)} className={`inline-flex shrink-0 items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-bold ${tab === item.id ? "border-[#ff6600] text-[#e65c00]" : "border-transparent text-slate-500 hover:text-slate-800"}`}>
            <Icon className="h-4 w-4" /> {item.label}
          </button>;
        })}
      </nav>
    </header>

    {teamError && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-700">{teamError}</p>}

    {tab !== "kpi" && <>
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <ReportMetric icon={<ActivityIcon className="h-4 w-4" />} label="Total activities" value={selectedActivities.length.toString()} accent="text-indigo-700" />
        <ReportMetric icon={<CheckCircle2 className="h-4 w-4" />} label="Completed" value={completed.toString()} accent="text-emerald-700" />
        <ReportMetric icon={<Clock3 className="h-4 w-4" />} label="Overdue" value={overdue.toString()} accent="text-rose-700" />
        <ReportMetric icon={<Target className="h-4 w-4" />} label="Completion rate" value={`${completionRate}%`} accent="text-orange-700" />
      </section>
      <ActivityReportTable activities={selectedActivities} onSelectLead={onSelectLead} emptyMessage={tab === "mine" ? "No activity recorded for you in this period." : directReports.length ? "No team activity recorded in this period." : "No users currently report to you."} />
    </>}

    {tab === "kpi" && <>
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <ReportMetric icon={<UsersRound className="h-4 w-4" />} label="Team members" value={teamMembers.length.toString()} accent="text-indigo-700" />
        <ReportMetric icon={<TrendingUp className="h-4 w-4" />} label="New leads" value={totals.leads.toString()} accent="text-orange-700" />
        <ReportMetric icon={<Target className="h-4 w-4" />} label="Lead conversion" value={`${totals.leads ? Math.round((totals.converted / totals.leads) * 100) : 0}%`} accent="text-emerald-700" />
        <ReportMetric icon={<BarChart3 className="h-4 w-4" />} label="Open pipeline" value={formatCompactINR(totals.pipeline)} accent="text-violet-700" />
      </section>
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-4 py-4 sm:px-5">
          <h2 className="text-sm font-bold text-slate-900">Team KPI performance</h2>
          <p className="mt-1 text-xs text-slate-500">Lead and activity KPIs for {periodLabel[period].toLocaleLowerCase()}.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-left text-xs">
            <thead><tr className="border-b border-slate-200 bg-slate-50 text-[10px] font-bold uppercase tracking-wide text-slate-500"><th className="px-4 py-3">Team member</th><th className="px-4 py-3 text-right">Leads</th><th className="px-4 py-3 text-right">Converted</th><th className="px-4 py-3 text-right">Conversion</th><th className="px-4 py-3 text-right">Activities</th><th className="px-4 py-3 text-right">Completion</th><th className="px-4 py-3 text-right">Open pipeline</th></tr></thead>
            <tbody className="divide-y divide-slate-100">
              {memberKpis.map((member) => <tr key={member.id} className="hover:bg-slate-50">
                <td className="px-4 py-3"><p className="font-semibold text-slate-800">{member.name}</p><p className="mt-0.5 text-[11px] text-slate-500">{member.jobTitle || member.email}</p></td>
                <td className="px-4 py-3 text-right font-semibold text-slate-700">{member.leads}</td>
                <td className="px-4 py-3 text-right text-slate-600">{member.converted}</td>
                <td className="px-4 py-3 text-right"><RateBadge value={member.conversionRate} /></td>
                <td className="px-4 py-3 text-right text-slate-600">{member.completedActivities}/{member.activities}</td>
                <td className="px-4 py-3 text-right"><RateBadge value={member.activityRate} /></td>
                <td className="px-4 py-3 text-right font-semibold text-slate-800">{formatCompactINR(member.pipeline)}</td>
              </tr>)}
              {!memberKpis.length && <tr><td colSpan={7} className="px-4 py-14 text-center text-sm text-slate-500">No users currently report to you.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </>}
  </div>;
}

function ActivityReportTable({ activities, onSelectLead, emptyMessage }: { activities: Activity[]; onSelectLead: (leadId: string) => void; emptyMessage: string }) {
  const sorted = [...activities].sort((left, right) => `${right.date} ${right.time}`.localeCompare(`${left.date} ${left.time}`));
  return <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
    <div className="border-b border-slate-200 px-4 py-4 sm:px-5"><h2 className="text-sm font-bold text-slate-900">Activity report</h2><p className="mt-1 text-xs text-slate-500">{sorted.length} recorded activities</p></div>
    <div className="overflow-x-auto">
      <table className="w-full min-w-[760px] text-left text-xs">
        <thead><tr className="border-b border-slate-200 bg-slate-50 text-[10px] font-bold uppercase tracking-wide text-slate-500"><th className="px-4 py-3">Activity</th><th className="px-4 py-3">Lead / company</th><th className="px-4 py-3">Owner</th><th className="px-4 py-3">Date</th><th className="px-4 py-3">Status</th></tr></thead>
        <tbody className="divide-y divide-slate-100">
          {sorted.map((activity) => <tr key={activity.id} className="hover:bg-slate-50">
            <td className="max-w-sm px-4 py-3"><p className="font-semibold text-slate-800">{activity.title}</p><p className="mt-1 line-clamp-1 text-[11px] text-slate-500">{activity.type} · {activity.description || "No notes"}</p></td>
            <td className="px-4 py-3">{activity.leadId ? <button type="button" onClick={() => onSelectLead(activity.leadId!)} className="font-semibold text-slate-700 hover:text-[#ff6600]">{activity.company || activity.leadName}</button> : <span className="text-slate-500">{activity.company || "General activity"}</span>}</td>
            <td className="px-4 py-3 text-slate-600">{activity.user}</td>
            <td className="whitespace-nowrap px-4 py-3"><p className="font-mono text-slate-700">{activity.date}</p><p className="mt-0.5 text-[11px] text-slate-500">{activity.time}</p></td>
            <td className="px-4 py-3"><span className={`rounded-full px-2 py-1 text-[10px] font-semibold ${activity.status === "Completed" ? "bg-emerald-50 text-emerald-700" : "bg-orange-50 text-orange-700"}`}>{activity.status}</span></td>
          </tr>)}
          {!sorted.length && <tr><td colSpan={5} className="px-4 py-14 text-center text-sm text-slate-500">{emptyMessage}</td></tr>}
        </tbody>
      </table>
    </div>
  </section>;
}

function ReportMetric({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: string; accent: string }) {
  return <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"><div className={`flex items-center gap-2 ${accent}`}>{icon}<span className="text-[10px] font-bold uppercase tracking-wide">{label}</span></div><p className={`mt-2 text-xl font-extrabold ${accent}`}>{value}</p></div>;
}

function RateBadge({ value }: { value: number }) {
  const classes = value >= 75 ? "bg-emerald-50 text-emerald-700" : value >= 40 ? "bg-orange-50 text-orange-700" : "bg-slate-100 text-slate-600";
  return <span className={`rounded-full px-2 py-1 text-[10px] font-bold ${classes}`}>{value}%</span>;
}
