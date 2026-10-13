import { FormEvent, useState } from "react";
import { BriefcaseBusiness, Building2, Check, Phone, UserRound, X } from "lucide-react";
import type { StaffUser } from "./StaffLogin";

interface MyProfileProps {
  user: StaffUser;
  required?: boolean;
  onSaved: (user: StaffUser) => Promise<void> | void;
  onClose?: () => void;
}

export function MyProfile({ user, required = false, onSaved, onClose }: MyProfileProps) {
  const [name, setName] = useState(user.name);
  const [jobTitle, setJobTitle] = useState(user.jobTitle ?? "");
  const [department, setDepartment] = useState(user.department ?? "");
  const [phone, setPhone] = useState(user.phone ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/staff-auth/profile", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, jobTitle, department, phone })
      });
      const result = await response.json().catch(() => ({})) as { data?: StaffUser; error?: string };
      if (!response.ok || !result.data) throw new Error(result.error || `Could not save profile (${response.status})`);
      await onSaved(result.data);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not save your profile.");
    } finally {
      setBusy(false);
    }
  };

  const initials = name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "U";

  return <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
    {!required && <button type="button" aria-label="Close profile" className="absolute inset-0" onClick={onClose} />}
    <form onSubmit={submit} className="relative z-10 w-full max-w-xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
      <header className="flex items-start justify-between gap-4 bg-slate-950 px-6 py-6 text-white">
        <div className="flex items-center gap-4">
          <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-[#ff6600] text-lg font-black">{initials}</div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-orange-400">{required ? "Welcome to TDS-OS" : "Account settings"}</p>
            <h1 className="mt-1 text-xl font-extrabold">{required ? "Complete your profile" : "My Profile"}</h1>
            <p className="mt-1 text-xs text-slate-400">{user.email}</p>
          </div>
        </div>
        {!required && <button type="button" onClick={onClose} aria-label="Close profile" className="rounded-lg p-2 text-slate-400 hover:bg-white/10 hover:text-white"><X className="h-4 w-4" /></button>}
      </header>

      <div className="grid gap-4 p-6 sm:grid-cols-2">
        <label className="text-xs font-bold text-slate-700 sm:col-span-2">Full name
          <span className="relative mt-2 block"><UserRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input required minLength={2} maxLength={120} value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" className="h-11 w-full rounded-xl border border-slate-200 pl-10 pr-3 text-sm font-normal outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100" /></span>
        </label>
        <label className="text-xs font-bold text-slate-700">Job title
          <span className="relative mt-2 block"><BriefcaseBusiness className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input required minLength={2} maxLength={120} value={jobTitle} onChange={(event) => setJobTitle(event.target.value)} placeholder="e.g. Sales Manager" className="h-11 w-full rounded-xl border border-slate-200 pl-10 pr-3 text-sm font-normal outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100" /></span>
        </label>
        <label className="text-xs font-bold text-slate-700">Department
          <span className="relative mt-2 block"><Building2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input required minLength={2} maxLength={120} value={department} onChange={(event) => setDepartment(event.target.value)} placeholder="e.g. Sales" className="h-11 w-full rounded-xl border border-slate-200 pl-10 pr-3 text-sm font-normal outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100" /></span>
        </label>
        <label className="text-xs font-bold text-slate-700 sm:col-span-2">Phone number <span className="font-normal text-slate-400">(optional)</span>
          <span className="relative mt-2 block"><Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input maxLength={40} value={phone} onChange={(event) => setPhone(event.target.value)} autoComplete="tel" placeholder="+91 98765 43210" className="h-11 w-full rounded-xl border border-slate-200 pl-10 pr-3 text-sm font-normal outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100" /></span>
        </label>
        {error && <p role="alert" className="rounded-xl border border-rose-100 bg-rose-50 p-3 text-xs font-medium text-rose-700 sm:col-span-2">{error}</p>}
      </div>

      <footer className="flex items-center justify-between gap-3 border-t border-slate-100 bg-slate-50 px-6 py-4">
        <p className="text-[11px] text-slate-500">You can update these details later from My Profile.</p>
        <button disabled={busy} className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-[#ff6600] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#e65c00] disabled:opacity-60">
          <Check className="h-4 w-4" /> {busy ? "Saving…" : required ? "Enter workspace" : "Save profile"}
        </button>
      </footer>
    </form>
  </div>;
}
