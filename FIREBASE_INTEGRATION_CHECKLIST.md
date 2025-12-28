# Firebase Integration Checklist

This document lists all the features and data in your app that need to be connected to Firebase.

---

## ✅ **ALREADY CONNECTED TO FIREBASE**

### 1. **Authentication** ✅
- **Status**: Fully integrated
- **Location**: `src/services/authService.js`, `src/context/AuthContext.jsx`
- **Features**:
  - Google Sign-In working
  - User document creation in Firestore (`users/{uid}`)
  - Auth state management
  - Logout functionality

### 2. **Projects - Basic CRUD** ✅
- **Status**: Partially integrated
- **Location**: `src/services/projectService.js`, `src/pages/Dashboard.jsx`
- **Features**:
  - ✅ Create projects (`createProject()`)
  - ✅ Fetch user projects (`getMyProjects()`)
  - ✅ Real-time project updates (`subscribeToUserProjects()`)
  - ✅ Update project details (`updateProject()`)
  - ⚠️ **Issue**: `CreateProjectModal.jsx` uses old API signature - needs update

---

## 🔴 **NEEDS FIREBASE INTEGRATION**

### 1. **User Profile Data** 🔴 HIGH PRIORITY
- **Current State**: Stored in `localStorage`
- **Location**: 
  - `src/components/ProfileForm.jsx`
  - `src/components/AuthOnboardingContainer.jsx` (line 92-93)
- **What to do**:
  - Save profile data to `users/{uid}` document in Firestore
  - Fields to save:
    - `firstName`, `surname`, `age`, `phoneNumber`
    - `preferredLanguages`, `skills`, `projectsDone`
    - `linkedinProfile`, `githubProfile`
  - Load profile data from Firestore on app start
  - Update existing user document instead of creating new one

**Files to modify**:
- `src/components/ProfileForm.jsx` - Save to Firestore on submit
- `src/components/AuthOnboardingContainer.jsx` - Remove localStorage, use Firestore
- Create `src/services/userService.js` - Profile CRUD operations

---

### 2. **Onboarding State** 🔴 MEDIUM PRIORITY
- **Current State**: Stored in `localStorage` (`hasSeenOnboarding`)
- **Location**: 
  - `src/App.jsx` (lines 16, 25)
  - `src/components/AuthOnboardingContainer.jsx` (lines 20, 80)
- **What to do**:
  - Store `hasSeenOnboarding` in user document (`users/{uid}`)
  - Check Firestore instead of localStorage
  - Update user document when onboarding is completed

**Files to modify**:
- `src/App.jsx` - Check Firestore for onboarding status
- `src/components/AuthOnboardingContainer.jsx` - Update Firestore on completion

---

### 3. **Project Roadmaps** 🔴 HIGH PRIORITY
- **Current State**: Mock data with TODO comments
- **Location**: `src/components/RoadmapView.jsx` (lines 10-50)
- **What to do**:
  - Create `roadmaps` collection in Firestore
  - Structure: `roadmaps/{projectId}`
  - Fields:
    - `projectId` (reference to project)
    - `phases` (array of phase objects)
    - `updatedAt` (server timestamp)
  - Fetch roadmap from Firestore on component mount
  - Update task completion status in Firestore
  - Generate initial roadmap when project is created (or via Cloud Function)

**Files to modify**:
- `src/components/RoadmapView.jsx` - Replace mock data with Firestore queries
- Create `src/services/roadmapService.js` - Roadmap CRUD operations

**Data Structure**:
```javascript
{
  projectId: "project123",
  phases: [
    {
      id: "phase1",
      name: "Planning & Setup",
      description: "...",
      tasks: [
        { id: "task1", name: "...", completed: false }
      ]
    }
  ],
  updatedAt: serverTimestamp()
}
```

---

### 4. **Project Progress Data** 🔴 HIGH PRIORITY
- **Current State**: Mock data with TODO comments
- **Location**: `src/components/ProgressView.jsx` (lines 9-50)
- **What to do**:
  - Calculate progress from roadmap data (or store separately)
  - Store progress updates in Firestore
  - Track:
    - Overall progress percentage
    - Phase-level progress
    - Recent task updates
    - Milestones completion
  - Real-time updates when tasks are completed

**Files to modify**:
- `src/components/ProgressView.jsx` - Replace mock data with Firestore queries
- Can derive from roadmap data or create separate `progress/{projectId}` collection

**Data Structure**:
```javascript
{
  projectId: "project123",
  overall: 35,
  phases: [
    { name: "Planning", progress: 67, status: "in-progress" }
  ],
  recentUpdates: [
    { task: "...", status: "completed", timestamp: ... }
  ],
  milestones: [...]
}
```

---

### 5. **AI Chat Messages** 🔴 HIGH PRIORITY
- **Current State**: Mock responses, stored only in component state
- **Location**: `src/components/ChatView.jsx` (lines 5-68)
- **What to do**:
  - Create `chats` collection in Firestore
  - Structure: `chats/{projectId}/messages/{messageId}`
  - Store both user and AI messages
  - Load chat history from Firestore on component mount
  - Save new messages to Firestore
  - Integrate with Firebase Cloud Functions for AI responses (Gemini API)
  - Real-time message updates

**Files to modify**:
- `src/components/ChatView.jsx` - Replace mock with Firestore
- Create `src/services/chatService.js` - Chat CRUD operations
- Set up Firebase Cloud Function for AI responses

**Data Structure**:
```javascript
// Collection: chats/{projectId}/messages/{messageId}
{
  role: "user" | "assistant",
  content: "...",
  timestamp: serverTimestamp(),
  projectId: "project123"
}
```

---

### 6. **Project Details/Settings** 🟡 MEDIUM PRIORITY
- **Current State**: Partially integrated (updates work, but initial load may need work)
- **Location**: 
  - `src/components/ProjectDetailsPopup.jsx`
  - `src/components/ProjectSettingsModal.jsx`
  - `src/pages/ProjectDetail.jsx`
- **What to do**:
  - ✅ Updates already save to Firestore
  - ⚠️ Verify that project data loads correctly from Firestore
  - Ensure all project fields are properly synced

**Files to check**:
- Verify `ProjectDetail.jsx` loads project from Firestore correctly
- Ensure real-time updates work for project details

---

## 🟡 **OPTIONAL ENHANCEMENTS**

### 7. **User Preferences** 🟡 LOW PRIORITY
- Store user preferences (theme, notifications, etc.) in `users/{uid}` document
- Currently: Not implemented

### 8. **Activity Logs** 🟡 LOW PRIORITY
- Track user activity (project views, actions, etc.)
- Collection: `activity/{userId}/logs/{logId}`

### 9. **Notifications** 🟡 LOW PRIORITY
- Store notifications in Firestore
- Use Firebase Cloud Messaging for push notifications
- Collection: `notifications/{userId}/messages/{messageId}`

---

## 📋 **SUMMARY BY PRIORITY**

### **HIGH PRIORITY** (Core Features)
1. ✅ Projects CRUD - **DONE** (but needs API signature fix)
2. 🔴 User Profile Data - **TODO**
3. 🔴 Project Roadmaps - **TODO**
4. 🔴 Project Progress - **TODO**
5. 🔴 AI Chat Messages - **TODO**

### **MEDIUM PRIORITY** (User Experience)
6. 🔴 Onboarding State - **TODO**
7. 🟡 Project Details Verification - **CHECK**

### **LOW PRIORITY** (Nice to Have)
8. 🟡 User Preferences
9. 🟡 Activity Logs
10. 🟡 Notifications

---

## 🔧 **FILES THAT NEED MODIFICATION**

### **Create New Service Files**:
1. `src/services/userService.js` - User profile operations
2. `src/services/roadmapService.js` - Roadmap CRUD
3. `src/services/chatService.js` - Chat message operations
4. `src/services/progressService.js` - Progress tracking (optional, can derive from roadmap)

### **Modify Existing Files**:
1. `src/components/ProfileForm.jsx` - Save to Firestore
2. `src/components/AuthOnboardingContainer.jsx` - Remove localStorage
3. `src/App.jsx` - Check Firestore for onboarding
4. `src/components/RoadmapView.jsx` - Connect to Firestore
5. `src/components/ProgressView.jsx` - Connect to Firestore
6. `src/components/ChatView.jsx` - Connect to Firestore + Cloud Functions
7. `src/components/CreateProjectModal.jsx` - Fix API signature mismatch

---

## 🗂️ **FIRESTORE COLLECTIONS NEEDED**

### **Already Exists**:
- ✅ `users/{uid}` - User documents
- ✅ `projects/{projectId}` - Project documents

### **Need to Create**:
- 🔴 `roadmaps/{projectId}` - Roadmap data per project
- 🔴 `chats/{projectId}/messages/{messageId}` - Chat messages (subcollection)
- 🟡 `progress/{projectId}` - Progress tracking (optional, can derive from roadmap)
- 🟡 `notifications/{userId}/messages/{messageId}` - Notifications (optional)

---

## 🔐 **SECURITY RULES TO ADD**

Update `firestore.rules` to include:

```javascript
// Roadmaps
match /roadmaps/{projectId} {
  allow read, write: if request.auth != null && 
    get(/databases/$(database)/documents/projects/$(projectId)).data.userId == request.auth.uid;
}

// Chat messages
match /chats/{projectId}/messages/{messageId} {
  allow read, write: if request.auth != null && 
    get(/databases/$(database)/documents/projects/$(projectId)).data.userId == request.auth.uid;
}

// Progress (if separate collection)
match /progress/{projectId} {
  allow read, write: if request.auth != null && 
    get(/databases/$(database)/documents/projects/$(projectId)).data.userId == request.auth.uid;
}
```

---

## 📝 **NEXT STEPS**

1. **Fix CreateProjectModal API mismatch** (use new `createProject(title)` signature)
2. **Implement user profile service** (save/load from Firestore)
3. **Connect RoadmapView to Firestore**
4. **Connect ProgressView to Firestore**
5. **Connect ChatView to Firestore + Cloud Functions**
6. **Update onboarding to use Firestore**
7. **Update Firestore security rules** for new collections

---

## ⚠️ **KNOWN ISSUES**

1. **API Mismatch**: `CreateProjectModal.jsx` calls `createProject(userId, projectData)` but new service only has `createProject(title)`
2. **Missing subscribeToUserProjects**: The new `projectService.js` doesn't have this function, but `Dashboard.jsx` uses it
3. **Missing updateProject**: `ProjectDetail.jsx` uses `updateProject()` but it's not in the new service file

---

## 🎯 **QUICK WINS** (Easiest to implement first)

1. Fix `CreateProjectModal.jsx` API call
2. Add missing functions to `projectService.js` (`updateProject`, `subscribeToUserProjects`)
3. Move onboarding state to Firestore (simple boolean field)
4. Save user profile to Firestore (extend existing user document)

