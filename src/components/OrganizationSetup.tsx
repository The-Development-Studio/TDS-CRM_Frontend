import React, { useState } from 'react';
import { Building2, Check, RotateCcw, Save } from 'lucide-react';
import { DEFAULT_ORGANIZATION_PROFILE } from '../data/organization';
import { OrganizationProfile } from '../types/crm';

interface OrganizationSetupProps {
  profile: OrganizationProfile;
  onSave: (profile: OrganizationProfile) => void;
}

type ProfileField = keyof OrganizationProfile;

export const OrganizationSetup: React.FC<OrganizationSetupProps> = ({ profile, onSave }) => {
  const [draft, setDraft] = useState(profile);
  const [saved, setSaved] = useState(false);

  const updateField = (field: ProfileField, value: string) => {
    setDraft((current) => ({ ...current, [field]: value }));
    setSaved(false);
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSave(draft);
    setSaved(true);
  };

  const resetDraft = () => {
    setDraft(DEFAULT_ORGANIZATION_PROFILE);
    setSaved(false);
  };

  return (
    <div className="mx-auto max-w-5xl space-y-4 sm:space-y-5">
      <header className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div className="flex items-start gap-3">
          <span className="rounded-xl bg-orange-50 p-2.5 text-[#ff6600]">
            <Building2 className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <h1 className="text-lg font-extrabold text-slate-900 sm:text-xl">Organization Setup</h1>
            <p className="mt-1 text-xs text-slate-500">Company details used in quotations, invoices, and account records.</p>
          </div>
        </div>
        <span className="w-fit rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">Currency: INR</span>
      </header>

      <form onSubmit={handleSubmit} className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <section className="border-b border-slate-200 p-4 sm:p-6">
          <SectionHeading title="Organization identity" description="Legal and display names shown throughout the CRM." />
          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <ProfileInput
              label="Legal organization name"
              value={draft.legalName}
              onChange={(value) => updateField('legalName', value)}
              placeholder="Registered legal name"
              required
            />
            <ProfileInput
              label="Display name"
              value={draft.displayName}
              onChange={(value) => updateField('displayName', value)}
              placeholder="Name shown in the app"
            />
            <ProfileInput
              label="Founder"
              value={draft.founderName}
              onChange={(value) => updateField('founderName', value)}
              placeholder="Founder name"
            />
            <ProfileInput
              label="Founder email"
              value={draft.founderEmail}
              onChange={(value) => updateField('founderEmail', value)}
              placeholder="founder@example.com"
              type="email"
            />
            <ProfileInput
              label="Co-founder"
              value={draft.coFounderName}
              onChange={(value) => updateField('coFounderName', value)}
              placeholder="Co-founder name"
            />
            <ProfileInput
              label="Co-founder email"
              value={draft.coFounderEmail}
              onChange={(value) => updateField('coFounderEmail', value)}
              placeholder="cofounder@example.com"
              type="email"
            />
            <ProfileInput
              label="Billing email"
              value={draft.billingEmail}
              onChange={(value) => updateField('billingEmail', value)}
              placeholder="billing@example.com"
              type="email"
            />
            <ProfileInput
              label="Phone"
              value={draft.phone}
              onChange={(value) => updateField('phone', value)}
              placeholder="Business phone number"
              type="tel"
            />
            <ProfileInput
              label="Website"
              value={draft.website}
              onChange={(value) => updateField('website', value)}
              placeholder="https://example.com"
              type="url"
            />
          </div>
        </section>

        <section className="border-b border-slate-200 p-4 sm:p-6">
          <SectionHeading title="Registered address" description="Used as the supplier address on printable financial documents." />
          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <ProfileInput
              label="Address line 1"
              value={draft.addressLine1}
              onChange={(value) => updateField('addressLine1', value)}
              placeholder="Street address"
            />
            <ProfileInput
              label="Address line 2"
              value={draft.addressLine2}
              onChange={(value) => updateField('addressLine2', value)}
              placeholder="Suite, building, or locality"
            />
            <ProfileInput
              label="City"
              value={draft.city}
              onChange={(value) => updateField('city', value)}
              placeholder="City"
            />
            <ProfileInput
              label="State / Union Territory"
              value={draft.state}
              onChange={(value) => updateField('state', value)}
              placeholder="State"
            />
            <ProfileInput
              label="Postal code"
              value={draft.postalCode}
              onChange={(value) => updateField('postalCode', value)}
              placeholder="Postal code"
            />
            <ProfileInput
              label="Country"
              value={draft.country}
              onChange={(value) => updateField('country', value)}
              placeholder="Country"
            />
          </div>
        </section>

        <section className="border-b border-slate-200 p-4 sm:p-6">
          <SectionHeading title="Tax and payment details" description="These values are included in document previews where applicable." />
          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <ProfileInput
              label="GSTIN"
              value={draft.gstin}
              onChange={(value) => updateField('gstin', value.toUpperCase())}
              placeholder="15-character GSTIN"
              maxLength={15}
            />
            <ProfileInput
              label="MSME / Udyam registration number"
              value={draft.msmeRegistration}
              onChange={(value) => updateField('msmeRegistration', value.toUpperCase())}
              placeholder="UDYAM-XX-00-0000000"
              maxLength={19}
            />
            <ProfileInput
              label="Default payment terms"
              value={draft.paymentTerms}
              onChange={(value) => updateField('paymentTerms', value)}
              placeholder="For example, Net 30 days"
            />
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-700">Document currency</label>
              <div className="flex h-10 items-center rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-700">
                INR - Indian Rupee
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-slate-200 p-4 sm:p-6">
          <SectionHeading title="Banking and remittance" description="Payment instructions displayed on proforma and tax invoices." />
          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <ProfileInput
              label="Account holder name"
              value={draft.bankAccountName}
              onChange={(value) => updateField('bankAccountName', value)}
              placeholder="Name on the bank account"
            />
            <ProfileInput
              label="Bank name"
              value={draft.bankName}
              onChange={(value) => updateField('bankName', value)}
              placeholder="Bank"
            />
            <ProfileInput
              label="Account number"
              value={draft.bankAccountNumber}
              onChange={(value) => updateField('bankAccountNumber', value)}
              placeholder="Bank account number"
            />
            <ProfileInput
              label="IFSC"
              value={draft.bankIfsc}
              onChange={(value) => updateField('bankIfsc', value.toUpperCase())}
              placeholder="IFSC code"
              maxLength={11}
            />
            <ProfileInput
              label="Branch"
              value={draft.bankBranch}
              onChange={(value) => updateField('bankBranch', value)}
              placeholder="Bank branch"
            />
            <ProfileInput
              label="SWIFT / BIC"
              value={draft.bankSwift}
              onChange={(value) => updateField('bankSwift', value.toUpperCase())}
              placeholder="For international transfers"
            />
            <ProfileInput
              label="UPI ID"
              value={draft.upiId}
              onChange={(value) => updateField('upiId', value)}
              placeholder="name@bank"
            />
          </div>
        </section>

        <footer className="flex flex-col-reverse gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div className="min-h-5 text-xs text-emerald-700" role="status" aria-live="polite">
            {saved && <span className="inline-flex items-center gap-1.5"><Check className="h-3.5 w-3.5" /> Organization details saved on this device.</span>}
          </div>
          <div className="flex flex-col-reverse gap-2 sm:flex-row">
            <button
              type="button"
              onClick={resetDraft}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 px-3.5 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              <RotateCcw className="h-3.5 w-3.5" /> Reset form
            </button>
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#ff6600] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#e65c00]"
            >
              <Save className="h-3.5 w-3.5" /> Save organization
            </button>
          </div>
        </footer>
      </form>
    </div>
  );
};

const SectionHeading: React.FC<{ title: string; description: string }> = ({ title, description }) => (
  <div>
    <h2 className="text-sm font-bold text-slate-900">{title}</h2>
    <p className="mt-1 text-xs text-slate-500">{description}</p>
  </div>
);

const ProfileInput: React.FC<{
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  type?: React.HTMLInputTypeAttribute;
  required?: boolean;
  maxLength?: number;
}> = ({ label, value, onChange, placeholder, type = 'text', required, maxLength }) => (
  <div>
    <label
      htmlFor={label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}
      className="mb-1.5 block text-xs font-semibold text-slate-700"
    >
      {label}{required ? ' *' : ''}
    </label>
    <input
      id={label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}
      type={type}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      required={required}
      maxLength={maxLength}
      className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#ff6600] focus:ring-2 focus:ring-orange-100"
    />
  </div>
);