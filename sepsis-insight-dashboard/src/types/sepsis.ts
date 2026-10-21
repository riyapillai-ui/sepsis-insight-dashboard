/**
 * Types for CNN-Based Sepsis Prediction in ICU Patients
 * Based on PhysioNet / Computing in Cardiology Challenge 2019 dataset structure
 */

export interface HourlyVitalRecord {
  hour: number;          // ICULOS (ICU Length of Stay in hours)
  hr: number | null;     // Heart rate (beats/min)
  o2sat: number | null;  // Pulse oximetry (%)
  temp: number | null;   // Temperature (Deg C)
  sbp: number | null;    // Systolic BP (mm Hg)
  map: number | null;    // Mean arterial pressure (mm Hg)
  dbp: number | null;    // Diastolic BP (mm Hg)
  resp: number | null;   // Respiration rate (breaths/min)
  wbc: number | null;    // White blood cell count (count*10^3/µL)
  lactate: number | null;// Lactic acid (mg/dL)
  platelets: number | null; // Platelets (count*10^3/µL)
  creatinine: number | null; // Creatinine (mg/dL)
  bun: number | null;    // Blood Urea Nitrogen (mg/dL)
  glucose: number | null;// Serum Glucose (mg/dL)
  fio2: number | null;   // Fractional inspired O2 (%)
  ph: number | null;     // Arterial pH
  sepsisLabel: number;   // 0 = No sepsis, 1 = Sepsis diagnosed
  predictedRisk: number; // CNN model predicted probability (0.00 - 1.00)
}

export interface PatientRecord {
  patientId: string;
  sourceFile: string;
  age: number;
  gender: 'Male' | 'Female';
  unit: 'MICU' | 'SICU'; // Unit1 = MICU, Unit2 = SICU
  hospAdmTime: number;   // Hospital admission to ICU admission (hours)
  iculos: number;        // Total stay hours
  sepsisDeveloped: boolean;
  sepsisOnsetHour: number | null; // Hour when SepsisLabel first became 1 (or null)
  maxRiskScore: number;
  latestRiskScore: number;
  riskTier: 'Low' | 'Moderate' | 'High' | 'Critical';
  vitals: HourlyVitalRecord[];
}

export interface ModelMetricsSummary {
  rocAuc: number;
  prAuc: number;
  accuracy: number;
  precision: number;
  recall: number;
  specificity: number;
  f1Score: number;
  brierScore: number;
  loss: number;
  totalSequences: number;
  positiveSequences: number;
  negativeSequences: number;
}

export interface ConfusionMatrixData {
  truePositives: number;
  falsePositives: number;
  trueNegatives: number;
  falseNegatives: number;
  total: number;
  sensitivity: number;
  specificity: number;
  ppv: number; // Precision / Positive Predictive Value
  npv: number; // Negative Predictive Value
  accuracy: number;
  f1Score: number;
}

export interface FeatureImportanceItem {
  feature: string;
  displayName: string;
  category: 'Vital Signs' | 'Laboratory' | 'Blood Gas' | 'Demographics';
  baselineAuc: number;
  maskedAuc: number;
  aucDrop: number;
  missingPct: number;
  unit: string;
  normalRange: string;
}

export interface MissingValueRecord {
  feature: string;
  displayName: string;
  category: 'Vital Signs' | 'Laboratory' | 'Blood Gas' | 'Demographics';
  missingPercent: number;
  recordedCount: number;
  totalObservations: number;
  imputationStrategy: string;
}

export interface TrainingEpochRecord {
  epoch: number;
  loss: number;
  valLoss: number;
  rocAuc: number;
  valRocAuc: number;
  prAuc: number;
  valPrAuc: number;
  learningRate: number;
}

export interface CNNLayerArchitecture {
  layerName: string;
  type: string;
  outputShape: string;
  paramCount: number;
  description: string;
}

export interface FilterState {
  unit: 'all' | 'MICU' | 'SICU';
  sepsisStatus: 'all' | 'sepsis' | 'no-sepsis';
  riskTier: 'all' | 'Low' | 'Moderate' | 'High' | 'Critical';
  gender: 'all' | 'Male' | 'Female';
  ageRange: [number, number];
  searchQuery: string;
}

export interface DatasetIngestionProgress {
  status: 'idle' | 'unzipping' | 'parsing' | 'complete' | 'error';
  totalFiles: number;
  processedFiles: number;
  currentFileName: string;
  sepsisCasesFound: number;
  sequencesGenerated: number;
  startTime: number | null;
  elapsedSeconds: number;
  errorMessage: string | null;
}

export interface DatasetSummaryStats {
  totalPatients: number;
  totalObservations: number;
  totalSequences: number;
  sepsisPatients: number;
  controlPatients: number;
  micuPatients: number;
  sicuPatients: number;
  averageStayHours: number;
}

