import { useState, useMemo } from 'react';
import {
  MODEL_METRICS_SUMMARY,
  TRAINING_HISTORY,
  CNN_LAYERS,
  ROC_CURVE_POINTS,
  PR_CURVE_POINTS,
  CNN_MODEL_METADATA,
  calculateConfusionMatrix,
} from '../data/sepsisDataset';
import { exportTrainingHistoryToCsv } from '../utils/exportCsv';
import {
  BrainCircuit,
  Sliders,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  Info,
  Maximize2,
  TrendingDown,
  LineChart,
  Layers,
  Sparkles,
} from 'lucide-react';

export function ModelEvaluation() {
  const [threshold, setThreshold] = useState<number>(0.50);
  const [activeCurveTab, setActiveCurveTab] = useState<'roc' | 'pr'>('roc');
  const [showArchDetails, setShowArchDetails] = useState<boolean>(false);

  // Dynamic Confusion Matrix based on slider
  const cm = useMemo(() => calculateConfusionMatrix(threshold), [threshold]);

  // Curves SVG Dimensions
  const curveW = 480;
  const curveH = 260;
  const padL = 45;
  const padR = 25;
  const padT = 20;
  const padB = 35;
  const plotW = curveW - padL - padR;
  const plotH = curveH - padT - padB;

  // ROC Curve Points
  const rocSvgPath = useMemo(() => {
    return ROC_CURVE_POINTS.reduce((acc, pt, i) => {
      const x = padL + pt.fpr * plotW;
      const y = padT + plotH - pt.tpr * plotH;
      return `${acc} ${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
    }, '');
  }, [plotW, plotH]);

  // PR Curve Points
  const prSvgPath = useMemo(() => {
    return PR_CURVE_POINTS.reduce((acc, pt, i) => {
      const x = padL + pt.recall * plotW;
      const y = padT + plotH - pt.precision * plotH;
      return `${acc} ${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
    }, '');
  }, [plotW, plotH]);

  // Operating point on curves corresponding to current threshold
  const currentRocPt = useMemo(() => {
    return (
      ROC_CURVE_POINTS.find((p) => Math.abs(p.threshold - threshold) < 0.05) ||
      ROC_CURVE_POINTS[5]
    );
  }, [threshold]);

  const currentPrPt = useMemo(() => {
    return (
      PR_CURVE_POINTS.find((p) => Math.abs(p.threshold - threshold) < 0.05) ||
      PR_CURVE_POINTS[5]
    );
  }, [threshold]);

  return (
    <div className="space-y-8">
      {/* Title & Experimental Research Badge */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-sky-700 mb-1">
            <span>Quantitative Model Validation</span>
            <span aria-hidden="true">·</span>
            <span>TensorFlow / Keras 1D-CNN</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            CNN Architecture & Validation Metrics
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Evaluated on held-out test partition (GroupShuffleSplit, 20% patient-level test holdout, N=5,200 sequence windows).
          </p>
        </div>

        <button
          onClick={() => exportTrainingHistoryToCsv(TRAINING_HISTORY)}
          className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-800 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 active:bg-slate-100 transition-colors shadow-xs cursor-pointer"
          aria-label="Export CNN epoch training logs to CSV"
        >
          <FileSpreadsheet className="w-3.5 h-3.5 text-sky-700" />
          <span>Export Training History CSV</span>
        </button>
      </div>

      {/* Primary Model Metric Scorecard */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
            ROC-AUC (Test)
          </div>
          <div className="mt-1 text-2xl font-bold font-mono tabular-nums text-emerald-700">
            {MODEL_METRICS_SUMMARY.rocAuc.toFixed(4)}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Discriminative Power</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
            PR-AUC (Test)
          </div>
          <div className="mt-1 text-2xl font-bold font-mono tabular-nums text-sky-700">
            {MODEL_METRICS_SUMMARY.prAuc.toFixed(4)}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Baseline: ~0.073</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
            Binary Accuracy
          </div>
          <div className="mt-1 text-2xl font-bold font-mono tabular-nums text-slate-900">
            {(MODEL_METRICS_SUMMARY.accuracy * 100).toFixed(1)}%
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">At threshold 0.50</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
            Sensitivity (Recall)
          </div>
          <div className="mt-1 text-2xl font-bold font-mono tabular-nums text-amber-700">
            {(cm.sensitivity * 100).toFixed(1)}%
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Dynamic @ Cutoff</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
            Specificity
          </div>
          <div className="mt-1 text-2xl font-bold font-mono tabular-nums text-slate-900">
            {(cm.specificity * 100).toFixed(1)}%
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Non-sepsis true rate</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
            F1-Score
          </div>
          <div className="mt-1 text-2xl font-bold font-mono tabular-nums text-slate-900">
            {cm.f1Score.toFixed(3)}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Harmonic balance</div>
        </div>
      </div>

      {/* Middle Grid: Interactive Confusion Matrix + Threshold Calibration */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left (6 cols): Interactive 2x2 Confusion Matrix */}
        <div className="lg:col-span-6 bg-white p-6 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
            <div>
              <h3 className="text-base font-semibold text-slate-900">
                Interactive Confusion Matrix (Test Partition)
              </h3>
              <p className="text-xs text-slate-500">
                Total evaluated windows: N = {cm.total.toLocaleString()} (378 Sepsis, 4,822 Non-sepsis)
              </p>
            </div>

            <div className="flex items-center gap-2 bg-sky-50 px-2.5 py-1 rounded text-xs font-mono font-bold text-sky-800">
              <span>Threshold:</span>
              <span>{threshold.toFixed(2)}</span>
            </div>
          </div>

          {/* Draggable Threshold Slider */}
          <div className="mb-6 bg-slate-50 p-3 rounded-lg border border-slate-200/60">
            <div className="flex justify-between text-xs text-slate-600 mb-1">
              <span className="font-medium flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-slate-500" />
                <span>Simulate Decision Threshold Cutoff</span>
              </span>
              <span className="font-mono text-slate-700 font-semibold">{threshold.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0.10"
              max="0.90"
              step="0.05"
              value={threshold}
              onChange={(e) => setThreshold(parseFloat(e.target.value))}
              className="w-full accent-sky-700 h-2 bg-slate-200 rounded-lg cursor-pointer"
              aria-label="Adjust confusion matrix classification threshold"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-1">
              <span>0.10 (Prioritize Sensitivity)</span>
              <span>0.50 (Standard)</span>
              <span>0.90 (Prioritize Specificity)</span>
            </div>
          </div>

          {/* 2x2 Matrix Grid */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            {/* True Negatives (TN) */}
            <div className="bg-sky-50/70 p-4 rounded-xl border border-sky-100 flex flex-col justify-between">
              <div>
                <div className="text-[11px] font-semibold text-sky-900 uppercase tracking-wider">
                  True Negatives (TN)
                </div>
                <div className="text-xs text-slate-500">Predicted No Sepsis · Actual No Sepsis</div>
              </div>
              <div className="mt-3 text-2xl sm:text-3xl font-bold font-mono tabular-nums text-sky-900">
                {cm.trueNegatives.toLocaleString()}
              </div>
              <div className="mt-1 text-[11px] text-sky-700 font-mono">
                {((cm.trueNegatives / 4822) * 100).toFixed(1)}% of actual negatives
              </div>
            </div>

            {/* False Positives (FP) */}
            <div className="bg-amber-50/70 p-4 rounded-xl border border-amber-200 flex flex-col justify-between">
              <div>
                <div className="text-[11px] font-semibold text-amber-900 uppercase tracking-wider">
                  False Positives (FP)
                </div>
                <div className="text-xs text-slate-500">Predicted Sepsis · Actual No Sepsis</div>
              </div>
              <div className="mt-3 text-2xl sm:text-3xl font-bold font-mono tabular-nums text-amber-900">
                {cm.falsePositives.toLocaleString()}
              </div>
              <div className="mt-1 text-[11px] text-amber-700 font-mono">
                Alert Fatigue Risk ({((cm.falsePositives / 4822) * 100).toFixed(1)}%)
              </div>
            </div>

            {/* False Negatives (FN) */}
            <div className="bg-rose-50/70 p-4 rounded-xl border border-rose-200 flex flex-col justify-between">
              <div>
                <div className="text-[11px] font-semibold text-rose-900 uppercase tracking-wider">
                  False Negatives (FN)
                </div>
                <div className="text-xs text-slate-500">Predicted No Sepsis · Actual Sepsis</div>
              </div>
              <div className="mt-3 text-2xl sm:text-3xl font-bold font-mono tabular-nums text-rose-900">
                {cm.falseNegatives.toLocaleString()}
              </div>
              <div className="mt-1 text-[11px] text-rose-700 font-mono">
                Missed Sepsis Cases ({((cm.falseNegatives / 378) * 100).toFixed(1)}%)
              </div>
            </div>

            {/* True Positives (TP) */}
            <div className="bg-emerald-50/70 p-4 rounded-xl border border-emerald-200 flex flex-col justify-between">
              <div>
                <div className="text-[11px] font-semibold text-emerald-900 uppercase tracking-wider">
                  True Positives (TP)
                </div>
                <div className="text-xs text-slate-500">Predicted Sepsis · Actual Sepsis</div>
              </div>
              <div className="mt-3 text-2xl sm:text-3xl font-bold font-mono tabular-nums text-emerald-900">
                {cm.truePositives.toLocaleString()}
              </div>
              <div className="mt-1 text-[11px] text-emerald-700 font-mono">
                Early Detected Sepsis ({((cm.truePositives / 378) * 100).toFixed(1)}%)
              </div>
            </div>
          </div>

          {/* Derived Diagnostic Metrics Strip */}
          <div className="grid grid-cols-4 gap-2 pt-3 border-t border-slate-100 text-center text-xs">
            <div>
              <div className="text-slate-500 text-[10px]">Sensitivity</div>
              <div className="font-mono font-bold text-slate-900">
                {(cm.sensitivity * 100).toFixed(1)}%
              </div>
            </div>
            <div>
              <div className="text-slate-500 text-[10px]">Specificity</div>
              <div className="font-mono font-bold text-slate-900">
                {(cm.specificity * 100).toFixed(1)}%
              </div>
            </div>
            <div>
              <div className="text-slate-500 text-[10px]">Precision (PPV)</div>
              <div className="font-mono font-bold text-slate-900">
                {(cm.ppv * 100).toFixed(1)}%
              </div>
            </div>
            <div>
              <div className="text-slate-500 text-[10px]">NPV</div>
              <div className="font-mono font-bold text-slate-900">
                {(cm.npv * 100).toFixed(1)}%
              </div>
            </div>
          </div>
        </div>

        {/* Right (6 cols): ROC & PR Curves */}
        <div className="lg:col-span-6 bg-white p-6 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div>
              <h3 className="text-base font-semibold text-slate-900">
                Performance Evaluation Curves
              </h3>
              <p className="text-xs text-slate-500">
                Receiver Operating Characteristic vs. Precision-Recall curves.
              </p>
            </div>

            {/* Segmented Curve Tabs */}
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
              <button
                onClick={() => setActiveCurveTab('roc')}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                  activeCurveTab === 'roc'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                ROC (AUC = 0.882)
              </button>
              <button
                onClick={() => setActiveCurveTab('pr')}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                  activeCurveTab === 'pr'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                PR (AP = 0.419)
              </button>
            </div>
          </div>

          {/* SVG Curve Canvas */}
          <div className="relative">
            <svg
              className="w-full h-64 overflow-visible"
              viewBox={`0 0 ${curveW} ${curveH}`}
              preserveAspectRatio="none"
              role="img"
              aria-label={
                activeCurveTab === 'roc'
                  ? 'Receiver Operating Characteristic (ROC) curve'
                  : 'Precision-Recall (PR) curve'
              }
            >
              {/* Gridlines */}
              {[0, 0.25, 0.5, 0.75, 1.0].map((val) => {
                const y = padT + plotH - val * plotH;
                const x = padL + val * plotW;
                return (
                  <g key={`grid-${val}`}>
                    <line
                      x1={padL}
                      y1={y}
                      x2={curveW - padR}
                      y2={y}
                      stroke="#F1F5F9"
                      strokeWidth="1"
                    />
                    <line
                      x1={x}
                      y1={padT}
                      x2={x}
                      y2={padT + plotH}
                      stroke="#F1F5F9"
                      strokeWidth="1"
                    />
                    {/* Y Axis text */}
                    <text
                      x={padL - 8}
                      y={y + 3}
                      textAnchor="end"
                      className="text-[9.5px] font-mono fill-slate-400"
                    >
                      {val.toFixed(2)}
                    </text>
                    {/* X Axis text */}
                    <text
                      x={x}
                      y={padT + plotH + 16}
                      textAnchor="middle"
                      className="text-[9.5px] font-mono fill-slate-400"
                    >
                      {val.toFixed(2)}
                    </text>
                  </g>
                );
              })}

              {/* Diagonal Reference Line for ROC or Prevalence Line for PR */}
              {activeCurveTab === 'roc' ? (
                <line
                  x1={padL}
                  y1={padT + plotH}
                  x2={padL + plotW}
                  y2={padT}
                  stroke="#94A3B8"
                  strokeWidth="1.5"
                  strokeDasharray="4 4"
                />
              ) : (
                <line
                  x1={padL}
                  y1={padT + plotH - 0.073 * plotH}
                  x2={padL + plotW}
                  y2={padT + plotH - 0.073 * plotH}
                  stroke="#94A3B8"
                  strokeWidth="1.5"
                  strokeDasharray="4 4"
                />
              )}

              {/* Plotted Main Curve */}
              {activeCurveTab === 'roc' ? (
                <path
                  d={rocSvgPath}
                  fill="none"
                  stroke="#0284C7"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              ) : (
                <path
                  d={prSvgPath}
                  fill="none"
                  stroke="#0284C7"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              )}

              {/* Highlight Operating Point */}
              {(() => {
                const ptX =
                  activeCurveTab === 'roc'
                    ? padL + currentRocPt.fpr * plotW
                    : padL + currentPrPt.recall * plotW;
                const ptY =
                  activeCurveTab === 'roc'
                    ? padT + plotH - currentRocPt.tpr * plotH
                    : padT + plotH - currentPrPt.precision * plotH;

                return (
                  <g>
                    <circle cx={ptX} cy={ptY} r="5" fill="#DC2626" />
                    <circle cx={ptX} cy={ptY} r="9" fill="#DC2626" fillOpacity="0.2" />
                    <text
                      x={ptX + 12}
                      y={ptY - 6}
                      className="text-[10px] font-mono font-bold fill-red-700"
                    >
                      Cutoff {threshold.toFixed(2)}
                    </text>
                  </g>
                );
              })()}
            </svg>
          </div>

          {/* Curve Axis Labels & Note */}
          <div className="flex justify-between text-[11px] text-slate-500 font-mono mt-3 pt-2 border-t border-slate-100">
            <span>
              {activeCurveTab === 'roc'
                ? 'X-Axis: False Positive Rate (1 - Specificity)'
                : 'X-Axis: Recall (Sensitivity)'}
            </span>
            <span>
              {activeCurveTab === 'roc'
                ? 'Y-Axis: True Positive Rate (Sensitivity)'
                : 'Y-Axis: Precision (Positive Predictive Value)'}
            </span>
          </div>
        </div>
      </div>

      {/* Epochs History: Training vs Validation Loss & AUC (30 Epochs) */}
      <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div>
            <h3 className="text-base font-semibold text-slate-900">
              Convergence Trajectory Across 26 Training Epochs
            </h3>
            <p className="text-xs text-slate-500">
              Optimization with EarlyStopping (patience=5 on validation PR-AUC) and ReduceLROnPlateau.
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5 text-slate-600">
              <span className="w-3 h-0.5 bg-sky-600" />
              <span>Training Curve</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-600">
              <span className="w-3 h-0.5 bg-amber-600" />
              <span>Validation Holdout</span>
            </div>
            <div className="flex items-center gap-1 text-emerald-700 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Best Weights Restored @ Epoch 26</span>
            </div>
          </div>
        </div>

        {/* Dual Epoch Mini-Charts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Chart 1: Loss */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/60">
            <div className="text-xs font-semibold text-slate-800 mb-2 flex justify-between">
              <span>Weighted Binary Cross-Entropy Loss</span>
              <span className="font-mono text-[11px] text-slate-500">Min Val: 0.3610</span>
            </div>
            <svg
              className="w-full h-44 overflow-visible"
              viewBox="0 0 400 160"
              preserveAspectRatio="none"
              role="img"
              aria-label="Training and validation loss curve across epochs"
            >
              {/* Lines */}
              {(() => {
                const maxLoss = 0.72;
                const minLoss = 0.25;
                const toX = (ep: number) => 30 + ((ep - 1) / 25) * 350;
                const toY = (loss: number) => 140 - ((loss - minLoss) / (maxLoss - minLoss)) * 120;

                const trainLossPath = TRAINING_HISTORY.reduce((acc, h, i) => {
                  return `${acc} ${i === 0 ? 'M' : 'L'} ${toX(h.epoch).toFixed(1)} ${toY(h.loss).toFixed(1)}`;
                }, '');

                const valLossPath = TRAINING_HISTORY.reduce((acc, h, i) => {
                  return `${acc} ${i === 0 ? 'M' : 'L'} ${toX(h.epoch).toFixed(1)} ${toY(h.valLoss).toFixed(1)}`;
                }, '');

                return (
                  <g>
                    {/* Grid */}
                    {[0.3, 0.45, 0.6, 0.7].map((lvl) => (
                      <g key={lvl}>
                        <line
                          x1="30"
                          y1={toY(lvl)}
                          x2="380"
                          y2={toY(lvl)}
                          stroke="#E2E8F0"
                          strokeDasharray="3 3"
                        />
                        <text
                          x="25"
                          y={toY(lvl) + 3}
                          textAnchor="end"
                          className="text-[9px] font-mono fill-slate-400"
                        >
                          {lvl}
                        </text>
                      </g>
                    ))}
                    <path d={trainLossPath} fill="none" stroke="#0284C7" strokeWidth="2" />
                    <path d={valLossPath} fill="none" stroke="#D97706" strokeWidth="2" />
                  </g>
                );
              })()}
            </svg>
            <div className="flex justify-between text-[10px] font-mono text-slate-400 mt-1">
              <span>Epoch 1</span>
              <span>Epoch 13 (LR / 2)</span>
              <span>Epoch 26 (Restored)</span>
            </div>
          </div>

          {/* Chart 2: ROC-AUC */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/60">
            <div className="text-xs font-semibold text-slate-800 mb-2 flex justify-between">
              <span>ROC-AUC Metric Across Epochs</span>
              <span className="font-mono text-[11px] text-emerald-700">Peak Val: 0.8824</span>
            </div>
            <svg
              className="w-full h-44 overflow-visible"
              viewBox="0 0 400 160"
              preserveAspectRatio="none"
              role="img"
              aria-label="Training and validation ROC-AUC curve across epochs"
            >
              {(() => {
                const maxAuc = 0.95;
                const minAuc = 0.60;
                const toX = (ep: number) => 30 + ((ep - 1) / 25) * 350;
                const toY = (auc: number) => 140 - ((auc - minAuc) / (maxAuc - minAuc)) * 120;

                const trainAucPath = TRAINING_HISTORY.reduce((acc, h, i) => {
                  return `${acc} ${i === 0 ? 'M' : 'L'} ${toX(h.epoch).toFixed(1)} ${toY(h.rocAuc).toFixed(1)}`;
                }, '');

                const valAucPath = TRAINING_HISTORY.reduce((acc, h, i) => {
                  return `${acc} ${i === 0 ? 'M' : 'L'} ${toX(h.epoch).toFixed(1)} ${toY(h.valRocAuc).toFixed(1)}`;
                }, '');

                return (
                  <g>
                    {/* Grid */}
                    {[0.65, 0.75, 0.85, 0.92].map((lvl) => (
                      <g key={lvl}>
                        <line
                          x1="30"
                          y1={toY(lvl)}
                          x2="380"
                          y2={toY(lvl)}
                          stroke="#E2E8F0"
                          strokeDasharray="3 3"
                        />
                        <text
                          x="25"
                          y={toY(lvl) + 3}
                          textAnchor="end"
                          className="text-[9px] font-mono fill-slate-400"
                        >
                          {lvl}
                        </text>
                      </g>
                    ))}
                    <path d={trainAucPath} fill="none" stroke="#0284C7" strokeWidth="2" />
                    <path d={valAucPath} fill="none" stroke="#D97706" strokeWidth="2" />
                  </g>
                );
              })()}
            </svg>
            <div className="flex justify-between text-[10px] font-mono text-slate-400 mt-1">
              <span>Epoch 1 (AUC 0.71)</span>
              <span>Epoch 13 (AUC 0.878)</span>
              <span>Epoch 26 (AUC 0.8824)</span>
            </div>
          </div>
        </div>
      </div>

      {/* 1D CNN Architecture Breakdown */}
      <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-sky-700" />
              <span>1D-CNN Temporal Feature Extraction Architecture</span>
            </h3>
            <p className="text-xs text-slate-500">
              Total Parameters: {CNN_MODEL_METADATA.totalParameters.toLocaleString()} ({CNN_MODEL_METADATA.trainableParameters.toLocaleString()} Trainable) · Receptive Field: 3 consecutive hours per kernel
            </p>
          </div>

          <button
            onClick={() => setShowArchDetails(!showArchDetails)}
            className="text-xs text-sky-700 font-semibold hover:text-sky-900 cursor-pointer"
          >
            {showArchDetails ? 'Collapse Layer Details' : 'Expand All 10 Layers'}
          </button>
        </div>

        {/* Layer Pipeline Flow */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {CNN_LAYERS.slice(0, 5).map((layer, idx) => (
            <div
              key={layer.layerName}
              className="p-3 rounded-lg bg-slate-50 border border-slate-200/70"
            >
              <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono">
                <span>Stage 0{idx + 1}</span>
                <span>{layer.paramCount > 0 ? `${layer.paramCount.toLocaleString()} params` : '0 params'}</span>
              </div>
              <div className="font-mono font-bold text-xs text-slate-900 mt-1">
                {layer.layerName}
              </div>
              <div className="text-[11px] text-sky-700 font-mono mt-0.5">
                {layer.outputShape}
              </div>
              <div className="text-[10.5px] text-slate-500 mt-1 leading-snug">
                {layer.description}
              </div>
            </div>
          ))}
        </div>

        {showArchDetails && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mt-3 pt-3 border-t border-slate-100">
            {CNN_LAYERS.slice(5).map((layer, idx) => (
              <div
                key={layer.layerName}
                className="p-3 rounded-lg bg-slate-50 border border-slate-200/70"
              >
                <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono">
                  <span>Stage 0{idx + 6}</span>
                  <span>{layer.paramCount > 0 ? `${layer.paramCount.toLocaleString()} params` : '0 params'}</span>
                </div>
                <div className="font-mono font-bold text-xs text-slate-900 mt-1">
                  {layer.layerName}
                </div>
                <div className="text-[11px] text-sky-700 font-mono mt-0.5">
                  {layer.outputShape}
                </div>
                <div className="text-[10.5px] text-slate-500 mt-1 leading-snug">
                  {layer.description}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
