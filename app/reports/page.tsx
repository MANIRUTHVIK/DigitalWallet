"use client";

import { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import Link from "next/link";
import { getReports } from "@/lib/actions/reports";
import ReportFilters from "@/components/ReportFilters";
import ReportCard from "@/components/ReportCard";

interface Report {
  id: string;
  title: string;
  description: string | null;
  fileType: string;
  fileUrl: string;
  uploadedAt: Date;
  vitals: Array<{
    id: string;
    vitalType: string;
    value: number;
    unit: string;
  }>;
}

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<{
    startDate?: string;
    endDate?: string;
    vitalType?: string;
  }>({});

  const loadReports = async () => {
    setLoading(true);
    const result = await getReports(filters);
    if (result.success) {
      setReports(result.reports);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const handleFilterChange = (newFilters: typeof filters) => {
    setFilters(newFilters);
  };

  const handleReportDeleted = () => {
    loadReports();
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Reports</h1>
          <Link
            href="/upload"
            className="inline-flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-5 w-5 mr-2" />
            Upload Report
          </Link>
        </div>

        {/* Filters */}
        <ReportFilters onFilterChange={handleFilterChange} />

        {/* Reports Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-blue-600"></div>
            <p className="mt-4 text-gray-600">Loading reports...</p>
          </div>
        ) : reports.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-600 mb-4">No reports found</p>
            <Link
              href="/upload"
              className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Upload Your First Report
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reports.map((report) => (
              <ReportCard
                key={report.id}
                report={report}
                onDelete={handleReportDeleted}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
