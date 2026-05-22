import { useState, type ReactNode } from 'react';
import Sidebar from './Sidebar';
import QuickEntryButton from './QuickEntryButton';

export default function Layout({ children }: { children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="h-screen flex bg-canvas">
      {/* Desktop sidebar */}
      <div className="hidden md:block h-full">
        <Sidebar />
      </div>

      {/* Mobile sidebar */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-40 flex">
          <div className="h-full">
            <Sidebar onNavigate={() => setMobileOpen(false)} />
          </div>
          <button
            aria-label="Close menu"
            className="flex-1 bg-black/40"
            onClick={() => setMobileOpen(false)}
          />
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <header className="md:hidden flex items-center justify-between border-b border-line bg-white px-4 h-14">
          <button
            onClick={() => setMobileOpen(true)}
            className="text-sm font-medium"
            aria-label="Open menu"
          >
            ☰ Menu
          </button>
          <span className="font-semibold">PM Finance</span>
          <span className="w-12" />
        </header>
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>

      <QuickEntryButton />
    </div>
  );
}
