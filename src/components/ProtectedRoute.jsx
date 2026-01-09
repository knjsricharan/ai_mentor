import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader } from 'lucide-react';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-dark-900 via-[#0b1729] to-[#0a0f1a] flex items-center justify-center">
        <div className="text-center text-slate-200">
          <img 
            src="/logo.jpeg" 
            alt="CereBro AI" 
            className="w-12 h-12 object-contain mx-auto mb-4"
          />
          <Loader className="w-12 h-12 text-primary-500 animate-spin mx-auto mb-4" />
          <p className="text-slate-300">Loading...</p>
        </div>
      </div>
    );
  }

  return user ? children : <Navigate to="/sign-in" replace />;
};

export default ProtectedRoute;

