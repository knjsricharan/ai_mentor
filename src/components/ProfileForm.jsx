import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { updateUserProfile } from '../services/userService';

const ProfileForm = ({ onSubmit }) => {
  const { user, refreshUserProfile } = useAuth();
  const [formData, setFormData] = useState({
    firstName: '',
    surname: '',
    age: '',
    phoneNumber: '',
    preferredLanguages: '',
    skills: '',
    projectsDone: '',
    linkedinProfile: '',
    githubProfile: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    // Clear error when user starts typing
    if (error) setError(null);
  };

  const isFormValid = () => {
    return (
      formData.firstName &&
      formData.surname &&
      Number(formData.age) > 10 &&
      formData.phoneNumber.length >= 10 &&
      formData.preferredLanguages &&
      formData.skills &&
      formData.projectsDone
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!user || !user.uid) {
      setError('You must be logged in to save your profile');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Save profile data to Firestore
      await updateUserProfile(user.uid, {
        firstName: formData.firstName,
        surname: formData.surname,
        age: formData.age ? parseInt(formData.age) : null,
        phoneNumber: formData.phoneNumber,
        preferredLanguages: formData.preferredLanguages,
        skills: formData.skills,
        projectsDone: formData.projectsDone,
        linkedinProfile: formData.linkedinProfile,
        githubProfile: formData.githubProfile,
        hasSeenOnboarding: true
      });

      // Refresh user profile in context
      await refreshUserProfile();

      // Call onSubmit callback for navigation (if provided)
      if (onSubmit) {
        onSubmit(formData);
      }
    } catch (err) {
      console.error('Error saving profile:', err);
      setError('Failed to save profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="mb-4 p-4 bg-red-50 border-2 border-red-200 rounded-xl text-red-700">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium mb-2" style={{ color: '#374151' }}>First Name</label>
        <input 
          name="firstName" 
          value={formData.firstName}
          onChange={handleChange} 
          className="input-field" 
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2" style={{ color: '#374151' }}>Surname</label>
        <input 
          name="surname" 
          value={formData.surname}
          onChange={handleChange} 
          className="input-field" 
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2" style={{ color: '#374151' }}>Age</label>
        <input 
          type="number" 
          name="age" 
          value={formData.age}
          onChange={handleChange} 
          className="input-field" 
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2" style={{ color: '#374151' }}>Phone Number</label>
        <input 
          type="tel" 
          name="phoneNumber" 
          value={formData.phoneNumber}
          onChange={handleChange} 
          className="input-field" 
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2" style={{ color: '#374151' }}>
          Preferred Programming Languages
        </label>
        <input
          name="preferredLanguages"
          value={formData.preferredLanguages}
          onChange={handleChange}
          className="input-field"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2" style={{ color: '#374151' }}>Skills</label>
        <textarea
          name="skills"
          value={formData.skills}
          onChange={handleChange}
          className="input-field"
          rows={4}
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2" style={{ color: '#374151' }}>Projects Done</label>
        <textarea
          name="projectsDone"
          value={formData.projectsDone}
          onChange={handleChange}
          className="input-field"
          rows={4}
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2" style={{ color: '#374151' }}>
          LinkedIn Profile
        </label>
        <input 
          name="linkedinProfile" 
          value={formData.linkedinProfile}
          onChange={handleChange} 
          className="input-field" 
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2" style={{ color: '#374151' }}>
          GitHub Profile
        </label>
        <input 
          name="githubProfile" 
          value={formData.githubProfile}
          onChange={handleChange} 
          className="input-field" 
        />
      </div>

      <button
        type="submit"
        disabled={!isFormValid() || loading}
        className="w-full btn-primary disabled:opacity-50"
      >
        {loading ? 'Saving...' : 'Submit Profile'}
      </button>

    </form>
  );
};

export default ProfileForm;
