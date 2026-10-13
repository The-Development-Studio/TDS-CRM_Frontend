import { useEffect, useState } from "react";
import { Check, LoaderCircle, ShieldCheck, UserRound } from "lucide-react";
import type { StaffUser } from "./StaffLogin";
import { allPageAccessIds, pageAccessOptions } from "../data/pageAccess";

export function StaffAccessManager() {
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
    setDrafts((current) => {
      const pages = current[userId] ?? [];
      return { ...current, [userId]: pages.includes(pageId) ? pages.filter((id) => id !== pageId) : [...pages, pageId] };
    });
  };

  const save = async (user: StaffUser) => {
    setSavingId(user.id);
    setError("");
    try {
      const response = await fetch(`/api/staff-auth/users/${user.id}/page-access`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pageAccess: drafts[user.id] ?? [] })
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

  if (loading) return <div className="flex items-center justify-center gap-2 rounded-2xl border border-slate-800 bg-[#111827] px-4 py-10 text-xs text-slate-300"><LoaderCircle className="h-4 w-4 animate-spin" /> Loading staff accounts…</div>;

  return <section className="overflow-hidden rounded-2xl border border-slate-800 bg-[#111827]/90 shadow-md">
    <header className="border-b border-slate-800 px-5 py-4">
      <h2 className="text-sm font-bold text-white">Login accounts & page access</h2>
      <p className="mt-1 text-xs text-slate-400">Choose exactly which CRM pages each active staff account can open. Administrators always retain full access.</p>
    </header>
    {error && <p role="alert" className="m-4 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-xs text-rose-300">{error}</p>}
    <div className="divide-y divide-slate-800">
      {users.map((user) => {
        const pages = user.role === "admin" ? allPageAccessIds : drafts[user.id] ?? [];
        const changed = user.role !== "admin" && [...pages].sort().join("|") !== [...user.pageAccess].sort().join("|");
        return <div key={user.id} className="p-4 sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-slate-800 text-slate-300"><UserRound className="h-4 w-4" /></span>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2"><h3 className="truncate text-sm font-bold text-white">{user.name}</h3>{user.role === "admin" && <span className="inline-flex items-center gap-1 rounded-full bg-orange-500/15 px-2 py-0.5 text-[10px] font-bold text-orange-300"><ShieldCheck className="h-3 w-3" /> Administrator</span>}</div>
                <p className="truncate text-xs text-slate-400">{user.email}{user.jobTitle ? ` · ${user.jobTitle}` : ""}</p>
              </div>
            </div>
            {user.role !== "admin" && <div className="flex shrink-0 gap-2">
              <button type="button" onClick={() => setDrafts((current) => ({ ...current, [user.id]: pages.length === allPageAccessIds.length ? ["dashboard"] : [...allPageAccessIds] }))} className="rounded-lg border border-slate-700 px-3 py-2 text-[11px] font-bold text-slate-300 hover:bg-slate-800">{pages.length === allPageAccessIds.length ? "Dashboard only" : "Select all"}</button>
              <button type="button" disabled={!changed || savingId === user.id} onClick={() => void save(user)} className="inline-flex items-center gap-1.5 rounded-lg bg-[#ff6600] px-3 py-2 text-[11px] font-bold text-white disabled:cursor-not-allowed disabled:opacity-40"><Check className="h-3.5 w-3.5" /> {savingId === user.id ? "Saving…" : "Save access"}</button>
            </div>}
          </div>
          <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {pageAccessOptions.map((page) => <label key={page.id} className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs ${user.role === "admin" ? "cursor-not-allowed border-slate-800 bg-slate-900/60 text-slate-500" : "cursor-pointer border-slate-700 text-slate-300 hover:bg-slate-800"}`}>
              <input type="checkbox" disabled={user.role === "admin"} checked={pages.includes(page.id)} onChange={() => togglePage(user.id, page.id)} className="h-4 w-4 accent-orange-600" />
              <span><span className="font-semibold">{page.label}</span><span className="ml-1 text-[10px] text-slate-500">{page.group}</span></span>
            </label>)}
          </div>
        </div>;
      })}
      {!users.length && <p className="px-4 py-10 text-center text-xs text-slate-500">No staff login accounts found.</p>}
    </div>
  </section>;
}
