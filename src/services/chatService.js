import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  getDocs,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../config/firebase';

/**
 * Chat Service for managing AI Mentor chat messages in Firestore
 * 
 * Firestore Structure:
 * projects/{projectId}/aiChats/{messageId}
 *   - role: "user" | "ai"
 *   - content: string
 *   - createdAt: Timestamp
 */

/**
 * Add a new chat message to Firestore (non-blocking)
 * @param {string} projectId - The project document ID
 * @param {string} role - Message role: "user" or "ai"
 * @param {string} content - Message content
 * @returns {Promise<string>} Document ID of created message
 */
export const saveChatMessage = async (projectId, role, content) => {
  try {
    if (!projectId) return null;
    if (!['user', 'ai'].includes(role)) return null;
    if (!content?.trim()) return null;

    const aiChatsRef = collection(db, 'projects', projectId, 'aiChats');
    const newMessage = {
      role,
      content: content.trim(),
      createdAt: serverTimestamp(),
    };

    const docRef = await addDoc(aiChatsRef, newMessage);
    return docRef.id;
  } catch (error) {
    console.error('Error saving chat message to Firestore:', error);
    // Don't throw - allow UI to continue working even if Firestore fails
    return null;
  }
};

/**
 * Load all chat messages from Firestore (non-blocking)
 * @param {string} projectId - The project document ID
 * @param {function} callback - Function to call with loaded messages
 * @returns {function} Unsubscribe function
 */
export const loadChatMessages = (projectId, callback) => {
  if (!projectId) {
    callback([]);
    return () => {};
  }

  const aiChatsRef = collection(db, 'projects', projectId, 'aiChats');
  
  const processMessages = (querySnapshot) => {
    const messages = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      
      // Convert Firestore timestamp to Date
      let timestamp = new Date();
      if (data.createdAt) {
        if (data.createdAt.toDate && typeof data.createdAt.toDate === 'function') {
          timestamp = data.createdAt.toDate();
        } else if (data.createdAt.seconds) {
          timestamp = new Date(data.createdAt.seconds * 1000);
        } else if (data.createdAt instanceof Date) {
          timestamp = data.createdAt;
        } else if (typeof data.createdAt === 'number') {
          timestamp = new Date(data.createdAt);
        }
      }
      
      messages.push({
        id: doc.id,
        role: data.role === 'ai' ? 'assistant' : 'user', // Convert 'ai' to 'assistant' for UI
        content: data.content || '',
        timestamp: timestamp,
      });
    });
    
    // Sort by createdAt (ascending - oldest first)
    messages.sort((a, b) => {
      const aTime = a.timestamp instanceof Date ? a.timestamp.getTime() : 0;
      const bTime = b.timestamp instanceof Date ? b.timestamp.getTime() : 0;
      return aTime - bTime;
    });
    
    callback(messages);
  };

  try {
    const q = query(aiChatsRef, orderBy('createdAt', 'asc'));
    
    const unsubscribe = onSnapshot(q, processMessages, (error) => {
      console.error('Error loading chat messages:', error);
      
      // Fallback: try without orderBy if index is missing
      if (error.code === 'failed-precondition' || error.message?.includes('index')) {
        console.log('Index missing, trying fallback query...');
        const fallbackQuery = query(aiChatsRef);
        return onSnapshot(fallbackQuery, processMessages, (fallbackError) => {
          console.error('Fallback query failed:', fallbackError);
          callback([]);
        });
      }
      callback([]);
    });

    return unsubscribe;
  } catch (error) {
    console.error('Error setting up chat messages subscription:', error);
    callback([]);
    return () => {};
  }
};

