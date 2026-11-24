import React, { useMemo, useState } from "react";
import { Building2, Check, ChevronRight, ExternalLink, MonitorCog, Palette, Plus, Save, Trash2, X } from "lucide-react";
import type { Tenant, TenantTheme } from "../data/tenants";

const themePresets = [
  { name: "Tangerine", color: "#ff5c00" },
  { name: "Ocean", color: "#2563eb" },
  { name: "Emerald", color: "#059669" },
  { name: "Violet", color: "#7c3aed" },
  { name: "Rose", color: "#e11d48" },
  { name: "Graphite", color: "#334155" }
];

const slugify = (value: string) => value.toLowerCase().trim()
  .replace(/[^a-z0-9]+/g, "-")
  .replace(/^-+|-+$/g, "")
  .slice(0, 48);

interface TenantManagementProps {
  tenants: Tenant[];
  activeTenantId: string;
  onActivate: (tenantId: string) => void;
  onSave: (tenant: Tenant) => void;
  onDelete: (tenantId: string) => void;
}

export const TenantManagement: React.FC<TenantManagementProps> = ({
  tenants,
  activeTenantId,
  onActivate,
  onSave,
  onDelete
}) => {
  const [selectedId, setSelectedId] = useState(activeTenantId);
  const [draft, setDraft] = useState<Tenant>(() => tenants.find((tenant) => tenant.id === activeTenantId) ?? tenants[0]);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  const selectedTenant = useMemo(
    () => tenants.find((tenant) => tenant.id === selectedId) ?? tenants[0],
    [selectedId, tenants]
  );

  const selectTenant = (tenant: Tenant) => {
    setSelectedId(tenant.id);
    setDraft(tenant);
    setError("");
  };

  const updateTheme = <K extends keyof TenantTheme>(key: K, value: TenantTheme[K]) => {
    setDraft((current) => ({ ...current, theme: { ...current.theme, [key]: value } }));
  };

  const saveDraft = () => {
    const name = draft.name.trim();
    const slug = slugify(draft.slug || name);
    if (!name || !slug) {
      setError("Tenant name and workspace URL are required.");
      return false;
    }
    if (tenants.some((tenant) => tenant.id !== draft.id && tenant.slug === slug)) {
      setError("That workspace URL is already in use.");
      return false;
    }
    onSave({ ...draft, name, slug });
    setError("");
    return true;
  };

  const beginCreate = () => {
    const tenant: Tenant = {
      id: crypto.randomUUID(),
      name: "",
      slug: "",
      status: "Active",
      theme: { primaryColor: "#2563eb", sidebarTone: "light", density: "comfortable" }
    };
    setDraft(tenant);
    setSelectedId(tenant.id);
    setCreating(true);
    setError("");
  };

  const cancelCreate = () => {
    setCreating(false);
    selectTenant(selectedTenant);
  };

  const createTenant = () => {
    if (saveDraft()) setCreating(false);
  };

  return (
    <div className="grid gap-4 xl:grid-cols-[340px_minmax(0,1fr)]">
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Tenants</h2>
            <p className="mt-0.5 text-xs text-slate-500">{tenants.length} workspace{tenants.length === 1 ? "" : "s"}</p>
          </div>
          <button type="button" onClick={beginCreate} className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--color-primary)] px-3 py-2 text-xs font-bold !text-white hover:bg-[var(--color-primary-hover)]">
            <Plus className="h-3.5 w-3.5" /> Add tenant
          </button>
        </div>
        <div className="space-y-2 p-3">
          {tenants.map((tenant) => {
            const selected = tenant.id === selectedId && !creating;
            return (
              <button
                key={tenant.id}
                type="button"
                onClick={() => { setCreating(false); selectTenant(tenant); }}
                className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition ${selected ? "border-[var(--color-primary)] bg-[var(--color-primary-soft)]" : "border-transparent hover:border-slate-200 hover:bg-slate-50"}`}
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white" style={{ backgroundColor: tenant.theme.primaryColor }}>
                  <Building2 className="h-5 w-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="truncate text-xs font-bold text-slate-900">{tenant.name}</span>
                    {tenant.id === activeTenantId && <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[9px] font-bold text-emerald-700">Current</span>}
                  </span>
                  <span className="mt-0.5 block truncate text-[10px] text-slate-500">/{tenant.slug}</span>
                </span>
                <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />
              </button>
            );
          })}
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div>
            <div className="flex items-center gap-2">
              <MonitorCog className="h-4 w-4 text-[var(--color-primary)]" />
              <h2 className="text-sm font-bold text-slate-900">{creating ? "Create tenant" : "Tenant settings"}</h2>
            </div>
            <p className="mt-1 text-xs text-slate-500">Manage workspace identity and its independent visual theme.</p>
          </div>
          {!creating && draft.id !== activeTenantId && draft.status === "Active" && (
            <button type="button" onClick={() => onActivate(draft.id)} className="inline-flex items-center justify-center gap-2 rounded-lg border border-[var(--color-primary)] px-3 py-2 text-xs font-bold text-[var(--color-primary)] hover:bg-[var(--color-primary-soft)]">
              <Check className="h-3.5 w-3.5" /> Switch to tenant
            </button>
          )}
        </div>

        <div className="space-y-6 p-4 sm:p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-xs font-semibold text-slate-700">
              Tenant name
              <input value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value, ...(creating ? { slug: slugify(event.target.value) } : {}) })} className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary-soft)]" placeholder="Acme India" />
            </label>
            <label className="text-xs font-semibold text-slate-700">
              Workspace URL
              <div className="mt-1.5 flex h-10 overflow-hidden rounded-lg border border-slate-200 focus-within:border-[var(--color-primary)] focus-within:ring-2 focus-within:ring-[var(--color-primary-soft)]">
                <span className="flex items-center bg-slate-50 px-3 text-xs text-slate-500">/t/</span>
                <input value={draft.slug} onChange={(event) => setDraft({ ...draft, slug: slugify(event.target.value) })} className="min-w-0 flex-1 px-3 text-sm outline-none" placeholder="acme-india" />
              </div>
            </label>
            <label className="text-xs font-semibold text-slate-700">
              Status
              <select value={draft.status} onChange={(event) => setDraft({ ...draft, status: event.target.value as Tenant["status"] })} className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-[var(--color-primary)]">
                <option>Active</option>
                <option>Suspended</option>
              </select>
            </label>
          </div>

          {!creating && (
            <a
              href={`/t/${draft.slug}`}
              className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 hover:border-[var(--color-primary)] hover:bg-[var(--color-primary-soft)]"
            >
              <span className="min-w-0">
                <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">Customized tenant link</span>
                <span className="mt-1 block truncate text-xs font-semibold text-[var(--color-primary)]">{window.location.origin}/t/{draft.slug}</span>
              </span>
              <ExternalLink className="h-4 w-4 shrink-0 text-[var(--color-primary)]" />
            </a>
          )}

          <div className="border-t border-slate-200 pt-5">
            <div className="flex items-center gap-2">
              <Palette className="h-4 w-4 text-[var(--color-primary)]" />
              <h3 className="text-sm font-bold text-slate-900">Brand theme</h3>
            </div>
            <p className="mt-1 text-xs text-slate-500">The selected colors and navigation style apply whenever this tenant is active.</p>
            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
              {themePresets.map((preset) => {
                const selected = draft.theme.primaryColor.toLowerCase() === preset.color;
                return (
                  <button key={preset.color} type="button" onClick={() => updateTheme("primaryColor", preset.color)} className={`rounded-xl border p-2.5 text-left transition ${selected ? "border-slate-900 ring-2 ring-slate-900/10" : "border-slate-200 hover:bg-slate-50"}`}>
                    <span className="mb-2 flex h-7 w-7 items-center justify-center rounded-lg text-white" style={{ backgroundColor: preset.color }}>{selected && <Check className="h-4 w-4" />}</span>
                    <span className="text-[10px] font-bold text-slate-700">{preset.name}</span>
                  </button>
                );
              })}
            </div>
            <label className="mt-4 flex max-w-xs items-center justify-between gap-3 rounded-xl border border-slate-200 p-3 text-xs font-semibold text-slate-700">
              Custom brand color
              <span className="flex items-center gap-2">
                <input type="color" value={draft.theme.primaryColor} onChange={(event) => updateTheme("primaryColor", event.target.value)} className="h-8 w-10 cursor-pointer rounded border-0 bg-transparent" />
                <span className="font-mono text-[11px] uppercase text-slate-500">{draft.theme.primaryColor}</span>
              </span>
            </label>
          </div>

          <div className="grid gap-4 border-t border-slate-200 pt-5 sm:grid-cols-2">
            <fieldset>
              <legend className="text-xs font-bold text-slate-700">Navigation style</legend>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {(["light", "dark"] as const).map((tone) => (
                  <button key={tone} type="button" onClick={() => updateTheme("sidebarTone", tone)} className={`rounded-xl border p-3 text-left ${draft.theme.sidebarTone === tone ? "border-[var(--color-primary)] bg-[var(--color-primary-soft)]" : "border-slate-200"}`}>
                    <span className={`mb-2 block h-8 rounded-lg border ${tone === "dark" ? "border-slate-700 bg-slate-900" : "border-slate-200 bg-white"}`} />
                    <span className="text-xs font-bold capitalize text-slate-700">{tone}</span>
                  </button>
                ))}
              </div>
            </fieldset>
            <fieldset>
              <legend className="text-xs font-bold text-slate-700">Interface density</legend>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {(["comfortable", "compact"] as const).map((density) => (
                  <button key={density} type="button" onClick={() => updateTheme("density", density)} className={`rounded-xl border p-3 text-left ${draft.theme.density === density ? "border-[var(--color-primary)] bg-[var(--color-primary-soft)]" : "border-slate-200"}`}>
                    <span className="text-xs font-bold capitalize text-slate-700">{density}</span>
                    <span className="mt-1 block text-[10px] text-slate-500">{density === "compact" ? "More data on screen" : "More breathing room"}</span>
                  </button>
                ))}
              </div>
            </fieldset>
          </div>

          {error && <p role="alert" className="text-xs font-semibold text-rose-700">{error}</p>}
        </div>
        <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-slate-50 px-4 py-3 sm:px-5">
          <div>
            {!creating && tenants.length > 1 && draft.id !== activeTenantId && (
              <button type="button" onClick={() => onDelete(draft.id)} className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-50"><Trash2 className="h-3.5 w-3.5" /> Delete tenant</button>
            )}
          </div>
          <div className="flex gap-2">
            {creating && <button type="button" onClick={cancelCreate} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600"><X className="h-3.5 w-3.5" /> Cancel</button>}
            <button type="button" onClick={creating ? createTenant : saveDraft} className="inline-flex items-center gap-2 rounded-lg bg-[var(--color-primary)] px-4 py-2 text-xs font-bold !text-white hover:bg-[var(--color-primary-hover)]"><Save className="h-3.5 w-3.5" /> {creating ? "Create tenant" : "Save changes"}</button>
          </div>
        </footer>
      </section>
    </div>
  );
};
