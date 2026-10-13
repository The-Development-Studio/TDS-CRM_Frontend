import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowUpRight,
  Bell,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Headphones,
  MessageSquareText,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  UserRound,
  Zap
} from 'lucide-react';

type TicketStatus = 'Open' | 'Pending' | 'Resolved' | 'Escalated';
type TicketPriority = 'Critical' | 'High' | 'Medium' | 'Low';

type Ticket = {
  id: string;
  customer: string;
  service: string;
  subject: string;
  status: TicketStatus;
  priority: TicketPriority;
  owner: string;
  updatedAt: string;
  sla: string;
  channel: string;
  sentiment: string;
};

const ticketsSeed: Ticket[] = [
  {
    id: 'TKT-2048',
    customer: 'Nexa Retail',
    service: 'ERP Integration',
    subject: 'Sync failure for daily inventory refresh',
    status: 'Open',
    priority: 'Critical',
    owner: 'Aarav Sharma',
    updatedAt: '12 mins ago',
    sla: '03h 40m',
    channel: 'Email',
    sentiment: 'Escalating to engineering'
  },
  {
    id: 'TKT-2037',
    customer: 'BluePeak Foods',
    service: 'Cloud Monitoring',
    subject: 'Alert storms after deployment',
    status: 'Pending',
    priority: 'High',
    owner: 'Maya Reddy',
    updatedAt: '48 mins ago',
    sla: '06h 10m',
    channel: 'Phone',
    sentiment: 'Waiting on vendor patch'
  },
  {
    id: 'TKT-2026',
    customer: 'Vanta Labs',
    service: 'Help Desk',
    subject: 'User cannot reset MFA on mobile app',
    status: 'Resolved',
    priority: 'Medium',
    owner: 'Rohan Iyer',
    updatedAt: '2 hours ago',
    sla: 'Closed',
    channel: 'Portal',
    sentiment: 'Customer confirmed fix'
  },
  {
    id: 'TKT-2009',
    customer: 'Crestline Logistics',
    service: 'Support Retainer',
    subject: 'Weekly SLA review not attached to email',
    status: 'Escalated',
    priority: 'High',
    owner: 'Nisha Shah',
    updatedAt: '1 hour ago',
    sla: '02h 35m',
    channel: 'WhatsApp',
    sentiment: 'Awaiting leadership review'
  },
  {
    id: 'TKT-1998',
    customer: 'PrimeTrack',
    service: 'Onboarding',
    subject: 'Follow-up for training completion checklist',
    status: 'Open',
    priority: 'Low',
    owner: 'Diksha Pillai',
    updatedAt: '5 hours ago',
    sla: '09h 15m',
    channel: 'Email',
    sentiment: 'Customer engaged'
  }
];

const overviewStats = [
  { label: 'Open Tickets', value: '28', change: '+6%', tone: 'cyan', icon: Headphones },
  { label: 'SLA at Risk', value: '07', change: '-2 from yesterday', tone: 'amber', icon: Clock3 },
  { label: 'Resolved Today', value: '14', change: '+18%', tone: 'green', icon: CheckCircle2 },
  { label: 'Escalations', value: '03', change: '2 high priority', tone: 'rose', icon: AlertTriangle }
] as const;

const issueBreakdown = [
  { label: 'Application Errors', value: 34, color: 'bg-cyan-500' },
  { label: 'Access & Security', value: 27, color: 'bg-violet-500' },
  { label: 'Performance', value: 18, color: 'bg-amber-500' },
  { label: 'Onboarding', value: 15, color: 'bg-emerald-500' },
  { label: 'Billing', value: 6, color: 'bg-slate-500' }
];

const upcomingFollowUps = [
  { time: '10:30 AM', customer: 'BluePeak Foods', task: 'Patch validation call', owner: 'Maya Reddy' },
  { time: '12:00 PM', customer: 'Nexa Retail', task: 'Escalation bridge review', owner: 'Aarav Sharma' },
  { time: '02:15 PM', customer: 'PrimeTrack', task: 'Training feedback follow-up', owner: 'Diksha Pillai' }
];

const priorityPalette: Record<TicketPriority, string> = {
  Critical: 'bg-rose-500/10 text-rose-300 border border-rose-500/20',
  High: 'bg-amber-500/10 text-amber-300 border border-amber-500/20',
  Medium: 'bg-sky-500/10 text-sky-300 border border-sky-500/20',
  Low: 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
};

const statusPalette: Record<TicketStatus, string> = {
  Open: 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/20',
  Pending: 'bg-amber-500/10 text-amber-300 border border-amber-500/20',
  Resolved: 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20',
  Escalated: 'bg-rose-500/10 text-rose-300 border border-rose-500/20'
};

export default function SupportManagement() {
  const [filter, setFilter] = useState<'All' | TicketStatus>('All');

  const filteredTickets = useMemo(() => {
    if (filter === 'All') return ticketsSeed;
    return ticketsSeed.filter((ticket) => ticket.status === filter);
  }, [filter]);

  return (
    <div className="space-y-6 text-slate-900">
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_18px_48px_rgba(15,23,42,0.06)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-[#fff4eb] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[#ff6600]">
              <Sparkles className="h-3.5 w-3.5" />
              Support Operations
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Support Management</h1>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
            >
              <Bell className="h-3.5 w-3.5" />
              Alerts
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-xl bg-[#ff6600] px-3 py-2 text-xs font-semibold text-white shadow-lg shadow-[#ff6600]/25 transition hover:bg-[#e65b00]"
            >
              <Plus className="h-3.5 w-3.5" />
              New Ticket
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {overviewStats.map(({ label, value, change, tone, icon: Icon }) => (
          <div key={label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className={`rounded-xl p-2 ${tone === 'cyan' ? 'bg-cyan-500/10 text-cyan-600' : tone === 'amber' ? 'bg-amber-500/10 text-amber-600' : tone === 'green' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-rose-500/10 text-rose-600'}`}>
                <Icon className="h-4 w-4" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">Live</span>
            </div>

            <div className="mt-4 flex items-end justify-between gap-3">
              <div>
                <p className="text-[11px] font-medium text-slate-500">{label}</p>
                <p className="mt-1 text-2xl font-extrabold text-slate-900">{value}</p>
              </div>
              <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-600">{change}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.6fr_0.9fr]">
        <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 border-b border-slate-200 pb-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Support Queue</h2>
              <p className="text-xs text-slate-500">Track current issues, owner coverage, and SLA exposure</p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {(['All', 'Open', 'Pending', 'Resolved', 'Escalated'] as const).map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setFilter(option)}
                  className={`rounded-full px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] transition ${filter === option ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200">
            <div className="grid grid-cols-[1.2fr_1fr_1fr_1fr_0.8fr] gap-3 bg-slate-50 px-4 py-3 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">
              <span>Customer</span>
              <span>Priority</span>
              <span>Status</span>
              <span>Owner</span>
              <span>SLA</span>
            </div>

            <div className="divide-y divide-slate-200">
              {filteredTickets.map((ticket) => (
                <div key={ticket.id} className="grid grid-cols-[1.2fr_1fr_1fr_1fr_0.8fr] gap-3 px-4 py-3 text-sm text-slate-700 hover:bg-slate-50">
                  <div>
                    <div className="flex items-center gap-2 font-semibold text-slate-900">
                      <span>{ticket.customer}</span>
                    </div>
                    <p className="mt-1 text-[11px] text-slate-500">{ticket.subject}</p>
                    <p className="mt-1 text-[10px] text-slate-400">{ticket.id} · {ticket.service}</p>
                  </div>

                  <div>
                    <span className={`inline-flex rounded-full px-2 py-1 text-[10px] font-semibold ${priorityPalette[ticket.priority]}`}>
                      {ticket.priority}
                    </span>
                  </div>

                  <div>
                    <span className={`inline-flex rounded-full px-2 py-1 text-[10px] font-semibold ${statusPalette[ticket.status]}`}>
                      {ticket.status}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-[11px]">
                    <UserRound className="h-3.5 w-3.5 text-slate-400" />
                    {ticket.owner}
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-slate-800">{ticket.sla}</span>
                    <ChevronRight className="h-4 w-4 text-slate-400" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <aside className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">SLA Health</p>
                <h3 className="mt-2 text-xl font-extrabold text-slate-900">92.4%</h3>
              </div>
              <div className="rounded-2xl bg-emerald-500/10 p-2 text-emerald-600">
                <TrendingUp className="h-5 w-5" />
              </div>
            </div>

            <div className="mt-5 space-y-3">
              {issueBreakdown.map((item) => (
                <div key={item.label}>
                  <div className="mb-1 flex items-center justify-between text-[11px] text-slate-600">
                    <span>{item.label}</span>
                    <span className="font-semibold text-slate-900">{item.value}%</span>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                    <div className={`h-full rounded-full ${item.color}`} style={{ width: `${item.value}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">Upcoming</p>
                <h3 className="mt-2 text-lg font-bold text-slate-900">Follow-up queue</h3>
              </div>
              <CalendarClock className="h-4 w-4 text-slate-500" />
            </div>

            <div className="mt-4 space-y-3">
              {upcomingFollowUps.map((item) => (
                <div key={item.time} className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                  <div className="flex items-center justify-between gap-2 text-[10px] font-bold uppercase tracking-[0.10em] text-slate-500">
                    <span>{item.time}</span>
                    <span className="rounded-full bg-white px-2 py-1 text-[9px] text-slate-600">{item.owner}</span>
                  </div>
                  <p className="mt-2 text-sm font-semibold text-slate-900">{item.customer}</p>
                  <p className="mt-1 text-[11px] text-slate-500">{item.task}</p>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">Operations</p>
              <h3 className="mt-2 text-lg font-bold text-slate-900">Customer sentiment</h3>
            </div>
            <ShieldCheck className="h-5 w-5 text-emerald-600" />
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl bg-cyan-50 p-3">
              <p className="text-[10px] uppercase tracking-[0.12em] text-cyan-700">Positive</p>
              <p className="mt-2 text-2xl font-extrabold text-cyan-900">61%</p>
            </div>
            <div className="rounded-2xl bg-amber-50 p-3">
              <p className="text-[10px] uppercase tracking-[0.12em] text-amber-700">Neutral</p>
              <p className="mt-2 text-2xl font-extrabold text-amber-900">24%</p>
            </div>
            <div className="rounded-2xl bg-rose-50 p-3">
              <p className="text-[10px] uppercase tracking-[0.12em] text-rose-700">At risk</p>
              <p className="mt-2 text-2xl font-extrabold text-rose-900">15%</p>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">Team Activity</p>
              <h3 className="mt-2 text-lg font-bold text-slate-900">Support insights</h3>
            </div>
            <MessageSquareText className="h-5 w-5 text-violet-600" />
          </div>

          <div className="mt-4 space-y-3">
            {[
              'Response time improved by 21% over the last 7 days.',
              'Engineering backlog is stable despite the latest API release.',
              'Three customer accounts are eligible for proactive renewal outreach.'
            ].map((item) => (
              <div key={item} className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <span className="mt-1 flex h-6 w-6 items-center justify-center rounded-full bg-violet-500/10 text-violet-600">
                  <Zap className="h-3.5 w-3.5" />
                </span>
                <p className="text-sm text-slate-600">{item}</p>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">Search</p>
            <h3 className="mt-2 text-lg font-bold text-slate-900">Find by account or issue</h3>
          </div>

          <label className="relative block w-full max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search tickets, services, or customers"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm text-slate-700 placeholder:text-slate-400 focus:border-slate-300 focus:outline-none"
            />
          </label>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">
          <span className="rounded-full bg-slate-100 px-2.5 py-1.5">Email</span>
          <span className="rounded-full bg-slate-100 px-2.5 py-1.5">Portal</span>
          <span className="rounded-full bg-slate-100 px-2.5 py-1.5">Phone</span>
          <span className="rounded-full bg-slate-100 px-2.5 py-1.5">WhatsApp</span>
          <span className="rounded-full bg-slate-100 px-2.5 py-1.5">Escalations</span>
          <span className="inline-flex items-center gap-1 rounded-full bg-[#fff4eb] px-2.5 py-1.5 text-[#ff6600]">
            3 high-risk tickets
            <ArrowUpRight className="h-3.5 w-3.5" />
          </span>
        </div>
      </div>
    </div>
  );
}
