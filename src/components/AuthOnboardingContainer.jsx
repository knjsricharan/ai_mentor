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
  const { user, userProfile, profileLoading, isProfileComplete, hasSeenOnboarding, refreshUserProfile } = useAuth();
  const [currentView, setCurrentView] = useState(initialView);
  const [isExiting, setIsExiting] = useState(false);
  const [isEntering, setIsEntering] = useState(true);
  const [showProfilePage, setShowProfilePage] = useState(false);
  const [onboardingCompletedBeforeLogin, setOnboardingCompletedBeforeLogin] = useState(false);

  useEffect(() => {
    if (initialView === 'auth' && !user) {
      if (currentView === 'auth') {
        setCurrentView('onboarding');
      }
    } else if (user && !profileLoading) {
      if (!hasSeenOnboarding && currentView === 'auth') {
        setCurrentView('onboarding');
      }
    }
  }, [initialView, user, currentView, hasSeenOnboarding, profileLoading]);

  useEffect(() => {
    if (user && onboardingCompletedBeforeLogin && !hasSeenOnboarding) {
      const saveOnboardingState = async () => {
        try {
          const { updateUserProfile } = await import('../services/userService');
          await updateUserProfile(user.uid, { hasSeenOnboarding: true });
          await refreshUserProfile();
          setOnboardingCompletedBeforeLogin(false);
        } catch (error) {
          console.error('Error saving onboarding state after login:', error);
        }
      };
      saveOnboardingState();
    }
  }, [user, onboardingCompletedBeforeLogin, hasSeenOnboarding, refreshUserProfile]);

  useEffect(() => {
    if (user && !profileLoading) {
      if (isProfileComplete) {
        navigate('/dashboard');
        return;
      }
      
      if (!isProfileComplete) {
        if (currentView === 'auth' || currentView === 'onboarding') {
          setCurrentView('welcome1');
        }
      }
    } else if (!user && currentView !== 'auth' && currentView !== 'onboarding') {
      setCurrentView('auth');
      setOnboardingCompletedBeforeLogin(false);
    }
  }, [user, userProfile, profileLoading, isProfileComplete, navigate, currentView]);

  useEffect(() => {
    if (currentView === 'welcome1' || currentView === 'welcome2') {
      setIsExiting(false);
      setIsEntering(true);
      const enterTimer = setTimeout(() => {
        setIsEntering(false);
      }, 50);
      return () => clearTimeout(enterTimer);
    }
  }, [currentView]);

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

  useEffect(() => {
    if (currentView === 'welcome1') {
      const timer = setTimeout(() => {
        setIsExiting(true);
        setTimeout(() => {
          setCurrentView('welcome2');
        }, 1500);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [currentView]);

  useEffect(() => {
    if (currentView === 'welcome2') {
      const timer = setTimeout(() => {
        setIsExiting(true);
        setTimeout(() => {
          setCurrentView('profile');
        }, 1500);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [currentView]);

  const handleOnboardingComplete = async () => {
    if (user) {
      try {
        const { updateUserProfile } = await import('../services/userService');
        await updateUserProfile(user.uid, { hasSeenOnboarding: true });
        await refreshUserProfile();
      } catch (error) {
        console.error('Error saving onboarding state:', error);
      }
    } else {
      setOnboardingCompletedBeforeLogin(true);
    }
    setCurrentView('auth');
    onOnboardingComplete?.();
  };

  const handleAuthSuccess = () => {
    onAuthSuccess?.();
  };

  const handleProfileSubmit = async (data) => {
    console.log('Profile submitted:', data);
    await refreshUserProfile();
  };

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

  if (user && profileLoading && initialView === 'auth') {
    return (
      <div 
        className="h-screen w-screen overflow-hidden flex items-center justify-center"
        style={backgroundStyle}
      >
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent mb-4"></div>
          <p className="text-slate-300">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="h-screen w-screen overflow-hidden relative"
      style={backgroundStyle}
    >
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_30%_30%,rgba(0,230,200,0.08),transparent_30%),radial-gradient(circle_at_80%_20%,rgba(105,56,239,0.08),transparent_30%)]" />
      <div className="absolute inset-0 bg-gradient-to-b from-white/5 via-transparent to-white/5 mix-blend-overlay" />

      {(currentView === 'onboarding' || currentView === 'auth') && (
        <div className="h-full w-full flex items-center justify-center p-4">
          <div className="w-full max-w-[640px] h-[460px] glass-panel shadow-[0_20px_80px_-40px_rgba(0,230,200,0.55)] flex flex-col overflow-hidden relative">
            <div className="absolute inset-0 opacity-50 bg-[radial-gradient(circle_at_20%_20%,rgba(0,230,200,0.12),transparent_40%),radial-gradient(circle_at_80%_0%,rgba(105,56,239,0.15),transparent_40%)]" />
            <div className="flex-1 overflow-hidden px-8 py-6 relative z-10">
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
            className="text-6xl text-center font-semibold tracking-tight" 
            style={{ 
              letterSpacing: '0.02em'
            }}
          >
            <span className="gradient-text">Welcome to</span>{' '}
            <span className="text-white">CereBro</span>{' '}
            <span className="text-primary-300">AI</span>
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
            className="text-6xl font-bold text-center" 
            style={{ 
              letterSpacing: '0.01em'
            }}
          >
            <span className="gradient-text">Please complete your profile</span>
          </h2>
        </div>
      )}

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
                <h1 className="text-4xl font-bold mb-2 gradient-text">
                  Complete Your Profile
                </h1>
                <p className="text-lg text-slate-300">
                  Help us get to know you better
                </p>
              </div>
              <div className="glass-panel shadow-[0_20px_80px_-45px_rgba(0,230,200,0.45)] p-8">
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
