import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import Projects from './pages/Projects';
import Trips from './pages/Trips';
import Planned from './pages/Planned';
import Clients from './pages/Clients';
import Invoices from './pages/Invoices';
import InvoiceDetail from './pages/InvoiceDetail';
import Import from './pages/Import';
import Settings from './pages/Settings';
import PersonalDashboard from './pages/personal/Dashboard';
import PersonalTransactions from './pages/personal/Transactions';
import PersonalPlanned from './pages/personal/Planned';
import PersonalSettings from './pages/personal/Settings';

export default function App() {
  const { session, loading, role } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center text-muted">Loading…</div>
    );
  }

  if (!session) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/login" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/transactions" element={<Transactions />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/income" element={<Navigate to="/projects" replace />} />
        <Route path="/trips" element={<Trips />} />
        <Route path="/planned" element={<Planned />} />
        <Route path="/clients" element={<Clients />} />
        <Route path="/invoices" element={<Invoices />} />
        <Route
          path="/invoices/new"
          element={role === 'admin' ? <InvoiceDetail /> : <Navigate to="/invoices" replace />}
        />
        <Route path="/invoices/:id" element={<InvoiceDetail />} />
        <Route
          path="/import"
          element={role === 'admin' ? <Import /> : <Navigate to="/dashboard" replace />}
        />
        <Route
          path="/settings"
          element={role === 'admin' ? <Settings /> : <Navigate to="/dashboard" replace />}
        />
        <Route
          path="/personal/dashboard"
          element={role === 'admin' ? <PersonalDashboard /> : <Navigate to="/dashboard" replace />}
        />
        <Route
          path="/personal/transactions"
          element={role === 'admin' ? <PersonalTransactions /> : <Navigate to="/dashboard" replace />}
        />
        <Route
          path="/personal/planned"
          element={role === 'admin' ? <PersonalPlanned /> : <Navigate to="/dashboard" replace />}
        />
        <Route
          path="/personal/settings"
          element={role === 'admin' ? <PersonalSettings /> : <Navigate to="/dashboard" replace />}
        />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Layout>
  );
}
