import React from 'react';
import {
  LayoutDashboard,
  Users,
  Building2,
  CalendarCheck,
  GitBranch,
  FileText,
  BrainCircuit,
  Receipt,
  CreditCard,
  Headphones,
  RefreshCw,
  FolderLock,
  BarChart3,
  Sliders,
  Globe2,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  ShieldAlert
} from 'lucide-react';
import appLogo from '../assets/logo2.png';

interface SidebarProps {
  currentView: string;
  onNavigate: (view: string) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  allowedPages: string[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onNavigate,
  collapsed,
  onToggleCollapse,
  mobileOpen,
  onCloseMobile,
  allowedPages
}) => {
  const menuSections = [
    {
      heading: 'Home',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard }
      ]
    },
    {
      heading: 'Sales',
      items: [
        { id: 'leads', label: 'Leads', icon: Users },
        { id: 'customers', label: 'Companies / Customers', icon: Building2 },
        { id: 'activities', label: 'Activities', icon: CalendarCheck },
        { id: 'pipeline', label: 'Sales Pipeline', icon: GitBranch },
        { id: 'reports', label: 'My Activity & Reports', icon: BarChart3 }
      ]
    },
    {
      heading: 'Commercial',
      items: [
        { id: 'quotations', label: 'Quotations', icon: FileText },
        { id: 'costing', label: 'Costing Adviser', icon: BrainCircuit },
        { id: 'proforma', label: 'Proforma Invoices', icon: Receipt },
        { id: 'invoices', label: 'Tax Invoices', icon: Receipt },
        { id: 'payments', label: 'Payment Records', icon: CreditCard }
      ]
    },
    {
      heading: 'Customer Service',
      items: [
        { id: 'support', label: 'Support Tickets', icon: Headphones },
        { id: 'amc', label: 'AMC / Renewals', icon: RefreshCw }
      ]
    },
    {
      heading: 'Documents & Intelligence',
      items: [
        { id: 'documents', label: 'Document Repository', icon: FolderLock },
        { id: 'analytics', label: 'Analytics & Reports', icon: BarChart3 }
      ]
    },
    {
      heading: 'Administration',
      items: [
        { id: 'admin', label: 'Admin Settings', icon: Sliders },
        { id: 'org-setup', label: 'Organization Setup', icon: Building2 },
        { id: 'portal', label: 'Customer Portal', icon: Globe2 }
      ]
    }
  ];

  return (
    <aside
      className={`brand-sidebar fixed inset-y-0 left-0 z-50 flex h-dvh w-[264px] min-h-0 shrink-0 flex-col overflow-hidden border-r border-slate-200 transition-transform duration-300 select-none lg:relative lg:z-30 lg:translate-x-0 lg:h-full lg:transition-[width] ${
        mobileOpen ? 'translate-x-0' : '-translate-x-full'
      } ${collapsed ? 'lg:w-[72px]' : 'lg:w-[264px]'}`}
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-slate-200">
        {!collapsed ? (
          <button
            type="button"
            className="flex items-center gap-3 cursor-pointer text-left"
            onClick={() => {
              onNavigate('dashboard');
              onCloseMobile();
            }}
            aria-label="Go to dashboard"
          >
            <img src={appLogo} alt="TDS" className="h-9 w-9 shrink-0 object-contain" />
            <div>
              <div className="flex items-center gap-1.5">
                <span className="whitespace-nowrap text-sm font-extrabold tracking-tight text-slate-900">TDS-OS</span>
                <span className="rounded border border-[#ff5c00] bg-[#fff2e8] px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-[#ff5c00]">
                  CRM
                </span>
              </div>
              <p className="max-w-[160px] truncate text-[11px] font-medium text-slate-600">CRM workspace</p>
            </div>
          </button>
        ) : (
          <button
            type="button"
            className="flex w-full justify-center cursor-pointer"
            onClick={() => {
              onNavigate('dashboard');
              onCloseMobile();
            }}
            aria-label="Go to dashboard"
          >
            <img src={appLogo} alt="TDS" className="h-9 w-9 object-contain" />
          </button>
        )}

        {/* Collapse toggle */}
        <button
          onClick={onToggleCollapse}
          className={`hidden rounded-lg p-1.5 text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 lg:block ${
            collapsed ? 'hidden' : 'block'
          }`}
          title="Collapse Sidebar"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      </div>

      {/* Navigation Links */}
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-4 space-y-6">
        {menuSections.map((section) => ({ ...section, items: section.items.filter((item) => allowedPages.includes(item.id)) })).filter((section) => section.items.length > 0).map((section, idx) => (
          <div key={idx} className="space-y-1">
            {!collapsed && (
              <h4 className="mb-1.5 px-3 text-[10px] font-bold uppercase tracking-wider text-slate-900">
                {section.heading}
              </h4>
            )}
            {section.items.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id || (item.id === 'customers' && currentView === 'customer-360');
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  title={collapsed ? item.label : undefined}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all group relative ${
                    isActive
                      ? 'brand-sidebar-active border border-transparent font-semibold'
                      : 'border border-transparent text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 flex-shrink-0 transition-colors ${
                      isActive ? '' : 'text-slate-600 group-hover:text-slate-900'
                    }`}
                  />
                  {!collapsed && (
                    <span className="truncate flex-1 text-left">{item.label}</span>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* Workspace Footer status */}
      <div className="border-t border-slate-200 bg-white p-3">
        {!collapsed ? (
          <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-2">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <div className="flex flex-col">
                <span className="text-[11px] font-semibold text-slate-900">Organization</span>
                <span className="font-mono text-[10px] text-slate-600">Workspace ready</span>
              </div>
            </div>
            <button
              onClick={onToggleCollapse}
              className="rounded p-1 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              title="Collapse"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div className="flex justify-center">
            <button
              onClick={onToggleCollapse}
              className="rounded-lg p-2 text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
              title="Expand Sidebar"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
};
