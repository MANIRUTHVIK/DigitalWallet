"use client";

import { Activity, Heart, Droplet, TrendingUp } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: "activity" | "heart" | "droplet" | "trending";
  color?: string;
}

const icons = {
  activity: Activity,
  heart: Heart,
  droplet: Droplet,
  trending: TrendingUp,
};

const colors = {
  blue: "bg-blue-100 text-blue-600",
  red: "bg-red-100 text-red-600",
  green: "bg-green-100 text-green-600",
  purple: "bg-purple-100 text-purple-600",
};

export default function StatCard({
  title,
  value,
  icon,
  color = "blue",
}: StatCardProps) {
  const Icon = icons[icon];
  const colorClass = colors[color as keyof typeof colors] || colors.blue;

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
        <div className={`p-3 rounded-full ${colorClass}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
}
