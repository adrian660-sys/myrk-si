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
 *   lastBalance(N) = lastBalance(N-1) + freshCash(N) - cashExpenses(N)
 *   lastBalance(0) =                    freshCash(0) - cashExpenses(0)
 *
 * Cash expenses for a trip are every Cash transaction with a negative amount
 * that is either linked to the trip directly, or unlinked but dated between
 * the end of the previous trip and the end of this trip — a flight bought
 * months earlier still belongs to the trip it is manually linked to.
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
    (t) => t.funding_source === 'Cash' && t.amount < 0
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
        if (t.trip_id === trip.id) return true;
        // Unlinked cash spend dated within this trip's window.
        if (t.trip_id === null && t.date) {
          const afterPrev = prevEnd === null || t.date > prevEnd;
          return afterPrev && t.date <= trip.end_date;
        }
        return false;
      })
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    runningBalance = runningBalance + freshCash - cashExpenses;
    result.push({ trip, freshCash, cashExpenses, lastBalance: runningBalance });
    prevEnd = trip.end_date;
  }

  return result;
}

/** Current cash balance = balance after the most recent trip. */
export function currentCashBalance(balances: TripBalance[]): number {
  return balances.length ? balances[balances.length - 1].lastBalance : 0;
}
