# User Service Usage Guide

## Overview

The `userService.js` file provides functions to manage user profile data in Firestore. It works with the existing `users/{uid}` document that is created during authentication.

## Functions

### 1. `getUserProfile(uid)`

**Purpose**: Retrieves user profile data from Firestore.

**How it works**:
- Fetches the user document from `users/{uid}` collection
- Returns all profile fields (returns `null` for fields that haven't been set)
- Returns `null` if the user document doesn't exist
- Preserves existing auth fields (name, email, photoURL, role, createdAt)

**Returns**: Object with profile fields or `null` if document doesn't exist

**Example Usage**:
```javascript
import { getUserProfile } from './services/userService';
import { useAuth } from './context/AuthContext';

function ProfileComponent() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    const loadProfile = async () => {
      if (user) {
        const userProfile = await getUserProfile(user.uid);
        setProfile(userProfile);
      }
    };
    loadProfile();
  }, [user]);

  if (!profile) return <div>Loading...</div>;

  return (
    <div>
      <h1>{profile.firstName} {profile.surname}</h1>
      <p>Age: {profile.age}</p>
      <p>Skills: {profile.skills}</p>
      <p>Has seen onboarding: {profile.hasSeenOnboarding ? 'Yes' : 'No'}</p>
    </div>
  );
}
```

---

### 2. `updateUserProfile(uid, profileData)`

**Purpose**: Updates user profile data in Firestore.

**How it works**:
- Updates the existing `users/{uid}` document
- Uses `merge: true` to preserve existing fields
- Only updates fields that are provided in `profileData`
- Validates that user document exists before updating
- Trims string values and converts empty strings to `null`
- Converts `hasSeenOnboarding` to boolean

**Parameters**:
- `uid` (string, required) - User's Firebase UID
- `profileData` (object, required) - Object with fields to update

**Returns**: `Promise<void>`

**Throws**: Error if user document doesn't exist or Firestore operation fails

**Example Usage**:

#### Update Single Field
```javascript
import { updateUserProfile } from './services/userService';

// Update just the onboarding state
await updateUserProfile(user.uid, {
  hasSeenOnboarding: true
});
```

#### Update Multiple Fields
```javascript
// Update profile information
await updateUserProfile(user.uid, {
  firstName: 'John',
  surname: 'Doe',
  age: 25,
  phoneNumber: '+1234567890',
  skills: 'React, Node.js, TypeScript'
});
```

#### Full Profile Update
```javascript
const handleProfileSubmit = async (formData) => {
  try {
    await updateUserProfile(user.uid, {
      firstName: formData.firstName,
      surname: formData.surname,
      age: parseInt(formData.age),
      phoneNumber: formData.phoneNumber,
      preferredLanguages: formData.preferredLanguages,
      skills: formData.skills,
      projectsDone: formData.projectsDone,
      linkedinProfile: formData.linkedinProfile,
      githubProfile: formData.githubProfile,
      hasSeenOnboarding: true
    });
    console.log('Profile updated successfully!');
  } catch (error) {
    console.error('Failed to update profile:', error);
  }
};
```

---

## Profile Fields

All profile fields are optional and can be `null` if not set:

| Field | Type | Description |
|-------|------|-------------|
| `firstName` | string \| null | User's first name |
| `surname` | string \| null | User's surname |
| `age` | number \| null | User's age |
| `phoneNumber` | string \| null | User's phone number |
| `preferredLanguages` | string \| null | Preferred programming languages |
| `skills` | string \| null | User's skills description |
| `projectsDone` | string \| null | Projects the user has completed |
| `linkedinProfile` | string \| null | LinkedIn profile URL |
| `githubProfile` | string \| null | GitHub profile URL |
| `hasSeenOnboarding` | boolean | Whether user has completed onboarding (default: `false`) |

---

## Important Notes

### 1. **Merge Behavior**
- `updateUserProfile` uses `merge: true`, which means:
  - Existing fields that aren't in `profileData` are preserved
  - Only provided fields are updated
  - Auth fields (name, email, photoURL, role, createdAt) are never overwritten

### 2. **Null Handling**
- Empty strings are converted to `null` for consistency
- Fields not provided in `profileData` are not updated
- Use `undefined` to skip a field, or `null` to clear it

### 3. **User Document Must Exist**
- The user document is created during Google Sign-In (in `authService.js`)
- `updateUserProfile` will throw an error if the document doesn't exist
- Always ensure user is authenticated before calling these functions

### 4. **Data Validation**
- String values are automatically trimmed
- `hasSeenOnboarding` is converted to boolean
- No validation for age, phone number format, or URL format (add client-side validation if needed)

---

## Complete Integration Example

```javascript
import { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import { getUserProfile, updateUserProfile } from './services/userService';

function ProfilePage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Load profile on mount
  useEffect(() => {
    const loadProfile = async () => {
      if (!user) return;

      try {
        const userProfile = await getUserProfile(user.uid);
        setProfile(userProfile);
      } catch (error) {
        console.error('Failed to load profile:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [user]);

  // Save profile
  const handleSave = async (formData) => {
    if (!user) return;

    setSaving(true);
    try {
      await updateUserProfile(user.uid, formData);
      
      // Reload profile to get updated data
      const updatedProfile = await getUserProfile(user.uid);
      setProfile(updatedProfile);
      
      alert('Profile saved successfully!');
    } catch (error) {
      console.error('Failed to save profile:', error);
      alert('Failed to save profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div>Loading profile...</div>;
  if (!profile) return <div>Profile not found</div>;

  return (
    <div>
      <h1>Profile</h1>
      <p>Name: {profile.firstName} {profile.surname}</p>
      <p>Email: {profile.email}</p>
      {/* Render form with profile data */}
    </div>
  );
}
```

---

## Error Handling

### Common Errors

1. **"User document does not exist"**
   - **Cause**: User hasn't signed in yet or document wasn't created
   - **Solution**: Ensure user is authenticated and has signed in at least once

2. **"Missing or insufficient permissions"**
   - **Cause**: Firestore security rules blocking access
   - **Solution**: Check that Firestore rules allow users to read/write their own document

3. **"Failed to get document because the client is offline"**
   - **Cause**: No internet connection
   - **Solution**: Check network connection or implement offline handling

---

## Best Practices

1. ✅ **Always check authentication** before calling these functions
2. ✅ **Handle null values** - Profile fields may be `null` if not set
3. ✅ **Use try-catch** for error handling
4. ✅ **Show loading states** while fetching/updating
5. ✅ **Reload profile after update** to get the latest data
6. ✅ **Validate data** on the client side before updating
7. ✅ **Use merge behavior** - Only update fields you want to change

---

## Firestore Document Structure

The user document in Firestore will look like this:

```javascript
{
  // Auth fields (set during sign-in)
  name: "John Doe",
  email: "john@example.com",
  photoURL: "https://...",
  role: "student",
  createdAt: Timestamp,
  
  // Profile fields (set via updateUserProfile)
  firstName: "John",
  surname: "Doe",
  age: 25,
  phoneNumber: "+1234567890",
  preferredLanguages: "JavaScript, Python",
  skills: "React, Node.js, TypeScript",
  projectsDone: "E-commerce platform, Task app",
  linkedinProfile: "https://linkedin.com/in/johndoe",
  githubProfile: "https://github.com/johndoe",
  hasSeenOnboarding: true
}
```

