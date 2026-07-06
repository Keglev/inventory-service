/**
 * @file employees.ts
 * @module api/analytics/employees
 *
 * @summary
 * Fetchers for the per-employee analytics endpoints (ADMIN + demo mode only):
 * - GET /api/analytics/by-employee: change counts per employee per time
 *   bucket, with server-side granularity (daily | weekly | monthly).
 * - GET /api/analytics/employee-changes: paginated newest-first change list.
 *
 * @enterprise
 * - employee-changes returns a Spring Data Page; only `content` and
 *   `totalElements` are consumed (same contract family as the inventory and
 *   stock-history search pages).
 * - Both endpoints accept ISO DATE bounds (yyyy-MM-dd); the backend widens
 *   them to full-day timestamps.
 * - Tolerant parsing per house style; transport errors collapse to empty
 *   results so the section renders its own empty state.
 */
import http from '../httpClient';
import { isArrayOfRecords, pickString, pickNumber } from './util';
import type { Rec } from './util';

export type EmployeeGranularity = 'daily' | 'weekly' | 'monthly';

/** One employee's change count inside one time bucket. */
export type EmployeeActivityRow = {
    /** Bucket label: YYYY-MM-DD | YYYY-Www | YYYY-MM depending on granularity. */
    period: string;
    /** Stable audit identity (email) from the stock history rows. */
    createdBy: string;
    /** Human-readable name; the backend falls back to the email. */
    displayName: string;
    /** Number of stock changes in the bucket. */
    changeCount: number;
};

export type EmployeeActivityFilter = {
    granularity?: EmployeeGranularity;
    /** ISO date (YYYY-MM-DD) lower bound. */
    from?: string;
    /** ISO date (YYYY-MM-DD) upper bound. */
    to?: string;
};

/**
 * Loads per-employee change counts per time bucket.
 *
 * @param filter granularity + optional window
 * @returns rows ordered by period then employee; empty list on error
 */
export async function getEmployeeActivity(filter?: EmployeeActivityFilter): Promise<EmployeeActivityRow[]> {
    try {
        const params: Record<string, string | undefined> = {
            granularity: filter?.granularity || undefined,
            startDate: filter?.from || undefined,
            endDate: filter?.to || undefined,
        };

        const { data } = await http.get<unknown>('/api/analytics/by-employee', { params });
        if (!isArrayOfRecords(data)) return [];

        return (data as Rec[])
            .map<EmployeeActivityRow | null>((rec) => {
                const period = pickString(rec, ['period']);
                const createdBy = pickString(rec, ['createdBy']);
                if (!period || !createdBy) return null;
                return {
                    period,
                    createdBy,
                    displayName: pickString(rec, ['displayName']) || createdBy,
                    changeCount: pickNumber(rec, ['changeCount']),
                };
            })
            .filter((x): x is EmployeeActivityRow => x !== null);
    } catch {
        return [];
    }
}

/** One row of the paginated per-employee change list. */
export type EmployeeChangeRow = {
    timestamp: string;
    itemName: string;
    supplierName: string;
    /** Signed quantity delta. */
    change: number;
    reason: string;
    createdBy: string;
};

/** Page slice of the change list. */
export type EmployeeChangesPage = {
    rows: EmployeeChangeRow[];
    /** Total matching rows across all pages. */
    total: number;
};

export type EmployeeChangesFilter = {
    /** Optional creator (email) filter, case-insensitive on the backend. */
    createdBy?: string;
    from?: string;
    to?: string;
    /** Zero-based page index. */
    page?: number;
    /** Page size (backend caps at 100). */
    size?: number;
};

/**
 * Loads one page of the per-employee change list (newest first).
 *
 * @param filter creator/window/pagination
 * @returns rows + total; empty page on error
 */
export async function getEmployeeChanges(filter?: EmployeeChangesFilter): Promise<EmployeeChangesPage> {
    try {
        const params: Record<string, string | number | undefined> = {
            createdBy: filter?.createdBy || undefined,
            startDate: filter?.from || undefined,
            endDate: filter?.to || undefined,
            page: filter?.page ?? 0,
            size: filter?.size ?? 25,
        };

        const { data } = await http.get<unknown>('/api/analytics/employee-changes', { params });
        if (typeof data !== 'object' || data === null) return { rows: [], total: 0 };

        const record = data as Rec;
        const content = record.content;
        if (!isArrayOfRecords(content)) return { rows: [], total: 0 };

        const rows = (content as Rec[])
            .map<EmployeeChangeRow | null>((rec) => {
                const timestamp = pickString(rec, ['timestamp']);
                const itemName = pickString(rec, ['itemName']);
                if (!timestamp || !itemName) return null;
                return {
                    timestamp,
                    itemName,
                    supplierName: pickString(rec, ['supplierName']),
                    change: pickNumber(rec, ['change']),
                    reason: pickString(rec, ['reason']),
                    createdBy: pickString(rec, ['createdBy']),
                };
            })
            .filter((x): x is EmployeeChangeRow => x !== null);

        return { rows, total: pickNumber(record, ['totalElements']) };
    } catch {
        return { rows: [], total: 0 };
    }
}
