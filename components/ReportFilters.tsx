"use client";

import { useState } from "react";
import { Filter, X } from "lucide-react";
import { VITAL_TYPES, VITAL_LABELS } from "@/lib/constants";

interface ReportFiltersProps {
  onFilterChange: (filters: {
    startDate?: string;
    endDate?: string;
    vitalType?: string;
  }) => void;
}

export default function ReportFilters({ onFilterChange }: ReportFiltersProps) {
  const [showFilters, setShowFilters] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [vitalType, setVitalType] = useState("");

  const handleApplyFilters = () => {
    onFilterChange({
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      vitalType: vitalType || undefined,
    });
  };

  const handleClearFilters = () => {
    setStartDate("");
    setEndDate("");
    setVitalType("");
    onFilterChange({});
  };

  return (
    <div className="bg-white rounded-lg shadow p-4 mb-6">
      <button
        onClick={() => setShowFilters(!showFilters)}
        className="flex items-center text-gray-700 hover:text-gray-900"
      >
        <Filter className="h-5 w-5 mr-2" />
        Filters
      </button>

      {showFilters && (
        <div className="mt-4 pt-4 border-t space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Vital Type
              </label>
              <select
                value={vitalType}
                onChange={(e) => setVitalType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Types</option>
                {Object.entries(VITAL_TYPES).map(([key, value]) => (
                  <option key={key} value={value}>
                    {VITAL_LABELS[value as keyof typeof VITAL_LABELS]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex space-x-3">
            <button
              onClick={handleApplyFilters}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Apply Filters
            </button>
            <button
              onClick={handleClearFilters}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center"
            >
              <X className="h-4 w-4 mr-1" />
              Clear
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
