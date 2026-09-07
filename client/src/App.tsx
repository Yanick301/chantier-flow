import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { Toaster } from 'react-hot-toast';
import Layout from './components/layout/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Chantiers from './pages/Chantiers';
import ChantierDetail from './pages/ChantierDetail';
import Fonds from './pages/Fonds';
import Depenses from './pages/Depenses';
import DepenseDetail from './pages/DepenseDetail';
import Users from './pages/Users';
import AuditLog from './pages/AuditLog';
import { Shield, ArrowLeft } from 'lucide-react';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 bg-slate-900 rounded-lg flex items-center justify-center">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div className="w-6 h-6 border-2 border-slate-200 border-t-slate-900 rounded-full animate-spin" />
        </div>
      </div>
    );
  }
  return user ? <>{children}</> : <Navigate to="/login" replace />;
}

function RoleRoute({ children, allowedRoles }: { children: React.ReactNode; allowedRoles: string[] }) {
  const { user } = useAuth();
  if (!user || !allowedRoles.includes(user.role)) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 flex flex-col items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-14 h-14 bg-red-50 rounded-xl flex items-center justify-center mx-auto mb-4 border border-red-100">
            <span className="text-2xl">🔒</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Accès restreint</h2>
          <p className="text-slate-500 text-sm mb-6">Vous n'avez pas les droits nécessaires pour accéder à cette page.</p>
          <Link to="/" className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-medium py-2.5 px-5 rounded-xl transition-colors text-sm">
            <ArrowLeft size={16} />
            Retour au tableau de bord
          </Link>
        </div>
      </div>
    );
  }
  return <>{children}</>;
}

function NotFound() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="text-center">
        <div className="text-7xl font-bold text-slate-200 mb-3">404</div>
        <h1 className="text-xl font-bold text-slate-900 mb-2">Page introuvable</h1>
        <p className="text-slate-500 text-sm mb-8">La page que vous recherchez n'existe pas ou a été déplacée.</p>
        <Link to="/" className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-medium py-2.5 px-5 rounded-xl transition-colors text-sm">
          <ArrowLeft size={16} />
          Retour à l'accueil
        </Link>
      </div>
    </div>
  );
}

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
        <Route index element={<Dashboard />} />
        <Route path="chantiers" element={<Chantiers />} />
        <Route path="chantiers/:id" element={<ChantierDetail />} />
        <Route path="fonds" element={<Fonds />} />
        <Route path="depenses" element={<Depenses />} />
        <Route path="depenses/:id" element={<DepenseDetail />} />
        <Route path="utilisateurs" element={
          <RoleRoute allowedRoles={['president']}><Users /></RoleRoute>
        } />
        <Route path="audit" element={
          <RoleRoute allowedRoles={['president']}><AuditLog /></RoleRoute>
        } />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#0f172a',
              color: '#f8fafc',
              borderRadius: '10px',
              fontSize: '14px',
              fontFamily: 'Inter, system-ui, sans-serif',
              padding: '12px 16px',
            },
            success: { iconTheme: { primary: '#10b981', secondary: '#f8fafc' } },
            error: { iconTheme: { primary: '#ef4444', secondary: '#f8fafc' } },
          }}
        />
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}

export default App;
