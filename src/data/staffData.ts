import { listStoredDocuments } from "./documentStore";
import { listSharedDocuments, uploadSharedDocument } from "./sharedDocuments";
import type { StaffUser } from "../components/StaffLogin";

const collectionStorage = {
  leads: "tds-crm:v2:leads",
  customers: "tds-crm:v2:customers",
  activities: "tds-crm:v2:activities",
  opportunities: "tds-crm:v2:opportunities",
  proposals: "tds-crm:v2:proposals",
  invoices: "tds-crm:v2:invoices",
  payments: "tds-crm:v2:payments",
  contracts: "tds-crm:v2:amc-renewals"
} as const;

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

const resourcePages: Record<keyof typeof collectionStorage, string[]> = {
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
  const importedKey = "tds-crm:v2:shared-imported";
  const importedDocumentsKey = "tds-crm:v2:shared-documents-imported";
  const hasPage = (page: string) => staffUser.role === "admin" || staffUser.pageAccess.includes(page);
  if (staffUser.role === "admin" && localStorage.getItem(importedKey) !== "true") {
    for (const [resource, storageKey] of Object.entries(collectionStorage)) {
      const records = readLocalCollection(storageKey);
      for (let index = 0; index < records.length; index += 25) {
        await request("/api/staff-data/import-local", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ collections: { [resource]: records.slice(index, index + 25) } })
        });
      }
    }

    const localOrganization = localStorage.getItem("tds-crm:v2:organization-profile");
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

  const allResources = Object.keys(collectionStorage) as (keyof typeof collectionStorage)[];
  const resources = allResources.filter((resource) => resourcePages[resource].some(hasPage));
  allResources.filter((resource) => !resources.includes(resource)).forEach((resource) => {
    localStorage.removeItem(collectionStorage[resource]);
  });
  const remote = await Promise.all(resources.map((resource) =>
    request<{ data: Record<string, unknown>[] }>(`/api/${resource}?limit=10000`)
  ));
  remote.forEach(({ data }, index) => {
    const storageKey = collectionStorage[resources[index]];
    localStorage.setItem(storageKey, JSON.stringify(data));
  });

  const organization = await request<{ data: Record<string, unknown> | null }>("/api/staff-data/organization");
  if (organization.data) {
    const { id: _id, ...profile } = organization.data;
    localStorage.setItem("tds-crm:v2:organization-profile", JSON.stringify(profile));
  }
};
