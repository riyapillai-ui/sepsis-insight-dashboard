import { useState } from 'react';
import {
  PatientRecord,
} from '../types/sepsis';
import {
  exportPatientsToCsv,
  exportTelemetryToCsv,
  exportFeatureImportanceToCsv,
  exportMissingnessToCsv,
  exportTrainingHistoryToCsv,
} from '../utils/exportCsv';
import {
  FEATURE_IMPORTANCE_LIST,
  MISSING_VALUE_STATS,
  TRAINING_HISTORY,
} from '../data/sepsisDataset';
import {
  X,
  Download,
  FileSpreadsheet,
  CheckCircle2,
  Database,
  Layers,
  Heart,
  Users,
} from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  patients: PatientRecord[];
  selectedPatientId: string;
}

export function ExportModal({
  isOpen,
  onClose,
  patients,
  selectedPatientId,
}: ExportModalProps) {
  if (!isOpen) return null;

  const currentPatient =
    patients.find((p) => p.patientId === selectedPatientId) || patients[0];

  const exportOptions = [
    {
      id: 'cohort',
      title: 'ICU Patient Cohort Summary',
      description: 'Patient demographics, stay lengths, verified sepsis onset hours, and peak/latest CNN risk scores.',
      icon: Users,
      action: () => exportPatientsToCsv(patients),
      fileSize: '~4 KB',
    },
    {
      id: 'telemetry_current',
      title: `Hourly Telemetry for ${currentPatient.patientId}`,
      description: `Complete hourly record of all vitals, lab markers, and sliding-window CNN predictions across ${currentPatient.iculos} hours.`,
      icon: Heart,
      action: () => exportTelemetryToCsv(currentPatient),
      fileSize: '~8 KB',
    },
    {
      id: 'importance',
      title: 'Feature Importance (Ablation AUC Drop)',
      description: 'Direct export matching sepsis_feature_importance.csv with baseline ROC-AUC (0.8824), masked AUC, and drop ranking.',
      icon: Layers,
      action: () => exportFeatureImportanceToCsv(FEATURE_IMPORTANCE_LIST),
      fileSize: '~3 KB',
    },
    {
      id: 'missingness',
      title: 'PhysioNet Missingness Audit',
      description: 'Sparsity percentages and imputation strategies across all 36 clinical features in the 2019 challenge dataset.',
      icon: Database,
      action: () => exportMissingnessToCsv(MISSING_VALUE_STATS),
      fileSize: '~4 KB',
    },
    {
      id: 'training',
      title: 'CNN 26-Epoch Training Logs',
      description: 'Training and validation Loss, ROC-AUC, PR-AUC, and learning rate progression across all epochs.',
      icon: FileSpreadsheet,
      action: () => exportTrainingHistoryToCsv(TRAINING_HISTORY),
      fileSize: '~3 KB',
    },
  ];

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="export-modal-title"
    >
      <div className="bg-white rounded-2xl max-w-xl w-full border border-slate-200 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-sky-50 text-sky-700">
              <Download className="w-4 h-4" />
            </span>
            <div>
              <h2 id="export-modal-title" className="text-base font-bold text-slate-900">
                Export Dataset & Metrics
              </h2>
              <p className="text-xs text-slate-500">
                Standard RFC 4180 CSV files generated directly from actual dataset values.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Close export dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-3 max-h-[70vh] overflow-y-auto">
          {exportOptions.map((opt) => {
            const IconComponent = opt.icon;
            return (
              <div
                key={opt.id}
                className="p-3.5 rounded-xl border border-slate-200/80 hover:border-sky-300 hover:bg-sky-50/30 transition-all flex items-center justify-between gap-4 group"
              >
                <div className="flex items-start gap-3">
                  <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-slate-50 text-slate-600 group-hover:bg-sky-100 group-hover:text-sky-700 shrink-0 mt-0.5 transition-colors">
                    <IconComponent className="w-4 h-4" />
                  </span>
                  <div>
                    <div className="text-xs font-semibold text-slate-900 flex items-center gap-2">
                      <span>{opt.title}</span>
                      <span className="text-[10px] font-mono text-slate-400 font-normal">
                        {opt.fileSize}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                      {opt.description}
                    </p>
                  </div>
                </div>

                <button
                  onClick={opt.action}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-sky-700 bg-sky-50 hover:bg-sky-600 hover:text-white rounded-lg transition-colors shrink-0 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </button>
              </div>
            );
          })}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>All exports reflect verified PhysioNet benchmark values.</span>
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 font-medium text-slate-700 hover:text-slate-900 cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
