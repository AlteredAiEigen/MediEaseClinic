/**
 * Date utilities
 *
 * IMPORTANT: Do not use `new Date().toISOString().slice(0, 10)` (UTC date) for "today"
 * in UI filters. That causes off-by-one-day issues around midnight for many timezones.
 */
export function formatLocalYYYYMMDD(date: Date): string {
  // `en-CA` formats as YYYY-MM-DD in the user's local timezone.
  // Example: 2025-12-22
  return new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function todayLocalYYYYMMDD(): string {
  return formatLocalYYYYMMDD(new Date());
}

/**
 * Human-readable relative time for AI-generated metadata:
 * seconds / minutes / hours ago within 24h, otherwise a local date+time string.
 */
export function formatSmartRelativeTime(
  iso: string | Date | undefined | null
): string {
  if (iso == null || iso === "") return "";
  const d = typeof iso === "string" ? new Date(iso) : iso;
  if (Number.isNaN(d.getTime())) return "";
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  if (diffMs < 0) {
    return d.toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  }
  const sec = Math.floor(diffMs / 1000);
  if (sec < 60) {
    if (sec <= 5) return "Just now";
    return `${sec} second${sec === 1 ? "" : "s"} ago`;
  }
  const min = Math.floor(sec / 60);
  if (min < 60) {
    return `${min} minute${min === 1 ? "" : "s"} ago`;
  }
  const hrs = Math.floor(min / 60);
  if (hrs < 24) {
    return `${hrs} hour${hrs === 1 ? "" : "s"} ago`;
  }
  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}


