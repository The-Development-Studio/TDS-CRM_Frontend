export type TenantTheme = {
  primaryColor: string;
  sidebarTone: "light" | "dark";
  density: "comfortable" | "compact";
};

export type Tenant = {
  id: string;
  name: string;
  slug: string;
  status: "Active" | "Suspended";
  logoDataUrl?: string;
  theme: TenantTheme;
};

export const TENANTS_STORAGE_KEY = "tds-crm:v2:tenants";
export const ACTIVE_TENANT_STORAGE_KEY = "tds-crm:v2:active-tenant";

export const DEFAULT_TENANT: Tenant = {
  id: "default",
  name: "TDS CRM",
  slug: "tds-crm",
  status: "Active",
  theme: {
    primaryColor: "#ff5c00",
    sidebarTone: "light",
    density: "comfortable"
  }
};

export const isTenantArray = (value: unknown): value is Tenant[] =>
  Array.isArray(value) && value.length > 0 && value.every((item) => {
    if (!item || typeof item !== "object") return false;
    const tenant = item as Partial<Tenant>;
    return typeof tenant.id === "string" &&
      typeof tenant.name === "string" &&
      typeof tenant.slug === "string" &&
      (tenant.status === "Active" || tenant.status === "Suspended") &&
      (tenant.logoDataUrl === undefined || typeof tenant.logoDataUrl === "string") &&
      Boolean(tenant.theme) &&
      typeof tenant.theme?.primaryColor === "string" &&
      (tenant.theme?.sidebarTone === "light" || tenant.theme?.sidebarTone === "dark") &&
      (tenant.theme?.density === "comfortable" || tenant.theme?.density === "compact");
  });

export const colorWithAlpha = (hex: string, alpha: string) =>
  /^#[0-9a-f]{6}$/i.test(hex) ? `${hex}${alpha}` : hex;

export const darkenColor = (hex: string, amount = 24) => {
  if (!/^#[0-9a-f]{6}$/i.test(hex)) return hex;
  const channel = (start: number) => Math.max(0, parseInt(hex.slice(start, start + 2), 16) - amount)
    .toString(16).padStart(2, "0");
  return `#${channel(1)}${channel(3)}${channel(5)}`;
};
