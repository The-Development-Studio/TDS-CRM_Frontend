import React, { useState } from 'react';
import type { Activity, Lead } from '../types/crm';
import { CalendarClock, Check, CircleAlert, Clock3, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { RecordEditorField, RecordEditorModal, RecordEditorValues } from './RecordEditorModal';

interface ActivitiesHubProps {
  activities: Activity[];
  leads: Lead[];
  onCreateActivity: (activity: Partial<Activity>) => void;
  onEditActivity: (activity: Activity) => void;
  onDeleteActivity: (activity: Activity) => void;
  onCompleteActivity: (activity: Activity) => void;
  onSelectLead: (leadId: string) => void;
}

const activityTypes: Activity['type'][] = ['Call', 'WhatsApp', 'Meeting', 'Email', 'Requirement Log', 'Proposal', 'System'];
const today = new Date().toISOString().slice(0, 10);

const createFields = (leads: Lead[]): RecordEditorField[] => [
  { key: 'title', label: 'Activity title', required: true },
  { key: 'type', label: 'Activity type', type: 'select', options: activityTypes.map((value) => ({ label: value, value })) },
  { key: 'leadId', label: 'Related lead', type: 'select', options: [
    { label: 'No related lead', value: '' },
    ...leads.map((lead) => ({ label: `${lead.name} · ${lead.company}`, value: lead.id }))
  ] },
  { key: 'date', label: 'Date', type: 'date', required: true },
  { key: 'time', label: 'Time', required: true },
  { key: 'user', label: 'Owner', required: true },
  { key: 'priority', label: 'Priority', type: 'select', options: (['High', 'Medium', 'Low'] as const).map((value) => ({ label: value, value })) },
  { key: 'description', label: 'Notes', type: 'textarea', fullWidth: true }
];

const getCategory = (date: string): Activity['category'] => {
  if (date < today) return 'Overdue';
  if (date === today) return 'Today';
  const tomorrow = new Date(`${today}T00:00:00`);
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (date === tomorrow.toISOString().slice(0, 10)) return 'Tomorrow';
  return 'This Week';
};

export const ActivitiesHub: React.FC<ActivitiesHubProps> = ({
  activities,
  leads,
  onCreateActivity,
  onEditActivity,
  onDeleteActivity,
  onCompleteActivity,
  onSelectLead
}) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | Activity['status']>('All');
  const [typeFilter, setTypeFilter] = useState<'All' | Activity['type']>('All');
  const [showCreate, setShowCreate] = useState(false);

  const filteredActivities = activities
    .filter((activity) => {
      const query = search.trim().toLowerCase();
      const matchesSearch = !query || [activity.title, activity.description, activity.leadName, activity.company, activity.user]
        .some((value) => value?.toLowerCase().includes(query));
      return matchesSearch && (statusFilter === 'All' || activity.status === statusFilter) &&
        (typeFilter === 'All' || activity.type === typeFilter);
    })
    .sort((left, right) => `${left.date} ${left.time}`.localeCompare(`${right.date} ${right.time}`));

  const dueCount = activities.filter((activity) => activity.status !== 'Completed' && activity.date <= today).length;
  const upcomingCount = activities.filter((activity) => activity.status !== 'Completed' && activity.date > today).length;
  const completedCount = activities.filter((activity) => activity.status === 'Completed').length;

  const createActivity = (values: RecordEditorValues) => {
    const leadId = String(values.leadId ?? '');
    const relatedLead = leads.find((lead) => lead.id === leadId);
    const date = String(values.date ?? today);
    onCreateActivity({
      leadId: relatedLead?.id,
      leadName: relatedLead?.name,
      company: relatedLead?.company,
      type: values.type as Activity['type'],
      title: String(values.title ?? '').trim(),
      description: String(values.description ?? ''),
      date,
      time: String(values.time ?? ''),
      user: String(values.user ?? ''),
      priority: values.priority as Activity['priority'],
      status: 'Scheduled',
      category: getCategory(date)
    });
    setShowCreate(false);
  };

  return (
    <div className="mx-auto max-w-6xl space-y-4 sm:space-y-5">
      <header className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div className="flex items-start gap-3">
          <span className="rounded-xl bg-orange-50 p-2.5 text-[#ff6600]"><CalendarClock className="h-5 w-5" aria-hidden="true" /></span>
          <div>
            <h1 className="text-lg font-extrabold text-slate-900 sm:text-xl">Activities Management</h1>
            <p className="mt-1 text-xs text-slate-500">Track follow-ups, customer meetings, and completed work.</p>
          </div>
        </div>
        <button type="button" onClick={() => setShowCreate(true)} className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#ff6600] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#e65c00]">
          <Plus className="h-4 w-4" /> New activity
        </button>
      </header>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Metric icon={<CircleAlert className="h-4 w-4" />} label="Due or overdue" value={dueCount} accent="text-rose-600" />
        <Metric icon={<Clock3 className="h-4 w-4" />} label="Upcoming" value={upcomingCount} accent="text-orange-700" />
        <Metric icon={<Check className="h-4 w-4" />} label="Completed" value={completedCount} accent="text-emerald-700" />
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-200 p-3 sm:flex-row sm:items-center sm:p-4">
          <div className="relative min-w-0 flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
            <input aria-label="Search activities" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search activities, customers, or owners" className="h-10 w-full rounded-lg border border-slate-200 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#ff6600] focus:outline-none focus:ring-2 focus:ring-orange-100" />
          </div>
          <div className="grid grid-cols-2 gap-2 sm:flex">
            <select aria-label="Filter activities by status" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)} className="h-10 min-w-0 rounded-lg border border-slate-200 bg-white px-2 text-xs text-slate-700 sm:px-3">
              <option value="All">All statuses</option>
              <option value="Scheduled">Scheduled</option>
              <option value="Pending">Pending</option>
              <option value="Completed">Completed</option>
            </select>
            <select aria-label="Filter activities by type" value={typeFilter} onChange={(event) => setTypeFilter(event.target.value as typeof typeFilter)} className="h-10 min-w-0 rounded-lg border border-slate-200 bg-white px-2 text-xs text-slate-700 sm:px-3">
              <option value="All">All types</option>
              {activityTypes.map((type) => <option key={type} value={type}>{type}</option>)}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-xs">
            <thead><tr className="border-b border-slate-200 bg-slate-50 text-[10px] font-bold uppercase tracking-wide text-slate-500"><th className="px-4 py-3">Activity</th><th className="px-4 py-3">Customer</th><th className="px-4 py-3">Date / time</th><th className="px-4 py-3">Owner</th><th className="px-4 py-3">Priority</th><th className="px-4 py-3">Status</th><th className="px-4 py-3 text-right">Actions</th></tr></thead>
            <tbody className="divide-y divide-slate-100">
              {filteredActivities.map((activity) => (
                <tr key={activity.id} className="hover:bg-slate-50">
                  <td className="max-w-sm px-4 py-3"><p className="font-semibold text-slate-800">{activity.title}</p><p className="mt-1 line-clamp-2 text-[11px] text-slate-500">{activity.description}</p></td>
                  <td className="px-4 py-3">{activity.leadId ? <button type="button" onClick={() => onSelectLead(activity.leadId!)} className="text-left font-semibold text-slate-700 hover:text-[#ff6600]">{activity.company || activity.leadName}</button> : <span className="text-slate-500">{activity.company || 'General activity'}</span>}</td>
                  <td className="whitespace-nowrap px-4 py-3"><p className="font-mono text-slate-700">{activity.date}</p><p className="mt-1 text-[11px] text-slate-500">{activity.time}</p></td>
                  <td className="px-4 py-3 text-slate-600">{activity.user}</td>
                  <td className="px-4 py-3"><span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-700">{activity.priority}</span></td>
                  <td className="px-4 py-3"><span className={`rounded-full px-2 py-1 text-[10px] font-semibold ${activity.status === 'Completed' ? 'bg-emerald-50 text-emerald-800' : activity.date < today ? 'bg-rose-50 text-rose-800' : 'bg-orange-50 text-orange-800'}`}>{activity.date < today && activity.status !== 'Completed' ? 'Overdue' : activity.status}</span></td>
                  <td className="whitespace-nowrap px-4 py-3 text-right">
                    {activity.status !== 'Completed' && <button type="button" onClick={() => onCompleteActivity(activity)} title="Mark completed" aria-label={`Mark ${activity.title} completed`} className="rounded-lg p-1.5 text-emerald-700 hover:bg-emerald-50"><Check className="h-4 w-4" /></button>}
                    <button type="button" onClick={() => onEditActivity(activity)} title="Edit activity" aria-label={`Edit ${activity.title}`} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-[#ff6600]"><Pencil className="h-4 w-4" /></button>
                    <button type="button" onClick={() => onDeleteActivity(activity)} title="Delete activity" aria-label={`Delete ${activity.title}`} className="rounded-lg p-1.5 text-slate-500 hover:bg-rose-50 hover:text-rose-600"><Trash2 className="h-4 w-4" /></button>
                  </td>
                </tr>
              ))}
              {!filteredActivities.length && <tr><td colSpan={7} className="px-4 py-14 text-center text-sm text-slate-500">No activities match these filters.</td></tr>}
            </tbody>
          </table>
        </div>
        <footer className="border-t border-slate-200 px-4 py-3 text-[11px] text-slate-500">Showing {filteredActivities.length} of {activities.length} activities</footer>
      </section>

      {showCreate && (
        <RecordEditorModal
          title="Schedule activity"
          fields={createFields(leads)}
          values={{ title: '', type: 'Call', leadId: '', date: today, time: '12:00 PM', user: '', priority: 'Medium', description: '' }}
          onSave={createActivity}
          onClose={() => setShowCreate(false)}
        />
      )}
    </div>
  );
};

const Metric: React.FC<{ icon: React.ReactNode; label: string; value: number; accent: string }> = ({ icon, label, value, accent }) => (
  <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4">
    <span className={`${accent}`}>{icon}</span>
    <div><p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">{label}</p><p className={`mt-1 text-lg font-extrabold ${accent}`}>{value}</p></div>
  </div>
);
