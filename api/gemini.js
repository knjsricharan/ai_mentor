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
    return res.status(500).json({ 
      error: 'Server configuration error: API key not found',
      message: 'Please set GEMINI_API_KEY in Vercel environment variables'
    });
  }

  console.log('[GEMINI API] Request received:', { type: req.body?.type, hasApiKey: !!apiKey });

  try {
    const { type, userMessage, chatHistory = [], projectData = {} } = req.body;

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
      // Roadmap generation
      systemPrompt = `You are an AI assistant generating a project roadmap.

Project Information:
${projectContext}

${chatHistory.length > 0 ? `\nConversation Context:\n${chatHistory.slice(-5).map(m => `${m.role}: ${m.content}`).join('\n')}` : ''}

Generate a structured roadmap with 3-5 phases. Each phase should have:
- id: unique identifier (e.g., "1", "2", "3")
- name: phase name
- description: brief description
- tasks: array of tasks, each with:
  - id: unique identifier (e.g., "1-1", "1-2")
  - name: task name
  - completed: false

Return ONLY valid JSON in this exact format:
{
  "phases": [
    {
      "id": "1",
      "name": "Phase Name",
      "description": "Phase description",
      "tasks": [
        {
          "id": "1-1",
          "name": "Task name",
          "completed": false
        }
      ]
    }
  ]
}

Do not include any markdown, code blocks, or extra text. Only return the JSON object.`;

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
      
      // Validate and ensure all tasks have completed: false
      if (roadmap.phases && Array.isArray(roadmap.phases)) {
        roadmap.phases.forEach(phase => {
          if (phase.tasks && Array.isArray(phase.tasks)) {
            phase.tasks.forEach(task => {
              task.completed = false;
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

