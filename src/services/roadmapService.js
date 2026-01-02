import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';

/**
 * Roadmap Service for managing project roadmaps in Firestore
 * 
 * Schema: projects/{projectId}.roadmap
 */

/**
 * Get the roadmap for a project
 * @param {string} projectId - The project document ID
 * @returns {Promise<Object|null>} Roadmap object or null
 */
export const getRoadmap = async (projectId) => {
  try {
    if (!projectId) throw new Error('Project ID is required');

    const projectRef = doc(db, 'projects', projectId);
    const projectSnap = await getDoc(projectRef);
    
    if (!projectSnap.exists()) return null;

    const projectData = projectSnap.data();
    return projectData.roadmap || null;
  } catch (error) {
    console.error('Error fetching roadmap:', error);
    throw error;
  }
};

/**
 * Save or update the roadmap for a project
 * @param {string} projectId - The project document ID
 * @param {Object} roadmap - Roadmap object with phases structure
 * @returns {Promise<void>}
 */
export const saveRoadmap = async (projectId, roadmap) => {
  try {
    if (!projectId) throw new Error('Project ID is required');
    if (!roadmap || !roadmap.phases) throw new Error('Roadmap must have phases array');

    const projectRef = doc(db, 'projects', projectId);
    
    // Get existing roadmap to preserve createdAt
    const projectSnap = await getDoc(projectRef);
    const existingRoadmap = projectSnap.exists() ? projectSnap.data().roadmap : null;
    
    const roadmapData = {
      ...roadmap,
      updatedAt: serverTimestamp(),
      createdAt: existingRoadmap?.createdAt || serverTimestamp(),
    };

    await updateDoc(projectRef, {
      roadmap: roadmapData,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error saving roadmap:', error);
    throw error;
  }
};

/**
 * Update a specific task's completion status in the roadmap
 * @param {string} projectId - The project document ID
 * @param {string} phaseId - The phase ID
 * @param {string} taskId - The task ID
 * @param {boolean} completed - Whether the task is completed
 * @returns {Promise<void>}
 */
export const updateTaskStatus = async (projectId, phaseId, taskId, completed) => {
  try {
    if (!projectId || !phaseId || !taskId) {
      throw new Error('Project ID, phase ID, and task ID are required');
    }

    const roadmap = await getRoadmap(projectId);
    if (!roadmap || !roadmap.phases) {
      throw new Error('Roadmap not found');
    }

    // Update the task with completed status and timestamp
    if (!roadmap.phases || !Array.isArray(roadmap.phases)) {
      throw new Error('Roadmap phases is not a valid array');
    }

    const updatedPhases = roadmap.phases.map(phase => {
      if (!phase || phase.id !== phaseId) return phase;
      
      const tasks = phase.tasks || [];
      if (!Array.isArray(tasks)) return phase;

      return {
        ...phase,
        tasks: tasks.map(task => {
          if (!task || task.id !== taskId) return task;
          
          const updatedTask = {
            ...task,
            completed,
          };
          // Add completedAt timestamp when completed, remove when incomplete
          if (completed) {
            updatedTask.completedAt = serverTimestamp();
          } else {
            // Remove completedAt when task is marked incomplete
            const { completedAt, ...taskWithoutTimestamp } = updatedTask;
            return taskWithoutTimestamp;
          }
          return updatedTask;
        }),
      };
    });

    // Save updated roadmap
    await saveRoadmap(projectId, {
      ...roadmap,
      phases: updatedPhases,
    });
  } catch (error) {
    console.error('Error updating task status:', error);
    throw error;
  }
};

