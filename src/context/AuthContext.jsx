import { createContext, useContext, useState, useEffect } from 'react';
import { handleGoogleSignIn, logOut, subscribeToAuthChanges } from '../services/authService';
import { getUserProfile } from '../services/userService';

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

/**
 * Check if a user profile is complete
 * Profile is considered complete if all required fields are filled
 */
const isProfileComplete = (profile) => {
  if (!profile) return false;
  
  return !!(
    profile.firstName &&
    profile.surname &&
    profile.age &&
    profile.phoneNumber &&
    profile.preferredLanguages &&
    profile.skills &&
    profile.projectsDone
  );
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);

  // Fetch user profile when user changes
  useEffect(() => {
    const fetchUserProfile = async (currentUser) => {
      if (!currentUser) {
        setUserProfile(null);
        setProfileLoading(false);
        return;
      }

      setProfileLoading(true);
      try {
        const profile = await getUserProfile(currentUser.uid);
        setUserProfile(profile);
      } catch (error) {
        console.error('Error fetching user profile:', error);
        setUserProfile(null);
      } finally {
        setProfileLoading(false);
      }
    };

    if (user) {
      fetchUserProfile(user);
    } else {
      setUserProfile(null);
      setProfileLoading(false);
    }
  }, [user]);

  useEffect(() => {
    // Subscribe to auth state changes
    const unsubscribe = subscribeToAuthChanges((currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async () => {
    return await handleGoogleSignIn();
  };

  const logout = async () => {
    return await logOut();
  };

  // Refresh user profile (useful after profile updates)
  const refreshUserProfile = async () => {
    if (!user) return;
    
    setProfileLoading(true);
    try {
      const profile = await getUserProfile(user.uid);
      setUserProfile(profile);
    } catch (error) {
      console.error('Error refreshing user profile:', error);
    } finally {
      setProfileLoading(false);
    }
  };

  const value = {
    user,
    userProfile,
    loginWithGoogle,
    logout,
    loading,
    profileLoading,
    isProfileComplete: userProfile ? isProfileComplete(userProfile) : false,
    hasSeenOnboarding: userProfile?.hasSeenOnboarding || false,
    refreshUserProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

