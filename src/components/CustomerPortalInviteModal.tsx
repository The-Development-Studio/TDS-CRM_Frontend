import { FormEvent, useState } from 'react';
import { Mail, X } from 'lucide-react';
import type { Customer } from '../types/crm';

interface CustomerPortalInviteModalProps {
  customer: Customer;
  onClose: () => void;
}

export function CustomerPortalInviteModal({ customer, onClose }: CustomerPortalInviteModalProps) {
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const sendInvitation = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSending(true);
    setError('');
    setNotice('');
    try {
      const response = await fetch('/api/customer-portal/invitations', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer: {
            customerCode: customer.customerCode,
            companyName: customer.companyName,
            primaryContact: customer.primaryContact,
            email: customer.email
          }
        })
      });
      const result = await response.json() as { message?: string; error?: string };
      if (!response.ok) throw new Error(result.error || `Could not send invitation (${response.status})`);
      setNotice(result.message || `Invitation sent to ${customer.email}`);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Could not send customer portal invitation.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/60 p-4">
      <section role="dialog" aria-modal="true" aria-labelledby="portal-invite-title" className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-orange-50 text-[#e65b00]"><Mail className="h-4 w-4" /></span>
            <h2 id="portal-invite-title" className="mt-3 text-lg font-bold text-slate-900">Invite customer to portal</h2>
            <p className="mt-1 text-xs text-slate-500">{customer.companyName} · {customer.email || 'No customer email on file'}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close invitation" className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"><X className="h-4 w-4" /></button>
        </div>

        {notice ? (
          <div className="mt-5 space-y-4">
            <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{notice}</p>
            <button type="button" onClick={onClose} className="w-full rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white">Done</button>
          </div>
        ) : (
          <form onSubmit={sendInvitation} className="mt-5 space-y-4">
            <p className="text-xs leading-5 text-slate-600">The customer will receive a one-time setup link at the email on their customer record. The link expires after 48 hours.</p>
            {error && <p role="alert" className="rounded-lg bg-rose-50 p-2.5 text-xs text-rose-700">{error}</p>}
            <div className="flex justify-end gap-2">
              <button type="button" onClick={onClose} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600">Cancel</button>
              <button type="submit" disabled={isSending || !customer.email} className="rounded-lg bg-[#ff6600] px-4 py-2 text-xs font-bold text-white hover:bg-[#e65b00] disabled:opacity-50">{isSending ? 'Sending invitation…' : 'Send invitation'}</button>
            </div>
          </form>
        )}
      </section>
    </div>
  );
}
