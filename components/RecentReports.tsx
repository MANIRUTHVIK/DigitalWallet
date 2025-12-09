"use client";

import Link from "next/link";
import { FileText, Image as ImageIcon, Calendar } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface Report {
  id: string;
  title: string;
  fileType: string;
  uploadedAt: Date;
  vitals: Array<{
    id: string;
    vitalType: string;
  }>;
}

interface RecentReportsProps {
  reports: Report[];
}

export default function RecentReports({ reports }: RecentReportsProps) {
  if (reports.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Recent Reports
        </h3>
        <p className="text-gray-500 text-center py-8">
          No reports uploaded yet
        </p>
        <div className="text-center">
          <Link
            href="/upload"
            className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Upload Your First Report
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Recent Reports</h3>
        <Link
          href="/reports"
          className="text-sm text-blue-600 hover:text-blue-700"
        >
          View All
        </Link>
      </div>

      <div className="space-y-3">
        {reports.map((report) => (
          <Link
            key={report.id}
            href={`/reports/${report.id}`}
            className="block p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-md transition-all"
          >
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                {report.fileType === "pdf" ? (
                  <FileText className="h-8 w-8 text-red-500" />
                ) : (
                  <ImageIcon className="h-8 w-8 text-blue-500" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 truncate">
                  {report.title}
                </p>
                <div className="flex items-center mt-1 text-sm text-gray-500">
                  <Calendar className="h-4 w-4 mr-1" />
                  {formatDate(report.uploadedAt)}
                </div>
                {report.vitals.length > 0 && (
                  <p className="text-xs text-gray-500 mt-1">
                    {report.vitals.length} vital
                    {report.vitals.length !== 1 ? "s" : ""} recorded
                  </p>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
