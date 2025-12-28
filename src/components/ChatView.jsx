import { useState, useEffect, useRef } from 'react';
import { Send, Bot, User, Loader, AlertCircle } from 'lucide-react';
import { saveChatMessage, loadChatMessages } from '../services/chatService';
import { generateAIResponse, checkProjectDetails } from '../services/geminiService';

const ChatView = ({ projectId, project }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [initialMessageShown, setInitialMessageShown] = useState(false);
  const messagesEndRef = useRef(null);
  const firestoreUnsubscribeRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load previous chat messages from Firestore (non-blocking)
  useEffect(() => {
    if (!projectId) return;

    // Subscribe to Firestore messages (non-blocking - UI continues to work)
    firestoreUnsubscribeRef.current = loadChatMessages(projectId, (firestoreMessages) => {
      if (firestoreMessages.length > 0) {
        // If we have Firestore messages, use them
        setMessages(firestoreMessages);
        setInitialMessageShown(true);
      } else if (!initialMessageShown) {
        // If no messages, show initial greeting immediately in UI
        const details = checkProjectDetails(project || {});
        let content =
          "Hello! I'm your AI Project Mentor. I'm here to help guide you through your project.";

        if (!details.hasAllDetails) {
          content += `\n\nI see some details are missing: ${details.missingFields.join(
            ', '
          )}. Let's start with this:`;

          if (details.missingFields.includes('description')) {
            content += '\n\nCan you describe your project and its goals?';
          } else if (details.missingFields.includes('tech stack')) {
            content += '\n\nWhat tech stack are you planning to use?';
          } else if (details.missingFields.includes('timeline')) {
            content += '\n\nWhat is your expected timeline?';
          }
        } else {
          content += '\n\nFeel free to ask me anything about your project.';
        }

        const initialMessage = {
          id: 'initial',
          role: 'model',
          content: content,
          timestamp: new Date(),
        };
        setMessages([initialMessage]);
        setInitialMessageShown(true);

        // Save initial message to Firestore (non-blocking)
        saveChatMessage(projectId, 'model', content).catch(err => {
          console.error('Failed to save initial message to Firestore:', err);
          // UI already updated, continue normally
        });
      }
    });

    return () => {
      if (firestoreUnsubscribeRef.current) {
        firestoreUnsubscribeRef.current();
      }
    };
  }, [projectId, project, initialMessageShown]);

  // Cleanup Firestore subscription on unmount
  useEffect(() => {
    return () => {
      if (firestoreUnsubscribeRef.current) {
        firestoreUnsubscribeRef.current();
      }
    };
  }, []);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    // STEP 1: Update UI immediately (optimistic update)
    setMessages(prev => [...prev, userMessage]);
    const userInput = input;
    setInput('');
    setLoading(true);
    setError(null);

    // STEP 2: Save user message to Firestore (non-blocking, happens after UI update)
    if (projectId) {
      saveChatMessage(projectId, 'user', userMessage.content).catch(err => {
        console.error('Failed to save user message to Firestore:', err);
        // UI already updated, continue normally
      });
    }

    try {
      // STEP 3: Generate AI response
      // Get conversation history (excluding the initial message if it's just a greeting)
      const conversationHistory = messages
        .filter(msg => msg.id !== 'initial')
        .map(msg => ({
          role: msg.role === 'model' ? 'model' : 'user',
          content: msg.content,
        }));

      const aiResponse = await generateAIResponse(
        userInput,
        conversationHistory,
        project || {}
      );

      const aiMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        content: aiResponse,
        timestamp: new Date(),
      };
      
      // STEP 4: Update UI with AI response immediately
      setMessages(prev => [...prev, aiMessage]);
      setLoading(false);

      // STEP 5: Save AI message to Firestore (non-blocking, happens after UI update)
      if (projectId) {
        saveChatMessage(projectId, 'model', aiMessage.content).catch(err => {
          console.error('Failed to save AI message to Firestore:', err);
          // UI already updated, continue normally
        });
      }
    } catch (err) {
      console.error('Error generating AI response:', err);
      setLoading(false);
      setError(err.message || 'Failed to get AI response. Please try again.');
      
      // Show error message in chat
      const errorMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        content: err.message?.includes('API') || err.message?.includes('key')
          ? '⚠️ AI service is currently unavailable. Please check your API configuration or try again later.'
          : 'Sorry, I encountered an error while generating a response. Please try again.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-250px)]">
      {error && (
        <div className="mb-4 p-4 bg-red-50 border-2 border-red-200 rounded-xl text-red-700 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
      
      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 mb-4 p-4 bg-white rounded-2xl shadow-lg">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex gap-3 ${
              message.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            {message.role === 'model' && (
              <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-primary-500 to-accent-500 rounded-full flex items-center justify-center">
                <Bot className="w-5 h-5 text-white" />
              </div>
            )}
            <div
              className={`max-w-[70%] rounded-2xl p-4 ${
                message.role === 'user'
                  ? 'bg-primary-500 text-white'
                  : 'bg-gray-100 text-gray-900'
              }`}
            >
              <p className="whitespace-pre-wrap">{message.content}</p>
              <p
                className={`text-xs mt-2 ${
                  message.role === 'user' ? 'text-primary-100' : 'text-gray-500'
                }`}
              >
                {message.timestamp instanceof Date
                  ? message.timestamp.toLocaleTimeString()
                  : new Date(message.timestamp).toLocaleTimeString()}
              </p>
            </div>
            {message.role === 'user' && (
              <div className="flex-shrink-0 w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-gray-600" />
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex gap-3 justify-start">
            <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-primary-500 to-accent-500 rounded-full flex items-center justify-center">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div className="bg-gray-100 rounded-2xl p-4">
              <Loader className="w-5 h-5 text-primary-500 animate-spin" />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Chat Input */}
      <form onSubmit={handleSend} className="flex gap-3">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask your AI mentor anything..."
          className="flex-1 input-field"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={!input.trim() || loading}
          className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Send className="w-5 h-5" />
          Send
        </button>
      </form>
    </div>
  );
};

export default ChatView;
