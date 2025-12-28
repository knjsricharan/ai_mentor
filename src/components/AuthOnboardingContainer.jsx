import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import OnboardingWizard from './OnboardingWizard';
import Login from '../pages/Login';
import ProfileForm from './ProfileForm';

const AuthOnboardingContainer = ({
  onOnboardingComplete,
  onAuthSuccess,
  initialView = 'onboarding'
}) => {
  const navigate = useNavigate();
  const { user, userProfile, profileLoading, isProfileComplete, refreshUserProfile } = useAuth();
  const [currentView, setCurrentView] = useState(initialView);
  const [isExiting, setIsExiting] = useState(false);
  const [isEntering, setIsEntering] = useState(true);
  const [showProfilePage, setShowProfilePage] = useState(false);

  // Check if user has completed profile when authenticated
  useEffect(() => {
    if (user && !profileLoading) {
      // If user is authenticated and profile is complete, redirect to dashboard
      if (isProfileComplete) {
        navigate('/dashboard');
        return;
      }
      
      // If user is authenticated but profile is incomplete, show profile form
      // Only do this if we're on the auth view (not onboarding)
      if (userProfile && !isProfileComplete && initialView === 'auth' && currentView === 'auth') {
        // User just logged in and needs to complete profile
        setCurrentView('welcome1');
      }
    }
  }, [user, userProfile, profileLoading, isProfileComplete, initialView, navigate, currentView]);
  
  useEffect(() => {
    if (initialView === 'auth') {
      const hasSeenOnboarding = localStorage.getItem('hasSeenOnboarding');
      if (!hasSeenOnboarding) {
        setCurrentView('onboarding');
      }
    }
  }, [initialView]);

  // Handle enter animation for new views
  useEffect(() => {
    if (currentView === 'welcome1' || currentView === 'welcome2') {
      setIsExiting(false);
      setIsEntering(true);
      // Trigger enter animation after a brief moment
      const enterTimer = setTimeout(() => {
        setIsEntering(false);
      }, 50);
      return () => clearTimeout(enterTimer);
    }
  }, [currentView]);

  // Handle transition to profile page
  useEffect(() => {
    if (currentView === 'profile') {
      setShowProfilePage(true);
      setIsEntering(true);
      const timer = setTimeout(() => {
        setIsEntering(false);
      }, 50);
      return () => clearTimeout(timer);
    } else {
      setShowProfilePage(false);
    }
  }, [currentView]);

  // Auto-advance welcome screens
  useEffect(() => {
    if (currentView === 'welcome1') {
      const timer = setTimeout(() => {
        setIsExiting(true);
        setTimeout(() => {
          setCurrentView('welcome2');
        }, 1500); // Fade transition duration
      }, 1500); // Auto-advance after 1.5 seconds
      return () => clearTimeout(timer);
    }
  }, [currentView]);

  useEffect(() => {
    if (currentView === 'welcome2') {
      const timer = setTimeout(() => {
        setIsExiting(true);
        setTimeout(() => {
          setCurrentView('profile');
        }, 1500); // Fade transition duration
      }, 1500); // Auto-advance after 1.5 seconds
      return () => clearTimeout(timer);
    }
  }, [currentView]);

  const handleOnboardingComplete = () => {
    localStorage.setItem('hasSeenOnboarding', 'true');
    setCurrentView('auth');
    onOnboardingComplete?.();
  };

  const handleAuthSuccess = () => {
    // The useEffect hook will handle routing based on profile completion
    // It will check if profile is complete and redirect accordingly
    // If profile is incomplete, it will show welcome screens
    onAuthSuccess?.();
  };

  const handleProfileSubmit = async (data) => {
    console.log('Profile submitted:', data);
    // Profile is saved to Firestore by ProfileForm component
    // Refresh user profile to update context
    await refreshUserProfile();
    // Navigate to dashboard after profile submission
    navigate('/dashboard');
  };

  // Classic AI-inspired background pattern
  const backgroundStyle = {
    backgroundImage: `
      radial-gradient(circle at 50% 0%, rgba(79,70,229,0.18), transparent 55%),
      radial-gradient(circle at 100% 100%, rgba(124,58,237,0.16), transparent 60%),
      linear-gradient(rgba(79,70,229,0.05) 1px, transparent 1px),
      linear-gradient(90deg, rgba(79,70,229,0.05) 1px, transparent 1px),
      linear-gradient(180deg, #f5f7fb 0%, #eef1f7 100%)
    `,
    backgroundSize: `
      auto,
      auto,
      40px 40px,
      40px 40px,
      100% 100%
    `,
    backgroundPosition: `
      top center,
      bottom right,
      0 0,
      0 0,
      0 0
    `,
    backgroundRepeat: `
      no-repeat,
      no-repeat,
      repeat,
      repeat,
      no-repeat
    `
  };

  // Show loading while checking profile
  if (user && profileLoading && initialView === 'auth') {
    return (
      <div 
        className="h-screen w-screen overflow-hidden flex items-center justify-center"
        style={backgroundStyle}
      >
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="h-screen w-screen overflow-hidden"
      style={backgroundStyle}
    >
      {/* Central Container - ONLY for onboarding and auth */}
      {(currentView === 'onboarding' || currentView === 'auth') && (
        <div className="h-full w-full flex items-center justify-center p-4">
          <div className="w-full max-w-[560px] h-[420px] bg-white rounded-[18px] shadow-xl flex flex-col overflow-hidden">
            {/* CONTENT AREA - No scroll for onboarding/auth */}
            <div className="flex-1 overflow-hidden px-6 py-4">
              {currentView === 'onboarding' && (
                <OnboardingWizard onComplete={handleOnboardingComplete} />
              )}

              {currentView === 'auth' && (
                <Login onAuthSuccess={handleAuthSuccess} />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Welcome Screens - Rendered directly on background, outside any box */}
      {currentView === 'welcome1' && (
        <div 
          className="h-screen w-screen flex items-center justify-center transition-opacity"
          style={{ 
            transitionDuration: '1500ms',
            transitionTimingFunction: 'ease-in-out',
            opacity: isExiting || isEntering ? 0 : 1
          }}
        >
          <h1 
            className="text-6xl" 
            style={{ 
              letterSpacing: '0.02em',
              color: '#818cf8' // light blue / soft indigo
            }}
          >
            Welcome to <span className="font-bold">CereBro</span> <span className="font-normal">AI</span>
          </h1>
        </div>
      )}

      {currentView === 'welcome2' && (
        <div 
          className="h-screen w-screen flex items-center justify-center transition-opacity"
          style={{ 
            transitionDuration: '1500ms',
            transitionTimingFunction: 'ease-in-out',
            opacity: isExiting || isEntering ? 0 : 1
          }}
        >
          <h2 
            className="text-6xl font-bold" 
            style={{ 
              letterSpacing: '0.01em',
              color: '#818cf8' // light blue / soft indigo
            }}
          >
            Please complete your profile
          </h2>
        </div>
      )}

      {/* Full-Page Profile Layout */}
      {showProfilePage && (
        <div 
          className={`h-screen w-screen overflow-y-auto transition-all ${
            isEntering 
              ? 'opacity-0 scale-95' 
              : 'opacity-100 scale-100'
          }`}
          style={{ 
            ...backgroundStyle,
            transitionDuration: '700ms',
            transitionTimingFunction: 'ease-in-out'
          }}
        >
          <div className="min-h-screen flex items-center justify-center py-12 px-4">
            <div className="w-full max-w-2xl">
              <div className="mb-8 text-center">
                <h1 className="text-4xl font-bold mb-2" style={{ color: '#6366f1' }}>
                  Complete Your Profile
                </h1>
                <p className="text-lg" style={{ color: '#6b7280' }}>
                  Help us get to know you better
                </p>
              </div>
              <div className="bg-white rounded-[18px] shadow-xl p-8">
                <ProfileForm onSubmit={handleProfileSubmit} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuthOnboardingContainer;
