import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../hooks/useAuth';
import { setLanguage } from '../i18n';

export default function Login() {
  const { signIn } = useAuth();
  const { t, i18n } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const { error: err } = await signIn(email, password);
    setSubmitting(false);
    if (err) setError(err);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-canvas px-4">
      <div className="w-full max-w-sm card-pad">
        <div className="flex items-center justify-between mb-1">
          <h1 className="font-display text-2xl">{t('nav.appName')}</h1>
          <div className="flex gap-1">
            {(['en', 'fr'] as const).map((lang) => (
              <button
                key={lang}
                onClick={() => setLanguage(lang)}
                className={`text-xs px-2 py-0.5 rounded border transition-colors ${
                  i18n.language === lang
                    ? 'border-ink bg-ink text-white'
                    : 'border-line text-muted hover:text-ink'
                }`}
              >
                {lang.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
        <p className="text-sm text-muted mt-1">{t('login.subtitle')}</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="label">{t('login.email')}</label>
            <input className="input" type="email" autoComplete="email"
              value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div>
            <label className="label">{t('login.password')}</label>
            <input className="input" type="password" autoComplete="current-password"
              value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          {error && <div className="text-sm text-expense">{error}</div>}
          <button type="submit" className="btn-primary w-full" disabled={submitting}>
            {submitting ? t('login.signingIn') : t('login.signIn')}
          </button>
        </form>
      </div>
    </div>
  );
}
