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

  // Load previous chat messages from Firestore - Firestore is the source of truth
  useEffect(() => {
    if (!projectId) {
      setMessages([]);
      setLoadingHistory(false);
      return;
    }

    setLoadingHistory(true);

    // Subscribe to Firestore messages (real-time updates)
    // Firestore is the SINGLE SOURCE OF TRUTH - UI only displays what's in Firestore
    firestoreUnsubscribeRef.current = loadChatMessages(projectId, (firestoreMessages) => {
      setLoadingHistory(false);
      
      // ALWAYS set messages from Firestore - this is the source of truth
      setMessages(firestoreMessages);
      
      // Check if we need to send initial message
      if (firestoreMessages.length === 0 && !initialMessageSent && project) {
        sendInitialMessage();
      } else if (firestoreMessages.length > 0) {
        // Mark as sent since we have messages
        setInitialMessageSent(true);
      }
    });

    return () => {
      if (firestoreUnsubscribeRef.current) {
        firestoreUnsubscribeRef.current();
      }
    };
  }, [projectId, project]);

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
    
    // Save initial message to Firestore - UI will update via real-time listener
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
    if (!input.trim() || loading || !projectId) return;

    const userInput = input.trim();
    setInput('');
    setLoading(true);

    try {
      // STEP 1: Build chat history BEFORE saving (includes current messages + new user message)
      // This ensures we have the complete context for the API call
      const chatHistory = [
        ...messages.map(m => ({
          role: m.role === 'assistant' ? 'ai' : 'user',
          content: m.content
        })),
        {
          role: 'user',
          content: userInput
        }
      ];
      
      // STEP 2: Save user message to Firestore
      // Firestore is the source of truth - UI will update via real-time listener
      await saveChatMessage(projectId, 'user', userInput);
      
      // STEP 3: Generate AI response using Gemini API
      // Use the chat history we built (includes the new user message)
      // This will never throw - it always returns a response (fallback if needed)
      const aiResponseText = await generateAIResponse(
        userInput,
        chatHistory,
        project || {}
      );
      
      // STEP 4: Save AI message to Firestore
      // Firestore listener will update UI automatically
      await saveChatMessage(projectId, 'ai', aiResponseText);
      
      setLoading(false);
    } catch (error) {
      // This should rarely happen now since generateAIResponse handles errors internally
      // But keep as safety net
      console.error('Unexpected error in handleSend:', error);
      
      // Save error message to Firestore so it appears in chat history
      const errorMessage = "I apologize, but I encountered an error processing your message. Please try again.";
      await saveChatMessage(projectId, 'ai', errorMessage).catch(err => {
        console.error('Failed to save error message:', err);
      });
      
      setLoading(false);
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

