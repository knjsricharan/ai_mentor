import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import AuthOnboardingContainer from './components/AuthOnboardingContainer';
import Dashboard from './pages/Dashboard';
import ProjectDetail from './pages/ProjectDetail';
import ProtectedRoute from './components/ProtectedRoute';
import { useState, useEffect } from 'react';

function AppRoutes() {
  const { user, userProfile, profileLoading, isProfileComplete } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);

  const handleOnboardingComplete = () => {
    // Onboarding completion is now handled in AuthOnboardingContainer
    // and saved to Firestore when user is authenticated
  };

  // Show loading while checking auth and profile
  if (profileLoading && user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <img 
            src="/logo.jpeg" 
            alt="CereBro AI" 
            className="w-12 h-12 object-contain mx-auto mb-4"
          />
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route
        path="/login"
        element={
          <AuthOnboardingContainer
            onOnboardingComplete={handleOnboardingComplete}
            initialView="auth"
          />
        }
      />

      <Route
        path="/onboarding"
        element={
          <AuthOnboardingContainer
            onOnboardingComplete={handleOnboardingComplete}
          />
        }
      />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard projects={projects} setProjects={setProjects} />
          </ProtectedRoute>
        }
      />

      <Route
        path="/project/:id"
        element={
          <ProtectedRoute>
            <ProjectDetail projects={projects} setProjects={setProjects} />
          </ProtectedRoute>
        }
      />

      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}

export default App;
