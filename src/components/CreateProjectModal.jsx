import { useState } from 'react';
import { X, Loader, Plus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { createProject } from '../services/projectService';

const CreateProjectModal = ({ onClose, onSuccess }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    domain: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!formData.name.trim()) {
      setError('Project name is required');
      return;
    }

    if (!user) {
      setError('You must be logged in to create a project');
      return;
    }

    setLoading(true);
    try {
      // Create project in Firestore
      const newProject = await createProject(user.uid, {
        name: formData.name.trim(),
        domain: formData.domain.trim() || null,
        description: null,
        teamSize: null,
        targetDate: null,
        techStack: [],
        status: 'active',
      });

      onSuccess(newProject);
    } catch (err) {
      setError('Failed to create project. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="glass-panel shadow-[0_25px_90px_-50px_rgba(0,230,200,0.55)] max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-slide-up relative">
        {/* Background gradient effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 to-accent-500/5 rounded-2xl pointer-events-none" />
        
        <div className="p-6 border-b border-white/5 flex items-center justify-between relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-primary-500/20 to-accent-500/20 rounded-xl flex items-center justify-center glow-ring">
              <img 
                src="/logo.jpeg" 
                alt="CereBro AI" 
                className="w-8 h-8 object-contain rounded-lg"
              />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Create New Project</h2>
              <p className="text-sm text-slate-400">Start your execution journey</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/5 rounded-lg transition-all hover:scale-110 group"
          >
            <X className="w-5 h-5 text-slate-300 group-hover:text-red-400 group-hover:rotate-90 transition-all" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 relative z-10">
          {error && (
            <div className="mb-4 p-4 bg-red-500/10 border border-red-400/30 rounded-xl text-red-200 animate-slide-in-left">
              {error}
            </div>
          )}

          <div className="space-y-6">
            <div className="group">
              <label htmlFor="name" className="block text-sm font-semibold text-slate-200 mb-2 flex items-center gap-2">
                Project Name *
                <span className="text-primary-400">•</span>
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="input-field group-hover:border-primary-400/50 transition-colors"
                placeholder="e.g., E-commerce Platform"
                required
              />
            </div>

            <div className="group">
              <label htmlFor="domain" className="block text-sm font-semibold text-slate-200 mb-2">
                Project Domain
                <span className="text-slate-400 font-normal ml-1">(optional)</span>
              </label>
              <input
                type="text"
                id="domain"
                name="domain"
                value={formData.domain}
                onChange={handleChange}
                className="input-field group-hover:border-accent-400/50 transition-colors"
                placeholder="e.g., E-commerce, Healthcare, Education"
              />
            </div>
          </div>

          <div className="flex gap-4 mt-8 pt-6 border-t border-white/5">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 btn-secondary hover:scale-[1.02] transition-all"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 btn-primary flex items-center justify-center gap-2 shadow-lg hover:shadow-primary-500/40"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="w-5 h-5" />
                  Create Project
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateProjectModal;

