import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import {
  readAmountsHiddenFromStorage,
  registerAmountHiddenGetter,
  writeAmountsHiddenToStorage,
} from '../lib/amountVisibility';

interface AmountVisibilityValue {
  hidden: boolean;
  toggle: () => void;
  setHidden: (value: boolean) => void;
}

const AmountVisibilityContext = createContext<AmountVisibilityValue | undefined>(undefined);

export function AmountVisibilityProvider({ children }: { children: ReactNode }) {
  const [hidden, setHiddenState] = useState(readAmountsHiddenFromStorage);

  useEffect(() => {
    registerAmountHiddenGetter(() => hidden);
  }, [hidden]);

  const setHidden = useCallback((value: boolean) => {
    setHiddenState(value);
    writeAmountsHiddenToStorage(value);
  }, []);

  const toggle = useCallback(() => {
    setHidden(!hidden);
  }, [hidden, setHidden]);

  return (
    <AmountVisibilityContext.Provider value={{ hidden, toggle, setHidden }}>
      {children}
    </AmountVisibilityContext.Provider>
  );
}

export function useAmountVisibility(): AmountVisibilityValue {
  const ctx = useContext(AmountVisibilityContext);
  if (!ctx) {
    throw new Error('useAmountVisibility must be used inside AmountVisibilityProvider');
  }
  return ctx;
}
