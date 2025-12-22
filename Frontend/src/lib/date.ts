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


