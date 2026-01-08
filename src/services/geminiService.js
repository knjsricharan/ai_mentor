/**
 * Gemini API Service for AI Mentor and Roadmap Generation
 * Uses Vercel Serverless API to securely call Google Gemini API
 * Works both locally (with vercel dev) and on Vercel production
 */

/**
 * Generate AI response using Vercel Serverless API
 * @param {string} userMessage - User's message
 * @param {Array} chatHistory - Previous chat messages
 * @param {Object} projectData - Project data (name, description, techStack, etc.)
 * @returns {Promise<string>} AI response
 * @throws {Error} If API call fails
 */
export const generateAIResponse = async (userMessage, chatHistory = [], projectData = {}) => {
  // Normalize chatHistory to ensure roles are "user" | "model"
  // Map old roles (ai, assistant) to "model" for compatibility
  const normalizedHistory = chatHistory.map(msg => ({
    role: msg.role === 'user' ? 'user' : 'model', // Ensure only "user" or "model"
    content: msg.content || ''
  }));

  try {
    const response = await fetch('/api/gemini', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'chat',
        userMessage,
        chatHistory: normalizedHistory,
        projectData,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('[API ERROR] Response error:', errorData);
      
      // Provide helpful error message for 404
      if (response.status === 404) {
        throw new Error(
          'API endpoint not found (404). ' +
          'Please run "npm run dev" (which uses vercel dev) instead of "npm run dev:vite" to enable serverless functions. ' +
          'Make sure you have Vercel CLI installed: npm i -g vercel'
        );
      }
      
      throw new Error(
        errorData.message || 
        errorData.error || 
        `API request failed with status ${response.status}: ${response.statusText}`
      );
    }

    const data = await response.json();
    
    if (data.response) {
      return data.response;
    }
    
    throw new Error('No response received from API');
  } catch (error) {
    console.error('[API ERROR] Failed to generate AI response:', error);
    
    // Re-throw with helpful message
    if (error.message) {
      throw error;
    }
    
    // Network error or API unavailable
    throw new Error(
      'Failed to connect to AI service. ' +
      'Please ensure the API endpoint is available. ' +
      'For local development, run "vercel dev" to start the serverless functions.'
    );
  }
};

/**
 * Generate roadmap using Vercel Serverless API
 * @param {Object} projectData - Project data
 * @param {Array} chatHistory - Chat history for context
 * @returns {Promise<Object>} Roadmap object with phases and tasks
 * @throws {Error} If API call fails
 */
export const generateRoadmap = async (projectData = {}, chatHistory = []) => {
  try {
    const response = await fetch('/api/gemini', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'roadmap',
        projectData,
        chatHistory,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('[API ERROR] Response error:', errorData);
      
      // Provide helpful error message for 404
      if (response.status === 404) {
        throw new Error(
          'API endpoint not found (404). ' +
          'Please run "npm run dev" (which uses vercel dev) instead of "npm run dev:vite" to enable serverless functions. ' +
          'Make sure you have Vercel CLI installed: npm i -g vercel'
        );
      }
      
      throw new Error(
        errorData.message || 
        errorData.error || 
        `API request failed with status ${response.status}: ${response.statusText}`
      );
    }

    const data = await response.json();
    
    if (data.roadmap && data.roadmap.phases && data.roadmap.phases.length > 0) {
      return data.roadmap;
    }
    
    throw new Error('Invalid roadmap data received from API');
  } catch (error) {
    console.error('[API ERROR] Failed to generate roadmap:', error);
    
    // Re-throw with helpful message
    if (error.message) {
      throw error;
    }
    
    // Network error or API unavailable
    throw new Error(
      'Failed to connect to AI service. ' +
      'Please ensure the API endpoint is available. ' +
      'For local development, run "vercel dev" to start the serverless functions.'
    );
  }
};

/**
 * Note: buildProjectContext is now handled in the Vercel Serverless API
 * This function is kept for reference but is no longer used in the frontend
 */

/**
 * Check if project has required details
 * @param {Object} projectData - Project data
 * @returns {Object} { hasAllDetails: boolean, missingFields: string[] }
 */
export const checkProjectDetails = (projectData) => {
  const missingFields = [];
  
  if (!projectData.description || projectData.description.trim() === '') {
    missingFields.push('description');
  }
  
  if (!projectData.techStack || projectData.techStack.length === 0) {
    missingFields.push('tech stack');
  }
  
  if (!projectData.targetDate) {
    missingFields.push('timeline/target date');
  }
  
  // Goals are optional but can be checked in description
  
  return {
    hasAllDetails: missingFields.length === 0,
    missingFields
  };
};

