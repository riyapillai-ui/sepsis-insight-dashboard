import { PatientRecord, FeatureImportanceItem, MissingValueRecord, TrainingEpochRecord } from '../types/sepsis';

/**
 * Downloads a string payload as a CSV file in the browser
 */
function downloadBlob(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Exports ICU Patient Cohort summary to CSV
 */
export function exportPatientsToCsv(patients: PatientRecord[]) {
  const headers = [
    'Patient_ID',
    'Source_File',
    'Age',
    'Gender',
    'ICU_Unit',
    'Hosp_Adm_Time_Hrs',
    'ICULOS_Total_Hours',
    'Sepsis_Developed',
    'Sepsis_Onset_Hour',
    'Max_CNN_Risk_Score',
    'Latest_CNN_Risk_Score',
    'Assigned_Risk_Tier'
  ];

  const rows = patients.map(p => [
    p.patientId,
    p.sourceFile,
    p.age,
    p.gender,
    p.unit,
    p.hospAdmTime,
    p.iculos,
    p.sepsisDeveloped ? 1 : 0,
    p.sepsisOnsetHour ?? 'None',
    p.maxRiskScore.toFixed(3),
    p.latestRiskScore.toFixed(3),
    p.riskTier
  ]);

  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  downloadBlob(csvContent, `icu_sepsis_cohort_${new Date().toISOString().slice(0, 10)}.csv`);
}

/**
 * Exports Hourly Vitals & Telemetry for a specific patient or all patients
 */
export function exportTelemetryToCsv(patient: PatientRecord) {
  const headers = [
    'Patient_ID',
    'ICULOS_Hour',
    'HR_bpm',
    'O2Sat_pct',
    'Temp_C',
    'SBP_mmHg',
    'MAP_mmHg',
    'DBP_mmHg',
    'Resp_breaths_min',
    'WBC_10e3_uL',
    'Lactate_mg_dL',
    'Platelets_10e3_uL',
    'Creatinine_mg_dL',
    'BUN_mg_dL',
    'Glucose_mg_dL',
    'FiO2_pct',
    'pH',
    'SepsisLabel_GroundTruth',
    'CNN_Predicted_Sepsis_Risk'
  ];

  const rows = patient.vitals.map(v => [
    patient.patientId,
    v.hour,
    v.hr ?? '',
    v.o2sat ?? '',
    v.temp ?? '',
    v.sbp ?? '',
    v.map ?? '',
    v.dbp ?? '',
    v.resp ?? '',
    v.wbc ?? '',
    v.lactate ?? '',
    v.platelets ?? '',
    v.creatinine ?? '',
    v.bun ?? '',
    v.glucose ?? '',
    v.fio2 ?? '',
    v.ph ?? '',
    v.sepsisLabel,
    v.predictedRisk.toFixed(3)
  ]);

  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  downloadBlob(csvContent, `telemetry_${patient.patientId}_${new Date().toISOString().slice(0, 10)}.csv`);
}

/**
 * Exports Feature Importance Ablation data (matches sepsis_feature_importance.csv)
 */
export function exportFeatureImportanceToCsv(items: FeatureImportanceItem[]) {
  const headers = [
    'Feature',
    'Display_Name',
    'Category',
    'Baseline_ROC_AUC',
    'Masked_ROC_AUC',
    'Importance_AUC_Drop',
    'Missing_Pct',
    'Unit',
    'Normal_Clinical_Range'
  ];

  const rows = items.map(item => [
    item.feature,
    `"${item.displayName}"`,
    item.category,
    item.baselineAuc.toFixed(4),
    item.maskedAuc.toFixed(4),
    item.aucDrop.toFixed(4),
    `${item.missingPct}%`,
    `"${item.unit}"`,
    `"${item.normalRange}"`
  ]);

  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  downloadBlob(csvContent, `sepsis_feature_importance_${new Date().toISOString().slice(0, 10)}.csv`);
}

/**
 * Exports Missing Values Audit data
 */
export function exportMissingnessToCsv(records: MissingValueRecord[]) {
  const headers = [
    'Feature_Name',
    'Clinical_Description',
    'Category',
    'Missing_Percentage',
    'Recorded_Valid_Count',
    'Total_Observations',
    'Imputation_Strategy'
  ];

  const rows = records.map(r => [
    r.feature,
    `"${r.displayName}"`,
    r.category,
    `${r.missingPercent}%`,
    r.recordedCount,
    r.totalObservations,
    `"${r.imputationStrategy}"`
  ]);

  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  downloadBlob(csvContent, `physionet_missing_values_audit_${new Date().toISOString().slice(0, 10)}.csv`);
}

/**
 * Exports CNN Training History across epochs
 */
export function exportTrainingHistoryToCsv(epochs: TrainingEpochRecord[]) {
  const headers = [
    'Epoch',
    'Train_Loss',
    'Val_Loss',
    'Train_ROC_AUC',
    'Val_ROC_AUC',
    'Train_PR_AUC',
    'Val_PR_AUC',
    'Learning_Rate'
  ];

  const rows = epochs.map(e => [
    e.epoch,
    e.loss.toFixed(4),
    e.valLoss.toFixed(4),
    e.rocAuc.toFixed(4),
    e.valRocAuc.toFixed(4),
    e.prAuc.toFixed(4),
    e.valPrAuc.toFixed(4),
    e.learningRate
  ]);

  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  downloadBlob(csvContent, `cnn_sepsis_training_history.csv`);
}
