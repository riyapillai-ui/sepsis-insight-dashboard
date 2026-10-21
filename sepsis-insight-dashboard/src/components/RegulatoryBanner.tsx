import { useState } from 'react';
import { AlertTriangle, ShieldCheck, ChevronDown, ChevronUp, Cpu } from 'lucide-react';

interface RegulatoryBannerProps {
  onOpenModelArchitecture?: () => void;
}

export function RegulatoryBanner({ onOpenModelArchitecture }: RegulatoryBannerProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-sky-50/80 border-b border-sky-200/80 text-slate-800 text-xs transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="flex items-center justify-center w-5 h-5 rounded bg-sky-100 text-sky-700 shrink-0">
              <AlertTriangle className="w-3.5 h-3.5" aria-hidden="true" />
            </span>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-sky-950 uppercase tracking-wider text-[11px]">
                Investigational ML Research Dashboard
              </span>
              <span className="text-slate-400" aria-hidden="true">·</span>
              <span className="text-slate-700">
                Non-diagnostic experimental analytics based on PhysioNet CinC 2019 benchmark dataset.
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <span className="inline-flex items-center gap-1.5 text-[11px] text-slate-600 font-mono">
              <Cpu className="w-3.5 h-3.5 text-sky-600" aria-hidden="true" />
              <span>CNN Mode: Offline Validated Metrics</span>
            </span>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="inline-flex items-center gap-1 text-[11px] font-medium text-sky-800 hover:text-sky-950 underline decoration-sky-300 underline-offset-2 transition-colors cursor-pointer"
              aria-expanded={isExpanded}
            >
              <span>{isExpanded ? 'Hide Protocol Details' : 'View Regulatory Notice'}</span>
              {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          </div>
        </div>

        {isExpanded && (
          <div className="mt-3 pt-3 border-t border-sky-200/60 text-slate-600 leading-relaxed grid grid-cols-1 md:grid-cols-3 gap-4 text-[11.5px]">
            <div>
              <p className="font-semibold text-slate-900 mb-1 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-sky-600" />
                Intended Investigative Use
              </p>
              <p>
                This interface visualizes algorithmic performance metrics for a 1D Convolutional Neural Network trained to detect early physiological sepsis onset 1–6 hours ahead of clinical suspicion. It is intended exclusively for computational validation and medical informatics review.
              </p>
            </div>
            <div>
              <p className="font-semibold text-slate-900 mb-1">
                Zero Diagnostic Claim
              </p>
              <p>
                In strict adherence to clinical AI safety standards, predicted risk probabilities do not constitute patient diagnoses, therapeutic directives, or validated clinical alarms. All patient physiological data is derived from anonymized PhysioNet ICU benchmark partitions.
              </p>
            </div>
            <div>
              <p className="font-semibold text-slate-900 mb-1">
                Model Engine Status
              </p>
              <p>
                All displayed ROC-AUC, PR-AUC, confusion matrices, and ablation rankings represent verified test partition evaluations from the TensorFlow/Keras pipeline. When external inference RPC is unavailable, historical ground truth and validation values are rendered.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
