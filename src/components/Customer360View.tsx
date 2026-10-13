import React, { useEffect, useState } from 'react';
import { ArrowLeft, Building2, Download, ExternalLink, FileText, FolderLock, Pencil } from 'lucide-react';
import type { Activity, Customer, Invoice, Lead, AMCRenewal, Opportunity, Proposal } from '../types/crm';
import { getSharedDocumentDownloadUrl, listSharedDocuments, SharedDocument } from '../data/sharedDocuments';
import { formatINR } from '../utils/currency';

interface Customer360ViewProps {
  customer: Customer;
  invoices: Invoice[];
  leads: Lead[];
  activities: Activity[];
  opportunities: Opportunity[];
  proposals: Proposal[];
  contracts: AMCRenewal[];
  onBack: () => void;
  onEdit: () => void;
  onOpenDocuments: () => void;
}

export const Customer360View: React.FC<Customer360ViewProps> = ({
  customer,
  invoices,
  leads,
  activities,
  opportunities,
  proposals,
  contracts,
  onBack,
  onEdit,
  onOpenDocuments
}) => {
  const [documents, setDocuments] = useState<SharedDocument[]>([]);
  const [documentError, setDocumentError] = useState('');

  useEffect(() => {
    let active = true;
    listSharedDocuments()
      .then((items) => {
        if (active) setDocuments(items);
      })
      .catch((reason: unknown) => {
        if (active) setDocumentError(reason instanceof Error ? reason.message : 'Could not load customer documents.');
      });
    return () => { active = false; };
  }, [customer.id]);

  const customerInvoices = invoices.filter((invoice) => invoice.customer === customer.companyName);
  const customerLeads = leads.filter((lead) => lead.company === customer.companyName);
  const customerOpportunities = opportunities.filter((opportunity) => opportunity.company === customer.companyName);
  const relatedLeadIds = new Set([
    ...customerLeads.map((lead) => lead.id),
    ...customerOpportunities.map((opportunity) => opportunity.leadId)
  ]);
  const customerActivities = activities
    .filter((activity) => activity.company === customer.companyName || (activity.leadId && relatedLeadIds.has(activity.leadId)))
    .sort((left, right) => `${right.date} ${right.time}`.localeCompare(`${left.date} ${left.time}`));
  const customerProposals = proposals.filter((proposal) => relatedLeadIds.has(proposal.leadId));
  const customerContracts = contracts.filter((contract) => contract.customer === customer.companyName);
  const customerDocuments = documents.filter((document) => {
    const client = document.client.trim().toLocaleLowerCase();
    return client === customer.companyName.trim().toLocaleLowerCase() ||
      client === customer.customerCode.trim().toLocaleLowerCase();
  });
  const outstanding = customerInvoices
    .filter((invoice) => invoice.status !== 'Voided')
    .reduce((sum, invoice) => sum + invoice.amount - invoice.paidAmount, 0);

  const handleDownload = async (sharedDocument: SharedDocument) => {
    try {
      const url = await getSharedDocumentDownloadUrl(sharedDocument.id);
      const link = document.createElement('a');
      link.href = url;
      link.target = '_blank';
      link.rel = 'noreferrer';
      link.click();
      setDocumentError('');
    } catch (reason) {
      setDocumentError(reason instanceof Error ? reason.message : 'Could not download customer document.');
    }
  };

  const safeInternalDocumentLink = customer.internalDocumentLink && /^https?:\/\//i.test(customer.internalDocumentLink)
    ? customer.internalDocumentLink
    : '';

  return (
    <div className="mx-auto max-w-6xl space-y-4 sm:space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button type="button" onClick={onBack} className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100">
          <ArrowLeft className="h-4 w-4" /> Customers
        </button>
        <button type="button" onClick={onEdit} className="inline-flex items-center gap-2 rounded-lg bg-[#ff6600] px-3.5 py-2 text-xs font-semibold text-white hover:bg-[#e65c00]">
          <Pencil className="h-3.5 w-3.5" /> Edit customer
        </button>
      </div>

      <header className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <div className="flex items-start gap-3 sm:gap-4">
          <span className="rounded-xl bg-orange-50 p-3 text-[#ff6600]">
            <Building2 className="h-6 w-6" aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-lg font-extrabold text-slate-900 sm:text-xl">{customer.companyName}</h1>
              <span className="rounded-full bg-orange-50 px-2.5 py-1 text-[10px] font-bold text-orange-800">{customer.customerType}</span>
            </div>
            <p className="mt-1 text-xs text-slate-500">{customer.customerCode} <span className="px-1">·</span> {customer.industry} <span className="px-1">·</span> {customer.city}</p>
          </div>
        </div>
      </header>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Lifetime deal value" value={formatINR(customer.totalDealsValue)} />
        <Metric label="Open invoice balance" value={formatINR(outstanding)} />
        <Metric label="Active contracts" value={String(customer.activeContracts)} />
        <Metric label="AMC status" value={customer.amcStatus} />
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 xl:col-span-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-sm font-bold text-slate-900">Customer information</h2>
            {safeInternalDocumentLink && (
              <a href={safeInternalDocumentLink} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-lg border border-orange-200 bg-orange-50 px-3 py-2 text-xs font-semibold text-orange-800 hover:bg-orange-100">
                <ExternalLink className="h-3.5 w-3.5" /> Open internal document
              </a>
            )}
          </div>
          <dl className="mt-4 grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-4">
            <CustomerDetail label="Customer code" value={customer.customerCode} mono />
            <CustomerDetail label="Internal record ID" value={customer.id} mono />
            <CustomerDetail label="Customer type" value={customer.customerType} />
            <CustomerDetail label="Industry" value={customer.industry} />
            <CustomerDetail label="Primary contact" value={customer.primaryContact} />
            <CustomerDetail label="Email" value={customer.email} href={`mailto:${customer.email}`} />
            <CustomerDetail label="Phone" value={customer.phone} href={`tel:${customer.phone}`} />
            <CustomerDetail label="City / location" value={customer.city} />
            <CustomerDetail label="Relationship manager" value={customer.relationshipManager} />
            <CustomerDetail label="AMC status" value={customer.amcStatus} />
            <CustomerDetail label="Renewal date" value={formatDate(customer.renewalDate)} />
            <CustomerDetail label="Active contracts" value={String(customer.activeContracts)} />
            <CustomerDetail label="Lifetime deal value" value={formatINR(customer.totalDealsValue)} />
            <CustomerDetail label="Open invoice balance" value={formatINR(outstanding)} />
            <CustomerDetail label="Internal document link" value={customer.internalDocumentLink || 'Not added'} href={safeInternalDocumentLink || undefined} />
          </dl>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 xl:col-span-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900"><FolderLock className="h-4 w-4 text-[#ff6600]" /> Internal documents</h2>
              <p className="mt-1 text-xs text-slate-500">Files in the repository tagged with this customer name or code.</p>
            </div>
            <button type="button" onClick={onOpenDocuments} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:border-orange-200 hover:bg-orange-50 hover:text-orange-800">
              <ExternalLink className="h-3.5 w-3.5" /> Open repository
            </button>
          </div>
          {documentError ? (
            <p role="alert" className="mt-3 rounded-lg bg-rose-50 p-3 text-xs font-medium text-rose-700">{documentError}</p>
          ) : customerDocuments.length ? (
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[620px] text-left text-xs">
                <thead><tr className="border-b border-slate-200 text-[10px] uppercase text-slate-500"><th className="py-2 pr-3">Document</th><th className="px-3 py-2">Category</th><th className="px-3 py-2">Updated</th><th className="px-3 py-2">Size</th><th className="py-2 pl-3 text-right">Link</th></tr></thead>
                <tbody className="divide-y divide-slate-100">
                  {customerDocuments.map((storedDocument) => (
                    <tr key={storedDocument.id}>
                      <td className="py-3 pr-3 font-semibold text-slate-800">{storedDocument.name}</td>
                      <td className="px-3 py-3 text-slate-600">{storedDocument.category}</td>
                      <td className="px-3 py-3 text-slate-600">{formatDate(storedDocument.updatedAt)}</td>
                      <td className="px-3 py-3 font-mono text-slate-500">{formatFileSize(storedDocument.size)}</td>
                      <td className="py-3 pl-3 text-right"><button type="button" onClick={() => handleDownload(storedDocument)} className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 font-semibold text-[#c2410c] hover:bg-orange-50" aria-label={`Download ${storedDocument.name}`}><Download className="h-3.5 w-3.5" /> Download</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <EmptyMessage>No documents are linked yet. Open the repository and tag a file with “{customer.companyName}” or “{customer.customerCode}”.</EmptyMessage>}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 xl:col-span-2">
          <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900"><FileText className="h-4 w-4 text-[#ff6600]" /> Invoices and payments</h2>
          {customerInvoices.length ? (
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[560px] text-left text-xs">
                <thead><tr className="border-b border-slate-200 text-[10px] uppercase text-slate-500"><th className="py-2 pr-3">Invoice</th><th className="py-2 px-3">Type</th><th className="py-2 px-3 text-right">Amount</th><th className="py-2 px-3 text-right">Paid</th><th className="py-2 pl-3">Status</th></tr></thead>
                <tbody className="divide-y divide-slate-100">
                  {customerInvoices.map((invoice) => <tr key={invoice.id}><td className="py-3 pr-3 font-mono font-semibold">{invoice.invoiceNo}</td><td className="px-3">{invoice.type}</td><td className="px-3 text-right font-mono">{formatINR(invoice.amount)}</td><td className="px-3 text-right font-mono">{formatINR(invoice.paidAmount)}</td><td className="py-3 pl-3">{invoice.status}</td></tr>)}
                </tbody>
              </table>
            </div>
          ) : <EmptyMessage>No invoices are linked to this customer yet.</EmptyMessage>}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
          <h2 className="text-sm font-bold text-slate-900">Service contracts</h2>
          {customerContracts.length ? <ul className="mt-3 space-y-3">{customerContracts.map((contract) => <li key={contract.id} className="border-t border-slate-100 pt-3"><p className="text-xs font-semibold text-slate-800">{contract.contractNo}</p><p className="mt-1 text-xs text-slate-500">{contract.service}</p><p className="mt-1 text-[11px] text-slate-500">{formatINR(contract.annualValue)} / year · {contract.status}</p></li>)}</ul> : <EmptyMessage>No contracts are linked to this customer yet.</EmptyMessage>}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 xl:col-span-2">
          <h2 className="text-sm font-bold text-slate-900">Related leads</h2>
          {customerLeads.length ? <ul className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">{customerLeads.map((lead) => <li key={lead.id} className="rounded-lg border border-slate-100 p-3"><p className="text-xs font-semibold text-slate-800">{lead.name}</p><p className="mt-1 text-[11px] text-slate-500">{lead.id} · {lead.status}</p><p className="mt-1 text-[11px] text-slate-500">Next follow-up: {lead.nextFollowUp}</p></li>)}</ul> : <EmptyMessage>No related leads found.</EmptyMessage>}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 xl:col-span-3">
          <h2 className="text-sm font-bold text-slate-900">Customer activity</h2>
          {customerActivities.length ? (
            <ol className="mt-3 divide-y divide-slate-100">
              {customerActivities.map((activity) => (
                <li key={activity.id} className="grid grid-cols-1 gap-1 py-3 sm:grid-cols-[1fr_auto] sm:gap-4">
                  <div>
                    <p className="text-xs font-semibold text-slate-800">{activity.title}</p>
                    {activity.description && <p className="mt-1 text-xs text-slate-500">{activity.description}</p>}
                    <p className="mt-1 text-[10px] text-slate-400">{activity.type} · {activity.user} · {activity.status}</p>
                  </div>
                  <p className="whitespace-nowrap font-mono text-[10px] text-slate-500">{activity.date} · {activity.time}</p>
                </li>
              ))}
            </ol>
          ) : <EmptyMessage>No activity is linked to this customer yet.</EmptyMessage>}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 xl:col-span-3">
          <h2 className="text-sm font-bold text-slate-900">Opportunities and proposals</h2>
          {!customerOpportunities.length && !customerProposals.length ? <EmptyMessage>No opportunities or proposals are linked to this customer yet.</EmptyMessage> : (
            <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-2">
              {customerOpportunities.map((opportunity) => (
                <article key={opportunity.id} className="rounded-lg border border-slate-100 p-3">
                  <p className="text-xs font-semibold text-slate-800">{opportunity.name}</p>
                  <p className="mt-1 text-[11px] text-slate-500">{opportunity.stage} · {opportunity.probability}% probability</p>
                  <p className="mt-1 text-xs font-semibold text-slate-700">{formatINR(opportunity.amount)} · closes {opportunity.expectedClose}</p>
                </article>
              ))}
              {customerProposals.map((proposal) => (
                <article key={proposal.id} className="rounded-lg border border-slate-100 p-3">
                  <p className="font-mono text-[10px] font-semibold text-[#c2410c]">{proposal.proposalNumber}</p>
                  <p className="mt-1 text-xs font-semibold text-slate-800">{proposal.title}</p>
                  <p className="mt-1 text-[11px] text-slate-500">{proposal.service} · {proposal.status}</p>
                  <p className="mt-1 text-xs font-semibold text-slate-700">{formatINR(proposal.amount)} · valid until {proposal.validUntil}</p>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

const Metric: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="rounded-xl border border-slate-200 bg-white p-4">
    <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">{label}</p>
    <p className="mt-2 break-words text-lg font-extrabold text-slate-900">{value}</p>
  </div>
);

const EmptyMessage: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <p className="mt-3 rounded-lg bg-slate-50 p-3 text-xs text-slate-500">{children}</p>
);

const CustomerDetail: React.FC<{ label: string; value: string; href?: string; mono?: boolean }> = ({ label, value, href, mono }) => (
  <div className="min-w-0">
    <dt className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{label}</dt>
    <dd className={`mt-1 break-words text-xs font-semibold text-slate-800 ${mono ? 'font-mono' : ''}`}>
      {href ? <a href={href} target={href.startsWith('http') ? '_blank' : undefined} rel={href.startsWith('http') ? 'noreferrer' : undefined} className="text-[#c2410c] hover:underline">{value}</a> : value || 'Not provided'}
    </dd>
  </div>
);

const formatDate = (value: string) => {
  if (!value) return 'Not provided';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

const formatFileSize = (bytes: number) => {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};
