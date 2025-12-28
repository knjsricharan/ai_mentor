import { useState, useEffect, useRef } from 'react';
import { Send, Bot, User, Loader } from 'lucide-react';
import { saveChatMessage, loadChatMessages } from '../services/chatService';
import { generateAIResponse, checkProjectDetails } from '../services/geminiService';

const ChatView = ({ projectId, project }) => {
  const [messages, setMessages] = useState([]);
  const [initialMessageSent, setInitialMessageSent] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const messagesEndRef = useRef(null);
  const timerRef = useRef(null);
  const firestoreUnsubscribeRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load previous chat messages from Firestore and send initial message if needed
  useEffect(() => {
    if (!projectId) {
      setMessages([]);
      setLoadingHistory(false);
      return;
    }

    setLoadingHistory(true);

    // Subscribe to Firestore messages (real-time updates)
    // This will load ALL historical messages whenever the component mounts
    // IMPORTANT: Never clear existing messages until we have confirmed no history exists
    firestoreUnsubscribeRef.current = loadChatMessages(projectId, (firestoreMessages) => {
      setLoadingHistory(false);
      
      if (firestoreMessages.length > 0) {
        // If we have Firestore messages, use them (this includes all historical messages)
        // This ensures chat history persists across refreshes and re-entries
        // Only update if we actually have messages to avoid clearing
        setMessages(firestoreMessages);
        setInitialMessageSent(true); // Mark as sent since we have messages
      } else {
        // No messages yet - only send initial message if we haven't sent it before
        // and we've confirmed there are no messages in Firestore
        // DO NOT clear messages here - only set if we're sure there are none
        if (!initialMessageSent && project) {
          sendInitialMessage();
        }
        // Don't clear messages - let them persist if they exist
      }
    });

    return () => {
      if (firestoreUnsubscribeRef.current) {
        firestoreUnsubscribeRef.current();
      }
    };
  }, [projectId]);

  // Send initial message checking project details
  const sendInitialMessage = async () => {
    if (initialMessageSent || !project || !projectId) return;
    
    setInitialMessageSent(true);
    const detailsCheck = checkProjectDetails(project);
    
    let initialContent = "Hello! I'm your AI Project Mentor. I'm here to help guide you through your project.";
    
    if (!detailsCheck.hasAllDetails) {
      initialContent += `\n\nI notice some project details are missing: ${detailsCheck.missingFields.join(', ')}. Let me ask you a few questions to better understand your project.`;
      
      // Ask first missing field question
      if (detailsCheck.missingFields.includes('description')) {
        initialContent += "\n\nFirst, could you tell me more about your project? What is it about and what are its main goals?";
      } else if (detailsCheck.missingFields.includes('tech stack')) {
        initialContent += "\n\nWhat technologies or tech stack do you plan to use for this project?";
      } else if (detailsCheck.missingFields.includes('timeline/target date')) {
        initialContent += "\n\nWhat is your target completion date or timeline for this project?";
      }
    } else {
      initialContent += "\n\nI can see your project details are complete. Feel free to ask me anything about planning, development, or best practices!";
    }
    
    const initialMessage = {
      id: `initial-${Date.now()}`,
      role: 'assistant',
      content: initialContent,
      timestamp: new Date(),
    };
    
    // Update UI immediately - only set if no messages exist (safety check)
    setMessages(prev => {
      // Only set initial message if we have no existing messages
      // This prevents clearing any messages that might have loaded
      if (prev.length === 0) {
        return [initialMessage];
      }
      // If messages exist, don't add initial message (shouldn't happen, but safety)
      return prev;
    });
    
    // Save initial message to Firestore (this will trigger the onSnapshot callback)
    try {
      await saveChatMessage(projectId, 'ai', initialContent);
    } catch (err) {
      console.error('Failed to save initial message:', err);
    }
  };

  // Cleanup timer and Firestore subscription on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
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

    // STEP 2: Save user message to Firestore (non-blocking, happens after UI update)
    if (projectId) {
      saveChatMessage(projectId, 'user', userMessage.content).catch(err => {
        console.error('Failed to save user message to Firestore:', err);
        // UI already updated, continue normally
      });
    }

    // STEP 3: Generate AI response using Gemini API (with fallback for local dev)
    // The generateAIResponse function now handles errors internally and returns fallback
    try {
      // Get chat history for context (use updated messages state which includes the new user message)
      const updatedMessages = [...messages, userMessage];
      const chatHistory = updatedMessages.map(m => ({
        role: m.role === 'assistant' ? 'ai' : 'user',
        content: m.content
      }));
      
      // Generate response using Gemini (will use fallback if API unavailable)
      // This will never throw - it always returns a response (fallback if needed)
      const aiResponseText = await generateAIResponse(
        userInput,
        chatHistory,
        project || {}
      );
      
      const aiMessage = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: aiResponseText,
        timestamp: new Date(),
      };
      
      // STEP 4: Update UI with AI response immediately
      setMessages(prev => [...prev, aiMessage]);
      setLoading(false);

      // STEP 5: Save AI message to Firestore (non-blocking, happens after UI update)
      if (projectId) {
        saveChatMessage(projectId, 'ai', aiMessage.content).catch(err => {
          console.error('Failed to save AI message to Firestore:', err);
          // UI already updated, continue normally
        });
      }
    } catch (error) {
      // This should rarely happen now since generateAIResponse handles errors internally
      // But keep as safety net
      console.error('Unexpected error generating AI response:', error);
      const errorMessage = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: "I apologize, but I encountered an error processing your message. Please try again.",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
      setLoading(false);
      
      if (projectId) {
        saveChatMessage(projectId, 'ai', errorMessage.content).catch(err => {
          console.error('Failed to save error message:', err);
        });
      }
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-250px)]">
      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 mb-4 p-4 bg-white rounded-2xl shadow-lg">
        {loadingHistory && messages.length === 0 && (
          <div className="flex items-center justify-center py-8">
            <Loader className="w-6 h-6 text-primary-500 animate-spin" />
            <span className="ml-2 text-gray-600">Loading chat history...</span>
          </div>
        )}
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex gap-3 ${
              message.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            {message.role === 'assistant' && (
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

