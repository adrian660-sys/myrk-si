import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import AmountVisibilityToggle from './AmountVisibilityToggle';
import { useAuth } from '../hooks/useAuth';
import { setLanguage } from '../i18n';

export default function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { email, role, signOut } = useAuth();
  const { t, i18n } = useTranslation();

  const pmItems = [
    { to: '/dashboard', label: t('nav.dashboard') },
    { to: '/transactions', label: t('nav.transactions') },
    { to: '/projects', label: t('nav.projects') },
    { to: '/trips', label: t('nav.trips') },
    { to: '/planned', label: t('nav.planned') },
    { to: '/invoices', label: t('nav.invoices') },
    { to: '/clients', label: t('nav.clients') },
    { to: '/import', label: t('nav.import'), adminOnly: true },
    { to: '/settings', label: t('nav.settings'), adminOnly: true },
  ];

  const personalItems = [
    { to: '/personal/dashboard', label: t('nav.personalDashboard') },
    { to: '/personal/transactions', label: t('nav.personalTransactions') },
    { to: '/personal/planned', label: t('nav.personalPlanned') },
    { to: '/personal/settings', label: t('nav.personalSettings') },
  ];

  const navClass = ({ isActive }: { isActive: boolean }) =>
    `block px-3 py-2 rounded-lg text-sm transition-colors ${
      isActive
        ? 'bg-sidebarActive text-white font-medium'
        : 'text-white/60 hover:bg-sidebarHover hover:text-white/90'
    }`;

  return (
    <aside className="h-full w-64 shrink-0 bg-sidebar text-white flex flex-col">
      <div className="px-5 py-5 border-b border-white/8">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="font-display text-lg leading-tight text-white/95">{t('nav.appName')}</div>
            <div className="text-xs text-white/40 mt-0.5 truncate">{email}</div>
          </div>
          <AmountVisibilityToggle />
        </div>
        {role === 'guest' && (
          <span className="chip mt-2 bg-white/10 text-white/70 text-[11px]">{t('nav.readOnly')}</span>
        )}
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {pmItems
          .filter((i) => !i.adminOnly || role === 'admin')
          .map((i) => (
            <NavLink key={i.to} to={i.to} onClick={onNavigate} className={navClass}>
              {i.label}
            </NavLink>
          ))}

        {role === 'admin' && (
          <>
            <div className="px-3 pt-5 pb-1.5 text-[10px] uppercase tracking-widest text-white/30 font-medium">
              {t('nav.personalSection')}
            </div>
            {personalItems.map((i) => (
              <NavLink key={i.to} to={i.to} onClick={onNavigate} className={navClass}>
                {i.label}
              </NavLink>
            ))}
          </>
        )}
      </nav>

      <div className="p-3 border-t border-white/8 space-y-1">
        <div className="flex gap-1 px-3 py-1">
          {(['en', 'fr'] as const).map((lang) => (
            <button
              key={lang}
              onClick={() => setLanguage(lang)}
              className={`text-xs px-2 py-0.5 rounded-md transition-colors ${
                i18n.language === lang
                  ? 'bg-white/15 text-white'
                  : 'text-white/35 hover:text-white/60'
              }`}
            >
              {lang.toUpperCase()}
            </button>
          ))}
        </div>
        <button
          onClick={signOut}
          className="w-full text-left px-3 py-2 text-sm text-white/50 hover:bg-sidebarHover hover:text-white/80 rounded-lg transition-colors"
        >
          {t('nav.signOut')}
        </button>
      </div>
    </aside>
  );
}
