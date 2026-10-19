import React, { useState } from 'react';
import {
  Plus,
  Eye,
  X,
  Printer,
  Share2,
  Pencil,
  Trash2,
  Ban,
  Send,
  CheckCircle2,
  ArrowRight,
  CreditCard,
  ShieldCheck,
  TriangleAlert,
  Search,
  ReceiptIndianRupee
} from 'lucide-react';
import type { Proposal, Invoice, Lead, PaymentRecord } from '../types/crm';
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
  customerGstin?: string;
  billingAddress?: string;
  placeOfSupply?: string;
  sacCode?: string;
  taxableAmount?: number;
  discount?: number;
  gstRate?: number;
  supplyType?: Invoice['supplyType'];
  reverseCharge?: Invoice['reverseCharge'];
  cgstAmount?: number;
  sgstAmount?: number;
  igstAmount?: number;
  totalTax?: number;
  irn?: string;
  acknowledgementNumber?: string;
  acknowledgementDate?: string;
  lineItems?: Invoice['lineItems'];
  purchaseOrderNumber?: string;
  customerNotes?: string;
  terms?: string;
  organization: OrganizationProfile;
}

export type CommercialPageType = 'proposals' | 'invoices' | 'proforma' | 'payments' | 'quotations';

export interface CommercialHubProps {
  proposals: Proposal[];
  invoices: Invoice[];
  payments: PaymentRecord[];
  leads: Lead[];
  organization: OrganizationProfile;
  onNewProposal: () => void;
  onNewInvoice: (type?: Invoice['type']) => void;
  onEditProposal: (proposal: Proposal) => void;
  onDeleteProposal: (proposal: Proposal) => void;
  onUpdateProposalStatus: (proposal: Proposal, status: Proposal['status']) => void;
  onConvertProposalToInvoice: (proposal: Proposal, type?: Invoice['type']) => void;
  onEditInvoice: (invoice: Invoice) => void;
  onVoidInvoice: (invoice: Invoice) => void;
  onConvertProformaToTaxInvoice: (invoice: Invoice) => void;
  onRecordPayment: (invoice: Invoice, amount: number, reference: string, mode: PaymentRecord['mode'], paymentDate: string, notes: string) => void;
  onUpdateInvoiceStatus: (invoice: Invoice, status: Invoice['status']) => void;
  page: CommercialPageType;
}

export const CommercialHub: React.FC<CommercialHubProps> = ({
  proposals,
  invoices,
  payments,
  leads,
  organization,
  onNewProposal,
  onNewInvoice,
  onEditProposal,
  onDeleteProposal,
  onUpdateProposalStatus,
  onConvertProposalToInvoice,
  onEditInvoice,
  onVoidInvoice,
  onConvertProformaToTaxInvoice,
  onRecordPayment,
  onUpdateInvoiceStatus,
  page
}) => {
  const [documentPreview, setDocumentPreview] = useState<FinancialDocument | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [paymentTarget, setPaymentTarget] = useState<Invoice | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMode, setPaymentMode] = useState<PaymentRecord['mode']>('Bank Transfer');
  const [paymentReference, setPaymentReference] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentNotes, setPaymentNotes] = useState('');

  const currentTab = page;
  const pageProposals = proposals.filter((proposal) => currentTab === 'quotations'
    ? proposal.documentType === 'Quotation'
    : (proposal.documentType ?? 'Proposal') === 'Proposal');
  const visibleProposals = pageProposals.filter((proposal) => {
    const query = searchTerm.trim().toLowerCase();
    const matchesSearch = !query || [proposal.proposalNumber, proposal.title, proposal.service].some((value) => value.toLowerCase().includes(query));
    return matchesSearch && (statusFilter === 'All' || proposal.status === statusFilter);
  });

  const activeInvoices = invoices.filter((invoice) => invoice.type === 'Tax Invoice' && invoice.status !== 'Voided');
  const paymentInvoices = activeInvoices.filter((invoice) => {
    const query = searchTerm.trim().toLowerCase();
    const matchesSearch = !query || [invoice.invoiceNo, invoice.customer, invoice.paymentReference ?? ''].some((value) => value.toLowerCase().includes(query));
    return matchesSearch && (statusFilter === 'All' || invoice.status === statusFilter);
  });
  const visiblePayments = payments.filter((payment) => {
    const query = searchTerm.trim().toLowerCase();
    const invoice = invoices.find((item) => item.id === payment.invoiceId);
    const matchesSearch = !query || [payment.paymentNumber, payment.invoiceNo, payment.customer, payment.reference].some((value) => value.toLowerCase().includes(query));
    return matchesSearch && (statusFilter === 'All' || invoice?.status === statusFilter);
  });
  const totalInvoiced = activeInvoices.reduce((s, i) => s + i.amount, 0);
  const totalPaid = activeInvoices.reduce((s, i) => s + i.paidAmount, 0);
  const totalOutstanding = totalInvoiced - totalPaid;
  const pageInvoices = invoices.filter((invoice) =>
    currentTab === 'proforma' ? invoice.type === 'Proforma' : invoice.type === 'Tax Invoice'
  );
  const visibleInvoices = pageInvoices.filter((invoice) => {
    const query = searchTerm.trim().toLowerCase();
    const matchesSearch = !query || [invoice.invoiceNo, invoice.customer, invoice.purchaseOrderNumber ?? ''].some((value) => value.toLowerCase().includes(query));
    return matchesSearch && (statusFilter === 'All' || invoice.status === statusFilter);
  });
  const activeVisibleInvoices = visibleInvoices.filter((invoice) => invoice.status !== 'Voided');
  const visibleInvoiceValue = activeVisibleInvoices.reduce((sum, invoice) => sum + invoice.amount, 0);
  const visibleInvoicePaid = activeVisibleInvoices.reduce((sum, invoice) => sum + invoice.paidAmount, 0);
  const proposalValue = visibleProposals.reduce((sum, proposal) => sum + proposal.amount, 0);
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
        { label: 'Total Documents', value: String(visibleProposals.length), detail: `${pageConfig.title} on record`, valueClass: 'text-slate-900' },
        { label: 'Commercial Value', value: formatINR(proposalValue), detail: 'Combined value before tax', valueClass: 'text-[#ff5c00]' },
        { label: 'Accepted', value: String(visibleProposals.filter((proposal) => proposal.status === 'Accepted').length), detail: `${visibleProposals.filter((proposal) => proposal.status === 'Draft').length} drafts in progress`, valueClass: 'text-emerald-600' }
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
      lineItems: proposal.lineItems,
      customerNotes: proposal.customerNotes,
      terms: proposal.terms,
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
      customerGstin: invoice.customerGstin,
      billingAddress: invoice.billingAddress,
      placeOfSupply: invoice.placeOfSupply,
      sacCode: invoice.sacCode,
      taxableAmount: invoice.taxableAmount,
      discount: invoice.discount,
      gstRate: invoice.gstRate,
      supplyType: invoice.supplyType,
      reverseCharge: invoice.reverseCharge,
      cgstAmount: invoice.cgstAmount,
      sgstAmount: invoice.sgstAmount,
      igstAmount: invoice.igstAmount,
      totalTax: invoice.totalTax,
      irn: invoice.irn,
      acknowledgementNumber: invoice.acknowledgementNumber,
      acknowledgementDate: invoice.acknowledgementDate,
      lineItems: invoice.lineItems,
      purchaseOrderNumber: invoice.purchaseOrderNumber,
      customerNotes: invoice.customerNotes,
      terms: invoice.terms,
      organization
    });
  };

  const recordPayment = (invoice: Invoice) => {
    const balance = Math.max(0, invoice.amount - invoice.paidAmount);
    setPaymentTarget(invoice);
    setPaymentAmount(String(balance));
    setPaymentMode('Bank Transfer');
    setPaymentReference('');
    setPaymentDate(new Date().toISOString().split('T')[0]);
    setPaymentNotes('');
  };

  const submitPayment = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!paymentTarget) return;
    const amount = Number(paymentAmount);
    const balance = Math.max(0, paymentTarget.amount - paymentTarget.paidAmount);
    if (!Number.isFinite(amount) || amount <= 0 || amount > balance || !paymentReference.trim()) return;
    onRecordPayment(paymentTarget, amount, paymentReference.trim(), paymentMode, paymentDate, paymentNotes.trim());
    setPaymentTarget(null);
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

      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder={`Search ${pageConfig.title.toLowerCase()}...`} className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-800 outline-none focus:border-[#ff6600] focus:ring-2 focus:ring-orange-100" />
        </div>
        <div className="flex items-center gap-2">
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} aria-label="Filter by status" className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 outline-none focus:border-[#ff6600]">
            <option value="All">All statuses</option>
            {(currentTab === 'quotations' || currentTab === 'proposals'
              ? ['Draft', 'Sent', 'Client Review', 'Accepted', 'Declined']
              : ['Draft', 'Sent', 'Outstanding', 'Partially Paid', 'Paid', 'Overdue', 'Voided']
            ).map((status) => <option key={status} value={status}>{status}</option>)}
          </select>
          {(searchTerm || statusFilter !== 'All') && <button type="button" onClick={() => { setSearchTerm(''); setStatusFilter('All'); }} className="h-10 rounded-lg border border-slate-200 px-3 text-xs font-semibold text-slate-600 hover:bg-slate-50">Clear</button>}
        </div>
      </div>

      {(currentTab === 'invoices' || currentTab === 'proforma') && (
        <div className={`flex gap-3 rounded-xl border px-4 py-3 text-xs ${organization.gstin && organization.state ? 'border-emerald-200 bg-emerald-50 text-emerald-900' : 'border-amber-200 bg-amber-50 text-amber-900'}`}>
          {organization.gstin && organization.state ? <ShieldCheck className="h-4 w-4 shrink-0" /> : <TriangleAlert className="h-4 w-4 shrink-0" />}
          <div>
            <p className="font-bold">GST readiness</p>
            <p className="mt-0.5">{organization.gstin && organization.state
              ? 'Supplier GSTIN and state are configured. Verify recipient GSTIN, place of supply, SAC/HSN, tax rate, and e-invoice details before issue.'
              : 'Complete the supplier GSTIN and registered state in Organization Setup before issuing a statutory tax invoice.'}</p>
            {currentTab === 'invoices' && <p className="mt-1 text-[10px] opacity-80">E-invoicing generally applies from ₹5 crore AATO; taxpayers with AATO of ₹10 crore or more must report covered documents within 30 days. Confirm applicability and exemptions with your GST adviser.</p>}
          </div>
        </div>
      )}

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
              {visibleProposals.map((prop) => (
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
                          <button type="button" onClick={() => onUpdateProposalStatus(prop, 'Sent')} className="rounded p-1.5 text-slate-400 hover:bg-blue-500/10 hover:text-blue-300" title="Mark as sent" aria-label={`Mark ${prop.proposalNumber} as sent`}>
                            <Send className="h-3.5 w-3.5" />
                          </button>
                          <button type="button" onClick={() => onEditProposal(prop)} className="rounded p-1.5 text-slate-400 hover:bg-slate-700 hover:text-white" title="Edit draft" aria-label={`Edit draft ${prop.proposalNumber}`}>
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button type="button" onClick={() => onDeleteProposal(prop)} className="rounded p-1.5 text-slate-400 hover:bg-rose-500/10 hover:text-rose-500" title="Delete draft" aria-label={`Delete draft ${prop.proposalNumber}`}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </>
                      )}
                      {prop.status === 'Sent' && (
                        <>
                          <button type="button" onClick={() => onUpdateProposalStatus(prop, 'Accepted')} className="rounded p-1.5 text-slate-400 hover:bg-emerald-500/10 hover:text-emerald-300" title="Mark as accepted" aria-label={`Mark ${prop.proposalNumber} as accepted`}><CheckCircle2 className="h-3.5 w-3.5" /></button>
                          <button type="button" onClick={() => onUpdateProposalStatus(prop, 'Declined')} className="rounded p-1.5 text-slate-400 hover:bg-rose-500/10 hover:text-rose-300" title="Mark as declined" aria-label={`Mark ${prop.proposalNumber} as declined`}><X className="h-3.5 w-3.5" /></button>
                        </>
                      )}
                      {prop.status === 'Accepted' && (
                        <button type="button" onClick={() => onConvertProposalToInvoice(prop, currentTab === 'quotations' ? 'Proforma' : 'Tax Invoice')} className="rounded p-1.5 text-slate-400 hover:bg-orange-500/10 hover:text-orange-300" title={currentTab === 'quotations' ? 'Convert to proforma invoice' : 'Convert to tax invoice'} aria-label={`Convert ${prop.proposalNumber} to invoice`}>
                          <ArrowRight className="h-3.5 w-3.5" />
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
                <th className="py-3 px-4 text-right">Taxable Value</th>
                <th className="py-3 px-4 text-right">GST</th>
                <th className="py-3 px-4 text-right">Grand Total</th>
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
                    {formatINR(inv.taxableAmount ?? inv.amount)}
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-cyan-300">{formatINR(inv.totalTax ?? 0)}</td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-white">{formatINR(inv.amount)}</td>
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
                      {inv.status === 'Draft' && (
                        <button type="button" onClick={() => onUpdateInvoiceStatus(inv, 'Sent')} className="rounded p-1.5 text-slate-400 hover:bg-blue-500/10 hover:text-blue-300" title="Issue / mark as sent" aria-label={`Issue invoice ${inv.invoiceNo}`}>
                          <Send className="h-3.5 w-3.5" />
                        </button>
                      )}
                      {inv.status === 'Sent' && inv.type === 'Tax Invoice' && (
                        <button type="button" onClick={() => onUpdateInvoiceStatus(inv, 'Outstanding')} className="rounded p-1.5 text-slate-400 hover:bg-amber-500/10 hover:text-amber-300" title="Mark payment due" aria-label={`Mark ${inv.invoiceNo} outstanding`}>
                          <ReceiptIndianRupee className="h-3.5 w-3.5" />
                        </button>
                      )}
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
                      {inv.type === 'Proforma' && inv.status !== 'Voided' && (
                        <button type="button" onClick={() => onConvertProformaToTaxInvoice(inv)} className="rounded p-1.5 text-slate-400 hover:bg-orange-500/10 hover:text-orange-300" title="Convert to tax invoice" aria-label={`Convert ${inv.invoiceNo} to tax invoice`}>
                          <ArrowRight className="h-3.5 w-3.5" />
                        </button>
                      )}
                      {inv.type === 'Tax Invoice' && inv.status !== 'Draft' && inv.status !== 'Paid' && inv.status !== 'Voided' && (
                        <button type="button" onClick={() => recordPayment(inv)} className="rounded p-1.5 text-slate-400 hover:bg-emerald-500/10 hover:text-emerald-300" title="Record payment" aria-label={`Record payment for ${inv.invoiceNo}`}>
                          <CreditCard className="h-3.5 w-3.5" />
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
      )}

      {currentTab === 'payments' && (
        <div className="space-y-4">
          <div className="rounded-2xl bg-[#111827]/80 border border-slate-800 shadow-md overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-800 p-4">
              <div><h3 className="text-sm font-bold text-white">Payments Received</h3><p className="mt-1 text-xs text-slate-400">Individual receipts retained for audit and reconciliation</p></div>
              <span className="text-xs font-medium text-slate-400">{visiblePayments.length} transactions</span>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-[820px] w-full text-left text-xs">
                <thead><tr className="border-b border-slate-800 bg-slate-900/90 text-[10px] font-bold uppercase tracking-wider text-slate-300"><th className="px-4 py-3">Payment #</th><th className="px-4 py-3">Date</th><th className="px-4 py-3">Customer</th><th className="px-4 py-3">Invoice</th><th className="px-4 py-3">Mode / Reference</th><th className="px-4 py-3 text-right">Amount</th></tr></thead>
                <tbody className="divide-y divide-slate-800/60">
                  {visiblePayments.length ? visiblePayments.map((payment) => <tr key={payment.id} className="hover:bg-slate-800/40"><td className="px-4 py-3 font-mono font-bold text-emerald-400">{payment.paymentNumber}</td><td className="px-4 py-3 font-mono text-slate-400">{payment.paymentDate}</td><td className="px-4 py-3 font-semibold text-white">{payment.customer}</td><td className="px-4 py-3 font-mono text-cyan-400">{payment.invoiceNo}</td><td className="px-4 py-3 text-slate-300">{payment.mode}<br /><span className="text-[10px] text-slate-500">{payment.reference}</span></td><td className="px-4 py-3 text-right font-mono font-bold text-emerald-400">{formatINR(payment.amount)}</td></tr>) : <tr><td colSpan={6} className="px-4 py-10 text-center text-slate-400">No payment receipts recorded yet.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
          <div className="rounded-2xl bg-[#111827]/80 border border-slate-800 shadow-md overflow-hidden">
            <div className="flex flex-col gap-1 border-b border-slate-800 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">Invoice Receivables</h3>
                <p className="mt-1 text-xs text-slate-400">Recorded payments and balances due by invoice</p>
              </div>
              <span className="text-xs font-medium text-slate-400">{paymentInvoices.length} records</span>
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
                    <th className="px-4 py-3">Last Payment</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-medium">
                  {paymentInvoices.map((invoice) => (
                    <tr key={invoice.id} className="hover:bg-slate-800/40">
                      <td className="px-4 py-3 font-mono font-bold text-cyan-400">{invoice.invoiceNo}</td>
                      <td className="px-4 py-3 font-semibold text-white">{invoice.customer}</td>
                      <td className="px-4 py-3 font-mono text-slate-400">{invoice.issueDate}</td>
                      <td className="px-4 py-3 text-right font-mono text-emerald-400">{formatINR(invoice.paidAmount)}</td>
                      <td className="px-4 py-3 text-right font-mono text-amber-400">
                        {formatINR(Math.max(0, invoice.amount - invoice.paidAmount))}
                      </td>
                      <td className="px-4 py-3 text-slate-400">
                        {invoice.paymentDate ? <><span className="font-mono">{invoice.paymentDate}</span><br /><span className="text-[10px]">{invoice.paymentMode} · {invoice.paymentReference}</span></> : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-700">
                          {invoice.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button type="button" onClick={() => openInvoicePreview(invoice)} className="rounded p-1 text-slate-400 hover:bg-slate-700 hover:text-white" title="Preview invoice document" aria-label={`Preview document ${invoice.invoiceNo}`}><Eye className="h-4 w-4" /></button>
                          {invoice.status !== 'Draft' && invoice.status !== 'Paid' && (
                            <button type="button" onClick={() => recordPayment(invoice)} className="rounded p-1 text-slate-400 hover:bg-emerald-500/10 hover:text-emerald-300" title="Record payment" aria-label={`Record payment for ${invoice.invoiceNo}`}><CreditCard className="h-4 w-4" /></button>
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
      )}

      {paymentTarget && (
        <div className="fixed inset-0 z-[85] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
          <button type="button" aria-label="Close payment dialog" onClick={() => setPaymentTarget(null)} className="absolute inset-0 cursor-default" />
          <form onSubmit={submitPayment} className="relative z-10 w-full max-w-lg rounded-2xl border border-slate-200 bg-white shadow-2xl">
            <header className="flex items-start justify-between border-b border-slate-200 px-5 py-4">
              <div><h3 className="flex items-center gap-2 text-base font-bold text-slate-900"><CreditCard className="h-5 w-5 text-emerald-600" /> Record Payment</h3><p className="mt-1 text-xs text-slate-500">{paymentTarget.invoiceNo} · {paymentTarget.customer}</p></div>
              <button type="button" onClick={() => setPaymentTarget(null)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"><X className="h-4 w-4" /></button>
            </header>
            <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2">
              <div className="sm:col-span-2 rounded-lg bg-emerald-50 p-3 text-xs text-emerald-900"><span className="font-semibold">Balance due:</span> <span className="font-mono font-bold">{formatINR(Math.max(0, paymentTarget.amount - paymentTarget.paidAmount))}</span></div>
              <label className="text-xs font-semibold text-slate-700">Amount received<input required type="number" min="0.01" max={Math.max(0, paymentTarget.amount - paymentTarget.paidAmount)} step="0.01" value={paymentAmount} onChange={(event) => setPaymentAmount(event.target.value)} className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-emerald-500" /></label>
              <label className="text-xs font-semibold text-slate-700">Payment date<input required type="date" value={paymentDate} onChange={(event) => setPaymentDate(event.target.value)} className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-emerald-500" /></label>
              <label className="text-xs font-semibold text-slate-700">Payment mode<select value={paymentMode} onChange={(event) => setPaymentMode(event.target.value as PaymentRecord['mode'])} className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-emerald-500">{(['Bank Transfer', 'UPI', 'Cheque', 'Cash', 'Card', 'Other'] as PaymentRecord['mode'][]).map((mode) => <option key={mode}>{mode}</option>)}</select></label>
              <label className="text-xs font-semibold text-slate-700">Reference number<input required value={paymentReference} onChange={(event) => setPaymentReference(event.target.value)} placeholder="UTR / cheque / transaction ID" className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-emerald-500" /></label>
              <label className="text-xs font-semibold text-slate-700 sm:col-span-2">Notes<textarea rows={3} value={paymentNotes} onChange={(event) => setPaymentNotes(event.target.value)} placeholder="Optional internal note" className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-500" /></label>
            </div>
            <footer className="flex justify-end gap-2 border-t border-slate-200 px-5 py-4"><button type="button" onClick={() => setPaymentTarget(null)} className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50">Cancel</button><button type="submit" className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-500">Save Payment</button></footer>
          </form>
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
                  {documentPreview.billingAddress && <p className="whitespace-pre-wrap text-xs text-slate-600">{documentPreview.billingAddress}</p>}
                  {(documentPreview.kind === 'TAX INVOICE' || documentPreview.kind === 'PROFORMA INVOICE') && (
                    <p className="text-xs text-slate-600">GSTIN: {documentPreview.customerGstin || 'Unregistered'}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 rounded-lg bg-slate-50 p-3 text-xs sm:grid-cols-4">
                <DocumentDetail label="Issue Date" value={formatDocumentDate(documentPreview.issueDate)} />
                {documentPreview.dueDate && <DocumentDetail label="Due Date" value={formatDocumentDate(documentPreview.dueDate)} />}
                {documentPreview.validUntil && <DocumentDetail label="Valid Until" value={formatDocumentDate(documentPreview.validUntil)} />}
                {documentPreview.purchaseOrderNumber && <DocumentDetail label="Purchase Order" value={documentPreview.purchaseOrderNumber} />}
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
                  <DocumentDetail label="Place of supply" value={documentPreview.placeOfSupply || 'Not configured'} />
                  <DocumentDetail label="HSN / SAC" value={documentPreview.sacCode || 'Not configured'} />
                  <DocumentDetail label="Customer GSTIN" value={documentPreview.customerGstin || 'Unregistered'} />
                  <DocumentDetail label="Nature of supply" value={documentPreview.supplyType || 'Not configured'} />
                  <DocumentDetail label="Reverse charge" value={documentPreview.reverseCharge || 'No'} />
                  <DocumentDetail label="GST rate" value={`${documentPreview.gstRate ?? 0}%`} />
                  {documentPreview.irn && <DocumentDetail label="IRN" value={documentPreview.irn} />}
                  {documentPreview.acknowledgementNumber && <DocumentDetail label="IRP acknowledgement" value={documentPreview.acknowledgementNumber} />}
                  {documentPreview.acknowledgementDate && <DocumentDetail label="Acknowledgement date" value={documentPreview.acknowledgementDate} />}
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
                    {documentPreview.lineItems?.length ? documentPreview.lineItems.map((item) => {
                      const lineAmount = item.quantity * item.rate;
                      const lineTax = documentPreview.kind === 'TAX INVOICE' ? lineAmount * ((documentPreview.gstRate ?? 0) / 100) : 0;
                      return <tr key={item.id} className="border-b border-slate-200">
                        <td className="py-4 pr-3 font-semibold">{item.description}</td>
                        {documentPreview.kind === 'TAX INVOICE' ? <>
                          <td className="py-4 px-3 text-right">{item.hsnSac || documentPreview.sacCode || '—'}</td>
                          <td className="py-4 px-3 text-right font-mono">{formatINR(lineAmount)}</td>
                          <td className="py-4 px-3 text-right">{documentPreview.gstRate ?? 0}%</td>
                          <td className="py-4 px-3 text-right font-mono">{formatINR(lineTax)}</td>
                          <td className="py-4 pl-3 text-right font-mono font-bold">{formatINR(lineAmount + lineTax)}</td>
                        </> : <>
                          <td className="py-4 px-3 text-right">{item.quantity}</td>
                          <td className="py-4 px-3 text-right font-mono">{formatINR(item.rate)}</td>
                          <td className="py-4 pl-3 text-right font-mono font-bold">{formatINR(lineAmount)}</td>
                        </>}
                      </tr>;
                    }) : (
                    <tr className="border-b border-slate-200">
                      <td className="py-4 pr-3 font-semibold">{documentPreview.kind === 'STATEMENT OF WORK' ? documentPreview.service : documentPreview.description}</td>
                      {documentPreview.kind === 'TAX INVOICE' ? (
                        <>
                          <td className="py-4 px-3 text-right">{documentPreview.sacCode || '—'}</td>
                          <td className="py-4 px-3 text-right font-mono">{formatINR(Math.max(0, (documentPreview.taxableAmount ?? documentPreview.amount) - (documentPreview.discount ?? 0)))}</td>
                          <td className="py-4 px-3 text-right">{documentPreview.gstRate ?? 0}%</td>
                          <td className="py-4 px-3 text-right font-mono">{formatINR(documentPreview.totalTax ?? 0)}</td>
                          <td className="py-4 pl-3 text-right font-mono font-bold">{formatINR(documentPreview.amount)}</td>
                        </>
                      ) : (
                        <>
                          <td className="py-4 px-3 text-right">1</td>
                          <td className="py-4 px-3 text-right font-mono">{formatINR(documentPreview.amount)}</td>
                          <td className="py-4 pl-3 text-right font-mono font-bold">{formatINR(documentPreview.amount)}</td>
                        </>
                      )}
                    </tr>)}
                  </tbody>
                </table>
              </div>

              <div className="ml-auto mt-5 w-full max-w-sm space-y-2 text-xs">
                <div className="flex justify-between gap-4 text-slate-600">
                  <span>{documentPreview.kind === 'TAX INVOICE' ? 'Taxable subtotal' : 'Subtotal'}</span>
                  <span className="font-mono">{formatINR(Math.max(0, (documentPreview.taxableAmount ?? documentPreview.amount) - (documentPreview.discount ?? 0)))}</span>
                </div>
                {documentPreview.kind === 'TAX INVOICE' ? (
                  <>
                    {(documentPreview.discount ?? 0) > 0 && <div className="flex justify-between gap-4 text-slate-600"><span>Discount</span><span className="font-mono">-{formatINR(documentPreview.discount ?? 0)}</span></div>}
                    {(documentPreview.cgstAmount ?? 0) > 0 && <div className="flex justify-between gap-4 text-slate-600"><span>CGST ({(documentPreview.gstRate ?? 0) / 2}%)</span><span className="font-mono">{formatINR(documentPreview.cgstAmount ?? 0)}</span></div>}
                    {(documentPreview.sgstAmount ?? 0) > 0 && <div className="flex justify-between gap-4 text-slate-600"><span>SGST ({(documentPreview.gstRate ?? 0) / 2}%)</span><span className="font-mono">{formatINR(documentPreview.sgstAmount ?? 0)}</span></div>}
                    {(documentPreview.igstAmount ?? 0) > 0 && <div className="flex justify-between gap-4 text-slate-600"><span>IGST ({documentPreview.gstRate ?? 0}%)</span><span className="font-mono">{formatINR(documentPreview.igstAmount ?? 0)}</span></div>}
                    <div className="flex justify-between gap-4 text-slate-600"><span>Total GST</span><span className="font-mono">{formatINR(documentPreview.totalTax ?? 0)}</span></div>
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
              {(documentPreview.customerNotes || documentPreview.terms) && <section className="mt-7 grid gap-4 border-t border-slate-200 pt-4 text-xs sm:grid-cols-2">
                {documentPreview.customerNotes && <div><h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Customer notes</h3><p className="mt-1 whitespace-pre-wrap text-slate-700">{documentPreview.customerNotes}</p></div>}
                {documentPreview.terms && <div><h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Terms and conditions</h3><p className="mt-1 whitespace-pre-wrap text-slate-700">{documentPreview.terms}</p></div>}
              </section>}
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
