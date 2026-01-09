import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProfileForm from './components/ProfileForm';
import Dashboard from './pages/Dashboard';
import ProjectDetail from './pages/ProjectDetail';
import ProtectedRoute from './components/ProtectedRoute';
import SignInPage from './components/pages/SignInPage';
import { useState, useEffect } from 'react';

// Onboarding Profile View Component
function OnboardingProfileView({ onProfileSubmit }) {
  const { user, userProfile, profileLoading, isProfileComplete } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!profileLoading && isProfileComplete) {
      navigate('/dashboard');
    }
  }, [isProfileComplete, profileLoading, navigate]);

  const backgroundStyle = {
    backgroundImage: `
      radial-gradient(circle at 20% 20%, rgba(0,230,200,0.12), transparent 35%),
      radial-gradient(circle at 80% 0%, rgba(105,56,239,0.14), transparent 40%),
      linear-gradient(120deg, rgba(0,230,200,0.06), rgba(105,56,239,0.08)),
      linear-gradient(180deg, #0b1120 0%, #0a0f1a 50%, #080c16 100%)
    `,
    backgroundSize: `
      auto,
      auto,
      140% 140%,
      100% 100%
    `,
    backgroundPosition: `
      center,
      top right,
      0 0,
      0 0
    `,
    backgroundRepeat: `
      no-repeat,
      no-repeat,
      no-repeat,
      no-repeat
    `
  };

  return (
    <div className="h-screen w-screen overflow-y-auto" style={backgroundStyle}>
      <div className="min-h-screen flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-2xl">
          <div className="mb-8 text-center">
            <h1 className="text-4xl font-bold mb-2 gradient-text">
              Complete Your Profile
            </h1>
            <p className="text-lg text-slate-300">
              Help us get to know you better
            </p>
          </div>
          <div className="glass-panel shadow-[0_20px_80px_-45px_rgba(0,230,200,0.45)] p-8">
            <ProfileForm onSubmit={onProfileSubmit} />
          </div>
        </div>
      </div>
    </div>
  );
}

function AppRoutes() {
  const { user, userProfile, profileLoading, isProfileComplete, loginWithGoogle, refreshUserProfile } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);

  const handleProfileSubmit = async (data) => {
    console.log('Profile submitted:', data);
    await refreshUserProfile();
    // Navigation is handled by the onboarding route's useEffect
  };

  // Show loading while checking auth and profile
  if (profileLoading && user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-dark-900 via-[#0b1729] to-[#0a0f1a] flex items-center justify-center">
        <div className="text-center text-slate-200">
          <img 
            src="/logo.jpeg" 
            alt="CereBro AI" 
            className="w-12 h-12 object-contain mx-auto mb-4"
          />
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent mb-4"></div>
          <p className="text-slate-300">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route
        path="/sign-in"
        element={
          user ? <Navigate to="/dashboard" replace /> : <SignInPage onGoogleSignIn={loginWithGoogle} />
        }
      />

      <Route
        path="/onboarding"
        element={
          <ProtectedRoute>
            <OnboardingProfileView onProfileSubmit={handleProfileSubmit} />
          </ProtectedRoute>
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

      {/* Legacy routes redirect to sign-in */}
      <Route path="/login" element={<Navigate to="/sign-in" replace />} />
      <Route path="/" element={<Navigate to="/sign-in" replace />} />
      <Route path="*" element={<Navigate to="/sign-in" replace />} />
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
