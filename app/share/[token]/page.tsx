import { validateShareToken } from "@/lib/actions/sharing";
import Link from "next/link";
import {
  FileText,
  Image as ImageIcon,
  Calendar,
  Activity,
  Lock,
} from "lucide-react";
import { formatDate, formatDateTime } from "@/lib/utils";
import { VITAL_LABELS } from "@/lib/constants";
import { currentUser } from "@clerk/nextjs/server";

export default async function SharedReportPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  // Get current user's email if they're signed in
  const user = await currentUser();
  const userEmail = user?.emailAddresses[0]?.emailAddress;

  const result = await validateShareToken(token, userEmail);

  if (!result.success || !result.data) {
    const requiresAuth = (result as any).requiresAuth;
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <div
            className={`${
              requiresAuth ? "text-blue-500" : "text-red-500"
            } mb-4`}
          >
            {requiresAuth ? (
              <Lock className="h-16 w-16 mx-auto" />
            ) : (
              <svg
                className="h-16 w-16 mx-auto"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            )}
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {requiresAuth ? "Authentication Required" : "Invalid Share Link"}
          </h1>
          <p className="text-gray-600 mb-4">
            {result.error || "This share link is not valid."}
          </p>
          {requiresAuth && (
            <Link
              href="/sign-in"
              className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Sign In
            </Link>
          )}
        </div>
      </div>
    );
  }

  const { reports, owner, expiresAt, sharedWithEmail } = result.data;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Shared Health Reports
          </h1>
          <p className="text-gray-600">
            Shared by {owner.firstName} {owner.lastName}
          </p>
          {sharedWithEmail && (
            <p className="text-sm text-blue-600 mt-1 flex items-center">
              <Lock className="h-4 w-4 mr-1" />
              Restricted access - Shared with {sharedWithEmail}
            </p>
          )}
          <p className="text-sm text-gray-500 mt-1">
            This link expires on {formatDateTime(expiresAt)}
          </p>
        </div>

        {/* Reports */}
        <div className="space-y-6">
          {reports.map((report: any) => (
            <div key={report.id} className="bg-white rounded-lg shadow p-6">
              {/* Report Header */}
              <div className="flex items-start space-x-4 mb-4">
                <div className="flex-shrink-0">
                  {report.fileType === "pdf" ? (
                    <FileText className="h-12 w-12 text-red-500" />
                  ) : (
                    <ImageIcon className="h-12 w-12 text-blue-500" />
                  )}
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-semibold text-gray-900">
                    {report.title}
                  </h2>
                  {report.description && (
                    <p className="text-gray-600 mt-1">{report.description}</p>
                  )}
                  <div className="flex items-center mt-2 text-sm text-gray-500">
                    <Calendar className="h-4 w-4 mr-1" />
                    Uploaded: {formatDate(report.uploadedAt)}
                  </div>
                </div>
              </div>

              {/* File Preview */}
              <div className="mb-4">
                {report.fileType === "pdf" ? (
                  <iframe
                    src={report.fileUrl}
                    className="w-full h-[500px] border border-gray-300 rounded"
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
              {report.vitals && report.vitals.length > 0 && (
                <div className="pt-4 border-t">
                  <div className="flex items-center mb-3">
                    <Activity className="h-5 w-5 text-blue-600 mr-2" />
                    <h3 className="text-lg font-semibold text-gray-900">
                      Recorded Vitals
                    </h3>
                  </div>
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
                          <span className="text-sm text-gray-600">
                            {vital.unit}
                          </span>
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
          ))}
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>
            This is a secure temporary link to view health reports.
            <br />
            Do not share this link with others.
          </p>
        </div>
      </div>
    </div>
  );
}
