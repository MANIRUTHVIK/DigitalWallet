import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Download } from "lucide-react";
import { getReportById } from "@/lib/actions/reports";
import { formatDateTime } from "@/lib/utils";
import { VITAL_LABELS } from "@/lib/constants";
import ShareReportButton from "@/components/ShareReportButton";

export default async function ReportDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await getReportById(id);

  if (!result.success || !result.report) {
    notFound();
  }

  const { report } = result;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/reports"
            className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Reports
          </Link>

          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {report.title}
              </h1>
              {report.description && (
                <p className="text-gray-600 mt-2">{report.description}</p>
              )}
              {report.summary && (
                <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm font-semibold text-blue-900 mb-1">
                    AI Summary
                  </p>
                  <p className="text-sm text-blue-800">{report.summary}</p>
                </div>
              )}
              <p className="text-sm text-gray-500 mt-2">
                Uploaded: {formatDateTime(report.uploadedAt)}
              </p>
            </div>

            <div className="flex space-x-2">
              <a
                href={report.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg  bg-white text-black hover:bg-gray-50 transition-colors"
              >
                <Download className="h-4 w-4 mr-2 bg-white text-black" />
                Download
              </a>
              <ShareReportButton reportIds={[report.id]} />
            </div>
          </div>
        </div>

        {/* File Preview */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            File Preview
          </h2>
          {report.fileType === "pdf" ? (
            <iframe
              src={report.fileUrl}
              className="w-full h-[600px] border border-gray-300 rounded"
              title={report.title}
            />
          ) : (
            <img
              src={report.fileUrl}
              alt={report.title}
              className="max-w-full h-auto rounded"
            />
          )}
        </div>

        {/* Vitals */}
        {report.vitals.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Recorded Vitals
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {report.vitals.map((vital: any) => (
                <div
                  key={vital.id}
                  className="border border-gray-200 rounded-lg p-4"
                >
                  <p className="text-sm text-gray-600 mb-1">
                    {VITAL_LABELS[
                      vital.vitalType as keyof typeof VITAL_LABELS
                    ] || vital.vitalType}
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {vital.value}{" "}
                    <span className="text-sm text-gray-600">{vital.unit}</span>
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {formatDateTime(vital.recordedAt)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
