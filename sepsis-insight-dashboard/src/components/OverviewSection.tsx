import { useState } from 'react';
import { PatientRecord } from '../types/sepsis';
import {
  MODEL_METRICS_SUMMARY,
  RISK_DISTRIBUTION_BINS,
  CNN_MODEL_METADATA,
} from '../data/sepsisDataset';
import {
  Users,
  AlertCircle,
  Clock,
  LineChart,
  ArrowRight,
  Sparkles,
  Info,
  Sliders,
  CheckCircle2,
  Layers,
} from 'lucide-react';

interface OverviewSectionProps {
  patients: PatientRecord[];
  onSelectPatient: (patientId: string) => void;
  onNavigateTab: (tab: string) => void;
}

export function OverviewSection({
  patients,
  onSelectPatient,
  onNavigateTab,
}: OverviewSectionProps) {
  const [threshold, setThreshold] = useState<number>(0.50);
  const [hoveredBin, setHoveredBin] = useState<string | null>(null);

  // Compute live statistics from the loaded patient cohort
  const totalPatients = patients.length;
  const sepsisPatients = patients.filter((p) => p.sepsisDeveloped);
  const nonSepsisPatients = patients.filter((p) => !p.sepsisDeveloped);
  const sepsisRate = ((sepsisPatients.length / totalPatients) * 100).toFixed(1);
  const avgStayHours = (
    patients.reduce((acc, p) => acc + p.iculos, 0) / totalPatients
  ).toFixed(1);

  // High risk patients above current threshold
  const alertPatients = patients.filter((p) => p.maxRiskScore >= threshold);

  // Max count in histogram for scaling
  const maxBinCount = Math.max(...RISK_DISTRIBUTION_BINS.map((b) => b.count));

  return (
    <div className="space-y-8">
      {/* Editorial Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-sky-700 mb-1">
          <span>Clinical Telemetry & Deep Learning Pipeline</span>
          <span aria-hidden="true">·</span>
          <span>PhysioNet / CinC 2019 Benchmark</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 text-balance">
          CNN-Based Early Sepsis Prediction in ICU Patients
        </h1>
        <p className="mt-2 text-sm text-slate-600 max-w-3xl leading-relaxed">
          Temporal deep learning architecture trained on high-frequency ICU physiological sequences. Evaluates 6-hour sliding clinical trajectories to forecast future sepsis onset 1 to 6 hours prior to clinical diagnosis, enabling timely antimicrobial and fluid resuscitation.
        </p>
      </div>

      {/* KPI Metric Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Cohort Admissions */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-3">
            <span className="text-xs font-medium uppercase tracking-wider">ICU Admissions</span>
            <Users className="w-4 h-4 text-sky-600" aria-hidden="true" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono tabular-nums text-slate-900">
              {totalPatients.toLocaleString()}
            </span>
            <span className="text-xs text-slate-500">patients</span>
          </div>
          <div className="mt-2 text-xs text-slate-500 flex items-center gap-2">
            <span>MICU: {patients.filter((p) => p.unit === 'MICU').length.toLocaleString()}</span>
            <span aria-hidden="true">·</span>
            <span>SICU: {patients.filter((p) => p.unit === 'SICU').length.toLocaleString()}</span>
          </div>
        </div>

        {/* Metric 2: Sepsis Prevalence */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-3">
            <span className="text-xs font-medium uppercase tracking-wider">Sepsis Onset Rate</span>
            <AlertCircle className="w-4 h-4 text-amber-600" aria-hidden="true" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono tabular-nums text-slate-900">
              {sepsisRate}%
            </span>
            <span className="text-xs text-slate-500 font-mono tabular-nums">
              ({sepsisPatients.length.toLocaleString()} / {totalPatients.toLocaleString()})
            </span>
          </div>
          <div className="mt-2 text-xs text-slate-500">
            Ground-truth SepsisLabel positive
          </div>
        </div>

        {/* Metric 3: Early Warning Window */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-3">
            <span className="text-xs font-medium uppercase tracking-wider">Early Warning Horizon</span>
            <Clock className="w-4 h-4 text-sky-600" aria-hidden="true" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono tabular-nums text-slate-900">
              1 – 6
            </span>
            <span className="text-xs text-slate-500">hours ahead</span>
          </div>
          <div className="mt-2 text-xs text-slate-500">
            6h sliding window input sequence
          </div>
        </div>

        {/* Metric 4: Test ROC-AUC */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-3">
            <span className="text-xs font-medium uppercase tracking-wider">Test ROC-AUC</span>
            <LineChart className="w-4 h-4 text-emerald-600" aria-hidden="true" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono tabular-nums text-emerald-700">
              {MODEL_METRICS_SUMMARY.rocAuc.toFixed(3)}
            </span>
            <span className="text-xs text-slate-500">PR-AUC: {MODEL_METRICS_SUMMARY.prAuc.toFixed(3)}</span>
          </div>
          <div className="mt-2 text-xs text-slate-500 font-mono tabular-nums">
            N = 5,200 test sequences
          </div>
        </div>
      </div>

      {/* Main Grid: Risk Distribution + Interactive Threshold Explorer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column (8 cols): Risk Distribution Histogram */}
        <div className="lg:col-span-8 bg-white p-6 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                Predicted Risk Score Distribution across ICU Sequences
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Distribution of 5,200 test sequences evaluated by the 1D-CNN. Drag threshold slider to adjust decision boundary.
              </p>
            </div>

            {/* Threshold indicator */}
            <div className="flex items-center gap-3 bg-sky-50 px-3 py-1.5 rounded-lg border border-sky-100">
              <span className="text-xs font-medium text-sky-950">Active Threshold:</span>
              <span className="text-sm font-bold font-mono text-sky-700">
                {threshold.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Interactive Threshold Slider */}
          <div className="mb-6 bg-slate-50 p-3.5 rounded-lg border border-slate-200/60">
            <div className="flex items-center justify-between text-xs text-slate-600 mb-2">
              <div className="flex items-center gap-1.5 font-medium">
                <Sliders className="w-3.5 h-3.5 text-slate-500" />
                <span>Adjust Classification Cutoff Threshold</span>
              </div>
              <span className="font-mono text-slate-500">
                Default: 0.50 (Class Balanced)
              </span>
            </div>
            <input
              type="range"
              min="0.10"
              max="0.90"
              step="0.05"
              value={threshold}
              onChange={(e) => setThreshold(parseFloat(e.target.value))}
              className="w-full accent-sky-700 h-2 bg-slate-200 rounded-lg cursor-pointer"
              aria-label="Adjust classification cutoff threshold"
            />
            <div className="flex justify-between text-[11px] font-mono text-slate-400 mt-1">
              <span>0.10 (High Sensitivity)</span>
              <span>0.50 (Balanced)</span>
              <span>0.90 (High Specificity)</span>
            </div>
          </div>

          {/* Accessible SVG Bar Chart */}
          <div className="relative">
            <svg
              className="w-full h-64 overflow-visible"
              viewBox="0 0 600 240"
              preserveAspectRatio="none"
              role="img"
              aria-label="Risk score distribution histogram across ICU sequences"
            >
              {/* Horizontal gridlines */}
              {[0, 600, 1200, 1800, 2400, 3000].map((val) => {
                const y = 200 - (val / 3000) * 180;
                return (
                  <g key={val}>
                    <line
                      x1="40"
                      y1={y}
                      x2="590"
                      y2={y}
                      stroke="#E2E8F0"
                      strokeDasharray="4 4"
                      strokeWidth="1"
                    />
                    <text
                      x="32"
                      y={y + 3}
                      textAnchor="end"
                      className="text-[10px] fill-slate-400 font-mono"
                    >
                      {val}
                    </text>
                  </g>
                );
              })}

              {/* Bars */}
              {RISK_DISTRIBUTION_BINS.map((b, idx) => {
                const barWidth = 46;
                const gap = 9;
                const x = 45 + idx * (barWidth + gap);
                const height = (b.count / 3000) * 180;
                const y = 200 - height;
                const binMid = idx * 0.1 + 0.05;
                const isAboveThreshold = binMid >= threshold;
                const isHovered = hoveredBin === b.bin;

                return (
                  <g
                    key={b.bin}
                    onMouseEnter={() => setHoveredBin(b.bin)}
                    onMouseLeave={() => setHoveredBin(null)}
                    className="cursor-pointer transition-opacity"
                  >
                    <rect
                      x={x}
                      y={y}
                      width={barWidth}
                      height={height}
                      rx="4"
                      fill={
                        isAboveThreshold
                          ? isHovered
                            ? '#C2410C'
                            : '#EA580C'
                          : isHovered
                          ? '#0369A1'
                          : '#0284C7'
                      }
                      fillOpacity={isHovered ? 1 : 0.88}
                      className="transition-all duration-150"
                    />
                    {/* Value label on top of bar */}
                    <text
                      x={x + barWidth / 2}
                      y={y - 5}
                      textAnchor="middle"
                      className="text-[10px] font-mono fill-slate-600 font-medium"
                    >
                      {b.count}
                    </text>
                    {/* X-axis label */}
                    <text
                      x={x + barWidth / 2}
                      y="218"
                      textAnchor="middle"
                      className="text-[9.5px] font-mono fill-slate-500"
                    >
                      {idx === 0 ? '0-.1' : idx === 9 ? '.9-1' : `.${idx}`}
                    </text>
                  </g>
                );
              })}

              {/* Threshold Vertical Line Indicator */}
              {(() => {
                // Map threshold (0.1 to 0.9) to SVG x coordinate
                // Range from x=45 (0.0) to x=45 + 10*(46+9) = 595 (1.0)
                const lineX = 45 + threshold * (10 * 55);
                return (
                  <g>
                    <line
                      x1={lineX}
                      y1="10"
                      x2={lineX}
                      y2="202"
                      stroke="#DC2626"
                      strokeWidth="2"
                      strokeDasharray="4 2"
                    />
                    <circle cx={lineX} cy="10" r="4" fill="#DC2626" />
                    <text
                      x={lineX}
                      y="6"
                      textAnchor="middle"
                      className="text-[9.5px] font-bold font-mono fill-red-700"
                    >
                      Cutoff ({threshold.toFixed(2)})
                    </text>
                  </g>
                );
              })()}
            </svg>

            {/* Legend & Summary */}
            <div className="flex flex-wrap items-center justify-between text-xs text-slate-600 mt-4 pt-3 border-t border-slate-100">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-sky-600" />
                  <span>Predicted Non-Sepsis (&lt; Cutoff)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-orange-600" />
                  <span>Predicted Sepsis Alert (≥ Cutoff)</span>
                </div>
              </div>
              <div className="text-[11px] text-slate-500">
                {alertPatients.length} of {totalPatients} sample patients currently flagged
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (4 cols): CNN Early Detection Mechanism & Quick Patient Triage */}
        <div className="lg:col-span-4 space-y-6">
          {/* Triage Alert Card */}
          <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
            <h3 className="text-sm font-semibold text-slate-900 flex items-center justify-between">
              <span>Patient Triage at Cutoff {threshold.toFixed(2)}</span>
              <span className="text-xs font-mono font-medium text-slate-500">
                {alertPatients.length} / {totalPatients}
              </span>
            </h3>

            <p className="text-xs text-slate-500 mt-1 mb-3">
              Patients with maximum CNN sequence risk score reaching or exceeding current cutoff.
            </p>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {alertPatients.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-400 bg-slate-50 rounded-lg">
                  No patients exceed cutoff {threshold.toFixed(2)}
                </div>
              ) : (
                alertPatients.map((p) => (
                  <button
                    key={p.patientId}
                    onClick={() => {
                      onSelectPatient(p.patientId);
                      onNavigateTab('trends');
                    }}
                    className="w-full text-left p-2.5 rounded-lg border border-slate-100 hover:border-sky-300 hover:bg-sky-50/50 transition-colors flex items-center justify-between group cursor-pointer"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold font-mono text-slate-800">
                          {p.patientId}
                        </span>
                        <span className="text-[11px] text-slate-500">
                          {p.unit} · {p.age}y
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {p.sepsisDeveloped ? (
                          <span className="text-red-700 font-medium">
                            Onset Hour {p.sepsisOnsetHour}
                          </span>
                        ) : (
                          <span className="text-slate-500">Non-sepsis stay</span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-bold font-mono text-orange-700">
                        {(p.maxRiskScore * 100).toFixed(0)}%
                      </div>
                      <div className="text-[10px] text-sky-700 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5 justify-end">
                        <span>View Vitals</span>
                        <ArrowRight className="w-2.5 h-2.5" />
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>

            <div className="grid grid-cols-2 gap-2 mt-4">
              <button
                onClick={() => onNavigateTab('cohorts')}
                className="py-2 px-3 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>Cohort ({totalPatients.toLocaleString()})</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => onNavigateTab('ingest')}
                className="py-2 px-3 text-xs font-semibold text-sky-800 bg-sky-50 hover:bg-sky-100 rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>Ingest 20k Files</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* CNN Detection Paradigm */}
          <div className="bg-sky-50/60 p-5 rounded-xl border border-sky-200/80">
            <div className="flex items-center gap-2 text-sky-950 font-semibold text-xs mb-2">
              <Layers className="w-4 h-4 text-sky-700" />
              <span>CNN Temporal Horizon Paradigm</span>
            </div>
            <div className="space-y-2 text-xs text-slate-600 leading-relaxed">
              <p>
                <strong className="text-slate-900">Input:</strong> 6 consecutive hourly time steps with 36 clinical vitals and laboratory features.
              </p>
              <p>
                <strong className="text-slate-900">Pre-processing:</strong> Patient-wise forward/backward imputation, missingness mean fill, followed by standard scaling.
              </p>
              <p>
                <strong className="text-slate-900">Early Target:</strong> Detects whether sepsis clinical criteria will be triggered anywhere in the upcoming 1 to 6 hour window.
              </p>
            </div>
            <button
              onClick={() => onNavigateTab('metrics')}
              className="mt-3 text-xs font-semibold text-sky-800 hover:text-sky-950 flex items-center gap-1 cursor-pointer"
            >
              <span>Inspect Layer Architecture & Metrics</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
