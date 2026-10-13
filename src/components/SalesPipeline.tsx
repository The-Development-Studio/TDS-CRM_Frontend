import React from 'react';
import {
  TrendingUp,
  DollarSign,
  Plus,
  Filter,
  CheckCircle2,
  Calendar,
  Building,
  ChevronRight,
  Sparkles,
  ArrowRight,
  Pencil,
  Trash2
} from 'lucide-react';
import type { Opportunity } from '../types/crm';
import { PIPELINE_STAGES } from '../data/pipeline';
import { formatCompactINR, formatINR } from '../utils/currency';

interface SalesPipelineProps {
  opportunities: Opportunity[];
  onMoveStage: (oppId: string, targetStage: string) => void;
  onOpenNewOpportunity: () => void;
  onEditOpportunity: (opportunity: Opportunity) => void;
  onDeleteOpportunity: (opportunity: Opportunity) => void;
}

export const SalesPipeline: React.FC<SalesPipelineProps> = ({
  opportunities,
  onMoveStage,
  onOpenNewOpportunity,
  onEditOpportunity,
  onDeleteOpportunity
}) => {
  const totalValue = opportunities.reduce((sum, o) => sum + o.amount, 0);

  return (
    <div className="space-y-4 sm:space-y-5 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 p-4 sm:p-5 rounded-2xl bg-[#111827]/90 border border-slate-800 shadow-lg">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-extrabold text-white tracking-tight">Enterprise Sales Pipeline Kanban</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
              Total Deal Value: {formatINR(totalValue)}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Choose a destination stage on any deal card to move it through the sales process.
          </p>
        </div>

        <button
          onClick={onOpenNewOpportunity}
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-md shadow-purple-600/30 transition flex items-center gap-1.5 cursor-pointer active:scale-95"
        >
          <Plus className="w-4 h-4" /> Add Opportunity
        </button>
      </div>

      {/* Sales pipeline board */}
      <div className="flex gap-3 overflow-x-auto pb-4 items-start select-none">
        {PIPELINE_STAGES.map((stage) => {
          const stageDeals = opportunities.filter((o) => o.stage === stage.id);
          const stageSum = stageDeals.reduce((sum, o) => sum + o.amount, 0);

          return (
            <div
              key={stage.id}
              className="w-72 flex-shrink-0 bg-slate-900/90 rounded-2xl border border-slate-800 flex flex-col max-h-[calc(100vh-250px)]"
            >
              {/* Column Header */}
              <div className="p-3.5 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: stage.color }} />
                  <span className="font-bold text-xs text-white truncate max-w-[140px]">{stage.name}</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-800 font-mono text-slate-300">
                    {stageDeals.length}
                  </span>
                </div>
                <span className="text-[11px] font-mono font-bold text-cyan-300">
                  {formatCompactINR(stageSum)}
                </span>
              </div>

              {/* Cards List */}
              <div className="p-2.5 space-y-2.5 overflow-y-auto flex-1 min-h-[140px]">
                {stageDeals.length === 0 ? (
                  <div className="py-8 text-center border-2 border-dashed border-slate-800/80 rounded-xl text-[11px] text-slate-400">
                    No deals in this stage
                  </div>
                ) : (
                  stageDeals.map((deal) => (
                    <div
                      key={deal.id}
                      className="p-3 rounded-xl bg-[#111827] border border-slate-700/80 hover:border-indigo-500 hover:shadow-lg transition text-xs space-y-2 group"
                    >
                      <div className="flex items-start justify-between gap-1">
                        <span className="font-bold text-white group-hover:text-cyan-300 transition line-clamp-2">
                          {deal.name}
                        </span>
                        <div className="flex shrink-0">
                          <button type="button" onClick={() => onEditOpportunity(deal)} title="Edit opportunity" aria-label={`Edit opportunity ${deal.name}`} className="rounded p-1 text-slate-400 hover:bg-slate-700 hover:text-white">
                            <Pencil className="h-3 w-3" />
                          </button>
                          {stage.id !== 'Won' && (
                            <button type="button" onClick={() => onDeleteOpportunity(deal)} title="Delete opportunity" aria-label={`Delete opportunity ${deal.name}`} className="rounded p-1 text-slate-400 hover:bg-rose-500/10 hover:text-rose-400">
                              <Trash2 className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="text-[11px] text-slate-400 flex items-center gap-1">
                        <Building className="w-3 h-3 text-indigo-400 flex-shrink-0" />
                        <span className="truncate">{deal.company}</span>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                        <span className="font-mono font-extrabold text-sm text-emerald-400">
                          {formatINR(deal.amount)}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 font-mono text-slate-300">
                          {deal.probability}% Prob
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-slate-300 font-mono">
                        <span>Close: {deal.expectedClose}</span>
                        <span className="text-slate-300">{deal.owner}</span>
                      </div>

                      <div className="flex items-center gap-2 border-t border-slate-800 pt-2">
                        <label htmlFor={`stage-${deal.id}`} className="shrink-0 text-[10px] font-semibold text-slate-400">Move to</label>
                        <select
                          id={`stage-${deal.id}`}
                          aria-label={`Move ${deal.name} to stage`}
                          value={deal.stage}
                          onChange={(event) => onMoveStage(deal.id, event.target.value)}
                          className="min-w-0 flex-1 rounded-md border border-slate-700 bg-slate-900 px-2 py-1.5 text-[11px] font-semibold text-slate-200 focus:border-[#ff6600] focus:outline-none"
                        >
                          {PIPELINE_STAGES.map((option) => (
                            <option key={option.id} value={option.id}>{option.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
