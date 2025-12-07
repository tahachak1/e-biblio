import React from "react";

// Generic stat card used across the dashboard
export default function StatCard({ icon: Icon, label, value, helper, tone = "text-emerald-600" }) {
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md dark:border-gray-800 dark:bg-gray-900">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</span>
        {Icon ? (
          <span className="rounded-lg bg-blue-50 p-2 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
            <Icon className="h-4 w-4" />
          </span>
        ) : null}
      </div>
      <p className="text-2xl font-semibold text-slate-900 dark:text-white">{value}</p>
      {helper ? <p className={`text-xs font-semibold ${tone}`}>{helper}</p> : null}
    </div>
  );
}
