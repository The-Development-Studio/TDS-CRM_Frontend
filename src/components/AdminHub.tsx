import React, { useState } from 'react';
import { Check, Pencil, Plus, Shield, Trash2, X } from 'lucide-react';
import { usePersistentState, isArrayOf } from '../hooks/usePersistentState';
import { RecordEditorField, RecordEditorModal, RecordEditorValues } from './RecordEditorModal';
import { formatINR } from '../utils/currency';
import { StaffAccessManager } from './StaffAccessManager';

type AdminRecord = RecordEditorValues & { id: string };
type CustomRole = {
  id: string;
  name: string;
  description: string;
  modules: string[];
};

const roleModules = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'leads', label: 'Leads' },
  { id: 'customers', label: 'Companies / Customers' },
  { id: 'activities', label: 'Activities' },
  { id: 'pipeline', label: 'Sales Pipeline' },
  { id: 'commercial', label: 'Quotations & Invoices' },
  { id: 'support', label: 'Support & Renewals' },
  { id: 'documents', label: 'Documents' },
  { id: 'analytics', label: 'Analytics & Reports' },
  { id: 'admin', label: 'Admin Settings' }
];

const isCustomRoleArray = (value: unknown): value is CustomRole[] =>
  Array.isArray(value) && value.every((item) =>
    typeof item === 'object' &&
    item !== null &&
    'id' in item && typeof item.id === 'string' &&
    'name' in item && typeof item.name === 'string' &&
    'description' in item && typeof item.description === 'string' &&
    'modules' in item && Array.isArray(item.modules) &&
    item.modules.every((module: unknown) => typeof module === 'string')
  );

type AdminColumn = {
  key: string;
  label: string;
  format?: (value: string | number) => string;
};

interface AdminTableProps {
  title: string;
  description: string;
  addLabel: string;
  records: AdminRecord[];
  columns: AdminColumn[];
  fields: RecordEditorField[];
  onSave: (records: AdminRecord[]) => void;
}

const adminTabs = [
  { id: 'services', label: 'Service Master' },
  { id: 'users', label: 'Users & Roles' },
  { id: 'commercial', label: 'Tax & Numbering Config' },
  { id: 'approvals', label: 'Approval Matrix' }
];

const statusField: RecordEditorField = {
  key: 'status',
  label: 'Status',
  type: 'select',
  options: [
    { label: 'Active', value: 'Active' },
    { label: 'Inactive', value: 'Inactive' }
  ],
  required: true
};

const initialTaxRules: AdminRecord[] = [
  { id: 'gst-default', name: 'GST', rate: 18, status: 'Active' }
];

const initialSequences: AdminRecord[] = [
  { id: 'lead-default', document: 'Lead', format: 'LD-{YYYY}-{SEQ}', nextNumber: 1, status: 'Active' },
  { id: 'proposal-default', document: 'Proposal', format: 'PROP-{YYYY}-{SEQ}', nextNumber: 1, status: 'Active' },
  { id: 'invoice-default', document: 'Tax Invoice', format: 'INV-{YYYY}-{SEQ}', nextNumber: 1, status: 'Active' }
];

const initialApprovalRules: AdminRecord[] = [
  {
    id: 'proposal-default',
    document: 'Proposal',
    threshold: 50000,
    approvers: 'VP of Sales, Finance Controller',
    status: 'Active'
  }
];

interface RoleEditorModalProps {
  role: CustomRole | null;
  roles: CustomRole[];
  onSave: (role: CustomRole) => void;
  onClose: () => void;
}

const RoleEditorModal: React.FC<RoleEditorModalProps> = ({ role, roles, onSave, onClose }) => {
  const [name, setName] = useState(role?.name ?? '');
  const [description, setDescription] = useState(role?.description ?? '');
  const [modules, setModules] = useState<string[]>(role?.modules ?? []);
  const [error, setError] = useState('');

  const toggleModule = (moduleId: string) => {
    setModules((current) => current.includes(moduleId)
      ? current.filter((id) => id !== moduleId)
      : [...current, moduleId]);
  };

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedName = name.trim();
    if (roles.some((item) => item.id !== role?.id && item.name.toLocaleLowerCase() === trimmedName.toLocaleLowerCase())) {
      setError('A role with this name already exists.');
      return;
    }
    if (modules.length === 0) {
      setError('Select access to at least one module.');
      return;
    }
    onSave({
      id: role?.id ?? crypto.randomUUID(),
      name: trimmedName,
      description: description.trim(),
      modules
    });
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/50 p-3 sm:p-6">
      <button type="button" aria-label="Close role editor" onClick={onClose} className="absolute inset-0 cursor-default" />
      <form
        onSubmit={submit}
        role="dialog"
        aria-modal="true"
        aria-labelledby="role-editor-title"
        className="relative z-10 max-h-[calc(100dvh-1.5rem)] w-full max-w-xl overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-2xl"
      >
        <header className="sticky top-0 flex items-center justify-between border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur sm:px-6">
          <h2 id="role-editor-title" className="text-sm font-bold text-slate-900">{role ? 'Edit role' : 'Create role'}</h2>
          <button type="button" onClick={onClose} aria-label="Close role editor" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100">
            <X className="h-4 w-4" />
          </button>
        </header>
        <div className="space-y-4 p-4 sm:p-6">
          <div>
            <label htmlFor="custom-role-name" className="block text-xs font-semibold text-slate-700">Role name *</label>
            <input
              id="custom-role-name"
              autoFocus
              required
              maxLength={60}
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm text-slate-900 outline-none focus:border-[#ff6600] focus:ring-2 focus:ring-orange-100"
            />
          </div>
          <div>
            <label htmlFor="custom-role-description" className="block text-xs font-semibold text-slate-700">Description</label>
            <textarea
              id="custom-role-description"
              rows={2}
              maxLength={200}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#ff6600] focus:ring-2 focus:ring-orange-100"
            />
          </div>
          <fieldset>
            <legend className="text-xs font-semibold text-slate-700">Module access *</legend>
            <p className="mt-1 text-[11px] text-slate-500">Choose which areas this role is intended to access.</p>
            <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {roleModules.map((module) => {
                const selected = modules.includes(module.id);
                return (
                  <label key={module.id} className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-700 hover:bg-slate-50">
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={() => toggleModule(module.id)}
                      className="h-4 w-4 accent-orange-600"
                    />
                    {module.label}
                  </label>
                );
              })}
            </div>
          </fieldset>
          {error && <p role="alert" className="text-xs font-medium text-rose-700">{error}</p>}
        </div>
        <footer className="flex justify-end gap-2 border-t border-slate-200 px-4 py-3 sm:px-6">
          <button type="button" onClick={onClose} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50">Cancel</button>
          <button type="submit" className="inline-flex items-center gap-2 rounded-lg bg-[#ff6600] px-4 py-2 text-xs font-semibold text-white hover:bg-[#e65c00]">
            <Check className="h-3.5 w-3.5" /> Save role
          </button>
        </footer>
      </form>
    </div>
  );
};

interface RoleManagerProps {
  roles: CustomRole[];
  assignedUsers: AdminRecord[];
  onSave: (role: CustomRole) => void;
  onDelete: (role: CustomRole) => void;
}

const RoleManager: React.FC<RoleManagerProps> = ({ roles, assignedUsers, onSave, onDelete }) => {
  const [editingRole, setEditingRole] = useState<CustomRole | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);

  const closeEditor = () => {
    setIsEditorOpen(false);
    setEditingRole(null);
  };

  const saveRole = (role: CustomRole) => {
    onSave(role);
    closeEditor();
  };

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-800 bg-[#111827]/80 shadow-md">
      <div className="flex flex-col gap-3 border-b border-slate-800 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <div>
          <h2 className="text-sm font-bold text-white">Role creator</h2>
          <p className="mt-1 text-xs text-slate-400">Create custom app roles and select intended module access.</p>
        </div>
        <button
          type="button"
          onClick={() => { setEditingRole(null); setIsEditorOpen(true); }}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#ff6600] px-3 py-2 text-xs font-bold text-white transition hover:bg-[#e65c00]"
        >
          <Plus className="h-4 w-4" /> Create role
        </button>
      </div>
      <div className="divide-y divide-slate-800/60">
        {roles.map((role) => {
          const assignedCount = assignedUsers.filter((user) => user.role === role.name).length;
          const moduleLabels = role.modules
            .map((moduleId) => roleModules.find((module) => module.id === moduleId)?.label)
            .filter((label): label is string => Boolean(label));
          return (
            <div key={role.id} className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-start sm:justify-between sm:px-5">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-xs font-bold text-slate-900">{role.name}</h3>
                  <span className="rounded-full bg-orange-50 px-2 py-0.5 text-[10px] font-semibold text-orange-700">
                    {assignedCount} assigned
                  </span>
                </div>
                {role.description && <p className="mt-1 text-xs text-slate-500">{role.description}</p>}
                <p className="mt-1 text-[11px] text-slate-500">{moduleLabels.join(' · ')}</p>
              </div>
              <div className="flex shrink-0 justify-end gap-1">
                <button
                  type="button"
                  onClick={() => { setEditingRole(role); setIsEditorOpen(true); }}
                  aria-label={`Edit role ${role.name}`}
                  className="rounded-md p-2 text-slate-500 transition hover:bg-orange-50 hover:text-orange-700"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(role)}
                  aria-label={`Delete role ${role.name}`}
                  className="rounded-md p-2 text-slate-500 transition hover:bg-rose-50 hover:text-rose-700"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          );
        })}
        {roles.length === 0 && (
          <p className="px-4 py-8 text-center text-xs text-slate-500">No custom roles yet. Create a role to assign it to staff.</p>
        )}
      </div>
      {isEditorOpen && (
        <RoleEditorModal role={editingRole} roles={roles} onSave={saveRole} onClose={closeEditor} />
      )}
    </section>
  );
};

const AdminTable: React.FC<AdminTableProps> = ({
  title,
  description,
  addLabel,
  records,
  columns,
  fields,
  onSave
}) => {
  const [editingRecord, setEditingRecord] = useState<AdminRecord | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);

  const openCreate = () => {
    setEditingRecord(null);
    setIsEditorOpen(true);
  };

  const openEdit = (record: AdminRecord) => {
    setEditingRecord(record);
    setIsEditorOpen(true);
  };

  const saveRecord = (values: RecordEditorValues) => {
    const record = { ...values, id: editingRecord?.id ?? crypto.randomUUID() };
    onSave(editingRecord
      ? records.map((item) => item.id === editingRecord.id ? record : item)
      : [record, ...records]);
    setIsEditorOpen(false);
    setEditingRecord(null);
  };

  const deleteRecord = (record: AdminRecord) => {
    const label = String(record[columns[0]?.key] ?? 'this record');
    if (window.confirm(`Delete ${label}? This cannot be undone.`)) {
      onSave(records.filter((item) => item.id !== record.id));
    }
  };

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-800 bg-[#111827]/80 shadow-md">
      <div className="flex flex-col gap-3 border-b border-slate-800 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <div>
          <h2 className="text-sm font-bold text-white">{title}</h2>
          <p className="mt-1 text-xs text-slate-400">{description}</p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#ff6600] px-3 py-2 text-xs font-bold text-white transition hover:bg-[#e65c00]"
        >
          <Plus className="h-4 w-4" />
          {addLabel}
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-[680px] w-full border-collapse text-left text-xs">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-900/90 text-[10px] font-bold uppercase tracking-wider text-slate-300">
              {columns.map((column) => (
                <th key={column.key} className="px-4 py-3">{column.label}</th>
              ))}
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-medium">
            {records.map((record) => (
              <tr key={record.id} className="transition hover:bg-slate-800/40">
                {columns.map((column) => {
                  const value = record[column.key] ?? '';
                  const text = column.format ? column.format(value) : String(value);
                  return (
                    <td key={column.key} className="px-4 py-3 text-slate-700">
                      {column.key === 'status' ? (
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          value === 'Active'
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : 'bg-slate-200 text-slate-600'
                        }`}>{text}</span>
                      ) : text}
                    </td>
                  );
                })}
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1">
                    <button
                      type="button"
                      onClick={() => openEdit(record)}
                      aria-label={`Edit ${String(record[columns[0]?.key] ?? 'record')}`}
                      className="rounded-md p-2 text-slate-500 transition hover:bg-orange-50 hover:text-orange-700"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteRecord(record)}
                      aria-label={`Delete ${String(record[columns[0]?.key] ?? 'record')}`}
                      className="rounded-md p-2 text-slate-500 transition hover:bg-rose-50 hover:text-rose-700"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {records.length === 0 && (
              <tr>
                <td colSpan={columns.length + 1} className="px-4 py-10 text-center text-xs text-slate-500">
                  No records yet. Select “{addLabel}” to create the first one.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {isEditorOpen && (
        <RecordEditorModal
          title={`${editingRecord ? 'Edit' : 'Add'} ${title.toLowerCase()}`}
          fields={fields}
          values={{ status: 'Active', ...(editingRecord ?? {}) }}
          onSave={saveRecord}
          onClose={() => {
            setIsEditorOpen(false);
            setEditingRecord(null);
          }}
        />
      )}
    </section>
  );
};

export const AdminHub: React.FC<{ onInviteStaff: () => void }> = ({ onInviteStaff }) => {
  const [activeTab, setActiveTab] = useState('services');
  const [services, setServices] = usePersistentState<AdminRecord[]>(
    'tds-crm:v2:admin-services',
    [],
    isArrayOf<AdminRecord>
  );
  const [taxRules, setTaxRules] = usePersistentState<AdminRecord[]>(
    'tds-crm:v2:admin-tax-rules',
    initialTaxRules,
    isArrayOf<AdminRecord>
  );
  const [sequences, setSequences] = usePersistentState<AdminRecord[]>(
    'tds-crm:v2:admin-numbering-sequences',
    initialSequences,
    isArrayOf<AdminRecord>
  );
  const [approvalRules, setApprovalRules] = usePersistentState<AdminRecord[]>(
    'tds-crm:v2:admin-approval-rules',
    initialApprovalRules,
    isArrayOf<AdminRecord>
  );

  const serviceFields: RecordEditorField[] = [
    { key: 'code', label: 'Service code', required: true },
    { key: 'name', label: 'Service name', required: true },
    { key: 'hourlyRate', label: 'Standard rate (INR/hr)', type: 'number', min: 0, required: true },
    statusField
  ];
  const taxFields: RecordEditorField[] = [
    { key: 'name', label: 'Tax rule name', required: true },
    { key: 'rate', label: 'Rate (%)', type: 'number', min: 0, max: 100, step: 0.01, required: true },
    statusField
  ];
  const sequenceFields: RecordEditorField[] = [
    { key: 'document', label: 'Document type', required: true },
    { key: 'format', label: 'Number format', required: true },
    { key: 'nextNumber', label: 'Next sequence number', type: 'number', min: 1, step: 1, required: true },
    statusField
  ];
  const approvalFields: RecordEditorField[] = [
    { key: 'document', label: 'Document / process', required: true },
    { key: 'threshold', label: 'Approval threshold (INR)', type: 'number', min: 0, required: true },
    { key: 'approvers', label: 'Approver(s)', required: true, fullWidth: true },
    statusField
  ];

  return (
    <div className="space-y-4 animate-in fade-in duration-200 sm:space-y-5">
      <header className="rounded-2xl border border-slate-800 bg-[#111827]/90 p-4 shadow-lg sm:p-5">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-extrabold tracking-tight text-white">System & Commercial Administration</h1>
          <span className="rounded-full border border-indigo-500/30 bg-indigo-500/20 px-2 py-0.5 text-xs font-bold text-indigo-300">
            Admin Configuration
          </span>
        </div>
        <p className="mt-1 text-xs text-slate-400">
          Manage service rates, staff login accounts, page access, tax rules, numbering sequences, and approval thresholds.
        </p>
      </header>

      <nav aria-label="Administration sections" className="flex gap-1 overflow-x-auto border-b border-slate-800 text-xs">
        {adminTabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            aria-current={activeTab === tab.id ? 'page' : undefined}
            onClick={() => setActiveTab(tab.id)}
            className={`whitespace-nowrap rounded-t-xl px-4 py-2 font-bold transition ${
              activeTab === tab.id
                ? 'border-x border-t-2 border-slate-800 border-t-indigo-500 bg-[#111827] text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {activeTab === 'services' && (
        <AdminTable
          title="Service master"
          description="Maintain the service catalogue and standard hourly rates."
          addLabel="Add service"
          records={services}
          columns={[
            { key: 'code', label: 'Service code' },
            { key: 'name', label: 'Service name' },
            { key: 'hourlyRate', label: 'Standard rate', format: (value) => `${formatINR(Number(value))}/hr` },
            { key: 'status', label: 'Status' }
          ]}
          fields={serviceFields}
          onSave={setServices}
        />
      )}

      {activeTab === 'users' && (
        <StaffAccessManager onInviteStaff={onInviteStaff} />
      )}

      {activeTab === 'commercial' && (
        <div className="space-y-4">
          <AdminTable
            title="Tax rules"
            description="Configure tax names and percentage rates for commercial documents."
            addLabel="Add tax rule"
            records={taxRules}
            columns={[
              { key: 'name', label: 'Tax rule' },
              { key: 'rate', label: 'Rate', format: (value) => `${value}%` },
              { key: 'status', label: 'Status' }
            ]}
            fields={taxFields}
            onSave={setTaxRules}
          />
          <AdminTable
            title="Numbering sequences"
            description="Configure document number formats and their next sequence values."
            addLabel="Add sequence"
            records={sequences}
            columns={[
              { key: 'document', label: 'Document type' },
              { key: 'format', label: 'Number format' },
              { key: 'nextNumber', label: 'Next number' },
              { key: 'status', label: 'Status' }
            ]}
            fields={sequenceFields}
            onSave={setSequences}
          />
        </div>
      )}

      {activeTab === 'approvals' && (
        <AdminTable
          title="Approval matrix"
          description="Set monetary thresholds and approvers for each document or process."
          addLabel="Add approval rule"
          records={approvalRules}
          columns={[
            { key: 'document', label: 'Document / process' },
            { key: 'threshold', label: 'Threshold', format: (value) => formatINR(Number(value)) },
            { key: 'approvers', label: 'Required approvers' },
            { key: 'status', label: 'Status' }
          ]}
          fields={approvalFields}
          onSave={setApprovalRules}
        />
      )}
    </div>
  );
};
