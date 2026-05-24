import { useTranslation } from 'react-i18next';
import { useAmountVisibility } from '../hooks/useAmountVisibility';

interface Props {
  className?: string;
}

export default function AmountVisibilityToggle({ className = '' }: Props) {
  const { t } = useTranslation();
  const { hidden, toggle } = useAmountVisibility();

  return (
    <button
      type="button"
      onClick={toggle}
      className={`inline-flex items-center justify-center w-9 h-9 rounded-md transition-colors ${
        hidden
          ? 'bg-white/15 text-white hover:bg-white/25'
          : 'text-white/60 hover:bg-white/10 hover:text-white'
      } ${className}`}
      aria-pressed={hidden}
      aria-label={hidden ? t('amounts.show') : t('amounts.hide')}
      title={hidden ? t('amounts.show') : t('amounts.hide')}
    >
      {hidden ? (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
          <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
          <line x1="1" y1="1" x2="23" y2="23" />
          <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
        </svg>
      ) : (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      )}
    </button>
  );
}
