import { getReports } from "@/lib/actions/reports";
import { getVitalsByType } from "@/lib/actions/vitals";
import { VITAL_TYPES, VITAL_LABELS } from "@/lib/constants";
import VitalChart from "@/components/VitalChart";
import RecentReports from "@/components/RecentReports";
import StatCard from "@/components/StatCard";
import Link from "next/link";
import { Plus } from "lucide-react";

export default async function DashboardPage() {
  const [reportsResult, vitalsResult] = await Promise.all([
    getReports(),
    getVitalsByType(),
  ]);

  const reports = reportsResult.success ? reportsResult.reports : [];
  const vitalsByType: Record<string, any[]> = vitalsResult.success
    ? vitalsResult.vitals
    : {};

  const recentReports = reports.slice(0, 5);

  const totalVitals = Object.values(vitalsByType).reduce(
    (sum: number, vitals: any) => sum + (vitals?.length || 0),
    0
  );

  // Get latest values for stat cards
  const latestHeartRate =
    vitalsByType[VITAL_TYPES.HEART_RATE]?.[
      vitalsByType[VITAL_TYPES.HEART_RATE].length - 1
    ];
  const latestBloodSugar =
    vitalsByType[VITAL_TYPES.BLOOD_SUGAR]?.[
      vitalsByType[VITAL_TYPES.BLOOD_SUGAR].length - 1
    ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Health Dashboard</h1>
          <Link
            href="/upload"
            className="inline-flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-5 w-5 mr-2" />
            Upload Report
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Reports"
            value={reports.length}
            icon="activity"
            color="blue"
          />
          <StatCard
            title="Total Vitals"
            value={totalVitals}
            icon="trending"
            color="purple"
          />
          <StatCard
            title="Latest Heart Rate"
            value={
              latestHeartRate
                ? `${latestHeartRate.value} ${latestHeartRate.unit}`
                : "N/A"
            }
            icon="heart"
            color="red"
          />
          <StatCard
            title="Latest Blood Sugar"
            value={
              latestBloodSugar
                ? `${latestBloodSugar.value} ${latestBloodSugar.unit}`
                : "N/A"
            }
            icon="droplet"
            color="green"
          />
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <VitalChart
            vitals={vitalsByType[VITAL_TYPES.HEART_RATE] || []}
            title={VITAL_LABELS[VITAL_TYPES.HEART_RATE]}
            color="#ef4444"
          />
          <VitalChart
            vitals={vitalsByType[VITAL_TYPES.BLOOD_SUGAR] || []}
            title={VITAL_LABELS[VITAL_TYPES.BLOOD_SUGAR]}
            color="#10b981"
          />
          <VitalChart
            vitals={vitalsByType[VITAL_TYPES.SPO2] || []}
            title={VITAL_LABELS[VITAL_TYPES.SPO2]}
            color="#3b82f6"
          />
          <VitalChart
            vitals={vitalsByType[VITAL_TYPES.CHOLESTEROL] || []}
            title={VITAL_LABELS[VITAL_TYPES.CHOLESTEROL]}
            color="#8b5cf6"
          />
        </div>

        {/* Recent Reports */}
        <RecentReports reports={recentReports} />
      </div>
    </div>
  );
}
