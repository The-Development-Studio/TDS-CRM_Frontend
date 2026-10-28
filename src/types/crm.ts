export interface Lead {
  id: string;
  name: string;
  designation: string;
  company: string;
  email: string;
  phone: string;
  whatsapp: string;
  website: string;
  source: 'Meta Ads' | 'Instagram' | 'Google Ads' | 'Website' | 'Referral' | 'Direct' | 'Other';
  campaign: string;
  interestedService: string;
  estimatedBudget: number;
  leadOwner: string;
  leadOwnerId?: string;
  leadOwnerAvatar?: string;
  status: 'New' | 'Assigned' | 'Contacted' | 'Requirement Collected' | 'Qualified' | 'Opportunity Created' | 'Won' | 'Unqualified' | 'Converted';
  priority: 'High' | 'Medium' | 'Low' | 'Urgent';
  nextFollowUp: string;
  nextFollowUpTime: string;
  createdDate: string;
  requirement: string;
  commercialNotes?: string;
  notes: string[];
}

export interface StaffAssignee {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'user';
}

export interface Customer {
  id: string;
  customerCode: string;
  companyName: string;
  customerType: 'Enterprise' | 'SMB' | 'Startup' | 'Government' | 'Partner';
  industry: 'FinTech' | 'Healthcare' | 'E-Commerce' | 'SaaS & Cloud' | 'Logistics' | 'Manufacturing' | 'EdTech';
  primaryContact: string;
  email: string;
  phone: string;
  totalDealsValue: number;
  activeContracts: number;
  amcStatus: 'Active' | 'Expiring Soon' | 'Expired' | 'None';
  renewalDate: string;
  relationshipManager: string;
  city: string;
  customerGstin?: string;
  billingAddress?: string;
  state?: string;
  internalDocumentLink?: string;
}

export interface Activity {
  id: string;
  leadId?: string;
  leadName?: string;
  company?: string;
  type: 'Call' | 'WhatsApp' | 'Meeting' | 'Email' | 'Requirement Log' | 'Proposal' | 'System';
  title: string;
  description: string;
  date: string;
  time: string;
  user: string;
  activityOwnerId?: string;
  contactPerson?: string;
  outcome?: string;
  followUpDate?: string;
  channel?: string;
  source?: 'manual' | 'system';
  createdAt?: string;
  updatedAt?: string;
  priority: 'High' | 'Medium' | 'Low';
  status: 'Completed' | 'Pending' | 'Scheduled';
  category: 'Today' | 'Overdue' | 'Tomorrow' | 'This Week';
}

export interface PipelineStage {
  id: string;
  name: string;
  color: string;
  accentClass: string;
}

export interface Opportunity {
  id: string;
  name: string;
  company: string;
  leadId: string;
  stage: string;
  amount: number;
  expectedClose: string;
  probability: number;
  owner: string;
}

export interface CommercialLineItem {
  id: string;
  description: string;
  hsnSac: string;
  quantity: number;
  rate: number;
}

export interface Proposal {
  id: string;
  proposalNumber: string;
  leadId: string;
  title: string;
  service: string;
  amount: number;
  status: 'Draft' | 'Sent' | 'Client Review' | 'Accepted' | 'Declined';
  sentDate: string;
  validUntil: string;
  documentType?: 'Quotation' | 'Proposal';
  lineItems?: CommercialLineItem[];
  customerNotes?: string;
  terms?: string;
}

export interface Invoice {
  id: string;
  invoiceNo: string;
  customer: string;
  type: 'Proforma' | 'Tax Invoice';
  amount: number;
  paidAmount: number;
  status: 'Draft' | 'Sent' | 'Paid' | 'Partially Paid' | 'Outstanding' | 'Overdue' | 'Voided';
  dueDate: string;
  issueDate: string;
  description?: string;
  sacCode?: string;
  taxableAmount?: number;
  discount?: number;
  gstRate?: number;
  supplyType?: 'Intra-state' | 'Inter-state' | 'Export/SEZ';
  placeOfSupply?: string;
  customerGstin?: string;
  billingAddress?: string;
  reverseCharge?: 'Yes' | 'No';
  cgstAmount?: number;
  sgstAmount?: number;
  igstAmount?: number;
  totalTax?: number;
  irn?: string;
  acknowledgementNumber?: string;
  acknowledgementDate?: string;
  paymentReference?: string;
  paymentDate?: string;
  paymentMode?: string;
  lineItems?: CommercialLineItem[];
  purchaseOrderNumber?: string;
  customerNotes?: string;
  terms?: string;
}

export interface PaymentRecord {
  id: string;
  paymentNumber: string;
  invoiceId: string;
  invoiceNo: string;
  customer: string;
  paymentDate: string;
  amount: number;
  mode: 'Bank Transfer' | 'UPI' | 'Cheque' | 'Cash' | 'Card' | 'Other';
  reference: string;
  notes: string;
}

export interface OrganizationProfile {
  legalName: string;
  displayName: string;
  founderName: string;
  founderEmail: string;
  coFounderName: string;
  coFounderEmail: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  gstin: string;
  msmeRegistration: string;
  billingEmail: string;
  phone: string;
  website: string;
  paymentTerms: string;
  bankAccountName: string;
  bankName: string;
  bankAccountNumber: string;
  bankIfsc: string;
  bankBranch: string;
  bankSwift: string;
  upiId: string;
}

export interface AMCRenewal {
  id: string;
  contractNo: string;
  customer: string;
  service: string;
  annualValue: number;
  expiryDate: string;
  daysRemaining: number;
  urgency: '7 Days' | '15 Days' | '30 Days' | '60 Days';
  owner: string;
  status: 'Active' | 'Under Discussion' | 'Renewed' | 'At Risk' | 'Cancelled';
}
