import React, { useState } from 'react';
import {
  X,
  User,
  Building,
  Mail,
  Phone,
  IndianRupee,
  Calendar,
  Briefcase,
  Sparkles,
  FileText
} from 'lucide-react';
import type { Lead } from '../types/crm';

interface NewLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (lead: Partial<Lead>) => void;
}

export const NewLeadModal: React.FC<NewLeadModalProps> = ({
  isOpen,
  onClose,
  onSubmit
}) => {
  const [formData, setFormData] = useState({
    name: '',
    company: '',
    designation: '',
    mobile: '',
    whatsapp: '',
    email: '',
    website: '',
    source: 'Google Ads' as Lead['source'],
    campaign: '',
    requirement: '',
    serviceInterest: '',
    estimatedBudget: 50000,
    priority: 'High' as Lead['priority'],
    leadOwner: '',
    nextFollowUpDate: new Date().toISOString().split('T')[0],
    nextFollowUpTime: '11:00 AM',
    notes: ''
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const requiredValues = [
      formData.name.trim(),
      formData.company.trim(),
      formData.mobile.trim(),
      formData.source.trim()
    ];

    if (requiredValues.some((value) => value.length === 0)) {
      return;
    }

    const newId = `LD-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`;
    onSubmit({
      id: newId,
      name: formData.name.trim(),
      company: formData.company.trim(),
      designation: formData.designation.trim(),
      phone: formData.mobile.trim(),
      whatsapp: formData.whatsapp.trim() || formData.mobile.trim(),
      email: formData.email.trim(),
      website: formData.website.trim(),
      source: formData.source,
      campaign: formData.campaign.trim() || 'Inbound Direct Campaign',
      requirement: formData.requirement.trim(),
      interestedService: formData.serviceInterest.trim(),
      estimatedBudget: Number(formData.estimatedBudget),
      priority: formData.priority,
      leadOwner: formData.leadOwner.trim(),
      status: 'New',
      createdDate: new Date().toISOString().split('T')[0],
      nextFollowUp: formData.nextFollowUpDate,
      nextFollowUpTime: formData.nextFollowUpTime,
      notes: formData.notes.trim() ? [formData.notes.trim()] : ['Lead record created via Quick Form.']
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#111827] border border-slate-700 rounded-2xl max-w-3xl w-full p-6 shadow-2xl my-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <h2 className="text-base font-extrabold text-white flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse" />
              Capture New Enterprise Lead
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Enter customer requirement, contact coordinates, commercial scope, and assignment
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Multi-section Form */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-6 text-xs max-h-[75vh] overflow-y-auto pr-2">
          {/* Section 1: Basic & Contact Information */}
          <div>
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-indigo-400 mb-3 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" /> 1. Contact & Key Stakeholder Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-300 block mb-1">
                  Lead / Contact Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Full name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700/80 rounded-xl p-2.5 text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-slate-300 block mb-1">
                  Designation / Role
                </label>
                <input
                  type="text"
                  placeholder="Job title"
                  value={formData.designation}
                  onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700/80 rounded-xl p-2.5 text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-slate-300 block mb-1">
                  Official Email
                </label>
                <input
                  type="email"
                  placeholder="name@company.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700/80 rounded-xl p-2.5 text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-slate-300 block mb-1">
                  Mobile / Phone *
                </label>
                <input
                  type="text"
                  required
                  placeholder="+91 98450 12890"
                  value={formData.mobile}
                  onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700/80 rounded-xl p-2.5 text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-slate-300 block mb-1">
                  WhatsApp Number
                </label>
                <input
                  type="text"
                  placeholder="+91 98450 12890"
                  value={formData.whatsapp}
                  onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700/80 rounded-xl p-2.5 text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-slate-300 block mb-1">
                  Company Website
                </label>
                <input
                  type="text"
                  placeholder="https://company.io"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700/80 rounded-xl p-2.5 text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Company & Source */}
          <div className="pt-3 border-t border-slate-800">
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-cyan-400 mb-3 flex items-center gap-1.5">
              <Building className="w-3.5 h-3.5" /> 2. Company & Acquisition Source
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-300 block mb-1">
                  Company Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Company name"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700/80 rounded-xl p-2.5 text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-slate-300 block mb-1">
                  Lead Acquisition Source *
                </label>
                <select
                  required
                  value={formData.source}
                  onChange={(e) => setFormData({ ...formData, source: e.target.value as Lead['source'] })}
                  className="w-full bg-slate-900 border border-slate-700/80 rounded-xl p-2.5 text-white"
                >
                  <option value="Google Ads">Google Ads</option>
                  <option value="Website">Inbound Website Form</option>
                  <option value="Referral">Client / Partner Referral</option>
                  <option value="Meta Ads">Meta Ads</option>
                  <option value="Instagram">Instagram</option>
                  <option value="Direct">Direct / Keynote Outreach</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-slate-300 block mb-1">
                  Campaign / Inbound Tag
                </label>
                <input
                  type="text"
                  placeholder="Campaign name"
                  value={formData.campaign}
                  onChange={(e) => setFormData({ ...formData, campaign: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700/80 rounded-xl p-2.5 text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Requirement & Commercial Scope */}
          <div className="pt-3 border-t border-slate-800">
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 mb-3 flex items-center gap-1.5">
              <Briefcase className="w-3.5 h-3.5" /> 3. IT Requirement & Commercial Scope
            </h3>
            <div className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-300 block mb-1">
                    Interested IT Service Master
                  </label>
                  <input
                    type="text"
                    value={formData.serviceInterest}
                    onChange={(e) => setFormData({ ...formData, serviceInterest: e.target.value })}
                    placeholder="Interested service"
                    className="w-full bg-slate-900 border border-slate-700/80 rounded-xl p-2.5 text-white"
                  />
                </div>

                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-300 block mb-1">
                    Estimated Budget (INR) *
                  </label>
                  <div className="relative">
                    <IndianRupee className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="number"
                      required
                      value={formData.estimatedBudget}
                      onChange={(e) => setFormData({ ...formData, estimatedBudget: Number(e.target.value) })}
                      className="w-full pl-8 pr-3 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-white font-mono"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-slate-300 block mb-1">
                  Scope / Requirement Notes
                </label>
                <textarea
                  rows={3}
                  placeholder="Detail client's architectural pain points, technology stack requirements, milestone expectations..."
                  value={formData.requirement}
                  onChange={(e) => setFormData({ ...formData, requirement: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700/80 rounded-xl p-2.5 text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Assignment & First Follow-up */}
          <div className="pt-3 border-t border-slate-800">
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-amber-400 mb-3 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" /> 4. Assignment & Next Follow-up Schedule
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3.5">
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-300 block mb-1">
                  Assign Lead Owner
                </label>
                <input
                  type="text"
                  value={formData.leadOwner}
                  onChange={(e) => setFormData({ ...formData, leadOwner: e.target.value })}
                  placeholder="Owner name"
                  className="w-full bg-slate-900 border border-slate-700/80 rounded-xl p-2.5 text-white"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-slate-300 block mb-1">
                  Lead Priority
                </label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value as Lead['priority'] })}
                  className="w-full bg-slate-900 border border-slate-700/80 rounded-xl p-2.5 text-white"
                >
                  <option value="Urgent">Urgent (24h SLA)</option>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-slate-300 block mb-1">
                  Next Follow-up Date
                </label>
                <input
                  type="date"
                  value={formData.nextFollowUpDate}
                  onChange={(e) => setFormData({ ...formData, nextFollowUpDate: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700/80 rounded-xl p-2.5 text-white"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-slate-300 block mb-1">
                  Follow-up Time
                </label>
                <input
                  type="text"
                  placeholder="11:00 AM"
                  value={formData.nextFollowUpTime}
                  onChange={(e) => setFormData({ ...formData, nextFollowUpTime: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700/80 rounded-xl p-2.5 text-white"
                />
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3 sticky bottom-0 bg-[#111827] py-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-bold shadow-lg shadow-indigo-600/30 cursor-pointer"
            >
              Save & Create Lead
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
