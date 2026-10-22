export const pageAccessOptions = [
  { id: "dashboard", label: "Dashboard", group: "Home" },
  { id: "leads", label: "Leads", group: "Sales" },
  { id: "customers", label: "Companies / Customers", group: "Sales" },
  { id: "activities", label: "Activities", group: "Sales" },
  { id: "pipeline", label: "Sales Pipeline", group: "Sales" },
  { id: "reports", label: "Sales Reports", group: "Sales" },
  { id: "quotations", label: "Quotations", group: "Commercial" },
  { id: "costing", label: "Costing Adviser", group: "Commercial" },
  { id: "proforma", label: "Proforma Invoices", group: "Commercial" },
  { id: "invoices", label: "Tax Invoices", group: "Commercial" },
  { id: "payments", label: "Payment Records", group: "Commercial" },
  { id: "support", label: "Support Tickets", group: "Customer Service" },
  { id: "amc", label: "AMC / Renewals", group: "Customer Service" },
  { id: "documents", label: "Document Repository", group: "Documents & Intelligence" },
  { id: "analytics", label: "Analytics & Reports", group: "Documents & Intelligence" },
  { id: "admin", label: "Admin Settings", group: "Administration" },
  { id: "org-setup", label: "Organization Setup", group: "Administration" },
  { id: "portal", label: "Customer Portal", group: "Administration" }
] as const;

export type PageAccessId = typeof pageAccessOptions[number]["id"];
export const allPageAccessIds = pageAccessOptions.map((page) => page.id);

export const pageForView = (view: string): PageAccessId => {
  if (view === "lead-360") return "leads";
  if (view === "customer-360") return "customers";
  return allPageAccessIds.includes(view as PageAccessId) ? view as PageAccessId : "dashboard";
};

export const resourcePageAccess: Record<string, PageAccessId> = {
  leads: "leads",
  customers: "customers",
  activities: "activities",
  opportunities: "pipeline",
  proposals: "quotations",
  invoices: "invoices",
  contracts: "amc"
};
