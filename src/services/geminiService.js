/**
 * Gemini API Service for AI Mentor and Roadmap Generation
 * Uses Vercel Serverless API to securely call Google Gemini API
 * Falls back to local dev mode responses when API is unavailable
 */

import { getFallbackAIResponse, getFallbackRoadmap } from '../utils/devMode';

/**
 * Generate AI response using Vercel Serverless API
 * Falls back to local dev mode if API is unavailable
 * @param {string} userMessage - User's message
 * @param {Array} chatHistory - Previous chat messages
 * @param {Object} projectData - Project data (name, description, techStack, etc.)
 * @returns {Promise<string>} AI response
 */
export const generateAIResponse = async (userMessage, chatHistory = [], projectData = {}) => {
  // Check if we're explicitly in development mode
  // Only use fallback if DEV is explicitly true (local development)
  const isDev = import.meta.env.DEV === true;
  const isProd = import.meta.env.PROD === true;
  
  // Only skip API if we're definitely in dev mode
  // If PROD is true OR if DEV is false/undefined, try the API
  if (isDev && !isProd) {
    console.log('[DEV MODE] Using fallback AI response');
    return getFallbackAIResponse(userMessage, projectData, true);
  }

  // Try the API (production or unknown environment)
  console.log('[API CALL] Attempting to call Gemini API...', { isDev, isProd, mode: import.meta.env.MODE });
  try {
    const response = await fetch('/api/gemini', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'chat',
        userMessage,
        chatHistory,
        projectData,
      }),
    });

    console.log('[API RESPONSE] Status:', response.status, response.statusText);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('[API ERROR] Response error:', errorData);
      // If API returns error, use fallback but without dev mode message
      return getFallbackAIResponse(userMessage, projectData, false);
    }

    const data = await response.json();
    console.log('[API SUCCESS] Received response:', data.response ? 'Yes' : 'No');
    
    if (data.response) {
      return data.response;
    }
    
    // If no response in data, use fallback
    console.warn('[API WARNING] No response in data, using fallback');
    return getFallbackAIResponse(userMessage, projectData, false);
  } catch (error) {
    // Network error or API unavailable
    console.error('[API ERROR] Network/Request error:', error);
    return getFallbackAIResponse(userMessage, projectData, false);
  }
};

/**
 * Generate roadmap using Vercel Serverless API
 * Falls back to local dev mode if API is unavailable
 * @param {Object} projectData - Project data
 * @param {Array} chatHistory - Chat history for context
 * @returns {Promise<Object>} Roadmap object with phases and tasks
 */
export const generateRoadmap = async (projectData = {}, chatHistory = []) => {
  // Check if we're explicitly in development mode
  // Only use fallback if DEV is explicitly true (local development)
  const isDev = import.meta.env.DEV === true;
  const isProd = import.meta.env.PROD === true;
  
  // Only skip API if we're definitely in dev mode
  // If PROD is true OR if DEV is false/undefined, try the API
  if (isDev && !isProd) {
    console.log('[DEV MODE] Using fallback roadmap');
    return getFallbackRoadmap(projectData);
  }

  // Try the API (production or unknown environment)
  console.log('[API CALL] Attempting to call Gemini API for roadmap...', { isDev, isProd, mode: import.meta.env.MODE });
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

    console.log('[API RESPONSE] Status:', response.status, response.statusText);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('[API ERROR] Response error:', errorData);
      // If API returns error, use fallback
      return getFallbackRoadmap(projectData);
    }

    const data = await response.json();
    console.log('[API SUCCESS] Received roadmap:', data.roadmap ? 'Yes' : 'No');
    
    if (data.roadmap && data.roadmap.phases && data.roadmap.phases.length > 0) {
      return data.roadmap;
    }
    
    // If no valid roadmap, use fallback
    console.warn('[API WARNING] No valid roadmap in data, using fallback');
    return getFallbackRoadmap(projectData);
  } catch (error) {
    // Network error or API unavailable
    console.error('[API ERROR] Network/Request error:', error);
    return getFallbackRoadmap(projectData);
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

