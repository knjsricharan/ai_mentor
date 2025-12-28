/**
 * Utility to detect local development vs production mode
 * Uses Vite's environment variables for accurate detection
 */

/**
 * Check if we're in local development mode
 * Uses Vite's import.meta.env.DEV which is true only in development
 * @returns {boolean} True if in local dev mode
 */
export const isLocalDev = () => {
  // Vite sets import.meta.env.DEV to true in development mode
  // Vite sets import.meta.env.PROD to true in production mode
  return import.meta.env.DEV === true;
};

/**
 * Check if we're in production mode
 * Uses Vite's import.meta.env.PROD which is true only in production
 * @returns {boolean} True if in production mode
 */
export const isProduction = () => {
  return import.meta.env.PROD === true;
};

/**
 * Check if the API is available (for Vercel serverless functions)
 * This will be checked at runtime
 * @returns {Promise<boolean>} True if API is available
 */
export const isApiAvailable = async () => {
  try {
    // Try to ping the API endpoint
    const response = await fetch('/api/gemini', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'chat',
        userMessage: 'test',
        chatHistory: [],
        projectData: {},
      }),
    });
    
    // If we get a response (even an error), the API endpoint exists
    // We only care if it's a network error (API doesn't exist)
    return response.status !== 404;
  } catch (error) {
    // Network error or API not available
    return false;
  }
};

/**
 * Get a fallback AI response for local development
 * @param {string} userMessage - User's message
 * @param {Object} projectData - Project data
 * @returns {string} Fallback response
 */
export const getFallbackAIResponse = (userMessage, projectData = {}) => {
  const projectName = projectData.name || 'your project';
  
  // Simple keyword-based responses for local dev
  const lowerMessage = userMessage.toLowerCase();
  
  if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
    return `Hello! I'm your AI Project Mentor. I'm here to help guide you through ${projectName}.\n\nNote: You're in local development mode. AI responses will be available after deployment to Vercel.`;
  }
  
  if (lowerMessage.includes('roadmap') || lowerMessage.includes('plan')) {
    return `I'd be happy to help you create a roadmap for ${projectName}!\n\nTo generate a roadmap:\n1. Fill in your project details (description, tech stack, timeline)\n2. Or chat with me to gather information\n3. Then go to the Roadmap tab and click "Generate Roadmap"\n\nNote: Full AI roadmap generation will be available after deployment.`;
  }
  
  if (lowerMessage.includes('help') || lowerMessage.includes('what can you do')) {
    return `I can help you with:\n\n1. **Project Planning**: Ask me questions about your project structure, features, or best practices\n2. **Roadmap Generation**: Help you create a step-by-step roadmap for your project\n3. **Technical Guidance**: Get advice on technologies, architecture, and development practices\n4. **Project Details**: I'll ask you questions to better understand your project needs\n\nNote: You're in local development mode. Full AI capabilities will be available after deployment.`;
  }
  
  if (lowerMessage.includes('description') || lowerMessage.includes('what is')) {
    return `I'd love to learn more about ${projectName}!\n\nCould you tell me:\n- What is the main purpose of your project?\n- What problem does it solve?\n- Who is your target audience?\n\nThis information will help me provide better guidance and create a more accurate roadmap.`;
  }
  
  if (lowerMessage.includes('tech') || lowerMessage.includes('technology') || lowerMessage.includes('stack')) {
    return `Great question about technology!\n\nFor ${projectName}, consider:\n- Frontend: React, Vue, or Angular for web apps\n- Backend: Node.js, Python, or Java depending on your needs\n- Database: PostgreSQL, MongoDB, or Firebase\n- Deployment: Vercel, AWS, or Heroku\n\nWhat technologies are you considering? I can help you choose the best stack for your project.`;
  }
  
  // Default fallback response
  return `Thanks for your message about ${projectName}!\n\nI'm here to help you with project planning, roadmap creation, and technical guidance. Feel free to ask me:\n- Questions about your project structure\n- Help with planning and timelines\n- Technical recommendations\n- Feature suggestions\n\nNote: You're in local development mode. Full AI responses with Gemini will be available after deployment to Vercel.`;
};

/**
 * Get a fallback roadmap for local development
 * @param {Object} projectData - Project data
 * @returns {Object} Fallback roadmap structure
 */
export const getFallbackRoadmap = (projectData = {}) => {
  const projectName = projectData.name || 'Your Project';
  
  return {
    phases: [
      {
        id: '1',
        name: 'Planning & Setup',
        description: 'Initial project planning and environment setup',
        tasks: [
          { id: '1-1', name: 'Define project requirements and goals', completed: false },
          { id: '1-2', name: 'Set up development environment', completed: false },
          { id: '1-3', name: 'Choose technology stack', completed: false },
          { id: '1-4', name: 'Create project repository', completed: false },
        ],
      },
      {
        id: '2',
        name: 'Core Development',
        description: 'Build the main features and functionality',
        tasks: [
          { id: '2-1', name: 'Implement core features', completed: false },
          { id: '2-2', name: 'Set up database and data models', completed: false },
          { id: '2-3', name: 'Create user interface', completed: false },
          { id: '2-4', name: 'Implement authentication (if needed)', completed: false },
        ],
      },
      {
        id: '3',
        name: 'Testing & Refinement',
        description: 'Test, debug, and refine the application',
        tasks: [
          { id: '3-1', name: 'Write and run unit tests', completed: false },
          { id: '3-2', name: 'Perform integration testing', completed: false },
          { id: '3-3', name: 'Fix bugs and issues', completed: false },
          { id: '3-4', name: 'Optimize performance', completed: false },
        ],
      },
      {
        id: '4',
        name: 'Deployment & Launch',
        description: 'Deploy the application and prepare for launch',
        tasks: [
          { id: '4-1', name: 'Set up production environment', completed: false },
          { id: '4-2', name: 'Deploy application', completed: false },
          { id: '4-3', name: 'Configure domain and SSL', completed: false },
          { id: '4-4', name: 'Monitor and maintain', completed: false },
        ],
      },
    ],
  };
};

