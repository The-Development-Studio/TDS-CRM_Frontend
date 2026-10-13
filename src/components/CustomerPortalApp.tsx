import { FormEvent, useEffect, useMemo, useState } from 'react';
import {
  BriefcaseBusiness,
  CheckCircle2,
  CreditCard,
  FileText,
  FolderKanban,
  Headphones,
  LogOut,
  MessageSquareText,
  ShieldCheck,
  Ticket,
  UserRound,
} from 'lucide-react';

type CustomerIdentity = {
  id: string;
  companyName: string;
  primaryContact: string;
  email: string;
};

type PortalRecord = Record<string, unknown> & { id: string };

type PortalData = {
  projects: PortalRecord[];
  proposals: PortalRecord[];
  contracts: PortalRecord[];
  invoices: PortalRecord[];
  supportTickets: PortalRecord[];
  documents: PortalRecord[];
};

type PortalSection = 'overview' | 'projects' | 'commercials' | 'payments' | 'support' | 'documents';

const sections: { id: PortalSection; label: string; icon: typeof FolderKanban }[] = [
  { id: 'overview', label: 'Overview', icon: UserRound },
  { id: 'projects', label: 'Projects', icon: FolderKanban },
  { id: 'commercials', label: 'Commercials', icon: BriefcaseBusiness },
  { id: 'payments', label: 'Payments', icon: CreditCard },
  { id: 'support', label: 'Support', icon: Headphones },
  { id: 'documents', label: 'Documents', icon: FileText }
];

const emptyData: PortalData = {
  projects: [],
  proposals: [],
  contracts: [],
  invoices: [],
  supportTickets: [],
  documents: []
};

const formatDate = (value: unknown) => {
  if (typeof value !== 'string' || !value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

const formatAmount = (value: unknown) => {
  const amount = Number(value);
  return Number.isFinite(amount)
    ? new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount)
    : '—';
};

const asText = (value: unknown, fallback = '—') => typeof value === 'string' && value.trim() ? value : fallback;

const apiRequest = async <T,>(path: string, options: RequestInit = {}): Promise<T> => {
  const response = await fetch(`/api/customer-portal${path}`, {
    ...options,
    credentials: 'include',
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers
    }
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => ({})) as { error?: string };
    if (response.status >= 500) {
      throw new Error('Customer portal service is temporarily unavailable. Please try again shortly.');
    }
    throw new Error(payload.error || `Request failed (${response.status})`);
  }
  if (response.status === 204) return undefined as T;
  const payload = await response.json() as { data?: T };
  return payload.data as T;
};

export default function CustomerPortalApp() {
  const [customer, setCustomer] = useState<CustomerIdentity | null>(null);
  const [portalData, setPortalData] = useState<PortalData>(emptyData);
  const [section, setSection] = useState<PortalSection>('overview');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [invitePassword, setInvitePassword] = useState('');
  const [inviteToken, setInviteToken] = useState(new URLSearchParams(window.location.search).get('invite') ?? '');
  const [showTicketForm, setShowTicketForm] = useState(false);
  const [ticketForm, setTicketForm] = useState({ subject: '', category: 'Technical Support', priority: 'Normal', description: '' });
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const loadPortal = async () => {
    const session = await apiRequest<{ email: string; customer: CustomerIdentity }>('/session');
    const data = await apiRequest<PortalData>('/data');
    setCustomer(session.customer);
    setEmail(session.email);
    setPortalData(data);
  };

  const downloadPortalDocument = async (document: PortalRecord) => {
    setError('');
    try {
      const { url } = await apiRequest<{ url: string }>(`/documents/${encodeURIComponent(document.id)}/download-url`);
      const link = window.document.createElement('a');
      link.href = url;
      link.target = '_blank';
      link.rel = 'noreferrer';
      link.click();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Could not open this document.');
    }
  };

  useEffect(() => {
    let active = true;
    const initialize = async () => {
      try {
        const session = await apiRequest<{ email: string; customer: CustomerIdentity }>('/session');
        const data = await apiRequest<PortalData>('/data');
        if (active) {
          setCustomer(session.customer);
          setEmail(session.email);
          setPortalData(data);
        }
      } catch (reason) {
        if (active && !(reason instanceof Error && reason.message === 'Customer portal sign-in required')) {
          setError(reason instanceof Error ? reason.message : 'Could not load the customer portal.');
        }
      } finally {
        if (active) setIsLoading(false);
      }
    };
    void initialize();
    return () => { active = false; };
  }, []);

  const totals = useMemo(() => ({
    projects: portalData.projects.length,
    proposals: portalData.proposals.length,
    invoices: portalData.invoices.length,
    invoicesDue: portalData.invoices.filter((item) => !['Paid', 'Voided'].includes(String(item.status))).length,
    ticketsOpen: portalData.supportTickets.filter((item) => !['Resolved', 'Closed'].includes(String(item.status))).length
  }), [portalData]);

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError('');
    try {
      await apiRequest('/login', { method: 'POST', body: JSON.stringify({ email, password }) });
      await loadPortal();
      setPassword('');
      setNotice('');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Could not sign in.');
    } finally {
      setIsSubmitting(false);
      setIsLoading(false);
    }
  };

  const handleAcceptInvitation = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError('');
    try {
      await apiRequest('/accept-invitation', {
        method: 'POST',
        body: JSON.stringify({ token: inviteToken, password: invitePassword })
      });
      window.history.replaceState({}, '', '/customer-portal');
      setInviteToken('');
      setInvitePassword('');
      setNotice('Your account is ready. Sign in to view your customer workspace.');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Could not activate this invitation.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = async () => {
    setError('');
    try {
      await apiRequest('/logout', { method: 'POST' });
      setCustomer(null);
      setPortalData(emptyData);
      setSection('overview');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Could not sign out.');
    }
  };

  const handleCreateTicket = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError('');
    try {
      const ticket = await apiRequest<PortalRecord>('/tickets', {
        method: 'POST',
        body: JSON.stringify(ticketForm)
      });
      setPortalData((current) => ({ ...current, supportTickets: [ticket, ...current.supportTickets] }));
      setTicketForm({ subject: '', category: 'Technical Support', priority: 'Normal', description: '' });
      setShowTicketForm(false);
      setNotice('Your support request was submitted.');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Could not submit the support request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <div className="grid min-h-dvh place-items-center bg-slate-50 text-sm font-medium text-slate-500">Loading customer workspace…</div>;
  }

  if (!customer) {
    return (
      <main className="grid min-h-dvh bg-slate-50 lg:grid-cols-[1fr_0.9fr]">
        <section className="relative hidden overflow-hidden bg-slate-950 px-12 py-14 text-white lg:flex lg:flex-col lg:justify-between">
          <div className="absolute -right-28 -top-32 h-96 w-96 rounded-full bg-orange-500/20 blur-3xl" />
          <div className="relative">
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#ff6600] font-black">T</div>
              <div><p className="font-extrabold tracking-wide">TDS CLIENT HUB</p><p className="text-xs text-slate-400">Secure customer workspace</p></div>
            </div>
            <div className="mt-28 max-w-lg">
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-orange-300">Your services. One place.</p>
              <h1 className="mt-4 text-4xl font-extrabold leading-tight">A clear view of every customer matter.</h1>
              <p className="mt-4 text-sm leading-7 text-slate-300">Track projects, review commercial documents, follow payments, contact support, and access shared files through one private portal.</p>
            </div>
          </div>
          <div className="relative flex gap-5 text-xs text-slate-400"><span className="inline-flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-emerald-400" />Private account access</span><span>Customer-specific information</span></div>
        </section>

        <section className="flex items-center justify-center px-5 py-12">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-7 shadow-xl shadow-slate-900/5 sm:p-9">
            <div className="mb-7 lg:hidden"><div className="font-extrabold text-slate-900">TDS CLIENT HUB</div><p className="mt-1 text-xs text-slate-500">Secure customer workspace</p></div>
            <div className="mb-6">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#ff6600]">{inviteToken ? 'Account setup' : 'Customer access'}</p>
              <h2 className="mt-2 text-2xl font-extrabold text-slate-900">{inviteToken ? 'Accept your invitation' : 'Sign in to your account'}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">{inviteToken ? 'Set a strong password to activate your customer portal access.' : 'Use the email address that received your customer portal invitation.'}</p>
            </div>

            {notice && <p role="status" className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{notice}</p>}
            {error && <p role="alert" className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}

            {inviteToken ? (
              <form onSubmit={handleAcceptInvitation} className="space-y-4">
                <label className="block text-xs font-semibold text-slate-700">New password
                  <input type="password" required minLength={12} maxLength={128} autoComplete="new-password" value={invitePassword} onChange={(event) => setInvitePassword(event.target.value)} className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm text-slate-900 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100" />
                </label>
                <p className="text-[11px] leading-5 text-slate-500">Use at least 12 characters. Your invitation link can only be used once.</p>
                <button type="submit" disabled={isSubmitting} className="h-11 w-full rounded-xl bg-[#ff6600] text-sm font-bold text-white transition hover:bg-[#e65b00] disabled:opacity-60">{isSubmitting ? 'Activating…' : 'Activate account'}</button>
              </form>
            ) : (
              <form onSubmit={handleLogin} className="space-y-4">
                <label className="block text-xs font-semibold text-slate-700">Work email
                  <input type="email" required autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm text-slate-900 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100" />
                </label>
                <label className="block text-xs font-semibold text-slate-700">Password
                  <input type="password" required autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm text-slate-900 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100" />
                </label>
                <button type="submit" disabled={isSubmitting} className="h-11 w-full rounded-xl bg-[#ff6600] text-sm font-bold text-white transition hover:bg-[#e65b00] disabled:opacity-60">{isSubmitting ? 'Signing in…' : 'Sign in securely'}</button>
              </form>
            )}
            <p className="mt-6 text-center text-[11px] leading-5 text-slate-400">Need portal access? Contact your TDS account manager to request an invitation.</p>
          </div>
        </section>
      </main>
    );
  }

  const activeSection = sections.find((item) => item.id === section);
  const renderRows = (rows: PortalRecord[], fields: { key: string; label: string; render?: (item: PortalRecord) => string }[], emptyMessage: string) => (
    rows.length === 0 ? <EmptyState message={emptyMessage} /> : (
      <div className="overflow-x-auto rounded-2xl border border-slate-200">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead><tr className="bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-500">{fields.map((field) => <th key={field.key} className="px-4 py-3">{field.label}</th>)}</tr></thead>
          <tbody className="divide-y divide-slate-100">{rows.map((item) => <tr key={item.id} className="text-slate-700">{fields.map((field) => <td key={field.key} className="px-4 py-3">{field.render ? field.render(item) : asText(item[field.key])}</td>)}</tr>)}</tbody>
        </table>
      </div>
    )
  );

  return (
    <div className="flex min-h-dvh bg-slate-50 text-slate-900">
      <aside className="hidden w-64 shrink-0 border-r border-slate-200 bg-white p-4 lg:flex lg:flex-col">
        <div className="flex items-center gap-3 px-2 py-3"><div className="grid h-10 w-10 place-items-center rounded-xl bg-[#ff6600] font-black text-white">T</div><div><p className="text-sm font-extrabold">TDS CLIENT HUB</p><p className="text-[10px] text-slate-500">Customer workspace</p></div></div>
        <nav className="mt-8 space-y-1">{sections.map(({ id, label, icon: Icon }) => <button type="button" key={id} onClick={() => setSection(id)} className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition ${section === id ? 'bg-orange-50 text-[#e65b00]' : 'text-slate-600 hover:bg-slate-50'}`}><Icon className="h-4 w-4" />{label}</button>)}</nav>
        <div className="mt-auto rounded-2xl bg-slate-50 p-3"><div className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-emerald-600" /><span className="text-xs font-bold text-slate-800">Private workspace</span></div><p className="mt-2 text-[10px] leading-4 text-slate-500">Your account only shows records associated with {customer.companyName}.</p></div>
      </aside>

      <main className="min-w-0 flex-1">
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur sm:px-6 lg:px-8">
          <div><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#ff6600]">Customer portal</p><p className="text-sm font-bold text-slate-900">{customer.companyName}</p></div>
          <div className="flex items-center gap-3"><span className="hidden text-xs text-slate-500 sm:block">{email}</span><button type="button" onClick={() => void handleLogout()} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"><LogOut className="h-3.5 w-3.5" /><span className="hidden sm:inline">Sign out</span></button></div>
        </header>

        <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
          <nav className="flex gap-2 overflow-x-auto lg:hidden">{sections.map(({ id, label }) => <button key={id} type="button" onClick={() => setSection(id)} className={`shrink-0 rounded-full px-3 py-2 text-xs font-semibold ${section === id ? 'bg-slate-900 text-white' : 'bg-white text-slate-600'}`}>{label}</button>)}</nav>
          {error && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
          {notice && <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{notice}<button type="button" onClick={() => setNotice('')} className="ml-3 text-xs font-bold">Dismiss</button></p>}

          <div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">{activeSection?.label}</p><h1 className="mt-1 text-2xl font-extrabold tracking-tight">{section === 'overview' ? `Welcome, ${customer.primaryContact || customer.companyName}` : activeSection?.label}</h1><p className="mt-1 text-sm text-slate-500">Your projects, commercial records, payments, support, and shared documents.</p></div>{section === 'support' && <button type="button" onClick={() => setShowTicketForm((open) => !open)} className="inline-flex items-center gap-2 rounded-xl bg-[#ff6600] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#e65b00]"><Ticket className="h-4 w-4" />New support request</button>}</div>

          {section === 'overview' && (
            <>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[
                { label: 'Active projects', value: totals.projects, icon: FolderKanban },
                { label: 'Commercial records', value: totals.proposals + totals.invoices + portalData.contracts.length, icon: BriefcaseBusiness },
                { label: 'Payments due', value: totals.invoicesDue, icon: CreditCard },
                { label: 'Open support requests', value: totals.ticketsOpen, icon: Headphones }
              ].map(({ label, value, icon: Icon }) => <div key={label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><span className="grid h-9 w-9 place-items-center rounded-xl bg-orange-50 text-[#e65b00]"><Icon className="h-4 w-4" /></span><p className="mt-4 text-xs font-medium text-slate-500">{label}</p><p className="mt-1 text-2xl font-extrabold">{value}</p></div>)}</div>
              <div className="grid gap-5 xl:grid-cols-2">
                <section className="rounded-2xl border border-slate-200 bg-white p-4"><SectionTitle icon={FolderKanban} title="Project updates" action={() => setSection('projects')} /><div className="mt-4">{renderRows(portalData.projects.slice(0, 4), [{ key: 'name', label: 'Project' }, { key: 'status', label: 'Status' }, { key: 'updatedAt', label: 'Updated', render: (item) => formatDate(item.updatedAt) }], 'Project updates will appear here once shared with your account.')}</div></section>
                <section className="rounded-2xl border border-slate-200 bg-white p-4"><SectionTitle icon={MessageSquareText} title="Support requests" action={() => setSection('support')} /><div className="mt-4">{renderRows(portalData.supportTickets.slice(0, 4), [{ key: 'ticketNo', label: 'Ticket' }, { key: 'subject', label: 'Subject' }, { key: 'status', label: 'Status' }], 'No support requests have been created.')}</div></section>
              </div>
            </>
          )}

          {section === 'projects' && <section className="rounded-2xl border border-slate-200 bg-white p-4"><p className="mb-4 text-sm text-slate-500">Current delivery work and project milestones shared with your account.</p>{renderRows(portalData.projects, [{ key: 'name', label: 'Project' }, { key: 'status', label: 'Status' }, { key: 'owner', label: 'Project lead' }, { key: 'startDate', label: 'Start', render: (item) => formatDate(item.startDate) }, { key: 'targetDate', label: 'Target', render: (item) => formatDate(item.targetDate) }, { key: 'progress', label: 'Progress', render: (item) => `${Number(item.progress) || 0}%` }], 'No projects have been shared with this customer account yet.')}</section>}

          {section === 'commercials' && <div className="space-y-5"><section className="rounded-2xl border border-slate-200 bg-white p-4"><h2 className="mb-4 text-base font-bold">Proposals & quotations</h2>{renderRows(portalData.proposals, [{ key: 'proposalNumber', label: 'Document' }, { key: 'title', label: 'Title' }, { key: 'status', label: 'Status' }, { key: 'amount', label: 'Amount', render: (item) => formatAmount(item.amount) }, { key: 'validUntil', label: 'Valid until', render: (item) => formatDate(item.validUntil) }], 'No commercial proposals are available.')}</section><section className="rounded-2xl border border-slate-200 bg-white p-4"><h2 className="mb-4 text-base font-bold">Contracts & renewals</h2>{renderRows(portalData.contracts, [{ key: 'contractNo', label: 'Contract' }, { key: 'service', label: 'Service' }, { key: 'status', label: 'Status' }, { key: 'annualValue', label: 'Annual value', render: (item) => formatAmount(item.annualValue) }, { key: 'expiryDate', label: 'Expires', render: (item) => formatDate(item.expiryDate) }], 'No contracts have been shared with this account.')}</section></div>}

          {section === 'payments' && <section className="rounded-2xl border border-slate-200 bg-white p-4"><p className="mb-4 text-sm text-slate-500">Invoice balances and payment status. Contact your account manager to arrange settlement.</p>{renderRows(portalData.invoices, [{ key: 'invoiceNo', label: 'Invoice' }, { key: 'issueDate', label: 'Issued', render: (item) => formatDate(item.issueDate) }, { key: 'dueDate', label: 'Due', render: (item) => formatDate(item.dueDate) }, { key: 'amount', label: 'Invoice total', render: (item) => formatAmount(item.amount) }, { key: 'paidAmount', label: 'Paid', render: (item) => formatAmount(item.paidAmount) }, { key: 'status', label: 'Status' }], 'No invoices or payment records are available.')}</section>}

          {section === 'support' && <div className="space-y-4">{showTicketForm && <form onSubmit={handleCreateTicket} className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-4 sm:grid-cols-2"><label className="text-xs font-semibold text-slate-700">Subject<input required minLength={4} maxLength={160} value={ticketForm.subject} onChange={(event) => setTicketForm((current) => ({ ...current, subject: event.target.value }))} className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm font-normal" /></label><label className="text-xs font-semibold text-slate-700">Category<select value={ticketForm.category} onChange={(event) => setTicketForm((current) => ({ ...current, category: event.target.value }))} className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-normal"><option>Technical Support</option><option>Project</option><option>Billing</option><option>Access</option><option>Other</option></select></label><label className="text-xs font-semibold text-slate-700">Priority<select value={ticketForm.priority} onChange={(event) => setTicketForm((current) => ({ ...current, priority: event.target.value }))} className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-normal"><option>Low</option><option>Normal</option><option>High</option><option>Urgent</option></select></label><label className="text-xs font-semibold text-slate-700 sm:col-span-2">Description<textarea required minLength={10} maxLength={5000} rows={4} value={ticketForm.description} onChange={(event) => setTicketForm((current) => ({ ...current, description: event.target.value }))} className="mt-1.5 w-full rounded-lg border border-slate-200 p-3 text-sm font-normal" /></label><div className="flex justify-end gap-2 sm:col-span-2"><button type="button" onClick={() => setShowTicketForm(false)} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold">Cancel</button><button disabled={isSubmitting} className="rounded-lg bg-[#ff6600] px-4 py-2 text-xs font-bold text-white disabled:opacity-60">{isSubmitting ? 'Sending…' : 'Submit request'}</button></div></form>}<section className="rounded-2xl border border-slate-200 bg-white p-4">{renderRows(portalData.supportTickets, [{ key: 'ticketNo', label: 'Ticket' }, { key: 'subject', label: 'Subject' }, { key: 'category', label: 'Category' }, { key: 'priority', label: 'Priority' }, { key: 'status', label: 'Status' }, { key: 'createdAt', label: 'Created', render: (item) => formatDate(item.createdAt) }], 'No support requests yet. Use “New support request” to contact the service team.')}</section></div>}

          {section === 'documents' && <section className="rounded-2xl border border-slate-200 bg-white p-4"><p className="mb-4 text-sm text-slate-500">Files your TDS team has shared with your organization.</p>{portalData.documents.length === 0 ? <EmptyState message="No shared documents are available yet." /> : <div className="divide-y divide-slate-100">{portalData.documents.map((document) => <div key={document.id} className="flex flex-wrap items-center justify-between gap-3 py-3"><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-orange-50 text-[#e65b00]"><FileText className="h-4 w-4" /></span><div><p className="text-sm font-bold">{asText(document.name)}</p><p className="mt-1 text-xs text-slate-500">{asText(document.category)} · {formatDate(document.updatedAt)}</p></div></div><button type="button" onClick={() => void downloadPortalDocument(document)} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50">Open file</button></div>)}</div>}</section>}
        </div>
        <footer className="border-t border-slate-200 bg-white px-4 py-4 text-center text-[11px] text-slate-400">TDS Customer Portal · Your account information is private to your organization</footer>
      </main>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-10 text-center"><CheckCircle2 className="mx-auto h-7 w-7 text-slate-300" /><p className="mt-3 text-sm font-medium text-slate-500">{message}</p></div>;
}

function SectionTitle({ icon: Icon, title, action }: { icon: typeof FolderKanban; title: string; action: () => void }) {
  return <div className="flex items-center justify-between"><h2 className="flex items-center gap-2 text-base font-bold"><Icon className="h-4 w-4 text-[#ff6600]" />{title}</h2><button type="button" onClick={action} className="text-xs font-semibold text-[#e65b00]">View all</button></div>;
}
