import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

/**
 * Get user profile data from Firestore
 * 
 * Retrieves the user document from Firestore and returns the profile fields.
 * The user document is located at `users/{uid}`.
 * 
 * @param {string} uid - The user's Firebase UID
 * @returns {Promise<Object|null>} User profile object with all profile fields, or null if document doesn't exist
 * @throws {Error} If Firestore operation fails
 * 
 * @example
 * const profile = await getUserProfile(user.uid);
 * if (profile) {
 *   console.log(profile.firstName, profile.surname);
 *   console.log('Has seen onboarding:', profile.hasSeenOnboarding);
 * }
 */
export const getUserProfile = async (uid) => {
  try {
    const userDocRef = doc(db, 'users', uid);
    const userDocSnap = await getDoc(userDocRef);
    
    if (!userDocSnap.exists()) {
      return null;
    }
    
    const userData = userDocSnap.data();
    
    // Return profile fields (may be undefined if not set yet)
    return {
      // Basic profile fields
      firstName: userData.firstName || null,
      surname: userData.surname || null,
      age: userData.age || null,
      phoneNumber: userData.phoneNumber || null,
      
      // Professional fields
      preferredLanguages: userData.preferredLanguages || null,
      skills: userData.skills || null,
      projectsDone: userData.projectsDone || null,
      linkedinProfile: userData.linkedinProfile || null,
      githubProfile: userData.githubProfile || null,
      
      // Onboarding state
      hasSeenOnboarding: userData.hasSeenOnboarding || false,
      
      // Auth fields (from initial user creation)
      name: userData.name || null,
      email: userData.email || null,
      photoURL: userData.photoURL || null,
      role: userData.role || null,
      createdAt: userData.createdAt || null,
    };
  } catch (error) {
    console.error('Error fetching user profile:', error);
    throw error;
  }
};

/**
 * Update user profile data in Firestore
 * 
 * Updates the existing user document with new profile data.
 * Uses merge: true to preserve existing fields that aren't being updated.
 * Only updates the fields provided in profileData.
 * 
 * @param {string} uid - The user's Firebase UID
 * @param {Object} profileData - Object containing profile fields to update
 * @param {string} [profileData.firstName] - User's first name
 * @param {string} [profileData.surname] - User's surname
 * @param {number} [profileData.age] - User's age
 * @param {string} [profileData.phoneNumber] - User's phone number
 * @param {string} [profileData.preferredLanguages] - Preferred programming languages
 * @param {string} [profileData.skills] - User's skills
 * @param {string} [profileData.projectsDone] - Projects the user has completed
 * @param {string} [profileData.linkedinProfile] - LinkedIn profile URL
 * @param {string} [profileData.githubProfile] - GitHub profile URL
 * @param {boolean} [profileData.hasSeenOnboarding] - Whether user has completed onboarding
 * @returns {Promise<void>}
 * @throws {Error} If Firestore operation fails or user document doesn't exist
 * 
 * @example
 * // Update specific fields
 * await updateUserProfile(user.uid, {
 *   firstName: 'John',
 *   surname: 'Doe',
 *   age: 25,
 *   skills: 'React, Node.js, TypeScript'
 * });
 * 
 * @example
 * // Update onboarding state
 * await updateUserProfile(user.uid, {
 *   hasSeenOnboarding: true
 * });
 * 
 * @example
 * // Update full profile
 * await updateUserProfile(user.uid, {
 *   firstName: 'Jane',
 *   surname: 'Smith',
 *   age: 28,
 *   phoneNumber: '+1234567890',
 *   preferredLanguages: 'JavaScript, Python',
 *   skills: 'Full-stack development, UI/UX design',
 *   projectsDone: 'E-commerce platform, Task management app',
 *   linkedinProfile: 'https://linkedin.com/in/janesmith',
 *   githubProfile: 'https://github.com/janesmith',
 *   hasSeenOnboarding: true
 * });
 */
export const updateUserProfile = async (uid, profileData) => {
  try {
    // First, check if user document exists
    const userDocRef = doc(db, 'users', uid);
    const userDocSnap = await getDoc(userDocRef);
    
    if (!userDocSnap.exists()) {
      throw new Error(`User document does not exist for uid: ${uid}. User must be authenticated first.`);
    }
    
    // Prepare update object with only the fields provided
    const updateData = {};
    
    // Add profile fields if they are provided
    if (profileData.firstName !== undefined) {
      updateData.firstName = profileData.firstName?.trim() || null;
    }
    if (profileData.surname !== undefined) {
      updateData.surname = profileData.surname?.trim() || null;
    }
    if (profileData.age !== undefined) {
      updateData.age = profileData.age || null;
    }
    if (profileData.phoneNumber !== undefined) {
      updateData.phoneNumber = profileData.phoneNumber?.trim() || null;
    }
    if (profileData.preferredLanguages !== undefined) {
      updateData.preferredLanguages = profileData.preferredLanguages?.trim() || null;
    }
    if (profileData.skills !== undefined) {
      updateData.skills = profileData.skills?.trim() || null;
    }
    if (profileData.projectsDone !== undefined) {
      updateData.projectsDone = profileData.projectsDone?.trim() || null;
    }
    if (profileData.linkedinProfile !== undefined) {
      updateData.linkedinProfile = profileData.linkedinProfile?.trim() || null;
    }
    if (profileData.githubProfile !== undefined) {
      updateData.githubProfile = profileData.githubProfile?.trim() || null;
    }
    if (profileData.hasSeenOnboarding !== undefined) {
      updateData.hasSeenOnboarding = Boolean(profileData.hasSeenOnboarding);
    }
    
    // Update document with merge: true to preserve existing fields
    await setDoc(userDocRef, updateData, { merge: true });
    
    console.log('User profile updated successfully');
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
};

