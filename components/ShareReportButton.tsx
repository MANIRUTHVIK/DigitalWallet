"use client";

import { useState } from "react";
import { Share2 } from "lucide-react";
import { createShareToken } from "@/lib/actions/sharing";

interface ShareReportButtonProps {
  reportIds: string[];
}

export default function ShareReportButton({
  reportIds,
}: ShareReportButtonProps) {
  const [showModal, setShowModal] = useState(false);
  const [expiresInDays, setExpiresInDays] = useState(7);
  const [customExpiry, setCustomExpiry] = useState<string>("");
  const [useCustomExpiry, setUseCustomExpiry] = useState(false);
  const [sharedWithEmail, setSharedWithEmail] = useState("");
  const [creating, setCreating] = useState(false);
  const [shareLink, setShareLink] = useState<string | null>(null);

  const handleCreateShare = async () => {
    // Email is now required
    if (!sharedWithEmail) {
      alert("Please enter the recipient's email address");
      return;
    }

    // Validate custom expiry if enabled
    if (useCustomExpiry && !customExpiry) {
      alert("Please select an expiry date and time");
      return;
    }

    setCreating(true);

    const shareData: any = {
      reportIds,
      sharedWithEmail: sharedWithEmail.trim(),
    };

    if (useCustomExpiry) {
      shareData.expiresAt = new Date(customExpiry);
    } else {
      shareData.expiresInDays = expiresInDays;
    }

    const result = await createShareToken(shareData);

    if (result.success && result.token) {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
      setShareLink(`${appUrl}/share/${result.token}`);
    } else {
      alert(result.error || "Failed to create share link");
    }
    setCreating(false);
  };

  const handleCopyLink = () => {
    if (shareLink) {
      navigator.clipboard.writeText(shareLink);
      alert("Link copied to clipboard!");
    }
  };

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        <Share2 className="h-4 w-4 mr-2" />
        Share
      </button>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Share Report{reportIds.length > 1 ? "s" : ""}
            </h2>

            {!shareLink ? (
              <>
                <p className="text-gray-600 mb-4">
                  Create a secure link to share {reportIds.length} report
                  {reportIds.length > 1 ? "s" : ""}.
                </p>

                {/* Email Input - Now Required */}
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
                    Only this user can access the shared report
                  </p>
                </div>

                {/* Expiry options */}
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

                <div className="flex space-x-3">
                  <button
                    onClick={handleCreateShare}
                    disabled={creating}
                    className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                  >
                    {creating ? "Creating..." : "Create Share Link"}
                  </button>
                  <button
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors  bg-white text-black"
                  >
                    Cancel
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="text-gray-600 mb-4">
                  Your share link has been created!
                </p>

                <div className="bg-gray-50 p-3 rounded-lg mb-4 break-all">
                  <code className="text-sm text-gray-800">{shareLink}</code>
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={handleCopyLink}
                    className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg  hover:bg-blue-700 transition-colors"
                  >
                    Copy Link
                  </button>
                  <button
                    onClick={() => {
                      setShowModal(false);
                      setShareLink(null);
                    }}
                    className="px-4 py-2 border  bg-white text-black border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
