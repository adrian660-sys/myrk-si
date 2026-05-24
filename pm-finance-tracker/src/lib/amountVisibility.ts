/** Mask shown when amounts are hidden (privacy mode). */
export const AMOUNT_MASK = '••••••';

let hiddenGetter: () => boolean = () => false;

export function registerAmountHiddenGetter(getter: () => boolean): void {
  hiddenGetter = getter;
}

export function areAmountsHidden(): boolean {
  return hiddenGetter();
}

export const AMOUNTS_HIDDEN_KEY = 'pmf:amounts-hidden';

export function readAmountsHiddenFromStorage(): boolean {
  try {
    return localStorage.getItem(AMOUNTS_HIDDEN_KEY) === '1';
  } catch {
    return false;
  }
}

export function writeAmountsHiddenToStorage(hidden: boolean): void {
  try {
    localStorage.setItem(AMOUNTS_HIDDEN_KEY, hidden ? '1' : '0');
  } catch {
    /* ignore */
  }
}
