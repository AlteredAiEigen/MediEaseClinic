import { useMemo, useState, type ReactNode } from "react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertTriangleIcon,
  ArrowRightIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  CheckCircle2Icon,
  HistoryIcon,
  MinusIcon,
  SparklesIcon,
  TrendingDownIcon,
  TrendingUpIcon,
} from "lucide-react";

export interface LabComparisonRow {
  name: string;
  panel: string;
  currentValue?: string;
  previousValue?: string;
  unit?: string;
  normalRange?: string;
  currentFlag?: string;
  previousFlag?: string;
  percentChange?: number | null;
  absoluteChange?: number | null;
  trend?: string;
  verdict?: string;
  verdictLabel?: string;
  priority?: number;
  priorAbnormal?: string;
  currentAbnormal?: string;
  clinicalDirection?: string;
}

export interface CompareCandidate {
  reportId: string;
  documentName?: string;
  reportType?: string;
  sampleDate?: string | null;
  collectedDate?: string | null;
  reportedDate?: string | null;
  dominantPanels?: string[];
  testCount?: number;
  daysBeforeCurrent?: number | null;
  selectionReason?: string;
  isRecommended?: boolean;
  score?: number;
}

export interface ReportMeta {
  reportId?: string;
  documentName?: string;
  reportType?: string;
  compareProfile?: string;
  primaryPanel?: string;
  sampleDate?: string | null;
  collectedDate?: string | null;
  reportedDate?: string | null;
  dominantPanels?: string[];
  testCount?: number;
}

export interface LabComparisonData {
  compareProfile?: string;
  previousReportDate?: string | null;
  previousReportName?: string | null;
  previousSampleDate?: string | null;
  previousCollectedDate?: string | null;
  currentReportDate?: string | null;
  currentSampleDate?: string | null;
  currentCollectedDate?: string | null;
  currentReportMeta?: ReportMeta;
  previousReportMeta?: ReportMeta;
  selectedPriorReportId?: string | null;
  compareCandidates?: CompareCandidate[];
  daysBetween?: number | null;
  headline?: string;
  summary?: {
    total?: number;
    worsening?: number;
    improving?: number;
    newAbnormal?: number;
    stable?: number;
    stillAbnormal?: number;
    resolved?: number;
  };
  comparisons?: LabComparisonRow[];
  groupedByPanel?: Array<{ panel: string; tests: LabComparisonRow[] }>;
  actionable?: LabComparisonRow[];
  longitudinal?: {
    reportCount?: number;
    priorReportCount?: number;
    headline?: string;
    dateRange?: { from?: string | null; to?: string | null };
    reports?: Array<ReportMeta & { isCurrent?: boolean }>;
    priorityTrends?: LongitudinalTrend[];
    groupedTrends?: Array<{ panel: string; tests: LongitudinalTrend[] }>;
    trends?: LongitudinalTrend[];
  };
}

export interface LongitudinalTrend {
  key: string;
  name: string;
  panel: string;
  unit?: string;
  normalRange?: string;
  baselineValue?: string;
  baselineDate?: string;
  currentValue?: string;
  currentDate?: string;
  percentChangeFromBaseline?: number | null;
  verdict?: string;
  verdictLabel?: string;
  priority?: number;
  points: Array<{
    reportId: string;
    sampleDate?: string | null;
    value?: string;
    numericValue?: number | null;
    abnormality?: string;
    isCurrent?: boolean;
  }>;
}

interface LabReportComparisonViewProps {
  data: LabComparisonData | null;
  loading: boolean;
  hasParsedTests: boolean;
  selectedPriorReportId?: string | null;
  onSelectPriorReport?: (priorReportId: string) => void;
}

function verdictStyles(verdict?: string): string {
  switch (verdict) {
    case "worsening":
    case "new_abnormal":
      return "bg-red-50 text-red-800 border-red-200";
    case "improving":
    case "resolved":
      return "bg-emerald-50 text-emerald-800 border-emerald-200";
    case "unchanged_abnormal":
      return "bg-amber-50 text-amber-800 border-amber-200";
    case "stable":
      return "bg-slate-50 text-slate-600 border-slate-200";
    default:
      return "bg-muted text-muted-foreground border-border";
  }
}

function DeltaBar({ row }: { row: LabComparisonRow }) {
  const pct = row.percentChange;
  if (pct == null) return null;
  const width = Math.min(Math.abs(pct), 100);
  const isUp = pct > 0;
  const color =
    row.verdict === "worsening" || row.verdict === "new_abnormal"
      ? "bg-red-400"
      : row.verdict === "improving" || row.verdict === "resolved"
        ? "bg-emerald-400"
        : "bg-slate-300";

  return (
    <div className="flex items-center gap-2 min-w-[100px]">
      <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden relative">
        <div
          className={`absolute top-0 h-full rounded-full ${color} ${isUp ? "left-1/2" : "right-1/2"}`}
          style={{ width: `${width / 2}%` }}
        />
        <div className="absolute left-1/2 top-0 w-px h-full bg-border" />
      </div>
      <span className="text-xs tabular-nums text-muted-foreground w-12 text-right">
        {pct > 0 ? "+" : ""}
        {pct}%
      </span>
    </div>
  );
}

function ComparisonRow({ row }: { row: LabComparisonRow }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-[1.4fr_1fr_1fr_auto] gap-2 md:gap-4 items-center py-3 px-3 border-b border-border/60 last:border-0 hover:bg-muted/20">
      <div>
        <p className="font-medium text-sm">{row.name}</p>
        {row.normalRange && (
          <p className="text-xs text-muted-foreground mt-0.5">Ref: {row.normalRange}</p>
        )}
      </div>
      <div className="flex items-center gap-2 text-sm">
        <span className="text-muted-foreground tabular-nums">
          {row.previousValue ?? "—"}
          {row.unit ? ` ${row.unit}` : ""}
        </span>
        <ArrowRightIcon className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
        <span className="font-semibold tabular-nums">
          {row.currentValue ?? "—"}
          {row.unit ? ` ${row.unit}` : ""}
        </span>
      </div>
      <DeltaBar row={row} />
      <Badge variant="outline" className={`text-xs shrink-0 ${verdictStyles(row.verdict)}`}>
        {row.verdictLabel || row.verdict || "—"}
      </Badge>
    </div>
  );
}

function TrendLine({ trend }: { trend: LongitudinalTrend }) {
  const numericPoints = trend.points.filter(
    (point): point is LongitudinalTrend["points"][number] & { numericValue: number } =>
      point.numericValue != null,
  );
  if (numericPoints.length < 2) {
    return <span className="text-xs text-muted-foreground">Values not numeric</span>;
  }
  const values = numericPoints.map((point) => point.numericValue);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const path = numericPoints
    .map((point, index) => {
      const x = 8 + (index / (numericPoints.length - 1)) * 184;
      const y = 42 - ((point.numericValue - min) / range) * 32;
      return `${index === 0 ? "M" : "L"} ${x} ${y}`;
    })
    .join(" ");

  return (
    <svg viewBox="0 0 200 50" className="h-14 w-full text-teal-600" aria-label={`${trend.name} trend`}>
      <path d={path} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      {numericPoints.map((point, index) => {
        const x = 8 + (index / (numericPoints.length - 1)) * 184;
        const y = 42 - ((point.numericValue - min) / range) * 32;
        return (
          <circle
            key={`${point.reportId}-${index}`}
            cx={x}
            cy={y}
            r={point.isCurrent ? 4 : 2.75}
            fill={point.isCurrent ? "#0f766e" : "currentColor"}
          />
        );
      })}
    </svg>
  );
}

function LongitudinalTrendRow({ trend }: { trend: LongitudinalTrend }) {
  return (
    <div className="grid gap-3 border-b border-border/60 px-3 py-4 last:border-0 md:grid-cols-[1.1fr_1.5fr_auto] md:items-center">
      <div>
        <p className="text-sm font-semibold">{trend.name}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {trend.baselineDate}: {trend.baselineValue ?? "—"} → {trend.currentDate}: {trend.currentValue ?? "—"} {trend.unit}
        </p>
        {trend.normalRange && <p className="text-xs text-muted-foreground">Ref: {trend.normalRange}</p>}
      </div>
      <div>
        <TrendLine trend={trend} />
        <div className="flex justify-between text-[10px] text-muted-foreground">
          {trend.points.map((point) => <span key={point.reportId}>{point.sampleDate}</span>)}
        </div>
      </div>
      <Badge variant="outline" className={`w-fit text-xs ${verdictStyles(trend.verdict)}`}>
        {trend.verdictLabel || "Trend"}
        {trend.percentChangeFromBaseline != null && ` · ${trend.percentChangeFromBaseline > 0 ? "+" : ""}${trend.percentChangeFromBaseline}%`}
      </Badge>
    </div>
  );
}

function LongitudinalComparison({ data }: { data: NonNullable<LabComparisonData["longitudinal"]> }) {
  const grouped = data.groupedTrends ?? [];
  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-teal-100 bg-gradient-to-r from-teal-50/80 to-emerald-50/50 p-4">
        <div className="flex items-start gap-3">
          <SparklesIcon className="mt-0.5 h-5 w-5 shrink-0 text-teal-600" />
          <div>
            <p className="font-semibold text-teal-900">{data.headline || "Longitudinal comparison"}</p>
            <p className="mt-1 text-sm text-teal-800/80">
              {data.priorReportCount ?? 0} relevant earlier report{data.priorReportCount === 1 ? "" : "s"} · {data.dateRange?.from || "—"} to {data.dateRange?.to || "—"}
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-lg border p-3">
        <p className="mb-2 text-xs font-medium text-muted-foreground">Included relevant reports</p>
        <div className="flex flex-wrap gap-2">
          {(data.reports ?? []).map((report) => (
            <Badge key={report.reportId} variant={report.isCurrent ? "default" : "secondary"} className="text-xs">
              {report.sampleDate || "Unknown date"}{report.isCurrent ? " · current" : ""}
            </Badge>
          ))}
        </div>
      </div>

      {(data.priorityTrends?.length ?? 0) > 0 && (
        <div className="overflow-hidden rounded-lg border border-amber-100">
          <div className="border-b border-amber-100 bg-amber-50/70 px-4 py-2">
            <h4 className="flex items-center gap-2 text-sm font-semibold text-amber-900">
              <AlertTriangleIcon className="h-4 w-4" />
              Priority longitudinal changes
            </h4>
          </div>
          {data.priorityTrends!.map((trend) => <LongitudinalTrendRow key={trend.key} trend={trend} />)}
        </div>
      )}

      {grouped.map((group) => (
        <div key={group.panel} className="overflow-hidden rounded-lg border">
          <div className="flex items-center justify-between border-b bg-muted/40 px-4 py-2">
            <h4 className="text-sm font-semibold">{group.panel}</h4>
            <Badge variant="secondary" className="text-xs">{group.tests.length} trends</Badge>
          </div>
          {group.tests.map((trend) => <LongitudinalTrendRow key={trend.key} trend={trend} />)}
        </div>
      ))}
      <p className="text-center text-xs text-muted-foreground">
        Shows all earlier, panel-relevant reports with matching attributes. The highlighted point is the opened report.
      </p>
    </div>
  );
}

function SummaryCard({
  label,
  count,
  tone,
  icon,
}: {
  label: string;
  count: number;
  tone: "red" | "green" | "amber" | "slate";
  icon: ReactNode;
}) {
  const tones = {
    red: "border-red-200 bg-red-50/80 text-red-900",
    green: "border-emerald-200 bg-emerald-50/80 text-emerald-900",
    amber: "border-amber-200 bg-amber-50/80 text-amber-900",
    slate: "border-slate-200 bg-slate-50/80 text-slate-700",
  };
  return (
    <div className={`rounded-lg border p-3 ${tones[tone]}`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium opacity-80">{label}</span>
        {icon}
      </div>
      <p className="text-2xl font-bold mt-1 tabular-nums">{count}</p>
    </div>
  );
}

export function LabReportComparisonView({
  data,
  loading,
  hasParsedTests,
  selectedPriorReportId,
  onSelectPriorReport,
}: LabReportComparisonViewProps) {
  const [stableOpen, setStableOpen] = useState(false);

  const grouped = useMemo(() => {
    if (data?.groupedByPanel?.length) return data.groupedByPanel;
    if (!data?.comparisons?.length) return [];
    const map = new Map<string, LabComparisonRow[]>();
    for (const row of data.comparisons) {
      const panel = row.panel || "Other Tests";
      if (!map.has(panel)) map.set(panel, []);
      map.get(panel)!.push(row);
    }
    return Array.from(map.entries()).map(([panel, tests]) => ({ panel, tests }));
  }, [data]);

  const actionable = data?.actionable ?? [];
  const stablePanels = useMemo(() => {
    return grouped
      .map((g) => ({
        ...g,
        tests: g.tests.filter((t) => t.verdict === "stable"),
      }))
      .filter((g) => g.tests.length > 0);
  }, [grouped]);
  const nonStableGrouped = useMemo(() => {
    return grouped
      .map((g) => ({
        ...g,
        tests: g.tests.filter((t) => t.verdict !== "stable"),
      }))
      .filter((g) => g.tests.length > 0);
  }, [grouped]);

  if (loading) {
    return (
      <div className="text-center py-12 text-muted-foreground animate-pulse">
        Finding comparable reports and sample dates…
      </div>
    );
  }

  const candidates = data?.compareCandidates ?? [];
  const currentMeta = data?.currentReportMeta;
  const hasComparison = Boolean(data?.comparisons?.length);

  if (!hasComparison && candidates.length === 0) {
    const profile = data?.compareProfile || currentMeta?.compareProfile;
    return (
      <div className="text-center py-12">
        <HistoryIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">Compare Results</h3>
        {profile && (
          <Badge variant="secondary" className="mb-3">{profile}</Badge>
        )}
        <p className="text-muted-foreground max-w-md mx-auto">
          {hasParsedTests
            ? "No earlier report of the same panel type with enough matching tests was found. Compare only shows relevant priors — e.g. diabetic profile with diabetic profile, not unrelated labs."
            : "Comparison requires structured lab data from parsed reports."}
        </p>
      </div>
    );
  }

  const summary = data?.summary ?? {};

  if ((data?.longitudinal?.trends?.length ?? 0) > 0) {
    return <LongitudinalComparison data={data!.longitudinal!} />;
  }

  return (
    <div className="space-y-5">
      {/* Sample dates + report picker */}
      <div className="rounded-lg border p-4 space-y-4">
        {(data?.compareProfile || currentMeta?.compareProfile) && (
          <p className="text-sm text-muted-foreground">
            Showing only earlier reports relevant to{" "}
            <span className="font-medium text-foreground">
              {data?.compareProfile || currentMeta?.compareProfile}
            </span>
            {candidates.length > 0 && (
              <span> ({candidates.length} match{candidates.length !== 1 ? "es" : ""})</span>
            )}
          </p>
        )}
        <div className="flex flex-col md:flex-row md:items-end gap-4">
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div className="rounded-md bg-teal-50/60 border border-teal-100 p-3">
              <p className="text-xs font-medium text-teal-800 mb-1">Current sample</p>
              <p className="font-semibold text-teal-950">
                {data?.currentSampleDate || currentMeta?.sampleDate || "—"}
              </p>
              {data?.currentCollectedDate && (
                <p className="text-xs text-teal-700/80 mt-1">Collected: {data.currentCollectedDate}</p>
              )}
              {currentMeta?.reportType && (
                <Badge variant="secondary" className="mt-2 text-xs">{currentMeta.reportType}</Badge>
              )}
            </div>
            <div className="rounded-md bg-slate-50 border border-slate-200 p-3">
              <p className="text-xs font-medium text-slate-600 mb-1">Compare with sample</p>
              {candidates.length > 0 && onSelectPriorReport ? (
                <Select
                  value={selectedPriorReportId || data?.selectedPriorReportId || candidates[0]?.reportId}
                  onValueChange={onSelectPriorReport}
                >
                  <SelectTrigger className="h-9 bg-background">
                    <SelectValue placeholder="Select prior report" />
                  </SelectTrigger>
                  <SelectContent>
                    {candidates.map((c) => (
                      <SelectItem key={c.reportId} value={c.reportId}>
                        <span className="font-medium">{c.sampleDate || "Unknown date"}</span>
                        {c.reportType && (
                          <span className="text-muted-foreground"> · {c.reportType}</span>
                        )}
                        {c.isRecommended && (
                          <span className="text-teal-600"> (recommended)</span>
                        )}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <p className="font-semibold">{data?.previousSampleDate || "—"}</p>
              )}
              {data?.previousCollectedDate && (
                <p className="text-xs text-muted-foreground mt-1">
                  Collected: {data.previousCollectedDate}
                </p>
              )}
              {data?.daysBetween != null && (
                <p className="text-xs text-muted-foreground mt-1">
                  {data.daysBetween} days between samples
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Timeline of eligible prior reports */}
        {candidates.length > 1 && (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">
              Other relevant earlier reports
            </p>
            <div className="flex flex-wrap gap-2">
              {candidates.map((c) => {
                const active =
                  (selectedPriorReportId || data?.selectedPriorReportId) === c.reportId;
                return (
                  <button
                    key={c.reportId}
                    type="button"
                    onClick={() => onSelectPriorReport?.(c.reportId)}
                    className={`text-left rounded-md border px-3 py-2 text-xs transition-colors ${
                      active
                        ? "border-teal-400 bg-teal-50 ring-1 ring-teal-200"
                        : "border-border hover:bg-muted/40"
                    }`}
                  >
                    <span className="font-semibold block">{c.sampleDate || "—"}</span>
                    <span className="text-muted-foreground">{c.reportType}</span>
                    {c.daysBeforeCurrent != null && (
                      <span className="text-muted-foreground block">{c.daysBeforeCurrent}d ago</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {!hasComparison ? (
        <p className="text-sm text-muted-foreground text-center py-6">
          Select a prior report above to view test-by-test comparison.
        </p>
      ) : (
        <>
      {/* Context banner */}
      <div className="rounded-lg border border-teal-100 bg-gradient-to-r from-teal-50/80 to-emerald-50/50 p-4">
        <div className="flex items-start gap-3">
          <SparklesIcon className="w-5 h-5 text-teal-600 mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold text-teal-900">{data.headline}</p>
            <p className="text-sm text-teal-800/80 mt-1">
              {data.previousReportDate && (
                <>
                  vs prior report{" "}
                  <span className="font-medium">{data.previousReportDate}</span>
                  {data.daysBetween != null && (
                    <> ({data.daysBetween} days apart)</>
                  )}
                </>
              )}
              {data.previousReportName && (
                <span className="block text-xs text-teal-700/70 mt-0.5 truncate">
                  {data.previousReportName}
                </span>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <SummaryCard
          label="Needs attention"
          count={(summary.worsening ?? 0) + (summary.newAbnormal ?? 0)}
          tone="red"
          icon={<AlertTriangleIcon className="w-4 h-4" />}
        />
        <SummaryCard
          label="Improving"
          count={(summary.improving ?? 0) + (summary.resolved ?? 0)}
          tone="green"
          icon={<TrendingDownIcon className="w-4 h-4 rotate-180" />}
        />
        <SummaryCard
          label="Still abnormal"
          count={summary.stillAbnormal ?? 0}
          tone="amber"
          icon={<MinusIcon className="w-4 h-4" />}
        />
        <SummaryCard
          label="Stable"
          count={summary.stable ?? 0}
          tone="slate"
          icon={<CheckCircle2Icon className="w-4 h-4" />}
        />
      </div>

      {/* Actionable highlights */}
      {actionable.length > 0 && (
        <div className="rounded-lg border border-red-100 overflow-hidden">
          <div className="bg-red-50/60 px-4 py-2 border-b border-red-100">
            <h4 className="text-sm font-semibold text-red-900 flex items-center gap-2">
              <AlertTriangleIcon className="w-4 h-4" />
              Priority changes ({actionable.length})
            </h4>
          </div>
          <div>
            {actionable.map((row) => (
              <ComparisonRow key={`action-${row.name}`} row={row} />
            ))}
          </div>
        </div>
      )}

      {/* Panel-grouped changes */}
      {nonStableGrouped.map(({ panel, tests }) => (
        <div key={panel} className="rounded-lg border overflow-hidden">
          <div className="bg-muted/40 px-4 py-2 border-b flex items-center justify-between">
            <h4 className="text-sm font-semibold">{panel}</h4>
            <Badge variant="secondary" className="text-xs">
              {tests.length} test{tests.length !== 1 ? "s" : ""}
            </Badge>
          </div>
          <div>
            {tests.map((row) => (
              <ComparisonRow key={row.name} row={row} />
            ))}
          </div>
        </div>
      ))}

      {/* Stable tests — collapsed */}
      {stablePanels.length > 0 && (
        <Collapsible open={stableOpen} onOpenChange={setStableOpen}>
          <CollapsibleTrigger className="flex w-full items-center gap-2 rounded-lg border bg-muted/20 px-4 py-3 text-sm font-medium hover:bg-muted/40 transition-colors">
            {stableOpen ? (
              <ChevronDownIcon className="w-4 h-4" />
            ) : (
              <ChevronRightIcon className="w-4 h-4" />
            )}
            Stable parameters ({summary.stable ?? 0}) — within ±5% change
          </CollapsibleTrigger>
          <CollapsibleContent>
            {stablePanels.map(({ panel, tests }) => (
              <div key={`stable-${panel}`} className="mt-2 rounded-lg border overflow-hidden">
                <div className="bg-muted/30 px-4 py-1.5 border-b text-xs font-medium text-muted-foreground">
                  {panel}
                </div>
                <div>
                  {tests.map((row) => (
                    <ComparisonRow key={row.name} row={row} />
                  ))}
                </div>
              </div>
            ))}
          </CollapsibleContent>
        </Collapsible>
      )}

      <p className="text-xs text-muted-foreground text-center pt-2">
        Only prior reports of the same clinical kind appear here (shared panel + overlapping tests,
        sample date before this report). Unrelated labs are excluded automatically.
      </p>
        </>
      )}
    </div>
  );
}
