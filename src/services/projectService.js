import { 
  collection, 
  addDoc, 
  getDocs, 
  getDoc,
  doc,
  updateDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp
} from 'firebase/firestore';
import { db, auth } from '../config/firebase';

/**
 * Create a new project
 * 
 * @param {string} userId - The user's UID
 * @param {Object} projectData - Project data object
 * @param {string} projectData.name - Project name
 * @param {string} [projectData.domain] - Project domain (optional)
 * @param {string} [projectData.description] - Project description (optional)
 * @param {number} [projectData.teamSize] - Team size (optional)
 * @param {string} [projectData.targetDate] - Target date (optional)
 * @param {Array} [projectData.techStack] - Tech stack array (optional)
 * @param {string} [projectData.status] - Project status (default: 'active')
 * @returns {Promise<Object>} Created project object with id
 * @throws {Error} If creation fails
 * 
 * @example
 * const project = await createProject(user.uid, {
 *   name: "My New Project",
 *   domain: "E-commerce",
 *   status: "active"
 * });
 */
export const createProject = async (userId, projectData) => {
  try {
    const projectsRef = collection(db, 'projects');
    const newProject = {
      userId,
      name: projectData.name?.trim() || '',
      domain: projectData.domain?.trim() || null,
      description: projectData.description?.trim() || null,
      teamSize: projectData.teamSize || null,
      targetDate: projectData.targetDate || null,
      techStack: projectData.techStack || [],
      status: projectData.status || 'active',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    
    const docRef = await addDoc(projectsRef, newProject);
    
    return {
      id: docRef.id,
      ...newProject
    };
  } catch (error) {
    console.error('Error creating project:', error);
    throw error;
  }
};

/**
 * Get all projects for a specific user
 * 
 * @param {string} userId - The user's UID
 * @returns {Promise<Array>} Array of project objects with id
 * @throws {Error} If fetch fails
 * 
 * @example
 * const projects = await getMyProjects(user.uid);
 * projects.forEach(project => {
 *   console.log(project.name, project.id);
 * });
 */
export const getMyProjects = async (userId) => {
  try {
    const projectsRef = collection(db, 'projects');
    const q = query(
      projectsRef, 
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    
    const projects = [];
    querySnapshot.forEach((doc) => {
      projects.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return projects;
  } catch (error) {
    console.error('Error fetching projects:', error);
    throw error;
  }
};

/**
 * Subscribe to real-time updates of user projects
 * @param {string} userId - The user's UID
 * @param {function} callback - Function to call when projects change
 * @returns {function} Unsubscribe function
 */
export const subscribeToUserProjects = (userId, callback) => {
  if (!userId) {
    console.error('subscribeToUserProjects: userId is required');
    callback([]);
    return () => {}; // Return empty unsubscribe function
  }

  const projectsRef = collection(db, 'projects');
  let unsubscribe = null;

  // Helper function to process and sort projects
  const processProjects = (querySnapshot) => {
    const projects = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      projects.push({
        id: doc.id,
        ...data
      });
    });
    
    // Sort by createdAt if available (client-side)
    projects.sort((a, b) => {
      if (!a.createdAt || !b.createdAt) return 0;
      const aTime = a.createdAt.toMillis ? a.createdAt.toMillis() : (a.createdAt.seconds * 1000);
      const bTime = b.createdAt.toMillis ? b.createdAt.toMillis() : (b.createdAt.seconds * 1000);
      return bTime - aTime; // Descending order
    });
    
    console.log(`Loaded ${projects.length} projects for user ${userId}`);
    callback(projects);
  };

  // Try query with orderBy first
  try {
    const q = query(
      projectsRef, 
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    
    unsubscribe = onSnapshot(q, processProjects, (error) => {
      console.error('Error in projects subscription with orderBy:', error);
      
      // If error is about missing index, try query without orderBy
      if (error.code === 'failed-precondition' || error.message?.includes('index')) {
        console.log('Index missing, trying query without orderBy...');
        const fallbackQuery = query(
          projectsRef,
          where('userId', '==', userId)
        );
        
        // Set up fallback subscription
        unsubscribe = onSnapshot(fallbackQuery, processProjects, (fallbackError) => {
          console.error('Fallback query also failed:', fallbackError);
          callback([]);
        });
      } else {
        callback([]);
      }
    });
  } catch (error) {
    console.error('Error setting up projects subscription:', error);
    // Try fallback query without orderBy
    try {
      const fallbackQuery = query(
        projectsRef,
        where('userId', '==', userId)
      );
      unsubscribe = onSnapshot(fallbackQuery, processProjects, (fallbackError) => {
        console.error('Fallback query failed:', fallbackError);
        callback([]);
      });
    } catch (fallbackError) {
      console.error('Error setting up fallback query:', fallbackError);
      callback([]);
      return () => {};
    }
  }

  return () => {
    if (unsubscribe) {
      unsubscribe();
    }
  };
};

/**
 * Get a single project by ID
 * @param {string} projectId - The project document ID
 * @returns {Promise<Object|null>} Project object with id, or null if not found
 * @throws {Error} If fetch fails
 */
export const getProject = async (projectId) => {
  try {
    if (!projectId) {
      return null;
    }

    const projectRef = doc(db, 'projects', projectId);
    const projectSnap = await getDoc(projectRef);
    
    if (!projectSnap.exists()) {
      return null;
    }
    
    return {
      id: projectSnap.id,
      ...projectSnap.data()
    };
  } catch (error) {
    console.error('Error fetching project:', error);
    throw error;
  }
};

/**
 * Update an existing project
 * @param {string} projectId - The project document ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<void>}
 */
export const updateProject = async (projectId, updates) => {
  try {
    const projectRef = doc(db, 'projects', projectId);
    await updateDoc(projectRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error updating project:', error);
    throw error;
  }
};
