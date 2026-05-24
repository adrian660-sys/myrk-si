import type { Trip, Transaction, CashReceived } from './types';

export interface TripBalance {
  trip: Trip;
  freshCash: number;
  cashExpenses: number;
  lastBalance: number;
}

/**
 * Cash carried-forward balance per trip.
 *
 *   lastBalance(N) = lastBalance(N-1) + freshCash(N) − cashExpenses(N)
 *   lastBalance(0) =                    freshCash(0) − cashExpenses(0)
 *
 * Cash expenses for a trip are every Cash transaction with a negative amount
 * dated strictly after the previous trip's end_date and on/before this trip's
 * end_date. trip_id linking is irrelevant here — the rollup is purely
 * date-based, so a flight bought weeks before the trip still counts against
 * whichever trip's window contains that date.
 *
 * Trips are processed in chronological order of end_date.
 */
export function computeTripBalances(
  trips: Trip[],
  transactions: Transaction[],
  cashReceived: CashReceived[]
): TripBalance[] {
  const ordered = [...trips].sort((a, b) => a.end_date.localeCompare(b.end_date));

  const cashOut = transactions.filter(
    (t) => t.funding_source === 'Cash' && t.amount < 0 && !!t.date
  );

  const result: TripBalance[] = [];
  let runningBalance = 0;
  let prevEnd: string | null = null;

  for (const trip of ordered) {
    const freshCash = cashReceived
      .filter((c) => c.trip_id === trip.id)
      .reduce((sum, c) => sum + c.amount, 0);

    const cashExpenses = cashOut
      .filter((t) => {
        const afterPrev = prevEnd === null || (t.date! > prevEnd);
        return afterPrev && t.date! <= trip.end_date;
      })
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    runningBalance = runningBalance + freshCash - cashExpenses;
    result.push({ trip, freshCash, cashExpenses, lastBalance: runningBalance });
    prevEnd = trip.end_date;
  }

  return result;
}

/**
 * Current cash wallet balance — the simple "sum of cash I received minus all
 * cash expenses" view. Includes:
 *   - every entry in cash_received (per-trip fresh cash deposits)
 *   - every Cash transaction's signed amount (positive Cash/Income +,
 *     negative Cash expenses −)
 *
 * This is independent of trips: even cash spent after the last trip ended
 * (or before the first trip started) is reflected here. The per-trip
 * "Last balance" column in computeTripBalances is a separate snapshot view.
 */
export function cashWalletBalance(
  transactions: Transaction[],
  cashReceived: CashReceived[]
): number {
  const txnSum = transactions
    .filter((t) => t.funding_source === 'Cash')
    .reduce((sum, t) => sum + t.amount, 0);
  const depositsSum = cashReceived.reduce((sum, c) => sum + c.amount, 0);
  return depositsSum + txnSum;
}

/** Snapshot helper — balance after the most recent trip (per-trip rollup). */
export function currentCashBalance(balances: TripBalance[]): number {
  return balances.length ? balances[balances.length - 1].lastBalance : 0;
}
