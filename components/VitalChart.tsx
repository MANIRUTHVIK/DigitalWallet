"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { formatDate } from "@/lib/utils";

interface VitalData {
  id: string;
  vitalType: string;
  value: number;
  unit: string;
  recordedAt: Date;
  report: {
    id: string;
    title: string;
    uploadedAt: Date;
  };
}

interface VitalChartProps {
  vitals: VitalData[];
  title: string;
  color?: string;
}

export default function VitalChart({
  vitals,
  title,
  color = "#3b82f6",
}: VitalChartProps) {
  const chartData = vitals.map((vital) => ({
    date: formatDate(vital.recordedAt),
    value: vital.value,
    reportId: vital.report.id,
    reportTitle: vital.report.title,
  }));

  if (vitals.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
        <p className="text-gray-500 text-center py-8">No data available</p>
      </div>
    );
  }

  const unit = vitals[0]?.unit || "";

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis label={{ value: unit, angle: -90, position: "insideLeft" }} />
          <Tooltip
            formatter={(value: number) => [`${value} ${unit}`, "Value"]}
            labelFormatter={(label) => `Date: ${label}`}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            dot={{ fill: color, r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
