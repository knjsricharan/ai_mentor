/**
 * Gemini API Service for AI Mentor and Roadmap Generation
 * Uses Vercel Serverless API to securely call Google Gemini API
 * Falls back to local dev mode responses when API is unavailable
 */

import { isLocalDev, getFallbackAIResponse, getFallbackRoadmap } from '../utils/devMode';

/**
 * Generate AI response using Vercel Serverless API
 * Falls back to local dev mode if API is unavailable
 * @param {string} userMessage - User's message
 * @param {Array} chatHistory - Previous chat messages
 * @param {Object} projectData - Project data (name, description, techStack, etc.)
 * @returns {Promise<string>} AI response
 */
export const generateAIResponse = async (userMessage, chatHistory = [], projectData = {}) => {
  // Check if we're in local dev mode
  if (isLocalDev()) {
    console.log('Local dev mode: Using fallback AI response');
    // Return fallback response immediately without trying API
    return getFallbackAIResponse(userMessage, projectData);
  }

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

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      // If API returns error, use fallback instead of throwing
      console.warn('API error, using fallback response:', errorData);
      return getFallbackAIResponse(userMessage, projectData);
    }

    const data = await response.json();
    return data.response || getFallbackAIResponse(userMessage, projectData);
  } catch (error) {
    // Network error or API unavailable - use fallback
    console.warn('API unavailable, using fallback response:', error.message);
    return getFallbackAIResponse(userMessage, projectData);
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
  // Check if we're in local dev mode
  if (isLocalDev()) {
    console.log('Local dev mode: Using fallback roadmap');
    // Return fallback roadmap immediately without trying API
    return getFallbackRoadmap(projectData);
  }

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
      // If API returns error, use fallback instead of throwing
      console.warn('API error, using fallback roadmap:', errorData);
      return getFallbackRoadmap(projectData);
    }

    const data = await response.json();
    return data.roadmap || getFallbackRoadmap(projectData);
  } catch (error) {
    // Network error or API unavailable - use fallback
    console.warn('API unavailable, using fallback roadmap:', error.message);
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

