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

  useEffect(() => {
    if (!projectId) return;

    firestoreUnsubscribeRef.current = loadChatMessages(projectId, (firestoreMessages) => {
      const validMessages = Array.isArray(firestoreMessages) ? firestoreMessages : [];
      if (validMessages.length > 0) {
        setMessages(validMessages);
        setInitialMessageShown(true);
      } else if (!initialMessageShown) {
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

        saveChatMessage(projectId, 'model', content).catch(err => {
          console.error('Failed to save initial message to Firestore:', err);
        });
      }
    });

    return () => {
      if (firestoreUnsubscribeRef.current) {
        firestoreUnsubscribeRef.current();
      }
    };
  }, [projectId, project, initialMessageShown]);

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

    setMessages(prev => [...prev, userMessage]);
    const userInput = input;
    setInput('');
    setLoading(true);
    setError(null);

    if (projectId) {
      saveChatMessage(projectId, 'user', userMessage.content).catch(err => {
        console.error('Failed to save user message to Firestore:', err);
      });
    }

    try {
      const conversationHistory = (Array.isArray(messages) ? messages : [])
        .filter(msg => msg && msg.id !== 'initial')
        .map(msg => ({
          role: msg.role === 'model' ? 'model' : 'user',
          content: msg?.content || '',
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
      
      setMessages(prev => [...prev, aiMessage]);
      setLoading(false);

      if (projectId) {
        saveChatMessage(projectId, 'model', aiMessage.content).catch(err => {
          console.error('Failed to save AI message to Firestore:', err);
        });
      }
    } catch (err) {
      console.error('Error generating AI response:', err);
      setLoading(false);
      setError(err.message || 'Failed to get AI response. Please try again.');
      
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
    <div className="flex flex-col h-[calc(100vh-250px)] text-slate-100">
      {error && (
        <div className="mb-4 p-4 bg-red-500/10 border border-red-400/30 rounded-xl text-red-200 flex items-center gap-2 animate-slide-in-left">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
      
      {/* Enhanced Chat Container */}
      <div className="flex-1 overflow-y-auto space-y-4 mb-4 p-6 bg-dark-800/70 border border-white/5 rounded-2xl shadow-[0_20px_80px_-55px_rgba(0,230,200,0.4)] backdrop-blur-xl relative group">
        {/* Subtle background gradient effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 to-accent-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
        
        <div className="relative z-10">
          {messages.map((message, index) => (
            <div
              key={message.id}
              className={`flex gap-3 mb-4 animate-fade-in ${
                message.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              {message.role === 'model' && (
                <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-primary-500 to-accent-500 rounded-full flex items-center justify-center shadow-lg shadow-primary-500/30 glow-ring">
                  <Bot className="w-5 h-5 text-white" />
                </div>
              )}
              <div
                className={`max-w-[70%] rounded-2xl p-4 border transition-all duration-300 ${
                  message.role === 'user'
                    ? 'bg-gradient-to-br from-primary-500/90 to-accent-500/70 text-white border-primary-400/30 shadow-lg shadow-primary-500/25 hover:shadow-primary-500/40'
                    : 'bg-white/5 text-slate-100 border-white/10 hover:bg-white/10 hover:border-white/20'
                }`}
              >
                <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
                <p
                  className={`text-xs mt-2 ${
                    message.role === 'user' ? 'text-primary-100' : 'text-slate-400'
                  }`}
                >
                  {message.timestamp instanceof Date
                    ? message.timestamp.toLocaleTimeString()
                    : new Date(message.timestamp).toLocaleTimeString()}
                </p>
              </div>
              {message.role === 'user' && (
                <div className="flex-shrink-0 w-10 h-10 bg-white/10 border border-white/10 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-slate-200" />
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex gap-3 justify-start animate-slide-in-left">
              <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-primary-500 to-accent-500 rounded-full flex items-center justify-center shadow-lg shadow-primary-500/30 glow-ring animate-pulse">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                <Loader className="w-5 h-5 text-primary-500 animate-spin" />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Enhanced Input Form */}
      <form onSubmit={handleSend} className="flex gap-3 relative">
        <div className="flex-1 relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask your AI mentor anything..."
            className="input-field pr-12"
            disabled={loading}
          />
          {input && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-primary-400 animate-pulse" />
          )}
        </div>
        <button
          type="submit"
          disabled={!input.trim() || loading}
          className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden group"
        >
          <Send className={`w-5 h-5 transition-transform ${
            !loading && input.trim() ? 'group-hover:translate-x-1' : ''
          }`} />
          Send
        </button>
      </form>
    </div>
  );
};

export default ChatView;
