import React, { useMemo, useState } from 'react';
import {
  ArrowLeft,
  BriefcaseBusiness,
  Building2,
  CalendarClock,
  CreditCard,
  FileText,
  Mail,
  MapPin,
  Search,
  ShieldCheck,
  Users,
  Wallet
} from 'lucide-react';
import type { AMCRenewal, Customer, Invoice, Lead, Proposal } from '../types/crm';
import { formatINR } from '../utils/currency';

interface CustomerPortalManagementProps {
  customers: Customer[];
  leads: Lead[];
  proposals: Proposal[];
  invoices: Invoice[];
  contracts: AMCRenewal[];
  onInviteCustomer: (customer: Customer) => void;
  onOpenCustomerRecord: (customer: Customer) => void;
}

const formatDate = (date: string) => date
  ? new Date(`${date}T00:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
  : 'Not set';

export default function CustomerPortalManagement({
  customers,
  leads,
  proposals,
  invoices,
  contracts,
  onInviteCustomer,
  onOpenCustomerRecord
}: CustomerPortalManagementProps) {
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const selectedCustomer = customers.find((customer) => customer.id === selectedCustomerId);
  const filteredCustomers = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return customers;
    return customers.filter((customer) =>
      [customer.companyName, customer.customerCode, customer.primaryContact, customer.email]
        .some((value) => value.toLowerCase().includes(term))
    );
  }, [customers, search]);

  const outstandingInvoices = invoices.filter((invoice) =>
    !['Paid', 'Voided'].includes(invoice.status)
  );
  const activeContracts = contracts.filter((contract) =>
    ['Active', 'Under Discussion'].includes(contract.status)
  );
  const upcomingRenewals = contracts.filter((contract) =>
    contract.status !== 'Cancelled' && contract.daysRemaining >= 0 && contract.daysRemaining <= 30
  );

  const customerInvoices = selectedCustomer
    ? invoices.filter((invoice) => invoice.customer === selectedCustomer.companyName)
    : [];
  const customerContracts = selectedCustomer
    ? contracts.filter((contract) => contract.customer === selectedCustomer.companyName)
    : [];
  const relatedLeads = selectedCustomer
    ? leads.filter((lead) => lead.company === selectedCustomer.companyName)
    : [];
  const customerProposals = selectedCustomer
    ? proposals.filter((proposal) => relatedLeads.some((lead) => lead.id === proposal.leadId))
    : [];

  if (selectedCustomer) {
    const balanceDue = customerInvoices.reduce((total, invoice) =>
      total + Math.max(0, invoice.amount - invoice.paidAmount), 0
    );

    return (
      <div className="space-y-5">
        <button
          type="button"
          onClick={() => setSelectedCustomerId(null)}
          className="inline-flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" />
          All customers
        </button>

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-start">
            <div className="flex items-start gap-4">
              <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-orange-50 text-[#e65b00]">
                <Building2 className="h-7 w-7" />
              </span>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">{selectedCustomer.customerCode}</p>
                <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900">{selectedCustomer.companyName}</h1>
                <p className="mt-1 text-sm text-slate-500">{selectedCustomer.customerType} · {selectedCustomer.industry}</p>
                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs text-slate-500">
                  <span className="inline-flex items-center gap-1.5"><Users className="h-3.5 w-3.5" />{selectedCustomer.primaryContact || 'Contact not set'}</span>
                  <span className="inline-flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" />{selectedCustomer.email || 'Email not set'}</span>
                  {selectedCustomer.city && <span className="inline-flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" />{selectedCustomer.city}</span>}
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => onInviteCustomer(selectedCustomer)}
                disabled={!selectedCustomer.email}
                className="inline-flex items-center gap-2 rounded-xl bg-[#ff6600] px-4 py-2.5 text-xs font-bold text-white transition hover:bg-[#e65b00] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ShieldCheck className="h-4 w-4" />
                Invite to portal
              </button>
              <button type="button" onClick={() => onOpenCustomerRecord(selectedCustomer)} className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50">
                Open customer record
              </button>
            </div>
          </div>
        </section>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <DetailMetric icon={BriefcaseBusiness} label="Lifetime business" value={formatINR(selectedCustomer.totalDealsValue)} />
          <DetailMetric icon={FileText} label="Proposals" value={String(customerProposals.length)} />
          <DetailMetric icon={CreditCard} label="Invoices" value={String(customerInvoices.length)} />
          <DetailMetric icon={Wallet} label="Balance due" value={formatINR(balanceDue)} />
        </div>

        <div className="grid gap-5 xl:grid-cols-2">
          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div><h2 className="text-sm font-bold text-slate-900">Commercials & invoices</h2><p className="mt-1 text-xs text-slate-500">Records associated with this customer</p></div>
              <CreditCard className="h-4 w-4 text-slate-400" />
            </div>
            {customerInvoices.length === 0 && customerProposals.length === 0 ? (
              <p className="rounded-xl bg-slate-50 p-4 text-xs text-slate-500">No proposals or invoices are linked to this customer yet.</p>
            ) : (
              <div className="space-y-2">
                {customerProposals.map((proposal) => (
                  <div key={proposal.id} className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 p-3">
                    <div><p className="text-xs font-semibold text-slate-800">{proposal.title}</p><p className="mt-1 text-[10px] text-slate-500">{proposal.proposalNumber} · {proposal.status}</p></div>
                    <span className="text-xs font-bold text-slate-700">{formatINR(proposal.amount)}</span>
                  </div>
                ))}
                {customerInvoices.map((invoice) => (
                  <div key={invoice.id} className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 p-3">
                    <div><p className="text-xs font-semibold text-slate-800">{invoice.invoiceNo}</p><p className="mt-1 text-[10px] text-slate-500">{invoice.type} · Due {formatDate(invoice.dueDate)}</p></div>
                    <div className="text-right"><p className="text-xs font-bold text-slate-700">{formatINR(invoice.amount)}</p><p className="mt-1 text-[10px] text-slate-500">{invoice.status}</p></div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div><h2 className="text-sm font-bold text-slate-900">Services & renewals</h2><p className="mt-1 text-xs text-slate-500">Contract status and account owner</p></div>
              <CalendarClock className="h-4 w-4 text-slate-400" />
            </div>
            <div className="mb-3 grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-slate-50 p-3"><p className="text-[10px] uppercase tracking-wide text-slate-500">Active contracts</p><p className="mt-1 text-lg font-extrabold">{selectedCustomer.activeContracts}</p></div>
              <div className="rounded-xl bg-slate-50 p-3"><p className="text-[10px] uppercase tracking-wide text-slate-500">AMC status</p><p className="mt-1 text-sm font-bold">{selectedCustomer.amcStatus}</p></div>
            </div>
            {customerContracts.length === 0 ? (
              <p className="rounded-xl bg-slate-50 p-4 text-xs text-slate-500">No contract records are linked. Account renewal date: {formatDate(selectedCustomer.renewalDate)}.</p>
            ) : (
              <div className="space-y-2">
                {customerContracts.map((contract) => (
                  <div key={contract.id} className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 p-3">
                    <div><p className="text-xs font-semibold text-slate-800">{contract.contractNo} · {contract.service}</p><p className="mt-1 text-[10px] text-slate-500">Expires {formatDate(contract.expiryDate)}</p></div>
                    <span className="rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-semibold text-emerald-700">{contract.status}</span>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-4 border-t border-slate-100 pt-3 text-xs text-slate-500">Account lead <span className="ml-1 font-semibold text-slate-800">{selectedCustomer.relationshipManager || 'Unassigned'}</span></div>
          </section>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <header className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full bg-orange-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-[#e65b00]"><ShieldCheck className="h-3.5 w-3.5" />Staff workspace</span>
          <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900">Customer Portal</h1>
          <p className="mt-1 text-xs text-slate-500">Manage customer access and review each customer’s service and billing details.</p>
        </div>
        <label className="relative block w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Find a customer…" aria-label="Search portal customers" className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm outline-none focus:border-orange-300 focus:ring-2 focus:ring-orange-100" />
        </label>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <PortalMetric icon={Building2} label="Customers" value={customers.length} detail="Customer accounts" tone="orange" />
        <PortalMetric icon={ShieldCheck} label="Portal-ready" value={customers.filter((customer) => Boolean(customer.email.trim())).length} detail="Have a contact email" tone="green" />
        <PortalMetric icon={CreditCard} label="Unpaid invoices" value={outstandingInvoices.length} detail="Open or overdue" tone="blue" />
        <PortalMetric icon={CalendarClock} label="Renewals due" value={upcomingRenewals.length} detail="Within 30 days" tone="violet" />
      </div>

      <section>
        <div className="mb-3 flex items-center justify-between gap-3">
          <div><h2 className="text-sm font-bold text-slate-900">All customers</h2><p className="mt-1 text-xs text-slate-500">Select a customer card to open their portal details.</p></div>
          <span className="text-xs font-medium text-slate-500">{filteredCustomers.length} accounts</span>
        </div>
        {filteredCustomers.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-12 text-center text-sm text-slate-500">
            {customers.length ? 'No customers match your search.' : 'Add customers to the CRM to see them here.'}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filteredCustomers.map((customer) => {
              const accountInvoices = invoices.filter((invoice) => invoice.customer === customer.companyName);
              const accountContracts = contracts.filter((contract) => contract.customer === customer.companyName);
              const openInvoiceCount = accountInvoices.filter((invoice) => !['Paid', 'Voided'].includes(invoice.status)).length;
              return (
                <button
                  key={customer.id}
                  type="button"
                  onClick={() => setSelectedCustomerId(customer.id)}
                  className="group rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-orange-200 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400"
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="grid h-11 w-11 place-items-center rounded-xl bg-orange-50 text-[#e65b00]"><Building2 className="h-5 w-5" /></span>
                    <span className={`rounded-full px-2 py-1 text-[9px] font-bold uppercase tracking-wide ${customer.email ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>{customer.email ? 'Portal ready' : 'Email needed'}</span>
                  </div>
                  <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">{customer.customerCode}</p>
                  <h3 className="mt-1 truncate text-base font-extrabold text-slate-900">{customer.companyName}</h3>
                  <p className="mt-1 truncate text-xs text-slate-500">{customer.primaryContact || customer.customerType} · {customer.industry}</p>
                  <div className="mt-4 grid grid-cols-3 gap-2 border-t border-slate-100 pt-3">
                    <div><p className="text-[9px] uppercase tracking-wide text-slate-400">Contracts</p><p className="mt-1 text-xs font-bold text-slate-800">{accountContracts.length || customer.activeContracts}</p></div>
                    <div><p className="text-[9px] uppercase tracking-wide text-slate-400">Open invoices</p><p className="mt-1 text-xs font-bold text-slate-800">{openInvoiceCount}</p></div>
                    <div><p className="text-[9px] uppercase tracking-wide text-slate-400">Lifetime</p><p className="mt-1 truncate text-xs font-bold text-slate-800">{formatINR(customer.totalDealsValue)}</p></div>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-[10px] text-slate-500"><span className="truncate">{customer.email || 'No email on file'}</span><span className="ml-2 font-semibold text-[#e65b00] transition group-hover:translate-x-0.5">Details →</span></div>
                </button>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

function PortalMetric({ icon: Icon, label, value, detail, tone }: { icon: typeof Building2; label: string; value: number; detail: string; tone: 'orange' | 'green' | 'blue' | 'violet' }) {
  const colors = {
    orange: 'bg-orange-50 text-orange-700',
    green: 'bg-emerald-50 text-emerald-700',
    blue: 'bg-sky-50 text-sky-700',
    violet: 'bg-violet-50 text-violet-700'
  };
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <span className={`grid h-9 w-9 place-items-center rounded-xl ${colors[tone]}`}><Icon className="h-4 w-4" /></span>
      <div className="mt-4 flex items-end justify-between gap-3"><div><p className="text-[11px] font-medium text-slate-500">{label}</p><p className="mt-1 text-2xl font-extrabold text-slate-900">{value}</p></div><span className="text-[10px] text-slate-400">{detail}</span></div>
    </div>
  );
}

function DetailMetric({ icon: Icon, label, value }: { icon: typeof BriefcaseBusiness; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <Icon className="h-4 w-4 text-slate-400" />
      <p className="mt-3 text-[11px] font-medium text-slate-500">{label}</p>
      <p className="mt-1 truncate text-lg font-extrabold text-slate-900">{value}</p>
    </div>
  );
}
