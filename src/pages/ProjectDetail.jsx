import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, MessageSquare, BarChart3, Sparkles, Settings } from 'lucide-react';
import RoadmapView from '../components/RoadmapView';
import ChatView from '../components/ChatView';
import ProgressView from '../components/ProgressView';
import ProjectDetailsPopup from '../components/ProjectDetailsPopup';
import ProjectSettingsModal from '../components/ProjectSettingsModal';
import { getProject, updateProject } from '../services/projectService';

const ProjectDetail = ({ projects = [], setProjects }) => {
  const { id: projectId } = useParams();
  const navigate = useNavigate();
  // Set initial tab to 'chat' (AI Mentor) by default
  const [activeTab, setActiveTab] = useState('chat');
  const [showDetailsPopup, setShowDetailsPopup] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const popupShownRef = useRef(false);
  
  // Fetch project from Firestore using projectId from URL params
  useEffect(() => {
    if (!projectId) {
      setLoading(false);
      return;
    }

    const loadProject = async () => {
      try {
        setLoading(true);
        // First try to get from props (if available from Dashboard)
        const projectFromProps = projects.find(p => p.id === projectId);
        
        if (projectFromProps) {
          setProject(projectFromProps);
          setLoading(false);
        } else {
          // If not in props, fetch directly from Firestore
          const fetchedProject = await getProject(projectId);
          if (fetchedProject) {
            setProject(fetchedProject);
          }
          setLoading(false);
        }
      } catch (error) {
        console.error('Error loading project:', error);
        setLoading(false);
      }
    };

    loadProject();
  }, [projectId, projects]);

  // Reset popup shown flag when project ID changes
  useEffect(() => {
    popupShownRef.current = false;
  }, [projectId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center">
        <div className="text-center text-slate-200">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent"></div>
          <p className="mt-4 text-slate-300">Loading project...</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center">
        <div className="text-center text-slate-200">
          <p className="text-slate-300 mb-4">Project not found</p>
          <button onClick={() => navigate('/dashboard')} className="btn-primary">
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const handleSaveDetails = async (updatedProject) => {
    try {
      // Update project in Firestore
      const { id, ...updates } = updatedProject;
      await updateProject(id, updates);
      
      setProjects(prevProjects => {
        if (!Array.isArray(prevProjects)) return [updatedProject];
        return prevProjects.map(p => p?.id === updatedProject?.id ? updatedProject : p);
      });
      setShowDetailsPopup(false);
      setActiveTab('chat');
      popupShownRef.current = true; // Mark as shown so it doesn't appear again
    } catch (error) {
      console.error('Error saving project details:', error);
      throw error; // Let the component handle the error
    }
  };

  const handleSkipDetails = () => {
    setShowDetailsPopup(false);
    setActiveTab('chat'); // Switch to AI Mentor tab after skipping
    popupShownRef.current = true; // Mark as shown so it doesn't appear again
  };

  const handleSaveSettings = async (updatedProject) => {
    try {
      // Update project in Firestore
      const { id, ...updates } = updatedProject;
      await updateProject(id, updates);
      
      setProjects(prevProjects => {
        if (!Array.isArray(prevProjects)) return [updatedProject];
        return prevProjects.map(p => p?.id === updatedProject?.id ? updatedProject : p);
      });
    } catch (error) {
      console.error('Error saving project settings:', error);
      throw error; // Let the component handle the error
    }
  };

  const tabs = [
    { id: 'chat', label: 'AI Mentor', icon: <MessageSquare className="w-5 h-5" /> },
    { id: 'roadmap', label: 'Roadmap', icon: <BarChart3 className="w-5 h-5" /> },
    { id: 'progress', label: 'Progress', icon: <CheckCircle className="w-5 h-5" /> },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-dark-900 via-[#0b1729] to-[#0a0f1a] text-slate-100 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div className="absolute w-96 h-96 bg-primary-500/20 rounded-full blur-3xl top-40 -left-20 animate-pulse-slow" />
        <div className="absolute w-96 h-96 bg-accent-500/20 rounded-full blur-3xl bottom-40 -right-20 animate-pulse-slow" style={{ animationDelay: '1.5s' }} />
      </div>

      {/* Header */}
      <header className="bg-dark-900/70 backdrop-blur-xl border-b border-white/5 shadow-[0_15px_60px_-45px_rgba(0,230,200,0.45)] sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 relative">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="p-2 hover:bg-white/5 rounded-lg transition-all hover:scale-110 hover:glow-ring"
              >
                <ArrowLeft className="w-5 h-5 text-slate-300" />
              </button>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-primary-500/20 to-accent-500/20 rounded-xl flex items-center justify-center glow-ring">
                  <img 
                    src="/logo.jpeg" 
                    alt="CereBro AI" 
                    className="w-8 h-8 object-contain rounded-lg"
                  />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">{project.name}</h1>
                  <p className="text-sm text-slate-300">
                    {project.description || 'No description yet'}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowSettingsModal(true)}
                className="p-2 hover:bg-white/5 rounded-lg transition-all group"
                title="Project Settings"
              >
                <Settings className="w-5 h-5 text-slate-300 group-hover:text-primary-300 group-hover:rotate-90 transition-all" />
              </button>
              <span className={`px-4 py-2 rounded-full text-sm font-medium ${
                project.status === 'active'
                  ? 'bg-gradient-to-r from-primary-500/20 to-accent-500/20 text-primary-100 border border-primary-400/30 glow-ring'
                  : 'bg-white/5 text-slate-200 border border-white/10'
              }`}>
                {project.status}
              </span>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 border-b border-white/5">
            {tabs.map((tab, index) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-3 font-semibold transition-all border-b-2 relative group ${
                  activeTab === tab.id
                    ? 'text-primary-200 border-primary-400'
                    : 'text-slate-400 border-transparent hover:text-white'
                }`}
              >
                <div className={`transition-all ${
                  activeTab === tab.id ? 'scale-110' : 'group-hover:scale-110'
                }`}>
                  {tab.icon}
                </div>
                {tab.label}
                {activeTab === tab.id && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary-500 to-accent-500 glow-teal" />
                )}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-6 py-8 relative z-10">
        <div className="animate-fade-in">
          {activeTab === 'chat' && project && <ChatView projectId={projectId} project={project} />}
          {activeTab === 'roadmap' && project && <RoadmapView projectId={projectId} project={project} />}
          {activeTab === 'progress' && <ProgressView projectId={projectId} />}
        </div>
      </main>

      {/* Project Details Popup */}
      {showDetailsPopup && project && (
        <ProjectDetailsPopup
          project={project}
          onClose={() => setShowDetailsPopup(false)}
          onSave={handleSaveDetails}
          onSkip={handleSkipDetails}
        />
      )}

      {/* Project Settings Modal */}
      {showSettingsModal && project && (
        <ProjectSettingsModal
          project={project}
          onClose={() => setShowSettingsModal(false)}
          onSave={handleSaveSettings}
        />
      )}
    </div>
  );
};

export default ProjectDetail;

