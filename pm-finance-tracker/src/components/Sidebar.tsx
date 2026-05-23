import { NavLink } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

interface Item {
  to: string;
  label: string;
  adminOnly?: boolean;
}

const items: Item[] = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/transactions', label: 'Transactions' },
  { to: '/trips', label: 'Trips' },
  { to: '/planned', label: 'Planned & bills' },
  { to: '/import', label: 'Import' },
  { to: '/settings', label: 'Settings', adminOnly: true },
];

export default function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { email, role, signOut } = useAuth();
  return (
    <aside className="h-full w-64 shrink-0 bg-sidebar text-white flex flex-col">
      <div className="px-5 py-5 border-b border-white/10">
        <div className="font-semibold tracking-tight">PM Finance</div>
        <div className="text-xs text-white/50 mt-0.5">{email}</div>
        {role === 'guest' && (
          <span className="chip mt-2 bg-white/10 text-white/80">read-only</span>
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
      <div className="p-3 border-t border-white/10">
        <button
          onClick={signOut}
          className="w-full text-left px-3 py-2 text-sm text-white/70 hover:bg-sidebarHover hover:text-white rounded-md"
        >
          Sign out
        </button>
      </div>
    </aside>
  );
}
