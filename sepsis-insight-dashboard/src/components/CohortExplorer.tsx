import { useState, useMemo, useEffect } from 'react';
import { PatientRecord, FilterState } from '../types/sepsis';
import { exportPatientsToCsv, exportTelemetryToCsv } from '../utils/exportCsv';
import { ensurePatientVitals } from '../data/sepsisDataset';
import {
  Search,
  Filter,
  Download,
  RotateCcw,
  ArrowRight,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Upload,
} from 'lucide-react';

interface CohortExplorerProps {
  patients: PatientRecord[];
  onSelectPatient: (patientId: string) => void;
  onNavigateToTrends: () => void;
  onNavigateToIngest?: () => void;
}

export function CohortExplorer({
  patients,
  onSelectPatient,
  onNavigateToTrends,
  onNavigateToIngest,
}: CohortExplorerProps) {
  const [filters, setFilters] = useState<FilterState>({
    unit: 'all',
    sepsisStatus: 'all',
    riskTier: 'all',
    gender: 'all',
    ageRange: [18, 95],
    searchQuery: '',
  });

  const [sortField, setSortField] = useState<keyof PatientRecord>('maxRiskScore');
  const [sortAsc, setSortAsc] = useState<boolean>(false);

  // Pagination states
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(50);
  const [jumpPageInput, setJumpPageInput] = useState<string>('');

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters, pageSize]);

  // Apply filters
  const filteredPatients = useMemo(() => {
    const q = filters.searchQuery.trim().toLowerCase();
    return patients.filter((p) => {
      // Search query
      if (q && !p.patientId.toLowerCase().includes(q) && !p.sourceFile.toLowerCase().includes(q)) {
        return false;
      }

      // Unit
      if (filters.unit !== 'all' && p.unit !== filters.unit) {
        return false;
      }

      // Sepsis status
      if (filters.sepsisStatus === 'sepsis' && !p.sepsisDeveloped) {
        return false;
      }
      if (filters.sepsisStatus === 'no-sepsis' && p.sepsisDeveloped) {
        return false;
      }

      // Risk Tier
      if (filters.riskTier !== 'all' && p.riskTier !== filters.riskTier) {
        return false;
      }

      // Gender
      if (filters.gender !== 'all' && p.gender !== filters.gender) {
        return false;
      }

      // Age range
      if (p.age < filters.ageRange[0] || p.age > filters.ageRange[1]) {
        return false;
      }

      return true;
    });
  }, [patients, filters]);

  // Apply sorting
  const sortedPatients = useMemo(() => {
    return [...filteredPatients].sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];

      if (aVal === null) aVal = 0;
      if (bVal === null) bVal = 0;

      if (aVal < bVal) return sortAsc ? -1 : 1;
      if (aVal > bVal) return sortAsc ? 1 : -1;
      return 0;
    });
  }, [filteredPatients, sortField, sortAsc]);

  const totalPages = Math.max(1, Math.ceil(sortedPatients.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedPatients = useMemo(() => {
    const start = (safeCurrentPage - 1) * pageSize;
    return sortedPatients.slice(start, start + pageSize);
  }, [sortedPatients, safeCurrentPage, pageSize]);

  const handleSort = (field: keyof PatientRecord) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  const handleResetFilters = () => {
    setFilters({
      unit: 'all',
      sepsisStatus: 'all',
      riskTier: 'all',
      gender: 'all',
      ageRange: [18, 95],
      searchQuery: '',
    });
  };

  const handleJumpPage = (e: React.FormEvent) => {
    e.preventDefault();
    const p = parseInt(jumpPageInput, 10);
    if (!isNaN(p) && p >= 1 && p <= totalPages) {
      setCurrentPage(p);
      setJumpPageInput('');
    }
  };

  const startRecordIdx = (safeCurrentPage - 1) * pageSize + 1;
  const endRecordIdx = Math.min(sortedPatients.length, safeCurrentPage * pageSize);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-sky-700 mb-1">
            <span>High-Capacity Cohort Database</span>
            <span aria-hidden="true">·</span>
            <span>{patients.length.toLocaleString()} Patient Records</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            ICU Patient Cohort Explorer
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Filter, inspect, and export time-series sequences across Medical and Surgical Intensive Care Units.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {onNavigateToIngest && (
            <button
              onClick={onNavigateToIngest}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-sky-700 hover:bg-sky-800 rounded-lg transition-colors shadow-xs cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Ingest 20,643 Files / ZIP</span>
            </button>
          )}

          <button
            onClick={() => exportPatientsToCsv(filteredPatients)}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-800 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 active:bg-slate-100 transition-colors shadow-xs cursor-pointer"
            aria-label="Export filtered patients to CSV"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-sky-700" />
            <span>Export Filtered ({filteredPatients.length.toLocaleString()} CSV)</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search ID (e.g. P002841, P015402)..."
              value={filters.searchQuery}
              onChange={(e) => setFilters({ ...filters, searchQuery: e.target.value })}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-sky-600 bg-slate-50/50"
            />
          </div>

          {/* Unit Filter */}
          <div>
            <select
              value={filters.unit}
              onChange={(e) => setFilters({ ...filters, unit: e.target.value as any })}
              className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-sky-600 bg-white text-slate-700"
              aria-label="Filter by ICU Unit"
            >
              <option value="all">All Units (MICU & SICU)</option>
              <option value="MICU">MICU (Medical ICU)</option>
              <option value="SICU">SICU (Surgical ICU)</option>
            </select>
          </div>

          {/* Sepsis Status Filter */}
          <div>
            <select
              value={filters.sepsisStatus}
              onChange={(e) => setFilters({ ...filters, sepsisStatus: e.target.value as any })}
              className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-sky-600 bg-white text-slate-700"
              aria-label="Filter by Sepsis Outcome"
            >
              <option value="all">All Sepsis Outcomes</option>
              <option value="sepsis">Sepsis Positive (Onset Verified)</option>
              <option value="no-sepsis">Non-Sepsis Control</option>
            </select>
          </div>

          {/* Risk Tier Filter */}
          <div>
            <select
              value={filters.riskTier}
              onChange={(e) => setFilters({ ...filters, riskTier: e.target.value as any })}
              className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-sky-600 bg-white text-slate-700"
              aria-label="Filter by Risk Tier"
            >
              <option value="all">All Risk Tiers</option>
              <option value="Low">Low (&lt;0.30)</option>
              <option value="Moderate">Moderate (0.30–0.49)</option>
              <option value="High">High (0.50–0.74)</option>
              <option value="Critical">Critical (≥0.75)</option>
            </select>
          </div>

          {/* Gender Filter */}
          <div className="flex items-center gap-2">
            <select
              value={filters.gender}
              onChange={(e) => setFilters({ ...filters, gender: e.target.value as any })}
              className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-sky-600 bg-white text-slate-700"
              aria-label="Filter by Sex"
            >
              <option value="all">All Genders</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>

            <button
              onClick={handleResetFilters}
              title="Reset all filters"
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              aria-label="Reset filters"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Active Filter Metrics */}
        <div className="flex flex-wrap items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100 gap-2">
          <div>
            Showing <strong className="text-slate-900 font-mono">{filteredPatients.length.toLocaleString()}</strong> of{' '}
            <strong className="text-slate-900 font-mono">{patients.length.toLocaleString()}</strong> registered patients
          </div>
          <div className="flex items-center gap-3 text-[11px]">
            <span>
              Sepsis Cases:{' '}
              <strong className="text-red-700 font-mono">
                {filteredPatients.filter((p) => p.sepsisDeveloped).length.toLocaleString()}
              </strong>
            </span>
            <span aria-hidden="true">·</span>
            <span>
              Controls:{' '}
              <strong className="text-slate-700 font-mono">
                {filteredPatients.filter((p) => !p.sepsisDeveloped).length.toLocaleString()}
              </strong>
            </span>
          </div>
        </div>
      </div>

      {/* Cohort Data Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200/80 text-slate-600 uppercase tracking-wider text-[11px] font-semibold">
              <tr>
                <th
                  onClick={() => handleSort('patientId')}
                  className="px-4 py-3 cursor-pointer hover:text-slate-900"
                >
                  Patient ID {sortField === 'patientId' ? (sortAsc ? '↑' : '↓') : ''}
                </th>
                <th
                  onClick={() => handleSort('unit')}
                  className="px-4 py-3 cursor-pointer hover:text-slate-900"
                >
                  Unit {sortField === 'unit' ? (sortAsc ? '↑' : '↓') : ''}
                </th>
                <th
                  onClick={() => handleSort('age')}
                  className="px-4 py-3 cursor-pointer hover:text-slate-900"
                >
                  Age / Sex {sortField === 'age' ? (sortAsc ? '↑' : '↓') : ''}
                </th>
                <th
                  onClick={() => handleSort('iculos')}
                  className="px-4 py-3 cursor-pointer hover:text-slate-900"
                >
                  Stay (ICULOS) {sortField === 'iculos' ? (sortAsc ? '↑' : '↓') : ''}
                </th>
                <th
                  onClick={() => handleSort('sepsisDeveloped')}
                  className="px-4 py-3 cursor-pointer hover:text-slate-900"
                >
                  Sepsis Status {sortField === 'sepsisDeveloped' ? (sortAsc ? '↑' : '↓') : ''}
                </th>
                <th
                  onClick={() => handleSort('maxRiskScore')}
                  className="px-4 py-3 cursor-pointer hover:text-slate-900 text-right"
                >
                  Max CNN Score {sortField === 'maxRiskScore' ? (sortAsc ? '↑' : '↓') : ''}
                </th>
                <th
                  onClick={() => handleSort('latestRiskScore')}
                  className="px-4 py-3 cursor-pointer hover:text-slate-900 text-right"
                >
                  Latest Score {sortField === 'latestRiskScore' ? (sortAsc ? '↑' : '↓') : ''}
                </th>
                <th className="px-4 py-3">Risk Tier</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedPatients.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-slate-400">
                    No patients match the selected filter criteria.
                  </td>
                </tr>
              ) : (
                paginatedPatients.map((patient) => {
                  return (
                    <tr
                      key={patient.patientId}
                      className="hover:bg-sky-50/40 transition-colors"
                    >
                      {/* Patient ID */}
                      <td className="px-4 py-3 font-mono font-bold text-slate-900 whitespace-nowrap">
                        {patient.patientId}
                      </td>

                      {/* Unit */}
                      <td className="px-4 py-3 text-slate-700 whitespace-nowrap">
                        <span className="font-medium">{patient.unit}</span>
                      </td>

                      {/* Age & Sex */}
                      <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                        <span>{patient.age}y</span>
                        <span className="mx-1 text-slate-300">·</span>
                        <span>{patient.gender}</span>
                      </td>

                      {/* Stay */}
                      <td className="px-4 py-3 font-mono tabular-nums text-slate-700 whitespace-nowrap">
                        {patient.iculos} hrs
                      </td>

                      {/* Sepsis Status */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        {patient.sepsisDeveloped ? (
                          <div className="flex items-center gap-1.5 text-red-700 font-medium">
                            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                            <span>Onset @ H-{patient.sepsisOnsetHour ?? '—'}</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-slate-600">
                            <CheckCircle className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>Non-Sepsis Stay</span>
                          </div>
                        )}
                      </td>

                      {/* Max Risk Score */}
                      <td className="px-4 py-3 font-mono tabular-nums text-right font-bold whitespace-nowrap">
                        <span
                          className={
                            patient.maxRiskScore >= 0.75
                              ? 'text-red-700'
                              : patient.maxRiskScore >= 0.50
                              ? 'text-orange-700'
                              : patient.maxRiskScore >= 0.30
                              ? 'text-amber-700'
                              : 'text-sky-700'
                          }
                        >
                          {(patient.maxRiskScore * 100).toFixed(1)}%
                        </span>
                      </td>

                      {/* Latest Risk Score */}
                      <td className="px-4 py-3 font-mono tabular-nums text-right text-slate-600 whitespace-nowrap">
                        {(patient.latestRiskScore * 100).toFixed(1)}%
                      </td>

                      {/* Risk Tier */}
                      <td className="px-4 py-3 whitespace-nowrap text-slate-700 font-medium">
                        <span
                          className={
                            patient.riskTier === 'Critical'
                              ? 'text-red-700'
                              : patient.riskTier === 'High'
                              ? 'text-orange-700'
                              : patient.riskTier === 'Moderate'
                              ? 'text-amber-700'
                              : 'text-slate-600'
                          }
                        >
                          {patient.riskTier}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-2">
                          <button
                            onClick={() => {
                              ensurePatientVitals(patient);
                              onSelectPatient(patient.patientId);
                              onNavigateToTrends();
                            }}
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-sky-700 hover:text-sky-900 hover:bg-sky-50 px-2 py-1 rounded transition-colors cursor-pointer"
                            title="Inspect continuous vital signs trend"
                          >
                            <span>Inspect</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>

                          <button
                            onClick={() => {
                              ensurePatientVitals(patient);
                              exportTelemetryToCsv(patient);
                            }}
                            className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded transition-colors cursor-pointer"
                            title="Download hourly telemetry CSV"
                            aria-label={`Download hourly telemetry CSV for ${patient.patientId}`}
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* High-Performance Pagination Bar */}
        <div className="p-4 border-t border-slate-200 bg-slate-50/70 flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-3">
            <span className="text-slate-600">
              Showing <strong className="font-mono text-slate-900">{startRecordIdx.toLocaleString()}</strong>–
              <strong className="font-mono text-slate-900">{endRecordIdx.toLocaleString()}</strong> of{' '}
              <strong className="font-mono text-slate-900">{sortedPatients.length.toLocaleString()}</strong>
            </span>

            <div className="flex items-center gap-1.5 ml-2">
              <span className="text-slate-500">Rows:</span>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(parseInt(e.target.value, 10))}
                className="px-2 py-1 text-xs rounded border border-slate-200 bg-white text-slate-700 font-mono"
              >
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
                <option value={250}>250</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* First & Prev */}
            <button
              onClick={() => setCurrentPage(1)}
              disabled={safeCurrentPage === 1}
              className="p-1.5 rounded border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 transition-colors"
              title="First Page"
            >
              <ChevronsLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={safeCurrentPage === 1}
              className="p-1.5 rounded border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 transition-colors"
              title="Previous Page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {/* Page indicator */}
            <span className="font-mono text-xs px-2 text-slate-700">
              Page <strong>{safeCurrentPage}</strong> of <strong>{totalPages}</strong>
            </span>

            {/* Next & Last */}
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={safeCurrentPage === totalPages}
              className="p-1.5 rounded border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 transition-colors"
              title="Next Page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={safeCurrentPage === totalPages}
              className="p-1.5 rounded border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 transition-colors"
              title="Last Page"
            >
              <ChevronsRight className="w-4 h-4" />
            </button>

            {/* Direct Jump to page */}
            <form onSubmit={handleJumpPage} className="flex items-center gap-1.5 ml-2">
              <input
                type="number"
                min={1}
                max={totalPages}
                placeholder="Go to..."
                value={jumpPageInput}
                onChange={(e) => setJumpPageInput(e.target.value)}
                className="w-16 px-2 py-1 text-xs rounded border border-slate-200 bg-white text-slate-700 font-mono text-center"
              />
              <button
                type="submit"
                className="px-2 py-1 text-xs font-semibold rounded bg-slate-200 hover:bg-slate-300 text-slate-800 transition-colors"
              >
                Go
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
