import { listStoredDocuments } from "./documentStore";
import { listSharedDocuments, uploadSharedDocument } from "./sharedDocuments";
import type { StaffUser } from "../components/StaffLogin";

const collectionSuffixes = {
  leads: "leads",
  customers: "customers",
  activities: "activities",
  opportunities: "opportunities",
  proposals: "proposals",
  invoices: "invoices",
  payments: "payments",
  contracts: "amc-renewals"
} as const;

type StoredResource = keyof typeof collectionSuffixes;
const tenantStorageKey = (tenantId: string, resource: StoredResource) =>
  `tds-crm:v2:${tenantId}:${collectionSuffixes[resource]}`;
const legacyStorageKey = (resource: StoredResource) =>
  `tds-crm:v2:${collectionSuffixes[resource]}`;

const readLocalCollection = (key: string): Record<string, unknown>[] => {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(key) ?? "[]");
    return Array.isArray(value)
      ? value.filter((item): item is Record<string, unknown> =>
          typeof item === "object" && item !== null && typeof item.id === "string"
        )
      : [];
  } catch {
    return [];
  }
};

const request = async <T,>(url: string, init?: RequestInit): Promise<T> => {
  const response = await fetch(url, { ...init, credentials: "include" });
  const result = await response.json().catch(() => ({})) as { error?: string } & T;
  if (!response.ok) throw new Error(result.error || `Request failed (${response.status})`);
  return result;
};

const resourcePages: Record<StoredResource, string[]> = {
  leads: ["leads", "portal", "reports"],
  customers: ["customers", "portal", "costing"],
  activities: ["activities", "reports"],
  opportunities: ["pipeline", "reports"],
  proposals: ["quotations", "costing"],
  invoices: ["proforma", "invoices", "payments", "costing"],
  payments: ["payments", "invoices"],
  contracts: ["amc", "portal"]
};

export const prepareStaffData = async (staffUser: StaffUser) => {
  const tenantId = staffUser.tenantId || "default";
  localStorage.setItem("tds-crm:v2:active-tenant", tenantId);
  const importedKey = `tds-crm:v2:${tenantId}:shared-imported`;
  const importedDocumentsKey = `tds-crm:v2:${tenantId}:shared-documents-imported`;
  const hasPage = (page: string) => staffUser.role === "admin" || staffUser.pageAccess.includes(page);
  if (staffUser.role === "admin" && localStorage.getItem(importedKey) !== "true") {
    for (const resource of Object.keys(collectionSuffixes) as StoredResource[]) {
      const records = readLocalCollection(tenantStorageKey(tenantId, resource))
        .concat(tenantId === "default" ? readLocalCollection(legacyStorageKey(resource)) : []);
      for (let index = 0; index < records.length; index += 25) {
        await request("/api/staff-data/import-local", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ collections: { [resource]: records.slice(index, index + 25) } })
        });
      }
    }

    const localOrganization = localStorage.getItem(`tds-crm:v2:organization-profile:${tenantId}`)
      ?? (tenantId === "default" ? localStorage.getItem("tds-crm:v2:organization-profile") : null);
    const existing = await request<{ data: Record<string, unknown> | null }>("/api/staff-data/organization");
    if (!existing.data && localOrganization) {
      await request("/api/staff-data/organization", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: localOrganization
      });
    }
    localStorage.setItem(importedKey, "true");
  }

  if (hasPage("documents") && localStorage.getItem(importedDocumentsKey) !== "true") {
    if ("indexedDB" in window) {
      const [localDocuments, remoteDocuments] = await Promise.all([
        listStoredDocuments(),
        listSharedDocuments()
      ]);
      const importedIds = new Set(remoteDocuments
        .filter((document) => document.hasFile)
        .map((document) => document.id));
      for (const document of localDocuments) {
        if (importedIds.has(document.id)) continue;
        await uploadSharedDocument({
          id: document.id,
          name: document.name,
          category: document.category,
          client: document.client,
          size: document.size,
          mimeType: document.mimeType
        }, document.file);
        importedIds.add(document.id);
      }
    }
    localStorage.setItem(importedDocumentsKey, "true");
  }

  const allResources = Object.keys(collectionSuffixes) as StoredResource[];
  const resources = allResources.filter((resource) => resourcePages[resource].some(hasPage));
  allResources.filter((resource) => !resources.includes(resource)).forEach((resource) => {
    localStorage.removeItem(tenantStorageKey(tenantId, resource));
  });
  const remote = await Promise.all(resources.map((resource) =>
    request<{ data: Record<string, unknown>[] }>(`/api/${resource}?limit=10000`)
  ));
  remote.forEach(({ data }, index) => {
    const storageKey = tenantStorageKey(tenantId, resources[index]);
    localStorage.setItem(storageKey, JSON.stringify(data));
  });

  const organization = await request<{ data: Record<string, unknown> | null }>("/api/staff-data/organization");
  if (organization.data) {
    const {
      id: _id,
      organizationKey: _organizationKey,
      createdAt: _createdAt,
      updatedAt: _updatedAt,
      ...profile
    } = organization.data;
    localStorage.setItem(`tds-crm:v2:organization-profile:${tenantId}`, JSON.stringify(profile));
  }
};
