import { FormEvent, useState } from "react";

interface StaffInviteModalProps {
  onClose: () => void;
}

export function StaffInviteModal({ onClose }: StaffInviteModalProps) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  const invite = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/staff-auth/invitations", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name })
      });
      const result = await response.json() as { message?: string; error?: string };
      if (!response.ok) throw new Error(result.error || `Invitation failed (${response.status})`);
      setSent(true);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not send invitation.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/60 p-4">
      <section role="dialog" aria-modal="true" aria-labelledby="staff-invite-title" className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <h2 id="staff-invite-title" className="text-lg font-bold text-slate-900">{sent ? "Invitation sent" : "Invite staff member"}</h2>
        {sent ? (
          <div className="mt-4 space-y-4">
            <p role="status" className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">Invitation sent to {email}.</p>
            <button onClick={onClose} className="w-full rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white">Done</button>
          </div>
        ) : (
          <form onSubmit={invite} className="mt-4 space-y-4">
            <label className="block text-sm font-medium text-slate-700">Name
              <input required maxLength={120} value={name} onChange={(event) => setName(event.target.value)} className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 px-3" />
            </label>
            <label className="block text-sm font-medium text-slate-700">Work email
              <input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 px-3" />
            </label>
            {error && <p role="alert" className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
            <div className="flex justify-end gap-2">
              <button type="button" onClick={onClose} className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600">Cancel</button>
              <button disabled={busy} className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{busy ? "Sending…" : "Send invitation"}</button>
            </div>
          </form>
        )}
      </section>
    </div>
  );
}
