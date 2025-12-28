import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';

/*
Firestore Structure:
projects/{projectId}/mentorChat/{messageId}
  - role: "user" | "model"
  - content: string
  - createdAt: timestamp
*/

export const saveChatMessage = async (projectId, role, content) => {
  try {
    if (!projectId || !content?.trim()) return null;
    if (!['user', 'model'].includes(role)) return null;

    const chatRef = collection(db, 'projects', projectId, 'mentorChat');

    const docRef = await addDoc(chatRef, {
      role,
      content: content.trim(),
      createdAt: serverTimestamp(),
    });

    return docRef.id;
  } catch (err) {
    console.error('saveChatMessage error:', err);
    return null;
  }
};

export const loadChatMessages = (projectId, callback) => {
  if (!projectId) {
    callback([]);
    return () => {};
  }

  const chatRef = collection(db, 'projects', projectId, 'mentorChat');
  
  const processMessages = (querySnapshot) => {
    const messages = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      // Map old roles to new format for compatibility
      let role = data.role;
      if (role === 'ai' || role === 'assistant') {
        role = 'model';
      }
      // Ensure only "user" or "model"
      if (role !== 'user' && role !== 'model') {
        role = 'model'; // Default to model for unknown roles
      }
      
      messages.push({
        id: doc.id,
        role, // "user" | "model"
        content: data.content || '',
        timestamp: data.createdAt?.toDate?.() || new Date(),
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
    const q = query(chatRef, orderBy('createdAt', 'asc'));
    
    const unsubscribe = onSnapshot(q, processMessages, (error) => {
      console.error('Error loading chat messages:', error);
      
      // Fallback: try without orderBy if index is missing
      if (error.code === 'failed-precondition' || error.message?.includes('index')) {
        console.log('Index missing, trying fallback query...');
        const fallbackQuery = query(chatRef);
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
