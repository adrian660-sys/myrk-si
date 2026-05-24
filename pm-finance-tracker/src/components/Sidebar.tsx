import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../hooks/useAuth';
import { setLanguage } from '../i18n';

export default function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { email, role, signOut } = useAuth();
  const { t, i18n } = useTranslation();

  const items = [
    { to: '/dashboard', label: t('nav.dashboard') },
    { to: '/transactions', label: t('nav.transactions') },
    { to: '/projects', label: t('nav.projects') },
    { to: '/trips', label: t('nav.trips') },
    { to: '/planned', label: t('nav.planned') },
    { to: '/import', label: t('nav.import'), adminOnly: true },
    { to: '/settings', label: t('nav.settings'), adminOnly: true },
  ];

  return (
    <aside className="h-full w-64 shrink-0 bg-sidebar text-white flex flex-col">
      <div className="px-5 py-5 border-b border-white/10">
        <div className="font-semibold tracking-tight">{t('nav.appName')}</div>
        <div className="text-xs text-white/50 mt-0.5">{email}</div>
        {role === 'guest' && (
          <span className="chip mt-2 bg-white/10 text-white/80">{t('nav.readOnly')}</span>
        )}
      </div>
      <nav className="flex-1 px-2 py-4 space-y-0.5">
        {items
          .filter((i) => !i.adminOnly || role === 'admin')
          .map((i) => (
            <NavLink
              key={i.to}
              to={i.to}
              onClick={onNavigate}
              className={({ isActive }) =>
                `block px-3 py-2 rounded-md text-sm ${
                  isActive
                    ? 'bg-white/10 text-white'
                    : 'text-white/70 hover:bg-sidebarHover hover:text-white'
                }`
              }
            >
              {i.label}
            </NavLink>
          ))}
      </nav>
      <div className="p-3 border-t border-white/10 space-y-1">
        <div className="flex gap-1 px-3 py-1">
          {(['en', 'fr'] as const).map((lang) => (
            <button
              key={lang}
              onClick={() => setLanguage(lang)}
              className={`text-xs px-2 py-0.5 rounded transition-colors ${
                i18n.language === lang
                  ? 'bg-white/20 text-white'
                  : 'text-white/40 hover:text-white/70'
              }`}
            >
              {lang.toUpperCase()}
            </button>
          ))}
        </div>
        <button
          onClick={signOut}
          className="w-full text-left px-3 py-2 text-sm text-white/70 hover:bg-sidebarHover hover:text-white rounded-md"
        >
          {t('nav.signOut')}
        </button>
      </div>
    </aside>
  );
}
