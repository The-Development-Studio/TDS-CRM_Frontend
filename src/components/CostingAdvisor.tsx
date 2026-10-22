import React, { useMemo, useState } from 'react';
import {
  BrainCircuit,
  Calculator,
  CheckCircle2,
  Clipboard,
  Gauge,
  IndianRupee,
  Lightbulb,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  TriangleAlert
} from 'lucide-react';
import type { Customer, Invoice, Lead, Proposal } from '../types/crm';
import { formatINR } from '../utils/currency';

interface CostingAdvisorProps {
  customers: Customer[];
  leads: Lead[];
  proposals: Proposal[];
  invoices: Invoice[];
}

type Complexity = 'Low' | 'Medium' | 'High' | 'Critical';
type PricingModel = 'Fixed project' | 'Hourly' | 'Monthly retainer';

const complexityRisk: Record<Complexity, number> = {
  Low: 3,
  Medium: 7,
  High: 14,
  Critical: 22
};

const clamp = (value: number, minimum: number, maximum: number) => Math.min(maximum, Math.max(minimum, value));
const roundCommercialPrice = (value: number) => Math.ceil(Math.max(0, value) / 1000) * 1000;

export default function CostingAdvisor({ customers, leads, proposals, invoices }: CostingAdvisorProps) {
  const [customerId, setCustomerId] = useState('');
  const [serviceName, setServiceName] = useState('Technology consulting and implementation');
  const [pricingModel, setPricingModel] = useState<PricingModel>('Fixed project');
  const [complexity, setComplexity] = useState<Complexity>('Medium');
  const [deliveryHours, setDeliveryHours] = useState(160);
  const [hourlyCost, setHourlyCost] = useState(1200);
  const [specialistHours, setSpecialistHours] = useState(24);
  const [specialistCost, setSpecialistCost] = useState(2200);
  const [teamMembers, setTeamMembers] = useState(2);
  const [deliveryWeeks, setDeliveryWeeks] = useState(4);
  const [toolsCost, setToolsCost] = useState(15000);
  const [thirdPartyCost, setThirdPartyCost] = useState(10000);
  const [travelCost, setTravelCost] = useState(0);
  const [overheadPct, setOverheadPct] = useState(18);
  const [contingencyPct, setContingencyPct] = useState(8);
  const [targetMarginPct, setTargetMarginPct] = useState(35);
  const [discountPct, setDiscountPct] = useState(0);
  const [gstRate, setGstRate] = useState(18);
  const [copied, setCopied] = useState(false);

  const selectedCustomer = customers.find((customer) => customer.id === customerId);

  const history = useMemo(() => {
    const company = selectedCustomer?.companyName.trim().toLowerCase();
    const relatedLeadIds = new Set(leads
      .filter((lead) => company && lead.company.trim().toLowerCase() === company)
      .map((lead) => lead.id));
    const customerQuotes = proposals.filter((proposal) =>
      proposal.documentType === 'Quotation' && (!company || relatedLeadIds.has(proposal.leadId))
    );
    const acceptedQuotes = customerQuotes.filter((proposal) => proposal.status === 'Accepted');
    const customerInvoices = invoices.filter((invoice) =>
      !company || invoice.customer.trim().toLowerCase() === company
    );
    const average = (values: number[]) => values.length
      ? values.reduce((total, value) => total + value, 0) / values.length
      : 0;

    return {
      quoteCount: customerQuotes.length,
      winRate: customerQuotes.length ? (acceptedQuotes.length / customerQuotes.length) * 100 : 0,
      averageAcceptedQuote: average(acceptedQuotes.map((proposal) => proposal.amount)),
      averageInvoice: average(customerInvoices.filter((invoice) => invoice.status !== 'Voided').map((invoice) => invoice.amount)),
      evidenceCount: customerQuotes.length + customerInvoices.length
    };
  }, [invoices, leads, proposals, selectedCustomer]);

  const analysis = useMemo(() => {
    const primaryLabor = Math.max(0, deliveryHours) * Math.max(0, hourlyCost);
    const specialistLabor = Math.max(0, specialistHours) * Math.max(0, specialistCost);
    const laborCost = primaryLabor + specialistLabor;
    const directExpenses = Math.max(0, toolsCost) + Math.max(0, thirdPartyCost) + Math.max(0, travelCost);
    const overhead = laborCost * clamp(overheadPct, 0, 100) / 100;
    const coreCost = laborCost + directExpenses + overhead;
    const weeklyLoad = deliveryHours / Math.max(1, teamMembers) / Math.max(1, deliveryWeeks);
    const timelineRisk = weeklyLoad > 45 ? 7 : weeklyLoad > 38 ? 4 : weeklyLoad > 32 ? 2 : 0;
    const adjustedContingencyPct = clamp(contingencyPct + complexityRisk[complexity] + timelineRisk, 0, 50);
    const contingency = coreCost * adjustedContingencyPct / 100;
    const trueCost = coreCost + contingency;

    const scenario = (name: string, margin: number, contingencyShift: number, tone: string) => {
      const scenarioCost = coreCost * (1 + clamp(adjustedContingencyPct + contingencyShift, 0, 50) / 100);
      const netRequired = scenarioCost / Math.max(0.05, 1 - clamp(margin, 0, 80) / 100);
      const listPrice = roundCommercialPrice(netRequired / Math.max(0.05, 1 - clamp(discountPct, 0, 70) / 100));
      const quotedPrice = listPrice * (1 - clamp(discountPct, 0, 70) / 100);
      return {
        name,
        margin,
        listPrice,
        quotedPrice,
        clientTotal: quotedPrice * (1 + clamp(gstRate, 0, 100) / 100),
        realizedMargin: quotedPrice ? ((quotedPrice - scenarioCost) / quotedPrice) * 100 : 0,
        tone
      };
    };

    const floor = scenario('Safe floor', Math.max(18, targetMarginPct - 15), -3, 'amber');
    const recommended = scenario('Recommended', targetMarginPct, 0, 'orange');
    const premium = scenario('Premium', Math.min(65, targetMarginPct + 10), 4, 'emerald');
    let riskScore = complexityRisk[complexity] * 2;
    riskScore += timelineRisk * 5;
    riskScore += discountPct > 15 ? 18 : discountPct > 8 ? 9 : 0;
    riskScore += contingencyPct < complexityRisk[complexity] / 2 ? 12 : 0;
    riskScore += targetMarginPct < 25 ? 10 : 0;
    riskScore += selectedCustomer && !selectedCustomer.billingAddress ? 5 : 0;
    riskScore = clamp(Math.round(riskScore), 0, 100);
    const confidence = clamp(48 + (selectedCustomer ? 10 : 0) + Math.min(22, history.evidenceCount * 4) + (serviceName.trim() ? 8 : 0) + (deliveryHours > 0 ? 8 : 0), 0, 96);
    const effectiveHourlyRate = recommended.quotedPrice / Math.max(1, deliveryHours + specialistHours);
    const breakEvenRate = trueCost / Math.max(1, deliveryHours + specialistHours);
    const durationMonths = Math.max(1, deliveryWeeks / 4.33);

    const recommendations: Array<{ tone: 'warning' | 'positive' | 'info'; text: string }> = [];
    if (weeklyLoad > 40) recommendations.push({ tone: 'warning', text: `Capacity is stretched at ${weeklyLoad.toFixed(1)} hours per person/week. Add delivery capacity or extend the schedule.` });
    if (discountPct > 10) recommendations.push({ tone: 'warning', text: `The ${discountPct}% discount requires a list price of ${formatINR(recommended.listPrice)} to protect the target margin.` });
    if (contingencyPct < 10 && ['High', 'Critical'].includes(complexity)) recommendations.push({ tone: 'warning', text: `Raise explicit contingency for ${complexity.toLowerCase()} complexity; the adviser has applied an additional risk reserve.` });
    if (history.averageAcceptedQuote > 0 && recommended.quotedPrice > history.averageAcceptedQuote * 1.35) recommendations.push({ tone: 'info', text: `Recommended pricing is materially above this customer's accepted-quotation average of ${formatINR(history.averageAcceptedQuote)}. Strengthen the value narrative and scope detail.` });
    if (history.averageAcceptedQuote > 0 && recommended.quotedPrice < history.averageAcceptedQuote * 0.7) recommendations.push({ tone: 'info', text: `This estimate is well below the customer's historical accepted value. Check whether scope, support, or change-control items are missing.` });
    if (selectedCustomer && !selectedCustomer.customerGstin) recommendations.push({ tone: 'info', text: 'Customer GSTIN is not available. Confirm tax registration before issuing the commercial document.' });
    if (targetMarginPct >= 30 && riskScore < 45) recommendations.push({ tone: 'positive', text: 'The recommended scenario has healthy commercial protection and a workable risk-adjusted margin.' });
    if (!recommendations.length) recommendations.push({ tone: 'positive', text: 'Inputs are commercially balanced. Use the recommended scenario as the approval baseline.' });

    return {
      laborCost,
      directExpenses,
      overhead,
      coreCost,
      contingency,
      trueCost,
      adjustedContingencyPct,
      weeklyLoad,
      riskScore,
      confidence,
      effectiveHourlyRate,
      breakEvenRate,
      monthlyRetainer: recommended.quotedPrice / durationMonths,
      scenarios: [floor, recommended, premium],
      recommended,
      recommendations
    };
  }, [complexity, contingencyPct, deliveryHours, deliveryWeeks, discountPct, gstRate, history, hourlyCost, overheadPct, selectedCustomer, serviceName, specialistCost, specialistHours, targetMarginPct, teamMembers, thirdPartyCost, toolsCost, travelCost]);

  const copyRecommendation = async () => {
    const text = [
      `Costing recommendation: ${serviceName}`,
      `Customer: ${selectedCustomer?.companyName || 'Not selected'}`,
      `Pricing model: ${pricingModel}`,
      `True delivery cost: ${formatINR(analysis.trueCost)}`,
      `Recommended quote before GST: ${formatINR(analysis.recommended.quotedPrice)}`,
      `Client total with GST: ${formatINR(analysis.recommended.clientTotal)}`,
      `Expected margin: ${analysis.recommended.realizedMargin.toFixed(1)}%`,
      `Risk score: ${analysis.riskScore}/100`
    ].join('\n');
    await navigator.clipboard.writeText(text);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  const riskLabel = analysis.riskScore >= 65 ? 'High risk' : analysis.riskScore >= 35 ? 'Moderate risk' : 'Controlled risk';

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      <header className="overflow-hidden rounded-2xl border border-slate-800 bg-[#111827] text-white shadow-lg">
        <div className="flex flex-col gap-5 p-5 sm:p-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-orange-500/15 text-orange-300"><BrainCircuit className="h-6 w-6" /></div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-orange-300">Commercial intelligence</p>
              <h1 className="mt-1 text-2xl font-extrabold tracking-tight">Costing Adviser</h1>
              <p className="mt-1 max-w-3xl text-xs leading-5 text-slate-300">Risk-adjusted pricing, margin protection, scenario modelling, and explainable recommendations using live CRM history.</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs"><Sparkles className="h-4 w-4 text-orange-300" /> {analysis.confidence}% confidence</span>
            <button type="button" onClick={() => void copyRecommendation()} className="inline-flex items-center gap-2 rounded-xl bg-[#ff6600] px-4 py-2 text-xs font-bold text-white hover:bg-[#e65c00]"><Clipboard className="h-4 w-4" /> {copied ? 'Copied' : 'Copy advice'}</button>
          </div>
        </div>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric icon={Calculator} label="True delivery cost" value={formatINR(analysis.trueCost)} detail={`${analysis.adjustedContingencyPct.toFixed(0)}% total risk reserve`} tone="slate" />
        <Metric icon={Target} label="Recommended quote" value={formatINR(analysis.recommended.quotedPrice)} detail="Before GST, after discount" tone="orange" />
        <Metric icon={IndianRupee} label="Client total" value={formatINR(analysis.recommended.clientTotal)} detail={`Includes ${gstRate}% GST`} tone="emerald" />
        <Metric icon={Gauge} label="Commercial risk" value={`${analysis.riskScore}/100`} detail={riskLabel} tone={analysis.riskScore >= 65 ? 'rose' : analysis.riskScore >= 35 ? 'amber' : 'emerald'} />
      </section>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.18fr)_minmax(360px,0.82fr)]">
        <section className="space-y-5">
          <Card title="Engagement context" icon={BrainCircuit}>
            <div className="grid gap-4 sm:grid-cols-2">
              <SelectField label="Customer" value={customerId} onChange={setCustomerId} options={[{ label: 'General / prospect costing', value: '' }, ...customers.map((customer) => ({ label: `${customer.companyName} (${customer.customerCode})`, value: customer.id }))]} />
              <SelectField label="Pricing model" value={pricingModel} onChange={(value) => setPricingModel(value as PricingModel)} options={(['Fixed project', 'Hourly', 'Monthly retainer'] as PricingModel[]).map((value) => ({ label: value, value }))} />
              <label className="sm:col-span-2 text-xs font-semibold text-slate-700">Service / engagement<input value={serviceName} onChange={(event) => setServiceName(event.target.value)} className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-[#ff6600] focus:ring-2 focus:ring-orange-100" /></label>
              <SelectField label="Delivery complexity" value={complexity} onChange={(value) => setComplexity(value as Complexity)} options={(['Low', 'Medium', 'High', 'Critical'] as Complexity[]).map((value) => ({ label: value, value }))} />
              <NumberField label="Delivery duration (weeks)" value={deliveryWeeks} onChange={setDeliveryWeeks} min={1} />
            </div>
          </Card>

          <Card title="Delivery economics" icon={Calculator}>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <NumberField label="Core delivery hours" value={deliveryHours} onChange={setDeliveryHours} min={0} />
              <NumberField label="Internal cost / hour" value={hourlyCost} onChange={setHourlyCost} min={0} prefix="₹" />
              <NumberField label="Delivery team members" value={teamMembers} onChange={setTeamMembers} min={1} />
              <NumberField label="Specialist hours" value={specialistHours} onChange={setSpecialistHours} min={0} />
              <NumberField label="Specialist cost / hour" value={specialistCost} onChange={setSpecialistCost} min={0} prefix="₹" />
              <NumberField label="Tools / licences" value={toolsCost} onChange={setToolsCost} min={0} prefix="₹" />
              <NumberField label="Third-party services" value={thirdPartyCost} onChange={setThirdPartyCost} min={0} prefix="₹" />
              <NumberField label="Travel and logistics" value={travelCost} onChange={setTravelCost} min={0} prefix="₹" />
              <NumberField label="Overhead allocation" value={overheadPct} onChange={setOverheadPct} min={0} max={100} suffix="%" />
            </div>
          </Card>

          <Card title="Commercial strategy" icon={Target}>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <NumberField label="Base contingency" value={contingencyPct} onChange={setContingencyPct} min={0} max={50} suffix="%" />
              <NumberField label="Target margin" value={targetMarginPct} onChange={setTargetMarginPct} min={0} max={80} suffix="%" />
              <NumberField label="Planned discount" value={discountPct} onChange={setDiscountPct} min={0} max={70} suffix="%" />
              <NumberField label="GST rate" value={gstRate} onChange={setGstRate} min={0} max={100} suffix="%" />
            </div>
          </Card>
        </section>

        <aside className="space-y-5">
          <Card title="Intelligent recommendation" icon={Sparkles}>
            <div className="rounded-2xl bg-gradient-to-br from-orange-50 to-amber-50 p-5 ring-1 ring-orange-200">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-orange-700">Recommended commercial position</p>
              <p className="mt-2 font-mono text-3xl font-black text-slate-950">{formatINR(analysis.recommended.quotedPrice)}</p>
              <p className="mt-1 text-xs text-slate-600">Quote before GST · {analysis.recommended.realizedMargin.toFixed(1)}% protected margin</p>
              <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
                <SmallStat label="Suggested sell rate" value={`${formatINR(analysis.effectiveHourlyRate)}/hr`} />
                <SmallStat label="Break-even rate" value={`${formatINR(analysis.breakEvenRate)}/hr`} />
                <SmallStat label="Monthly equivalent" value={formatINR(analysis.monthlyRetainer)} />
                <SmallStat label="Team load" value={`${analysis.weeklyLoad.toFixed(1)} hrs/week`} />
              </div>
            </div>
          </Card>

          <Card title="Pricing scenarios" icon={TrendingUp}>
            <div className="space-y-3">
              {analysis.scenarios.map((scenario, index) => (
                <div key={scenario.name} className={`rounded-xl border p-4 ${index === 1 ? 'border-orange-300 bg-orange-50' : 'border-slate-200 bg-slate-50'}`}>
                  <div className="flex items-center justify-between gap-3"><span className="text-xs font-bold text-slate-800">{scenario.name}</span><span className="font-mono text-sm font-extrabold text-slate-950">{formatINR(scenario.quotedPrice)}</span></div>
                  <div className="mt-2 flex justify-between text-[10px] text-slate-500"><span>{scenario.realizedMargin.toFixed(1)}% realized margin</span><span>{formatINR(scenario.clientTotal)} incl. GST</span></div>
                </div>
              ))}
            </div>
          </Card>

          <Card title="Adviser insights" icon={Lightbulb}>
            <div className="space-y-3">
              {analysis.recommendations.map((recommendation, index) => (
                <div key={`${recommendation.tone}-${index}`} className="flex gap-3 rounded-xl border border-slate-200 p-3">
                  {recommendation.tone === 'warning' ? <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" /> : recommendation.tone === 'positive' ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" /> : <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-sky-600" />}
                  <p className="text-xs leading-5 text-slate-600">{recommendation.text}</p>
                </div>
              ))}
            </div>
          </Card>

          <Card title="CRM evidence" icon={ShieldCheck}>
            <div className="grid grid-cols-2 gap-3">
              <SmallStat label="Evidence records" value={String(history.evidenceCount)} />
              <SmallStat label="Quotation win rate" value={history.quoteCount ? `${history.winRate.toFixed(0)}%` : 'No history'} />
              <SmallStat label="Avg. accepted quote" value={history.averageAcceptedQuote ? formatINR(history.averageAcceptedQuote) : 'No history'} />
              <SmallStat label="Avg. invoice value" value={history.averageInvoice ? formatINR(history.averageInvoice) : 'No history'} />
            </div>
          </Card>
        </aside>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-emerald-600" /><h2 className="text-sm font-bold text-slate-900">Cost composition and approval trail</h2></div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <CostPart label="Delivery labour" value={analysis.laborCost} total={analysis.trueCost} />
          <CostPart label="Direct expenses" value={analysis.directExpenses} total={analysis.trueCost} />
          <CostPart label="Allocated overhead" value={analysis.overhead} total={analysis.trueCost} />
          <CostPart label="Risk contingency" value={analysis.contingency} total={analysis.trueCost} />
          <CostPart label="True delivery cost" value={analysis.trueCost} total={analysis.trueCost} />
        </div>
      </section>
    </div>
  );
}

function Card({ title, icon: Icon, children }: { title: string; icon: React.ElementType; children: React.ReactNode }) {
  return <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="mb-4 flex items-center gap-2 border-b border-slate-100 pb-3"><Icon className="h-4 w-4 text-[#ff6600]" /><h2 className="text-sm font-bold text-slate-900">{title}</h2></div>{children}</section>;
}

function Metric({ icon: Icon, label, value, detail, tone }: { icon: React.ElementType; label: string; value: string; detail: string; tone: 'slate' | 'orange' | 'emerald' | 'amber' | 'rose' }) {
  const tones = { slate: 'bg-slate-100 text-slate-700', orange: 'bg-orange-100 text-orange-700', emerald: 'bg-emerald-100 text-emerald-700', amber: 'bg-amber-100 text-amber-700', rose: 'bg-rose-100 text-rose-700' };
  return <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><div className="flex items-center gap-3"><div className={`grid h-10 w-10 place-items-center rounded-xl ${tones[tone]}`}><Icon className="h-5 w-5" /></div><div><p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">{label}</p><p className="mt-0.5 font-mono text-lg font-extrabold text-slate-950">{value}</p></div></div><p className="mt-3 text-[11px] text-slate-500">{detail}</p></div>;
}

function NumberField({ label, value, onChange, min, max, prefix, suffix }: { label: string; value: number; onChange: (value: number) => void; min?: number; max?: number; prefix?: string; suffix?: string }) {
  return <label className="text-xs font-semibold text-slate-700">{label}<div className="relative mt-1">{prefix && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">{prefix}</span>}<input type="number" min={min} max={max} step="0.01" value={value} onChange={(event) => onChange(Number(event.target.value))} className={`h-10 w-full rounded-lg border border-slate-200 text-sm outline-none focus:border-[#ff6600] focus:ring-2 focus:ring-orange-100 ${prefix ? 'pl-7' : 'pl-3'} ${suffix ? 'pr-8' : 'pr-3'}`} />{suffix && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">{suffix}</span>}</div></label>;
}

function SelectField({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: Array<{ label: string; value: string }> }) {
  return <label className="text-xs font-semibold text-slate-700">{label}<select value={value} onChange={(event) => onChange(event.target.value)} className="mt-1 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-[#ff6600] focus:ring-2 focus:ring-orange-100">{options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>;
}

function SmallStat({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl bg-white/80 p-3 ring-1 ring-slate-200"><p className="text-[9px] font-bold uppercase tracking-wide text-slate-500">{label}</p><p className="mt-1 font-mono text-xs font-extrabold text-slate-900">{value}</p></div>;
}

function CostPart({ label, value, total }: { label: string; value: number; total: number }) {
  const share = total ? Math.min(100, value / total * 100) : 0;
  return <div className="rounded-xl bg-slate-50 p-3"><div className="flex items-center justify-between gap-2"><span className="text-[10px] font-bold uppercase text-slate-500">{label}</span><span className="font-mono text-xs font-bold text-slate-800">{formatINR(value)}</span></div><div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-200"><div className="h-full rounded-full bg-[#ff6600]" style={{ width: `${share}%` }} /></div><p className="mt-1 text-right text-[9px] text-slate-400">{share.toFixed(0)}% of cost</p></div>;
}
