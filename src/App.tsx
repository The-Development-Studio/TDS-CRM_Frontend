import React, { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { ArrowUp } from 'lucide-react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { CustomerPortalInviteModal } from './components/CustomerPortalInviteModal';
import { StaffLogin, StaffUser } from './components/StaffLogin';
import { StaffInviteModal } from './components/StaffInviteModal';
import { MyProfile } from './components/MyProfile';
import { NewLeadModal } from './components/NewLeadModal';
import { RecordEditorField, RecordEditorModal, RecordEditorValues } from './components/RecordEditorModal';
import type {
  Lead,
  Customer,
  Activity,
  Opportunity,
  Proposal,
  Invoice,
  AMCRenewal,
  StaffAssignee
} from './types/crm';
import { loadOrganizationProfile, saveOrganizationProfile } from './data/organization';
import type { OrganizationProfile } from './types/crm';
import { isArrayOf, usePersistentState } from './hooks/usePersistentState';
import { prepareStaffData } from './data/staffData';
import { allPageAccessIds, pageForView } from './data/pageAccess';

const Dashboard = lazy(() => import('./components/Dashboard').then(({ Dashboard }) => ({ default: Dashboard })));
const ActivitiesHub = lazy(() => import('./components/ActivitiesHub').then(({ ActivitiesHub }) => ({ default: ActivitiesHub })));
const LeadList = lazy(() => import('./components/LeadList').then(({ LeadList }) => ({ default: LeadList })));
const Lead360View = lazy(() => import('./components/Lead360View').then(({ Lead360View }) => ({ default: Lead360View })));
const CustomerMaster = lazy(() => import('./components/CustomerMaster').then(({ CustomerMaster }) => ({ default: CustomerMaster })));
const Customer360View = lazy(() => import('./components/Customer360View').then(({ Customer360View }) => ({ default: Customer360View })));
const SalesPipeline = lazy(() => import('./components/SalesPipeline').then(({ SalesPipeline }) => ({ default: SalesPipeline })));
const QuotationsPage = lazy(() => import('./components/QuotationsPage'));
const ProposalsPage = lazy(() => import('./components/ProposalsPage'));
const ProformaInvoicesPage = lazy(() => import('./components/ProformaInvoicesPage'));
const TaxInvoicesPage = lazy(() => import('./components/TaxInvoicesPage'));
const PaymentRecordsPage = lazy(() => import('./components/PaymentRecordsPage'));
const AMCRenewalView = lazy(() => import('./components/AMCRenewalView').then(({ AMCRenewalView }) => ({ default: AMCRenewalView })));
const DocumentsHub = lazy(() => import('./components/DocumentsHub').then(({ DocumentsHub }) => ({ default: DocumentsHub })));
const AnalyticsHub = lazy(() => import('./components/AnalyticsHub').then(({ AnalyticsHub }) => ({ default: AnalyticsHub })));
const AdminHub = lazy(() => import('./components/AdminHub').then(({ AdminHub }) => ({ default: AdminHub })));
const OrganizationSetup = lazy(() => import('./components/OrganizationSetup').then(({ OrganizationSetup }) => ({ default: OrganizationSetup })));
const SupportManagement = lazy(() => import('./components/SupportManagement'));
const CustomerPortalApp = lazy(() => import('./components/CustomerPortalApp'));
const CustomerPortalManagement = lazy(() => import('./components/CustomerPortalManagement'));

const ViewFallback = () => (
  <div className="flex min-h-48 items-center justify-center text-sm font-medium text-slate-500" role="status">
    Loading view…
  </div>
);

type EditableRecord =
  | { type: 'lead'; record: Lead }
  | { type: 'customer'; record: Customer }
  | { type: 'activity'; record: Activity }
  | { type: 'opportunity'; record: Opportunity }
  | { type: 'proposal'; record: Proposal }
  | { type: 'invoice'; record: Invoice }
  | { type: 'amc'; record: AMCRenewal };

const getEditorConfig = (item: EditableRecord, assignees: StaffAssignee[] = []): { title: string; fields: RecordEditorField[] } => {
  switch (item.type) {
    case 'lead':
      return {
        title: 'Edit lead',
        fields: [
          { key: 'name', label: 'Contact name', required: true },
          { key: 'designation', label: 'Designation' },
          { key: 'company', label: 'Company', required: true },
          { key: 'email', label: 'Email', type: 'email' },
          { key: 'phone', label: 'Phone', type: 'tel' },
          { key: 'website', label: 'Website', type: 'url' },
          { key: 'source', label: 'Source', type: 'select', options: [
            { label: 'Google Ads', value: 'Google Ads' }, { label: 'Website', value: 'Website' },
            { label: 'Referral', value: 'Referral' }, { label: 'Meta Ads', value: 'Meta Ads' },
            { label: 'Instagram', value: 'Instagram' }, { label: 'Direct', value: 'Direct' }, { label: 'Other', value: 'Other' }
          ] },
          { key: 'campaign', label: 'Campaign' },
          { key: 'interestedService', label: 'Interested service', fullWidth: true },
          { key: 'estimatedBudget', label: 'Estimated budget (INR)', type: 'number', min: 0 },
          { key: 'leadOwner', label: 'Lead owner', type: 'select', options: [
            { label: 'Unassigned', value: '' },
            ...assignees.map((assignee) => ({ label: `${assignee.name} (${assignee.email})`, value: assignee.name })),
            ...(item.record.leadOwner && !assignees.some((assignee) => assignee.name === item.record.leadOwner)
              ? [{ label: `${item.record.leadOwner} (inactive)`, value: item.record.leadOwner }]
              : [])
          ] },
          { key: 'status', label: 'Status', type: 'select', options: [
            ...(['New', 'Assigned', 'Contacted', 'Requirement Collected', 'Qualified', 'Opportunity Created', 'Unqualified', 'Converted'] as const)
              .map((value) => ({ label: value, value }))
          ] },
          { key: 'priority', label: 'Priority', type: 'select', options: [
            ...(['Urgent', 'High', 'Medium', 'Low'] as const).map((value) => ({ label: value, value }))
          ] },
          { key: 'nextFollowUp', label: 'Next follow-up', type: 'date' },
          { key: 'nextFollowUpTime', label: 'Follow-up time' },
          { key: 'requirement', label: 'Requirement notes', type: 'textarea', fullWidth: true }
        ]
      };
    case 'customer':
      return {
        title: 'Edit customer',
        fields: [
          { key: 'companyName', label: 'Company name', required: true },
          { key: 'customerCode', label: 'Customer code', required: true },
          { key: 'customerType', label: 'Customer type', type: 'select', options: [
            ...(['Enterprise', 'SMB', 'Startup', 'Government', 'Partner'] as const).map((value) => ({ label: value, value }))
          ] },
          { key: 'industry', label: 'Industry', type: 'select', options: [
            ...(['FinTech', 'Healthcare', 'E-Commerce', 'SaaS & Cloud', 'Logistics', 'Manufacturing', 'EdTech'] as const).map((value) => ({ label: value, value }))
          ] },
          { key: 'primaryContact', label: 'Primary contact' },
          { key: 'email', label: 'Email', type: 'email' },
          { key: 'phone', label: 'Phone', type: 'tel' },
          { key: 'city', label: 'City' },
          { key: 'totalDealsValue', label: 'Lifetime deals (INR)', type: 'number', min: 0 },
          { key: 'activeContracts', label: 'Active contracts', type: 'number', min: 0 },
          { key: 'amcStatus', label: 'AMC status', type: 'select', options: [
            ...(['Active', 'Expiring Soon', 'Expired', 'None'] as const).map((value) => ({ label: value, value }))
          ] },
          { key: 'renewalDate', label: 'Renewal date', type: 'date' },
          { key: 'relationshipManager', label: 'Account lead' },
          { key: 'internalDocumentLink', label: 'Internal document link', type: 'url', fullWidth: true }
        ]
      };
    case 'activity':
      return {
        title: 'Edit activity',
        fields: [
          { key: 'title', label: 'Activity title', required: true },
          { key: 'type', label: 'Activity type', type: 'select', options: [
            ...(['Call', 'WhatsApp', 'Meeting', 'Email', 'Requirement Log', 'Proposal', 'System'] as const).map((value) => ({ label: value, value }))
          ] },
          { key: 'date', label: 'Date', type: 'date' },
          { key: 'time', label: 'Time' },
          { key: 'status', label: 'Status', type: 'select', options: [
            ...(['Completed', 'Pending', 'Scheduled'] as const).map((value) => ({ label: value, value }))
          ] },
          { key: 'category', label: 'Category', type: 'select', options: [
            ...(['Today', 'Overdue', 'Tomorrow', 'This Week'] as const).map((value) => ({ label: value, value }))
          ] },
          { key: 'description', label: 'Description', type: 'textarea', fullWidth: true }
        ]
      };
    case 'opportunity':
      return {
        title: 'Edit opportunity',
        fields: [
          { key: 'name', label: 'Opportunity name', required: true, fullWidth: true },
          { key: 'company', label: 'Company', required: true },
          { key: 'stage', label: 'Stage', type: 'select', options: [
            ...(['New', 'Contacted', 'Requirement Collected', 'Qualified', 'Opportunity', 'Proposal Sent', 'Negotiation', 'Won', 'Lost'] as const)
              .map((value) => ({ label: value, value }))
          ] },
          { key: 'amount', label: 'Deal value (INR)', type: 'number', min: 0 },
          { key: 'expectedClose', label: 'Expected close', type: 'date' },
          { key: 'probability', label: 'Win probability (%)', type: 'number', min: 0, max: 100 },
          { key: 'owner', label: 'Owner' }
        ]
      };
    case 'proposal':
      return {
        title: 'Edit draft quotation / SOW',
        fields: [
          { key: 'proposalNumber', label: 'Document number', required: true },
          { key: 'title', label: 'Document title', required: true, fullWidth: true },
          { key: 'service', label: 'Service' },
          { key: 'amount', label: 'Value (INR)', type: 'number', min: 0 },
          { key: 'sentDate', label: 'Issue date', type: 'date' },
          { key: 'validUntil', label: 'Valid until', type: 'date' },
          { key: 'status', label: 'Status', type: 'select', options: [{ label: 'Draft', value: 'Draft' }] }
        ]
      };
    case 'invoice':
      return {
        title: item.record.paidAmount > 0 ? 'Edit invoice details' : 'Edit invoice',
        fields: [
          { key: 'invoiceNo', label: 'Invoice number', required: true },
          { key: 'type', label: 'Document type', type: 'select', options: [
            { label: 'Tax Invoice', value: 'Tax Invoice' },
            { label: 'Proforma Invoice', value: 'Proforma' }
          ] },
          { key: 'customer', label: 'Customer', required: true },
          { key: 'amount', label: 'Invoice value (INR)', type: 'number', min: 0 },
          ...(item.record.paidAmount === 0 ? [
            { key: 'status', label: 'Status', type: 'select' as const, options: [
              { label: 'Outstanding', value: 'Outstanding' },
              { label: 'Overdue', value: 'Overdue' }
            ] }
          ] : []),
          { key: 'issueDate', label: 'Issue date', type: 'date' },
          { key: 'dueDate', label: 'Due date', type: 'date' }
        ]
      };
    case 'amc':
      return {
        title: 'AMC contract',
        fields: [
          { key: 'contractNo', label: 'Contract number', required: true },
          { key: 'customer', label: 'Customer', required: true },
          { key: 'service', label: 'Service', fullWidth: true },
          { key: 'annualValue', label: 'Annual value (INR)', type: 'number', min: 0 },
          { key: 'expiryDate', label: 'Expiry date', type: 'date' },
          { key: 'daysRemaining', label: 'Days remaining', type: 'number', min: 0 },
          { key: 'owner', label: 'Account lead' },
          { key: 'urgency', label: 'Renewal window', type: 'select', options: [
            ...(['7 Days', '15 Days', '30 Days', '60 Days'] as const).map((value) => ({ label: value, value }))
          ] },
          { key: 'status', label: 'Contract status', type: 'select', options: [
            ...(['Active', 'Under Discussion', 'Renewed', 'At Risk', 'Cancelled'] as const).map((value) => ({ label: value, value }))
          ] }
        ]
      };
  }
};

function CrmApp({ staffUser, onStaffUserChange, onLogout }: { staffUser: StaffUser; onStaffUserChange: (user: StaffUser) => void; onLogout: () => Promise<void> }) {
  const allowedPages = staffUser.role === 'admin' ? allPageAccessIds : staffUser.pageAccess;
  const [currentView, setCurrentView] = useState<string>(() => allowedPages[0] ?? 'dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [portalInviteCustomer, setPortalInviteCustomer] = useState<Customer | null>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const mainContentRef = useRef<HTMLElement | null>(null);

  // Core state collections
  const [leads, setLeads] = usePersistentState<Lead[]>('tds-crm:v2:leads', [], isArrayOf<Lead>);
  const [customers, setCustomers] = usePersistentState<Customer[]>('tds-crm:v2:customers', [], isArrayOf<Customer>);
  const [activities, setActivities] = usePersistentState<Activity[]>('tds-crm:v2:activities', [], isArrayOf<Activity>);
  const [opportunities, setOpportunities] = usePersistentState<Opportunity[]>('tds-crm:v2:opportunities', [], isArrayOf<Opportunity>);
  const [proposals, setProposals] = usePersistentState<Proposal[]>('tds-crm:v2:proposals', [], isArrayOf<Proposal>);
  const [invoices, setInvoices] = usePersistentState<Invoice[]>('tds-crm:v2:invoices', [], isArrayOf<Invoice>);
  const [amcRenewals, setAmcRenewals] = usePersistentState<AMCRenewal[]>('tds-crm:v2:amc-renewals', [], isArrayOf<AMCRenewal>);
  const [organization, setOrganization] = useState<OrganizationProfile>(loadOrganizationProfile);
  const [syncError, setSyncError] = useState('');
  const [showStaffInvite, setShowStaffInvite] = useState(false);
  const [showMyProfile, setShowMyProfile] = useState(false);
  const [staffAssignees, setStaffAssignees] = useState<StaffAssignee[]>([]);
  const lastSyncedCollections = useRef<Record<string, unknown[]>>({});
  const syncQueue = useRef(Promise.resolve());

  // Modal controls
  const [isNewLeadModalOpen, setIsNewLeadModalOpen] = useState<boolean>(false);
  const [editingRecord, setEditingRecord] = useState<EditableRecord | null>(null);

  // Selected lead object for 360 view
  const currentLead = leads.find((l) => l.id === selectedLeadId) || leads[0];
  const currentCustomer = customers.find((customer) => customer.id === selectedCustomerId);

  useEffect(() => {
    ['leads', 'customers', 'activities', 'opportunities', 'proposals', 'invoices', 'amc-renewals']
      .forEach((key) => localStorage.removeItem(`tds-crm:v1:${key}`));
  }, []);

  useEffect(() => {
    if (!allowedPages.includes('leads')) return;
    fetch('/api/staff-auth/assignees', { credentials: 'include' })
      .then(async (response) => {
        const result = await response.json().catch(() => ({})) as { data?: StaffAssignee[]; error?: string };
        if (!response.ok || !result.data) throw new Error(result.error || `Could not load lead owners (${response.status})`);
        setStaffAssignees(result.data);
      })
      .catch((reason: unknown) => setSyncError(reason instanceof Error ? reason.message : 'Could not load lead owners.'));
  }, [allowedPages]);

  useEffect(() => {
    if (!allowedPages.includes(pageForView(currentView))) setCurrentView(allowedPages[0] ?? 'dashboard');
  }, [allowedPages, currentView]);

  useEffect(() => {
    const collections = {
      leads,
      customers,
      activities,
      opportunities,
      proposals,
      invoices,
      contracts: amcRenewals
    };
    const previous = lastSyncedCollections.current;
    const changed = Object.entries(collections).filter(([name, records]) => previous[name] !== records);
    if (!Object.keys(previous).length) {
      lastSyncedCollections.current = collections;
      return;
    }

    lastSyncedCollections.current = collections;
    for (const [resource, records] of changed) {
      const oldRecords = previous[resource] as { id: string }[] | undefined;
      const previousIds = new Set(oldRecords?.map((record) => record.id) ?? []);
      const currentIds = new Set((records as { id: string }[]).map((record) => record.id));
      const removedIds = [...previousIds].filter((id) => !currentIds.has(id));
      const batches: Promise<void>[] = [];
      for (let index = 0; index < records.length; index += 250) {
        const upsert = records.slice(index, index + 250);
        batches.push(fetch(`/api/${resource}/sync`, {
          method: 'PUT',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ upsert, deleteIds: [] })
        }).then(async (response) => {
          if (!response.ok) {
            const result = await response.json().catch(() => ({})) as { error?: string };
            throw new Error(result.error || `Could not sync ${resource} (${response.status})`);
          }
        }));
      }
      for (let index = 0; index < removedIds.length; index += 250) {
        const deleteIds = removedIds.slice(index, index + 250);
        batches.push(fetch(`/api/${resource}/sync`, {
          method: 'PUT',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ upsert: [], deleteIds })
        }).then(async (response) => {
          if (!response.ok) {
            const result = await response.json().catch(() => ({})) as { error?: string };
            throw new Error(result.error || `Could not sync ${resource} (${response.status})`);
          }
        }));
      }
      syncQueue.current = syncQueue.current
        .then(() => Promise.all(batches).then(() => undefined))
        .then(() => setSyncError(''))
        .catch((reason: unknown) => setSyncError(reason instanceof Error ? reason.message : 'CRM data sync failed.'));
    }
  }, [leads, customers, activities, opportunities, proposals, invoices, amcRenewals]);

  useEffect(() => {
    mainContentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    setShowScrollTop(false);
  }, [currentView, selectedLeadId]);

  useEffect(() => {
    const updateSidebarForViewport = () => {
      if (window.innerWidth < 1024) {
        setSidebarCollapsed(false);
      } else {
        setMobileSidebarOpen(false);
      }
    };

    updateSidebarForViewport();
    window.addEventListener('resize', updateSidebarForViewport);
    return () => window.removeEventListener('resize', updateSidebarForViewport);
  }, []);

  const handleMainScroll = () => {
    setShowScrollTop((mainContentRef.current?.scrollTop ?? 0) > 360);
  };

  const scrollToTop = () => {
    mainContentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handlers
  const handleNavigate = (view: string) => {
    if (!allowedPages.includes(pageForView(view))) {
      setSyncError('You do not have access to that page. Ask an administrator to update your page access.');
      return;
    }
    setSyncError('');
    setCurrentView(view);
    if (view !== 'lead-360') {
      setSelectedLeadId(null);
    }
    if (view !== 'customer-360') setSelectedCustomerId(null);
  };

  const handleSaveOrganization = (profile: OrganizationProfile) => {
    setOrganization(profile);
    saveOrganizationProfile(profile);
    syncQueue.current = syncQueue.current
      .then(async () => {
        const response = await fetch('/api/staff-data/organization', {
          method: 'PUT',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(profile)
        });
        if (!response.ok) {
          const result = await response.json().catch(() => ({})) as { error?: string };
          throw new Error(result.error || `Could not sync organization profile (${response.status})`);
        }
        setSyncError('');
      })
      .catch((reason: unknown) => setSyncError(reason instanceof Error ? reason.message : 'Organization profile sync failed.'));
  };

  const handleSaveEditedRecord = (values: RecordEditorValues) => {
    if (!editingRecord) return;
    const record = { ...editingRecord.record, ...values };

    switch (editingRecord.type) {
      case 'lead':
        if ((record as Lead).leadOwner !== editingRecord.record.leadOwner) {
          const owner = (record as Lead).leadOwner;
          (record as Lead).status = owner
            ? editingRecord.record.status === 'New' ? 'Assigned' : editingRecord.record.status
            : editingRecord.record.status === 'Assigned' ? 'New' : editingRecord.record.status;
          setActivities((current) => [{
            id: `act-assignment-${Date.now()}`,
            leadId: editingRecord.record.id,
            leadName: (record as Lead).name,
            company: (record as Lead).company,
            type: 'System',
            title: owner ? 'Lead assigned' : 'Lead unassigned',
            description: owner ? `Assigned to ${owner} by ${staffUser.name}` : `Assignment removed by ${staffUser.name}`,
            date: new Date().toISOString().split('T')[0],
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            user: staffUser.name,
            priority: 'Medium',
            status: 'Completed',
            category: 'Today'
          }, ...current]);
        }
        setLeads((current) => current.some((item) => item.id === editingRecord.record.id)
          ? current.map((item) => item.id === editingRecord.record.id ? record as Lead : item)
          : [record as Lead, ...current]);
        break;
      case 'customer':
        setCustomers((current) => current.some((item) => item.id === editingRecord.record.id)
          ? current.map((item) => item.id === editingRecord.record.id ? record as Customer : item)
          : [record as Customer, ...current]);
        break;
      case 'activity':
        setActivities((current) => current.some((item) => item.id === editingRecord.record.id)
          ? current.map((item) => item.id === editingRecord.record.id ? record as Activity : item)
          : [record as Activity, ...current]);
        break;
      case 'opportunity':
        setOpportunities((current) => current.some((item) => item.id === editingRecord.record.id)
          ? current.map((item) => item.id === editingRecord.record.id ? record as Opportunity : item)
          : [record as Opportunity, ...current]);
        break;
      case 'proposal':
        setProposals((current) => current.some((item) => item.id === editingRecord.record.id)
          ? current.map((item) => item.id === editingRecord.record.id ? record as Proposal : item)
          : [record as Proposal, ...current]);
        break;
      case 'invoice': {
        const invoice = record as Invoice;
        const invoiceNumberSuffix = invoice.invoiceNo.replace(/^(INV|PI)-/, '');
        const normalizedInvoice = {
          ...invoice,
          invoiceNo: `${invoice.type === 'Proforma' ? 'PI' : 'INV'}-${invoiceNumberSuffix}`
        };
        setInvoices((current) => current.some((item) => item.id === editingRecord.record.id)
          ? current.map((item) => item.id === editingRecord.record.id ? normalizedInvoice : item)
          : [normalizedInvoice, ...current]);
        break;
      }
      case 'amc':
        setAmcRenewals((current) => current.some((item) => item.id === editingRecord.record.id)
          ? current.map((item) => item.id === editingRecord.record.id ? record as AMCRenewal : item)
          : [record as AMCRenewal, ...current]);
        break;
    }

    setEditingRecord(null);
  };

  const handleSelectLead = (leadId: string) => {
    if (!allowedPages.includes('leads')) return;
    setSelectedLeadId(leadId);
    setCurrentView('lead-360');
  };

  const handleSelectCustomer = (customerId: string) => {
    if (!allowedPages.includes('customers')) return;
    setSelectedCustomerId(customerId);
    setCurrentView('customer-360');
  };

  const handleUpdateLeadStatus = (leadId: string, status: Lead['status']) => {
    setLeads((prev) =>
      prev.map((l) => (l.id === leadId ? { ...l, status } : l))
    );
  };

  const handleBulkAssignLeads = (leadIds: string[], owner: string) => {
    const selectedIds = new Set(leadIds);
    const selected = leads.filter((lead) => selectedIds.has(lead.id));
    setLeads((current) => current.map((lead) => selectedIds.has(lead.id)
      ? { ...lead, leadOwner: owner, status: lead.status === 'New' ? 'Assigned' : lead.status }
      : lead));
    const assignedAt = Date.now();
    const date = new Date().toISOString().split('T')[0];
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setActivities((current) => [
      ...selected.map((lead, index): Activity => ({
        id: `act-assignment-${assignedAt}-${index}`,
        leadId: lead.id,
        leadName: lead.name,
        company: lead.company,
        type: 'System',
        title: 'Lead assigned',
        description: `Assigned to ${owner} by ${staffUser.name}`,
        date,
        time,
        user: staffUser.name,
        priority: 'Medium',
        status: 'Completed',
        category: 'Today'
      })),
      ...current
    ]);
  };

  const handleDeleteLead = (lead: Lead) => {
    const hasLinkedRecords = opportunities.some((item) => item.leadId === lead.id) ||
      proposals.some((item) => item.leadId === lead.id) ||
      activities.some((item) => item.leadId === lead.id);
    if (hasLinkedRecords) {
      alert('This lead has linked activities, opportunities, or proposals. Update or remove those records before deleting the lead.');
      return;
    }
    if (window.confirm(`Delete lead ${lead.name}? This cannot be undone.`)) {
      setLeads((current) => current.filter((item) => item.id !== lead.id));
    }
  };

  const handleDeleteCustomer = (customer: Customer) => {
    setCustomers((current) => current.filter((item) => item.id !== customer.id));
  };

  const handleDeleteActivity = (activity: Activity) => {
    if (window.confirm(`Delete activity "${activity.title}"? This cannot be undone.`)) {
      setActivities((current) => current.filter((item) => item.id !== activity.id));
    }
  };

  const handleCompleteActivity = (activity: Activity) => {
    setActivities((current) => current.map((item) => item.id === activity.id
      ? { ...item, status: 'Completed' }
      : item));
  };

  const handleDeleteOpportunity = (opportunity: Opportunity) => {
    if (opportunity.stage === 'Won') {
      alert('Won opportunities are retained for sales history and cannot be deleted.');
      return;
    }
    if (window.confirm(`Delete opportunity "${opportunity.name}"? This cannot be undone.`)) {
      setOpportunities((current) => current.filter((item) => item.id !== opportunity.id));
    }
  };

  const handleDeleteProposal = (proposal: Proposal) => {
    if (proposal.status !== 'Draft') return;
    if (window.confirm(`Delete draft ${proposal.proposalNumber}? This cannot be undone.`)) {
      setProposals((current) => current.filter((item) => item.id !== proposal.id));
    }
  };

  const handleEditInvoice = (invoice: Invoice) => {
    if (invoice.paidAmount > 0 || invoice.status === 'Voided') return;
    setEditingRecord({ type: 'invoice', record: invoice });
  };

  const handleVoidInvoice = (invoice: Invoice) => {
    if (invoice.paidAmount > 0 || invoice.status === 'Voided') return;
    if (window.confirm(`Void invoice ${invoice.invoiceNo}? It will remain in payment history.`)) {
      setInvoices((current) => current.map((item) => item.id === invoice.id ? { ...item, status: 'Voided' } : item));
    }
  };

  const handleCancelContract = (contract: AMCRenewal) => {
    if (contract.status === 'Cancelled') return;
    if (window.confirm(`Mark contract ${contract.contractNo} as cancelled? The record will be retained for history.`)) {
      setAmcRenewals((current) => current.map((item) => item.id === contract.id ? { ...item, status: 'Cancelled' } : item));
    }
  };

  const handleAddNewLead = (newLeadData: Partial<Lead>) => {
    const fullLead = newLeadData as Lead;
    setLeads((current) => [fullLead, ...current]);
    const createdAt = Date.now();
    const newActivities: Activity[] = [
      {
        id: `act-${Date.now()}`,
        leadId: fullLead.id,
        leadName: fullLead.name,
        company: fullLead.company,
        type: 'Requirement Log',
        title: 'New Lead Inbound Record Created',
        description: `Lead created from source: ${fullLead.source}`,
        date: fullLead.createdDate,
        time: 'Just now',
        user: staffUser.name,
        priority: fullLead.priority === 'Urgent' ? 'High' : fullLead.priority,
        status: 'Completed',
        category: 'Today'
      }
    ];
    if (fullLead.leadOwner) {
      newActivities.push({
        id: `act-assignment-${createdAt}`,
        leadId: fullLead.id,
        leadName: fullLead.name,
        company: fullLead.company,
        type: 'System',
        title: 'Lead assigned',
        description: `Assigned to ${fullLead.leadOwner} by ${staffUser.name}`,
        date: fullLead.createdDate,
        time: 'Just now',
        user: staffUser.name,
        priority: 'Medium',
        status: 'Completed',
        category: 'Today'
      });
    }
    setActivities((current) => [...newActivities, ...current]);
  };

  const handleAddActivity = (activity: Partial<Activity>) => {
    const newAct: Activity = {
      id: `act-${Date.now()}`,
      leadId: activity.leadId || currentLead.id,
      leadName: activity.leadName || currentLead.name,
      company: activity.company || currentLead.company,
      type: activity.type || 'Call',
      title: activity.title || 'Follow-up Activity',
      description: activity.description || '',
      date: activity.date || new Date().toISOString().split('T')[0],
      time: activity.time || '12:00 PM',
      user: activity.user || 'Unassigned',
      priority: activity.priority || 'High',
      status: activity.status || 'Scheduled',
      category: activity.category || 'Today'
    };
    setActivities([newAct, ...activities]);
  };

  const handleConvertToCustomer = (lead: Lead) => {
    // 1. Mark lead as Converted
    handleUpdateLeadStatus(lead.id, 'Converted');

    // 2. Add to Customers list
    const newCust: Customer = {
      id: `c-${Date.now()}`,
      customerCode: `CUST-2024-${Math.floor(100 + Math.random() * 900)}`,
      companyName: lead.company,
      customerType: 'Enterprise',
      industry: 'SaaS & Cloud',
      primaryContact: `${lead.name} (${lead.designation})`,
      email: lead.email,
      phone: lead.phone,
      totalDealsValue: lead.estimatedBudget,
      activeContracts: 1,
      amcStatus: 'Active',
      renewalDate: '2025-09-30',
      relationshipManager: lead.leadOwner,
      city: 'Global Client'
    };
    setCustomers([newCust, ...customers]);

    setCurrentView('customers');
  };

  const handleCreateOpportunityFromLead = (lead: Lead) => {
    const newOpp: Opportunity = {
      id: `OPP-${Math.floor(200 + Math.random() * 800)}`,
      name: `${lead.company} - ${lead.interestedService.split(' ')[0]} Engagement`,
      company: lead.company,
      leadId: lead.id,
      stage: 'Opportunity',
      amount: lead.estimatedBudget,
      expectedClose: '2024-11-30',
      probability: 70,
      owner: lead.leadOwner
    };
    setOpportunities([newOpp, ...opportunities]);
    handleUpdateLeadStatus(lead.id, 'Opportunity Created');
    setCurrentView('pipeline');
  };

  const handleCreateProposalFromLead = (lead: Lead, destination: 'proposals' | 'quotations' = 'proposals') => {
    const proposal: Proposal = {
      id: `prop-${Date.now()}`,
      proposalNumber: `PROP-${new Date().getFullYear()}-${Date.now().toString().slice(-5)}`,
      leadId: lead.id,
      title: `${lead.company} ${lead.interestedService} Proposal`.trim(),
      service: lead.interestedService,
      amount: lead.estimatedBudget,
      status: 'Draft',
      sentDate: new Date().toISOString().slice(0, 10),
      validUntil: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10)
    };
    setEditingRecord({ type: 'proposal', record: proposal });
    setCurrentView(destination);
  };

  const handleMovePipelineStage = (oppId: string, targetStage: string) => {
    setOpportunities((prev) =>
      prev.map((o) => (o.id === oppId ? { ...o, stage: targetStage } : o))
    );
  };

  const handleRenewContract = (contractId: string) => {
    setAmcRenewals((prev) =>
      prev.map((c) =>
        c.id === contractId ? { ...c, daysRemaining: 365, urgency: '60 Days', status: 'Renewed' } : c
      )
    );
  };

  const handleCreateInvoice = (invoiceType: Invoice['type'] = 'Tax Invoice') => {
    const customer = customers[0];
    const prefix = invoiceType === 'Proforma' ? 'PI' : 'INV';
    const newInv: Invoice = {
      id: `inv-${Date.now()}`,
      invoiceNo: `${prefix}-${new Date().getFullYear()}-${Date.now().toString().slice(-5)}`,
      customer: customer?.companyName ?? '',
      type: invoiceType,
      amount: 0,
      paidAmount: 0,
      status: 'Outstanding',
      dueDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      issueDate: new Date().toISOString().split('T')[0]
    };
    setEditingRecord({ type: 'invoice', record: newInv });
    setCurrentView(invoiceType === 'Proforma' ? 'proforma' : 'invoices');
  };

  const handleQuickCreate = (type: string) => {
    const requiredPage: Record<string, string> = {
      lead: 'leads', activity: 'activities', opportunity: 'pipeline', proposal: 'proposals',
      invoice: 'invoices', amc: 'amc', customer: 'customers'
    };
    if (requiredPage[type] && !allowedPages.includes(requiredPage[type])) {
      setSyncError('You do not have access to create records in that area.');
      return;
    }
    if (type === 'lead') {
      setIsNewLeadModalOpen(true);
    } else if (type === 'activity') {
      setCurrentView('activities');
    } else if (type === 'opportunity') {
      const lead = leads[0];
      const newOpp: Opportunity = {
        id: `OPP-${Date.now()}`,
        name: `${lead?.company ?? 'New customer'} opportunity`,
        company: lead?.company ?? '',
        leadId: lead?.id ?? '',
        stage: 'Opportunity',
        amount: lead?.estimatedBudget ?? 0,
        expectedClose: new Date().toISOString().split('T')[0],
        probability: 50,
        owner: lead?.leadOwner ?? organization.founderName
      };
      setEditingRecord({ type: 'opportunity', record: newOpp });
      setCurrentView('pipeline');
    } else if (type === 'proposal') {
      const lead = leads[0];
      if (lead) handleCreateProposalFromLead(lead);
    } else if (type === 'invoice') {
      handleCreateInvoice();
    } else if (type === 'amc') {
      const contract: AMCRenewal = {
        id: `amc-${Date.now()}`,
        contractNo: `AMC-${new Date().getFullYear()}-${Date.now().toString().slice(-5)}`,
        customer: customers[0]?.companyName ?? '',
        service: '',
        annualValue: 0,
        expiryDate: new Date(Date.now() + 365 * 86400000).toISOString().split('T')[0],
        daysRemaining: 365,
        urgency: '60 Days',
        owner: organization.founderName,
        status: 'Active'
      };
      setEditingRecord({ type: 'amc', record: contract });
      setCurrentView('amc');
    } else if (type === 'customer') {
      const newCustomer: Customer = {
        id: `cust-${Date.now()}`,
        customerCode: `CUST-${new Date().getFullYear()}-${Date.now().toString().slice(-5)}`,
        companyName: '',
        customerType: 'Enterprise',
        industry: 'SaaS & Cloud',
        primaryContact: '',
        email: '',
        phone: '',
        totalDealsValue: 0,
        activeContracts: 0,
        amcStatus: 'None',
        renewalDate: new Date(Date.now() + 365 * 86400000).toISOString().split('T')[0],
        relationshipManager: organization.founderName,
        city: ''
      };
      setEditingRecord({ type: 'customer', record: newCustomer });
      setCurrentView('customers');
    }
  };

  const commercialPageProps = {
    proposals,
    invoices,
    leads,
    organization,
    onNewProposal: () => handleQuickCreate('proposal'),
    onNewInvoice: handleCreateInvoice,
    onEditProposal: (record: Proposal) => {
      if (record.status === 'Draft') setEditingRecord({ type: 'proposal', record });
    },
    onDeleteProposal: handleDeleteProposal,
    onEditInvoice: handleEditInvoice,
    onVoidInvoice: handleVoidInvoice
  };

  return (
    <div className="flex h-dvh overflow-hidden bg-white text-slate-900 font-sans selection:bg-[#ff6600] selection:text-white">
      {/* Main Persistent Left Sidebar */}
      <Sidebar
        currentView={currentView}
        onNavigate={(view) => {
          handleNavigate(view);
          setMobileSidebarOpen(false);
        }}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
        allowedPages={allowedPages}
      />
      {mobileSidebarOpen && (
        <button
          type="button"
          aria-label="Close navigation menu"
          onClick={() => setMobileSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-slate-950/40 lg:hidden"
        />
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-0 h-full">
        {/* Top Header */}
        <Header
          onQuickCreate={handleQuickCreate}
          onSearchSelectLead={handleSelectLead}
          onSearchSelectCustomer={handleSelectCustomer}
          onNavigate={handleNavigate}
          onOpenSidebar={() => setMobileSidebarOpen(true)}
          leads={allowedPages.includes('leads') ? leads : []}
          customers={allowedPages.includes('customers') ? customers : []}
          opportunities={allowedPages.includes('pipeline') ? opportunities : []}
          invoices={allowedPages.some((page) => ['proforma', 'invoices', 'payments'].includes(page)) ? invoices : []}
          activities={allowedPages.includes('activities') ? activities : []}
          proposals={allowedPages.some((page) => ['quotations', 'proposals'].includes(page)) ? proposals : []}
          amcRenewals={allowedPages.includes('amc') ? amcRenewals : []}
          accountName={staffUser.name}
          accountEmail={staffUser.email}
          accountRole={staffUser.role}
          accountJobTitle={staffUser.jobTitle}
          allowedPages={allowedPages}
          onOpenProfile={() => setShowMyProfile(true)}
          onSignOut={() => { void onLogout().catch((reason: unknown) => setSyncError(reason instanceof Error ? reason.message : 'Could not sign out.')); }}
        />
        <div className="flex min-h-10 items-center justify-between gap-3 border-b border-slate-100 bg-white px-4 py-1.5 text-xs text-slate-500 sm:px-6">
          <span>{syncError ? <span role="alert" className="text-rose-700">Shared-data sync failed: {syncError}</span> : `Signed in as ${staffUser.name} (${staffUser.role})`}</span>
          <div className="flex items-center gap-2">
            {staffUser.role === 'admin' && <button type="button" onClick={() => setShowStaffInvite(true)} className="rounded-lg border border-slate-200 px-3 py-1.5 font-semibold text-slate-600 hover:bg-slate-50">Invite staff</button>}
            <button type="button" onClick={() => setShowMyProfile(true)} className="rounded-lg border border-slate-200 px-3 py-1.5 font-semibold text-slate-600 hover:bg-slate-50">My Profile</button>
            <button type="button" onClick={() => {
              void onLogout().catch((reason: unknown) => setSyncError(reason instanceof Error ? reason.message : 'Could not sign out.'));
            }} className="rounded-lg border border-slate-200 px-3 py-1.5 font-semibold text-slate-600 hover:bg-slate-50">Sign out</button>
          </div>
        </div>

        {/* View Router Body */}
        <main
          ref={mainContentRef}
          onScroll={handleMainScroll}
          className="flex-1 min-h-0 p-3 sm:p-4 md:p-6 lg:p-8 max-w-[1600px] w-full mx-auto overflow-x-hidden overflow-y-auto overscroll-contain scroll-smooth"
        >
          <Suspense fallback={<ViewFallback />}>
          {currentView === 'dashboard' && (
            <Dashboard
              leads={leads}
              customers={customers}
              activities={activities}
              opportunities={opportunities}
              invoices={invoices}
              amcRenewals={amcRenewals}
              onSelectLead={handleSelectLead}
              onNavigate={handleNavigate}
              onQuickAction={handleQuickCreate}
            />
          )}

          {currentView === 'activities' && (
            <ActivitiesHub
              activities={activities}
              leads={leads}
              onCreateActivity={handleAddActivity}
              onEditActivity={(activity) => setEditingRecord({ type: 'activity', record: activity })}
              onDeleteActivity={handleDeleteActivity}
              onCompleteActivity={handleCompleteActivity}
              onSelectLead={handleSelectLead}
            />
          )}

          {currentView === 'leads' && (
            <LeadList
              leads={leads}
              assignees={staffAssignees}
              onSelectLead={handleSelectLead}
              onOpenNewLeadModal={() => setIsNewLeadModalOpen(true)}
              onUpdateLeadStatus={handleUpdateLeadStatus}
              onBulkAssign={handleBulkAssignLeads}
              onEditLead={(record) => setEditingRecord({ type: 'lead', record })}
              onDeleteLead={handleDeleteLead}
            />
          )}

          {currentView === 'lead-360' && currentLead && (
            <Lead360View
              lead={currentLead}
              activities={activities}
              opportunities={opportunities}
              proposals={proposals}
              onBack={() => setCurrentView('leads')}
              onUpdateStatus={handleUpdateLeadStatus}
              onAddActivity={handleAddActivity}
              onEditActivity={(activity) => setEditingRecord({ type: 'activity', record: activity })}
              onDeleteActivity={handleDeleteActivity}
              onConvertToCustomer={handleConvertToCustomer}
              onCreateOpportunity={handleCreateOpportunityFromLead}
              onCreateProposal={handleCreateProposalFromLead}
            />
          )}

          {currentView === 'customers' && (
            <CustomerMaster
              customers={customers}
              onSelectCustomer={(customer) => handleSelectCustomer(customer.id)}
              onNewCustomer={() => handleQuickCreate('customer')}
              onEditCustomer={(record) => setEditingRecord({ type: 'customer', record })}
              onDeleteCustomer={handleDeleteCustomer}
              onInvitePortalAccess={setPortalInviteCustomer}
            />
          )}

          {currentView === 'customer-360' && currentCustomer && (
            <Customer360View
              customer={currentCustomer}
              invoices={invoices}
              leads={leads}
              activities={activities}
              opportunities={opportunities}
              proposals={proposals}
              contracts={amcRenewals}
              onBack={() => setCurrentView('customers')}
              onEdit={() => setEditingRecord({ type: 'customer', record: currentCustomer })}
              onOpenDocuments={() => handleNavigate('documents')}
            />
          )}

          {currentView === 'pipeline' && (
            <SalesPipeline
              opportunities={opportunities}
              onMoveStage={handleMovePipelineStage}
              onOpenNewOpportunity={() => handleQuickCreate('opportunity')}
              onEditOpportunity={(record) => setEditingRecord({ type: 'opportunity', record })}
              onDeleteOpportunity={handleDeleteOpportunity}
            />
          )}

          {currentView === 'quotations' && (
            <QuotationsPage
              {...commercialPageProps}
              onNewProposal={() => {
                const lead = leads[0];
                if (lead) handleCreateProposalFromLead(lead, 'quotations');
              }}
            />
          )}

          {currentView === 'proposals' && <ProposalsPage {...commercialPageProps} />}

          {currentView === 'proforma' && <ProformaInvoicesPage {...commercialPageProps} />}

          {currentView === 'invoices' && <TaxInvoicesPage {...commercialPageProps} />}

          {currentView === 'payments' && <PaymentRecordsPage {...commercialPageProps} />}

          {currentView === 'amc' && (
            <AMCRenewalView
              amcRenewals={amcRenewals}
              onOpenNewContract={() => handleQuickCreate('amc')}
              onRenewContract={handleRenewContract}
              onEditContract={(record) => setEditingRecord({ type: 'amc', record })}
              onCancelContract={handleCancelContract}
            />
          )}

          {currentView === 'documents' && <DocumentsHub />}

          {currentView === 'analytics' && (
            <AnalyticsHub leads={leads} opportunities={opportunities} invoices={invoices} />
          )}

          {currentView === 'admin' && staffUser.role === 'admin' && <AdminHub onInviteStaff={() => setShowStaffInvite(true)} />}

          {currentView === 'org-setup' && (
            <OrganizationSetup profile={organization} onSave={handleSaveOrganization} />
          )}

          {currentView === 'support' && <SupportManagement />}

          {currentView === 'portal' && (
            <CustomerPortalManagement
              customers={customers}
              leads={leads}
              proposals={proposals}
              invoices={invoices}
              contracts={amcRenewals}
              onInviteCustomer={setPortalInviteCustomer}
              onOpenCustomerRecord={(customer) => handleSelectCustomer(customer.id)}
            />
          )}
          </Suspense>
        </main>

        {showScrollTop && (
          <button
            type="button"
            onClick={scrollToTop}
            aria-label="Scroll to top"
            title="Scroll to top"
            className="fixed bottom-6 right-6 z-40 flex h-10 w-10 items-center justify-center rounded-full bg-[#ff6600] text-white shadow-lg transition hover:bg-[#e65c00] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff6600] focus-visible:ring-offset-2"
          >
            <ArrowUp className="h-4 w-4" aria-hidden="true" />
          </button>
        )}
      </div>

      {/* New Lead Modal */}
      <NewLeadModal
        isOpen={isNewLeadModalOpen}
        onClose={() => setIsNewLeadModalOpen(false)}
        onSubmit={handleAddNewLead}
        assignees={staffAssignees}
      />
      {portalInviteCustomer && (
        <CustomerPortalInviteModal
          customer={portalInviteCustomer}
          onClose={() => setPortalInviteCustomer(null)}
        />
      )}
      {showStaffInvite && <StaffInviteModal onClose={() => setShowStaffInvite(false)} />}
      {showMyProfile && <MyProfile user={staffUser} onClose={() => setShowMyProfile(false)} onSaved={async (user) => { onStaffUserChange(user); setShowMyProfile(false); }} />}
      {editingRecord && (() => {
        const editorConfig = getEditorConfig(editingRecord, staffAssignees);
        const editableFields = editingRecord.type === 'opportunity' &&
          ['Won', 'Lost'].includes(editingRecord.record.stage)
          ? editorConfig.fields.filter((field) => field.key !== 'amount')
          : editorConfig.fields;
        return (
          <RecordEditorModal
            title={editorConfig.title}
            fields={editableFields}
            values={editingRecord.record as unknown as RecordEditorValues}
            onSave={handleSaveEditedRecord}
            onClose={() => setEditingRecord(null)}
          />
        );
      })()}
    </div>
  );
}

export default function App() {
  const [staffUser, setStaffUser] = useState<StaffUser | null>(null);
  const [checkingSession, setCheckingSession] = useState(window.location.pathname !== '/customer-portal');
  const [authError, setAuthError] = useState('');

  useEffect(() => {
    if (window.location.pathname === '/customer-portal') return;
    fetch('/api/staff-auth/session', { credentials: 'include' })
      .then(async (response) => {
        if (response.status === 401) return;
        if (!response.ok) {
          const result = await response.json().catch(() => ({})) as { error?: string };
          throw new Error(result.error || `Could not verify staff session (${response.status})`);
        }
        const result = await response.json() as { data: StaffUser };
        if (result.data.profileCompleted) await prepareStaffData(result.data);
        setStaffUser(result.data);
      })
      .catch((reason: unknown) => setAuthError(reason instanceof Error ? reason.message : 'Could not load shared CRM data.'))
      .finally(() => setCheckingSession(false));
  }, []);

  if (window.location.pathname === '/customer-portal') {
    return <Suspense fallback={<ViewFallback />}><CustomerPortalApp /></Suspense>;
  }
  if (checkingSession) {
    return <div className="flex min-h-screen items-center justify-center bg-slate-950 text-sm font-medium text-white">Connecting to the CRM…</div>;
  }
  if (!staffUser) {
    return <div>
      {authError && <p role="alert" className="fixed left-1/2 top-4 z-10 -translate-x-1/2 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{authError}</p>}
      <StaffLogin onAuthenticated={async (user) => {
        if (user.profileCompleted) await prepareStaffData(user);
        setStaffUser(user);
        setAuthError('');
      }} />
    </div>;
  }
  if (!staffUser.profileCompleted) {
    return <div className="min-h-screen bg-slate-950"><MyProfile required user={staffUser} onSaved={async (user) => {
      await prepareStaffData(user);
      setStaffUser(user);
      setAuthError('');
    }} /></div>;
  }
  return <CrmApp staffUser={staffUser} onStaffUserChange={setStaffUser} onLogout={async () => {
    const response = await fetch('/api/staff-auth/logout', { method: 'POST', credentials: 'include' });
    if (!response.ok) {
      const result = await response.json().catch(() => ({})) as { error?: string };
      throw new Error(result.error || `Could not sign out (${response.status})`);
    }
    setStaffUser(null);
  }} />;
}
