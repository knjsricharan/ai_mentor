import { useState, useEffect } from 'react';
import { CheckCircle, Circle, Sparkles, Loader, AlertCircle, MessageSquare, Info } from 'lucide-react';
import { getRoadmap, saveRoadmap, updateTaskStatus } from '../services/roadmapService';
import { generateRoadmap } from '../services/geminiService';
import { loadChatMessages } from '../services/chatService';
import { checkProjectDetails } from '../services/geminiService';
import { isLocalDev } from '../utils/devMode';

const RoadmapView = ({ projectId, project }) => {
  const [roadmap, setRoadmap] = useState(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [hasChatHistory, setHasChatHistory] = useState(false);
  const [checkingConditions, setCheckingConditions] = useState(true);

  // Load roadmap from Firestore (no auto-generation)
  useEffect(() => {
    if (!projectId) {
      setCheckingConditions(false);
      return;
    }

    const loadData = async () => {
      try {
        // Check if roadmap exists
        const existingRoadmap = await getRoadmap(projectId);
        if (existingRoadmap) {
          setRoadmap(existingRoadmap);
        }

        // Check if user has chat history
        let chatCount = 0;
        const unsubscribe = loadChatMessages(projectId, (messages) => {
          chatCount = messages.filter(m => m.role === 'user').length;
          setHasChatHistory(chatCount > 0);
        });

        setCheckingConditions(false);
        return () => unsubscribe();
      } catch (error) {
        console.error('Error loading roadmap data:', error);
        setCheckingConditions(false);
      }
    };

    loadData();
  }, [projectId]);

  // Check if user can generate roadmap
  const canGenerateRoadmap = () => {
    if (!project) return false;
    
    const detailsCheck = checkProjectDetails(project);
    // Can generate if: (all details filled OR has chat history)
    return detailsCheck.hasAllDetails || hasChatHistory;
  };

  // Generate roadmap using Gemini API (with fallback for local dev)
  const handleGenerateRoadmap = async () => {
    if (!canGenerateRoadmap()) {
      return; // Should not happen if button is disabled, but safety check
    }

    setGenerating(true);
    try {
      // Get chat history for context
      let chatHistory = [];
      const unsubscribe = loadChatMessages(projectId, (messages) => {
        chatHistory = messages;
      });
      // Wait a bit for messages to load
      await new Promise(resolve => setTimeout(resolve, 500));
      unsubscribe();

      // Generate roadmap using Gemini (will use fallback if API unavailable)
      // This will never throw - it always returns a roadmap (fallback if needed)
      const generatedRoadmap = await generateRoadmap(project || {}, chatHistory);
      
      // Save to Firestore
      await saveRoadmap(projectId, generatedRoadmap);
      setRoadmap(generatedRoadmap);
    } catch (error) {
      // This should rarely happen now since generateRoadmap handles errors internally
      // But keep as safety net
      console.error('Unexpected error generating roadmap:', error);
      // Don't show alert - just log the error and let user continue
    } finally {
      setGenerating(false);
    }
  };

  // Toggle task completion and auto-save
  const toggleTask = async (phaseId, taskId) => {
    if (!roadmap || updating) return;

    // Find current task status
    const phase = roadmap.phases.find(p => p.id === phaseId);
    if (!phase) return;
    
    const task = phase.tasks.find(t => t.id === taskId);
    if (!task) return;

    const newCompletedStatus = !task.completed;
    setUpdating(true);

    try {
      // Optimistically update UI
      setRoadmap(prev => ({
        ...prev,
        phases: prev.phases.map(phase =>
          phase.id === phaseId
            ? {
                ...phase,
                tasks: phase.tasks.map(task =>
                  task.id === taskId
                    ? { ...task, completed: newCompletedStatus }
                    : task
                ),
              }
            : phase
        ),
      }));

      // Save to Firestore immediately
      await updateTaskStatus(projectId, phaseId, taskId, newCompletedStatus);
    } catch (error) {
      console.error('Error updating task status:', error);
      // Revert on error
      setRoadmap(prev => ({
        ...prev,
        phases: prev.phases.map(phase =>
          phase.id === phaseId
            ? {
                ...phase,
                tasks: phase.tasks.map(task =>
                  task.id === taskId
                    ? { ...task, completed: !newCompletedStatus }
                    : task
                ),
              }
            : phase
        ),
      }));
    } finally {
      setUpdating(false);
    }
  };

  const getProgress = () => {
    if (!roadmap) return 0;
    const totalTasks = roadmap.phases.reduce((sum, phase) => sum + phase.tasks.length, 0);
    const completedTasks = roadmap.phases.reduce(
      (sum, phase) => sum + phase.tasks.filter(task => task.completed).length,
      0
    );
    return totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  };

  if (checkingConditions) {
    return (
      <div className="text-center py-12">
        <Loader className="w-12 h-12 text-primary-500 animate-spin mx-auto mb-4" />
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  const canGenerate = canGenerateRoadmap();
  const hasRoadmap = roadmap && roadmap.phases && roadmap.phases.length > 0;
  const isLocal = isLocalDev();

  return (
    <div className="space-y-8">
      {/* Local Dev Mode Notice */}
      {isLocal && (
        <div className="card bg-blue-50 border-2 border-blue-200">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-blue-900 mb-1">
                Local Development Mode
              </p>
              <p className="text-sm text-blue-700">
                You're running in local development. Roadmap generation will use a sample template. 
                Full AI-powered roadmap generation will be available after deployment to Vercel.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Generate/Regenerate Button */}
      <div className="card">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              {hasRoadmap ? 'Project Roadmap' : 'Generate Your Roadmap'}
            </h2>
            {!canGenerate && (
              <div className="flex items-start gap-3 p-4 bg-yellow-50 border-2 border-yellow-200 rounded-xl mt-4">
                <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-yellow-900 mb-1">
                    Complete project details or chat with AI Mentor first
                  </p>
                  <p className="text-sm text-yellow-700">
                    Please fill the project details or chat with our AI Mentor to generate a roadmap.
                  </p>
                </div>
              </div>
            )}
          </div>
          <button
            onClick={handleGenerateRoadmap}
            disabled={!canGenerate || generating}
            className={`btn-primary flex items-center gap-2 ${
              !canGenerate ? 'opacity-50 cursor-not-allowed' : ''
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
        <div className="card text-center py-12">
          <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Roadmap Yet</h3>
          <p className="text-gray-600 mb-6">
            Click the "Generate Roadmap" button above to create your personalized project roadmap using AI.
          </p>
        </div>
      )}

      {hasRoadmap && (
        <>
          {/* Progress Overview */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Project Progress</h2>
              <span className="text-2xl font-bold text-primary-600">{getProgress()}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4">
              <div
                className="bg-gradient-to-r from-primary-500 to-accent-500 h-4 rounded-full transition-all duration-500"
                style={{ width: `${getProgress()}%` }}
              />
            </div>
          </div>

          {/* Roadmap Phases */}
          <div className="space-y-6">
            {roadmap.phases.map((phase, phaseIndex) => (
          <div key={phase.id} className="card">
            <div className="flex items-start gap-4 mb-4">
              <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-primary-500 to-accent-500 rounded-xl flex items-center justify-center text-white font-bold text-lg">
                {phaseIndex + 1}
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-900 mb-1">{phase.name}</h3>
                <p className="text-gray-600">{phase.description}</p>
              </div>
            </div>

            <div className="space-y-3 ml-16">
              {phase.tasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => !updating && toggleTask(phase.id, task.id)}
                >
                  {task.completed ? (
                    <CheckCircle className="w-5 h-5 text-success-500 flex-shrink-0" />
                  ) : (
                    <Circle className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  )}
                  <span
                    className={`flex-1 ${
                      task.completed
                        ? 'text-gray-500 line-through'
                        : 'text-gray-900'
                    }`}
                  >
                    {task.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
        </>
      )}
    </div>
  );
};

export default RoadmapView;

