import { ChangeEvent, useState } from 'react';
import { AlertCircle, CheckCircle2, Download, FileUp, X } from 'lucide-react';
import type { Lead } from '../types/crm';

interface LeadImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (leads: Lead[]) => { imported: number; skipped: number };
}

const sources: Lead['source'][] = ['Meta Ads', 'Instagram', 'Google Ads', 'Website', 'Referral', 'Direct', 'Other'];
const statuses: Lead['status'][] = ['New', 'Assigned', 'Contacted', 'Requirement Collected', 'Qualified', 'Opportunity Created', 'Won', 'Unqualified', 'Converted'];
const priorities: Lead['priority'][] = ['Urgent', 'High', 'Medium', 'Low'];

const parseCsv = (text: string) => {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (character === '"') {
      if (quoted && text[index + 1] === '"') { field += '"'; index += 1; }
      else quoted = !quoted;
    } else if (character === ',' && !quoted) {
      row.push(field.trim()); field = '';
    } else if ((character === '\n' || character === '\r') && !quoted) {
      if (character === '\r' && text[index + 1] === '\n') index += 1;
      row.push(field.trim());
      if (row.some(Boolean)) rows.push(row);
      row = []; field = '';
    } else field += character;
  }
  row.push(field.trim());
  if (row.some(Boolean)) rows.push(row);
  return rows;
};

const normalizeHeader = (value: string) => value.toLowerCase().replace(/^\ufeff/, '').replace(/[^a-z0-9]/g, '');

export function LeadImportModal({ isOpen, onClose, onImport }: LeadImportModalProps) {
  const [fileName, setFileName] = useState('');
  const [parsedLeads, setParsedLeads] = useState<Lead[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [result, setResult] = useState<{ imported: number; skipped: number } | null>(null);

  if (!isOpen) return null;

  const resetAndClose = () => {
    setFileName(''); setParsedLeads([]); setErrors([]); setResult(null); onClose();
  };

  const readFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setFileName(file.name); setResult(null);
    const reader = new FileReader();
    reader.onload = () => {
      const rows = parseCsv(String(reader.result ?? ''));
      if (rows.length < 2) { setParsedLeads([]); setErrors(['The CSV must contain a header and at least one lead row.']); return; }
      const headers = rows[0].map(normalizeHeader);
      const valueAt = (values: string[], ...aliases: string[]) => {
        const index = headers.findIndex((header) => aliases.includes(header));
        return index >= 0 ? (values[index] ?? '').trim() : '';
      };
      const nextErrors: string[] = [];
      const today = new Date().toISOString().split('T')[0];
      const parsed = rows.slice(1).flatMap((values, rowIndex) => {
        const name = valueAt(values, 'name', 'leadname', 'contactname');
        const company = valueAt(values, 'company', 'companyname', 'organization');
        const phone = valueAt(values, 'phone', 'mobile', 'mobilenumber');
        if (!name || !company || !phone) {
          nextErrors.push(`Row ${rowIndex + 2}: Name, Company and Phone are required.`);
          return [];
        }
        const sourceValue = valueAt(values, 'source', 'leadsource') as Lead['source'];
        const statusValue = valueAt(values, 'status', 'leadstatus') as Lead['status'];
        const priorityValue = valueAt(values, 'priority') as Lead['priority'];
        const budget = Number(valueAt(values, 'budgetinr', 'estimatedbudget', 'budget').replace(/[^0-9.-]/g, ''));
        return [{
          id: valueAt(values, 'leadid', 'id') || `LD-${new Date().getFullYear()}-${Date.now().toString().slice(-5)}-${rowIndex + 1}`,
          name,
          designation: valueAt(values, 'designation', 'role'),
          company,
          email: valueAt(values, 'email', 'officialemail'),
          phone,
          whatsapp: valueAt(values, 'whatsapp', 'whatsappnumber') || phone,
          website: valueAt(values, 'website', 'companywebsite'),
          source: sources.includes(sourceValue) ? sourceValue : 'Other',
          campaign: valueAt(values, 'campaign') || 'CSV Import',
          interestedService: valueAt(values, 'interestedservice', 'service', 'serviceinterest'),
          estimatedBudget: Number.isFinite(budget) && budget >= 0 ? budget : 0,
          leadOwner: valueAt(values, 'leadowner', 'owner'),
          status: statuses.includes(statusValue) ? statusValue : 'New',
          priority: priorities.includes(priorityValue) ? priorityValue : 'Medium',
          nextFollowUp: valueAt(values, 'nextfollowup', 'followupdate'),
          nextFollowUpTime: valueAt(values, 'nextfollowuptime', 'followuptime'),
          createdDate: valueAt(values, 'createddate', 'date') || today,
          requirement: valueAt(values, 'requirement', 'requirements'),
          commercialNotes: valueAt(values, 'commercialnotes'),
          notes: [valueAt(values, 'notes', 'note') || 'Lead imported from CSV.']
        } satisfies Lead];
      });
      setParsedLeads(parsed); setErrors(nextErrors);
    };
    reader.onerror = () => { setParsedLeads([]); setErrors(['The selected file could not be read.']); };
    reader.readAsText(file);
  };

  const downloadTemplate = () => {
    const header = 'Lead ID,Name,Company,Email,Phone,WhatsApp,Source,Status,Priority,Budget (INR),Interested Service,Lead Owner,Designation,Campaign,Requirement,Next Follow Up';
    const sample = ',Sample Contact,Sample Company,contact@example.com,9876543210,9876543210,Referral,New,Medium,50000,Website Development,,,Referral Campaign,,2026-10-30';
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([`${header}\n${sample}\n`], { type: 'text/csv;charset=utf-8' }));
    link.download = 'TDS_CRM_Lead_Import_Template.csv';
    link.click();
    URL.revokeObjectURL(link.href);
  };

  return <div className="fixed inset-0 z-[95] flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
    <section role="dialog" aria-modal="true" aria-labelledby="lead-import-title" className="w-full max-w-2xl rounded-2xl border border-slate-700 bg-[#111827] shadow-2xl">
      <header className="flex items-start justify-between border-b border-slate-800 px-5 py-4">
        <div><h2 id="lead-import-title" className="flex items-center gap-2 text-base font-bold text-white"><FileUp className="h-5 w-5 text-cyan-400" /> Import Leads</h2><p className="mt-1 text-xs text-slate-400">Upload a CSV file. Required columns: Name, Company and Phone.</p></div>
        <button type="button" onClick={resetAndClose} aria-label="Close" className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white"><X className="h-4 w-4" /></button>
      </header>
      <div className="space-y-4 p-5">
        <div className="rounded-xl border border-dashed border-slate-600 bg-slate-900/60 p-6 text-center">
          <FileUp className="mx-auto h-8 w-8 text-slate-400" />
          <label className="mt-3 inline-flex cursor-pointer items-center rounded-lg bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-500">Choose CSV file<input type="file" accept=".csv,text/csv" onChange={readFile} className="sr-only" /></label>
          <p className="mt-2 text-xs text-slate-400">{fileName || 'Maximum recommended size: 5 MB'}</p>
        </div>
        <button type="button" onClick={downloadTemplate} className="inline-flex items-center gap-2 text-xs font-semibold text-cyan-300 hover:text-cyan-200"><Download className="h-4 w-4" /> Download CSV template</button>
        {parsedLeads.length > 0 && <div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-300"><CheckCircle2 className="h-4 w-4" /> {parsedLeads.length} valid lead{parsedLeads.length === 1 ? '' : 's'} ready to import.</div>}
        {errors.length > 0 && <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-200"><p className="flex items-center gap-2 font-bold"><AlertCircle className="h-4 w-4" /> {errors.length} row{errors.length === 1 ? '' : 's'} skipped during validation</p><ul className="mt-2 list-disc space-y-1 pl-5 text-amber-200/80">{errors.slice(0, 5).map((error) => <li key={error}>{error}</li>)}</ul></div>}
        {result && <div className="rounded-lg border border-cyan-500/30 bg-cyan-500/10 p-3 text-xs text-cyan-200">Imported {result.imported} lead{result.imported === 1 ? '' : 's'}. Skipped {result.skipped + errors.length} duplicate or invalid row{result.skipped + errors.length === 1 ? '' : 's'}.</div>}
      </div>
      <footer className="flex justify-end gap-2 border-t border-slate-800 px-5 py-4">
        <button type="button" onClick={resetAndClose} className="rounded-lg border border-slate-700 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800">{result ? 'Done' : 'Cancel'}</button>
        {!result && <button type="button" disabled={!parsedLeads.length} onClick={() => setResult(onImport(parsedLeads))} className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-40">Import {parsedLeads.length || ''} Leads</button>}
      </footer>
    </section>
  </div>;
}
