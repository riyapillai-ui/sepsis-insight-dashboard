import { useState, useRef } from 'react';
import { PatientRecord, DatasetIngestionProgress } from '../types/sepsis';
import { ingestZipArchive, ingestFileList } from '../utils/fileParser';
import { FULL_COHORT_STATS } from '../data/sepsisDataset';
import {
  Upload,
  Archive,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  Play,
  RotateCcw,
  Clock,
  Layers,
  Database,
  ArrowRight,
  Info,
  Cpu,
  FolderUp,
} from 'lucide-react';

interface DatasetIngestionViewProps {
  currentPatientsCount: number;
  onDatasetLoaded: (newPatients: PatientRecord[], sourceName: string) => void;
  onResetToDefault20k: () => void;
  onNavigateToCohorts: () => void;
}

export function DatasetIngestionView({
  currentPatientsCount,
  onDatasetLoaded,
  onResetToDefault20k,
  onNavigateToCohorts,
}: DatasetIngestionViewProps) {
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [ingestionProgress, setIngestionProgress] = useState<DatasetIngestionProgress>({
    status: 'idle',
    totalFiles: 0,
    processedFiles: 0,
    currentFileName: '',
    sepsisCasesFound: 0,
    sequencesGenerated: 0,
    startTime: null,
    elapsedSeconds: 0,
    errorMessage: null,
  });

  const zipInputRef = useRef<HTMLInputElement>(null);
  const multiCsvInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  const handleZipUpload = async (file: File) => {
    try {
      setIngestionProgress((prev) => ({
        ...prev,
        status: 'unzipping',
        currentFileName: file.name,
        errorMessage: null,
      }));

      const parsedPatients = await ingestZipArchive(file, (progress) => {
        setIngestionProgress(progress);
      });

      onDatasetLoaded(parsedPatients, file.name);
    } catch (err: any) {
      setIngestionProgress((prev) => ({
        ...prev,
        status: 'error',
        errorMessage: err.message || 'Failed to process ZIP archive.',
      }));
    }
  };

  const handleFilesUpload = async (files: FileList | File[]) => {
    try {
      const fileArray = Array.from(files);
      const isZip = fileArray.length === 1 && fileArray[0].name.toLowerCase().endsWith('.zip');

      if (isZip) {
        await handleZipUpload(fileArray[0]);
        return;
      }

      setIngestionProgress((prev) => ({
        ...prev,
        status: 'parsing',
        totalFiles: fileArray.length,
        errorMessage: null,
      }));

      const parsedPatients = await ingestFileList(fileArray, (progress) => {
        setIngestionProgress(progress);
      });

      onDatasetLoaded(parsedPatients, `${fileArray.length} CSV Files`);
    } catch (err: any) {
      setIngestionProgress((prev) => ({
        ...prev,
        status: 'error',
        errorMessage: err.message || 'Failed to process CSV files.',
      }));
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await handleFilesUpload(e.dataTransfer.files);
    }
  };

  const progressPercent =
    ingestionProgress.totalFiles > 0
      ? Math.round((ingestionProgress.processedFiles / ingestionProgress.totalFiles) * 100)
      : 0;

  return (
    <div className="space-y-8">
      {/* Title & Scale Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-sky-700 mb-1">
          <span>High-Throughput Temporal Batch Ingestion</span>
          <span aria-hidden="true">·</span>
          <span>PhysioNet CinC 2019 Scale</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 text-balance">
          Dataset Ingestion Engine (20,643 Files Support)
        </h1>
        <p className="mt-2 text-sm text-slate-600 max-w-3xl leading-relaxed">
          Ingest, parse, and evaluate your complete collection of individual patient CSV/PSV files. The pipeline performs timeline imputation, creates 6-hour sliding temporal sequence matrices, and evaluates sepsis prediction metrics in real time.
        </p>
      </div>

      {/* Cohort Stats Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
            Active Monitored Patients
          </div>
          <div className="mt-1 text-2xl font-bold font-mono tabular-nums text-slate-900">
            {currentPatientsCount.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            {currentPatientsCount === FULL_COHORT_STATS.totalPatients ? 'Full Challenge Set A' : 'Custom Cohort'}
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
            ICU Hourly Observations
          </div>
          <div className="mt-1 text-2xl font-bold font-mono tabular-nums text-sky-700">
            {FULL_COHORT_STATS.totalObservations.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Continuous vitals & labs</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
            6h Sliding Sequences
          </div>
          <div className="mt-1 text-2xl font-bold font-mono tabular-nums text-indigo-700">
            {FULL_COHORT_STATS.totalSequences.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Input matrices (N, 6, 36)</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
            Sepsis Onset Cases
          </div>
          <div className="mt-1 text-2xl font-bold font-mono tabular-nums text-red-700">
            {FULL_COHORT_STATS.sepsisPatients.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            {FULL_COHORT_STATS.sepsisPrevalencePct}% cohort prevalence
          </div>
        </div>
      </div>

      {/* Main Ingestion Dropzone & File Pickers */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-xs space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Upload Your 20,643 Patient Files or ZIP Archive
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Accepts .zip archives (e.g. <code>sepsis_csv_files.zip</code> from Google Colab) or direct multi-CSV selection.
            </p>
          </div>

          <button
            onClick={onResetToDefault20k}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restore Benchmark 20,643 Cohort</span>
          </button>
        </div>

        {/* Drag and drop box */}
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all ${
            dragActive
              ? 'border-sky-500 bg-sky-50/60 scale-[1.005]'
              : 'border-slate-300 hover:border-sky-400 bg-slate-50/50'
          }`}
        >
          <div className="max-w-md mx-auto space-y-4">
            <div className="flex items-center justify-center gap-3">
              <span className="w-12 h-12 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center shadow-xs">
                <Archive className="w-6 h-6" />
              </span>
              <span className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center shadow-xs">
                <FileSpreadsheet className="w-6 h-6" />
              </span>
            </div>

            <div>
              <p className="text-sm font-bold text-slate-900">
                Drag and drop your <code>.zip</code> archive or CSV dataset files here
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Handles thousands of individual patient files in streaming batches without freezing your browser.
              </p>
            </div>

            {/* Hidden File Inputs */}
            <input
              ref={zipInputRef}
              type="file"
              accept=".zip"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleZipUpload(e.target.files[0]);
                }
              }}
            />
            <input
              ref={multiCsvInputRef}
              type="file"
              accept=".csv,.psv"
              multiple
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  handleFilesUpload(e.target.files);
                }
              }}
            />

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                onClick={() => zipInputRef.current?.click()}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-sky-700 rounded-lg hover:bg-sky-800 transition-colors shadow-xs cursor-pointer"
              >
                <Archive className="w-4 h-4" />
                <span>Upload .ZIP Archive</span>
              </button>

              <button
                onClick={() => multiCsvInputRef.current?.click()}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-800 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-xs cursor-pointer"
              >
                <FileSpreadsheet className="w-4 h-4 text-sky-700" />
                <span>Select Multiple CSV/PSV Files</span>
              </button>
            </div>
          </div>
        </div>

        {/* Live Parsing Progress Feedback */}
        {ingestionProgress.status !== 'idle' && (
          <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                {ingestionProgress.status === 'complete' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                ) : ingestionProgress.status === 'error' ? (
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                ) : (
                  <span className="w-3 h-3 rounded-full bg-sky-600 animate-pulse" />
                )}
                <span className="font-semibold text-slate-900">
                  {ingestionProgress.status === 'unzipping'
                    ? 'Unpacking ZIP archive...'
                    : ingestionProgress.status === 'parsing'
                    ? 'Streaming & Ingesting Patient Sequences...'
                    : ingestionProgress.status === 'complete'
                    ? 'Ingestion Complete!'
                    : 'Ingestion Error'}
                </span>
                <span className="text-slate-400">·</span>
                <span className="font-mono text-slate-600 truncate max-w-xs">
                  {ingestionProgress.currentFileName}
                </span>
              </div>

              <div className="font-mono text-xs text-slate-600">
                {ingestionProgress.processedFiles.toLocaleString()} / {ingestionProgress.totalFiles.toLocaleString()} files ({progressPercent}%)
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-150 ${
                  ingestionProgress.status === 'complete'
                    ? 'bg-emerald-600'
                    : ingestionProgress.status === 'error'
                    ? 'bg-red-600'
                    : 'bg-sky-600'
                }`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            {/* Details metrics */}
            <div className="flex flex-wrap items-center justify-between text-xs text-slate-500 pt-1">
              <div className="flex items-center gap-4">
                <span>
                  Sepsis Cases Identified:{' '}
                  <strong className="text-red-700 font-mono">
                    {ingestionProgress.sepsisCasesFound}
                  </strong>
                </span>
                <span>
                  6h Sequences Generated:{' '}
                  <strong className="text-slate-900 font-mono">
                    {ingestionProgress.sequencesGenerated.toLocaleString()}
                  </strong>
                </span>
              </div>
              <div className="flex items-center gap-1 font-mono text-[11px]">
                <Clock className="w-3.5 h-3.5" />
                <span>Elapsed: {ingestionProgress.elapsedSeconds}s</span>
              </div>
            </div>

            {ingestionProgress.errorMessage && (
              <div className="text-xs text-red-700 bg-red-50 p-2.5 rounded-lg border border-red-200">
                {ingestionProgress.errorMessage}
              </div>
            )}

            {ingestionProgress.status === 'complete' && (
              <div className="pt-2 flex justify-end">
                <button
                  onClick={onNavigateToCohorts}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors cursor-pointer"
                >
                  <span>Explore Ingested Cohort in Table</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Pipeline Architectural Flowchart */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
          <Layers className="w-4 h-4 text-sky-700" />
          <span>20,643 Files Data Pipeline Architecture</span>
        </h3>
        <p className="text-xs text-slate-500">
          How individual PhysioNet ICU files are transformed into standardized 1D-CNN temporal input matrices.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-2">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <div className="text-[10px] font-mono font-semibold text-slate-400 uppercase">
              Step 1: Ingestion
            </div>
            <div className="text-xs font-bold text-slate-900 mt-1">
              20,643 CSV / PSV Files
            </div>
            <div className="text-[11px] text-slate-600 mt-1">
              Parsed asynchronously in streaming batches. Reads 36 vitals and labs per hour.
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <div className="text-[10px] font-mono font-semibold text-slate-400 uppercase">
              Step 2: Imputation
            </div>
            <div className="text-xs font-bold text-slate-900 mt-1">
              Timeline ffill & bfill
            </div>
            <div className="text-[11px] text-slate-600 mt-1">
              Propagates last observed lab values forward. Non-observed variables filled with zero.
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <div className="text-[10px] font-mono font-semibold text-slate-400 uppercase">
              Step 3: Temporal Slicing
            </div>
            <div className="text-xs font-bold text-slate-900 mt-1">
              (6, 36) Sequence Windows
            </div>
            <div className="text-[11px] text-slate-600 mt-1">
              Extracts 6 consecutive hours [t-5...t] targeting early onset [t+1...t+6].
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <div className="text-[10px] font-mono font-semibold text-slate-400 uppercase">
              Step 4: CNN Inference
            </div>
            <div className="text-xs font-bold text-slate-900 mt-1">
              Calibrated Sepsis Risk
            </div>
            <div className="text-[11px] text-slate-600 mt-1">
              Scores output probability, computes confusion matrix, and updates patient triage.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
