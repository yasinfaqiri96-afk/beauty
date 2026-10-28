import { HashRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Sales from './pages/Sales';
import Purchase from './pages/Purchase';
import Customers from './pages/Customers';
import Suppliers from './pages/Suppliers';
import Reports from './pages/Reports';
import Warehouse from './pages/Warehouse';
import Branches from './pages/Branches';
import Login from './pages/Login';
import Layout from './components/Layout';
import FeedbackHost from './components/FeedbackHost';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { token, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-accent-50 via-primary-50/30 to-accent-100/50 flex items-center justify-center">
        <div className="glass-card p-8 rounded-3xl text-center animate-scale-in">
          <div className="w-16 h-16 brand-gradient rounded-2xl flex items-center justify-center mx-auto mb-4 animate-float">
            <span className="text-white font-bold text-2xl">N</span>
          </div>
          <div className="space-y-2">
            <div className="h-4 bg-accent-200 rounded animate-pulse w-32 mx-auto"></div>
            <div className="h-3 bg-accent-100 rounded animate-pulse w-24 mx-auto"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function AppContent() {
  const location = useLocation();
  const path = location.pathname === '/' ? 'dashboard' : location.pathname.slice(1).split('/')[0];

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <Layout currentPage={path}>
              <Routes>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/products" element={<Products />} />
                <Route path="/sales" element={<Sales />} />
                <Route path="/purchase" element={<Purchase />} />
                <Route path="/customers" element={<Customers />} />
                <Route path="/suppliers" element={<Suppliers />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/warehouse" element={<Warehouse />} />
                <Route path="/branches" element={<Branches />} />
              </Routes>
            </Layout>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default function App() {
  return (
    <HashRouter>
      <AuthProvider>
        <AppContent />
        <FeedbackHost />
      </AuthProvider>
    </HashRouter>
  );
}
