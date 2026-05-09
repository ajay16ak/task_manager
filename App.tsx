import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import { Home, LayoutDashboard, LogOut, User as UserIcon } from 'lucide-react';
import TasksPage from './pages/taskpage';
import Login from './pages/Login';
import Register from './pages/Register';
import { useAuth } from './context/AuthContext';

import { Toaster } from 'sonner';

function LandingPage() {
  const [backendMessage, setBackendMessage] = useState('Checking backend...');
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    fetch('/api/')
      .then((response) => response.json())
      .then((data) => {
        setBackendMessage(data.message);
      })
      .catch((error) => {
        console.error('Backend connection error:', error);
        setBackendMessage('Backend connection failed');
      });
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh]">
      <div className="glass-panel p-12 max-w-3xl text-center space-y-6">
        <h1 className="text-5xl font-extrabold gradient-text tracking-tight">
          Welcome to TaskMaster Pro
        </h1>

        <p className="text-sm text-yellow-300 font-medium">
          Backend status: {backendMessage}
        </p>

        <p className="text-xl text-textSecondary leading-relaxed">
          The ultimate full-stack solution to manage your workflows with ease and aesthetic brilliance.
        </p>

        <div className="pt-8 flex gap-4 justify-center">
          {isAuthenticated ? (
            <Link to="/dashboard" className="px-8 py-3 bg-primary hover:bg-primary/80 transition-colors rounded-lg font-semibold text-white shadow-lg flex items-center gap-2">
              <LayoutDashboard size={20} />
              Go to Dashboard
            </Link>
          ) : (
            <>
              <Link to="/login" className="px-8 py-3 bg-primary hover:bg-primary/80 transition-colors rounded-lg font-semibold text-white shadow-lg flex items-center gap-2">
                <UserIcon size={20} />
                Sign In
              </Link>
              <Link to="/register" className="px-8 py-3 bg-surface border border-white/20 hover:bg-white/5 transition-colors rounded-lg font-semibold text-white shadow-lg flex items-center gap-2">
                Create Account
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Navigation() {
  const { isAuthenticated, logout } = useAuth();

  return (
    <nav className="border-b border-white/10 bg-surface/50 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xl font-bold gradient-text">
          <Home className="text-secondary" />
          TaskMaster
        </div>

        <div className="flex gap-6 items-center text-sm font-medium text-textSecondary">
          <Link to="/" className="hover:text-secondary transition-colors">
            Home
          </Link>
          {isAuthenticated ? (
            <>
              <Link to="/dashboard" className="hover:text-secondary transition-colors">
                Dashboard
              </Link>
              <button 
                onClick={logout}
                className="flex items-center gap-1 hover:text-red-400 transition-colors"
              >
                <LogOut size={16} />
                Logout
              </button>
            </>
          ) : (
            <Link to="/login" className="hover:text-secondary transition-colors">
              Sign In
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  return <>{children}</>;
};

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-background">
        <Toaster theme="dark" richColors position="top-right" />
        <Navigation />
        <main className="max-w-7xl mx-auto px-6 py-10">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <TasksPage />
              </ProtectedRoute>
            } />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;