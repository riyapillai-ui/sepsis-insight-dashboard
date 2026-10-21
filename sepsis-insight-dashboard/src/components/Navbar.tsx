import { Activity, Download, Database } from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onOpenExportModal: () => void;
  totalPatientsCount: number;
}

export function Navbar({ activeTab, onTabChange, onOpenExportModal, totalPatientsCount }: NavbarProps) {
  const navItems = [
    { id: 'overview', label: 'Overview' },
    { id: 'cohorts', label: `Cohort (${totalPatientsCount.toLocaleString()})` },
    { id: 'trends', label: 'Vital Trends' },
    { id: 'ingest', label: 'Ingest 20k Files' },
    { id: 'metrics', label: 'Model Metrics' },
    { id: 'ablation', label: 'Ablation & Missingness' },
  ];

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between gap-8 h-16">
          {/* Zone 1: Single text element wordmark */}
          <a
            href="#overview"
            onClick={(e) => {
              e.preventDefault();
              onTabChange('overview');
            }}
            className="flex items-center gap-2.5 text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0 hover:text-sky-700 transition-colors"
          >
            <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-sky-600 text-white shadow-xs">
              <Activity className="w-5 h-5" aria-hidden="true" />
            </span>
            <span>SepsisPulse ICU</span>
          </a>

          {/* Zone 2: 4–5 clean single-line text navigation links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onTabChange(item.id)}
                  className={`relative py-1.5 whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                    isActive
                      ? 'text-sky-700 font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {item.label}
                  {isActive && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-sky-600 rounded-full" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: 1 primary action */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={onOpenExportModal}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-sky-700 rounded-lg hover:bg-sky-800 active:bg-sky-900 transition-colors shadow-xs whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-sky-600"
              aria-label="Export dataset and model reports to CSV"
            >
              <Download className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Mobile Navigation bar */}
        <div className="flex md:hidden overflow-x-auto gap-3 py-2 border-t border-slate-100 text-xs no-scrollbar">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`px-2.5 py-1 rounded-md whitespace-nowrap shrink-0 transition-colors ${
                  isActive
                    ? 'bg-sky-50 text-sky-700 font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
}
