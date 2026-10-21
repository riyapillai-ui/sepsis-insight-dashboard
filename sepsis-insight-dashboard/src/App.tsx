/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { ICU_PATIENTS, generateFull20kCohort } from './data/sepsisDataset';
import { PatientRecord } from './types/sepsis';
import { RegulatoryBanner } from './components/RegulatoryBanner';
import { Navbar } from './components/Navbar';
import { OverviewSection } from './components/OverviewSection';
import { CohortExplorer } from './components/CohortExplorer';
import { VitalSignsTrend } from './components/VitalSignsTrend';
import { ModelEvaluation } from './components/ModelEvaluation';
import { MissingnessAblation } from './components/MissingnessAblation';
import { DatasetIngestionView } from './components/DatasetIngestionView';
import { ExportModal } from './components/ExportModal';
import { SequenceInspectorModal } from './components/SequenceInspectorModal';
import { CheckCircle2 } from 'lucide-react';

export default function App() {
  const [patients, setPatients] = useState<PatientRecord[]>(ICU_PATIENTS);
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [selectedPatientId, setSelectedPatientId] = useState<string>('P002841');
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);
  const [notification, setNotification] = useState<string | null>(null);

  const [sequenceModalState, setSequenceModalState] = useState<{
    isOpen: boolean;
    patientId: string;
    endHour: number;
  }>({
    isOpen: false,
    patientId: 'P002841',
    endHour: 22,
  });

  const selectedPatient =
    patients.find((p) => p.patientId === selectedPatientId) || patients[0];

  const handleOpenSequenceModal = (patientId: string, endHour: number) => {
    setSequenceModalState({
      isOpen: true,
      patientId,
      endHour,
    });
  };

  const handleDatasetLoaded = (newPatients: PatientRecord[], sourceName: string) => {
    setPatients(newPatients);
    if (newPatients.length > 0) {
      setSelectedPatientId(newPatients[0].patientId);
    }
    setNotification(`Successfully ingested ${newPatients.length.toLocaleString()} patient files from ${sourceName}. Model evaluation updated.`);
    setTimeout(() => {
      setNotification(null);
    }, 6000);
  };

  const handleResetToDefault20k = () => {
    const full = generateFull20kCohort();
    setPatients(full);
    setSelectedPatientId('P002841');
    setNotification(`Restored complete PhysioNet benchmark registry: 20,643 patient records active.`);
    setTimeout(() => {
      setNotification(null);
    }, 5000);
  };

  const sequencePatient =
    patients.find((p) => p.patientId === sequenceModalState.patientId) ||
    selectedPatient;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-sky-100 selection:text-sky-900">
      {/* 1. Mandatory Regulatory Banner */}
      <RegulatoryBanner onOpenModelArchitecture={() => setActiveTab('metrics')} />

      {/* 2. Top Navigation Bar (3-Zone Contract) */}
      <Navbar
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenExportModal={() => setIsExportModalOpen(true)}
        totalPatientsCount={patients.length}
      />

      {/* Ingestion Toast Notification */}
      {notification && (
        <div className="bg-emerald-600 text-white text-xs px-4 py-2.5 shadow-md flex items-center justify-between transition-all animate-in slide-in-from-top-2">
          <div className="max-w-7xl mx-auto w-full flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{notification}</span>
            </div>
            <button
              onClick={() => setNotification(null)}
              className="text-white/80 hover:text-white font-bold ml-4"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* 3. Main Viewport Stage */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {activeTab === 'overview' && (
          <OverviewSection
            patients={patients}
            onSelectPatient={(id) => setSelectedPatientId(id)}
            onNavigateTab={(tab) => {
              setActiveTab(tab);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}

        {activeTab === 'cohorts' && (
          <CohortExplorer
            patients={patients}
            onSelectPatient={(id) => setSelectedPatientId(id)}
            onNavigateToTrends={() => {
              setActiveTab('trends');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onNavigateToIngest={() => {
              setActiveTab('ingest');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}

        {activeTab === 'trends' && (
          <VitalSignsTrend
            patients={patients}
            selectedPatientId={selectedPatientId}
            onSelectPatient={(id) => setSelectedPatientId(id)}
            onOpenSequenceModal={handleOpenSequenceModal}
          />
        )}

        {activeTab === 'ingest' && (
          <DatasetIngestionView
            currentPatientsCount={patients.length}
            onDatasetLoaded={handleDatasetLoaded}
            onResetToDefault20k={handleResetToDefault20k}
            onNavigateToCohorts={() => {
              setActiveTab('cohorts');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}

        {activeTab === 'metrics' && <ModelEvaluation />}

        {activeTab === 'ablation' && <MissingnessAblation />}
      </main>

      {/* 4. Clinical Research Footer */}
      <footer className="bg-white border-t border-slate-200 mt-12 py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-slate-700">SepsisPulse ICU</span>
            <span aria-hidden="true">·</span>
            <span>PhysioNet / Computing in Cardiology Challenge 2019 Dataset ({patients.length.toLocaleString()} Files)</span>
            <span aria-hidden="true">·</span>
            <span>1D Dilated ConvNet (6h Window, 6h Forecast Horizon)</span>
          </div>
          <div className="text-[11px] text-slate-400">
            For academic and algorithmic exploration only. Non-diagnostic investigational tool.
          </div>
        </div>
      </footer>

      {/* 5. Modals */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        patients={patients}
        selectedPatientId={selectedPatientId}
      />

      <SequenceInspectorModal
        isOpen={sequenceModalState.isOpen}
        onClose={() =>
          setSequenceModalState((prev) => ({ ...prev, isOpen: false }))
        }
        patient={sequencePatient}
        endHour={sequenceModalState.endHour}
      />
    </div>
  );
}
