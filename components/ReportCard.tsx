"use client";

import { useState } from "react";
import Link from "next/link";
import { FileText, Image as ImageIcon, Calendar, Trash2 } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { deleteReport } from "@/lib/actions/reports";

interface Report {
  id: string;
  title: string;
  description: string | null;
  summary?: string | null;
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

interface ReportCardProps {
  report: Report;
  onDelete?: () => void;
}

export default function ReportCard({ report, onDelete }: ReportCardProps) {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this report?")) {
      return;
    }

    setDeleting(true);
    const result = await deleteReport(report.id);

    if (result.success) {
      onDelete?.();
    } else {
      alert(result.error || "Failed to delete report");
      setDeleting(false);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-start space-x-3 flex-1">
          <div className="flex-shrink-0">
            {report.fileType === "pdf" ? (
              <FileText className="h-10 w-10 text-red-500" />
            ) : (
              <ImageIcon className="h-10 w-10 text-blue-500" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <Link href={`/reports/${report.id}`}>
              <h3 className="font-semibold text-gray-900 hover:text-blue-600 truncate">
                {report.title}
              </h3>
            </Link>
            {report.summary && (
              <p className="text-xs text-gray-600 mt-1 line-clamp-2 italic">
                {report.summary}
              </p>
            )}
            {report.description && !report.summary && (
              <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                {report.description}
              </p>
            )}
            <div className="flex items-center mt-2 text-sm text-gray-500">
              <Calendar className="h-4 w-4 mr-1" />
              {formatDate(report.uploadedAt)}
            </div>
          </div>
        </div>

        <button
          onClick={handleDelete}
          disabled={deleting}
          className="text-gray-400 hover:text-red-500 disabled:opacity-50 ml-2"
          title="Delete report"
        >
          <Trash2 className="h-5 w-5" />
        </button>
      </div>

      {report.vitals.length > 0 && (
        <div className="pt-3 border-t">
          <p className="text-xs text-gray-500 mb-2">
            {report.vitals.length} vital{report.vitals.length !== 1 ? "s" : ""}{" "}
            recorded
          </p>
          <div className="flex flex-wrap gap-2">
            {report.vitals.slice(0, 3).map((vital) => (
              <span
                key={vital.id}
                className="inline-block px-2 py-1 text-xs bg-blue-50 text-blue-700 rounded"
              >
                {vital.value} {vital.unit}
              </span>
            ))}
            {report.vitals.length > 3 && (
              <span className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                +{report.vitals.length - 3} more
              </span>
            )}
          </div>
        </div>
      )}

      <div className="mt-3 pt-3 border-t">
        <Link
          href={`/reports/${report.id}`}
          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          View Details →
        </Link>
      </div>
    </div>
  );
}
