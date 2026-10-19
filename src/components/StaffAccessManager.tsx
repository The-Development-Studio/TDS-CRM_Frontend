import { useEffect, useState } from "react";
import { Check, LoaderCircle, MailPlus, ShieldCheck, UserRound } from "lucide-react";
import type { StaffUser } from "./StaffLogin";
import { allPageAccessIds, pageAccessOptions } from "../data/pageAccess";

interface StaffAccessManagerProps {
  onInviteStaff: () => void;
}

const assignablePageOptions = pageAccessOptions.filter((page) => page.id !== "admin");
const assignablePageIds = allPageAccessIds.filter((page) => page !== "admin");

export function StaffAccessManager({ onInviteStaff }: StaffAccessManagerProps) {
  const [users, setUsers] = useState<StaffUser[]>([]);
  const [drafts, setDrafts] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/staff-auth/users", { credentials: "include" })
      .then(async (response) => {
        const result = await response.json().catch(() => ({})) as { data?: StaffUser[]; error?: string };
        if (!response.ok || !result.data) throw new Error(result.error || `Could not load staff accounts (${response.status})`);
        setUsers(result.data);
        setDrafts(Object.fromEntries(result.data.map((user) => [user.id, user.pageAccess])));
      })
      .catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "Could not load staff accounts."))
      .finally(() => setLoading(false));
  }, []);

  const togglePage = (userId: string, pageId: string) => {
    if (pageId === "dashboard") return;
    setDrafts((current) => {
      const existing = current[userId] ?? [];
      const pages = existing.includes("dashboard") ? existing : ["dashboard", ...existing];
      return { ...current, [userId]: pages.includes(pageId) ? pages.filter((id) => id !== pageId) : [...pages, pageId] };
    });
  };

  const save = async (user: StaffUser) => {
    setSavingId(user.id);
    setError("");
    try {
      const pageAccess = [...new Set(["dashboard", ...(drafts[user.id] ?? [])])].filter((page) => page !== "admin");
      const response = await fetch(`/api/staff-auth/users/${user.id}/page-access`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pageAccess })
      });
      const result = await response.json().catch(() => ({})) as { data?: StaffUser; error?: string };
      if (!response.ok || !result.data) throw new Error(result.error || `Could not save page access (${response.status})`);
      setUsers((current) => current.map((item) => item.id === user.id ? result.data as StaffUser : item));
      setDrafts((current) => ({ ...current, [user.id]: result.data?.pageAccess ?? [] }));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not save page access.");
    } finally {
      setSavingId("");
    }
  };

  const setAccountActive = async (user: StaffUser, active: boolean) => {
    if (!window.confirm(`${active ? "Reactivate" : "Deactivate"} ${user.name}'s login account?`)) return;
    setSavingId(user.id);
    setError("");
    try {
      const response = await fetch(`/api/staff-auth/users/${user.id}/active`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active })
      });
      const result = await response.json().catch(() => ({})) as { data?: StaffUser; error?: string };
      if (!response.ok || !result.data) throw new Error(result.error || `Could not update account (${response.status})`);
      setUsers((current) => current.map((item) => item.id === user.id ? result.data as StaffUser : item));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not update account.");
    } finally {
      setSavingId("");
    }
  };

  if (loading) return <div className="flex items-center justify-center gap-2 rounded-2xl border border-slate-800 bg-[#111827] px-4 py-10 text-xs text-slate-300"><LoaderCircle className="h-4 w-4 animate-spin" /> Loading staff accounts...</div>;

  return <section className="overflow-hidden rounded-2xl border border-slate-800 bg-[#111827]/90 shadow-md">
    <header className="flex flex-col gap-3 border-b border-slate-800 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h2 className="text-sm font-bold text-white">Staff accounts & page access</h2>
        <p className="mt-1 text-xs text-slate-400">Manage the canonical login account, status, and CRM access for every staff member.</p>
      </div>
      <button type="button" onClick={onInviteStaff} className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#ff6600] px-3 py-2 text-xs font-bold text-white hover:bg-[#e65b00]"><MailPlus className="h-4 w-4" /> Invite staff</button>
    </header>
    {error && <p role="alert" className="m-4 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-xs text-rose-300">{error}</p>}
    <div className="divide-y divide-slate-800">
      {users.map((user) => {
        const pages = user.role === "admin" ? assignablePageIds : drafts[user.id] ?? [];
        const changed = user.role !== "admin" && [...pages].sort().join("|") !== [...user.pageAccess].sort().join("|");
        return <div key={user.id} className={`p-4 sm:p-5 ${user.active ? "" : "opacity-70"}`}>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-slate-800 text-slate-300"><UserRound className="h-4 w-4" /></span>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="truncate text-sm font-bold text-white">{user.name}</h3>
                  {user.role === "admin" && <span className="inline-flex items-center gap-1 rounded-full bg-orange-500/15 px-2 py-0.5 text-[10px] font-bold text-orange-300"><ShieldCheck className="h-3 w-3" /> Administrator</span>}
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${user.active ? "bg-emerald-500/15 text-emerald-300" : "bg-slate-700 text-slate-300"}`}>{user.active ? "Active" : "Inactive"}</span>
                </div>
                <p className="truncate text-xs text-slate-400">{user.email}{user.jobTitle ? ` · ${user.jobTitle}` : ""}</p>
              </div>
            </div>
            {user.role !== "admin" && <div className="flex shrink-0 flex-wrap gap-2">
              <button type="button" onClick={() => setDrafts((current) => ({ ...current, [user.id]: pages.length === assignablePageIds.length ? ["dashboard"] : [...assignablePageIds] }))} className="rounded-lg border border-slate-700 px-3 py-2 text-[11px] font-bold text-slate-300 hover:bg-slate-800">{pages.length === assignablePageIds.length ? "Dashboard only" : "Select all"}</button>
              <button type="button" disabled={!changed || savingId === user.id} onClick={() => void save(user)} className="inline-flex items-center gap-1.5 rounded-lg bg-[#ff6600] px-3 py-2 text-[11px] font-bold text-white disabled:cursor-not-allowed disabled:opacity-40"><Check className="h-3.5 w-3.5" /> {savingId === user.id ? "Saving..." : "Save access"}</button>
              <button type="button" disabled={savingId === user.id} onClick={() => void setAccountActive(user, !user.active)} className="rounded-lg border border-slate-700 px-3 py-2 text-[11px] font-bold text-slate-300 hover:bg-slate-800 disabled:opacity-40">{user.active ? "Deactivate" : "Reactivate"}</button>
            </div>}
          </div>
          <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {assignablePageOptions.map((page) => <label key={page.id} className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs ${user.role === "admin" || page.id === "dashboard" ? "cursor-not-allowed border-slate-800 bg-slate-900/60 text-slate-500" : "cursor-pointer border-slate-700 text-slate-300 hover:bg-slate-800"}`}>
              <input type="checkbox" disabled={user.role === "admin" || page.id === "dashboard"} checked={pages.includes(page.id)} onChange={() => togglePage(user.id, page.id)} className="h-4 w-4 accent-orange-600" />
              <span><span className="font-semibold">{page.label}</span><span className="ml-1 text-[10px] text-slate-500">{page.group}</span></span>
            </label>)}
          </div>
        </div>;
      })}
      {!users.length && <p className="px-4 py-10 text-center text-xs text-slate-500">No staff login accounts found.</p>}
    </div>
  </section>;
}
