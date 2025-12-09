/**
* @file date.ts
* @module pages/analytics/utils/date
*
* @summary
* Lightweight date helpers for the Analytics UI (kept UI-local to avoid
* coupling the UI to API internals). Use ISO `YYYY-MM-DD` in local time.
*/

/** Returns today's date (local) formatted as `yyyy-MM-dd`. */
export function todayIso(): string {
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Returns `yyyy-MM-dd` for N days ago (local). */
export function daysAgoIso(n: number): string {
    const d = new Date();
    d.setDate(d.getDate() - n);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}