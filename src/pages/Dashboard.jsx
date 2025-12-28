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

  // Classic AI-inspired background pattern (same as auth flow)
  const backgroundStyle = {
    backgroundImage: `
      radial-gradient(circle at 50% 0%, rgba(79,70,229,0.18), transparent 55%),
      radial-gradient(circle at 100% 100%, rgba(124,58,237,0.16), transparent 60%),
      linear-gradient(rgba(79,70,229,0.05) 1px, transparent 1px),
      linear-gradient(90deg, rgba(79,70,229,0.05) 1px, transparent 1px),
      linear-gradient(180deg, #f5f7fb 0%, #eef1f7 100%)
    `,
    backgroundSize: `
      auto,
      auto,
      40px 40px,
      40px 40px,
      100% 100%
    `,
    backgroundPosition: `
      top center,
      bottom right,
      0 0,
      0 0,
      0 0
    `,
    backgroundRepeat: `
      no-repeat,
      no-repeat,
      repeat,
      repeat,
      no-repeat
    `
  };

  return (
    <div className="min-h-screen" style={backgroundStyle}>
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img 
                src="/logo.jpeg" 
                alt="CereBro AI" 
                className="w-8 h-8 object-contain"
              />
              <h1 className="text-2xl text-gray-900">
                <span className="font-bold">CereBro</span>{' '}
                <span className="font-normal">AI</span>
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
                <span className="text-sm text-gray-700 font-medium">{user?.email || user?.displayName}</span>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Projects</p>
                <p className="text-3xl font-bold text-gray-900">{projects.length}</p>
              </div>
              <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
                <FolderKanban className="w-6 h-6 text-primary-600" />
              </div>
            </div>
          </div>
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Active Projects</p>
                <p className="text-3xl font-bold text-gray-900">
                  {projects.filter(p => p.status === 'active').length}
                </p>
              </div>
              <div className="w-12 h-12 bg-success-100 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-success-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Projects Section */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Your Projects</h2>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Create New Project
          </button>
        </div>

        {/* Projects Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent"></div>
            <p className="mt-4 text-gray-600">Loading projects...</p>
          </div>
        ) : projects.length === 0 ? (
          <div className="card text-center py-16">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FolderKanban className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No projects yet</h3>
            <p className="text-gray-600 mb-6">Create your first project to get started with AI-powered guidance</p>
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
            {projects.map((project) => (
              <div
                key={project.id}
                onClick={() => navigate(`/project/${project.id}`)}
                className="card cursor-pointer hover:scale-[1.02] transition-transform"
              >
                <h3 className="text-xl font-bold text-gray-900 mb-2">{project.name}</h3>
                <p className="text-gray-600 mb-3 line-clamp-2">
                  {project.description || 'No description yet'}
                </p>
                {project.domain && (
                  <p className="text-sm text-primary-600 font-medium mb-3">
                    Domain: {project.domain}
                  </p>
                )}
                <div className="flex items-center justify-between">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    project.status === 'active'
                      ? 'bg-success-100 text-success-700'
                      : 'bg-gray-100 text-gray-700'
                  }`}>
                    {project.status}
                  </span>
                  <span className="text-sm text-gray-500">
                    {project.teamSize 
                      ? `${project.teamSize} ${project.teamSize === 1 ? 'member' : 'members'}`
                      : 'Team size not set'
                    }
                  </span>
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

