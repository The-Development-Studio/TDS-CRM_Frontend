import React, { useState } from 'react';
import {
  Users,
  Search,
  Filter,
  Plus,
  ArrowUpDown,
  Download,
  Share2,
  MoreHorizontal,
  Phone,
  MessageSquare,
  Mail,
  Calendar,
  Building,
  CheckCircle2,
  Clock,
  Sparkles,
  ChevronRight,
  ExternalLink,
  SlidersHorizontal,
  UserCheck,
  Pencil,
  Trash2,
  Upload
} from 'lucide-react';
import type { Lead, StaffAssignee } from '../types/crm';
import { formatINR } from '../utils/currency';
import { LeadImportModal } from './LeadImportModal';

interface LeadListProps {
  leads: Lead[];
  onSelectLead: (leadId: string) => void;
  onOpenNewLeadModal: () => void;
  onUpdateLeadStatus: (leadId: string, status: Lead['status']) => void;
  onBulkAssign: (leadIds: string[], owner: string) => void;
  onEditLead: (lead: Lead) => void;
  onDeleteLead: (lead: Lead) => void;
  assignees: StaffAssignee[];
  onOpenWhatsApp: (lead: Lead) => void;
  onImportLeads: (leads: Lead[]) => { imported: number; skipped: number };
}

export const LeadList: React.FC<LeadListProps> = ({
  leads,
  onSelectLead,
  onOpenNewLeadModal,
  onUpdateLeadStatus,
  onBulkAssign,
  onEditLead,
  onDeleteLead,
  assignees,
  onOpenWhatsApp,
  onImportLeads
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [sourceFilter, setSourceFilter] = useState<string>('All');
  const [priorityFilter, setPriorityFilter] = useState<string>('All');
  const [ownerFilter, setOwnerFilter] = useState<string>('All');
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
  const [bulkAssignOwner, setBulkAssignOwner] = useState('');
  const [bulkActionOpen, setBulkActionOpen] = useState(false);
  const [showFilterDrawer, setShowFilterDrawer] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const ownerOptions = Array.from(new Set([
    ...assignees.map((assignee) => assignee.name),
    ...leads.map((lead) => lead.leadOwner).filter(Boolean)
  ])).sort((first, second) => first.localeCompare(second));
  const activeFilterCount = [statusFilter, sourceFilter, priorityFilter, ownerFilter].filter((value) => value !== 'All').length;

  // Filter leads
  const filteredLeads = leads.filter((lead) => {
    const matchesSearch =
      lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.interestedService.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'All' || lead.status === statusFilter;
    const matchesSource = sourceFilter === 'All' || lead.source === sourceFilter;
    const matchesPriority = priorityFilter === 'All' || lead.priority === priorityFilter;
    const matchesOwner = ownerFilter === 'All'
      || (ownerFilter === 'Unassigned' ? !lead.leadOwner.trim() : lead.leadOwner === ownerFilter);

    return matchesSearch && matchesStatus && matchesSource && matchesPriority && matchesOwner;
  });

  const toggleSelectAll = () => {
    if (selectedLeads.length === filteredLeads.length) {
      setSelectedLeads([]);
    } else {
      setSelectedLeads(filteredLeads.map((l) => l.id));
    }
  };

  const toggleSelectLead = (id: string) => {
    if (selectedLeads.includes(id)) {
      setSelectedLeads(selectedLeads.filter((i) => i !== id));
    } else {
      setSelectedLeads([...selectedLeads, id]);
    }
  };

  const handleBulkStatusChange = (status: Lead['status']) => {
    selectedLeads.forEach((id) => onUpdateLeadStatus(id, status));
    setSelectedLeads([]);
    setBulkActionOpen(false);
  };

  const getStatusBadge = (status: Lead['status']) => {
    switch (status) {
      case 'New':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
      case 'Assigned':
        return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30';
      case 'Contacted':
        return 'bg-sky-500/10 text-sky-400 border-sky-500/30';
      case 'Requirement Collected':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'Qualified':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'Opportunity Created':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/30';
      case 'Won':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 font-bold';
      case 'Converted':
        return 'bg-green-500/20 text-green-300 border-green-500/40 font-bold';
      case 'Unqualified':
        return 'bg-slate-700/50 text-slate-400 border-slate-600/30';
      default:
        return 'bg-slate-800 text-slate-300';
    }
  };

  const getPriorityBadge = (priority: Lead['priority']) => {
    switch (priority) {
      case 'Urgent':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/40 font-bold';
      case 'High':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/30 font-medium';
      case 'Medium':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'Low':
        return 'bg-slate-700/30 text-slate-400 border-slate-700';
    }
  };

  return (
    <div className="space-y-4 sm:space-y-5 animate-in fade-in duration-200">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 p-4 sm:p-5 rounded-2xl bg-[#111827]/90 border border-slate-800 shadow-lg">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-extrabold text-white tracking-tight">Lead Management</h1>
            <span className="px-2 py-0.5 rounded-full text-xs font-mono font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              {filteredLeads.length} Total Leads
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Capture, qualify, monitor next follow-ups, and convert inbound enterprise prospects
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowImportModal(true)}
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition flex items-center gap-1.5 cursor-pointer"
            title="Import leads from CSV"
          >
            <Upload className="w-3.5 h-3.5" />
            Import
          </button>
          <button
            onClick={() => {
              const csvContent =
                'data:text/csv;charset=utf-8,' +
                ['Lead ID,Name,Company,Email,Phone,Source,Status,Budget (INR)']
                  .concat(
                    leads.map(
                      (l) =>
                        `${l.id},${l.name},${l.company},${l.email},${l.phone},${l.source},${l.status},${l.estimatedBudget}`
                    )
                  )
                  .join('\n');
              const encodedUri = encodeURI(csvContent);
              const link = document.createElement('a');
              link.setAttribute('href', encodedUri);
              link.setAttribute('download', 'TDS_CRM_Leads.csv');
              document.body.appendChild(link);
              link.click();
            }}
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition flex items-center gap-1.5 cursor-pointer"
            title="Export to CSV"
          >
            <Download className="w-3.5 h-3.5" />
            Export
          </button>

          <button
            onClick={onOpenNewLeadModal}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 transition flex items-center gap-1.5 cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4" />
            New Lead
          </button>
        </div>
      </div>

      {/* Control Strip (Search, Filters, Saved Views, Bulk Actions) */}
      <div className="p-3.5 rounded-2xl bg-[#111827]/70 border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Left: Search & Quick Status Filter */}
        <div className="flex w-full items-center gap-2.5 sm:w-auto sm:flex-1 sm:min-w-[280px]">
          <div className="relative flex-1 max-w-md">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search leads by name, company, email, service interest..."
              className="w-full pl-9 pr-3 py-1.5 bg-slate-900 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <button
            onClick={() => setShowFilterDrawer(!showFilterDrawer)}
            className={`px-3 py-1.5 rounded-xl border flex items-center gap-1.5 transition cursor-pointer font-medium ${
              showFilterDrawer || activeFilterCount > 0
                ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300'
                : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            <span>Filters</span>
            {activeFilterCount > 0 && <span className="grid h-4 min-w-4 place-items-center rounded-full bg-cyan-400 px-1 text-[9px] font-bold text-slate-950">{activeFilterCount}</span>}
          </button>
        </div>

        {/* Right: Bulk Selection Status */}
        {selectedLeads.length > 0 && (
          <div className="flex items-center gap-2 bg-indigo-950/60 border border-indigo-500/40 px-3 py-1.5 rounded-xl text-xs text-indigo-200">
            <span className="font-semibold">{selectedLeads.length} Selected</span>
            <div className="h-4 w-px bg-indigo-500/30" />
            <div className="relative">
              <button
                onClick={() => setBulkActionOpen(!bulkActionOpen)}
                className="px-2 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-medium flex items-center gap-1 cursor-pointer"
              >
                <span>Bulk Status</span>
                <SlidersHorizontal className="w-3 h-3" />
              </button>
              {bulkActionOpen && (
                <div className="absolute right-0 mt-1 w-48 bg-[#131B2E] border border-slate-700 rounded-xl shadow-2xl p-1 z-50">
                  <div className="px-2.5 py-1 text-[10px] uppercase font-bold text-slate-300">Update Selected To:</div>
                  {(['Assigned', 'Contacted', 'Requirement Collected', 'Qualified', 'Opportunity Created', 'Won', 'Unqualified'] as const).map(
                    (st) => (
                      <button
                        key={st}
                        onClick={() => handleBulkStatusChange(st)}
                        className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs hover:bg-slate-800 text-slate-200"
                      >
                        {st}
                      </button>
                    )
                  )}
                </div>
              )}
            </div>
            <select
              aria-label="Assign selected leads to"
              value={bulkAssignOwner}
              onChange={(event) => setBulkAssignOwner(event.target.value)}
              className="max-w-36 rounded border border-slate-700 bg-slate-800 px-2 py-1 text-[10px] text-white"
            >
              <option value="">Select owner</option>
              {assignees.map((assignee) => <option key={assignee.id} value={assignee.name}>{assignee.name}</option>)}
            </select>
            <button
              onClick={() => {
                if (!bulkAssignOwner.trim()) return;
                onBulkAssign(selectedLeads, bulkAssignOwner.trim());
                setSelectedLeads([]);
              }}
              className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium flex items-center gap-1 cursor-pointer"
            >
              <UserCheck className="w-3 h-3 text-cyan-400" />
              Assign
            </button>
          </div>
        )}
      </div>

      {/* Advanced Filter Drawer */}
      {showFilterDrawer && (
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-3 text-xs animate-in slide-in-from-top-2 duration-150">
          <div>
            <label className="text-[10px] uppercase font-bold text-slate-300 mb-1 block">Lead Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"
            >
              <option value="All">All Statuses</option>
              <option value="New">New</option>
              <option value="Assigned">Assigned</option>
              <option value="Contacted">Contacted</option>
              <option value="Requirement Collected">Requirement Collected</option>
              <option value="Qualified">Qualified</option>
              <option value="Opportunity Created">Opportunity Created</option>
              <option value="Won">Won</option>
              <option value="Unqualified">Unqualified</option>
              <option value="Converted">Converted</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] uppercase font-bold text-slate-300 mb-1 block">Lead Source</label>
            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"
            >
              <option value="All">All Sources</option>
              <option value="Google Ads">Google Ads</option>
              <option value="Website">Website</option>
              <option value="Referral">Referral</option>
              <option value="Meta Ads">Meta Ads</option>
              <option value="Instagram">Instagram</option>
              <option value="Direct">Direct</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] uppercase font-bold text-slate-300 mb-1 block">Priority</label>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"
            >
              <option value="All">All Priorities</option>
              <option value="Urgent">Urgent</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] uppercase font-bold text-slate-300 mb-1 block">Staff / Lead Owner</label>
            <select
              value={ownerFilter}
              onChange={(e) => setOwnerFilter(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"
            >
              <option value="All">All Staff</option>
              <option value="Unassigned">Unassigned</option>
              {ownerOptions.map((owner) => <option key={owner} value={owner}>{owner}</option>)}
            </select>
          </div>

          <div className="flex items-end">
            <button
              type="button"
              disabled={activeFilterCount === 0}
              onClick={() => {
                setStatusFilter('All');
                setSourceFilter('All');
                setPriorityFilter('All');
                setOwnerFilter('All');
              }}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 p-2 font-semibold text-slate-300 transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Clear filters
            </button>
          </div>
        </div>
      )}

      {/* Leads Table */}
      <div className="rounded-2xl bg-[#111827]/80 border border-slate-800 shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-[1100px] w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-900/90 border-b border-slate-800 text-[10px] uppercase font-bold text-slate-300 tracking-wider">
                <th className="py-3.5 px-4 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={selectedLeads.length === filteredLeads.length && filteredLeads.length > 0}
                    onChange={toggleSelectAll}
                    className="rounded bg-slate-800 border-slate-700 text-indigo-600 focus:ring-0 cursor-pointer"
                  />
                </th>
                <th className="py-3.5 px-3">Lead ID & Name</th>
                <th className="py-3.5 px-3">Company & Contacts</th>
                <th className="py-3.5 px-3">Source & Campaign</th>
                <th className="py-3.5 px-3">Interested Service</th>
                <th className="py-3.5 px-3 text-right">Budget (INR)</th>
                <th className="py-3.5 px-3">Owner</th>
                <th className="py-3.5 px-3">Status</th>
                <th className="py-3.5 px-3">Priority</th>
                <th className="py-3.5 px-3">Next Follow-up</th>
                <th className="py-3.5 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-slate-300">
                    No leads found matching your search and filter criteria.
                  </td>
                </tr>
              ) : (
                filteredLeads.map((lead) => {
                  const isSelected = selectedLeads.includes(lead.id);
                  return (
                    <tr
                      key={lead.id}
                      className={`hover:bg-slate-800/40 transition group cursor-pointer ${
                        isSelected ? 'bg-indigo-950/20' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-3 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectLead(lead.id)}
                          className="rounded bg-slate-800 border-slate-700 text-indigo-600 focus:ring-0 cursor-pointer"
                        />
                      </td>

                      {/* Lead ID & Name */}
                      <td className="py-3 px-3" onClick={() => onSelectLead(lead.id)}>
                        <div className="font-bold text-white group-hover:text-cyan-300 transition flex items-center gap-1.5">
                          <span>{lead.name}</span>
                        </div>
                        <div className="text-[10px] font-mono text-slate-300 mt-0.5">
                          {lead.id} • {lead.designation}
                        </div>
                      </td>

                      {/* Company & Contacts */}
                      <td className="py-3 px-3" onClick={() => onSelectLead(lead.id)}>
                        <div className="text-slate-200 font-semibold">{lead.company}</div>
                        <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400">
                          <span title={lead.phone} className="flex items-center gap-0.5 text-slate-300">
                            <Phone className="w-3 h-3 text-emerald-400" /> {lead.phone}
                          </span>
                          <button type="button" onClick={(event) => { event.stopPropagation(); onOpenWhatsApp(lead); }} title={`Message ${lead.name} on WhatsApp`} aria-label={`Message ${lead.name} on WhatsApp`} className="text-green-400 font-semibold hover:text-green-300 hover:underline">
                            WA
                          </button>
                        </div>
                      </td>

                      {/* Source */}
                      <td className="py-3 px-3" onClick={() => onSelectLead(lead.id)}>
                        <span className="px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-[10px] font-semibold text-slate-200">
                          {lead.source}
                        </span>
                        <div className="text-[10px] text-slate-300 truncate max-w-[120px] mt-1" title={lead.campaign}>
                          {lead.campaign}
                        </div>
                      </td>

                      {/* Service */}
                      <td className="py-3 px-3 max-w-[170px]" onClick={() => onSelectLead(lead.id)}>
                        <div className="truncate text-slate-300 font-medium" title={lead.interestedService}>
                          {lead.interestedService}
                        </div>
                      </td>

                      {/* Budget */}
                      <td className="py-3 px-3 text-right font-mono font-bold text-white" onClick={() => onSelectLead(lead.id)}>
                        {formatINR(lead.estimatedBudget)}
                      </td>

                      {/* Lead Owner */}
                      <td className="py-3 px-3" onClick={() => onSelectLead(lead.id)}>
                        <div className="flex items-center gap-1.5">
                          <div className="w-5 h-5 rounded-full bg-indigo-600 text-[9px] font-bold text-white flex items-center justify-center">
                            {lead.leadOwner.charAt(0)}
                          </div>
                          <span className="text-slate-300 text-xs">{lead.leadOwner}</span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3" onClick={() => onSelectLead(lead.id)}>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] border font-semibold whitespace-nowrap ${getStatusBadge(
                            lead.status
                          )}`}
                        >
                          {lead.status}
                        </span>
                      </td>

                      {/* Priority */}
                      <td className="py-3 px-3" onClick={() => onSelectLead(lead.id)}>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] border font-mono ${getPriorityBadge(
                            lead.priority
                          )}`}
                        >
                          {lead.priority}
                        </span>
                      </td>

                      {/* Next follow up */}
                      <td className="py-3 px-3" onClick={() => onSelectLead(lead.id)}>
                        <div className="text-amber-300 text-[11px] font-mono flex items-center gap-1 font-semibold">
                          <Clock className="w-3 h-3" />
                          {lead.nextFollowUp}
                        </div>
                        <span className="text-[10px] text-slate-300">{lead.nextFollowUpTime}</span>
                      </td>

                      {/* Action */}
                      <td className="py-3 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => onSelectLead(lead.id)}
                          className="px-2.5 py-1 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 hover:text-white border border-indigo-500/30 text-[11px] font-semibold transition cursor-pointer"
                        >
                          360° View
                        </button>
                        <button
                          type="button"
                          onClick={() => onEditLead(lead)}
                          className="ml-1 rounded-lg p-1.5 text-slate-400 hover:bg-slate-700 hover:text-white"
                          title="Edit lead"
                          aria-label={`Edit lead ${lead.name}`}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteLead(lead)}
                          className="ml-1 rounded-lg p-1.5 text-slate-400 hover:bg-rose-500/10 hover:text-rose-500"
                          title="Delete lead"
                          aria-label={`Delete lead ${lead.name}`}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer */}
        <div className="p-3 border-t border-slate-800 bg-slate-900/60 flex items-center justify-between text-xs text-slate-400">
          <span>
            Showing <strong className="text-white">{filteredLeads.length}</strong> of{' '}
            <strong className="text-white">{leads.length}</strong> records
          </span>
          <div className="flex items-center gap-2">
            <span className="text-slate-300">Page 1 of 1</span>
          </div>
        </div>
      </div>
      <LeadImportModal isOpen={showImportModal} onClose={() => setShowImportModal(false)} onImport={onImportLeads} />
    </div>
  );
};
