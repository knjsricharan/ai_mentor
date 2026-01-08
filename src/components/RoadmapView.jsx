import { useState, useEffect } from 'react';
import { CheckCircle, Circle, Sparkles, Loader, AlertCircle, MessageSquare, BarChart3 } from 'lucide-react';
import { getRoadmap, saveRoadmap, updateTaskStatus } from '../services/roadmapService';
import { generateRoadmap } from '../services/geminiService';
import { loadChatMessages } from '../services/chatService';
import { checkProjectDetails } from '../services/geminiService';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';

const RoadmapView = ({ projectId, project }) => {
  const [roadmap, setRoadmap] = useState(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [hasChatHistory, setHasChatHistory] = useState(false);
  const [checkingConditions, setCheckingConditions] = useState(true);

  useEffect(() => {
    if (!projectId) {
      setCheckingConditions(false);
      return;
    }

    // Set up real-time listener for roadmap updates
    const projectRef = doc(db, 'projects', projectId);
    const unsubscribeRoadmap = onSnapshot(projectRef, (docSnap) => {
      if (docSnap.exists()) {
        const projectData = docSnap.data();
        setRoadmap(projectData.roadmap || null);
      } else {
        setRoadmap(null);
      }
    }, (error) => {
      console.error('Error loading roadmap:', error);
    });

    // Load chat history for roadmap generation check
    let chatCount = 0;
    const unsubscribeChat = loadChatMessages(projectId, (messages) => {
      const validMessages = Array.isArray(messages) ? messages : [];
      chatCount = validMessages.filter(m => m?.role === 'user').length;
      setHasChatHistory(chatCount > 0);
    });

    setCheckingConditions(false);

    // Cleanup both listeners
    return () => {
      unsubscribeRoadmap();
      unsubscribeChat();
    };
  }, [projectId]);

  const canGenerateRoadmap = () => {
    if (!project) return false;
    
    const detailsCheck = checkProjectDetails(project);
    return detailsCheck.hasAllDetails || hasChatHistory;
  };

  const handleGenerateRoadmap = async () => {
    if (!canGenerateRoadmap()) {
      return;
    }

    setGenerating(true);
    try {
      let chatHistory = [];
      const unsubscribe = loadChatMessages(projectId, (messages) => {
        chatHistory = Array.isArray(messages) ? messages : [];
      });
      await new Promise(resolve => setTimeout(resolve, 500));
      unsubscribe();

      const generatedRoadmap = await generateRoadmap(project || {}, chatHistory);
      
      await saveRoadmap(projectId, generatedRoadmap);
      setRoadmap(generatedRoadmap);
    } catch (error) {
      console.error('Error generating roadmap:', error);
      alert(`Failed to generate roadmap: ${error.message || 'Unknown error'}\n\nFor local development, make sure to run "vercel dev" to start the serverless functions.`);
    } finally {
      setGenerating(false);
    }
  };

  const toggleTask = async (phaseId, taskId) => {
    if (!roadmap || !roadmap.phases || !Array.isArray(roadmap.phases) || updating) return;

    const phase = roadmap.phases.find(p => p?.id === phaseId);
    if (!phase || !phase.tasks || !Array.isArray(phase.tasks)) return;
    
    const task = phase.tasks.find(t => t?.id === taskId);
    if (!task) return;

    const newCompletedStatus = !task.completed;
    setUpdating(true);

    try {
      // Update Firestore - the onSnapshot listener will update the UI
      await updateTaskStatus(projectId, phaseId, taskId, newCompletedStatus);
    } catch (error) {
      console.error('Error updating task status:', error);
      // Show error to user
      alert('Failed to update task. Please try again.');
    } finally {
      setUpdating(false);
    }
  };

  const getProgress = () => {
    if (!roadmap || !roadmap.phases || !Array.isArray(roadmap.phases)) return 0;
    const totalTasks = roadmap.phases.reduce((sum, phase) => {
      const tasks = phase?.tasks || [];
      return sum + (Array.isArray(tasks) ? tasks.length : 0);
    }, 0);
    const completedTasks = roadmap.phases.reduce(
      (sum, phase) => {
        const tasks = phase?.tasks || [];
        if (!Array.isArray(tasks)) return sum;
        return sum + tasks.filter(task => task?.completed).length;
      },
      0
    );
    return totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  };

  if (checkingConditions) {
    return (
      <div className="text-center py-12">
        <Loader className="w-12 h-12 text-primary-500 animate-spin mx-auto mb-4" />
        <p className="text-slate-300">Loading...</p>
      </div>
    );
  }

  const canGenerate = canGenerateRoadmap();
  const hasRoadmap = roadmap && roadmap.phases && Array.isArray(roadmap.phases) && roadmap.phases.length > 0;

  return (
    <div className="space-y-8">
      {/* Header Card with Generate Button */}
      <div className="card hover:scale-[1.01] transition-all neural-bg">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-500/20 to-accent-500/20 rounded-xl flex items-center justify-center glow-ring">
                <BarChart3 className="w-5 h-5 text-primary-300" />
              </div>
              <h2 className="text-2xl font-bold text-white">
                {hasRoadmap ? 'Project Roadmap' : 'Generate Your Roadmap'}
              </h2>
            </div>
            {!canGenerate && (
              <div className="flex items-start gap-3 p-4 bg-yellow-500/10 border border-yellow-400/30 rounded-xl mt-4 animate-slide-in-left">
                <AlertCircle className="w-5 h-5 text-yellow-200 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-yellow-100 mb-1">
                    Complete project details or chat with AI Mentor first
                  </p>
                  <p className="text-sm text-yellow-200/80">
                    Please fill the project details or chat with our AI Mentor to generate a roadmap.
                  </p>
                </div>
              </div>
            )}
          </div>
          <button
            onClick={handleGenerateRoadmap}
            disabled={!canGenerate || generating}
            className={`btn-primary flex items-center gap-2 shadow-lg ${
              !canGenerate ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-primary-500/40'
            }`}
          >
            {generating ? (
              <>
                <Loader className="w-5 h-5 animate-spin" />
                Generating...
              </>
            ) : hasRoadmap ? (
              <>
                <Sparkles className="w-5 h-5" />
                Regenerate
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                Generate Roadmap
              </>
            )}
          </button>
        </div>
      </div>

      {!hasRoadmap && canGenerate && (
        <div className="card text-center py-16 neural-bg group">
          <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-primary-500/10 to-accent-500/10 rounded-full flex items-center justify-center border border-white/10 glow-ring group-hover:scale-110 transition-transform">
            <MessageSquare className="w-10 h-10 text-slate-300" />
          </div>
          <h3 className="text-2xl font-semibold text-white mb-3">No Roadmap Yet</h3>
          <p className="text-slate-300 mb-6 max-w-md mx-auto">
            Click the "Generate Roadmap" button above to create your personalized project roadmap using AI.
          </p>
        </div>
      )}

      {hasRoadmap && (
        <>
          {/* Enhanced Progress Card */}
          <div className="card bg-gradient-to-br from-primary-500/10 via-dark-800/60 to-accent-500/10 border border-primary-400/20 hover:border-primary-400/40 transition-all group">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-white mb-1 flex items-center gap-2">
                  Project Progress
                  <CheckCircle className="w-6 h-6 text-primary-300" />
                </h2>
                <p className="text-slate-300">Track your execution journey</p>
              </div>
              <div className="text-right">
                <div className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary-300 to-accent-300">
                  {getProgress()}%
                </div>
                <p className="text-sm text-slate-400 mt-1">Completed</p>
              </div>
            </div>
            <div className="w-full bg-white/10 rounded-full h-6 relative overflow-hidden">
              <div
                className="bg-gradient-to-r from-primary-500 via-primary-400 to-accent-500 h-6 rounded-full transition-all duration-500 flex items-center justify-end pr-3 relative"
                style={{ width: `${getProgress()}%` }}
              >
                <span className="text-white text-xs font-bold">{getProgress()}%</span>
                {/* Animated shimmer effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-gradient" />
              </div>
            </div>
          </div>

          {/* Enhanced Phase Cards */}
          <div className="space-y-6">
            {roadmap.phases.map((phase, phaseIndex) => {
              const tasks = phase?.tasks || [];
              return (
              <div key={phase?.id || phaseIndex} className="card group hover:scale-[1.01] transition-all animate-fade-in" style={{ animationDelay: `${phaseIndex * 0.1}s` }}>
                <div className="flex items-start gap-4 mb-6">
                  <div className="flex-shrink-0 w-14 h-14 bg-gradient-to-br from-primary-500 to-accent-500 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-primary-500/30 glow-ring">
                    {phaseIndex + 1}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-primary-200 transition-colors">
                      {phase?.name || 'Unnamed Phase'}
                    </h3>
                    <p className="text-slate-300 leading-relaxed">{phase?.description || ''}</p>
                  </div>
                </div>

                {/* Enhanced Task List */}
                <div className="space-y-2 ml-18">
                  {Array.isArray(tasks) && tasks.map((task, taskIndex) => (
                <div
                  key={task?.id || `task-${Math.random()}`}
                  className={`flex items-center gap-3 p-4 rounded-xl transition-all cursor-pointer group/task ${
                    task?.completed 
                      ? 'bg-primary-500/5 hover:bg-primary-500/10 border border-primary-500/20'
                      : 'bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20'
                  }`}
                  onClick={() => !updating && phase?.id && task?.id && toggleTask(phase.id, task.id)}
                  style={{ animationDelay: `${taskIndex * 0.05}s` }}
                >
                  <div className="flex-shrink-0">
                    {task?.completed ? (
                      <CheckCircle className="w-6 h-6 text-primary-300 group-hover/task:scale-110 transition-transform" />
                    ) : (
                      <Circle className="w-6 h-6 text-slate-500 group-hover/task:text-slate-400 transition-colors" />
                    )}
                  </div>
                  <span
                    className={`flex-1 text-base ${
                      task?.completed
                        ? 'text-slate-400 line-through'
                        : 'text-white font-medium'
                    }`}
                  >
                    {task?.name || 'Unnamed Task'}
                  </span>
                  {!task?.completed && (
                    <div className="w-6 h-6 rounded-lg bg-primary-500/10 flex items-center justify-center opacity-0 group-hover/task:opacity-100 transition-opacity">
                      <svg className="w-4 h-4 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
            );
            })}
      </div>
        </>
      )}
    </div>
  );
};

export default RoadmapView;
