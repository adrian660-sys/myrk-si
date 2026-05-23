import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import Trips from './pages/Trips';
import Planned from './pages/Planned';
import Import from './pages/Import';
import Settings from './pages/Settings';

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
        <Route path="/trips" element={<Trips />} />
        <Route path="/planned" element={<Planned />} />
        <Route path="/import" element={<Import />} />
        <Route
          path="/settings"
          element={role === 'admin' ? <Settings /> : <Navigate to="/dashboard" replace />}
        />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Layout>
  );
}
