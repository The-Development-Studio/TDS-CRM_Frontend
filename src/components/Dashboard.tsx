import React, { useState } from 'react';
import {
  Users,
  Briefcase,
  TrendingUp,
  DollarSign,
  Clock,
  Award,
  AlertTriangle,
  Receipt,
  RefreshCw,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  Phone,
  MessageSquare,
  Calendar,
  Building,
  CheckCircle2,
  ExternalLink,
  Filter
} from 'lucide-react';
import type {
  Lead,
  Customer,
  Activity,
  Opportunity,
  Invoice,
  AMCRenewal
} from '../types/crm';
import { PIPELINE_STAGES } from '../data/pipeline';
import { formatCompactINR, formatINR } from '../utils/currency';

interface DashboardProps {
  leads: Lead[];
  customers: Customer[];
  activities: Activity[];
  opportunities: Opportunity[];
  invoices: Invoice[];
  amcRenewals: AMCRenewal[];
  onSelectLead: (leadId: string) => void;
  onNavigate: (view: string) => void;
  onQuickAction: (action: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  leads,
  customers,
  activities,
  opportunities,
  invoices,
  amcRenewals,
  onSelectLead,
  onNavigate,
  onQuickAction
}) => {
  const [followUpFilter, setFollowUpFilter] = useState<'All' | 'Today' | 'Overdue' | 'Tomorrow' | 'This Week'>('Today');
  const [amcFilter, setAmcFilter] = useState<'All' | '7 Days' | '15 Days' | '30 Days' | '60 Days'>('All');

  // KPI Calculations
  const totalLeads = leads.length;
  const openOpportunities = opportunities.filter((o) => o.stage !== 'Won' && o.stage !== 'Lost');
  const wonDeals = opportunities.filter((o) => o.stage === 'Won');
  const lostDeals = opportunities.filter((o) => o.stage === 'Lost');
  const pipelineValue = openOpportunities.reduce((sum, opp) => sum + opp.amount, 0);
  const expectedRevenue = Math.round(
    openOpportunities.reduce((sum, opp) => sum + (opp.amount * opp.probability) / 100, 0)
  );
  const currentDate = new Date().toISOString().slice(0, 10);
  const followUpsDue = activities.filter((activity) => activity.status !== 'Completed' && activity.date <= currentDate).length;
  const wonDealsValue = wonDeals.reduce((sum, opportunity) => sum + opportunity.amount, 0);
  const lostDealsValue = lostDeals.reduce((sum, opportunity) => sum + opportunity.amount, 0);
  const outstandingPayments = invoices
    .filter((inv) => inv.status !== 'Voided')
    .reduce((sum, inv) => sum + Math.max(0, inv.amount - inv.paidAmount), 0);
  const activeAMCValue = amcRenewals.filter((amc) => amc.status !== 'Cancelled')
    .reduce((sum, amc) => sum + amc.annualValue, 0);
  const renewalsDue = amcRenewals.filter((amc) => amc.daysRemaining <= 30 && amc.status !== 'Cancelled');
  const renewalsDueCount = renewalsDue.length;
  const renewalExposure = renewalsDue.reduce((sum, contract) => sum + contract.annualValue, 0);

  const kpis = [
    {
      title: 'Total Leads',
      value: totalLeads.toString(),
      trend: 'Current',
      isPositive: true,
        comparison: `${leads.filter((lead) => lead.createdDate >= `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-01`).length} added this month`,
      icon: Users,
      color: 'text-indigo-400',
      bgColor: 'bg-indigo-500/10 border-indigo-500/20',
      view: 'leads'
    },
    {
      title: 'Open Opportunities',
      value: openOpportunities.length.toString(),
      trend: 'Open',
      isPositive: true,
      comparison: 'in active evaluation',
      icon: Briefcase,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10 border-purple-500/20',
      view: 'pipeline'
    },
    {
      title: 'Pipeline Value',
      value: formatCompactINR(pipelineValue),
      trend: 'Weighted forecast',
      isPositive: true,
      comparison: `weighted: ${formatCompactINR(expectedRevenue)}`,
      icon: TrendingUp,
      color: 'text-cyan-400',
      bgColor: 'bg-cyan-500/10 border-cyan-500/20',
      view: 'pipeline'
    },
    {
      title: 'Expected Revenue',
      value: formatCompactINR(expectedRevenue),
      trend: 'Weighted by probability',
      isPositive: true,
      comparison: 'probability calculated',
      icon: DollarSign,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10 border-emerald-500/20',
      view: 'analytics'
    },
    {
      title: 'Follow-ups Due',
      value: followUpsDue.toString(),
      trend: `${activities.filter((activity) => activity.status !== 'Completed' && activity.date < currentDate).length} overdue`,
      isPositive: false,
      comparison: 'requires immediate contact',
      icon: Clock,
      color: 'text-amber-400',
      bgColor: 'bg-amber-500/10 border-amber-500/20',
      view: 'activities'
    },
    {
      title: 'Won Deals (Q3)',
      value: `${wonDeals.length} (${formatCompactINR(wonDealsValue)})`,
      trend: 'Closed won',
      isPositive: true,
        comparison: `${opportunities.length ? Math.round((wonDeals.length / opportunities.length) * 100) : 0}% of recorded deals`,
      icon: Award,
      color: 'text-green-400',
      bgColor: 'bg-green-500/10 border-green-500/20',
      view: 'pipeline'
    },
    {
      title: 'Lost Deals',
      value: `${lostDeals.length} (${formatCompactINR(lostDealsValue)})`,
      trend: 'Closed lost',
      isPositive: false,
      comparison: 'Recorded lost opportunities',
      icon: AlertTriangle,
      color: 'text-rose-400',
      bgColor: 'bg-rose-500/10 border-rose-500/20',
      view: 'pipeline'
    },
    {
      title: 'Outstanding Recv.',
      value: formatCompactINR(outstandingPayments),
      trend: `${invoices.filter((invoice) => invoice.status === 'Overdue').length} overdue`,
      isPositive: false,
      comparison: 'across 3 active clients',
      icon: Receipt,
      color: 'text-orange-400',
      bgColor: 'bg-orange-500/10 border-orange-500/20',
      view: 'invoices'
    },
    {
      title: 'Active AMC Value',
      value: `${formatCompactINR(activeAMCValue)}/yr`,
      trend: `${amcRenewals.filter((amc) => amc.status !== 'Cancelled').length} contracts`,
      isPositive: true,
      comparison: 'recurring SLA base',
      icon: RefreshCw,
      color: 'text-teal-400',
      bgColor: 'bg-teal-500/10 border-teal-500/20',
      view: 'amc'
    },
    {
      title: 'Renewals Due ≤30d',
      value: renewalsDueCount.toString(),
      trend: `${formatCompactINR(renewalExposure)} exposed`,
      isPositive: false,
      comparison: 'next 30 calendar days',
      icon: Clock,
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-500/10 border-yellow-500/20',
      view: 'amc'
    }
  ];

  const stageLeadStatuses: Partial<Record<string, Lead['status'][]>> = {
    New: ['New'],
    Contacted: ['Contacted', 'Assigned'],
    'Requirement Collected': ['Requirement Collected'],
    Qualified: ['Qualified']
  };

  // Pipeline metrics use CRM records only. Lead/opportunity stages remain separate where no exact mapping exists.
  const stageStats = PIPELINE_STAGES.map((st) => {
    const leadStatuses = stageLeadStatuses[st.id];
    const matchingLeads = leadStatuses ? leads.filter((lead) => leadStatuses.includes(lead.status)) : [];
    const matchingOpportunities = opportunities.filter((opportunity) => opportunity.stage === st.id);
    const count = matchingLeads.length + matchingOpportunities.length;
    const value = matchingLeads.reduce((sum, lead) => sum + lead.estimatedBudget, 0) +
      matchingOpportunities.reduce((sum, opportunity) => sum + opportunity.amount, 0);
    return { ...st, count, value };
  });

  const sourceColors: Record<Lead['source'], string> = {
    'Meta Ads': '#6366F1', Instagram: '#EC4899', 'Google Ads': '#38BDF8', Website: '#10B981',
    Referral: '#F59E0B', Direct: '#8B5CF6', Other: '#64748B'
  };
  const sources = [...new Set(leads.map((lead) => lead.source))];
  const leadSourceStats = sources.map((source) => {
    const sourceLeads = leads.filter((lead) => lead.source === source);
    const qualifiedLeads = sourceLeads.filter((lead) =>
      ['Qualified', 'Opportunity Created', 'Won', 'Converted'].includes(lead.status)
    );
    const sourceLeadIds = new Set(sourceLeads.map((lead) => lead.id));
    const revenue = wonDeals.filter((opportunity) => sourceLeadIds.has(opportunity.leadId))
      .reduce((sum, opportunity) => sum + opportunity.amount, 0);
    return {
      source,
      color: sourceColors[source],
      count: sourceLeads.length,
      qualified: qualifiedLeads.length,
      conversionRate: sourceLeads.length ? `${Math.round((qualifiedLeads.length / sourceLeads.length) * 100)}%` : '0%',
      revenue
    };
  });

  const monthlyBilling = (() => {
    const latestInvoiceDate = invoices.map((invoice) => invoice.issueDate).sort().at(-1);
    const anchor = latestInvoiceDate ? new Date(`${latestInvoiceDate.slice(0, 7)}-01T00:00:00`) : new Date();
    const months = Array.from({ length: 6 }, (_, index) => {
      const date = new Date(anchor.getFullYear(), anchor.getMonth() - 5 + index, 1);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthInvoices = invoices.filter((invoice) => invoice.issueDate.startsWith(key) && invoice.status !== 'Voided');
      return {
        month: new Intl.DateTimeFormat('en-IN', { month: 'short', year: '2-digit' }).format(date),
        invoiced: monthInvoices.reduce((sum, invoice) => sum + invoice.amount, 0),
        received: monthInvoices.reduce((sum, invoice) => sum + invoice.paidAmount, 0),
        outstanding: monthInvoices.reduce((sum, invoice) => sum + Math.max(0, invoice.amount - invoice.paidAmount), 0)
      };
    });
    return months;
  })();
  const monthlyBillingMax = Math.max(1, ...monthlyBilling.flatMap((item) => [item.invoiced, item.received, item.outstanding]));
  const totalInvoiced = invoices.filter((invoice) => invoice.status !== 'Voided').reduce((sum, invoice) => sum + invoice.amount, 0);
  const totalReceived = invoices.filter((invoice) => invoice.status !== 'Voided').reduce((sum, invoice) => sum + invoice.paidAmount, 0);

  // Filtered follow ups
  const filteredActivities = activities.filter((act) => {
    if (followUpFilter === 'All') return true;
    return act.category === followUpFilter;
  });

  // Filtered AMC
  const filteredAMC = amcRenewals.filter((item) => {
    if (amcFilter === 'All') return true;
    return item.urgency === amcFilter;
  });

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Top Banner / Executive Summary Greeting */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4 p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800/80 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-full bg-gradient-to-l from-indigo-500/10 to-transparent pointer-events-none" />
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 px-2.5 py-0.5 rounded-full border border-indigo-500/20">
              Executive IT Command Center
            </span>
            <span className="text-xs text-slate-300 font-mono">Weighted pipeline forecast: {formatINR(expectedRevenue)}</span>
          </div>
          <h1 className="text-xl md:text-2xl font-extrabold text-white mt-1.5 tracking-tight">
            Enterprise Performance Overview
          </h1>
          <p className="text-xs text-slate-300 max-w-2xl mt-1">
            Tracking end-to-end customer lifecycle from initial lead capture through proposal approval, tax invoicing, and AMC recurring maintenance renewals.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start md:self-auto">
          <button
            onClick={() => onQuickAction('lead')}
            className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 transition flex items-center gap-1.5 cursor-pointer"
          >
            <Users className="w-3.5 h-3.5" />
            + New Lead
          </button>
          <button
            onClick={() => onNavigate('pipeline')}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition flex items-center gap-1.5 cursor-pointer"
          >
            <TrendingUp className="w-3.5 h-3.5 text-cyan-400" />
            Pipeline Board
          </button>
        </div>
      </div>

      {/* Top 10 KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-3.5">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div
              key={idx}
              onClick={() => onNavigate(kpi.view)}
              className="p-4 rounded-xl bg-[#111827]/90 border border-slate-800 hover:border-slate-700 hover:shadow-lg transition cursor-pointer group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-slate-400 group-hover:text-slate-200 transition truncate">
                    {kpi.title}
                  </span>
                  <div className={`p-1.5 rounded-lg ${kpi.bgColor}`}>
                    <Icon className={`w-3.5 h-3.5 ${kpi.color}`} />
                  </div>
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-lg md:text-xl font-extrabold text-white tracking-tight">
                    {kpi.value}
                  </span>
                </div>
              </div>

              <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[10px]">
                <span
                  className={`font-semibold flex items-center gap-0.5 ${
                    kpi.isPositive ? 'text-emerald-400' : 'text-amber-400'
                  }`}
                >
                  {kpi.isPositive ? (
                    <ArrowUpRight className="w-3 h-3" />
                  ) : (
                    <ArrowDownRight className="w-3 h-3" />
                  )}
                  {kpi.trend}
                </span>
                <span className="text-slate-400 truncate max-w-[90px]">{kpi.comparison}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Sales Pipeline Stage Overview (Kanban / Funnel Metrics) */}
      <div className="p-4 sm:p-5 rounded-2xl bg-[#111827]/80 border border-slate-800 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800/80 gap-2">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-cyan-400" />
              Full Lifecycle Sales Pipeline Stages
            </h3>
            <p className="text-xs text-slate-400">
              Active deal count & aggregate deal value across all qualifying milestones
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-slate-300">
              Total Qualified: <strong className="text-white">{formatCompactINR(pipelineValue)}</strong>
            </span>
            <button
              onClick={() => onNavigate('pipeline')}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1 cursor-pointer"
            >
              Open Interactive Board <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Stages strip */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-9 gap-2.5 mt-4">
          {stageStats.map((st) => (
            <div
              key={st.id}
              onClick={() => onNavigate('pipeline')}
              className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition cursor-pointer flex flex-col justify-between"
            >
              <div className="flex items-center justify-between gap-1 mb-2">
                <span className="text-[11px] font-semibold text-slate-300 truncate" title={st.name}>
                  {st.name}
                </span>
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: st.color }} />
              </div>

              <div>
                <div className="text-base font-extrabold text-white">
                  {st.count} <span className="text-[10px] text-slate-400 font-normal">deals</span>
                </div>
                <div className="text-xs font-mono font-semibold text-cyan-300 mt-0.5">
                  {formatCompactINR(st.value)}
                </div>
              </div>

              {/* Progress visual bar */}
              <div className="w-full h-1 bg-slate-800 rounded-full mt-2.5 overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{
                    backgroundColor: st.color,
                    width: `${Math.min(100, Math.max(15, (st.value / 400000) * 100))}%`
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Middle Row: Revenue Overview & Follow-up Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Overview (2 Cols) */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-[#111827]/80 border border-slate-800 shadow-md flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800/80 gap-3">
            <div>
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-white">IT Services Monthly Revenue Flow</h3>
              </div>
              <p className="text-xs text-slate-400">
                Invoice and payment totals grouped by recorded invoice month
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs font-mono">
              <span className="flex items-center gap-1.5 text-slate-300">
                <span className="w-2.5 h-2.5 rounded-sm bg-indigo-500" /> Invoiced
              </span>
              <span className="flex items-center gap-1.5 text-slate-300">
                <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" /> Received
              </span>
              <span className="flex items-center gap-1.5 text-slate-300">
                <span className="w-2.5 h-2.5 rounded-sm bg-amber-500" /> Outstanding
              </span>
            </div>
          </div>

          {/* Bar Chart Representation for Monthly Billing Performance */}
          <div className="overflow-x-auto pt-6 pb-2">
            <div className="grid min-w-[560px] grid-cols-6 gap-3 items-end h-48 px-2 border-b border-slate-800">
              {monthlyBilling.map((item) => (
                <div key={item.month} className="flex flex-col items-center h-full justify-end group">
                  <div className="w-full max-w-[48px] flex items-end justify-center gap-1.5 h-full">
                    {/* Invoiced Bar */}
                    <div
                        style={{ height: `${(item.invoiced / monthlyBillingMax) * 100}%` }}
                      className="w-1/3 bg-indigo-500/80 rounded-t-sm hover:bg-indigo-400 transition relative group/bar"
                    >
                      <div className="opacity-0 group-hover/bar:opacity-100 absolute -top-7 left-1/2 -translate-x-1/2 bg-slate-900 border border-slate-700 px-1.5 py-0.5 rounded text-[10px] text-white font-mono pointer-events-none whitespace-nowrap z-20">
                        Inv: {formatINR(item.invoiced)}
                      </div>
                    </div>
                    {/* Received Bar */}
                    <div
                      style={{ height: `${(item.received / monthlyBillingMax) * 100}%` }}
                      className="w-1/3 bg-emerald-500/80 rounded-t-sm hover:bg-emerald-400 transition relative group/bar"
                    >
                      <div className="opacity-0 group-hover/bar:opacity-100 absolute -top-7 left-1/2 -translate-x-1/2 bg-slate-900 border border-slate-700 px-1.5 py-0.5 rounded text-[10px] text-white font-mono pointer-events-none whitespace-nowrap z-20">
                        Rec: {formatINR(item.received)}
                      </div>
                    </div>
                    {/* Outstanding Bar */}
                    <div
                      style={{ height: `${(item.outstanding / monthlyBillingMax) * 100}%` }}
                      className="w-1/3 bg-amber-500/80 rounded-t-sm hover:bg-amber-400 transition relative group/bar"
                    >
                      <div className="opacity-0 group-hover/bar:opacity-100 absolute -top-7 left-1/2 -translate-x-1/2 bg-slate-900 border border-slate-700 px-1.5 py-0.5 rounded text-[10px] text-white font-mono pointer-events-none whitespace-nowrap z-20">
                        Out: {formatINR(item.outstanding)}
                      </div>
                    </div>
                  </div>
                  <span className="text-[11px] font-medium text-slate-400 mt-2">{item.month}</span>
                </div>
              ))}
            </div>

            {/* Bottom summary metrics row */}
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {[
                {
                  label: 'Total Invoiced',
                  value: formatINR(totalInvoiced),
                  icon: Receipt,
                  accent: 'bg-[#ff5c00]',
                  iconStyle: 'bg-orange-50 text-[#ff5c00]'
                },
                {
                  label: 'Total Collected',
                  value: formatINR(totalReceived),
                  icon: CheckCircle2,
                  accent: 'bg-emerald-500',
                  iconStyle: 'bg-emerald-50 text-emerald-600'
                },
                {
                  label: 'Total Outstanding',
                  value: formatINR(outstandingPayments),
                  icon: AlertTriangle,
                  accent: 'bg-amber-400',
                  iconStyle: 'bg-amber-50 text-amber-600'
                },
                {
                  label: 'Weighted Forecast',
                  value: formatINR(expectedRevenue),
                  icon: TrendingUp,
                  accent: 'bg-slate-900',
                  iconStyle: 'bg-slate-100 text-slate-700'
                }
              ].map((metric) => {
                const MetricIcon = metric.icon;
                return (
                  <div
                    key={metric.label}
                    className="relative overflow-hidden rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm transition hover:-translate-y-0.5 hover:border-orange-200 hover:shadow-md"
                  >
                    <span className={`absolute inset-x-0 top-0 h-0.5 ${metric.accent}`} />
                    <div className="flex items-center gap-2.5">
                      <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${metric.iconStyle}`}>
                        <MetricIcon className="h-4 w-4" />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-[10px] font-bold uppercase tracking-wide text-slate-500">{metric.label}</p>
                        <p className="mt-0.5 truncate font-mono text-base font-extrabold text-slate-900">{metric.value}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Follow-up Activities Panel (1 Col) */}
        <div className="p-5 rounded-2xl bg-[#111827]/80 border border-slate-800 shadow-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-bold text-white">Follow-up Activities</h3>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-semibold font-mono">
                {activities.length} Total
              </span>
            </div>

            {/* Category tabs */}
            <div className="flex items-center gap-1 mt-3 bg-slate-900 p-1 rounded-xl border border-slate-800 text-[11px]">
              {(['Today', 'Overdue', 'Tomorrow', 'This Week', 'All'] as const).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setFollowUpFilter(cat)}
                  className={`flex-1 py-1 rounded-lg font-medium transition cursor-pointer text-center ${
                    followUpFilter === cat
                      ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Activity Items List */}
            <div className="mt-3.5 space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
              {filteredActivities.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-300">
                  No activities in this category
                </div>
              ) : (
                filteredActivities.map((act) => (
                  <div
                    key={act.id}
                    onClick={() => act.leadId && onSelectLead(act.leadId)}
                    className="p-3 rounded-xl bg-slate-900/80 border border-slate-800/80 hover:border-indigo-500/50 hover:bg-slate-800/50 transition cursor-pointer"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-bold uppercase ${
                            act.type === 'Call'
                              ? 'bg-blue-500/20 text-blue-300'
                              : act.type === 'Meeting'
                              ? 'bg-purple-500/20 text-purple-300'
                              : act.type === 'WhatsApp'
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : 'bg-amber-500/20 text-amber-300'
                          }`}
                        >
                          {act.type}
                        </span>
                        <span className="text-xs font-semibold text-white truncate max-w-[140px]">
                          {act.leadName}
                        </span>
                      </div>
                      <span
                        className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-semibold ${
                          act.priority === 'High'
                            ? 'bg-rose-500/20 text-rose-300'
                            : 'bg-slate-700 text-slate-300'
                        }`}
                      >
                        {act.priority}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-300 font-medium mt-1 truncate">
                      {act.title}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">
                      {act.company} • Rep: {act.user}
                    </p>

                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800 text-[10px]">
                      <span className="text-amber-400 font-mono font-medium flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {act.time} ({act.date})
                      </span>
                      <span className="text-indigo-400 hover:underline flex items-center gap-0.5">
                        Lead 360° <ChevronRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <button
            onClick={() => onNavigate('activities')}
            className="w-full mt-3 py-2 text-center text-xs font-semibold text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 rounded-xl border border-slate-800 transition cursor-pointer"
          >
            View All Sales Schedule →
          </button>
        </div>
      </div>

      {/* Bottom Row: Lead Source Performance & AMC Renewal Widget */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lead Source Performance */}
        <div className="p-5 rounded-2xl bg-[#111827]/80 border border-slate-800 shadow-md">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800/80">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-400" />
                Lead Source Acquisition & Conversion ROI
              </h3>
              <p className="text-xs text-slate-400">
                Counts and won-opportunity revenue grouped by the source recorded on each lead
              </p>
            </div>
            <button
              onClick={() => onNavigate('leads')}
              className="text-xs text-indigo-400 hover:underline font-medium"
            >
              Filter Leads
            </button>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-[10px] uppercase font-bold text-slate-300">
                  <th className="pb-2.5">Source Channel</th>
                  <th className="pb-2.5 text-center">Total Inquiries</th>
                  <th className="pb-2.5 text-center">Qualified</th>
                  <th className="pb-2.5 text-center">Conv. Rate</th>
                  <th className="pb-2.5 text-right">Revenue Generated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {leadSourceStats.map((src) => (
                  <tr key={src.source} className="hover:bg-slate-800/40 transition">
                    <td className="py-2.5 flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: src.color }} />
                      <span className="font-semibold text-slate-200">{src.source}</span>
                    </td>
                    <td className="py-2.5 text-center font-mono text-slate-300">{src.count}</td>
                    <td className="py-2.5 text-center font-mono text-emerald-400">{src.qualified}</td>
                    <td className="py-2.5 text-center">
                      <span className="px-2 py-0.5 rounded-full bg-slate-800 text-[10px] font-mono text-cyan-300 border border-slate-700">
                        {src.conversionRate}
                      </span>
                    </td>
                    <td className="py-2.5 text-right font-mono font-bold text-white">
                      {formatCompactINR(src.revenue)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* AMC Renewal Widget */}
        <div className="p-5 rounded-2xl bg-[#111827]/80 border border-slate-800 shadow-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-800/80">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 text-teal-400" />
                  Annual Maintenance Contracts (AMC) Expiry Alert
                </h3>
                <p className="text-xs text-slate-400">
                  Expiring SLAs & recurring service contracts requiring commercial renewal
                </p>
              </div>
              <span className="text-[10px] px-2.5 py-1 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30 font-semibold font-mono">
                Total: {formatCompactINR(activeAMCValue)} ARR
              </span>
            </div>

            {/* Quick Filter urgency tabs */}
            <div className="flex items-center gap-1.5 mt-3 text-xs">
              {(['All', '7 Days', '15 Days', '30 Days', '60 Days'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setAmcFilter(filter)}
                  className={`px-3 py-1 rounded-lg font-medium transition cursor-pointer ${
                    amcFilter === filter
                      ? 'bg-teal-600 text-white font-semibold'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>

            {/* Contract cards */}
            <div className="mt-3.5 space-y-2.5">
              {filteredAMC.map((amc) => (
                <div
                  key={amc.id}
                  className="p-3 rounded-xl bg-slate-900/90 border border-slate-800/80 hover:border-teal-500/40 transition flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white">{amc.customer}</span>
                      <span className="text-[10px] font-mono text-slate-300">{amc.contractNo}</span>
                      <span
                        className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-bold ${
                          amc.daysRemaining <= 7
                            ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                            : amc.daysRemaining <= 15
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            : 'bg-teal-500/20 text-teal-300 border border-teal-500/30'
                        }`}
                      >
                        Expires in {amc.daysRemaining} Days
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5 truncate">{amc.service}</p>
                    <p className="text-[10px] text-slate-300 mt-0.5">
                      Account Manager: {amc.owner} • Status: <span className="text-slate-300">{amc.status}</span>
                    </p>
                  </div>

                  <div className="text-right">
                    <div className="font-mono font-extrabold text-sm text-emerald-400">
                      {formatINR(amc.annualValue)}/yr
                    </div>
                    <button
                      onClick={() => onQuickAction('proposal')}
                      className="mt-1.5 px-2.5 py-1 rounded-lg bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 text-[10px] font-semibold border border-teal-500/30 transition cursor-pointer"
                    >
                      Send Renewal SOW
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-400 text-[11px]">Automatic Renewal Notices: Enabled (30-day trigger)</span>
            <button
              onClick={() => onNavigate('amc')}
              className="text-teal-400 hover:underline font-semibold"
            >
              AMC Ledger & Maintenance SLAs →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
