import React, { useState } from 'react';
import {
  Plus,
  Eye,
  X,
  Printer,
  Share2,
  Pencil,
  Trash2,
  Ban
} from 'lucide-react';
import type { Proposal, Invoice, Lead } from '../types/crm';
import { OrganizationProfile } from '../types/crm';
import { formatINR } from '../utils/currency';
import appLogo from '../assets/logo2.png';

const formatDocumentDate = (date: string) =>
  new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }).format(
    new Date(`${date}T00:00:00`)
  );

interface FinancialDocument {
  kind: 'QUOTATION' | 'STATEMENT OF WORK' | 'TAX INVOICE' | 'PROFORMA INVOICE';
  number: string;
  customer: string;
  contact?: string;
  email?: string;
  issueDate: string;
  dueDate?: string;
  validUntil?: string;
  title?: string;
  service?: string;
  scope?: string;
  description: string;
  amount: number;
  paidAmount?: number;
  status?: string;
  organization: OrganizationProfile;
}

export type CommercialPageType = 'proposals' | 'invoices' | 'proforma' | 'payments' | 'quotations';

export interface CommercialHubProps {
  proposals: Proposal[];
  invoices: Invoice[];
  leads: Lead[];
  organization: OrganizationProfile;
  onNewProposal: () => void;
  onNewInvoice: (type?: Invoice['type']) => void;
  onEditProposal: (proposal: Proposal) => void;
  onDeleteProposal: (proposal: Proposal) => void;
  onEditInvoice: (invoice: Invoice) => void;
  onVoidInvoice: (invoice: Invoice) => void;
  page: CommercialPageType;
}

export const CommercialHub: React.FC<CommercialHubProps> = ({
  proposals,
  invoices,
  leads,
  organization,
  onNewProposal,
  onNewInvoice,
  onEditProposal,
  onDeleteProposal,
  onEditInvoice,
  onVoidInvoice,
  page
}) => {
  const [documentPreview, setDocumentPreview] = useState<FinancialDocument | null>(null);

  const currentTab = page;

  const activeInvoices = invoices.filter((invoice) => invoice.status !== 'Voided');
  const totalInvoiced = activeInvoices.reduce((s, i) => s + i.amount, 0);
  const totalPaid = activeInvoices.reduce((s, i) => s + i.paidAmount, 0);
  const totalOutstanding = totalInvoiced - totalPaid;
  const visibleInvoices = invoices.filter((invoice) =>
    currentTab === 'proforma' ? invoice.type === 'Proforma' : invoice.type === 'Tax Invoice'
  );
  const activeVisibleInvoices = visibleInvoices.filter((invoice) => invoice.status !== 'Voided');
  const visibleInvoiceValue = activeVisibleInvoices.reduce((sum, invoice) => sum + invoice.amount, 0);
  const visibleInvoicePaid = activeVisibleInvoices.reduce((sum, invoice) => sum + invoice.paidAmount, 0);
  const proposalValue = proposals.reduce((sum, proposal) => sum + proposal.amount, 0);
  const pageConfig = {
    quotations: {
      title: 'Quotations',
      badge: 'Sales Estimates',
      description: 'Prepare, review, and issue customer quotations before commercial approval.',
      action: 'New Quotation'
    },
    proposals: {
      title: 'Proposals (SOW)',
      badge: 'Scope & Delivery',
      description: 'Manage statements of work, deliverables, validity, and customer approval.',
      action: 'New Proposal'
    },
    proforma: {
      title: 'Proforma Invoices',
      badge: 'Pre-Tax Documents',
      description: 'Issue payment requests before generating the final statutory tax invoice.',
      action: 'New Proforma Invoice'
    },
    invoices: {
      title: 'Tax Invoices',
      badge: 'Statutory Billing',
      description: 'Create and track final customer invoices, due dates, and outstanding balances.',
      action: 'New Tax Invoice'
    },
    payments: {
      title: 'Payment Records',
      badge: 'Collections',
      description: 'Monitor collections received and balances due against issued invoices.',
      action: null
    }
  }[currentTab];
  const summaryMetrics = currentTab === 'quotations' || currentTab === 'proposals'
    ? [
        { label: 'Total Documents', value: String(proposals.length), detail: `${pageConfig.title} on record`, valueClass: 'text-slate-900' },
        { label: 'Commercial Value', value: formatINR(proposalValue), detail: 'Combined value before tax', valueClass: 'text-[#ff5c00]' },
        { label: 'Accepted', value: String(proposals.filter((proposal) => proposal.status === 'Accepted').length), detail: `${proposals.filter((proposal) => proposal.status === 'Draft').length} drafts in progress`, valueClass: 'text-emerald-600' }
      ]
    : currentTab === 'payments'
    ? [
        { label: 'Total Invoiced', value: formatINR(totalInvoiced), detail: 'Active billing records', valueClass: 'text-slate-900' },
        { label: 'Collections Received', value: formatINR(totalPaid), detail: 'Payments recorded', valueClass: 'text-emerald-600' },
        { label: 'Balance Due', value: formatINR(totalOutstanding), detail: 'Net receivables outstanding', valueClass: 'text-amber-600' }
      ]
    : [
        { label: 'Active Documents', value: String(activeVisibleInvoices.length), detail: `${pageConfig.title} currently active`, valueClass: 'text-slate-900' },
        { label: 'Document Value', value: formatINR(visibleInvoiceValue), detail: 'Total issued value', valueClass: 'text-[#ff5c00]' },
        { label: 'Balance Due', value: formatINR(visibleInvoiceValue - visibleInvoicePaid), detail: `${formatINR(visibleInvoicePaid)} received`, valueClass: 'text-amber-600' }
      ];
  const organizationAddress = [
    organization.addressLine1,
    organization.addressLine2,
    organization.city,
    organization.state,
    organization.postalCode,
    organization.country
  ].filter(Boolean).join(', ');
  const bankingDetails = [
    ['Account holder', organization.bankAccountName],
    ['Bank', organization.bankName],
    ['Account number', organization.bankAccountNumber],
    ['IFSC', organization.bankIfsc],
    ['Branch', organization.bankBranch],
    ['SWIFT / BIC', organization.bankSwift],
    ['UPI ID', organization.upiId]
  ].filter(([, value]) => Boolean(value));

  const openProposalPreview = (proposal: Proposal, kind: 'QUOTATION' | 'STATEMENT OF WORK') => {
    const lead = leads.find((item) => item.id === proposal.leadId);
    setDocumentPreview({
      kind,
      number: kind === 'STATEMENT OF WORK'
        ? `SOW-${proposal.proposalNumber.replace(/^PROP-/, '')}`
        : proposal.proposalNumber,
      customer: lead?.company ?? 'Customer details to be completed',
      contact: lead?.name,
      email: lead?.email,
      issueDate: proposal.sentDate,
      validUntil: proposal.validUntil,
      title: proposal.title,
      service: proposal.service,
      scope: lead?.requirement,
      description: `${proposal.title} - ${proposal.service}`,
      amount: proposal.amount,
      status: proposal.status,
      organization
    });
  };

  const openQuotationPreview = (proposal: Proposal) => openProposalPreview(proposal, 'QUOTATION');

  const openSowPreview = (proposal: Proposal) => openProposalPreview(proposal, 'STATEMENT OF WORK');

  const openInvoicePreview = (invoice: Invoice) => {
    setDocumentPreview({
      kind: invoice.type === 'Proforma' ? 'PROFORMA INVOICE' : 'TAX INVOICE',
      number: invoice.invoiceNo,
      customer: invoice.customer,
      issueDate: invoice.issueDate,
      dueDate: invoice.dueDate,
      description: `Services as per ${invoice.type.toLowerCase()} ${invoice.invoiceNo}`,
      amount: invoice.amount,
      paidAmount: invoice.paidAmount,
      status: invoice.status,
      organization
    });
  };

  return (
    <div className="space-y-4 sm:space-y-5 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 p-4 sm:p-5 rounded-2xl bg-[#111827]/90 border border-slate-800 shadow-lg">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-extrabold text-white tracking-tight">{pageConfig.title}</h1>
            <span className="px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              {pageConfig.badge}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {pageConfig.description}
          </p>
        </div>

        {pageConfig.action && (
          <button
            type="button"
            onClick={() => currentTab === 'quotations' || currentTab === 'proposals'
              ? onNewProposal()
              : onNewInvoice(currentTab === 'proforma' ? 'Proforma' : 'Tax Invoice')}
            className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-indigo-600/30 transition hover:from-indigo-500 hover:to-cyan-500 active:scale-95"
          >
            <Plus className="h-4 w-4" /> {pageConfig.action}
          </button>
        )}
      </div>

      {/* Commercial Summary Metrics Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {summaryMetrics.map((metric) => (
          <div key={metric.label} className="rounded-xl border border-slate-200 bg-white p-4">
            <span className="text-[10px] font-bold uppercase text-slate-500">{metric.label}</span>
            <p className={`mt-1 font-mono text-xl font-extrabold ${metric.valueClass}`}>{metric.value}</p>
            <span className="text-[10px] text-slate-500">{metric.detail}</span>
          </div>
        ))}
      </div>

      {/* Page contents */}
      {(currentTab === 'proposals' || currentTab === 'quotations') && (
        <div className="rounded-2xl bg-[#111827]/80 border border-slate-800 shadow-md overflow-hidden">
          <div className="overflow-x-auto">
          <table className="min-w-[920px] w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-900/90 border-b border-slate-800 text-[10px] uppercase font-bold text-slate-300 tracking-wider">
                <th className="py-3 px-4">Doc Number</th>
                <th className="py-3 px-4">Title / Deliverables</th>
                <th className="py-3 px-4">IT Domain</th>
                <th className="py-3 px-4 text-right">Value (INR)</th>
                <th className="py-3 px-4">Date Sent</th>
                <th className="py-3 px-4">Validity</th>
                <th className="py-3 px-4">Approval Status</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {proposals.map((prop) => (
                <tr key={prop.id} className="hover:bg-slate-800/40 transition">
                  <td className="py-3 px-4 font-mono font-bold text-pink-400">{prop.proposalNumber}</td>
                  <td className="py-3 px-4 font-bold text-white">{prop.title}</td>
                  <td className="py-3 px-4 text-slate-300">{prop.service}</td>
                  <td className="py-3 px-4 text-right font-mono font-extrabold text-emerald-400">
                    {formatINR(prop.amount)}
                  </td>
                  <td className="py-3 px-4 text-slate-400 font-mono">{prop.sentDate}</td>
                  <td className="py-3 px-4 text-slate-400 font-mono">{prop.validUntil}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        prop.status === 'Accepted'
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : prop.status === 'Sent'
                          ? 'bg-blue-500/20 text-blue-300'
                          : 'bg-amber-500/20 text-amber-300'
                      }`}
                    >
                      {prop.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button type="button" onClick={() => currentTab === 'proposals' ? openSowPreview(prop) : openQuotationPreview(prop)} className="rounded p-1.5 text-slate-400 hover:bg-slate-700 hover:text-white" title="Preview document" aria-label={`Preview document ${prop.proposalNumber}`}>
                        <Eye className="h-3.5 w-3.5" />
                      </button>
                      {prop.status === 'Draft' && (
                        <>
                          <button type="button" onClick={() => onEditProposal(prop)} className="rounded p-1.5 text-slate-400 hover:bg-slate-700 hover:text-white" title="Edit draft" aria-label={`Edit draft ${prop.proposalNumber}`}>
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button type="button" onClick={() => onDeleteProposal(prop)} className="rounded p-1.5 text-slate-400 hover:bg-rose-500/10 hover:text-rose-500" title="Delete draft" aria-label={`Delete draft ${prop.proposalNumber}`}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      )}

      {(currentTab === 'invoices' || currentTab === 'proforma') && (
        <div className="rounded-2xl bg-[#111827]/80 border border-slate-800 shadow-md overflow-hidden">
          <div className="overflow-x-auto">
          <table className="min-w-[920px] w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-900/90 border-b border-slate-800 text-[10px] uppercase font-bold text-slate-300 tracking-wider">
                <th className="py-3 px-4">Invoice No</th>
                <th className="py-3 px-4">Customer Account</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4 text-right">Invoice Amount</th>
                <th className="py-3 px-4 text-right">Paid Amount</th>
                <th className="py-3 px-4">Due Date</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {visibleInvoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-slate-800/40 transition">
                  <td className="py-3 px-4 font-mono font-bold text-cyan-400">{inv.invoiceNo}</td>
                  <td className="py-3 px-4 font-bold text-white">{inv.customer}</td>
                  <td className="py-3 px-4 text-slate-300">{inv.type}</td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-white">
                    {formatINR(inv.amount)}
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-emerald-400">
                    {formatINR(inv.paidAmount)}
                  </td>
                  <td className="py-3 px-4 text-slate-400 font-mono">{inv.dueDate}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        inv.status === 'Paid'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : inv.status === 'Overdue'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      }`}
                    >
                      {inv.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button type="button" onClick={() => openInvoicePreview(inv)} className="rounded p-1.5 text-slate-400 hover:bg-slate-700 hover:text-white" title="Preview invoice" aria-label={`Preview invoice ${inv.invoiceNo}`}>
                        <Eye className="h-3.5 w-3.5" />
                      </button>
                      {inv.paidAmount === 0 && inv.status !== 'Voided' && (
                        <>
                          <button type="button" onClick={() => onEditInvoice(inv)} className="rounded p-1.5 text-slate-400 hover:bg-slate-700 hover:text-white" title="Edit unpaid invoice" aria-label={`Edit invoice ${inv.invoiceNo}`}>
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button type="button" onClick={() => onVoidInvoice(inv)} className="rounded p-1.5 text-slate-400 hover:bg-amber-50 hover:text-amber-700" title="Void invoice" aria-label={`Void invoice ${inv.invoiceNo}`}>
                            <Ban className="h-3.5 w-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      )}

      {currentTab === 'payments' && (
        <div className="space-y-4">
          <div className="rounded-2xl bg-[#111827]/80 border border-slate-800 shadow-md overflow-hidden">
            <div className="flex flex-col gap-1 border-b border-slate-800 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">Payment Records</h3>
                <p className="mt-1 text-xs text-slate-400">Recorded payments and balances due by invoice</p>
              </div>
              <span className="text-xs font-medium text-slate-400">{invoices.length} records</span>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-[760px] w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900/90 text-[10px] font-bold uppercase tracking-wider text-slate-300">
                    <th className="px-4 py-3">Reference</th>
                    <th className="px-4 py-3">Customer</th>
                    <th className="px-4 py-3">Invoice Date</th>
                    <th className="px-4 py-3 text-right">Paid</th>
                    <th className="px-4 py-3 text-right">Balance</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-center">Document</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-medium">
                  {invoices.map((invoice) => (
                    <tr key={invoice.id} className="hover:bg-slate-800/40">
                      <td className="px-4 py-3 font-mono font-bold text-cyan-400">{invoice.invoiceNo}</td>
                      <td className="px-4 py-3 font-semibold text-white">{invoice.customer}</td>
                      <td className="px-4 py-3 font-mono text-slate-400">{invoice.issueDate}</td>
                      <td className="px-4 py-3 text-right font-mono text-emerald-400">{formatINR(invoice.paidAmount)}</td>
                      <td className="px-4 py-3 text-right font-mono text-amber-400">
                        {formatINR(Math.max(0, invoice.amount - invoice.paidAmount))}
                      </td>
                      <td className="px-4 py-3">
                        <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-700">
                          {invoice.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          type="button"
                          onClick={() => openInvoicePreview(invoice)}
                          className="rounded p-1 text-slate-500 hover:bg-slate-100 hover:text-[#ff6600]"
                          title="Preview invoice document"
                          aria-label={`Preview document ${invoice.invoiceNo}`}
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {documentPreview && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/60 p-3 sm:p-6">
          <button
            type="button"
            aria-label="Close document preview"
            onClick={() => setDocumentPreview(null)}
            className="print-hidden absolute inset-0 cursor-default"
          />
          <div className="print-document-scroll relative z-10 max-h-[calc(100dvh-1.5rem)] w-full max-w-4xl overflow-y-auto rounded-xl bg-white shadow-2xl sm:max-h-[calc(100dvh-3rem)]">
            <div className="print-hidden sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur">
              <div className="flex items-center gap-2">
                <p className="text-sm font-bold text-slate-900">Document Preview</p>
                <span className="rounded bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-600">A4 Portrait</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="flex items-center gap-2 rounded-lg bg-[#ff6600] px-3 py-2 text-xs font-semibold text-white hover:bg-[#e65c00]"
                >
                  <Printer className="h-4 w-4" /> Print / Save PDF
                </button>
                <button
                  type="button"
                  onClick={() => setDocumentPreview(null)}
                  aria-label="Close preview"
                  className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <article className="print-document m-4 min-h-[297mm] w-[calc(100%-2rem)] max-w-[210mm] border border-slate-200 p-5 text-slate-900 sm:m-8 sm:p-8">
              <header className="flex flex-wrap items-start justify-between gap-5 border-b-2 border-[#ff6600] pb-5">
                <div className="flex items-center gap-3">
                  <img src={appLogo} alt="TDS" className="h-12 w-12 object-contain" />
                  <div>
                    <p className="text-lg font-extrabold">{documentPreview.organization.legalName}</p>
                    {documentPreview.organization.displayName && (
                      <p className="text-xs text-slate-500">{documentPreview.organization.displayName}</p>
                    )}
                  </div>
                </div>
                <div className="text-left sm:text-right">
                  <h2 className="text-xl font-extrabold tracking-wide">{documentPreview.kind}</h2>
                  <p className="mt-1 font-mono text-sm font-bold text-[#c2410c]">{documentPreview.number}</p>
                </div>
              </header>

              <div className="grid grid-cols-1 gap-5 py-5 sm:grid-cols-2">
                <div>
                  <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-500">From</h3>
                  <p className="mt-1 text-sm font-bold">{documentPreview.organization.legalName}</p>
                  <p className="text-xs text-slate-600">
                    {organizationAddress || 'Registered address: not configured'}
                  </p>
                  {documentPreview.organization.billingEmail && (
                    <p className="text-xs text-slate-600">{documentPreview.organization.billingEmail}</p>
                  )}
                  {documentPreview.organization.phone && (
                    <p className="text-xs text-slate-600">{documentPreview.organization.phone}</p>
                  )}
                  <p className="text-xs text-slate-600">GSTIN: {documentPreview.organization.gstin || 'not configured'}</p>
                  <p className="text-xs text-slate-600">
                    MSME / Udyam: {documentPreview.organization.msmeRegistration || 'not configured'}
                  </p>
                </div>
                <div>
                  <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Bill To</h3>
                  <p className="mt-1 text-sm font-bold">{documentPreview.customer}</p>
                  {documentPreview.contact && <p className="text-xs text-slate-600">{documentPreview.contact}</p>}
                  {documentPreview.email && <p className="text-xs text-slate-600">{documentPreview.email}</p>}
                  <p className="text-xs text-slate-600">Billing address / GSTIN: to be provided</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 rounded-lg bg-slate-50 p-3 text-xs sm:grid-cols-4">
                <DocumentDetail label="Issue Date" value={formatDocumentDate(documentPreview.issueDate)} />
                {documentPreview.dueDate && <DocumentDetail label="Due Date" value={formatDocumentDate(documentPreview.dueDate)} />}
                {documentPreview.validUntil && <DocumentDetail label="Valid Until" value={formatDocumentDate(documentPreview.validUntil)} />}
                {documentPreview.status && <DocumentDetail label="Status" value={documentPreview.status} />}
              </div>

              {documentPreview.kind === 'QUOTATION' && (
                <section className="mt-6 rounded-lg border border-orange-200 bg-orange-50 p-4">
                  <h3 className="text-xs font-extrabold uppercase tracking-wide text-orange-900">Quotation summary</h3>
                  <p className="mt-2 text-sm font-bold text-slate-900">{documentPreview.title}</p>
                  <p className="mt-1 text-xs text-slate-700">Services: {documentPreview.service}</p>
                  <p className="mt-2 text-xs text-slate-600">
                    This quotation is valid through {documentPreview.validUntil ? formatDocumentDate(documentPreview.validUntil) : 'the date shown above'}.
                    Applicable taxes are shown separately once configured.
                  </p>
                </section>
              )}

              {documentPreview.kind === 'STATEMENT OF WORK' && (
                <section className="mt-6 space-y-4">
                  <div className="border-b border-slate-200 pb-3">
                    <h3 className="text-sm font-extrabold uppercase tracking-wide">Statement of Work</h3>
                    <p className="mt-1 text-sm font-semibold text-slate-700">{documentPreview.title}</p>
                  </div>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Services</h4>
                      <p className="mt-1 text-xs leading-relaxed text-slate-700">{documentPreview.service}</p>
                    </div>
                    <div>
                      <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Scope and objectives</h4>
                      <p className="mt-1 whitespace-pre-wrap text-xs leading-relaxed text-slate-700">
                        {documentPreview.scope || 'Project scope and objectives must be confirmed with the customer before execution.'}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-4 rounded-lg bg-slate-50 p-4 sm:grid-cols-3">
                    <div>
                      <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Deliverables</h4>
                      <p className="mt-1 text-xs text-slate-700">{documentPreview.title}</p>
                    </div>
                    <div>
                      <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Milestones and schedule</h4>
                      <p className="mt-1 text-xs text-slate-700">To be agreed in the project plan.</p>
                    </div>
                    <div>
                      <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Acceptance</h4>
                      <p className="mt-1 text-xs text-slate-700">Customer acceptance criteria and review window to be agreed before work begins.</p>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Responsibilities and assumptions</h4>
                    <p className="mt-1 text-xs leading-relaxed text-slate-700">
                      The provider delivers the services listed above. The customer supplies timely access, information, and approvals. Any exclusions or dependencies must be agreed in writing.
                    </p>
                  </div>
                </section>
              )}

              {documentPreview.kind === 'PROFORMA INVOICE' && (
                <div className="mt-6 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-xs font-semibold text-amber-900">
                  Proforma invoice only. This is a payment request and is not a tax invoice or proof of tax payment.
                </div>
              )}

              {documentPreview.kind === 'TAX INVOICE' && (
                <div className="mt-6 grid grid-cols-1 gap-3 rounded-lg border border-slate-200 p-4 text-xs sm:grid-cols-3">
                  <DocumentDetail label="Place of supply" value="To be confirmed" />
                  <DocumentDetail label="HSN / SAC" value="To be configured" />
                  <DocumentDetail label="Customer GSTIN" value="To be provided" />
                </div>
              )}

              {(documentPreview.kind === 'PROFORMA INVOICE' || documentPreview.kind === 'TAX INVOICE') && (
                <section className="mt-6 rounded-lg border border-slate-200 p-4">
                  <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Payment instructions</h3>
                  {bankingDetails.length > 0 ? (
                    <dl className="mt-3 grid grid-cols-1 gap-x-6 gap-y-2 text-xs sm:grid-cols-2">
                      {bankingDetails.map(([label, value]) => (
                        <div key={label} className="flex justify-between gap-3">
                          <dt className="text-slate-500">{label}</dt>
                          <dd className="text-right font-semibold text-slate-800">{value}</dd>
                        </div>
                      ))}
                    </dl>
                  ) : (
                    <p className="mt-2 text-xs text-slate-500">Bank transfer details have not been configured in Organization Setup.</p>
                  )}
                </section>
              )}

              <div className="mt-6 overflow-x-auto">
                <table className={`w-full text-left text-xs ${documentPreview.kind === 'TAX INVOICE' ? 'min-w-[720px]' : 'min-w-[480px]'}`}>
                  <thead>
                    <tr className="border-y border-slate-300 text-[10px] font-bold uppercase tracking-wider text-slate-600">
                      {documentPreview.kind === 'TAX INVOICE' ? (
                        <>
                          <th className="py-3 pr-3">Description</th>
                          <th className="py-3 px-3 text-right">HSN / SAC</th>
                          <th className="py-3 px-3 text-right">Taxable value</th>
                          <th className="py-3 px-3 text-right">GST rate</th>
                          <th className="py-3 px-3 text-right">Tax amount</th>
                          <th className="py-3 pl-3 text-right">Line total</th>
                        </>
                      ) : (
                        <>
                          <th className="py-3 pr-3">Description / deliverable</th>
                          <th className="py-3 px-3 text-right">Qty</th>
                          <th className="py-3 px-3 text-right">Unit value</th>
                          <th className="py-3 pl-3 text-right">Amount</th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-slate-200">
                      <td className="py-4 pr-3 font-semibold">{documentPreview.kind === 'STATEMENT OF WORK' ? documentPreview.service : documentPreview.description}</td>
                      {documentPreview.kind === 'TAX INVOICE' ? (
                        <>
                          <td className="py-4 px-3 text-right">To configure</td>
                          <td className="py-4 px-3 text-right font-mono">{formatINR(documentPreview.amount)}</td>
                          <td className="py-4 px-3 text-right">To configure</td>
                          <td className="py-4 px-3 text-right">Pending</td>
                          <td className="py-4 pl-3 text-right font-mono font-bold">{formatINR(documentPreview.amount)}</td>
                        </>
                      ) : (
                        <>
                          <td className="py-4 px-3 text-right">1</td>
                          <td className="py-4 px-3 text-right font-mono">{formatINR(documentPreview.amount)}</td>
                          <td className="py-4 pl-3 text-right font-mono font-bold">{formatINR(documentPreview.amount)}</td>
                        </>
                      )}
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="ml-auto mt-5 w-full max-w-sm space-y-2 text-xs">
                <div className="flex justify-between gap-4 text-slate-600">
                  <span>{documentPreview.kind === 'TAX INVOICE' ? 'Taxable subtotal' : 'Subtotal'}</span>
                  <span className="font-mono">{formatINR(documentPreview.amount)}</span>
                </div>
                {documentPreview.kind === 'TAX INVOICE' ? (
                  <>
                    <div className="flex justify-between gap-4 text-slate-600"><span>CGST / SGST or IGST</span><span>Pending tax configuration</span></div>
                    <div className="flex justify-between gap-4 text-slate-600"><span>Total tax</span><span>Not calculated</span></div>
                  </>
                ) : (
                  <div className="flex justify-between gap-4 text-slate-600">
                    <span>Applicable taxes</span><span>Shown separately on final tax invoice</span>
                  </div>
                )}
                {documentPreview.paidAmount !== undefined && (
                  <div className="flex justify-between gap-4 text-slate-600">
                    <span>Amount paid</span><span className="font-mono">{formatINR(documentPreview.paidAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between gap-4 border-t border-slate-300 pt-3 text-sm font-extrabold">
                  <span>
                    {documentPreview.paidAmount !== undefined
                      ? 'Balance due'
                      : documentPreview.kind === 'QUOTATION'
                      ? 'Quoted amount before tax'
                      : documentPreview.kind === 'STATEMENT OF WORK'
                      ? 'SOW value before tax'
                      : documentPreview.kind === 'PROFORMA INVOICE'
                      ? 'Amount requested'
                      : 'Recorded invoice value'}
                  </span>
                  <span className="font-mono text-[#c2410c]">
                    {formatINR(documentPreview.paidAmount !== undefined
                      ? Math.max(0, documentPreview.amount - documentPreview.paidAmount)
                      : documentPreview.amount)}
                  </span>
                </div>
              </div>

              {documentPreview.kind === 'QUOTATION' && (
                <section className="mt-8 border-t border-slate-200 pt-4">
                  <h3 className="text-xs font-bold uppercase tracking-wide">Acceptance</h3>
                  <p className="mt-1 text-[10px] text-slate-500">Acceptance confirms the quoted scope, value before applicable taxes, and validity period.</p>
                  <div className="mt-8 grid grid-cols-2 gap-8 text-[10px] text-slate-500">
                    <div className="border-t border-slate-300 pt-2">For {documentPreview.customer}: name, signature, date</div>
                    <div className="border-t border-slate-300 pt-2">For {documentPreview.organization.legalName}: name, signature, date</div>
                  </div>
                </section>
              )}
              {documentPreview.kind === 'STATEMENT OF WORK' && (
                <section className="mt-8 border-t border-slate-200 pt-4">
                  <h3 className="text-xs font-bold uppercase tracking-wide">Authorization</h3>
                  <p className="mt-1 text-[10px] leading-relaxed text-slate-500">
                    This SOW becomes effective when signed by both parties. Changes to scope, delivery dates, or fees require written approval.
                    Payment terms: {documentPreview.organization.paymentTerms || 'to be agreed'}.
                  </p>
                  <div className="mt-8 grid grid-cols-2 gap-8 text-[10px] text-slate-500">
                    <div className="border-t border-slate-300 pt-2">Customer authorized signatory / date</div>
                    <div className="border-t border-slate-300 pt-2">Provider authorized signatory / date</div>
                  </div>
                </section>
              )}
              <footer className="mt-6 border-t border-slate-200 pt-4 text-[10px] leading-relaxed text-slate-500">
                {documentPreview.kind === 'PROFORMA INVOICE'
                  ? 'Proforma only; issue a tax invoice after supply according to applicable rules.'
                  : 'Verify customer billing details, applicable tax, and required statutory fields before issuing this document.'}
                {' '}Payment terms: {documentPreview.organization.paymentTerms || 'not configured'}.
              </footer>
            </article>
          </div>
        </div>
      )}
    </div>
  );
};

const DocumentDetail: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div>
    <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500">{label}</p>
    <p className="mt-1 font-mono font-semibold text-slate-800">{value}</p>
  </div>
);
