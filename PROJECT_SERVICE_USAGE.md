# Project Service Usage Guide

## Overview

The `projectService.js` file provides two functions for managing projects in Firestore:
1. `createProject(title)` - Creates a new project
2. `getMyProjects(userId)` - Retrieves all projects for a user

## Data Model

**Collection:** `projects`

**Fields:**
- `title` (string) - Project title
- `userId` (string) - Owner's Firebase UID
- `status` (string) - Always set to `"active"`
- `createdAt` (Timestamp) - Server timestamp (automatically set)

---

## Function: `createProject(title)`

### Description
Creates a new project in Firestore. Automatically uses the currently authenticated user's UID.

### Parameters
- `title` (string, required) - The project title

### Returns
- `Promise<Object>` - Created project object with:
  - `id` - Firestore document ID
  - `title` - Project title
  - `userId` - User's UID
  - `status` - "active"
  - `createdAt` - Server timestamp

### Throws
- `Error` - If user is not authenticated
- `Error` - If Firestore operation fails

### Usage Examples

#### Basic Usage
```javascript
import { createProject } from './services/projectService';
import { useAuth } from './context/AuthContext';

function MyComponent() {
  const { user } = useAuth();

  const handleCreateProject = async () => {
    try {
      // User must be authenticated first
      if (!user) {
        console.error('Please sign in first');
        return;
      }

      const project = await createProject("My Awesome Project");
      console.log('Project created:', project.id);
      console.log('Title:', project.title);
    } catch (error) {
      console.error('Failed to create project:', error);
    }
  };

  return <button onClick={handleCreateProject}>Create Project</button>;
}
```

#### With Form Input
```javascript
import { useState } from 'react';
import { createProject } from './services/projectService';

function CreateProjectForm() {
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const project = await createProject(title);
      console.log('Created project:', project);
      setTitle(''); // Clear form
      // Redirect or update UI
    } catch (error) {
      console.error('Error:', error.message);
      alert('Failed to create project. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Project title"
        required
      />
      <button type="submit" disabled={loading}>
        {loading ? 'Creating...' : 'Create Project'}
      </button>
    </form>
  );
}
```

### Important Notes
- **Authentication Required**: User must be signed in before calling this function
- **Automatic User ID**: The function automatically gets `userId` from `auth.currentUser`
- **Server Timestamp**: `createdAt` is set using `serverTimestamp()` for accurate timing
- **Title Trimming**: The title is automatically trimmed of whitespace

---

## Function: `getMyProjects(userId)`

### Description
Retrieves all projects for a specific user, ordered by creation date (newest first).

### Parameters
- `userId` (string, required) - The user's Firebase UID

### Returns
- `Promise<Array>` - Array of project objects, each containing:
  - `id` - Firestore document ID
  - `title` - Project title
  - `userId` - User's UID
  - `status` - Project status
  - `createdAt` - Timestamp object

### Throws
- `Error` - If Firestore query fails

### Usage Examples

#### Basic Usage
```javascript
import { getMyProjects } from './services/projectService';
import { useAuth } from './context/AuthContext';
import { useEffect, useState } from 'react';

function ProjectsList() {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProjects = async () => {
      if (!user) return;

      try {
        const userProjects = await getMyProjects(user.uid);
        setProjects(userProjects);
      } catch (error) {
        console.error('Failed to fetch projects:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, [user]);

  if (loading) return <div>Loading projects...</div>;

  return (
    <div>
      <h2>My Projects ({projects.length})</h2>
      {projects.map(project => (
        <div key={project.id}>
          <h3>{project.title}</h3>
          <p>Status: {project.status}</p>
          <p>Created: {project.createdAt?.toDate?.().toLocaleDateString()}</p>
        </div>
      ))}
    </div>
  );
}
```

#### With Error Handling
```javascript
import { getMyProjects } from './services/projectService';

async function loadUserProjects(userId) {
  try {
    const projects = await getMyProjects(userId);
    
    if (projects.length === 0) {
      console.log('No projects found');
      return [];
    }

    return projects;
  } catch (error) {
    if (error.code === 'permission-denied') {
      console.error('Permission denied. Check Firestore security rules.');
    } else if (error.code === 'failed-precondition') {
      console.error('Missing index. Create the required Firestore index.');
    } else {
      console.error('Unexpected error:', error);
    }
    throw error;
  }
}
```

### Important Notes
- **Ordered Results**: Projects are returned in descending order by `createdAt` (newest first)
- **Empty Array**: Returns empty array `[]` if user has no projects
- **Timestamp Handling**: `createdAt` is a Firestore Timestamp object. Use `.toDate()` to convert to JavaScript Date
- **Index Required**: This query requires a Firestore composite index on `userId` and `createdAt`. Firebase will prompt you to create it automatically if missing.

---

## Complete Example: Full Integration

```javascript
import { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import { createProject, getMyProjects } from './services/projectService';

function ProjectsPage() {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [newTitle, setNewTitle] = useState('');
  const [loading, setLoading] = useState(false);

  // Load projects on mount
  useEffect(() => {
    if (!user) return;

    const loadProjects = async () => {
      try {
        const userProjects = await getMyProjects(user.uid);
        setProjects(userProjects);
      } catch (error) {
        console.error('Error loading projects:', error);
      }
    };

    loadProjects();
  }, [user]);

  // Create new project
  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    setLoading(true);
    try {
      const newProject = await createProject(newTitle);
      setProjects([newProject, ...projects]); // Add to top of list
      setNewTitle('');
    } catch (error) {
      console.error('Error creating project:', error);
      alert('Failed to create project');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return <div>Please sign in to view projects</div>;
  }

  return (
    <div>
      <h1>My Projects</h1>
      
      {/* Create Form */}
      <form onSubmit={handleCreate}>
        <input
          type="text"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="Project title"
          disabled={loading}
        />
        <button type="submit" disabled={loading || !newTitle.trim()}>
          {loading ? 'Creating...' : 'Create Project'}
        </button>
      </form>

      {/* Projects List */}
      <div>
        {projects.length === 0 ? (
          <p>No projects yet. Create your first project!</p>
        ) : (
          projects.map(project => (
            <div key={project.id} style={{ border: '1px solid #ccc', padding: '10px', margin: '10px' }}>
              <h3>{project.title}</h3>
              <p>Status: {project.status}</p>
              {project.createdAt && (
                <p>Created: {project.createdAt.toDate().toLocaleString()}</p>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default ProjectsPage;
```

---

## Common Patterns

### Pattern 1: Create and Refresh
```javascript
const handleCreate = async (title) => {
  await createProject(title);
  // Refresh the list
  const updated = await getMyProjects(user.uid);
  setProjects(updated);
};
```

### Pattern 2: Optimistic Update
```javascript
const handleCreate = async (title) => {
  // Add to UI immediately (optimistic)
  const tempProject = {
    id: 'temp',
    title,
    userId: user.uid,
    status: 'active',
    createdAt: new Date()
  };
  setProjects([tempProject, ...projects]);

  try {
    // Create in Firestore
    const realProject = await createProject(title);
    // Replace temp with real
    setProjects(projects.map(p => 
      p.id === 'temp' ? realProject : p
    ));
  } catch (error) {
    // Remove temp on error
    setProjects(projects.filter(p => p.id !== 'temp'));
    throw error;
  }
};
```

---

## Error Handling

### Common Errors

1. **"User must be authenticated"**
   - **Cause**: `auth.currentUser` is null
   - **Solution**: Ensure user is signed in before calling `createProject()`

2. **"Missing or insufficient permissions"**
   - **Cause**: Firestore security rules blocking access
   - **Solution**: Check that Firestore rules allow authenticated users to create/read projects

3. **"The query requires an index"**
   - **Cause**: Composite index missing for `userId` + `createdAt`
   - **Solution**: Click the link in the error to create the index automatically

4. **"Failed to get document because the client is offline"**
   - **Cause**: No internet connection
   - **Solution**: Check network connection or implement offline handling

---

## Best Practices

1. ✅ **Always check authentication** before calling `createProject()`
2. ✅ **Handle errors gracefully** with try-catch blocks
3. ✅ **Show loading states** during async operations
4. ✅ **Validate input** (e.g., non-empty title)
5. ✅ **Update UI optimistically** for better UX
6. ✅ **Use useEffect** to load projects when component mounts
7. ✅ **Clean up subscriptions** if using real-time listeners (not in these functions)

---

## Firestore Security Rules

Make sure your Firestore rules allow these operations:

```javascript
match /projects/{projectId} {
  allow read: if request.auth != null && request.auth.uid == resource.data.userId;
  allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
}
```

