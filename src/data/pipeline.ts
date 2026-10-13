import type { PipelineStage } from '../types/crm';

export const PIPELINE_STAGES: PipelineStage[] = [
  { id: 'New', name: 'New Lead', color: '#6366F1', accentClass: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' },
  { id: 'Contacted', name: 'Contacted', color: '#38BDF8', accentClass: 'bg-sky-500/10 text-sky-400 border-sky-500/20' },
  { id: 'Requirement Collected', name: 'Requirement Collected', color: '#F59E0B', accentClass: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  { id: 'Qualified', name: 'Qualified', color: '#10B981', accentClass: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  { id: 'Opportunity', name: 'Opportunity', color: '#8B5CF6', accentClass: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
  { id: 'Proposal Sent', name: 'Proposal Sent', color: '#EC4899', accentClass: 'bg-pink-500/10 text-pink-400 border-pink-500/20' },
  { id: 'Negotiation', name: 'Negotiation', color: '#F97316', accentClass: 'bg-orange-500/10 text-orange-400 border-orange-500/20' },
  { id: 'Won', name: 'Won', color: '#22C55E', accentClass: 'bg-green-500/10 text-green-400 border-green-500/20' },
  { id: 'Lost', name: 'Lost', color: '#EF4444', accentClass: 'bg-red-500/10 text-red-400 border-red-500/20' }
];
