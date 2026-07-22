import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ActivityIcon,
  AlertCircleIcon,
  HeartPulseIcon,
  ScaleIcon,
  TrendingDownIcon,
  TrendingUpIcon,
} from "lucide-react";

export interface VitalRecord {
  bloodPressure?: string | null;
  heartRate?: string | number | null;
  temperature?: string | number | null;
  oxygenSaturation?: string | number | null;
  bloodGlucose?: string | number | null;
  weight?: string | number | null;
  recordedAt?: string | null;
}

export interface DashboardProblem {
  label: string;
  source: "Current condition" | "Medical history" | "Visit diagnosis";
}

function numeric(value: unknown): number | null {
  const match = String(value ?? "").match(/-?\d+(?:\.\d+)?/);
  return match ? Number(match[0]) : null;
}

function Sparkline({ values }: { values: Array<number | null> }) {
  const points = values.filter((value): value is number => value != null);
  if (points.length < 2) return null;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const path = points
    .map((value, index) => {
      const x = (index / (points.length - 1)) * 100;
      const y = 32 - ((value - min) / range) * 28;
      return `${index === 0 ? "M" : "L"} ${x} ${y}`;
    })
    .join(" ");

  return (
    <svg viewBox="0 0 100 36" className="h-9 w-full overflow-visible" aria-label="Trend chart">
      <path d={path} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      {points.map((value, index) => {
        const x = (index / (points.length - 1)) * 100;
        const y = 32 - ((value - min) / range) * 28;
        return <circle key={`${value}-${index}`} cx={x} cy={y} r="2.5" fill="currentColor" />;
      })}
    </svg>
  );
}

function TrendCard({
  label,
  value,
  unit,
  values,
  tone = "teal",
}: {
  label: string;
  value: string;
  unit?: string;
  values: Array<number | null>;
  tone?: "teal" | "orange" | "blue" | "emerald";
}) {
  const usable = values.filter((item): item is number => item != null);
  const change = usable.length >= 2 ? usable[usable.length - 1] - usable[0] : null;
  const improved = label.includes("Weight") ? (change ?? 0) < 0 : (change ?? 0) < 0;
  const color = {
    teal: "text-teal-600 bg-teal-50 border-teal-100",
    orange: "text-orange-600 bg-orange-50 border-orange-100",
    blue: "text-blue-600 bg-blue-50 border-blue-100",
    emerald: "text-emerald-600 bg-emerald-50 border-emerald-100",
  }[tone];

  return (
    <div className={`rounded-xl border p-3 ${color}`}>
      <div className="flex justify-between gap-2 text-xs font-medium">
        <span>{label}</span>
        {change != null && (
          <span className="inline-flex items-center gap-1">
            {improved ? <TrendingDownIcon className="h-3 w-3" /> : <TrendingUpIcon className="h-3 w-3" />}
            {Math.abs(change).toFixed(1)}
          </span>
        )}
      </div>
      <p className="mt-2 text-xl font-bold tabular-nums">
        {value} <span className="text-xs font-normal">{unit}</span>
      </p>
      {usable.length >= 2 ? (
        <Sparkline values={values} />
      ) : (
        <p className="mt-3 h-9 text-xs opacity-75">Need 2 recorded readings for a trend.</p>
      )}
    </div>
  );
}

export function ClinicalTrendCards({ vitals }: { vitals: VitalRecord[] }) {
  const ordered = [...vitals].reverse();
  const latest = vitals[0];
  const bpValues = ordered.map((item) => numeric(item.bloodPressure));
  const glucoseValues = ordered.map((item) => numeric(item.bloodGlucose));
  const weightValues = ordered.map((item) => numeric(item.weight));
  const available = latest && [latest.bloodPressure, latest.bloodGlucose, latest.weight].some(Boolean);

  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <ActivityIcon className="h-4 w-4 text-teal-600" />
          Trends across recorded visits
          <Badge variant="secondary" className="ml-auto font-normal">{vitals.length} reading{vitals.length === 1 ? "" : "s"}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!available ? (
          <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
            No recorded vitals are available for trend analysis yet.
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {latest?.bloodPressure && <TrendCard label="Blood pressure" value={latest.bloodPressure} unit="mmHg" values={bpValues} tone="teal" />}
            {latest?.bloodGlucose && <TrendCard label="Blood glucose" value={String(latest.bloodGlucose)} unit="mg/dL" values={glucoseValues} tone="orange" />}
            {latest?.weight && <TrendCard label="Weight" value={String(latest.weight)} unit="kg" values={weightValues} tone="emerald" />}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function ActiveProblemsCard({ problems }: { problems: DashboardProblem[] }) {
  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Active problems</CardTitle>
      </CardHeader>
      <CardContent>
        {problems.length === 0 ? (
          <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
            No active problem documented.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {problems.map((problem) => (
              <div key={`${problem.source}-${problem.label}`} className="rounded-lg border bg-slate-50 px-3 py-2">
                <p className="text-sm font-medium">{problem.label}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{problem.source}</p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function TodayVitalsCard({ vital }: { vital: VitalRecord | null }) {
  const rows = [
    ["BP", vital?.bloodPressure, "mmHg"],
    ["HR", vital?.heartRate, "bpm"],
    ["SpO₂", vital?.oxygenSaturation, "%"],
    ["Temp", vital?.temperature, "°F"],
  ].filter(([, value]) => value != null && value !== "");
  const vitalToneClasses = [
    "border-violet-200 bg-gradient-to-br from-violet-100 via-violet-50 to-fuchsia-50 text-violet-950 dark:border-violet-800 dark:from-violet-950/60 dark:via-violet-900/30 dark:to-fuchsia-950/20 dark:text-violet-100",
    "border-emerald-200 bg-gradient-to-br from-emerald-100 via-emerald-50 to-teal-50 text-emerald-950 dark:border-emerald-800 dark:from-emerald-950/60 dark:via-emerald-900/30 dark:to-teal-950/20 dark:text-emerald-100",
    "border-sky-200 bg-gradient-to-br from-sky-100 via-sky-50 to-cyan-50 text-sky-950 dark:border-sky-800 dark:from-sky-950/60 dark:via-sky-900/30 dark:to-cyan-950/20 dark:text-sky-100",
    "border-amber-200 bg-gradient-to-br from-amber-100 via-amber-50 to-orange-50 text-amber-950 dark:border-amber-800 dark:from-amber-950/60 dark:via-amber-900/30 dark:to-orange-950/20 dark:text-amber-100",
  ];

  return (
    <Card className="overflow-hidden border-violet-200/80 bg-gradient-to-br from-violet-50 via-white to-emerald-50 shadow-sm dark:border-violet-900/70 dark:from-violet-950/30 dark:via-background dark:to-emerald-950/20">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <span className="rounded-lg bg-gradient-to-br from-violet-600 to-emerald-500 p-1.5 text-white shadow-sm">
            <HeartPulseIcon className="h-4 w-4" />
          </span>
          Latest vitals
        </CardTitle>
        {vital?.recordedAt && <p className="text-xs text-muted-foreground">Recorded {new Date(vital.recordedAt).toLocaleString()}</p>}
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">No vitals recorded.</p>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {rows.map(([label, value, unit], index) => (
              <div
                key={label as string}
                className={`rounded-lg border p-3 shadow-sm ${vitalToneClasses[index % vitalToneClasses.length]}`}
              >
                <p className="text-xs font-medium opacity-75">{label}</p>
                <p className="mt-1 text-lg font-bold tabular-nums">{String(value)} <span className="text-xs font-normal">{unit}</span></p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
