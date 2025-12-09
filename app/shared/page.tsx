"use client";

import { useState, useEffect } from "react";
import {
  getMyShareTokens,
  getSharedWithMe,
  revokeShareToken,
  createShareToken,
} from "@/lib/actions/sharing";
import { getReports } from "@/lib/actions/reports";
import { formatDate, formatDateTime } from "@/lib/utils";
import Navbar from "@/components/Navbar";
import {
  FileText,
  Image as ImageIcon,
  Calendar,
  Users,
  Link as LinkIcon,
  Trash2,
  ExternalLink,
  Lock,
  Mail,
  Plus,
  X,
} from "lucide-react";

export default function SharedPage() {
  const [activeTab, setActiveTab] = useState<"shared-by-me" | "shared-with-me">(
    "shared-by-me"
  );
  const [myShares, setMyShares] = useState<any[]>([]);
  const [sharedWithMe, setSharedWithMe] = useState<any[]>([]);
  const [myReports, setMyReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [revoking, setRevoking] = useState<string | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [selectedReports, setSelectedReports] = useState<string[]>([]);
  const [sharedWithEmail, setSharedWithEmail] = useState("");
  const [customExpiry, setCustomExpiry] = useState<string>("");
  const [useCustomExpiry, setUseCustomExpiry] = useState(false);
  const [expiresInDays, setExpiresInDays] = useState(7);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [mySharesResult, sharedWithMeResult, reportsResult] =
      await Promise.all([
        getMyShareTokens(),
        getSharedWithMe(),
        getReports({}),
      ]);

    if (mySharesResult.success) {
      setMyShares(mySharesResult.tokens);
    }

    if (sharedWithMeResult.success) {
      setSharedWithMe(sharedWithMeResult.sharedReports);
    }

    if (reportsResult.success) {
      setMyReports(reportsResult.reports);
    }

    setLoading(false);
  };

  const handleRevoke = async (token: string) => {
    if (
      !confirm(
        "Are you sure you want to revoke this share link? The recipient will no longer be able to access it."
      )
    ) {
      return;
    }

    setRevoking(token);
    const result = await revokeShareToken(token);

    if (result.success) {
      await loadData();
    } else {
      alert(result.error || "Failed to revoke share link");
    }
    setRevoking(null);
  };

  const handleCreateShare = async () => {
    if (!sharedWithEmail) {
      alert("Please enter the recipient&apos;s email address");
      return;
    }

    if (selectedReports.length === 0) {
      alert("Please select at least one report to share");
      return;
    }

    if (useCustomExpiry && !customExpiry) {
      alert("Please select an expiry date and time");
      return;
    }

    setCreating(true);

    const shareData: any = {
      reportIds: selectedReports,
      sharedWithEmail: sharedWithEmail.trim(),
    };

    if (useCustomExpiry) {
      shareData.expiresAt = new Date(customExpiry);
    } else {
      shareData.expiresInDays = expiresInDays;
    }

    const result = await createShareToken(shareData);

    if (result.success) {
      alert("Share link created successfully!");
      setShowShareModal(false);
      setSelectedReports([]);
      setSharedWithEmail("");
      setCustomExpiry("");
      setUseCustomExpiry(false);
      setExpiresInDays(7);
      await loadData();
    } else {
      alert(result.error || "Failed to create share link");
    }
    setCreating(false);
  };

  const toggleReportSelection = (reportId: string) => {
    setSelectedReports((prev) =>
      prev.includes(reportId)
        ? prev.filter((id) => id !== reportId)
        : [...prev, reportId]
    );
  };

  const copyLink = (token: string) => {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
    const link = `${appUrl}/share/${token}`;
    navigator.clipboard.writeText(link);
    alert("Link copied to clipboard!");
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-gray-50 py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-gray-600">Loading shared reports...</p>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Shared Reports
              </h1>
              <p className="mt-2 text-gray-600">
                Manage reports you&apos;ve shared and view reports shared with
                you
              </p>
            </div>
            <button
              onClick={() => setShowShareModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center"
            >
              <Plus className="h-5 w-5 mr-2" />
              Share Report
            </button>
          </div>

          {/* Tabs */}
          <div className="bg-white rounded-lg shadow mb-6">
            <div className="border-b border-gray-200">
              <nav className="flex -mb-px">
                <button
                  onClick={() => setActiveTab("shared-by-me")}
                  className={`flex-1 py-4 px-6 text-center border-b-2 font-medium text-sm ${
                    activeTab === "shared-by-me"
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <Users className="inline-block h-5 w-5 mr-2" />
                  Shared by Me ({myShares.length})
                </button>
                <button
                  onClick={() => setActiveTab("shared-with-me")}
                  className={`flex-1 py-4 px-6 text-center border-b-2 font-medium text-sm ${
                    activeTab === "shared-with-me"
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <Mail className="inline-block h-5 w-5 mr-2" />
                  Shared with Me ({sharedWithMe.length})
                </button>
              </nav>
            </div>
          </div>

          {/* Content */}
          {activeTab === "shared-by-me" ? (
            <div className="space-y-4">
              {myShares.length === 0 ? (
                <div className="bg-white rounded-lg shadow p-12 text-center">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No shared reports
                  </h3>
                  <p className="text-gray-600">
                    You haven&apos;t shared any reports yet. Go to your reports
                    and click Share to get started.
                  </p>
                </div>
              ) : (
                myShares.map((shareToken: any) => (
                  <div
                    key={shareToken.id}
                    className="bg-white rounded-lg shadow p-6"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <LinkIcon className="h-5 w-5 text-blue-600" />
                          <h3 className="text-lg font-semibold text-gray-900">
                            Share Link
                          </h3>
                          {shareToken.isRevoked && (
                            <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded">
                              Revoked
                            </span>
                          )}
                          {!shareToken.isRevoked &&
                            new Date() > new Date(shareToken.expiresAt) && (
                              <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded">
                                Expired
                              </span>
                            )}
                          {!shareToken.isRevoked &&
                            new Date() <= new Date(shareToken.expiresAt) && (
                              <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded">
                                Active
                              </span>
                            )}
                        </div>

                        {shareToken.sharedWithEmail && (
                          <div className="flex items-center text-sm text-blue-600 mb-2">
                            <Lock className="h-4 w-4 mr-1" />
                            Shared with: {shareToken.sharedWithEmail}
                          </div>
                        )}

                        <div className="text-sm text-gray-500 space-y-1">
                          <p>
                            <Calendar className="inline h-4 w-4 mr-1" />
                            Created: {formatDateTime(shareToken.createdAt)}
                          </p>
                          <p>Expires: {formatDateTime(shareToken.expiresAt)}</p>
                        </div>
                      </div>

                      <div className="flex space-x-2">
                        {!shareToken.isRevoked && (
                          <>
                            <button
                              onClick={() => copyLink(shareToken.token)}
                              className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                            >
                              Copy Link
                            </button>
                            <button
                              onClick={() => handleRevoke(shareToken.token)}
                              disabled={revoking === shareToken.token}
                              className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm disabled:bg-gray-400"
                            >
                              {revoking === shareToken.token ? (
                                "Revoking..."
                              ) : (
                                <>
                                  <Trash2 className="inline h-4 w-4 mr-1" />
                                  Revoke
                                </>
                              )}
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Shared Reports */}
                    <div className="border-t pt-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-3">
                        Reports in this share ({shareToken.sharedReports.length}
                        ):
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {shareToken.sharedReports.map((sr: any) => (
                          <div
                            key={sr.id}
                            className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg"
                          >
                            {sr.report.fileType === "pdf" ? (
                              <FileText className="h-8 w-8 text-red-500 flex-shrink-0" />
                            ) : (
                              <ImageIcon className="h-8 w-8 text-blue-500 flex-shrink-0" />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {sr.report.title}
                              </p>
                              <p className="text-xs text-gray-500">
                                {formatDate(sr.report.uploadedAt)}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {sharedWithMe.length === 0 ? (
                <div className="bg-white rounded-lg shadow p-12 text-center">
                  <Mail className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No reports shared with you
                  </h3>
                  <p className="text-gray-600">
                    When someone shares reports with your email, they will
                    appear here.
                  </p>
                </div>
              ) : (
                sharedWithMe.map((shareToken: any) => (
                  <div
                    key={shareToken.id}
                    className="bg-white rounded-lg shadow p-6"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <Users className="h-5 w-5 text-green-600" />
                          <h3 className="text-lg font-semibold text-gray-900">
                            Shared by {shareToken.user.firstName}{" "}
                            {shareToken.user.lastName}
                          </h3>
                        </div>

                        <div className="text-sm text-gray-500 space-y-1">
                          <p className="text-gray-600">
                            {shareToken.user.email}
                          </p>
                          <p>
                            <Calendar className="inline h-4 w-4 mr-1" />
                            Expires: {formatDateTime(shareToken.expiresAt)}
                          </p>
                        </div>
                      </div>

                      <a
                        href={`/share/${shareToken.token}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm inline-flex items-center"
                      >
                        View Reports
                        <ExternalLink className="ml-2 h-4 w-4" />
                      </a>
                    </div>

                    {/* Shared Reports */}
                    <div className="border-t pt-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-3">
                        Reports ({shareToken.sharedReports.length}):
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {shareToken.sharedReports.map((sr: any) => (
                          <div
                            key={sr.id}
                            className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg"
                          >
                            {sr.report.fileType === "pdf" ? (
                              <FileText className="h-8 w-8 text-red-500 flex-shrink-0" />
                            ) : (
                              <ImageIcon className="h-8 w-8 text-blue-500 flex-shrink-0" />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {sr.report.title}
                              </p>
                              {sr.report.description && (
                                <p className="text-xs text-gray-500 truncate">
                                  {sr.report.description}
                                </p>
                              )}
                              <p className="text-xs text-gray-500">
                                {formatDate(sr.report.uploadedAt)}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Share Reports</h2>
              <button
                onClick={() => setShowShareModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Email Input */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Recipient Email: <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={sharedWithEmail}
                onChange={(e) => setSharedWithEmail(e.target.value)}
                placeholder="user@example.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 bg-white text-black focus:ring-blue-500 focus:border-transparent"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Only this user can access the shared reports
              </p>
            </div>

            {/* Expiry Options */}
            <div className="mb-4">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={useCustomExpiry}
                  onChange={(e) => setUseCustomExpiry(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">
                  Set custom expiry date & time
                </span>
              </label>
            </div>

            {!useCustomExpiry ? (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Link expires in:
                </label>
                <select
                  value={expiresInDays}
                  onChange={(e) => setExpiresInDays(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 bg-white text-black focus:ring-blue-500 focus:border-transparent"
                >
                  <option value={1}>1 day</option>
                  <option value={3}>3 days</option>
                  <option value={7}>7 days</option>
                  <option value={14}>14 days</option>
                  <option value={30}>30 days</option>
                </select>
              </div>
            ) : (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Expires at:
                </label>
                <input
                  type="datetime-local"
                  value={customExpiry}
                  onChange={(e) => setCustomExpiry(e.target.value)}
                  min={new Date().toISOString().slice(0, 16)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 bg-white text-black focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            )}

            {/* Select Reports */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Select Reports to Share: <span className="text-red-500">*</span>
              </label>
              {myReports.length === 0 ? (
                <p className="text-gray-500 text-sm">
                  No reports available. Upload reports first to share them.
                </p>
              ) : (
                <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-lg p-3 space-y-2">
                  {myReports.map((report: any) => (
                    <label
                      key={report.id}
                      className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedReports.includes(report.id)}
                        onChange={() => toggleReportSelection(report.id)}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                      />
                      <div className="flex items-center space-x-3 flex-1">
                        {report.fileType === "pdf" ? (
                          <FileText className="h-6 w-6 text-red-500 flex-shrink-0" />
                        ) : (
                          <ImageIcon className="h-6 w-6 text-blue-500 flex-shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {report.title}
                          </p>
                          {report.description && (
                            <p className="text-xs text-gray-500 truncate">
                              {report.description}
                            </p>
                          )}
                          <p className="text-xs text-gray-400">
                            {formatDate(report.uploadedAt)}
                          </p>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              )}
              {selectedReports.length > 0 && (
                <p className="text-sm text-blue-600 mt-2">
                  {selectedReports.length} report
                  {selectedReports.length > 1 ? "s" : ""} selected
                </p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3">
              <button
                onClick={handleCreateShare}
                disabled={
                  creating || !sharedWithEmail || selectedReports.length === 0
                }
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                {creating ? "Creating..." : "Create Share Link"}
              </button>
              <button
                onClick={() => {
                  setShowShareModal(false);
                  setSelectedReports([]);
                  setSharedWithEmail("");
                  setCustomExpiry("");
                  setUseCustomExpiry(false);
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors bg-white text-black"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
