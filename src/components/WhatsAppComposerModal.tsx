import { FormEvent, useMemo, useState } from "react";
import { CheckCheck, MessageCircle, Pencil, Plus, Send, Trash2, X } from "lucide-react";
import { isArrayOf, usePersistentState } from "../hooks/usePersistentState";

export interface WhatsAppRecipient {
  name: string;
  company: string;
  phone: string;
  service?: string;
  owner?: string;
}

interface WhatsAppTemplate { id: string; name: string; message: string; }
interface WhatsAppComposerModalProps { recipient: WhatsAppRecipient; onClose: () => void; }

const defaultTemplates: WhatsAppTemplate[] = [
  { id: "follow-up", name: "Template 1 · Follow-up", message: "Hello {{name}}, this is {{owner}} from TDS. I am following up regarding {{service}} for {{company}}. Please let me know a convenient time to connect." },
  { id: "meeting-reminder", name: "Template 2 · Meeting reminder", message: "Hello {{name}}, a quick reminder about our discussion regarding {{service}}. Please confirm whether the scheduled time is convenient for you. Thank you." }
];

const replaceToken = (value: string, token: string, replacement: string) => value.split(token).join(replacement);
const renderTemplate = (message: string, recipient: WhatsAppRecipient) => {
  const withName = replaceToken(message, "{{name}}", recipient.name || "there");
  const withCompany = replaceToken(withName, "{{company}}", recipient.company || "your organization");
  const withService = replaceToken(withCompany, "{{service}}", recipient.service || "your requirement");
  return replaceToken(withService, "{{owner}}", recipient.owner || "our team");
};

export function WhatsAppComposerModal({ recipient, onClose }: WhatsAppComposerModalProps) {
  const [templates, setTemplates] = usePersistentState<WhatsAppTemplate[]>("tds-crm:v2:whatsapp-templates", defaultTemplates, isArrayOf<WhatsAppTemplate>);
  const [selectedId, setSelectedId] = useState("custom");
  const [message, setMessage] = useState("");
  const [showCreator, setShowCreator] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [templateName, setTemplateName] = useState("");
  const [templateBody, setTemplateBody] = useState("");
  const [error, setError] = useState("");
  const phone = useMemo(() => {
    const digits = recipient.phone.replace(/[^0-9]/g, "");
    return digits.length === 10 ? `91${digits}` : digits;
  }, [recipient.phone]);
  const templateVariables = useMemo(() => [
    { token: "{{name}}", value: recipient.name || "there" },
    { token: "{{company}}", value: recipient.company || "your organization" },
    { token: "{{service}}", value: recipient.service || "your requirement" },
    { token: "{{owner}}", value: recipient.owner || "our team" }
  ], [recipient]);

  const selectTemplate = (template: WhatsAppTemplate) => {
    setSelectedId(template.id);
    setMessage(renderTemplate(template.message, recipient));
  };

  const openCreator = (template?: WhatsAppTemplate) => {
    setEditingId(template?.id ?? null);
    setTemplateName(template?.name ?? "");
    setTemplateBody(template?.message ?? "");
    setError("");
    setShowCreator(true);
  };

  const saveTemplate = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const name = templateName.trim();
    const body = templateBody.trim();
    if (!name || !body) return;
    if (templates.some((template) => template.id !== editingId && template.name.toLowerCase() === name.toLowerCase())) {
      setError("A template with this name already exists.");
      return;
    }
    const saved = { id: editingId ?? crypto.randomUUID(), name, message: body };
    setTemplates((current) => editingId ? current.map((template) => template.id === editingId ? saved : template) : [...current, saved]);
    setShowCreator(false);
    selectTemplate(saved);
  };

  const deleteTemplate = (template: WhatsAppTemplate) => {
    if (!window.confirm(`Delete WhatsApp template "${template.name}"?`)) return;
    setTemplates((current) => current.filter((item) => item.id !== template.id));
    if (selectedId === template.id) { setSelectedId("custom"); setMessage(""); }
  };

  const openWhatsApp = () => {
    if (!phone || !message.trim()) return;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message.trim())}`, "_blank", "noopener,noreferrer");
    onClose();
  };

  const insertVariable = (value: string) => {
    setMessage((current) => `${current}${current && !/\s$/.test(current) ? " " : ""}${value}`);
    setSelectedId("custom");
  };

  return <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/70 p-3 sm:p-6">
    <button type="button" aria-label="Close WhatsApp composer" onClick={onClose} className="absolute inset-0 cursor-default" />
    <section role="dialog" aria-modal="true" aria-labelledby="whatsapp-composer-title" className="relative z-10 max-h-[calc(100dvh-1.5rem)] w-full max-w-5xl overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl">
      <header className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-slate-800 bg-[#182231] px-5 py-5 sm:px-6">
        <div>
          <h2 id="whatsapp-composer-title" className="flex items-center gap-2.5 text-lg font-bold text-white"><span className="grid h-8 w-8 place-items-center rounded-full bg-emerald-400/10"><MessageCircle className="h-5 w-5 text-emerald-400" /></span> WhatsApp Message</h2>
          <p className="mt-1.5 pl-10 text-xs text-slate-400">To {recipient.name} · {recipient.company} · {recipient.phone}</p>
        </div>
        <button type="button" onClick={onClose} aria-label="Close" className="rounded-lg p-2 text-slate-400 transition hover:bg-white/10 hover:text-white"><X className="h-5 w-5" /></button>
      </header>

      <div className="grid gap-6 p-5 sm:p-6 md:grid-cols-[275px_1fr]">
        <aside>
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Message options</p>
          <div className="mt-2.5 space-y-2.5">
            <button type="button" onClick={() => { setSelectedId("custom"); setMessage(""); }} className={`w-full rounded-xl border px-4 py-3 text-left text-sm font-semibold transition ${selectedId === "custom" ? "border-emerald-500 bg-emerald-50 text-emerald-700 shadow-sm" : "border-slate-200 text-slate-800 hover:border-slate-300 hover:bg-slate-50"}`}>Custom Message</button>
            {templates.map((template) => <div key={template.id} className={`flex items-center rounded-xl border transition ${selectedId === template.id ? "border-emerald-500 bg-emerald-50 shadow-sm" : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"}`}>
              <button type="button" onClick={() => selectTemplate(template)} className={`min-w-0 flex-1 truncate px-4 py-3 text-left text-sm font-semibold ${selectedId === template.id ? "text-emerald-600" : "text-slate-800"}`}>{template.name}</button>
              <button type="button" onClick={() => openCreator(template)} aria-label={`Edit ${template.name}`} className="p-2 text-slate-500 transition hover:text-emerald-600"><Pencil className="h-4 w-4" /></button>
              <button type="button" onClick={() => deleteTemplate(template)} aria-label={`Delete ${template.name}`} className="p-2 pr-3 text-slate-500 transition hover:text-rose-500"><Trash2 className="h-4 w-4" /></button>
            </div>)}
          </div>
          <button type="button" onClick={() => openCreator()} className="mt-3.5 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 px-3 py-3 text-sm font-bold text-slate-700 transition hover:border-emerald-500 hover:bg-emerald-50 hover:text-emerald-700"><Plus className="h-4 w-4" /> Create template</button>
        </aside>

        <div className="min-w-0">
          <div className="flex items-center justify-between gap-3"><label htmlFor="whatsapp-message" className="text-sm font-bold text-slate-800">Message</label><span className="text-[11px] tabular-nums text-slate-400">{message.length} / 2,000</span></div>
          <textarea id="whatsapp-message" autoFocus rows={10} maxLength={2000} value={message} onChange={(event) => { setMessage(event.target.value); if (selectedId !== "custom") setSelectedId("custom"); }} placeholder="Write a custom WhatsApp message..." className="mt-2 w-full resize-y rounded-xl border border-slate-200 bg-white p-4 text-sm leading-7 text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10" />
          <div className="mt-2.5 flex flex-wrap items-center gap-2 text-[11px] text-slate-500"><span>Quick insert:</span>{templateVariables.map(({ token, value }) => <button type="button" key={token} onClick={() => insertVariable(value)} title={`Insert ${value}`} className="rounded-md bg-slate-100 px-2 py-1 font-mono text-slate-600 transition hover:bg-emerald-50 hover:text-emerald-700">{token}</button>)}</div>

          {message.trim() && <div className="mt-4 rounded-xl bg-[#efeae2] p-3.5">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">Preview</p>
            <div className="ml-auto max-w-[88%] rounded-xl rounded-tr-sm bg-[#d9fdd3] px-3 py-2.5 text-sm leading-6 text-slate-800 shadow-sm">
              <p className="whitespace-pre-wrap break-words">{message}</p>
              <div className="mt-1 flex items-center justify-end gap-1 text-[10px] text-slate-500"><span>now</span><CheckCheck className="h-3.5 w-3.5 text-sky-500" /></div>
            </div>
          </div>}

          {!phone && <p role="alert" className="mt-3 rounded-lg bg-rose-50 p-3 text-xs text-rose-700">This contact does not have a valid WhatsApp number.</p>}
          <div className="mt-5 flex flex-wrap items-center justify-end gap-2 border-t border-slate-200 pt-4">
            <button type="button" onClick={onClose} className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">Cancel</button>
            <button type="button" disabled={!phone || !message.trim()} onClick={openWhatsApp} className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-40"><Send className="h-4 w-4" /> Open WhatsApp</button>
          </div>
        </div>
      </div>

      {showCreator && <div className="absolute inset-0 z-20 flex items-center justify-center rounded-2xl bg-slate-950/65 p-4 backdrop-blur-sm">
        <form onSubmit={saveTemplate} className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl sm:p-6">
          <div className="flex items-center justify-between"><h3 className="text-base font-bold text-slate-900">{editingId ? "Edit template" : "Create WhatsApp template"}</h3><button type="button" onClick={() => setShowCreator(false)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"><X className="h-4 w-4" /></button></div>
          <label className="mt-5 block text-xs font-semibold text-slate-700">Template name<input required autoFocus maxLength={60} value={templateName} onChange={(event) => setTemplateName(event.target.value)} placeholder="e.g. Payment reminder" className="mt-1.5 h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10" /></label>
          <label className="mt-4 block text-xs font-semibold text-slate-700">Message<textarea required rows={6} maxLength={2000} value={templateBody} onChange={(event) => setTemplateBody(event.target.value)} placeholder="Hello {{name}}..." className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white p-3 text-sm leading-6 text-slate-900 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10" /></label>
          <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[10px] text-slate-500"><span>Variables:</span>{templateVariables.map(({ token }) => <button type="button" key={token} onClick={() => setTemplateBody((current) => `${current}${current && !/\s$/.test(current) ? " " : ""}${token}`)} className="rounded bg-slate-100 px-1.5 py-1 font-mono hover:bg-emerald-50 hover:text-emerald-700">{token}</button>)}</div>
          {error && <p role="alert" className="mt-3 rounded-lg bg-rose-50 p-2 text-xs text-rose-700">{error}</p>}
          <div className="mt-5 flex justify-end gap-2"><button type="button" onClick={() => setShowCreator(false)} className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">Cancel</button><button className="rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-500">Save template</button></div>
        </form>
      </div>}
    </section>
  </div>;
}
