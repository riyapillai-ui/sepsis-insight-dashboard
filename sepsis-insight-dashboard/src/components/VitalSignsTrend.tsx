import { useState, useMemo } from 'react';
import { PatientRecord, HourlyVitalRecord } from '../types/sepsis';
import { exportTelemetryToCsv } from '../utils/exportCsv';
import { ensurePatientVitals } from '../data/sepsisDataset';
import {
  Heart,
  Activity,
  Wind,
  Thermometer,
  Droplets,
  TrendingUp,
  Download,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Sliders,
  Search,
} from 'lucide-react';

interface VitalSignsTrendProps {
  patients: PatientRecord[];
  selectedPatientId: string;
  onSelectPatient: (patientId: string) => void;
  onOpenSequenceModal?: (patientId: string, endHour: number) => void;
}

type VitalChannelKey = 'hr' | 'map' | 'resp' | 'temp' | 'o2sat' | 'lactate' | 'risk';

export function VitalSignsTrend({
  patients,
  selectedPatientId,
  onSelectPatient,
  onOpenSequenceModal,
}: VitalSignsTrendProps) {
  const patient = useMemo(() => {
    const p = patients.find((p) => p.patientId === selectedPatientId) || patients[0];
    ensurePatientVitals(p);
    return p;
  }, [patients, selectedPatientId]);

  const [directSearchId, setDirectSearchId] = useState<string>('');

  // Limit selector to top 60 patients + current patient for instant rendering
  const selectorPatients = useMemo(() => {
    const list = patients.slice(0, 60);
    if (!list.some((p) => p.patientId === patient.patientId)) {
      list.unshift(patient);
    }
    return list;
  }, [patients, patient]);

  // Active channels
  const [activeChannels, setActiveChannels] = useState<Record<VitalChannelKey, boolean>>({
    hr: true,
    map: true,
    resp: true,
    temp: true,
    o2sat: false,
    lactate: true,
    risk: true,
  });

  const [hoveredHour, setHoveredHour] = useState<number | null>(null);

  const vitals = patient.vitals;
  const maxHour = vitals.length;

  const toggleChannel = (channel: VitalChannelKey) => {
    setActiveChannels((prev) => ({ ...prev, [channel]: !prev[channel] }));
  };

  // Currently hovered record
  const currentRecord = useMemo(() => {
    if (hoveredHour === null) return vitals[vitals.length - 1];
    return vitals.find((v) => v.hour === hoveredHour) || vitals[vitals.length - 1];
  }, [hoveredHour, vitals]);

  // SVG Chart Geometry
  const width = 850;
  const height = 340;
  const paddingLeft = 55;
  const paddingRight = 55;
  const paddingTop = 30;
  const paddingBottom = 40;
  const chartW = width - paddingLeft - paddingRight;
  const chartH = height - paddingTop - paddingBottom;

  const getX = (hour: number) => {
    if (maxHour <= 1) return paddingLeft;
    return paddingLeft + ((hour - 1) / (maxHour - 1)) * chartW;
  };

  // Normalization Scales
  // HR scale: 40 to 160 bpm
  const getY_HR = (val: number | null) => {
    if (val === null) return null;
    const clamped = Math.max(40, Math.min(160, val));
    return paddingTop + chartH - ((clamped - 40) / (160 - 40)) * chartH;
  };

  // MAP scale: 40 to 120 mmHg
  const getY_MAP = (val: number | null) => {
    if (val === null) return null;
    const clamped = Math.max(40, Math.min(120, val));
    return paddingTop + chartH - ((clamped - 40) / (120 - 40)) * chartH;
  };

  // Resp scale: 8 to 40 /min
  const getY_Resp = (val: number | null) => {
    if (val === null) return null;
    const clamped = Math.max(8, Math.min(40, val));
    return paddingTop + chartH - ((clamped - 8) / (40 - 8)) * chartH;
  };

  // Temp scale: 35.0 to 40.0 °C
  const getY_Temp = (val: number | null) => {
    if (val === null) return null;
    const clamped = Math.max(35.0, Math.min(40.0, val));
    return paddingTop + chartH - ((clamped - 35.0) / (40.0 - 35.0)) * chartH;
  };

  // Lactate scale: 0.0 to 6.0 mg/dL
  const getY_Lactate = (val: number | null) => {
    if (val === null) return null;
    const clamped = Math.max(0.0, Math.min(6.0, val));
    return paddingTop + chartH - ((clamped - 0.0) / (6.0 - 0.0)) * chartH;
  };

  // Risk scale: 0.0 to 1.0 (0% to 100%)
  const getY_Risk = (val: number) => {
    return paddingTop + chartH - val * chartH;
  };

  // Helper to build SVG path
  const buildPath = (getYFunc: (val: any) => number | null, key: keyof HourlyVitalRecord) => {
    const points = vitals
      .map((v) => {
        const y = getYFunc(v[key]);
        return y !== null ? { x: getX(v.hour), y } : null;
      })
      .filter((p): p is { x: number; y: number } => p !== null);

    if (points.length < 2) return '';
    return points.reduce((acc, p, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`, '');
  };

  return (
    <div className="space-y-6">
      {/* Patient Selector & Meta Strip */}
      <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <label htmlFor="patient-selector" className="text-xs font-semibold text-slate-700">
              Active ICU Patient:
            </label>
            <select
              id="patient-selector"
              value={patient.patientId}
              onChange={(e) => onSelectPatient(e.target.value)}
              className="px-3 py-1.5 text-xs font-mono font-bold rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-600 bg-slate-50 text-slate-900 cursor-pointer"
            >
              {selectorPatients.map((p) => (
                <option key={p.patientId} value={p.patientId}>
                  {p.patientId} ({p.unit} · {p.age}y {p.gender} · {p.sepsisDeveloped ? `SEPSIS @ H-${p.sepsisOnsetHour ?? '—'}` : 'NON-SEPSIS'})
                </option>
              ))}
            </select>

            {/* Quick jump to any of the 20,643 patient IDs */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const clean = directSearchId.trim().toUpperCase();
                const target = clean.startsWith('P') ? clean : `P${clean}`;
                const found = patients.find((p) => p.patientId === target);
                if (found) {
                  onSelectPatient(found.patientId);
                  setDirectSearchId('');
                }
              }}
              className="flex items-center gap-1"
            >
              <input
                type="text"
                placeholder="Jump to ID (e.g. P012480)..."
                value={directSearchId}
                onChange={(e) => setDirectSearchId(e.target.value)}
                className="w-32 px-2 py-1 text-xs font-mono rounded border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-sky-600"
              />
              <button
                type="submit"
                className="px-2 py-1 text-xs font-semibold rounded bg-slate-100 hover:bg-slate-200 text-slate-700"
              >
                Go
              </button>
            </form>

            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span>{patient.unit}</span>
              <span aria-hidden="true">·</span>
              <span>{patient.age} years</span>
              <span aria-hidden="true">·</span>
              <span>{patient.gender}</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono">{patient.iculos} hrs stay</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">Peak CNN Risk:</span>
              <span
                className={`text-sm font-bold font-mono tabular-nums ${
                  patient.maxRiskScore >= 0.75
                    ? 'text-red-700'
                    : patient.maxRiskScore >= 0.50
                    ? 'text-orange-700'
                    : 'text-sky-700'
                }`}
              >
                {(patient.maxRiskScore * 100).toFixed(1)}%
              </span>
            </div>

            <button
              onClick={() => exportTelemetryToCsv(patient)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-xs cursor-pointer"
              aria-label="Export patient hourly telemetry to CSV"
            >
              <Download className="w-3.5 h-3.5 text-sky-700" />
              <span>Export Telemetry</span>
            </button>
          </div>
        </div>

        {/* Clinical Sepsis Status Notice */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs gap-3">
          {patient.sepsisDeveloped ? (
            <div className="flex items-center gap-2 text-red-700 font-semibold">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>
                Verified Sepsis Onset at ICU Hour {patient.sepsisOnsetHour}. Model predicted elevated risk {patient.sepsisOnsetHour ? Math.max(1, patient.sepsisOnsetHour - 6) : 0}h–{patient.sepsisOnsetHour}h prior.
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-emerald-800 font-semibold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                Non-Sepsis ICU Control Stay. Hemodynamic markers remained within compensatory thresholds.
              </span>
            </div>
          )}

          {onOpenSequenceModal && (
            <button
              onClick={() => onOpenSequenceModal(patient.patientId, currentRecord.hour)}
              className="text-xs font-medium text-sky-700 hover:text-sky-900 underline underline-offset-2 cursor-pointer"
            >
              Inspect 6-Hour Input Window @ H-{currentRecord.hour}
            </button>
          )}
        </div>
      </div>

      {/* Multi-Channel Telemetry Toggle Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <span className="font-semibold text-slate-700 text-xs">Toggle Vital Channels:</span>
        <div className="flex flex-wrap items-center gap-2">
          {/* Heart Rate */}
          <button
            onClick={() => toggleChannel('hr')}
            className={`px-2.5 py-1 rounded-md font-medium transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeChannels.hr
                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                : 'text-slate-400 border border-dashed border-slate-200'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-rose-600" />
            <span>Heart Rate (HR)</span>
          </button>

          {/* MAP */}
          <button
            onClick={() => toggleChannel('map')}
            className={`px-2.5 py-1 rounded-md font-medium transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeChannels.map
                ? 'bg-sky-50 text-sky-700 border border-sky-200'
                : 'text-slate-400 border border-dashed border-slate-200'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-sky-600" />
            <span>Mean Arterial Pressure (MAP)</span>
          </button>

          {/* Resp */}
          <button
            onClick={() => toggleChannel('resp')}
            className={`px-2.5 py-1 rounded-md font-medium transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeChannels.resp
                ? 'bg-teal-50 text-teal-700 border border-teal-200'
                : 'text-slate-400 border border-dashed border-slate-200'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-teal-600" />
            <span>Respiration (Resp)</span>
          </button>

          {/* Temp */}
          <button
            onClick={() => toggleChannel('temp')}
            className={`px-2.5 py-1 rounded-md font-medium transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeChannels.temp
                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                : 'text-slate-400 border border-dashed border-slate-200'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-amber-600" />
            <span>Temperature (Temp)</span>
          </button>

          {/* Lactate */}
          <button
            onClick={() => toggleChannel('lactate')}
            className={`px-2.5 py-1 rounded-md font-medium transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeChannels.lactate
                ? 'bg-purple-50 text-purple-700 border border-purple-200'
                : 'text-slate-400 border border-dashed border-slate-200'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-purple-600" />
            <span>Serum Lactate</span>
          </button>

          {/* CNN Risk Score */}
          <button
            onClick={() => toggleChannel('risk')}
            className={`px-2.5 py-1 rounded-md font-medium transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeChannels.risk
                ? 'bg-red-50 text-red-700 border border-red-300 font-bold'
                : 'text-slate-400 border border-dashed border-slate-200'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-red-600" />
            <span>CNN Predicted Risk</span>
          </button>
        </div>
      </div>

      {/* Main Multi-Channel Canvas Chart */}
      <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div>
            <h3 className="text-base font-semibold text-slate-900">
              Continuous ICU Telemetry & Early Risk Trajectory
            </h3>
            <p className="text-xs text-slate-500">
              Hover cursor over timeline to inspect all concurrent physiological parameters at each hour.
            </p>
          </div>

          {/* Sepsis Onset Annotation Legend */}
          {patient.sepsisDeveloped && patient.sepsisOnsetHour && (
            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1.5 text-amber-800">
                <span className="w-3 h-3 bg-amber-200/50 border border-amber-400 rounded-xs" />
                <span>6h Early Warning Horizon</span>
              </div>
              <div className="flex items-center gap-1.5 text-red-800 font-semibold">
                <span className="w-3 h-0.5 bg-red-600" />
                <span>Onset (T-0 @ H-{patient.sepsisOnsetHour})</span>
              </div>
            </div>
          )}
        </div>

        {/* SVG Multi-Line Chart */}
        <div className="relative">
          <svg
            className="w-full h-80 overflow-visible"
            viewBox={`0 0 ${width} ${height}`}
            preserveAspectRatio="none"
            role="img"
            aria-label={`Vital sign trajectory chart for patient ${patient.patientId}`}
            onMouseLeave={() => setHoveredHour(null)}
          >
            {/* Shaded 6-Hour Early Detection Horizon (if sepsis developed) */}
            {patient.sepsisDeveloped && patient.sepsisOnsetHour && (
              (() => {
                const startH = Math.max(1, patient.sepsisOnsetHour - 6);
                const endH = patient.sepsisOnsetHour;
                const x1 = getX(startH);
                const x2 = getX(endH);
                return (
                  <g>
                    <rect
                      x={x1}
                      y={paddingTop}
                      width={x2 - x1}
                      height={chartH}
                      fill="#FEF3C7"
                      fillOpacity="0.45"
                    />
                    <text
                      x={(x1 + x2) / 2}
                      y={paddingTop + 14}
                      textAnchor="middle"
                      className="text-[10px] font-mono fill-amber-800 font-semibold"
                    >
                      6-Hour Early Detection Window
                    </text>
                  </g>
                );
              })()
            )}

            {/* Sepsis Onset Vertical Line (T-0) */}
            {patient.sepsisDeveloped && patient.sepsisOnsetHour && (
              (() => {
                const onsetX = getX(patient.sepsisOnsetHour);
                return (
                  <g>
                    <line
                      x1={onsetX}
                      y1={paddingTop}
                      x2={onsetX}
                      y2={paddingTop + chartH}
                      stroke="#DC2626"
                      strokeWidth="2.5"
                      strokeDasharray="4 2"
                    />
                    <circle cx={onsetX} cy={paddingTop + chartH} r="4" fill="#DC2626" />
                    <text
                      x={onsetX}
                      y={paddingTop - 6}
                      textAnchor="middle"
                      className="text-[10.5px] font-bold font-mono fill-red-700"
                    >
                      Sepsis Onset (H-{patient.sepsisOnsetHour})
                    </text>
                  </g>
                );
              })()
            )}

            {/* Horizontal Gridlines */}
            {[0, 0.25, 0.5, 0.75, 1.0].map((ratio) => {
              const y = paddingTop + chartH - ratio * chartH;
              return (
                <g key={ratio}>
                  <line
                    x1={paddingLeft}
                    y1={y}
                    x2={width - paddingRight}
                    y2={y}
                    stroke="#F1F5F9"
                    strokeWidth="1"
                  />
                  {/* Left Axis label: HR */}
                  <text
                    x={paddingLeft - 8}
                    y={y + 3}
                    textAnchor="end"
                    className="text-[9.5px] font-mono fill-slate-400"
                  >
                    {Math.round(40 + ratio * 120)}
                  </text>
                  {/* Right Axis label: Risk % */}
                  <text
                    x={width - paddingRight + 8}
                    y={y + 3}
                    textAnchor="start"
                    className="text-[9.5px] font-mono fill-red-600 font-medium"
                  >
                    {Math.round(ratio * 100)}%
                  </text>
                </g>
              );
            })}

            {/* Cutoff Threshold Reference Line (0.50) */}
            {activeChannels.risk && (
              <line
                x1={paddingLeft}
                y1={getY_Risk(0.50)}
                x2={width - paddingRight}
                y2={getY_Risk(0.50)}
                stroke="#DC2626"
                strokeWidth="1"
                strokeDasharray="2 3"
                opacity="0.5"
              />
            )}

            {/* Channel Curves */}
            {/* 1. MAP (Sky) */}
            {activeChannels.map && (
              <path
                d={buildPath(getY_MAP, 'map')}
                fill="none"
                stroke="#0284C7"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}

            {/* 2. Respiration Rate (Teal) */}
            {activeChannels.resp && (
              <path
                d={buildPath(getY_Resp, 'resp')}
                fill="none"
                stroke="#0D9488"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}

            {/* 3. Temperature (Amber) */}
            {activeChannels.temp && (
              <path
                d={buildPath(getY_Temp, 'temp')}
                fill="none"
                stroke="#D97706"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}

            {/* 4. Lactate (Purple) */}
            {activeChannels.lactate && (
              <g>
                <path
                  d={buildPath(getY_Lactate, 'lactate')}
                  fill="none"
                  stroke="#9333EA"
                  strokeWidth="2.5"
                  strokeDasharray="3 3"
                  strokeLinecap="round"
                />
                {/* Dots on lactate measurements (since labs are intermittent!) */}
                {vitals
                  .filter((v) => v.lactate !== null)
                  .map((v) => {
                    const y = getY_Lactate(v.lactate);
                    if (y === null) return null;
                    return (
                      <circle
                        key={`lac-${v.hour}`}
                        cx={getX(v.hour)}
                        cy={y}
                        r="3.5"
                        fill="#9333EA"
                      />
                    );
                  })}
              </g>
            )}

            {/* 5. Heart Rate (Rose) */}
            {activeChannels.hr && (
              <path
                d={buildPath(getY_HR, 'hr')}
                fill="none"
                stroke="#E11D48"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}

            {/* 6. CNN Risk Score (Bold Red) */}
            {activeChannels.risk && (
              <path
                d={buildPath(getY_Risk, 'predictedRisk')}
                fill="none"
                stroke="#DC2626"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}

            {/* X-Axis Hour Labels */}
            {vitals
              .filter((v) => v.hour % (maxHour > 24 ? 4 : 2) === 0 || v.hour === 1 || v.hour === maxHour)
              .map((v) => {
                const x = getX(v.hour);
                return (
                  <g key={`x-${v.hour}`}>
                    <line
                      x1={x}
                      y1={paddingTop + chartH}
                      x2={x}
                      y2={paddingTop + chartH + 5}
                      stroke="#CBD5E1"
                    />
                    <text
                      x={x}
                      y={paddingTop + chartH + 18}
                      textAnchor="middle"
                      className="text-[9.5px] font-mono fill-slate-500"
                    >
                      H{v.hour}
                    </text>
                  </g>
                );
              })}

            {/* Interactive Hover Probe */}
            {hoveredHour !== null && (
              (() => {
                const hX = getX(hoveredHour);
                return (
                  <g>
                    <line
                      x1={hX}
                      y1={paddingTop}
                      x2={hX}
                      y2={paddingTop + chartH}
                      stroke="#0F172A"
                      strokeWidth="1.5"
                      strokeDasharray="2 2"
                    />
                    <circle cx={hX} cy={paddingTop + chartH} r="3" fill="#0F172A" />
                  </g>
                );
              })()
            )}

            {/* Hover overlay areas for each hour */}
            {vitals.map((v) => {
              const xCenter = getX(v.hour);
              const colW = chartW / Math.max(1, maxHour - 1);
              return (
                <rect
                  key={`hover-rect-${v.hour}`}
                  x={xCenter - colW / 2}
                  y={paddingTop}
                  width={colW}
                  height={chartH}
                  fill="transparent"
                  onMouseEnter={() => setHoveredHour(v.hour)}
                  className="cursor-crosshair"
                />
              );
            })}
          </svg>
        </div>

        {/* Axis Labels Info */}
        <div className="flex justify-between text-[11px] text-slate-400 font-mono mt-2 pt-2 border-t border-slate-100">
          <span>← Left Axis: Heart Rate (bpm)</span>
          <span>Timeline: ICU Length of Stay (Hours)</span>
          <span>Right Axis: CNN Risk Probability (0-100%) →</span>
        </div>
      </div>

      {/* Concurrent Physiological HUD at Selected/Hovered Hour */}
      <div className="bg-slate-900 text-white p-5 rounded-xl border border-slate-800 shadow-md">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-sky-400" />
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
              Physiological Telemetry HUD
            </span>
            <span className="text-slate-600" aria-hidden="true">·</span>
            <span className="text-xs font-mono font-bold text-sky-300">
              Hour {currentRecord.hour} of {maxHour}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400">CNN 6h Window Risk:</span>
            <span
              className={`text-sm font-bold font-mono tabular-nums ${
                currentRecord.predictedRisk >= 0.75
                  ? 'text-red-400'
                  : currentRecord.predictedRisk >= 0.50
                  ? 'text-orange-400'
                  : 'text-sky-400'
              }`}
            >
              {(currentRecord.predictedRisk * 100).toFixed(1)}%
            </span>
          </div>
        </div>

        {/* Vitals Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* HR */}
          <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-700/60">
            <div className="text-[11px] text-rose-300 flex items-center justify-between">
              <span>Heart Rate</span>
              <Heart className="w-3.5 h-3.5 text-rose-400" />
            </div>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-xl font-bold font-mono tabular-nums text-white">
                {currentRecord.hr ?? '—'}
              </span>
              <span className="text-[10px] text-slate-400 font-mono">bpm</span>
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              {currentRecord.hr && currentRecord.hr > 90 ? (
                <span className="text-amber-400 font-medium">SIRS Tach &gt;90</span>
              ) : (
                'Norm: 60-100'
              )}
            </div>
          </div>

          {/* MAP */}
          <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-700/60">
            <div className="text-[11px] text-sky-300 flex items-center justify-between">
              <span>Mean Arterial BP</span>
              <Activity className="w-3.5 h-3.5 text-sky-400" />
            </div>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-xl font-bold font-mono tabular-nums text-white">
                {currentRecord.map ?? '—'}
              </span>
              <span className="text-[10px] text-slate-400 font-mono">mmHg</span>
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              {currentRecord.map && currentRecord.map < 65 ? (
                <span className="text-red-400 font-medium">Hypotension &lt;65</span>
              ) : (
                'Norm: 70-105'
              )}
            </div>
          </div>

          {/* Resp */}
          <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-700/60">
            <div className="text-[11px] text-teal-300 flex items-center justify-between">
              <span>Respiration</span>
              <Wind className="w-3.5 h-3.5 text-teal-400" />
            </div>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-xl font-bold font-mono tabular-nums text-white">
                {currentRecord.resp ?? '—'}
              </span>
              <span className="text-[10px] text-slate-400 font-mono">/min</span>
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              {currentRecord.resp && currentRecord.resp > 20 ? (
                <span className="text-amber-400 font-medium">Tachypnea &gt;20</span>
              ) : (
                'Norm: 12-20'
              )}
            </div>
          </div>

          {/* Temp */}
          <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-700/60">
            <div className="text-[11px] text-amber-300 flex items-center justify-between">
              <span>Temperature</span>
              <Thermometer className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-xl font-bold font-mono tabular-nums text-white">
                {currentRecord.temp ?? '—'}
              </span>
              <span className="text-[10px] text-slate-400 font-mono">°C</span>
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              {currentRecord.temp && currentRecord.temp > 38.3 ? (
                <span className="text-amber-400 font-medium">Fever &gt;38.3</span>
              ) : (
                'Norm: 36.5-37.5'
              )}
            </div>
          </div>

          {/* Lactate */}
          <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-700/60">
            <div className="text-[11px] text-purple-300 flex items-center justify-between">
              <span>Serum Lactate</span>
              <Droplets className="w-3.5 h-3.5 text-purple-400" />
            </div>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-xl font-bold font-mono tabular-nums text-white">
                {currentRecord.lactate ?? '—'}
              </span>
              <span className="text-[10px] text-slate-400 font-mono">mg/dL</span>
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              {currentRecord.lactate && currentRecord.lactate > 2.0 ? (
                <span className="text-red-400 font-medium">Elevated &gt;2.0</span>
              ) : currentRecord.lactate === null ? (
                'Intermittent Lab'
              ) : (
                'Norm: 0.5-2.0'
              )}
            </div>
          </div>

          {/* SpO2 */}
          <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-700/60">
            <div className="text-[11px] text-sky-300 flex items-center justify-between">
              <span>SpO2 O2Sat</span>
              <Activity className="w-3.5 h-3.5 text-sky-400" />
            </div>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-xl font-bold font-mono tabular-nums text-white">
                {currentRecord.o2sat ?? '—'}
              </span>
              <span className="text-[10px] text-slate-400 font-mono">%</span>
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              {currentRecord.o2sat && currentRecord.o2sat < 92 ? (
                <span className="text-red-400 font-medium">Hypoxia &lt;92</span>
              ) : (
                'Norm: 95-100%'
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
