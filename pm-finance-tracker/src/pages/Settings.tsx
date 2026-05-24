import { useTranslation } from 'react-i18next';
import PmCatalogSettings from '../components/PmCatalogSettings';
import { useAuth } from '../hooks/useAuth';
import { useFinanceData } from '../hooks/useFinanceData';
import { PER_DIEM_RATE, REMOTE_WORK_RATE } from '../lib/constants';
import { formatPlainAmount } from '../lib/format';

export default function Settings() {
  const { t } = useTranslation();
  const { email } = useAuth();
  const { pmCategories, pmSubcategories, reload } = useFinanceData();

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-4">
      <header>
        <h1 className="text-2xl font-semibold">{t('settings.title')}</h1>
        <p className="text-sm text-muted">{t('settings.subtitle')}</p>
      </header>

      <section className="card-pad space-y-2">
        <h2 className="font-semibold">{t('settings.account')}</h2>
        <div className="text-sm text-muted">
          {t('settings.signedInAs')} <span className="text-ink">{email}</span>
        </div>
      </section>

      <PmCatalogSettings
        categories={pmCategories}
        subcategories={pmSubcategories}
        onChanged={reload}
      />

      <section className="card-pad space-y-2">
        <h2 className="font-semibold">{t('settings.fixedRates')}</h2>
        <div className="text-sm">
          {t('settings.perDiem')}: <span className="font-medium">€{formatPlainAmount(PER_DIEM_RATE)}/day</span> ·
          {t('settings.remoteWork')}: <span className="font-medium ml-1">€{formatPlainAmount(REMOTE_WORK_RATE)}/day</span>
        </div>
        <p className="text-xs text-muted">{t('settings.ratesInConstants')}</p>
      </section>

      <section className="card-pad space-y-2">
        <h2 className="font-semibold">{t('settings.users')}</h2>
        <p className="text-sm text-muted">{t('settings.usersHint')}</p>
      </section>
    </div>
  );
}
