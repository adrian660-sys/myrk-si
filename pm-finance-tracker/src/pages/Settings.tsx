import { useAuth } from '../hooks/useAuth';
import { CATEGORIES, SUBCATEGORIES, PER_DIEM_RATE, REMOTE_WORK_RATE } from '../lib/constants';

export default function Settings() {
  const { email } = useAuth();

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-4">
      <header>
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="text-sm text-muted">Admin-only configuration overview.</p>
      </header>

      <section className="card-pad space-y-2">
        <h2 className="font-semibold">Account</h2>
        <div className="text-sm text-muted">Signed in as <span className="text-ink">{email}</span></div>
      </section>

      <section className="card-pad space-y-3">
        <h2 className="font-semibold">Categories</h2>
        <p className="text-sm text-muted">
          Categories and subcategories are defined in code (<code>src/lib/constants.ts</code>) to
          keep parsers and forms consistent.
        </p>
        <div className="grid md:grid-cols-2 gap-3">
          {CATEGORIES.map((c) => (
            <div key={c} className="rounded-md border border-line p-3">
              <div className="font-medium">{c}</div>
              <div className="text-sm text-muted mt-1">
                {SUBCATEGORIES[c].length === 0
                  ? '(no subcategories)'
                  : SUBCATEGORIES[c].join(' · ')}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="card-pad space-y-2">
        <h2 className="font-semibold">Fixed daily rates</h2>
        <div className="text-sm">
          Per Diem: <span className="font-medium">€{PER_DIEM_RATE}/day</span> ·
          Remote Work: <span className="font-medium ml-1">€{REMOTE_WORK_RATE}/day</span>
        </div>
        <p className="text-xs text-muted">
          Change these in <code>src/lib/constants.ts</code>.
        </p>
      </section>

      <section className="card-pad space-y-2">
        <h2 className="font-semibold">Users</h2>
        <p className="text-sm text-muted">
          Manage users through the Supabase dashboard. The admin email is set in
          <code className="mx-1">VITE_ADMIN_EMAIL</code> and enforced server-side by the
          <code className="mx-1">public.is_admin()</code> function in RLS.
        </p>
      </section>
    </div>
  );
}
