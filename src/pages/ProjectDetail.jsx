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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent"></div>
          <p className="mt-4 text-gray-600">Loading project...</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Project not found</p>
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
      
      // Update the project in the projects list (will also be updated by real-time listener)
      setProjects(prevProjects => 
        prevProjects.map(p => p.id === updatedProject.id ? updatedProject : p)
      );
      setShowDetailsPopup(false);
      setActiveTab('chat'); // Switch to AI Mentor tab after saving
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
      
      // Update the project in the projects list (will also be updated by real-time listener)
      setProjects(prevProjects => 
        prevProjects.map(p => p.id === updatedProject.id ? updatedProject : p)
      );
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div className="flex items-center gap-3">
                <img 
                  src="/logo.jpeg" 
                  alt="CereBro AI" 
                  className="w-8 h-8 object-contain rounded-lg"
                />
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
                  <p className="text-sm text-gray-600">
                    {project.description || 'No description yet'}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowSettingsModal(true)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Project Settings"
              >
                <Settings className="w-5 h-5 text-gray-600" />
              </button>
              <span className={`px-4 py-2 rounded-full text-sm font-medium ${
                project.status === 'active'
                  ? 'bg-success-100 text-success-700'
                  : 'bg-gray-100 text-gray-700'
              }`}>
                {project.status}
              </span>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 border-b border-gray-200">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-3 font-semibold transition-colors border-b-2 ${
                  activeTab === tab.id
                    ? 'text-primary-600 border-primary-600'
                    : 'text-gray-600 border-transparent hover:text-gray-900'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {activeTab === 'chat' && project && <ChatView projectId={projectId} project={project} />}
        {activeTab === 'roadmap' && project && <RoadmapView projectId={projectId} project={project} />}
        {activeTab === 'progress' && <ProgressView projectId={projectId} />}
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

