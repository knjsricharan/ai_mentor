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
    <div className="w-full h-full flex flex-col items-center justify-center p-6 animate-fade-in text-slate-100 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div className="absolute w-96 h-96 bg-primary-500/20 rounded-full blur-3xl top-10 left-10 animate-pulse-slow" />
        <div className="absolute w-96 h-96 bg-accent-500/20 rounded-full blur-3xl bottom-10 right-10 animate-pulse-slow" style={{ animationDelay: '1s' }} />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-md w-full">
        {/* Logo and Title */}
        <div className="text-center mb-12">
          <div className="w-32 h-32 mx-auto mb-6 bg-gradient-to-br from-primary-500/10 to-accent-500/10 rounded-3xl flex items-center justify-center border border-white/10 glow-ring">
            <img 
              src="/logo.jpeg" 
              alt="App Logo" 
              className="w-20 h-20 object-contain drop-shadow-lg"
            />
          </div>
          <h1 className="text-4xl font-bold mb-3">
            <span className="gradient-text">CereBro</span>{' '}
            <span className="text-white">AI</span>
          </h1>
          <p className="text-slate-400 text-lg">Execute Smarter, Build Faster</p>
        </div>

        {/* Google Sign In Button */}
        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full font-semibold py-4 px-6 rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 bg-white text-gray-900 border border-white/20 shadow-lg hover:shadow-xl hover:-translate-y-1 group relative overflow-hidden"
        >
          {/* Shimmer effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
          
          <svg className="w-5 h-5 relative z-10" viewBox="0 0 24 24">
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
          <span className="relative z-10">
            {loading ? 'Signing in...' : 'Continue with Google'}
          </span>
        </button>

        {/* Features */}
        <div className="mt-12 space-y-3">
          {[
            { icon: '✨', text: 'AI-powered project guidance' },
            { icon: '🚀', text: 'Smart roadmap generation' },
            { icon: '📊', text: 'Real-time progress tracking' },
          ].map((feature, i) => (
            <div 
              key={i} 
              className="flex items-center gap-3 text-slate-300 animate-fade-in"
              style={{ animationDelay: `${(i + 1) * 0.2}s` }}
            >
              <div className="w-8 h-8 bg-white/5 rounded-lg flex items-center justify-center border border-white/10">
                {feature.icon}
              </div>
              <span>{feature.text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Login;

