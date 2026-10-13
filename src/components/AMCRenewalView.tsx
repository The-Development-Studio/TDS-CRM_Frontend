import React, { useState } from 'react';
import {
  RefreshCw,
  Search,
  Filter,
  Plus,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Building,
  ShieldCheck,
  Download,
  ExternalLink,
  ChevronRight,
  Pencil,
  Ban
} from 'lucide-react';
import type { AMCRenewal } from '../types/crm';
import { formatINR } from '../utils/currency';

interface AMCRenewalViewProps {
  amcRenewals: AMCRenewal[];
  onOpenNewContract: () => void;
  onRenewContract: (contractId: string) => void;
  onEditContract: (contract: AMCRenewal) => void;
  onCancelContract: (contract: AMCRenewal) => void;
}

export const AMCRenewalView: React.FC<AMCRenewalViewProps> = ({
  amcRenewals,
  onOpenNewContract,
  onRenewContract,
  onEditContract,
  onCancelContract
}) => {
  const [filterDays, setFilterDays] = useState<'All' | '7 Days' | '15 Days' | '30 Days' | '60 Days'>('All');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredContracts = amcRenewals.filter((c) => {
    const matchesSearch =
      c.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.contractNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.service.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDays = filterDays === 'All' || c.urgency === filterDays;
    return matchesSearch && matchesDays;
  });

  const totalARR = amcRenewals.reduce((s, c) => s + c.annualValue, 0);
  const expiringWithin30Days = amcRenewals
    .filter((c) => c.daysRemaining <= 30)
    .reduce((s, c) => s + c.annualValue, 0);

  return (
    <div className="space-y-4 sm:space-y-5 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 p-4 sm:p-5 rounded-2xl bg-[#111827]/90 border border-slate-800 shadow-lg">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-extrabold text-white tracking-tight">
              AMC (Annual Maintenance Contracts) & Renewal Forecast
            </h1>
            <span className="px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30">
              Recurring ARR Engine
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Track multi-year SLA commitments, automated renewal alerts, milestone billing, and contract extensions
          </p>
        </div>

        <button
          onClick={onOpenNewContract}
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 text-white text-xs font-semibold shadow-md shadow-teal-600/30 transition flex items-center gap-1.5 cursor-pointer active:scale-95"
        >
          <Plus className="w-4 h-4" /> New AMC Contract
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-[#111827] border border-slate-800">
          <span className="text-[10px] uppercase font-bold text-teal-400">Total Active Maintenance ARR</span>
          <p className="text-2xl font-extrabold text-white font-mono mt-1">{formatINR(totalARR)}/yr</p>
          <span className="text-[10px] text-slate-300">Across 4 active enterprise SLA pods</span>
        </div>

        <div className="p-4 rounded-xl bg-[#111827] border border-slate-800">
          <span className="text-[10px] uppercase font-bold text-amber-400">Expiring in Next 30 Days</span>
          <p className="text-2xl font-extrabold text-amber-400 font-mono mt-1">{formatINR(expiringWithin30Days)}</p>
          <span className="text-[10px] text-slate-300">3 contracts up for commercial sign-off</span>
        </div>

        <div className="p-4 rounded-xl bg-[#111827] border border-slate-800">
          <span className="text-[10px] uppercase font-bold text-emerald-400">Historical Renewal Retention</span>
          <p className="text-2xl font-extrabold text-emerald-400 font-mono mt-1">94.2%</p>
          <span className="text-[10px] text-slate-300">Top-quartile IT service retention</span>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-[#111827]/70 border border-slate-800 text-xs">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search AMC by contract # or company..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-900 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-teal-500"
          />
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-slate-400 text-[11px] font-semibold mr-1">Urgency Window:</span>
          {(['All', '7 Days', '15 Days', '30 Days', '60 Days'] as const).map((urg) => (
            <button
              key={urg}
              onClick={() => setFilterDays(urg)}
              className={`px-3 py-1 rounded-lg font-medium transition cursor-pointer ${
                filterDays === urg
                  ? 'bg-teal-600 text-white font-semibold'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {urg}
            </button>
          ))}
        </div>
      </div>

      {/* Contracts Table */}
      <div className="rounded-2xl bg-[#111827]/80 border border-slate-800 shadow-md overflow-hidden">
        <div className="overflow-x-auto">
        <table className="min-w-[980px] w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-900/90 border-b border-slate-800 text-[10px] uppercase font-bold text-slate-300 tracking-wider">
              <th className="py-3 px-4">Contract #</th>
              <th className="py-3 px-4">Customer Account</th>
              <th className="py-3 px-4">Service & SLA Tier</th>
              <th className="py-3 px-4 text-right">Annual Value (ARR)</th>
              <th className="py-3 px-4">Expiry Date</th>
              <th className="py-3 px-4">Urgency Badge</th>
              <th className="py-3 px-4">Contract Status</th>
              <th className="py-3 px-4">Account Lead</th>
              <th className="py-3 px-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-medium">
            {filteredContracts.map((c) => (
              <tr key={c.id} className="hover:bg-slate-800/40 transition">
                <td className="py-3 px-4 font-mono font-bold text-teal-400">{c.contractNo}</td>
                <td className="py-3 px-4 font-bold text-white">{c.customer}</td>
                <td className="py-3 px-4 text-slate-300 max-w-[200px] truncate" title={c.service}>
                  {c.service}
                </td>
                <td className="py-3 px-4 text-right font-mono font-extrabold text-emerald-400">
                  {formatINR(c.annualValue)}
                </td>
                <td className="py-3 px-4 font-mono text-slate-300">{c.expiryDate}</td>
                <td className="py-3 px-4">
                  <span
                    className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold ${
                      c.daysRemaining <= 7
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse'
                        : c.daysRemaining <= 15
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        : 'bg-teal-500/20 text-teal-300 border border-teal-500/40'
                    }`}
                  >
                    {c.daysRemaining} Days Left
                  </span>
                </td>
                <td className="py-3 px-4">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-800 border border-slate-700 text-slate-200">
                    {c.status}
                  </span>
                </td>
                <td className="py-3 px-4 text-slate-300">{c.owner}</td>
                <td className="py-3 px-4 text-center">
                  <div className="flex items-center justify-center gap-1">
                    {c.status !== 'Cancelled' && (
                      <button type="button" onClick={() => onRenewContract(c.id)} className="px-2.5 py-1 rounded-lg bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 border border-teal-500/30 font-semibold cursor-pointer transition text-[11px]">
                        Renew
                      </button>
                    )}
                    <button type="button" onClick={() => onEditContract(c)} title="Edit contract" aria-label={`Edit contract ${c.contractNo}`} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-[#ff6600]">
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    {c.status !== 'Cancelled' && (
                      <button type="button" onClick={() => onCancelContract(c)} title="Cancel contract" aria-label={`Cancel contract ${c.contractNo}`} className="rounded-lg p-1.5 text-slate-500 hover:bg-rose-50 hover:text-rose-600">
                        <Ban className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );
};
