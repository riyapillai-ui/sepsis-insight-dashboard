import { useState, useMemo } from 'react';
import {
  FEATURE_IMPORTANCE_LIST,
  MISSING_VALUE_STATS,
} from '../data/sepsisDataset';
import {
  exportFeatureImportanceToCsv,
  exportMissingnessToCsv,
} from '../utils/exportCsv';
import {
  BarChart3,
  FileSpreadsheet,
  HelpCircle,
  TrendingDown,
  Layers,
  Database,
  Search,
  Filter,
} from 'lucide-react';

export function MissingnessAblation() {
  const [activeSection, setActiveSection] = useState<'importance' | 'missingness'>('importance');
  const [importanceCategory, setImportanceCategory] = useState<string>('all');
  const [missingSearch, setMissingSearch] = useState<string>('');

  // Filtered Feature Importance
  const filteredImportance = useMemo(() => {
    return FEATURE_IMPORTANCE_LIST.filter((item) => {
      if (importanceCategory !== 'all' && item.category !== importanceCategory) {
        return false;
      }
      return true;
    });
  }, [importanceCategory]);

  // Max AUC drop for bar scaling
  const maxDrop = Math.max(...FEATURE_IMPORTANCE_LIST.map((f) => f.aucDrop));

  // Filtered Missingness
  const filteredMissingness = useMemo(() => {
    return MISSING_VALUE_STATS.filter((r) => {
      if (
        missingSearch &&
        !r.feature.toLowerCase().includes(missingSearch.toLowerCase()) &&
        !r.displayName.toLowerCase().includes(missingSearch.toLowerCase())
      ) {
        return false;
      }
      return true;
    });
  }, [missingSearch]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-sky-700 mb-1">
            <span>Model Explainability & Data Quality Audit</span>
            <span aria-hidden="true">·</span>
            <span>Ablation & Missingness</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            Feature Importance & Missing Value Analysis
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Empirical sensitivity of CNN predictions to individual physiological markers, alongside PhysioNet ICU sparsity profiles.
          </p>
        </div>

        {/* Section Tabs */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
            <button
              onClick={() => setActiveSection('importance')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                activeSection === 'importance'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Feature Importance (Ablation)
            </button>
            <button
              onClick={() => setActiveSection('missingness')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                activeSection === 'missingness'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Missing Values Analysis (36 Features)
            </button>
          </div>

          <button
            onClick={() =>
              activeSection === 'importance'
                ? exportFeatureImportanceToCsv(FEATURE_IMPORTANCE_LIST)
                : exportMissingnessToCsv(MISSING_VALUE_STATS)
            }
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-800 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-xs cursor-pointer"
            aria-label="Export active dataset to CSV"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-sky-700" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* SECTION 1: Feature Importance via Ablation */}
      {activeSection === 'importance' && (
        <div className="space-y-6">
          {/* Methodological Context Box */}
          <div className="bg-sky-50/70 p-4 rounded-xl border border-sky-200/80 text-xs text-slate-700 leading-relaxed flex items-start gap-3">
            <TrendingDown className="w-5 h-5 text-sky-700 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-sky-950">Ablation Methodology (AUC Drop): </span>
              In accordance with standard neural network sensitivity analysis, each standardized feature channel was individually masked to zero (the standardized mean) across all test sequences. The resulting drop in ROC-AUC from the baseline (0.8824) quantifies the unique predictive contribution of that variable to the CNN's temporal representation.
            </div>
          </div>

          {/* Category Filter */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-700">Filter by Domain:</span>
              <div className="flex flex-wrap gap-1">
                {['all', 'Vital Signs', 'Laboratory', 'Blood Gas', 'Demographics'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setImportanceCategory(cat)}
                    className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors cursor-pointer ${
                      importanceCategory === cat
                        ? 'bg-sky-700 text-white shadow-xs'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {cat === 'all' ? 'All 20 Features' : cat}
                  </button>
                ))}
              </div>
            </div>

            <span className="text-xs text-slate-500 font-mono">
              Baseline ROC-AUC: 0.8824
            </span>
          </div>

          {/* Visual Bar Chart of Feature Importance */}
          <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-xs">
            <h3 className="text-base font-semibold text-slate-900 mb-1">
              Top Clinical Features Ranked by CNN Ablation Importance
            </h3>
            <p className="text-xs text-slate-500 mb-6">
              Decrease in ROC-AUC when feature values are masked to 0.0 in the test sequences.
            </p>

            <div className="space-y-3.5">
              {filteredImportance.map((item, idx) => {
                const barPct = (item.aucDrop / maxDrop) * 100;
                return (
                  <div key={item.feature} className="group">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-slate-400 text-[11px] w-5">
                          {idx + 1 < 10 ? `0${idx + 1}` : idx + 1}.
                        </span>
                        <span className="font-bold text-slate-900 font-mono">
                          {item.feature}
                        </span>
                        <span className="text-slate-600">
                          {item.displayName}
                        </span>
                        <span className="text-slate-300">·</span>
                        <span className="text-slate-500 text-[11px]">
                          {item.category}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 font-mono text-[11px]">
                        <span className="text-slate-500">
                          Masked AUC: {item.maskedAuc.toFixed(4)}
                        </span>
                        <span className="font-bold text-orange-700">
                          -{(item.aucDrop).toFixed(4)} drop
                        </span>
                      </div>
                    </div>

                    {/* Bar and Progress */}
                    <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden flex items-center">
                      <div
                        className="h-full rounded-full transition-all duration-300 bg-sky-600 group-hover:bg-sky-700"
                        style={{ width: `${barPct}%` }}
                      />
                    </div>

                    <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
                      <span>Normal Range: {item.normalRange}</span>
                      <span>Missingness in Dataset: {item.missingPct}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* SECTION 2: Missing Values Analysis */}
      {activeSection === 'missingness' && (
        <div className="space-y-6">
          {/* Methodological Context Box */}
          <div className="bg-amber-50/70 p-4 rounded-xl border border-amber-200 text-xs text-slate-700 leading-relaxed flex items-start gap-3">
            <Database className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-amber-950">ICU Missingness Reality & Imputation Strategy: </span>
              In real-world ICU care, vital signs (HR, SBP, Resp) are measured continuously by bedside monitors (~90% completeness), whereas laboratory tests (Lactate, Fibrinogen, Blood Gases) are ordered intermittently on clinical indication (70–93% missingness). In the pipeline, values were forward-filled and backward-filled within each patient's stay, with remaining unmeasured features imputed to zero prior to standard scaling.
            </div>
          </div>

          {/* Search Box */}
          <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search feature (e.g. Lactate, WBC, Temp)..."
                value={missingSearch}
                onChange={(e) => setMissingSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-sky-600 bg-slate-50/50"
              />
            </div>
            <div className="text-xs text-slate-500">
              Showing <strong className="text-slate-900 font-mono">{filteredMissingness.length}</strong> of 36 clinical features
            </div>
          </div>

          {/* Missing Values Table with Inline Micro-bars */}
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 border-b border-slate-200/80 text-slate-600 uppercase tracking-wider text-[11px] font-semibold">
                  <tr>
                    <th className="px-4 py-3">Feature Identifier</th>
                    <th className="px-4 py-3">Clinical Description</th>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3 text-right">Missingness (%)</th>
                    <th className="px-4 py-3 w-48">Missingness Visual</th>
                    <th className="px-4 py-3 text-right">Recorded Observations</th>
                    <th className="px-4 py-3">Imputation Method</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredMissingness.map((stat) => {
                    const isSevere = stat.missingPercent >= 80;
                    const isModerate = stat.missingPercent >= 40 && stat.missingPercent < 80;

                    return (
                      <tr key={stat.feature} className="hover:bg-slate-50/60 transition-colors">
                        <td className="px-4 py-3 font-mono font-bold text-slate-900">
                          {stat.feature}
                        </td>
                        <td className="px-4 py-3 text-slate-700">
                          {stat.displayName}
                        </td>
                        <td className="px-4 py-3 text-slate-500">
                          {stat.category}
                        </td>
                        <td className="px-4 py-3 font-mono tabular-nums text-right font-bold">
                          <span
                            className={
                              isSevere
                                ? 'text-red-700'
                                : isModerate
                                ? 'text-amber-700'
                                : 'text-emerald-700'
                            }
                          >
                            {stat.missingPercent.toFixed(1)}%
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                isSevere
                                  ? 'bg-red-500'
                                  : isModerate
                                  ? 'bg-amber-500'
                                  : 'bg-emerald-500'
                              }`}
                              style={{ width: `${stat.missingPercent}%` }}
                            />
                          </div>
                        </td>
                        <td className="px-4 py-3 font-mono tabular-nums text-right text-slate-600">
                          {stat.recordedCount.toLocaleString()} / {stat.totalObservations.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-slate-500 text-[11px]">
                          {stat.imputationStrategy}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
