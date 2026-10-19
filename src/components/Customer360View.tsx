import React, { useEffect, useState } from 'react';
import {
  ArrowLeft, Building2, CalendarClock, CreditCard, Download, ExternalLink, FilePlus2,
  FileText, FolderLock, Mail, MailPlus, MessageCircle, Pencil, Phone, ReceiptIndianRupee,
  TrendingUp, UserRound
} from 'lucide-react';
import type { Activity, AMCRenewal, Customer, Invoice, Lead, Opportunity, PaymentRecord, Proposal } from '../types/crm';
import { getSharedDocumentDownloadUrl, listSharedDocuments, SharedDocument } from '../data/sharedDocuments';
import { formatINR } from '../utils/currency';

type CustomerTab = 'Overview' | 'Transactions' | 'Sales' | 'Activities' | 'Documents';

interface Customer360ViewProps {
  customer: Customer;
  invoices: Invoice[];
  payments: PaymentRecord[];
  leads: Lead[];
  activities: Activity[];
  opportunities: Opportunity[];
  proposals: Proposal[];
  contracts: AMCRenewal[];
  onBack: () => void;
  onEdit: () => void;
  onOpenDocuments: () => void;
  onOpenPayments: () => void;
  onCreateInvoice: () => void;
  onCreateQuotation: () => void;
  onOpenWhatsApp: () => void;
  onInvitePortal: () => void;
}

export const Customer360View: React.FC<Customer360ViewProps> = ({
  customer, invoices, payments, leads, activities, opportunities, proposals, contracts,
  onBack, onEdit, onOpenDocuments, onOpenPayments, onCreateInvoice, onCreateQuotation,
  onOpenWhatsApp, onInvitePortal
}) => {
  const [activeTab, setActiveTab] = useState<CustomerTab>('Overview');
  const [documents, setDocuments] = useState<SharedDocument[]>([]);
  const [documentError, setDocumentError] = useState('');

  useEffect(() => {
    let active = true;
    listSharedDocuments()
      .then((items) => { if (active) setDocuments(items); })
      .catch((reason: unknown) => { if (active) setDocumentError(reason instanceof Error ? reason.message : 'Could not load customer documents.'); });
    return () => { active = false; };
  }, [customer.id]);

  const normalize = (value: string) => value.trim().toLocaleLowerCase();
  const customerInvoices = invoices.filter((invoice) => normalize(invoice.customer) === normalize(customer.companyName));
  const customerPayments = payments.filter((payment) => normalize(payment.customer) === normalize(customer.companyName));
  const customerLeads = leads.filter((lead) => normalize(lead.company) === normalize(customer.companyName));
  const customerOpportunities = opportunities.filter((opportunity) => normalize(opportunity.company) === normalize(customer.companyName));
  const relatedLeadIds = new Set([...customerLeads.map((lead) => lead.id), ...customerOpportunities.map((opportunity) => opportunity.leadId)]);
  const customerActivities = activities
    .filter((activity) => normalize(activity.company ?? '') === normalize(customer.companyName) || Boolean(activity.leadId && relatedLeadIds.has(activity.leadId)))
    .sort((left, right) => `${right.date} ${right.time}`.localeCompare(`${left.date} ${left.time}`));
  const customerProposals = proposals.filter((proposal) => relatedLeadIds.has(proposal.leadId));
  const customerContracts = contracts.filter((contract) => normalize(contract.customer) === normalize(customer.companyName));
  const customerDocuments = documents.filter((document) => [customer.companyName, customer.customerCode].map(normalize).includes(normalize(document.client)));
  const activeInvoices = customerInvoices.filter((invoice) => invoice.status !== 'Voided');
  const totalInvoiced = activeInvoices.reduce((sum, invoice) => sum + invoice.amount, 0);
  const totalCollected = activeInvoices.reduce((sum, invoice) => sum + invoice.paidAmount, 0);
  const outstanding = Math.max(0, totalInvoiced - totalCollected);
  const overdue = activeInvoices.filter((invoice) => invoice.status === 'Overdue').reduce((sum, invoice) => sum + invoice.amount - invoice.paidAmount, 0);
  const openPipeline = customerOpportunities.filter((item) => !['Won', 'Lost'].includes(item.stage)).reduce((sum, item) => sum + item.amount, 0);
  const accountHealth = overdue > 0 ? 'Attention needed' : customer.amcStatus === 'Expired' ? 'Renewal risk' : 'Healthy';

  const handleDownload = async (document: SharedDocument) => {
    try {
      const url = await getSharedDocumentDownloadUrl(document.id);
      window.open(url, '_blank', 'noopener,noreferrer');
      setDocumentError('');
    } catch (reason) {
      setDocumentError(reason instanceof Error ? reason.message : 'Could not download customer document.');
    }
  };

  const safeInternalDocumentLink = customer.internalDocumentLink && /^https?:\/\//i.test(customer.internalDocumentLink) ? customer.internalDocumentLink : '';
  const tabs: Array<{ name: CustomerTab; count?: number }> = [
    { name: 'Overview' },
    { name: 'Transactions', count: customerInvoices.length + customerPayments.length },
    { name: 'Sales', count: customerLeads.length + customerOpportunities.length + customerProposals.length },
    { name: 'Activities', count: customerActivities.length },
    { name: 'Documents', count: customerDocuments.length }
  ];

  return <div className="mx-auto max-w-7xl space-y-4 sm:space-y-5">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <button type="button" onClick={onBack} className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100"><ArrowLeft className="h-4 w-4" /> Customers</button>
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={onOpenWhatsApp} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:border-emerald-300 hover:text-emerald-700"><MessageCircle className="h-3.5 w-3.5" /> WhatsApp</button>
        <button type="button" onClick={onInvitePortal} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:border-orange-300 hover:text-orange-700"><MailPlus className="h-3.5 w-3.5" /> Portal Access</button>
        <button type="button" onClick={onEdit} className="inline-flex items-center gap-2 rounded-lg bg-[#ff6600] px-3.5 py-2 text-xs font-semibold text-white hover:bg-[#e65c00]"><Pencil className="h-3.5 w-3.5" /> Edit</button>
      </div>
    </div>

    <header className="overflow-hidden rounded-2xl border border-slate-800 bg-[#111827] shadow-lg">
      <div className="flex flex-col justify-between gap-5 p-5 sm:p-6 lg:flex-row lg:items-center">
        <div className="flex min-w-0 items-start gap-4">
          <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-orange-500 to-amber-400 text-xl font-extrabold text-white shadow-lg">{customer.companyName.charAt(0).toUpperCase()}</span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2"><h1 className="truncate text-xl font-extrabold text-white sm:text-2xl">{customer.companyName}</h1><span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${accountHealth === 'Healthy' ? 'bg-emerald-500/15 text-emerald-300' : 'bg-amber-500/15 text-amber-300'}`}>{accountHealth}</span></div>
            <p className="mt-1 text-xs text-slate-400">{customer.customerCode} · {customer.customerType} · {customer.industry} · {customer.city}</p>
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs text-slate-300">
              <a href={`mailto:${customer.email}`} className="inline-flex items-center gap-1.5 hover:text-white"><Mail className="h-3.5 w-3.5" /> {customer.email || 'No email'}</a>
              <a href={`tel:${customer.phone}`} className="inline-flex items-center gap-1.5 hover:text-white"><Phone className="h-3.5 w-3.5" /> {customer.phone || 'No phone'}</a>
              <span className="inline-flex items-center gap-1.5"><UserRound className="h-3.5 w-3.5" /> {customer.relationshipManager || 'Unassigned'}</span>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={onCreateQuotation} className="inline-flex items-center gap-2 rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-700"><FilePlus2 className="h-4 w-4 text-cyan-300" /> New Quotation</button>
          <button type="button" onClick={onCreateInvoice} className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-500"><ReceiptIndianRupee className="h-4 w-4" /> New Invoice</button>
        </div>
      </div>
      <nav className="flex overflow-x-auto border-t border-slate-800 px-3 sm:px-5" aria-label="Customer record sections">
        {tabs.map((tab) => <button key={tab.name} type="button" onClick={() => setActiveTab(tab.name)} className={`whitespace-nowrap border-b-2 px-3 py-3 text-xs font-semibold transition ${activeTab === tab.name ? 'border-[#ff6600] text-white' : 'border-transparent text-slate-400 hover:text-slate-200'}`}>{tab.name}{tab.count !== undefined && <span className="ml-1.5 rounded-full bg-slate-700 px-1.5 py-0.5 text-[9px]">{tab.count}</span>}</button>)}
      </nav>
    </header>

    <section className="grid grid-cols-2 gap-3 lg:grid-cols-5">
      <Metric label="Lifetime value" value={formatINR(customer.totalDealsValue)} icon={<TrendingUp />} />
      <Metric label="Total invoiced" value={formatINR(totalInvoiced)} icon={<FileText />} />
      <Metric label="Collected" value={formatINR(totalCollected)} accent="emerald" icon={<CreditCard />} />
      <Metric label="Receivables" value={formatINR(outstanding)} accent={outstanding ? 'amber' : 'default'} icon={<ReceiptIndianRupee />} />
      <Metric label="Open pipeline" value={formatINR(openPipeline)} icon={<TrendingUp />} />
    </section>

    {activeTab === 'Overview' && <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
      <Card title="Account information" className="xl:col-span-2">
        <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
          <Detail label="Primary contact" value={customer.primaryContact} /><Detail label="Customer GSTIN" value={customer.customerGstin || 'Unregistered'} mono /><Detail label="Registered state / UT" value={customer.state || 'Not provided'} /><Detail label="Customer type" value={customer.customerType} /><Detail label="Industry" value={customer.industry} /><Detail label="Location" value={customer.city} /><Detail label="Relationship manager" value={customer.relationshipManager} /><Detail label="Internal record ID" value={customer.id} mono />
        </dl>
        {customer.billingAddress && <div className="mt-5 border-t border-slate-100 pt-4"><p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">GST billing address</p><p className="mt-1 whitespace-pre-wrap text-xs font-semibold text-slate-800">{customer.billingAddress}</p></div>}
        {safeInternalDocumentLink && <a href={safeInternalDocumentLink} target="_blank" rel="noreferrer" className="mt-5 inline-flex items-center gap-2 text-xs font-semibold text-[#c2410c] hover:underline"><ExternalLink className="h-3.5 w-3.5" /> Open internal record</a>}
      </Card>
      <Card title="Contract & renewal">
        <dl className="space-y-4"><Detail label="AMC status" value={customer.amcStatus} /><Detail label="Renewal date" value={formatDate(customer.renewalDate)} /><Detail label="Active contracts" value={String(customerContracts.filter((item) => item.status === 'Active').length || customer.activeContracts)} /><Detail label="Overdue receivables" value={formatINR(overdue)} /></dl>
      </Card>
      <Card title="Recent activity" className="xl:col-span-2">
        {customerActivities.length ? <Timeline activities={customerActivities.slice(0, 5)} /> : <Empty>No customer activity recorded.</Empty>}
      </Card>
      <Card title="Active services">
        {customerContracts.length ? <div className="space-y-3">{customerContracts.slice(0, 4).map((contract) => <div key={contract.id} className="rounded-lg border border-slate-100 p-3"><p className="text-xs font-bold text-slate-800">{contract.service || contract.contractNo}</p><p className="mt-1 text-[11px] text-slate-500">{formatINR(contract.annualValue)} / year · {contract.status}</p><p className="mt-1 text-[10px] text-slate-400">Expires {formatDate(contract.expiryDate)}</p></div>)}</div> : <Empty>No service contracts linked.</Empty>}
      </Card>
    </div>}

    {activeTab === 'Transactions' && <div className="space-y-4">
      <Card title="Invoices and receivables" action={<button type="button" onClick={onOpenPayments} className="text-xs font-semibold text-[#c2410c] hover:underline">Open payment workspace</button>}>
        {customerInvoices.length ? <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-xs"><thead><tr className="border-b border-slate-200 text-[10px] uppercase text-slate-500"><th className="py-2 pr-3">Invoice</th><th className="px-3 py-2">Issue / Due</th><th className="px-3 py-2 text-right">Amount</th><th className="px-3 py-2 text-right">Paid</th><th className="px-3 py-2 text-right">Balance</th><th className="py-2 pl-3">Status</th></tr></thead><tbody className="divide-y divide-slate-100">{customerInvoices.map((invoice) => <tr key={invoice.id}><td className="py-3 pr-3 font-mono font-bold text-[#c2410c]">{invoice.invoiceNo}<br /><span className="font-sans text-[10px] font-normal text-slate-400">{invoice.type}</span></td><td className="px-3 py-3 text-slate-600">{formatDate(invoice.issueDate)}<br /><span className="text-[10px] text-slate-400">Due {formatDate(invoice.dueDate)}</span></td><td className="px-3 py-3 text-right font-mono">{formatINR(invoice.amount)}</td><td className="px-3 py-3 text-right font-mono text-emerald-600">{formatINR(invoice.paidAmount)}</td><td className="px-3 py-3 text-right font-mono font-bold text-amber-600">{formatINR(Math.max(0, invoice.amount - invoice.paidAmount))}</td><td className="py-3 pl-3"><Status value={invoice.status} /></td></tr>)}</tbody></table></div> : <Empty>No invoices linked.</Empty>}
      </Card>
      <Card title="Payments received">
        {customerPayments.length ? <div className="overflow-x-auto"><table className="w-full min-w-[700px] text-left text-xs"><thead><tr className="border-b border-slate-200 text-[10px] uppercase text-slate-500"><th className="py-2 pr-3">Receipt</th><th className="px-3 py-2">Date</th><th className="px-3 py-2">Invoice</th><th className="px-3 py-2">Mode / Reference</th><th className="py-2 pl-3 text-right">Amount</th></tr></thead><tbody className="divide-y divide-slate-100">{customerPayments.map((payment) => <tr key={payment.id}><td className="py-3 pr-3 font-mono font-bold text-emerald-600">{payment.paymentNumber}</td><td className="px-3 py-3">{formatDate(payment.paymentDate)}</td><td className="px-3 py-3 font-mono">{payment.invoiceNo}</td><td className="px-3 py-3">{payment.mode}<br /><span className="text-[10px] text-slate-400">{payment.reference}</span></td><td className="py-3 pl-3 text-right font-mono font-bold">{formatINR(payment.amount)}</td></tr>)}</tbody></table></div> : <Empty>No payments recorded.</Empty>}
      </Card>
    </div>}

    {activeTab === 'Sales' && <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
      <Card title="Opportunities"><RecordGrid empty="No opportunities linked.">{customerOpportunities.map((item) => <Record key={item.id} eyebrow={`${item.stage} · ${item.probability}% probability`} title={item.name} detail={`${formatINR(item.amount)} · closes ${formatDate(item.expectedClose)}`} />)}</RecordGrid></Card>
      <Card title="Quotations and proposals"><RecordGrid empty="No quotations or proposals linked.">{customerProposals.map((item) => <Record key={item.id} eyebrow={`${item.proposalNumber} · ${item.status}`} title={item.title} detail={`${formatINR(item.amount)} · valid until ${formatDate(item.validUntil)}`} />)}</RecordGrid></Card>
      <Card title="Source leads" className="xl:col-span-2"><RecordGrid empty="No originating leads linked.">{customerLeads.map((item) => <Record key={item.id} eyebrow={`${item.id} · ${item.status}`} title={item.name} detail={`${item.interestedService || 'No service selected'} · ${formatINR(item.estimatedBudget)}`} />)}</RecordGrid></Card>
    </div>}

    {activeTab === 'Activities' && <Card title="Customer timeline">{customerActivities.length ? <Timeline activities={customerActivities} /> : <Empty>No activity linked.</Empty>}</Card>}

    {activeTab === 'Documents' && <Card title="Internal documents" action={<button type="button" onClick={onOpenDocuments} className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#c2410c] hover:underline"><ExternalLink className="h-3.5 w-3.5" /> Open repository</button>}>
      {documentError ? <p role="alert" className="rounded-lg bg-rose-50 p-3 text-xs text-rose-700">{documentError}</p> : customerDocuments.length ? <div className="overflow-x-auto"><table className="w-full min-w-[620px] text-left text-xs"><thead><tr className="border-b border-slate-200 text-[10px] uppercase text-slate-500"><th className="py-2 pr-3">Document</th><th className="px-3 py-2">Category</th><th className="px-3 py-2">Updated</th><th className="px-3 py-2">Size</th><th className="py-2 pl-3 text-right">Action</th></tr></thead><tbody className="divide-y divide-slate-100">{customerDocuments.map((document) => <tr key={document.id}><td className="py-3 pr-3 font-semibold">{document.name}</td><td className="px-3 py-3">{document.category}</td><td className="px-3 py-3">{formatDate(document.updatedAt)}</td><td className="px-3 py-3 font-mono">{formatFileSize(document.size)}</td><td className="py-3 pl-3 text-right"><button type="button" onClick={() => handleDownload(document)} className="inline-flex items-center gap-1.5 font-semibold text-[#c2410c]"><Download className="h-3.5 w-3.5" /> Download</button></td></tr>)}</tbody></table></div> : <Empty>No customer documents tagged with {customer.companyName} or {customer.customerCode}.</Empty>}
    </Card>}
  </div>;
};

const Metric = ({ label, value, icon, accent = 'default' }: { label: string; value: string; icon: React.ReactElement; accent?: 'default' | 'emerald' | 'amber' }) => <div className="rounded-xl border border-slate-200 bg-white p-4"><div className="flex items-center justify-between"><p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">{label}</p><span className={`[&>svg]:h-4 [&>svg]:w-4 ${accent === 'emerald' ? 'text-emerald-500' : accent === 'amber' ? 'text-amber-500' : 'text-slate-400'}`}>{icon}</span></div><p className="mt-2 break-words text-lg font-extrabold text-slate-900">{value}</p></div>;
const Card = ({ title, action, className = '', children }: { title: string; action?: React.ReactNode; className?: string; children: React.ReactNode }) => <section className={`rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5 ${className}`}><div className="mb-4 flex items-center justify-between gap-3"><h2 className="text-sm font-bold text-slate-900">{title}</h2>{action}</div>{children}</section>;
const Detail = ({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) => <div><dt className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{label}</dt><dd className={`mt-1 break-words text-xs font-semibold text-slate-800 ${mono ? 'font-mono' : ''}`}>{value || 'Not provided'}</dd></div>;
const Empty = ({ children }: { children: React.ReactNode }) => <p className="rounded-lg bg-slate-50 p-4 text-xs text-slate-500">{children}</p>;
const Status = ({ value }: { value: string }) => <span className={`rounded-full px-2 py-1 text-[10px] font-bold ${value === 'Paid' || value === 'Accepted' ? 'bg-emerald-50 text-emerald-700' : value === 'Overdue' || value === 'Declined' ? 'bg-rose-50 text-rose-700' : 'bg-amber-50 text-amber-700'}`}>{value}</span>;
const Timeline = ({ activities }: { activities: Activity[] }) => <ol className="relative ml-2 border-l border-slate-200 pl-5">{activities.map((activity) => <li key={activity.id} className="relative pb-5 last:pb-0"><span className="absolute -left-[25px] top-1.5 h-2 w-2 rounded-full bg-[#ff6600] ring-4 ring-orange-50" /><div className="flex flex-col justify-between gap-1 sm:flex-row sm:gap-4"><div><p className="text-xs font-semibold text-slate-800">{activity.title}</p>{activity.description && <p className="mt-1 text-xs text-slate-500">{activity.description}</p>}<p className="mt-1 text-[10px] text-slate-400">{activity.type} · {activity.user} · {activity.status}</p></div><p className="whitespace-nowrap font-mono text-[10px] text-slate-500">{activity.date} · {activity.time}</p></div></li>)}</ol>;
const RecordGrid = ({ children, empty }: { children: React.ReactNode; empty: string }) => React.Children.count(children) ? <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">{children}</div> : <Empty>{empty}</Empty>;
const Record = ({ eyebrow, title, detail }: { eyebrow: string; title: string; detail: string }) => <article className="rounded-lg border border-slate-100 p-3"><p className="text-[10px] font-bold uppercase tracking-wide text-[#c2410c]">{eyebrow}</p><p className="mt-1 text-xs font-semibold text-slate-800">{title}</p><p className="mt-1 text-[11px] text-slate-500">{detail}</p></article>;
const formatDate = (value: string) => { if (!value) return 'Not provided'; const date = new Date(value); return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }); };
const formatFileSize = (bytes: number) => bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
