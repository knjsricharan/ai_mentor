import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const Login = ({ onAuthSuccess }) => {
  const { loginWithGoogle } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      await loginWithGoogle();
      // Wait a moment for profile to load
      // The AuthOnboardingContainer will handle routing based on profile completion
      // If profile is complete, it will redirect to dashboard
      // If incomplete, it will show the profile form
    } catch (error) {
      console.error('Login error:', error);
    } finally {
      setLoading(false);
      // Trigger auth success callback - AuthOnboardingContainer will check profile
      if (onAuthSuccess) {
        onAuthSuccess();
      }
    }
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-6 animate-fade-in">
      {/* Logo */}
      <img 
        src="/logo.jpeg" 
        alt="App Logo" 
        className="w-[50%] mb-8"
      />

      {/* Google Sign In Button */}
      <button
        onClick={handleGoogleLogin}
        disabled={loading}
        className="w-full bg-white border font-semibold py-3.5 px-6 rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
        style={{
          borderColor: '#d1d5db',
          borderWidth: '1px',
          color: '#111827',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
        }}
        onMouseEnter={(e) => {
          if (!loading) {
            e.target.style.borderColor = '#6366f1';
            e.target.style.color = '#6366f1';
            e.target.style.backgroundColor = '#ffffff';
            e.target.style.boxShadow = '0 4px 16px rgba(99, 102, 241, 0.3), 0 0 0 1px rgba(99, 102, 241, 0.15)';
            e.target.style.transform = 'translateY(-2px)';
          }
        }}
        onMouseLeave={(e) => {
          if (!loading) {
            e.target.style.borderColor = '#d1d5db';
            e.target.style.color = '#111827';
            e.target.style.backgroundColor = '#ffffff';
            e.target.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
            e.target.style.transform = 'translateY(0)';
          }
        }}
        onMouseDown={(e) => {
          if (!loading) {
            e.target.style.transform = 'translateY(0)';
          }
        }}
        onMouseUp={(e) => {
          if (!loading) {
            e.target.style.transform = 'translateY(-2px)';
          }
        }}
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path
            fill="currentColor"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="currentColor"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="currentColor"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          />
          <path
            fill="currentColor"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </svg>
        Continue with Google
      </button>
    </div>
  );
};

export default Login;

