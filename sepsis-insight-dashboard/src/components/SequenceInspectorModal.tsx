import { useState } from 'react';
import { PatientRecord, HourlyVitalRecord } from '../types/sepsis';
import { X, Layers, Cpu, ArrowRight, Activity, Clock } from 'lucide-react';

interface SequenceInspectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: PatientRecord;
  endHour: number;
}

export function SequenceInspectorModal({
  isOpen,
  onClose,
  patient,
  endHour,
}: SequenceInspectorModalProps) {
  if (!isOpen) return null;

  // Window bounds
  const startHour = Math.max(1, endHour - 5);
  const sequenceRecords = patient.vitals.filter(
    (v) => v.hour >= startHour && v.hour <= endHour
  );

  const targetRecord = patient.vitals.find((v) => v.hour === endHour);
  const predictedRisk = targetRecord ? targetRecord.predictedRisk : 0.0;

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="seq-modal-title"
    >
      <div className="bg-white rounded-2xl max-w-3xl w-full border border-slate-200 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-sky-50 text-sky-700">
              <Layers className="w-4 h-4" />
            </span>
            <div>
              <h2 id="seq-modal-title" className="text-base font-bold text-slate-900">
                6-Hour Temporal Sequence Inspector
              </h2>
              <p className="text-xs text-slate-500">
                Patient {patient.patientId} · ICU Hours {startHour} to {endHour} (Window Length = 6)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Close sequence inspector modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Summary Banner */}
          <div className="bg-sky-50 p-4 rounded-xl border border-sky-100 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div>
              <div className="font-semibold text-sky-950">
                1D-CNN Sequence Input Matrix Shape: (6, 36)
              </div>
              <p className="text-slate-600 mt-0.5">
                Target: Forecast any sepsis onset between Hour {endHour + 1} and Hour {endHour + 6}.
              </p>
            </div>

            <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-sky-200">
              <span className="text-xs text-slate-500">Window Risk:</span>
              <span
                className={`text-base font-mono font-bold ${
                  predictedRisk >= 0.75
                    ? 'text-red-700'
                    : predictedRisk >= 0.50
                    ? 'text-orange-700'
                    : 'text-sky-700'
                }`}
              >
                {(predictedRisk * 100).toFixed(1)}%
              </span>
            </div>
          </div>

          {/* Matrix Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-[11px]">
                <tr>
                  <th className="px-3 py-2.5">ICU Hour</th>
                  <th className="px-3 py-2.5 text-right">HR (bpm)</th>
                  <th className="px-3 py-2.5 text-right">MAP (mmHg)</th>
                  <th className="px-3 py-2.5 text-right">Resp (/min)</th>
                  <th className="px-3 py-2.5 text-right">Temp (°C)</th>
                  <th className="px-3 py-2.5 text-right">Lactate (mg/dL)</th>
                  <th className="px-3 py-2.5 text-right">WBC (10³/µL)</th>
                  <th className="px-3 py-2.5 text-right">SpO2 (%)</th>
                  <th className="px-3 py-2.5 text-right">Risk Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-[11.5px]">
                {sequenceRecords.map((rec) => (
                  <tr
                    key={rec.hour}
                    className={
                      rec.hour === endHour
                        ? 'bg-sky-50/60 font-semibold'
                        : 'hover:bg-slate-50/50'
                    }
                  >
                    <td className="px-3 py-2 text-slate-900 font-bold">
                      H{rec.hour} {rec.hour === endHour ? '(Latest)' : ''}
                    </td>
                    <td className="px-3 py-2 text-right text-slate-700">
                      {rec.hr ?? 'ffill'}
                    </td>
                    <td className="px-3 py-2 text-right text-slate-700">
                      {rec.map ?? 'ffill'}
                    </td>
                    <td className="px-3 py-2 text-right text-slate-700">
                      {rec.resp ?? 'ffill'}
                    </td>
                    <td className="px-3 py-2 text-right text-slate-700">
                      {rec.temp ?? 'ffill'}
                    </td>
                    <td className="px-3 py-2 text-right text-purple-700">
                      {rec.lactate ?? 'ffill'}
                    </td>
                    <td className="px-3 py-2 text-right text-slate-700">
                      {rec.wbc ?? 'ffill'}
                    </td>
                    <td className="px-3 py-2 text-right text-slate-700">
                      {rec.o2sat ?? 'ffill'}%
                    </td>
                    <td className="px-3 py-2 text-right text-sky-700 font-bold">
                      {(rec.predictedRisk * 100).toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Model Processing Steps Flow */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 text-xs text-slate-600 space-y-2">
            <div className="font-semibold text-slate-900 flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-sky-700" />
              <span>Inference Pipeline Steps for this Window:</span>
            </div>
            <ol className="list-decimal pl-4 space-y-1 text-[11.5px]">
              <li>
                <strong>Patient Imputation:</strong> Forward-filled from previous valid observations (or backfilled from subsequent measurements).
              </li>
              <li>
                <strong>Zero Imputation:</strong> Any variables with no measurements during stay replaced with zero (e.g. specialized enzyme labs).
              </li>
              <li>
                <strong>Z-Score Normalization:</strong> Scaled via <code className="bg-white px-1 py-0.5 rounded border border-slate-200 text-slate-800">StandardScaler(mean, scale)</code>.
              </li>
              <li>
                <strong>1D CNN Convolution:</strong> Filtered by Conv1D(64, kernel=3) and Conv1D(128, kernel=3) with GlobalAveragePooling1D.
              </li>
              <li>
                <strong>Sigmoid Projection:</strong> Dense(64) into Sigmoid probability output: <strong className="text-slate-900 font-mono">{(predictedRisk).toFixed(4)}</strong>.
              </li>
            </ol>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>Non-diagnostic experimental research visualization.</span>
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
