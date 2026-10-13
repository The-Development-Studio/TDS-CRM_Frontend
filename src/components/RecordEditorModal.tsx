import React, { useState } from 'react';
import { Save, X } from 'lucide-react';

export type RecordEditorValues = Record<string, string | number>;

export interface RecordEditorField {
  key: string;
  label: string;
  type?: 'text' | 'email' | 'tel' | 'date' | 'number' | 'url' | 'select' | 'textarea';
  options?: Array<{ label: string; value: string }>;
  required?: boolean;
  min?: number;
  max?: number;
  step?: number;
  fullWidth?: boolean;
}

interface RecordEditorModalProps {
  title: string;
  fields: RecordEditorField[];
  values: RecordEditorValues;
  onSave: (values: RecordEditorValues) => void;
  onClose: () => void;
}

export const RecordEditorModal: React.FC<RecordEditorModalProps> = ({
  title,
  fields,
  values,
  onSave,
  onClose
}) => {
  const [draft, setDraft] = useState(values);

  const updateField = (key: string, value: string | number) => {
    setDraft((current) => ({ ...current, [key]: value }));
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSave(draft);
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/50 p-3 sm:p-6">
      <button
        type="button"
        aria-label="Close edit dialog"
        onClick={onClose}
        className="absolute inset-0 cursor-default"
      />
      <form
        onSubmit={handleSubmit}
        role="dialog"
        aria-modal="true"
        aria-labelledby="record-editor-title"
        className="relative z-10 max-h-[calc(100dvh-1.5rem)] w-full max-w-2xl overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-2xl sm:max-h-[calc(100dvh-3rem)]"
      >
        <header className="sticky top-0 flex items-center justify-between border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur sm:px-6">
          <h2 id="record-editor-title" className="text-sm font-bold text-slate-900">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close edit dialog"
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 sm:p-6">
          {fields.map((field) => {
            const id = `record-field-${field.key}`;
            const fieldClass = field.fullWidth ? 'sm:col-span-2' : '';
            const commonClass = 'mt-1 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none focus:border-[#ff6600] focus:ring-2 focus:ring-orange-100';

            return (
              <div key={field.key} className={fieldClass}>
                <label htmlFor={id} className="block text-xs font-semibold text-slate-700">
                  {field.label}{field.required ? ' *' : ''}
                </label>
                {field.type === 'textarea' ? (
                  <textarea
                    id={id}
                    value={String(draft[field.key] ?? '')}
                    onChange={(event) => updateField(field.key, event.target.value)}
                    required={field.required}
                    rows={3}
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#ff6600] focus:ring-2 focus:ring-orange-100"
                  />
                ) : field.type === 'select' ? (
                  <select
                    id={id}
                    value={String(draft[field.key] ?? '')}
                    onChange={(event) => updateField(field.key, event.target.value)}
                    required={field.required}
                    className={commonClass}
                  >
                    {(field.options ?? []).map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    id={id}
                    type={field.type ?? 'text'}
                    value={draft[field.key] ?? ''}
                    onChange={(event) =>
                      updateField(field.key, field.type === 'number' && event.target.value !== ''
                        ? Number(event.target.value)
                        : event.target.value)
                    }
                    required={field.required}
                    min={field.min}
                    max={field.max}
                    step={field.step}
                    className={commonClass}
                  />
                )}
              </div>
            );
          })}
        </div>

        <footer className="flex justify-end gap-2 border-t border-slate-200 px-4 py-3 sm:px-6">
          <button type="button" onClick={onClose} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50">
            Cancel
          </button>
          <button type="submit" className="inline-flex items-center gap-2 rounded-lg bg-[#ff6600] px-4 py-2 text-xs font-semibold text-white hover:bg-[#e65c00]">
            <Save className="h-3.5 w-3.5" /> Save changes
          </button>
        </footer>
      </form>
    </div>
  );
};