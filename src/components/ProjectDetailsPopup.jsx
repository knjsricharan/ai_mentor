import { useState } from 'react';
import { X, Loader, Calendar } from 'lucide-react';

const TECH_STACK_OPTIONS = [
  'React', 'Vue.js', 'Angular', 'Node.js', 'Python', 'Java', 'TypeScript',
  'JavaScript', 'Django', 'Flask', 'Express', 'MongoDB', 'PostgreSQL',
  'Firebase', 'AWS', 'Docker', 'Kubernetes', 'GraphQL', 'REST API',
  'Tailwind CSS', 'Next.js', 'React Native', 'Flutter', 'Swift', 'Kotlin'
];

const ProjectDetailsPopup = ({ project, onClose, onSave, onSkip }) => {
  const [formData, setFormData] = useState({
    description: project?.description || '',
    teamSize: project?.teamSize || '',
    targetDate: project?.targetDate || '',
    techStack: project?.techStack || [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (formData.teamSize && (parseInt(formData.teamSize) < 1 || parseInt(formData.teamSize) > 50)) {
      setError('Team size must be between 1 and 50');
      return;
    }

    setLoading(true);
    try {
      const updatedProject = {
        ...project,
        description: formData.description.trim() || null,
        teamSize: formData.teamSize ? parseInt(formData.teamSize) : null,
        targetDate: formData.targetDate || null,
        techStack: formData.techStack,
      };

      await onSave(updatedProject);
    } catch (err) {
      setError('Failed to save project details. Please try again.');
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

  const toggleTechStack = (tech) => {
    setFormData(prev => ({
      ...prev,
      techStack: prev.techStack.includes(tech)
        ? prev.techStack.filter(t => t !== tech)
        : [...prev.techStack, tech],
    }));
  };

  const handleSkip = () => {
    onSkip();
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="glass-panel shadow-[0_25px_90px_-50px_rgba(0,230,200,0.55)] max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-slide-up">
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img 
              src="/logo.jpeg" 
              alt="CereBro AI" 
              className="w-8 h-8 object-contain rounded-lg"
            />
            <div>
              <h2 className="text-2xl font-bold text-white">Complete your project details</h2>
              <p className="text-sm text-slate-300 mt-1">You can edit these anytime later</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/5 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-300" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {error && (
            <div className="mb-4 p-4 bg-red-500/10 border border-red-400/30 rounded-xl text-red-200">
              {error}
            </div>
          )}

          <div className="space-y-6">
            <div>
              <label htmlFor="description" className="block text-sm font-semibold text-slate-200 mb-2">
                Short Project Description
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="input-field min-h-[100px] resize-none"
                placeholder="Describe your project idea, goals, and key features..."
              />
            </div>

            <div>
              <label htmlFor="teamSize" className="block text-sm font-semibold text-slate-200 mb-2">
                Team Size
              </label>
              <input
                type="number"
                id="teamSize"
                name="teamSize"
                value={formData.teamSize}
                onChange={handleChange}
                className="input-field"
                placeholder="Enter number of team members (1-50)"
                min="1"
                max="50"
              />
            </div>

            <div>
              <label htmlFor="targetDate" className="block text-sm font-semibold text-slate-200 mb-2">
                Target Completion Date
              </label>
              <div className="relative">
                <input
                  type="date"
                  id="targetDate"
                  name="targetDate"
                  value={formData.targetDate}
                  onChange={handleChange}
                  className="input-field pl-10"
                  min={new Date().toISOString().split('T')[0]}
                />
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-200 mb-2">
                Tech Stack
              </label>
              <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto p-3 border border-white/10 rounded-xl bg-white/5">
                {TECH_STACK_OPTIONS.map((tech) => (
                  <button
                    key={tech}
                    type="button"
                    onClick={() => toggleTechStack(tech)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      formData.techStack.includes(tech)
                        ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/25'
                        : 'bg-white/10 text-slate-200 hover:bg-white/20'
                    }`}
                  >
                    {tech}
                  </button>
                ))}
              </div>
              {formData.techStack.length > 0 && (
                <p className="mt-2 text-sm text-slate-300">
                  Selected: {formData.techStack.join(', ')}
                </p>
              )}
            </div>
          </div>

          <div className="flex gap-4 mt-8">
            <button
              type="button"
              onClick={handleSkip}
              className="flex-1 btn-secondary"
              disabled={loading}
            >
              Skip for now
            </button>
            <button
              type="submit"
              className="flex-1 btn-primary flex items-center justify-center gap-2"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save & continue'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProjectDetailsPopup;


