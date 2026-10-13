import React, { useState } from 'react';
import {
  ArrowLeft,
  Building2,
  Phone,
  MessageSquare,
  Mail,
  Calendar,
  Briefcase,
  FileText,
  CheckCircle2,
  Clock,
  Sparkles,
  User,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  FileCheck2,
  FolderLock,
  Edit,
  Share2,
  AlertCircle,
  Plus,
  Send,
  X
} from 'lucide-react';
import type { Lead, Activity, Opportunity, Proposal } from '../types/crm';
import { formatINR } from '../utils/currency';

interface Lead360ViewProps {
  lead: Lead;
  activities: Activity[];
  opportunities: Opportunity[];
  proposals: Proposal[];
  onBack: () => void;
  onUpdateStatus: (leadId: string, status: Lead['status']) => void;
  onAddActivity: (activity: Partial<Activity>) => void;
  onEditActivity: (activity: Activity) => void;
  onDeleteActivity: (activity: Activity) => void;
  onConvertToCustomer: (lead: Lead) => void;
  onCreateOpportunity: (lead: Lead) => void;
  onCreateProposal: (lead: Lead) => void;
}

export const Lead360View: React.FC<Lead360ViewProps> = ({
  lead,
  activities,
  opportunities,
  proposals,
  onBack,
  onUpdateStatus,
  onAddActivity,
  onEditActivity,
  onDeleteActivity,
  onConvertToCustomer,
  onCreateOpportunity,
  onCreateProposal
}) => {
  const [activeTab, setActiveTab] = useState<
    'Overview' | 'Activities' | 'Contacts' | 'Opportunities' | 'Proposals' | 'Documents' | 'Notes' | 'History'
  >('Overview');

  const [newNote, setNewNote] = useState('');
  const [leadNotes, setLeadNotes] = useState<string[]>(lead.notes || []);
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [activityType, setActivityType] = useState<Activity['type']>('Call');
  const [activityTitle, setActivityTitle] = useState('');
  const [activityDesc, setActivityDesc] = useState('');

  // Filter items specific to this lead
  const leadActivities = activities.filter((a) => a.leadId === lead.id);
  const leadOpportunities = opportunities.filter((o) => o.leadId === lead.id);
  const leadProposals = proposals.filter((p) => p.leadId === lead.id);

  const handleAddNote = () => {
    if (!newNote.trim()) return;
    setLeadNotes([`${new Date().toLocaleDateString()} - ${newNote.trim()}`, ...leadNotes]);
    setNewNote('');
  };

  const handleCreateActivity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activityTitle.trim()) return;
    onAddActivity({
      leadId: lead.id,
      leadName: lead.name,
      company: lead.company,
      type: activityType,
      title: activityTitle,
      description: activityDesc,
      date: new Date().toISOString().split('T')[0],
      time: '12:00 PM',
      user: lead.leadOwner || 'Unassigned',
      priority: 'High',
      status: 'Scheduled',
      category: 'Today'
    });
    setActivityTitle('');
    setActivityDesc('');
    setShowActivityModal(false);
  };

  // Timeline events composite
  const timelineEvents = [
    {
      title: 'Lead Created',
      desc: `Inbound generated via ${lead.source} (${lead.campaign}) with estimated budget of ${formatINR(lead.estimatedBudget)}`,
      date: lead.createdDate,
      time: '09:15 AM',
      type: 'System'
    },
    {
      title: 'Assigned to Sales Lead',
      desc: `Assigned to ${lead.leadOwner} for technical qualification & initial discovery call`,
      date: lead.createdDate,
      time: '10:00 AM',
      type: 'System'
    },
    ...leadActivities.map((act) => ({
      activityId: act.id,
      title: `${act.type}: ${act.title}`,
      desc: act.description,
      date: act.date,
      time: act.time,
      type: act.type
    })),
    ...(leadProposals.length > 0
      ? [
          {
            title: `Proposal Generated: ${leadProposals[0].proposalNumber}`,
            desc: `Proposal "${leadProposals[0].title}" prepared for ${formatINR(leadProposals[0].amount)}`,
            date: leadProposals[0].sentDate,
            time: '04:00 PM',
            type: 'Proposal'
          }
        ]
      : [])
  ];

  return (
    <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-200">
      {/* Top Navigation & Breadcrumbs */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-300 text-xs font-semibold border border-slate-700 transition cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Leads List
        </button>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400">Current Lifecycle:</span>
          <select
            value={lead.status}
            onChange={(e) => onUpdateStatus(lead.id, e.target.value as Lead['status'])}
            className="bg-indigo-950/80 border border-indigo-500/40 text-indigo-200 px-3 py-1.5 rounded-xl font-bold cursor-pointer text-xs"
          >
            <option value="New">New</option>
            <option value="Assigned">Assigned</option>
            <option value="Contacted">Contacted</option>
            <option value="Requirement Collected">Requirement Collected</option>
            <option value="Qualified">Qualified</option>
            <option value="Opportunity Created">Opportunity Created</option>
            <option value="Converted">Converted</option>
            <option value="Unqualified">Unqualified</option>
          </select>
        </div>
      </div>

      {/* 360 Header Detail Card */}
      <div className="p-4 sm:p-6 rounded-2xl bg-gradient-to-r from-[#111827] via-[#131D31] to-[#111827] border border-slate-700 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          {/* Main Info */}
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-500 to-cyan-500 flex items-center justify-center text-white text-xl font-bold shadow-lg shadow-indigo-500/20 ring-1 ring-white/20">
              {lead.name.charAt(0)}
            </div>

            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-xl md:text-2xl font-extrabold text-white tracking-tight">
                  {lead.name}
                </h1>
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  {lead.id}
                </span>
                <span
                  className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${
                    lead.status === 'Converted'
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      : 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
                  }`}
                >
                  {lead.status}
                </span>
                <span className="text-xs px-2 py-0.5 rounded font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {lead.priority} Priority
                </span>
              </div>

              <div className="flex items-center gap-4 mt-2 text-xs text-slate-300 flex-wrap">
                <span className="flex items-center gap-1.5 font-semibold text-cyan-300">
                  <Building2 className="w-3.5 h-3.5" /> {lead.company}
                </span>
                <span className="text-slate-400">•</span>
                <span>{lead.designation}</span>
                <span className="text-slate-400">•</span>
                <span className="text-slate-300">
                  Source: <strong className="text-white">{lead.source}</strong>
                </span>
                <span className="text-slate-400">•</span>
                <span className="text-slate-300">
                  Owner: <strong className="text-indigo-400">{lead.leadOwner}</strong>
                </span>
              </div>
            </div>
          </div>

          {/* Key Actions Row */}
          <div className="flex flex-wrap items-center gap-2">
            <a
              href={`tel:${lead.phone}`}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition flex items-center gap-1.5 cursor-pointer"
            >
              <Phone className="w-3.5 h-3.5 text-blue-400" />
              Call
            </a>
            <a
              href={`https://wa.me/${lead.whatsapp.replace(/[^0-9]/g, '')}`}
              target="_blank"
              rel="noreferrer"
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition flex items-center gap-1.5 cursor-pointer"
            >
              <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
              WhatsApp
            </a>
            <a
              href={`mailto:${lead.email}`}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition flex items-center gap-1.5 cursor-pointer"
            >
              <Mail className="w-3.5 h-3.5 text-sky-400" />
              Email
            </a>
            <button
              onClick={() => setShowActivityModal(true)}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-amber-400" />
              Add Activity
            </button>
            <button
              onClick={() => onCreateOpportunity(lead)}
              className="px-3 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-md shadow-purple-600/30 transition flex items-center gap-1.5 cursor-pointer"
            >
              <TrendingUp className="w-3.5 h-3.5" />
              Create Opportunity
            </button>
            <button
              onClick={() => onConvertToCustomer(lead)}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/30 transition flex items-center gap-1.5 cursor-pointer"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Convert
            </button>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-1 border-b border-slate-800 text-xs overflow-x-auto pb-1">
        {(
          [
            'Overview',
            'Activities',
            'Contacts',
            'Opportunities',
            'Proposals',
            'Documents',
            'Notes',
            'History'
          ] as const
        ).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 rounded-t-xl font-bold transition cursor-pointer whitespace-nowrap ${
              activeTab === tab
                ? 'bg-[#111827] text-cyan-300 border-t-2 border-cyan-400 border-x border-slate-800'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            {tab}
            {tab === 'Activities' && leadActivities.length > 0 && (
              <span className="ml-1.5 px-1.5 py-0.2 rounded-full bg-slate-800 text-[10px] text-white">
                {leadActivities.length}
              </span>
            )}
            {tab === 'Opportunities' && leadOpportunities.length > 0 && (
              <span className="ml-1.5 px-1.5 py-0.2 rounded-full bg-purple-900/60 text-[10px] text-purple-300">
                {leadOpportunities.length}
              </span>
            )}
            {tab === 'Proposals' && leadProposals.length > 0 && (
              <span className="ml-1.5 px-1.5 py-0.2 rounded-full bg-pink-900/60 text-[10px] text-pink-300">
                {leadProposals.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab Content Display */}
      {activeTab === 'Overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2 Cols: Requirements & Timeline */}
          <div className="lg:col-span-2 space-y-6">
            {/* Requirement & Commercial Card */}
            <div className="p-5 rounded-2xl bg-[#111827]/80 border border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
                <FileText className="w-4 h-4 text-indigo-400" />
                Technical Requirement & Scope Overview
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/90 p-3.5 rounded-xl border border-slate-800 font-normal">
                {lead.requirement || 'No explicit technical requirement noted yet.'}
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-4 pt-4 border-t border-slate-800/80 text-xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-300">Interested IT Service</span>
                  <p className="font-semibold text-cyan-300 mt-0.5">{lead.interestedService}</p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-300">Estimated Project Budget</span>
                  <p className="font-mono font-bold text-emerald-400 mt-0.5 text-sm">
                    {formatINR(lead.estimatedBudget)}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-300">Campaign Tag</span>
                  <p className="font-semibold text-slate-200 mt-0.5">{lead.campaign}</p>
                </div>
              </div>

              {lead.commercialNotes && (
                <div className="mt-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200">
                  <span className="font-bold text-amber-300">Commercial Notes: </span>
                  {lead.commercialNotes}
                </div>
              )}
            </div>

            {/* Lead Chronological Timeline */}
            <div className="p-5 rounded-2xl bg-[#111827]/80 border border-slate-800">
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-400" />
                  Chronological Lead Lifecycle Timeline
                </h3>
                <span className="text-[10px] text-slate-300 font-mono">End-to-End Activity History</span>
              </div>

              <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
                {timelineEvents.map((ev, i) => (
                  <div key={i} className="relative group">
                    <span className="absolute -left-[27px] top-1 w-3 h-3 rounded-full bg-indigo-500 ring-4 ring-[#111827]" />
                    <div className="flex items-baseline justify-between gap-2">
                      <h4 className="text-xs font-bold text-white">{ev.title}</h4>
                      <div className="flex shrink-0 items-center gap-1">
                        <span className="text-[10px] text-slate-300 font-mono">{ev.date} • {ev.time}</span>
                        {'activityId' in ev && ev.activityId && (() => {
                          const activity = leadActivities.find((item) => item.id === ev.activityId);
                          return activity ? (
                            <>
                              <button type="button" onClick={() => onEditActivity(activity)} aria-label={`Edit activity ${activity.title}`} title="Edit activity" className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-white">
                                <Edit className="h-3 w-3" />
                              </button>
                              <button type="button" onClick={() => onDeleteActivity(activity)} aria-label={`Delete activity ${activity.title}`} title="Delete activity" className="rounded p-1 text-slate-400 hover:bg-rose-500/10 hover:text-rose-400">
                                <X className="h-3 w-3" />
                              </button>
                            </>
                          ) : null;
                        })()}
                      </div>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">{ev.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right 1 Col: Contact Profile, Next Action, Notes */}
          <div className="space-y-6">
            {/* Contact Profile Details */}
            <div className="p-5 rounded-2xl bg-[#111827]/80 border border-slate-800 text-xs space-y-3.5">
              <h3 className="text-sm font-bold text-white flex items-center gap-2 pb-2 border-b border-slate-800">
                <User className="w-4 h-4 text-cyan-400" />
                Contact Profile Details
              </h3>

              <div>
                <span className="text-[10px] uppercase font-bold text-slate-300">Designation</span>
                <p className="font-semibold text-slate-200 mt-0.5">{lead.designation}</p>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-slate-300">Direct Phone</span>
                <p className="font-mono text-cyan-300 mt-0.5">{lead.phone}</p>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-slate-300">Official Email</span>
                <p className="font-mono text-slate-200 mt-0.5 truncate">{lead.email}</p>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-slate-300">Company Website</span>
                <p className="mt-0.5">
                  <a
                    href={lead.website}
                    target="_blank"
                    rel="noreferrer"
                    className="text-indigo-400 hover:underline flex items-center gap-1 font-mono"
                  >
                    {lead.website} <ExternalLink className="w-3 h-3" />
                  </a>
                </p>
              </div>

              <div className="pt-2 border-t border-slate-800">
                <span className="text-[10px] uppercase font-bold text-amber-400">Scheduled Follow-up</span>
                <div className="flex items-center justify-between mt-1 text-slate-200 font-mono">
                  <span>{lead.nextFollowUp}</span>
                  <span className="text-amber-300 font-bold">{lead.nextFollowUpTime}</span>
                </div>
              </div>
            </div>

            {/* Quick Internal Notes */}
            <div className="p-5 rounded-2xl bg-[#111827]/80 border border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2 pb-2 mb-3 border-b border-slate-800">
                <Edit className="w-4 h-4 text-emerald-400" />
                Internal Stakeholder Notes
              </h3>

              <div className="space-y-2 mb-3">
                <textarea
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Log quick internal qualification notes..."
                  className="w-full bg-slate-900 border border-slate-700/80 rounded-xl p-2.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 h-20"
                />
                <button
                  onClick={handleAddNote}
                  className="w-full py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-1"
                >
                  <Send className="w-3 h-3" /> Save Note
                </button>
              </div>

              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {leadNotes.map((note, idx) => (
                  <div key={idx} className="p-2.5 rounded-lg bg-slate-900 text-[11px] text-slate-300 border border-slate-800">
                    {note}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Activities Tab */}
      {activeTab === 'Activities' && (
        <div className="p-5 rounded-2xl bg-[#111827]/80 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="text-sm font-bold text-white">Scheduled & Past Activities</h3>
            <button
              onClick={() => setShowActivityModal(true)}
              className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold cursor-pointer"
            >
              + Log New Activity
            </button>
          </div>

          <div className="space-y-3">
            {leadActivities.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No activities recorded for this lead yet.</p>
            ) : (
              leadActivities.map((act) => (
                <div key={act.id} className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold bg-indigo-500/20 text-indigo-300">
                        {act.type}
                      </span>
                      <span className="text-xs font-bold text-white">{act.title}</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">{act.description}</p>
                    <div className="mt-2 text-[10px] text-slate-300 font-mono">
                      Logged by {act.user} • {act.date} at {act.time}
                    </div>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold font-mono">
                    {act.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Opportunities Tab */}
      {activeTab === 'Opportunities' && (
        <div className="p-5 rounded-2xl bg-[#111827]/80 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="text-sm font-bold text-white">Linked Deal Opportunities</h3>
            <button
              onClick={() => onCreateOpportunity(lead)}
              className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold cursor-pointer"
            >
              + Create Opportunity
            </button>
          </div>

          <div className="space-y-3">
            {leadOpportunities.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No active opportunity in pipeline yet.</p>
            ) : (
              leadOpportunities.map((opp) => (
                <div key={opp.id} className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-white">{opp.name}</span>
                    <p className="text-[11px] text-slate-400 mt-0.5">Stage: {opp.stage} • Close: {opp.expectedClose}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-base font-extrabold text-emerald-400 font-mono">{formatINR(opp.amount)}</span>
                    <p className="text-[10px] text-slate-300 font-mono">{opp.probability}% win probability</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Proposals Tab */}
      {activeTab === 'Proposals' && (
        <div className="p-5 rounded-2xl bg-[#111827]/80 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="text-sm font-bold text-white">Quotations & Proposals (SOW)</h3>
            <button
              onClick={() => onCreateProposal(lead)}
              className="px-3 py-1.5 rounded-xl bg-pink-600 hover:bg-pink-500 text-white text-xs font-semibold cursor-pointer"
            >
              + Generate Proposal
            </button>
          </div>

          <div className="space-y-3">
            {leadProposals.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No proposal generated yet for this lead.</p>
            ) : (
              leadProposals.map((prop) => (
                <div key={prop.id} className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-pink-400">{prop.proposalNumber}</span>
                      <span className="text-xs font-bold text-white">{prop.title}</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">Domain: {prop.service} • Sent: {prop.sentDate}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-base font-extrabold text-white font-mono">{formatINR(prop.amount)}</span>
                    <span className="block text-[10px] px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-bold mt-1">
                      {prop.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Documents / Notes / Contacts tabs fallback placeholder */}
      {(activeTab === 'Contacts' || activeTab === 'Documents' || activeTab === 'Notes' || activeTab === 'History') && (
        <div className="p-8 rounded-2xl bg-[#111827]/80 border border-slate-800 text-center text-xs text-slate-400">
          <FolderLock className="w-8 h-8 mx-auto text-slate-600 mb-2" />
          <p className="font-semibold text-slate-300">Enterprise {activeTab} Vault</p>
          <p className="text-slate-400 mt-1">
            Integrated with TDS Document Store, AWS S3 buckets, and client portal permissions.
          </p>
        </div>
      )}

      {/* Log Activity Modal */}
      {showActivityModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#111827] border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white">Log Follow-up Activity</h3>
              <button onClick={() => setShowActivityModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateActivity} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-300 block mb-1">Activity Type</label>
                <select
                  value={activityType}
                  onChange={(e) => setActivityType(e.target.value as Activity['type'])}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
                >
                  <option value="Call">Phone Call</option>
                  <option value="WhatsApp">WhatsApp Conversation</option>
                  <option value="Meeting">Video Conference / Meeting</option>
                  <option value="Email">Email Communication</option>
                  <option value="Requirement Log">Technical Requirement Log</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-slate-300 block mb-1">Title / Subject</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Reviewed pricing breakdown and SLA"
                  value={activityTitle}
                  onChange={(e) => setActivityTitle(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-slate-300 block mb-1">Detailed Discussion Summary</label>
                <textarea
                  rows={3}
                  placeholder="Record customer points, decisions, and required deliverables..."
                  value={activityDesc}
                  onChange={(e) => setActivityDesc(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowActivityModal(false)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold"
                >
                  Save Activity
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
