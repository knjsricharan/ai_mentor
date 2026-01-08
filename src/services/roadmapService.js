import { doc, getDoc, updateDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db } from '../config/firebase';

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

export const saveRoadmap = async (projectId, roadmap) => {
  try {
    if (!projectId) throw new Error('Project ID is required');
    if (!roadmap || !roadmap.phases) throw new Error('Roadmap must have phases array');

    const projectRef = doc(db, 'projects', projectId);
    
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

export const updateTaskStatus = async (projectId, phaseId, taskId, completed, isSubTask = false, parentTaskId = null) => {
  try {
    if (!projectId || !phaseId || !taskId) {
      throw new Error('Project ID, phase ID, and task ID are required');
    }

    const roadmap = await getRoadmap(projectId);
    if (!roadmap || !roadmap.phases) {
      throw new Error('Roadmap not found');
    }

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
          // Handle sub-task updates
          if (isSubTask && parentTaskId && task.id === parentTaskId) {
            const subTasks = task.subTasks || [];
            if (!Array.isArray(subTasks)) return task;
            
            const updatedSubTasks = subTasks.map(subTask => {
              if (!subTask || subTask.id !== taskId) return subTask;
              
              const updatedSubTask = {
                ...subTask,
                completed,
              };
              if (completed) {
                updatedSubTask.completedAt = Timestamp.now();
              } else {
                const { completedAt, ...subTaskWithoutTimestamp } = updatedSubTask;
                return subTaskWithoutTimestamp;
              }
              return updatedSubTask;
            });
            
            // Auto-complete parent task if all sub-tasks are completed
            const allSubTasksCompleted = updatedSubTasks.every(st => st.completed);
            
            const updatedTask = {
              ...task,
              subTasks: updatedSubTasks,
            };
            
            if (allSubTasksCompleted && !task.completed) {
              updatedTask.completed = true;
              updatedTask.completedAt = Timestamp.now();
            } else if (!allSubTasksCompleted && task.completed) {
              // If any sub-task is incomplete, parent should be incomplete
              const { completedAt, ...taskWithoutTimestamp } = updatedTask;
              return taskWithoutTimestamp;
            }
            
            return updatedTask;
          }
          
          // Handle main task updates
          if (!task || task.id !== taskId) return task;
          
          const updatedTask = {
            ...task,
            completed,
          };
          if (completed) {
            // Use Timestamp.now() instead of serverTimestamp() for arrays
            updatedTask.completedAt = Timestamp.now();
          } else {
            const { completedAt, ...taskWithoutTimestamp } = updatedTask;
            return taskWithoutTimestamp;
          }
          return updatedTask;
        }),
      };
    });

    await saveRoadmap(projectId, {
      ...roadmap,
      phases: updatedPhases,
    });
  } catch (error) {
    console.error('Error updating task status:', error);
    throw error;
  }
};
