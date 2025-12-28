import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import AuthOnboardingContainer from './components/AuthOnboardingContainer';
import Dashboard from './pages/Dashboard';
import ProjectDetail from './pages/ProjectDetail';
import ProtectedRoute from './components/ProtectedRoute';
import { useState, useEffect } from 'react';

function AppRoutes() {
  const { user, userProfile, profileLoading, isProfileComplete } = useAuth();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(false);
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    // Check if user has seen onboarding before (localStorage for first-time app visit)
    const seen = localStorage.getItem('hasSeenOnboarding');
    if (!seen) {
      setShowOnboarding(true);
    } else {
      setHasSeenOnboarding(true);
    }
  }, []);

  // Check if authenticated user needs to complete profile
  useEffect(() => {
    if (user && !profileLoading) {
      // If user is authenticated but profile is incomplete, they should complete it
      // This is handled by AuthOnboardingContainer, so we don't need to redirect here
      // Just ensure onboarding state is set correctly
      if (userProfile && !isProfileComplete) {
        // User needs to complete profile - AuthOnboardingContainer will handle this
      } else if (isProfileComplete) {
        // Profile is complete, ensure onboarding is marked as seen
        setHasSeenOnboarding(true);
        setShowOnboarding(false);
      }
    }
  }, [user, userProfile, profileLoading, isProfileComplete]);

  const handleOnboardingComplete = () => {
    localStorage.setItem('hasSeenOnboarding', 'true');
    setShowOnboarding(false);
    setHasSeenOnboarding(true);
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
    <Router>
      <Routes>
        {showOnboarding && !hasSeenOnboarding ? (
          <Route 
            path="*" 
            element={
              <AuthOnboardingContainer 
                onOnboardingComplete={handleOnboardingComplete}
              />
            } 
          />
        ) : (
          <>
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
          </>
        )}
      </Routes>
    </Router>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}

export default App;
