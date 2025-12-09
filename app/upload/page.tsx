"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Upload, FileText, Image as ImageIcon, X } from "lucide-react";
import { saveReport } from "@/lib/actions/reports";
import { saveVitals } from "@/lib/actions/vitals";
import { VITAL_TYPES, VITAL_UNITS } from "@/lib/constants";

interface CloudinaryResponse {
  secure_url: string;
  public_id: string;
  format: string;
  resource_type: string;
}

export default function UploadPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [uploading, setUploading] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Vitals form state
  const [vitals, setVitals] = useState({
    bloodPressureSystolic: "",
    bloodPressureDiastolic: "",
    heartRate: "",
    spo2: "",
    bloodSugar: "",
    hemoglobin: "",
    cholesterol: "",
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setError(null);

    // Generate preview for images
    if (selectedFile.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
    } else if (selectedFile.type === "application/pdf") {
      setPreview("pdf");
    }
  };

  const removeFile = () => {
    setFile(null);
    setPreview(null);
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!file) {
      setError("Please select a file");
      return;
    }

    if (!title.trim()) {
      setError("Please enter a title");
      return;
    }

    setUploading(true);
    setError(null);

    try {
      // Get Cloudinary signature
      const signatureResponse = await fetch("/api/cloudinary-signature", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folder: "health-wallet" }),
      });

      if (!signatureResponse.ok) {
        throw new Error("Failed to get upload signature");
      }

      const { signature, timestamp, cloudName, apiKey, folder } =
        await signatureResponse.json();

      // Upload to Cloudinary
      const formData = new FormData();
      formData.append("file", file);
      formData.append("signature", signature);
      formData.append("timestamp", timestamp.toString());
      formData.append("api_key", apiKey);
      formData.append("folder", folder);

      const uploadResponse = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json().catch(() => ({}));
        console.error("Cloudinary upload error:", errorData);
        throw new Error(
          errorData?.error?.message ||
            "Failed to upload file to Cloudinary. Please check your credentials."
        );
      }

      const cloudinaryData: CloudinaryResponse = await uploadResponse.json();

      // Determine file type
      const fileType =
        cloudinaryData.resource_type === "image" ? "image" : "pdf";

      // Check if any vitals were manually entered
      const hasManualVitals =
        vitals.bloodPressureSystolic ||
        vitals.bloodPressureDiastolic ||
        vitals.heartRate ||
        vitals.spo2 ||
        vitals.bloodSugar ||
        vitals.hemoglobin ||
        vitals.cholesterol;

      // Extract vitals and summary from report using AI
      let extractedVitals: any[] = [];
      let aiSummary: string | undefined = undefined;

      try {
        setExtracting(true);

        const extractionResponse = await fetch("/api/extract-vitals", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fileUrl: cloudinaryData.secure_url,
            fileType,
          }),
        });

        if (extractionResponse.ok) {
          const extractionResult = await extractionResponse.json();

          if (extractionResult.error) {
            console.error("[UPLOAD] Extraction error:", extractionResult.error);
          }
          if (extractionResult.success) {
            // Only use extracted vitals if none were manually entered
            if (!hasManualVitals && extractionResult.vitals) {
              extractedVitals = extractionResult.vitals;
            }
            // Always save the AI summary
            if (extractionResult.summary) {
              aiSummary = extractionResult.summary;
            }
          }
        }
      } catch (extractError) {
        console.error("Failed to extract vitals:", extractError);
        // Continue without extracted vitals/summary
      } finally {
        setExtracting(false);
      }

      const reportResult = await saveReport({
        title: title.trim(),
        description: description.trim() || undefined,
        summary: aiSummary,
        fileUrl: cloudinaryData.secure_url,
        fileType,
        publicId: cloudinaryData.public_id,
        uploadedAt: new Date().toISOString(),
      });

      if (!reportResult.success) {
        throw new Error(reportResult.error || "Failed to save report");
      }

      // Save vitals if provided (manual or extracted)
      const vitalsToSave = [];
      const recordedAt = new Date().toISOString();

      // Build manual vitals map to track which ones are entered
      const manualVitalsMap = new Map<string, any>();

      // Add manually entered vitals
      if (vitals.bloodPressureSystolic && vitals.bloodPressureDiastolic) {
        const vital = {
          reportId: reportResult.reportId!,
          vitalType: VITAL_TYPES.BLOOD_PRESSURE,
          value: parseFloat(
            `${vitals.bloodPressureSystolic}.${vitals.bloodPressureDiastolic}`
          ),
          unit: VITAL_UNITS[VITAL_TYPES.BLOOD_PRESSURE],
          recordedAt,
        };
        vitalsToSave.push(vital);
        manualVitalsMap.set(VITAL_TYPES.BLOOD_PRESSURE, vital);
      }

      if (vitals.heartRate) {
        const vital = {
          reportId: reportResult.reportId!,
          vitalType: VITAL_TYPES.HEART_RATE,
          value: parseFloat(vitals.heartRate),
          unit: VITAL_UNITS[VITAL_TYPES.HEART_RATE],
          recordedAt,
        };
        vitalsToSave.push(vital);
        manualVitalsMap.set(VITAL_TYPES.HEART_RATE, vital);
      }

      if (vitals.spo2) {
        const vital = {
          reportId: reportResult.reportId!,
          vitalType: VITAL_TYPES.SPO2,
          value: parseFloat(vitals.spo2),
          unit: VITAL_UNITS[VITAL_TYPES.SPO2],
          recordedAt,
        };
        vitalsToSave.push(vital);
        manualVitalsMap.set(VITAL_TYPES.SPO2, vital);
      }

      if (vitals.bloodSugar) {
        const vital = {
          reportId: reportResult.reportId!,
          vitalType: VITAL_TYPES.BLOOD_SUGAR,
          value: parseFloat(vitals.bloodSugar),
          unit: VITAL_UNITS[VITAL_TYPES.BLOOD_SUGAR],
          recordedAt,
        };
        vitalsToSave.push(vital);
        manualVitalsMap.set(VITAL_TYPES.BLOOD_SUGAR, vital);
      }

      if (vitals.hemoglobin) {
        const vital = {
          reportId: reportResult.reportId!,
          vitalType: VITAL_TYPES.HEMOGLOBIN,
          value: parseFloat(vitals.hemoglobin),
          unit: VITAL_UNITS[VITAL_TYPES.HEMOGLOBIN],
          recordedAt,
        };
        vitalsToSave.push(vital);
        manualVitalsMap.set(VITAL_TYPES.HEMOGLOBIN, vital);
      }

      if (vitals.cholesterol) {
        const vital = {
          reportId: reportResult.reportId!,
          vitalType: VITAL_TYPES.CHOLESTEROL,
          value: parseFloat(vitals.cholesterol),
          unit: VITAL_UNITS[VITAL_TYPES.CHOLESTEROL],
          recordedAt,
        };
        vitalsToSave.push(vital);
        manualVitalsMap.set(VITAL_TYPES.CHOLESTEROL, vital);
      }

      // Add extracted vitals for types that weren't manually entered
      if (extractedVitals.length > 0) {
        extractedVitals.forEach((vital) => {
          if (!manualVitalsMap.has(vital.vitalType)) {
            vitalsToSave.push({
              reportId: reportResult.reportId!,
              vitalType: vital.vitalType,
              value: vital.value,
              unit: vital.unit,
              recordedAt,
            });
          }
        });
      }

      if (vitalsToSave.length > 0) {
        await saveVitals(vitalsToSave);
      }

      // Redirect to dashboard
      router.push("/dashboard");
    } catch (err) {
      console.error("Upload error:", err);
      setError(err instanceof Error ? err.message : "Failed to upload file");
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            Upload Health Report
          </h1>

          <form onSubmit={handleUpload} className="space-y-6">
            {/* File Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Report File *
              </label>

              {!file ? (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 transition-colors">
                  <input
                    type="file"
                    accept="application/pdf,image/jpeg,image/jpg,image/png,image/webp"
                    onChange={handleFileChange}
                    className="hidden"
                    id="file-upload"
                  />
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <Upload className="mx-auto h-12 w-12 text-gray-400" />
                    <p className="mt-2 text-sm text-gray-600">
                      Click to upload or drag and drop
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      PDF, JPG, PNG up to 10MB
                    </p>
                  </label>
                </div>
              ) : (
                <div className="border border-gray-300 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      {preview === "pdf" ? (
                        <FileText className="h-10 w-10 text-red-500" />
                      ) : preview ? (
                        <img
                          src={preview}
                          alt="Preview"
                          className="h-20 w-20 object-cover rounded"
                        />
                      ) : (
                        <ImageIcon className="h-10 w-10 text-blue-500" />
                      )}
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {file.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={removeFile}
                      className="text-gray-400 hover:text-red-500"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Title */}
            <div>
              <label
                htmlFor="title"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Report Title *
              </label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                placeholder="e.g., Blood Test - January 2024"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Description (Optional)
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                placeholder="Add any notes about this report..."
              />
            </div>

            {/* Vitals Section */}
            <div className="border-t pt-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Add Vitals (Optional)
              </h2>
              <p className="text-sm text-gray-600 mb-4">
                Leave fields empty to automatically extract vitals from the
                report using AI.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Blood Pressure (mmHg)
                  </label>
                  <div className="flex space-x-2">
                    <input
                      type="number"
                      placeholder="Systolic"
                      value={vitals.bloodPressureSystolic}
                      onChange={(e) =>
                        setVitals({
                          ...vitals,
                          bloodPressureSystolic: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                    />
                    <span className="self-center text-gray-500">/</span>
                    <input
                      type="number"
                      placeholder="Diastolic"
                      value={vitals.bloodPressureDiastolic}
                      onChange={(e) =>
                        setVitals({
                          ...vitals,
                          bloodPressureDiastolic: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Heart Rate (bpm)
                  </label>
                  <input
                    type="number"
                    value={vitals.heartRate}
                    onChange={(e) =>
                      setVitals({ ...vitals, heartRate: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                    placeholder="e.g., 72"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    SpO2 (%)
                  </label>
                  <input
                    type="number"
                    value={vitals.spo2}
                    onChange={(e) =>
                      setVitals({ ...vitals, spo2: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                    placeholder="e.g., 98"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Blood Sugar (mg/dL)
                  </label>
                  <input
                    type="number"
                    value={vitals.bloodSugar}
                    onChange={(e) =>
                      setVitals({ ...vitals, bloodSugar: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                    placeholder="e.g., 95"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Hemoglobin (g/dL)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={vitals.hemoglobin}
                    onChange={(e) =>
                      setVitals({ ...vitals, hemoglobin: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                    placeholder="e.g., 14.5"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cholesterol (mg/dL)
                  </label>
                  <input
                    type="number"
                    value={vitals.cholesterol}
                    onChange={(e) =>
                      setVitals({ ...vitals, cholesterol: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                    placeholder="e.g., 180"
                  />
                </div>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex space-x-4">
              <button
                type="submit"
                disabled={uploading || extracting || !file}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                {extracting
                  ? "Extracting vitals..."
                  : uploading
                  ? "Uploading..."
                  : "Upload Report"}
              </button>
              <button
                type="button"
                onClick={() => router.push("/dashboard")}
                className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-gray-700 bg-white"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
