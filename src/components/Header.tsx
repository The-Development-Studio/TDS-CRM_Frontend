import React, { useState, useRef, useEffect } from 'react';
import {
  Search,
  Menu,
  Plus,
  Bell,
  Clock,
  HelpCircle,
  ChevronDown,
  User,
  Shield,
  Briefcase,
  FileText,
  Receipt,
  Headphones,
  CheckCircle2,
  Calendar,
  Sparkles,
  ExternalLink,
  RefreshCw
} from 'lucide-react';
import { formatINR } from '../utils/currency';
import type { Activity, AMCRenewal, Customer, Invoice, Lead, Opportunity, Proposal } from '../types/crm';

type SearchResult = {
  id: string;
  kind: 'Lead' | 'Customer' | 'Opportunity' | 'Invoice';
  title: string;
  detail: string;
};

interface HeaderProps {
  onQuickCreate: (type: string) => void;
  onSearchSelectLead: (leadId: string) => void;
  onSearchSelectCustomer: (customerId: string) => void;
  onNavigate: (view: string) => void;
  onOpenSidebar: () => void;
  leads: Lead[];
  customers: Customer[];
  opportunities: Opportunity[];
  invoices: Invoice[];
  activities: Activity[];
  proposals: Proposal[];
  amcRenewals: AMCRenewal[];
  accountName: string;
  accountEmail: string;
  unreadCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  onQuickCreate,
  onSearchSelectLead,
  onSearchSelectCustomer,
  onNavigate,
  onOpenSidebar,
  leads,
  customers,
  opportunities,
  invoices,
  activities,
  proposals,
  amcRenewals,
  accountName,
  accountEmail,
  unreadCount = 3
}) => {
  const [quickCreateOpen, setQuickCreateOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [remindersOpen, setRemindersOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResultsOpen, setSearchResultsOpen] = useState(false);
  const [readNotificationIds, setReadNotificationIds] = useState<string[]>([]);

  const accountInitials = accountName
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'U';

  const quickCreateRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const remindersRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (quickCreateRef.current && !quickCreateRef.current.contains(e.target as Node)) {
        setQuickCreateOpen(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(e.target as Node)) {
        setNotificationsOpen(false);
      }
      if (remindersRef.current && !remindersRef.current.contains(e.target as Node)) {
        setRemindersOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const quickCreateOptions = [
    { id: 'lead', label: 'New Lead', icon: User, color: 'text-indigo-400', desc: 'Capture customer inquiries' },
    { id: 'opportunity', label: 'New Opportunity', icon: Briefcase, color: 'text-purple-400', desc: 'Deal pipeline entry' },
    { id: 'activity', label: 'New Activity', icon: Calendar, color: 'text-emerald-400', desc: 'Call, meeting, or email' },
    { id: 'proposal', label: 'New Proposal', icon: FileText, color: 'text-pink-400', desc: 'SOW / Quotation' },
    { id: 'invoice', label: 'New Invoice', icon: Receipt, color: 'text-amber-400', desc: 'Proforma or Tax invoice' },
    { id: 'amc', label: 'New AMC Contract', icon: RefreshCw, color: 'text-teal-400', desc: 'Register a renewal contract' }
  ];

  const today = new Date().toISOString().slice(0, 10);
  const followUpReminders = activities
    .filter((activity) => activity.status !== 'Completed')
    .sort((left, right) => `${left.date} ${left.time}`.localeCompare(`${right.date} ${right.time}`))
    .slice(0, 5)
    .map((activity) => ({
      id: activity.id,
      lead: activity.leadName || activity.company || 'General activity',
      task: activity.title,
      time: `${activity.date}, ${activity.time}`,
      priority: activity.priority,
      leadId: activity.leadId
    }));

  const notifications = [
    ...proposals.filter((proposal) => proposal.status === 'Accepted').map((proposal) => ({
      id: `proposal-${proposal.id}`,
      title: 'Quotation accepted',
      desc: `${proposal.proposalNumber} · ${proposal.title} · ${formatINR(proposal.amount)}`,
      time: proposal.sentDate,
      target: 'proposals'
    })),
    ...invoices.filter((invoice) => invoice.paidAmount > 0).map((invoice) => ({
      id: `invoice-${invoice.id}`,
      title: 'Payment recorded',
      desc: `${invoice.customer} · ${invoice.invoiceNo} · ${formatINR(invoice.paidAmount)} received`,
      time: invoice.issueDate,
      target: 'payments'
    })),
    ...amcRenewals.filter((contract) => contract.daysRemaining <= 30 && contract.status !== 'Cancelled').map((contract) => ({
      id: `amc-${contract.id}`,
      title: 'AMC renewal due',
      desc: `${contract.customer} · ${contract.contractNo} · ${contract.daysRemaining} days remaining`,
      time: contract.expiryDate,
      target: 'amc'
    })),
    ...activities.filter((activity) => activity.status !== 'Completed' && activity.date < today).map((activity) => ({
      id: `activity-${activity.id}`,
      title: 'Activity overdue',
      desc: `${activity.leadName || activity.company || 'General'} · ${activity.title}`,
      time: activity.date,
      target: activity.leadId || 'activities'
    }))
  ].sort((left, right) => left.time.localeCompare(right.time)).slice(0, 8);
  const unreadNotifications = notifications.filter((notification) => !readNotificationIds.includes(notification.id)).length;

  const searchText = searchQuery.trim().toLowerCase();
  const searchResults: SearchResult[] = searchText ? [
    ...leads.filter((lead) => [lead.name, lead.company, lead.email, lead.id].some((value) => value.toLowerCase().includes(searchText)))
      .map((lead) => ({ id: lead.id, kind: 'Lead' as const, title: lead.name, detail: `${lead.company} · ${lead.id}` })),
    ...customers.filter((customer) => [customer.companyName, customer.customerCode, customer.primaryContact, customer.email].some((value) => value.toLowerCase().includes(searchText)))
      .map((customer) => ({ id: customer.id, kind: 'Customer' as const, title: customer.companyName, detail: `${customer.customerCode} · ${customer.primaryContact}` })),
    ...opportunities.filter((opportunity) => [opportunity.name, opportunity.company, opportunity.id].some((value) => value.toLowerCase().includes(searchText)))
      .map((opportunity) => ({ id: opportunity.id, kind: 'Opportunity' as const, title: opportunity.name, detail: `${opportunity.company} · ${opportunity.stage}` })),
    ...invoices.filter((invoice) => [invoice.invoiceNo, invoice.customer].some((value) => value.toLowerCase().includes(searchText)))
      .map((invoice) => ({ id: invoice.id, kind: 'Invoice' as const, title: invoice.invoiceNo, detail: `${invoice.customer} · ${formatINR(invoice.amount)}` }))
  ].slice(0, 6) : [];

  const selectSearchResult = (result: SearchResult) => {
    if (result.kind === 'Lead') onSearchSelectLead(result.id);
    else if (result.kind === 'Customer') onSearchSelectCustomer(result.id);
    else onNavigate(result.kind === 'Opportunity' ? 'pipeline' : 'invoices');
    setSearchResultsOpen(false);
    setSearchQuery('');
  };

  return (
    <header className="h-16 shrink-0 px-3 sm:px-5 lg:px-6 border-b border-slate-800 bg-[#0C121E]/95 backdrop-blur-md flex items-center justify-between gap-2 sticky top-0 z-20">
      {/* Search Bar */}
      <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0 max-w-xl">
        <button
          type="button"
          onClick={onOpenSidebar}
          aria-label="Open navigation menu"
          className="shrink-0 rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden"
        >
          <Menu className="h-5 w-5" aria-hidden="true" />
        </button>
        <div className="relative w-full min-w-0">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setSearchResultsOpen(e.target.value.length > 0);
            }}
            placeholder="Search leads, companies, invoices..."
            className="w-full pl-10 pr-4 py-2 bg-slate-900/80 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-medium"
          />

          {/* Quick Search Preview dropdown */}
          {searchResultsOpen && searchQuery && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-[#131B2E] border border-slate-700 rounded-xl shadow-2xl p-2 z-50 text-xs">
              <div className="px-3 py-1.5 text-[10px] uppercase font-bold text-slate-300">Search results</div>
              {searchResults.length ? searchResults.map((result) => (
                <button
                  key={`${result.kind}-${result.id}`}
                  type="button"
                  onClick={() => selectSearchResult(result)}
                  className="flex w-full items-center justify-between gap-3 rounded-lg p-2.5 text-left text-slate-200 hover:bg-slate-800"
                >
                  <span className="min-w-0">
                    <span className="block truncate font-semibold text-white">{result.title}</span>
                    <span className="mt-0.5 block truncate text-[10px] text-slate-400">{result.detail}</span>
                  </span>
                  <span className="shrink-0 rounded bg-slate-700 px-2 py-1 text-[9px] font-semibold text-slate-200">{result.kind}</span>
                </button>
              )) : <p className="px-3 py-3 text-slate-400">No matching records.</p>}
            </div>
          )}
        </div>

      </div>

      {/* Right Controls */}
      <div className="flex shrink-0 items-center gap-1 sm:gap-2 lg:gap-3">
        {/* Quick Create Button & Dropdown */}
        <div className="relative" ref={quickCreateRef}>
          <button
            onClick={() => setQuickCreateOpen(!quickCreateOpen)}
            className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 transition-all active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Quick Create</span>
            <ChevronDown className="w-3 h-3 opacity-80" />
          </button>

          {quickCreateOpen && (
            <div className="absolute right-0 mt-2 w-64 max-w-[calc(100vw-1.5rem)] bg-[#111827] border border-slate-700 rounded-xl shadow-2xl p-1.5 z-50 animate-in fade-in duration-150">
              <div className="px-3 py-2 text-[10px] uppercase font-bold text-slate-300 tracking-wider">
                Create New Entity
              </div>
              <div className="space-y-0.5">
                {quickCreateOptions.map((opt) => {
                  const Icon = opt.icon;
                  return (
                    <button
                      key={opt.id}
                      onClick={() => {
                        onQuickCreate(opt.id);
                        setQuickCreateOpen(false);
                      }}
                      className="w-full flex items-start gap-2.5 p-2 rounded-lg hover:bg-slate-800 text-left transition group cursor-pointer"
                    >
                      <div className={`p-1.5 rounded-md bg-slate-800/80 group-hover:bg-slate-700 ${opt.color}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1">
                        <div className="text-xs font-medium text-slate-200 group-hover:text-white">
                          {opt.label}
                        </div>
                        <div className="text-[10px] text-slate-400 leading-tight">
                          {opt.desc}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Follow-up Reminder Button */}
        <div className="relative" ref={remindersRef}>
          <button
            onClick={() => setRemindersOpen(!remindersOpen)}
            className="relative p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/70 border border-slate-800 transition cursor-pointer"
            title="Follow-up Reminders"
          >
            <Clock className="w-4 h-4 text-amber-400" />
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 rounded-full text-[9px] font-extrabold text-black flex items-center justify-center ring-2 ring-[#0C121E]">
              {followUpReminders.length}
            </span>
          </button>

          {remindersOpen && (
            <div className="absolute right-0 mt-2 w-80 max-w-[calc(100vw-1.5rem)] bg-[#111827] border border-slate-700 rounded-xl shadow-2xl p-3 z-50">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-bold text-white">Pending Follow-ups</span>
                </div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-semibold">
                  {followUpReminders.length} Scheduled
                </span>
              </div>
              <div className="space-y-2">
                {!followUpReminders.length && <p className="px-2 py-4 text-center text-xs text-slate-400">No open activities.</p>}
                {followUpReminders.map((rem) => (
                  <div
                    key={rem.id}
                    onClick={() => {
                      if (rem.leadId) onSearchSelectLead(rem.leadId);
                      else onNavigate('activities');
                      setRemindersOpen(false);
                    }}
                    className="p-2.5 rounded-lg bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 cursor-pointer transition text-xs"
                  >
                    <div className="flex items-center justify-between font-semibold text-slate-200">
                      <span className="truncate">{rem.lead}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 font-mono">
                        {rem.priority}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">{rem.task}</p>
                    <div className="flex items-center justify-between mt-2 text-[10px] text-amber-400">
                      <span>{rem.time}</span>
                      <span className="text-indigo-400 hover:underline">{rem.leadId ? 'Open 360° View →' : 'Open Activities →'}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Notifications */}
        <div className="relative" ref={notificationsRef}>
          <button
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="relative p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/70 border border-slate-800 transition cursor-pointer"
            title="Notifications"
          >
            <Bell className="w-4 h-4 text-slate-300" />
            {unreadNotifications > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-indigo-500 rounded-full text-[9px] font-bold text-white flex items-center justify-center ring-2 ring-[#0C121E]">
                {unreadNotifications}
              </span>
            )}
          </button>

          {notificationsOpen && (
            <div className="absolute right-0 mt-2 w-80 max-w-[calc(100vw-1.5rem)] bg-[#111827] border border-slate-700 rounded-xl shadow-2xl p-3 z-50">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
                <span className="text-xs font-bold text-white">Notifications</span>
                <button type="button" onClick={() => setReadNotificationIds(notifications.map((notification) => notification.id))} className="text-[10px] text-indigo-400 hover:underline">Mark all as read</button>
              </div>
              <div className="space-y-2">
                {!notifications.length && <p className="px-2 py-4 text-center text-xs text-slate-400">No new notifications.</p>}
                {notifications.map((n) => (
                  <button type="button" key={n.id} onClick={() => {
                    if (n.target === 'activities') onNavigate('activities');
                    else if (n.target === 'payments' || n.target === 'proposals' || n.target === 'amc') onNavigate(n.target);
                    else onSearchSelectLead(n.target);
                    setNotificationsOpen(false);
                    setReadNotificationIds((current) => [...current, n.id]);
                  }} className="block w-full p-2 rounded-lg text-left hover:bg-slate-800 text-xs transition">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-200">{n.title}</span>
                      <span className="text-[10px] text-slate-300 font-mono">{n.time}</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">{n.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Help */}
        <button
          className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/70 border border-slate-800 transition cursor-pointer hidden md:block"
          title="CRM Knowledgebase & Docs"
        >
          <HelpCircle className="w-4 h-4" />
        </button>

        {/* User Profile & Role badge */}
        <div className="relative" ref={profileRef}>
          <button
            type="button"
            onClick={() => setProfileOpen(!profileOpen)}
            aria-expanded={profileOpen}
            aria-haspopup="menu"
            className="flex min-w-0 items-center gap-2 rounded-xl border border-transparent p-1 transition hover:border-slate-200 hover:bg-slate-50 sm:gap-3 sm:py-1.5 sm:pl-1.5 sm:pr-2.5"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#ff5c00] text-sm font-bold text-white shadow-md shadow-orange-600/20">
              {accountInitials}
            </div>
            <div className="hidden min-w-0 flex-col text-left sm:flex">
              <div className="flex min-w-0 items-center gap-2">
                <span className="truncate text-sm font-semibold leading-5 text-slate-900">{accountName}</span>
                <span className="shrink-0 rounded border border-orange-500 bg-orange-50 px-1.5 py-px text-[10px] font-semibold uppercase leading-4 text-orange-600">
                  Founder
                </span>
              </div>
              <span className="max-w-56 truncate text-[13px] leading-4 text-slate-500">{accountEmail}</span>
            </div>
            <ChevronDown className={`hidden h-4 w-4 shrink-0 text-slate-500 transition-transform sm:block ${profileOpen ? 'rotate-180' : ''}`} />
          </button>

          {profileOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-[#111827] border border-slate-700 rounded-xl shadow-2xl p-1.5 z-50">
              <div className="px-3 py-2 border-b border-slate-800">
                <p className="text-xs font-bold text-white">{accountName}</p>
                <p className="text-[11px] text-slate-400">Role: Founder / Full Access</p>
                <div className="mt-1 flex items-center gap-1.5 text-[10px] text-emerald-400">
                  <Shield className="w-3 h-3" /> Full Administrator Access
                </div>
              </div>
              <div className="py-1">
                <button className="w-full text-left px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800 rounded">
                  Personal Sales Quota ({formatINR(1200000)})
                </button>
                <button className="w-full text-left px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800 rounded">
                  Email & Calendar Sync
                </button>
                <button className="w-full text-left px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800 rounded">
                  Commercial Approvals
                </button>
              </div>
              <div className="pt-1 border-t border-slate-800">
                <button className="w-full text-left px-3 py-1.5 text-xs text-red-400 hover:bg-red-500/10 rounded font-medium">
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
