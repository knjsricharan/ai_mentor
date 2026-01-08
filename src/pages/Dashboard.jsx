import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Plus, LogOut, FolderKanban, TrendingUp } from 'lucide-react';
import CreateProjectModal from '../components/CreateProjectModal';
import { subscribeToUserProjects } from '../services/projectService';

const Dashboard = ({ projects = [], setProjects }) => {
  const { user, userProfile, logout } = useAuth();
  const navigate = useNavigate();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !user.uid) {
      setLoading(false);
      setProjects([]);
      return;
    }

    // Reset loading state when user changes
    setLoading(true);
    
    // Subscribe to real-time updates of user projects
    // This fetches projects from Firestore where userId == user.uid
    const unsubscribe = subscribeToUserProjects(user.uid, (userProjects) => {
      console.log('Projects loaded:', userProjects.length);
      setProjects(userProjects);
      setLoading(false);
    });

    // Cleanup subscription on unmount or when user changes
    return () => unsubscribe();
  }, [user?.uid, setProjects]); // Only depend on user.uid, not the entire user object

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const handleProjectCreated = (newProject) => {
    setProjects([...projects, newProject]);
    setShowCreateModal(false);
    // Redirect immediately to the project detail page
    // Don't use state - ProjectDetail will fetch from Firestore
    navigate(`/project/${newProject.id}`);
  };

  const backgroundStyle = {
    backgroundImage: `
      radial-gradient(circle at 15% 20%, rgba(0,230,200,0.12), transparent 30%),
      radial-gradient(circle at 85% 10%, rgba(105,56,239,0.12), transparent 35%),
      linear-gradient(120deg, rgba(0,230,200,0.05), rgba(105,56,239,0.07)),
      #0b1120
    `,
    backgroundSize: `
      auto,
      auto,
      130% 130%,
      100% 100%
    `,
    backgroundPosition: `
      top left,
      top right,
      0 0,
      0 0
    `,
    backgroundRepeat: `
      no-repeat,
      no-repeat,
      no-repeat,
      no-repeat
    `
  };

  return (
    <div className="min-h-screen relative overflow-hidden" style={backgroundStyle}>
      {/* Neural Network Background Effect */}
      <div className="absolute inset-0 opacity-30 pointer-events-none">
        <div className="absolute w-96 h-96 bg-primary-500/10 rounded-full blur-3xl top-20 left-10 animate-pulse-slow" />
        <div className="absolute w-96 h-96 bg-accent-500/10 rounded-full blur-3xl bottom-20 right-10 animate-pulse-slow" style={{ animationDelay: '1s' }} />
      </div>

      {/* Header */}
      <header className="bg-dark-900/70 backdrop-blur-xl border-b border-white/5 shadow-[0_15px_60px_-45px_rgba(0,230,200,0.45)] sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img 
                src="/logo.jpeg" 
                alt="CereBro AI" 
                className="w-8 h-8 object-contain"
              />
              <h1 className="text-2xl text-slate-100">
                <span className="font-bold">CereBro</span>{' '}
                <span className="font-normal text-primary-200">AI</span>
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <img
                  src={userProfile?.photoURL || user?.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.email || user?.displayName || 'User')}&background=0ea5e9&color=fff`}
                  alt={user?.email || user?.displayName}
                  className="w-8 h-8 rounded-full border-2 border-primary-200 object-cover"
                  onError={(e) => {
                    // Fallback to generated avatar if image fails to load
                    const name = user?.email || user?.displayName || 'User';
                    e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0ea5e9&color=fff`;
                  }}
                />
                <span className="text-sm text-slate-200 font-medium">{user?.email || user?.displayName}</span>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 text-slate-300 hover:text-primary-200 hover:bg-white/5 rounded-lg transition-colors"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-6 py-12 relative z-10">
        <div className="text-center mb-12 animate-fade-in">
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-primary-500/10 border border-primary-500/30 text-primary-400 text-sm font-medium mb-6">
            <TrendingUp className="w-4 h-4 mr-2" />
            Your AI-Powered Execution Platform
          </div>
          <h2 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
            <span className="gradient-text">Execute Smarter,</span>
            <br />
            <span className="text-white">Build Faster</span>
          </h2>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Manage your projects with AI-powered guidance. From idea to execution.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 pb-8 text-slate-100 relative z-10">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="card group hover:scale-[1.02] transition-all duration-300 animate-slide-in-left">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-300 mb-1">Total Projects</p>
                <p className="text-4xl font-bold text-white">{projects.length}</p>
                <p className="text-xs text-primary-300 mt-2">All time</p>
              </div>
              <div className="w-16 h-16 bg-gradient-to-br from-primary-500/20 to-primary-600/10 rounded-2xl flex items-center justify-center glow-ring group-hover:glow-teal-strong transition-all">
                <FolderKanban className="w-8 h-8 text-primary-300" />
              </div>
            </div>
          </div>
          <div className="card group hover:scale-[1.02] transition-all duration-300 animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-300 mb-1">Active Projects</p>
                <p className="text-4xl font-bold text-white">
                  {projects.filter(p => p.status === 'active').length}
                </p>
                <p className="text-xs text-accent-300 mt-2">In progress</p>
              </div>
              <div className="w-16 h-16 bg-gradient-to-br from-accent-500/15 to-accent-600/10 rounded-2xl flex items-center justify-center group-hover:glow-purple transition-all">
                <TrendingUp className="w-8 h-8 text-accent-300" />
              </div>
            </div>
          </div>
          <div className="card group hover:scale-[1.02] transition-all duration-300 animate-slide-in-right" style={{ animationDelay: '0.2s' }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-300 mb-1">Completed</p>
                <p className="text-4xl font-bold text-white">
                  {projects.filter(p => p.status === 'completed').length}
                </p>
                <p className="text-xs text-success-300 mt-2">Finished</p>
              </div>
              <div className="w-16 h-16 bg-gradient-to-br from-success-500/15 to-success-600/10 rounded-2xl flex items-center justify-center">
                <div className="w-8 h-8 rounded-full bg-success-400/20 flex items-center justify-center">
                  <div className="w-4 h-4 rounded-full bg-success-400" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Projects Section */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-white mb-2">Your Projects</h2>
            <p className="text-slate-400">Create, manage, and execute with AI guidance</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary flex items-center gap-2 shadow-lg hover:shadow-primary-500/30"
          >
            <Plus className="w-5 h-5" />
            Create New Project
          </button>
        </div>

        {/* Projects Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-primary-500 border-t-transparent"></div>
            <p className="mt-4 text-slate-300 text-lg">Loading your projects...</p>
          </div>
        ) : projects.length === 0 ? (
          <div className="card text-center py-20 neural-bg">
            <div className="w-24 h-24 bg-gradient-to-br from-primary-500/10 to-accent-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-white/10 glow-ring">
              <FolderKanban className="w-12 h-12 text-slate-300" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-3">No projects yet</h3>
            <p className="text-slate-400 mb-8 text-lg max-w-md mx-auto">
              Create your first project to get started with AI-powered execution guidance
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn-primary inline-flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Create Your First Project
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project, index) => (
              <div
                key={project.id}
                onClick={() => navigate(`/project/${project.id}`)}
                className="card cursor-pointer group relative overflow-hidden"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {/* Hover gradient effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary-500/0 to-accent-500/0 group-hover:from-primary-500/5 group-hover:to-accent-500/5 transition-all duration-300 pointer-events-none" />
                
                <div className="relative z-10">
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-primary-500/20 to-accent-500/20 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                      <FolderKanban className="w-6 h-6 text-primary-300" />
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      project.status === 'active'
                        ? 'bg-primary-500/20 text-primary-100 border border-primary-500/40'
                        : 'bg-white/5 text-slate-200 border border-white/10'
                    }`}>
                      {project.status}
                    </span>
                  </div>
                  
                  <h3 className="text-xl font-bold text-white mb-2 group-hover:text-primary-200 transition-colors">
                    {project.name}
                  </h3>
                  <p className="text-slate-300 mb-4 line-clamp-2 text-sm">
                    {project.description || 'No description yet'}
                  </p>
                  
                  {project.domain && (
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-2 h-2 rounded-full bg-primary-400" />
                      <p className="text-sm text-primary-200 font-medium">
                        {project.domain}
                      </p>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between pt-3 border-t border-white/5">
                    <span className="text-sm text-slate-400">
                      {project.teamSize 
                        ? `${project.teamSize} ${project.teamSize === 1 ? 'member' : 'members'}`
                        : 'Team size not set'
                      }
                    </span>
                    <div className="w-8 h-8 rounded-lg bg-primary-500/10 flex items-center justify-center group-hover:bg-primary-500/20 transition-colors">
                      <svg className="w-4 h-4 text-primary-400 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Create Project Modal */}
      {showCreateModal && (
        <CreateProjectModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleProjectCreated}
        />
      )}
    </div>
  );
};

export default Dashboard;

