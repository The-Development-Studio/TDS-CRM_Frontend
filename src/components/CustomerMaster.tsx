import React, { useState } from 'react';
import {
  Building2,
  Search,
  Plus,
  Download,
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Pencil,
  Trash2,
  Eye,
  MailPlus,
  MessageCircle
} from 'lucide-react';
import type { Customer } from '../types/crm';
import { formatINR } from '../utils/currency';

type CustomerSortKey =
  | 'customerCode'
  | 'companyName'
  | 'customerType'
  | 'industry'
  | 'primaryContact'
  | 'totalDealsValue'
  | 'activeContracts'
  | 'amcStatus'
  | 'relationshipManager';

interface CustomerMasterProps {
  customers: Customer[];
  onSelectCustomer?: (customer: Customer) => void;
  onNewCustomer: () => void;
  onEditCustomer: (customer: Customer) => void;
  onDeleteCustomer: (customer: Customer) => void;
  onInvitePortalAccess?: (customer: Customer) => void;
  onOpenWhatsApp?: (customer: Customer) => void;
}

export const CustomerMaster: React.FC<CustomerMasterProps> = ({
  customers,
  onSelectCustomer,
  onNewCustomer,
  onEditCustomer,
  onDeleteCustomer,
  onInvitePortalAccess,
  onOpenWhatsApp
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [industryFilter, setIndustryFilter] = useState('All');
  const [sortKey, setSortKey] = useState<CustomerSortKey>('companyName');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const filteredCustomers = customers.filter((cust) => {
    const matchesSearch =
      cust.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cust.customerCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cust.primaryContact.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cust.city.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = typeFilter === 'All' || cust.customerType === typeFilter;
    const matchesIndustry = industryFilter === 'All' || cust.industry === industryFilter;

    return matchesSearch && matchesType && matchesIndustry;
  });

  const sortedCustomers = [...filteredCustomers].sort((left, right) => {
    const leftValue = left[sortKey];
    const rightValue = right[sortKey];
    const comparison =
      typeof leftValue === 'number' && typeof rightValue === 'number'
        ? leftValue - rightValue
        : String(leftValue).localeCompare(String(rightValue));

    return sortDirection === 'asc' ? comparison : -comparison;
  });

  const clearFilters = () => {
    setSearchTerm('');
    setTypeFilter('All');
    setIndustryFilter('All');
  };

  const renderSortHeader = (
    label: string,
    key: CustomerSortKey,
    alignment = 'justify-start'
  ) => {
    const active = sortKey === key;
    const SortIcon = active ? (sortDirection === 'asc' ? ArrowUp : ArrowDown) : ArrowUpDown;

    return (
      <th
        className="py-3.5 px-4"
        aria-sort={active ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}
      >
        <button
          type="button"
          onClick={() => {
            if (sortKey === key) {
              setSortDirection((direction) => (direction === 'asc' ? 'desc' : 'asc'));
            } else {
              setSortKey(key);
              setSortDirection('asc');
            }
          }}
          className={`inline-flex items-center gap-1.5 ${alignment} w-full text-left hover:text-[#ff6600] transition-colors`}
        >
          {label}
          <SortIcon className="w-3 h-3 shrink-0" aria-hidden="true" />
        </button>
      </th>
    );
  };

  return (
    <div className="space-y-4 sm:space-y-5 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 p-4 sm:p-5 rounded-2xl bg-[#111827]/90 border border-slate-800 shadow-lg">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-extrabold text-white tracking-tight">Company & Customer Master</h1>
            <span className="px-2 py-0.5 rounded-full text-xs font-mono font-semibold bg-emerald-500/20 text-emerald-700 border border-emerald-500/30">
              {filteredCustomers.length} {filteredCustomers.length === 1 ? 'Account' : 'Accounts'}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Converted accounts, active service contracts, annual maintenance (AMC), and billing relationship records
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => {
              const csvContent =
                'data:text/csv;charset=utf-8,' +
                ['Customer Code,Company Name,Customer GSTIN,Customer Type,Industry,Contact,Email,Phone,Deals Value (INR)']
                  .concat(
                    customers.map(
                      (c) =>
                        `${c.customerCode},${c.companyName},${c.customerGstin || ''},${c.customerType},${c.industry},${c.primaryContact},${c.email},${c.phone},${c.totalDealsValue}`
                    )
                  )
                  .join('\n');
              const encodedUri = encodeURI(csvContent);
              const link = document.createElement('a');
              link.setAttribute('href', encodedUri);
              link.setAttribute('download', 'TDS_Customers.csv');
              document.body.appendChild(link);
              link.click();
            }}
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" /> Export
          </button>
          <button
            onClick={onNewCustomer}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-semibold shadow-md shadow-emerald-600/30 transition flex items-center gap-1.5 cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4" /> Add Company
          </button>
        </div>
      </div>

      {/* Filter bar */}
      <div className="p-3 sm:p-3.5 rounded-2xl bg-[#111827]/70 border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="relative w-full flex-1 sm:max-w-md">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            aria-label="Search customers"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by company name, code, contact or location..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-900 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
          <select
            value={typeFilter}
            aria-label="Filter by customer type"
            onChange={(e) => setTypeFilter(e.target.value)}
            className="min-w-0 flex-1 bg-slate-900 border border-slate-700 rounded-xl px-2.5 sm:px-3 py-1.5 text-xs text-white sm:flex-initial"
          >
            <option value="All">All Customer Types</option>
            <option value="Enterprise">Enterprise</option>
            <option value="SMB">SMB</option>
            <option value="Startup">Startup</option>
            <option value="Government">Government</option>
          </select>

          <select
            value={industryFilter}
            aria-label="Filter by industry"
            onChange={(e) => setIndustryFilter(e.target.value)}
            className="min-w-0 flex-1 bg-slate-900 border border-slate-700 rounded-xl px-2.5 sm:px-3 py-1.5 text-xs text-white sm:flex-initial"
          >
            <option value="All">All Industries</option>
            <option value="FinTech">FinTech</option>
            <option value="Healthcare">Healthcare</option>
            <option value="Logistics">Logistics</option>
            <option value="SaaS & Cloud">SaaS & Cloud</option>
            <option value="E-Commerce">E-Commerce</option>
          </select>
        </div>
        <span className="w-full text-[11px] text-slate-400 sm:w-auto sm:ml-auto" aria-live="polite">
          Showing {filteredCustomers.length} of {customers.length} accounts
        </span>
      </div>

      {/* Customer Grid / Table */}
      <div className="rounded-2xl bg-[#111827]/80 border border-slate-800 shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-900/90 border-b border-slate-800 text-[10px] uppercase font-bold text-slate-300 tracking-wider">
                {renderSortHeader('Customer Code', 'customerCode')}
                {renderSortHeader('Company Name & Hub', 'companyName')}
                {renderSortHeader('Customer Type', 'customerType')}
                {renderSortHeader('Industry Domain', 'industry')}
                {renderSortHeader('Primary Stakeholder', 'primaryContact')}
                {renderSortHeader('Lifetime Deals', 'totalDealsValue', 'justify-end')}
                {renderSortHeader('Active SLAs', 'activeContracts', 'justify-center')}
                {renderSortHeader('AMC Status', 'amcStatus')}
                {renderSortHeader('Account Lead', 'relationshipManager')}
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {sortedCustomers.map((cust) => (
                <tr key={cust.id} className="hover:bg-slate-800/40 transition">
                  <td className="py-3 px-4 font-mono font-bold text-indigo-400">{cust.customerCode}</td>

                  <td className="py-3 px-4">
                    <div className="font-bold text-white text-xs">{cust.companyName}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">{cust.city}</div>
                    {cust.customerGstin && <div className="mt-0.5 font-mono text-[9px] text-cyan-400">GSTIN {cust.customerGstin}</div>}
                  </td>

                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                        cust.customerType === 'Enterprise'
                          ? 'bg-purple-500/20 text-purple-700 border border-purple-500/30'
                          : 'bg-blue-500/20 text-blue-700 border border-blue-500/30'
                      }`}
                    >
                      {cust.customerType}
                    </span>
                  </td>

                  <td className="py-3 px-4">
                    <span className="text-slate-300 font-semibold">{cust.industry}</span>
                  </td>

                  <td className="py-3 px-4">
                    <div className="text-slate-200 font-semibold">{cust.primaryContact}</div>
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">{cust.email}</div>
                  </td>

                  <td className="py-3 px-4 text-right font-mono font-bold text-emerald-400">
                    {formatINR(cust.totalDealsValue)}
                  </td>

                  <td className="py-3 px-4 text-center font-mono text-cyan-300">
                    {cust.activeContracts} SOWs
                  </td>

                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        cust.amcStatus === 'Active'
                          ? 'bg-emerald-500/20 text-emerald-700 border border-emerald-500/40'
                          : 'bg-amber-500/20 text-amber-700 border border-amber-500/40'
                      }`}
                    >
                      {cust.amcStatus}
                    </span>
                    <div className="text-[9px] text-slate-300 mt-0.5 font-mono">Renews: {cust.renewalDate}</div>
                  </td>

                  <td className="py-3 px-4 text-slate-300">{cust.relationshipManager}</td>
                  <td className="py-3 px-4 text-right">
                    {onOpenWhatsApp && cust.phone && (
                      <button type="button" onClick={() => onOpenWhatsApp(cust)} title="Message customer on WhatsApp" aria-label={`Message ${cust.companyName} on WhatsApp`} className="rounded-lg p-1.5 text-slate-500 hover:bg-emerald-50 hover:text-emerald-600"><MessageCircle className="h-3.5 w-3.5" /></button>
                    )}
                    {onInvitePortalAccess && (
                      <button
                        type="button"
                        onClick={() => onInvitePortalAccess(cust)}
                        title="Invite customer to portal"
                        aria-label={`Invite ${cust.companyName} to the customer portal`}
                        className="rounded-lg p-1.5 text-slate-500 hover:bg-orange-50 hover:text-[#ff6600]"
                      >
                        <MailPlus className="h-3.5 w-3.5" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => onSelectCustomer?.(cust)}
                      title="Open Customer 360"
                      aria-label={`Open Customer 360 for ${cust.companyName}`}
                      className="rounded-lg p-1.5 text-slate-500 hover:bg-orange-50 hover:text-[#ff6600]"
                    >
                      <Eye className="h-3.5 w-3.5" />
                    </button>
                    <button type="button" onClick={() => onEditCustomer(cust)} title="Edit customer" aria-label={`Edit customer ${cust.companyName}`} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-[#ff6600]">
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm(`Delete customer ${cust.companyName}? This cannot be undone.`)) onDeleteCustomer(cust);
                      }}
                      title="Delete customer"
                      aria-label={`Delete customer ${cust.companyName}`}
                      className="rounded-lg p-1.5 text-slate-500 hover:bg-rose-50 hover:text-rose-600"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
              {sortedCustomers.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-6 py-16 text-center">
                    <Building2 className="w-8 h-8 mx-auto text-slate-400" aria-hidden="true" />
                    <p className="mt-3 text-sm font-semibold text-slate-700">No matching accounts</p>
                    <p className="mt-1 text-xs text-slate-500">Try a different search or clear the selected filters.</p>
                    <button
                      type="button"
                      onClick={clearFilters}
                      className="mt-4 rounded-lg bg-[#ff6600] px-3 py-2 text-xs font-semibold text-white hover:bg-[#e65c00] transition-colors"
                    >
                      Clear filters
                    </button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
