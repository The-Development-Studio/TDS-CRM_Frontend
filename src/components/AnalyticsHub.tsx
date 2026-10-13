import React, { useState } from 'react';
import {
  BarChart3,
  Users,
  Download,
  ArrowUpRight
} from 'lucide-react';
import type { Invoice, Lead, Opportunity } from '../types/crm';
import { formatCompactINR, formatINR } from '../utils/currency';

interface AnalyticsHubProps {
  leads: Lead[];
  opportunities: Opportunity[];
  invoices: Invoice[];
}

export const AnalyticsHub: React.FC<AnalyticsHubProps> = ({ leads, opportunities, invoices }) => {
  const [reportPeriod, setReportPeriod] = useState('All Records');
  const today = new Date();
  const periodStart = new Date(today);
  let periodEnd: Date | null = null;
  if (reportPeriod === 'Current Quarter') {
    periodStart.setMonth(Math.floor(today.getMonth() / 3) * 3, 1);
  } else if (reportPeriod === 'Current Year') {
    periodStart.setMonth(0, 1);
  } else if (reportPeriod === 'Previous Year') {
    periodStart.setFullYear(today.getFullYear() - 1, 0, 1);
    periodEnd = new Date(today.getFullYear(), 0, 1);
  }
  const isInPeriod = (value: string) => {
    if (reportPeriod === 'All Records') return true;
    const date = new Date(`${value}T00:00:00`);
    return date >= periodStart && (!periodEnd || date < periodEnd);
  };
  const reportLeads = leads.filter((lead) => isInPeriod(lead.createdDate));
  const reportOpportunities = opportunities.filter((opportunity) => isInPeriod(opportunity.expectedClose));
  const reportInvoices = invoices.filter((invoice) => invoice.status !== 'Voided' && isInPeriod(invoice.issueDate));
  const wonOpportunities = reportOpportunities.filter((opportunity) => opportunity.stage === 'Won');
  const lostOpportunities = reportOpportunities.filter((opportunity) => opportunity.stage === 'Lost');
  const resolvedOpportunities = wonOpportunities.length + lostOpportunities.length;
  const wonRevenue = wonOpportunities.reduce((sum, opportunity) => sum + opportunity.amount, 0);
  const averageDeal = reportOpportunities.length
    ? reportOpportunities.reduce((sum, opportunity) => sum + opportunity.amount, 0) / reportOpportunities.length
    : 0;
  const openPipeline = reportOpportunities.filter((opportunity) => opportunity.stage !== 'Won' && opportunity.stage !== 'Lost');
  const weightedPipeline = Math.round(openPipeline.reduce((sum, opportunity) => sum + opportunity.amount * opportunity.probability / 100, 0));
  const winRate = resolvedOpportunities ? Math.round(wonOpportunities.length / resolvedOpportunities * 100) : 0;
  const invoiced = reportInvoices.reduce((sum, invoice) => sum + invoice.amount, 0);
  const collected = reportInvoices.reduce((sum, invoice) => sum + invoice.paidAmount, 0);

  const sourceColors: Record<Lead['source'], string> = {
    'Meta Ads': '#6366F1', Instagram: '#EC4899', 'Google Ads': '#38BDF8', Website: '#10B981',
    Referral: '#F59E0B', Direct: '#8B5CF6', Other: '#64748B'
  };
  const sourceStats = [...new Set(reportLeads.map((lead) => lead.source))].map((source) => {
    const sourceLeads = reportLeads.filter((lead) => lead.source === source);
    const leadIds = new Set(sourceLeads.map((lead) => lead.id));
    const revenue = wonOpportunities.filter((opportunity) => leadIds.has(opportunity.leadId))
      .reduce((sum, opportunity) => sum + opportunity.amount, 0);
    return { source, color: sourceColors[source], count: sourceLeads.length, revenue };
  });
  const maxSourceRevenue = Math.max(1, ...sourceStats.map((source) => source.revenue));

  const exportReport = () => {
    const rows = [
      ['Metric', 'Value'],
      ['Report period', reportPeriod],
      ['Leads', reportLeads.length],
      ['Opportunities', reportOpportunities.length],
      ['Won revenue (INR)', wonRevenue],
      ['Average opportunity (INR)', Math.round(averageDeal)],
      ['Weighted pipeline (INR)', weightedPipeline],
      ['Win rate', `${winRate}%`],
      ['Invoiced (INR)', invoiced],
      ['Collected (INR)', collected]
    ];
    const csv = rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    link.download = `tds-os-analytics-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  return (
    <div className="space-y-4 sm:space-y-5 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 p-4 sm:p-5 rounded-2xl bg-[#111827]/90 border border-slate-800 shadow-lg">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-extrabold text-white tracking-tight">Executive Intelligence & Analytics</h1>
            <span className="px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              Board-Ready Insights
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Sales Reports, Pipeline Velocity, Conversion Funnels, Outstanding Aging, and Renewal Cohorts
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={reportPeriod}
            onChange={(e) => setReportPeriod(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
          >
            <option>All Records</option>
            <option>Current Quarter</option>
            <option>Current Year</option>
            <option>Previous Year</option>
          </select>
          <button
            type="button"
            onClick={exportReport}
            className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" /> Export CSV
          </button>
        </div>
      </div>

      {/* Analytics Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-[#111827] border border-slate-800">
          <span className="text-[10px] uppercase font-bold text-slate-300">Won Revenue</span>
          <p className="text-2xl font-extrabold text-white font-mono mt-1">{formatINR(wonRevenue)}</p>
          <p className="text-[10px] text-emerald-400 mt-1 flex items-center gap-1 font-semibold">
            <ArrowUpRight className="w-3 h-3" /> {wonOpportunities.length} won opportunities
          </p>
        </div>

        <div className="p-4 rounded-xl bg-[#111827] border border-slate-800">
          <span className="text-[10px] uppercase font-bold text-slate-300">Average Deal Size</span>
          <p className="text-2xl font-extrabold text-white font-mono mt-1">{formatINR(Math.round(averageDeal))}</p>
          <p className="text-[10px] text-emerald-400 mt-1 font-semibold">Across {reportOpportunities.length} opportunities</p>
        </div>

        <div className="p-4 rounded-xl bg-[#111827] border border-slate-800">
          <span className="text-[10px] uppercase font-bold text-slate-300">Weighted Pipeline</span>
          <p className="text-2xl font-extrabold text-white font-mono mt-1">{formatINR(weightedPipeline)}</p>
          <p className="text-[10px] text-cyan-400 mt-1 font-semibold">Across {openPipeline.length} open opportunities</p>
        </div>

        <div className="p-4 rounded-xl bg-[#111827] border border-slate-800">
          <span className="text-[10px] uppercase font-bold text-slate-300">Opportunity Win Rate</span>
          <p className="text-2xl font-extrabold text-white font-mono mt-1">{winRate}%</p>
          <p className="text-[10px] text-emerald-400 mt-1 font-semibold">{resolvedOpportunities} closed opportunities</p>
        </div>
      </div>

      {/* Acquisition Breakdown */}
      <div className="p-5 rounded-2xl bg-[#111827]/80 border border-slate-800">
        <h3 className="text-sm font-bold text-white mb-3">Multi-Channel Inbound ROI Analysis</h3>
        <div className="space-y-3">
          {sourceStats.map((stat) => (
            <div key={stat.source} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-200">{stat.source}</span>
                <span className="font-mono text-cyan-300 font-bold">{formatCompactINR(stat.revenue)} Generated</span>
              </div>
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{
                    backgroundColor: stat.color,
                    width: `${(stat.revenue / maxSourceRevenue) * 100}%`
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
