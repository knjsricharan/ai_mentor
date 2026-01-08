/**
 * Vercel Serverless API for Gemini AI
 * Handles AI Mentor responses and Roadmap generation
 * API Key is stored securely in environment variable GEMINI_API_KEY
 */

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

/**
 * Build project context string for prompts
 */
function buildProjectContext(projectData) {
  const parts = [];
  
  if (projectData.name) {
    parts.push(`Project Name: ${projectData.name}`);
  }
  
  if (projectData.description) {
    parts.push(`Description: ${projectData.description}`);
  } else {
    parts.push(`Description: MISSING`);
  }
  
  if (projectData.techStack && projectData.techStack.length > 0) {
    parts.push(`Tech Stack: ${projectData.techStack.join(', ')}`);
  } else {
    parts.push(`Tech Stack: MISSING`);
  }
  
  if (projectData.targetDate) {
    parts.push(`Target Date: ${projectData.targetDate}`);
  } else {
    parts.push(`Timeline: MISSING`);
  }
  
  if (projectData.domain) {
    parts.push(`Domain: ${projectData.domain}`);
  }
  
  if (projectData.teamSize) {
    parts.push(`Team Size: ${projectData.teamSize}`);
  }
  
  return parts.join('\n');
}

export default async function handler(req, res) {
  try {
    // Enable CORS for all origins (adjust in production if needed)
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    // Only allow POST requests
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    // Get API key from environment variable
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error('[GEMINI API] GEMINI_API_KEY environment variable is not set');
      console.error('[GEMINI API] Available env vars:', Object.keys(process.env).filter(k => k.includes('GEMINI') || k.includes('API')));
      return res.status(500).json({ 
        error: 'Server configuration error: API key not found',
        message: 'Please set GEMINI_API_KEY in Vercel environment variables',
        hint: 'Check Vercel dashboard > Settings > Environment Variables'
      });
    }

    // Parse request body if it's a string (Vercel sometimes sends it as a string)
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch (e) {
        console.error('[GEMINI API] Failed to parse request body:', e);
        return res.status(400).json({ error: 'Invalid JSON in request body' });
      }
    }

    console.log('[GEMINI API] Request received:', { 
      type: body?.type, 
      hasApiKey: !!apiKey,
      method: req.method,
      url: req.url
    });

    const { type, userMessage, chatHistory = [], projectData = {} } = body;

    if (!type || (type !== 'chat' && type !== 'roadmap')) {
      return res.status(400).json({ error: 'Invalid request type. Must be "chat" or "roadmap"' });
    }

    const projectContext = buildProjectContext(projectData);

    let systemPrompt;

    if (type === 'chat') {
      // AI Mentor chat response
      systemPrompt = `You are an AI Project Mentor helping a user with their project: "${projectData.name || 'Untitled Project'}".

${projectContext}

Your role:
1. Check if project details are missing (description, tech stack, goals, timeline)
2. If missing, ask ONE question at a time to collect that information
3. If all details are complete, answer questions and suggest features/improvements
4. After gathering sufficient information, instruct the user: "Go to the Roadmap tab and click the Generate button."
5. NEVER generate roadmap automatically - only instruct user to click Generate button

Be conversational, helpful, and focused. Ask one question at a time.`;

      // Build conversation history
      const conversationHistory = chatHistory
        .slice(-10) // Last 10 messages for context
        .map(msg => ({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: msg.content }]
        }));

      // Add current user message
      const messages = [
        ...conversationHistory,
        {
          role: 'user',
          parts: [{ text: userMessage }]
        }
      ];

      // Build the full conversation with system prompt
      const fullPrompt = `${systemPrompt}\n\nConversation:\n${messages.map(m => `${m.role}: ${m.parts[0].text}`).join('\n')}`;

      const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [{ text: fullPrompt }]
            }
          ]
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('[GEMINI API] Gemini API error for chat:', errorData);
        throw new Error(errorData.error?.message || `Gemini API error: ${response.status}`);
      }

      const data = await response.json();
      const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || 
        'I apologize, but I encountered an error. Please try again.';

      console.log('[GEMINI API] Successfully generated AI response, length:', aiResponse.length);
      return res.status(200).json({ response: aiResponse.trim() });

    } else if (type === 'roadmap') {
      // Enhanced roadmap generation with HDLC structure
      const teamSize = projectData.teamSize ? parseInt(projectData.teamSize) : 1;
      const isTeamProject = teamSize > 1;
      
      systemPrompt = `You are an expert software development architect generating a professional, industry-grade project roadmap.

Project Information:
${projectContext}

${chatHistory.length > 0 ? `\nConversation Context:\n${chatHistory.slice(-5).map(m => `${m.role}: ${m.content}`).join('\n')}` : ''}

CRITICAL REQUIREMENTS:

1. ROADMAP STRUCTURE - MUST follow HDLC (High-Level Development Life Cycle):
   The roadmap MUST have exactly 6 phases in this order:
   - Phase 1: Requirement Analysis
   - Phase 2: System Design
   - Phase 3: Implementation / Development
   - Phase 4: Testing & Validation
   - Phase 5: Deployment
   - Phase 6: Maintenance & Improvements

2. TASK SPECIFICITY - Tasks must be:
   - SPECIFIC and ACTIONABLE (not generic)
   - Realistic and industry-standard
   - Include technical details relevant to the tech stack
   
   ❌ BAD: "Work on backend", "Set up database", "Create UI"
   ✅ GOOD: "Design Firestore schema for user authentication and project data collections", "Implement Firebase Auth with email/password and Google OAuth providers", "Build responsive onboarding wizard component with form validation"

3. TEAM-AWARE DISTRIBUTION:
${isTeamProject ? `   Team Size: ${teamSize} members
   - Split tasks by role (Backend Developer, Frontend Developer, DevOps Engineer, QA Engineer, etc.)
   - Each task should specify WHO does it (role-based, not names)
   - Example format: "Backend Developer: Implement REST API endpoints for user authentication"
   - Distribute work evenly across team members
   - Include collaboration tasks where multiple roles work together` : `   Team Size: Solo developer
   - Assign tasks directly without role splitting
   - Tasks should be scoped for a single developer
   - Example: "Implement Firebase Auth authentication flow"`}

4. SUB-TASK BREAKDOWN:
   - Each main task can have sub-tasks for complex work
   - Sub-tasks should be nested under main tasks
   - Format: Use "subTasks" array within tasks

5. PHASE DETAILS:
   Each phase must have:
   - Clear objective explaining the phase purpose
   - 4-8 main tasks (more for Implementation phase, fewer for others)
   - Tasks should build logically on previous phases

JSON FORMAT ${isTeamProject ? '(with team roles)' : '(solo developer)'}:
{
  "phases": [
    {
      "id": "1",
      "name": "Requirement Analysis",
      "description": "Gather and analyze project requirements, define scope, and establish success criteria",
      "tasks": [
        {
          "id": "1-1",
          "name": "${isTeamProject ? 'Product Manager: ' : ''}Conduct stakeholder interviews and document functional requirements",
          "completed": false${isTeamProject ? ',\n          "role": "Product Manager"' : ''}
        },
        {
          "id": "1-2",
          "name": "${isTeamProject ? 'Technical Lead: ' : ''}Analyze technical feasibility and identify technology constraints",
          "completed": false${isTeamProject ? ',\n          "role": "Technical Lead"' : ''},
          "subTasks": [
            {
              "id": "1-2-1",
              "name": "Evaluate framework capabilities",
              "completed": false
            }
          ]
        }
      ]
    }
  ]
}

IMPORTANT:
- Return ONLY valid JSON, no markdown or code blocks
- Ensure all IDs are unique
- All tasks must have completed: false
- Make tasks realistic and specific to the project's tech stack: ${projectData.techStack?.join(', ') || 'Not specified'}
- Consider project domain: ${projectData.domain || 'Not specified'}
- Timeline consideration: ${projectData.targetDate || 'Not specified'}

Generate a comprehensive, professional roadmap that reflects real industry software development practices.`;

      const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [{ text: systemPrompt }]
            }
          ]
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('[GEMINI API] Gemini API error for roadmap:', errorData);
        throw new Error(errorData.error?.message || `Gemini API error: ${response.status}`);
      }

      const data = await response.json();
      const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
      
      console.log('[GEMINI API] Received roadmap response, length:', responseText.length);
      
      // Extract JSON from response (handle markdown code blocks if present)
      let jsonText = responseText.trim();
      if (jsonText.startsWith('```')) {
        jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      }
      
      let roadmap;
      try {
        roadmap = JSON.parse(jsonText);
      } catch (parseError) {
        console.error('[GEMINI API] Failed to parse roadmap JSON:', parseError);
        console.error('[GEMINI API] Response text:', jsonText.substring(0, 500));
        throw new Error('Failed to parse roadmap JSON from AI response');
      }
      
      // Validate and ensure all phases, tasks, and sub-tasks have proper structure
      if (roadmap.phases && Array.isArray(roadmap.phases)) {
        roadmap.phases.forEach((phase, phaseIndex) => {
          // Ensure phase has an ID
          if (!phase.id) {
            phase.id = String(phaseIndex + 1);
          }
          
          if (phase.tasks && Array.isArray(phase.tasks)) {
            phase.tasks.forEach((task, taskIndex) => {
              // Ensure task has an ID
              if (!task.id) {
                task.id = `${phase.id}-${taskIndex + 1}`;
              }
              
              // Ensure completed is false
              task.completed = false;
              
              // Validate and ensure sub-tasks have proper structure
              if (task.subTasks && Array.isArray(task.subTasks)) {
                task.subTasks.forEach((subTask, subTaskIndex) => {
                  if (!subTask.id) {
                    subTask.id = `${task.id}-${subTaskIndex + 1}`;
                  }
                  subTask.completed = false;
                });
              }
            });
          }
        });
      }
      
      console.log('[GEMINI API] Successfully generated roadmap with', roadmap.phases?.length || 0, 'phases');
      return res.status(200).json({ roadmap });
    }

  } catch (error) {
    console.error('[GEMINI API] Error in handler:', error);
    console.error('[GEMINI API] Error stack:', error.stack);
    return res.status(500).json({ 
      error: 'Failed to process request',
      message: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}

