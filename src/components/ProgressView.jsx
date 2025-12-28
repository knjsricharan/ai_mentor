import { useState, useEffect } from 'react';
import { CheckCircle, Clock, AlertCircle, TrendingUp, Calendar, Loader } from 'lucide-react';
import { getRoadmap } from '../services/roadmapService';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';

const ProgressView = ({ projectId }) => {
  const [roadmap, setRoadmap] = useState(null);
  const [loading, setLoading] = useState(true);

  // Subscribe to roadmap changes in real-time
  useEffect(() => {
    if (!projectId) {
      setLoading(false);
      return;
    }

    const projectRef = doc(db, 'projects', projectId);
    const unsubscribe = onSnapshot(projectRef, (docSnap) => {
      if (docSnap.exists()) {
        const projectData = docSnap.data();
        setRoadmap(projectData.roadmap || null);
      } else {
        setRoadmap(null);
      }
      setLoading(false);
    }, (error) => {
      console.error('Error loading roadmap:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [projectId]);

  // Calculate progress from roadmap tasks
  const calculateProgress = () => {
    if (!roadmap || !roadmap.phases) {
      return {
        overall: 0,
        phases: [],
        recentUpdates: [],
        milestones: [],
      };
    }

    // Calculate overall progress
    const allTasks = roadmap.phases.flatMap(phase => phase.tasks);
    const totalTasks = allTasks.length;
    const completedTasks = allTasks.filter(task => task.completed).length;
    const overall = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // Calculate phase progress
    const phases = roadmap.phases.map(phase => {
      const phaseTasks = phase.tasks;
      const phaseTotal = phaseTasks.length;
      const phaseCompleted = phaseTasks.filter(task => task.completed).length;
      const progress = phaseTotal > 0 ? Math.round((phaseCompleted / phaseTotal) * 100) : 0;
      
      let status = 'pending';
      if (progress === 100) {
        status = 'completed';
      } else if (progress > 0) {
        status = 'in-progress';
      }

      return {
        name: phase.name,
        progress,
        status,
      };
    });

    // Get recent updates (completed tasks, sorted by completion time)
    const recentUpdates = roadmap.phases
      .flatMap(phase => 
        phase.tasks
          .filter(task => task.completed)
          .map(task => ({
            id: `${phase.id}-${task.id}`,
            task: task.name,
            phase: phase.name,
            status: 'completed',
            timestamp: new Date(), // In real implementation, track completion timestamp
            member: 'You',
          }))
      )
      .slice(-5) // Last 5 completed tasks
      .reverse();

    // Generate milestones from phases
    const milestones = roadmap.phases.map((phase, index) => ({
      name: `${phase.name} Complete`,
      date: null, // Could be calculated from targetDate
      completed: phases[index].status === 'completed',
    }));

    return {
      overall,
      phases,
      recentUpdates,
      milestones,
    };
  };

  const progress = calculateProgress();

  if (loading) {
    return (
      <div className="text-center py-12">
        <Loader className="w-12 h-12 text-primary-500 animate-spin mx-auto mb-4" />
        <p className="text-gray-600">Loading progress...</p>
      </div>
    );
  }

  if (!roadmap || !roadmap.phases || roadmap.phases.length === 0) {
    return (
      <div className="card text-center py-12">
        <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">No Roadmap Yet</h3>
        <p className="text-gray-600">
          Generate a roadmap first to track your project progress.
        </p>
      </div>
    );
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-success-500" />;
      case 'in-progress':
        return <Clock className="w-5 h-5 text-primary-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Overall Progress Card */}
      <div className="card bg-gradient-to-br from-primary-50 to-accent-50">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-1">Overall Progress</h2>
            <p className="text-gray-600">Track your project completion</p>
          </div>
          <div className="text-right">
            <div className="text-4xl font-bold text-primary-600">{progress.overall}%</div>
            <div className="flex items-center gap-1 text-success-600 text-sm">
              <TrendingUp className="w-4 h-4" />
              On Track
            </div>
          </div>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-6">
          <div
            className="bg-gradient-to-r from-primary-500 to-accent-500 h-6 rounded-full transition-all duration-500 flex items-center justify-end pr-2"
            style={{ width: `${progress.overall}%` }}
          >
            <span className="text-white text-xs font-semibold">{progress.overall}%</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Phase Progress */}
        <div className="card">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Phase Progress</h3>
          <div className="space-y-4">
            {progress.phases.map((phase, index) => (
              <div key={index}>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-gray-900">{phase.name}</span>
                  <span className="text-sm text-gray-600">{phase.progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-500 ${
                      phase.status === 'completed'
                        ? 'bg-success-500'
                        : phase.status === 'in-progress'
                        ? 'bg-primary-500'
                        : 'bg-gray-300'
                    }`}
                    style={{ width: `${phase.progress}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Updates */}
        <div className="card">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Recent Updates</h3>
          <div className="space-y-3">
            {progress.recentUpdates.map((update) => (
              <div
                key={update.id}
                className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl"
              >
                {getStatusIcon(update.status)}
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{update.task}</p>
                  <p className="text-sm text-gray-600">
                    {update.member} • {update.timestamp.toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Milestones */}
      <div className="card">
        <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-primary-600" />
          Project Milestones
        </h3>
        <div className="space-y-4">
          {progress.milestones.map((milestone, index) => (
            <div key={index} className="flex items-center gap-4">
              <div
                className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                  milestone.completed
                    ? 'bg-success-500 text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}
              >
                {milestone.completed ? (
                  <CheckCircle className="w-6 h-6" />
                ) : (
                  <span className="font-bold">{index + 1}</span>
                )}
              </div>
              <div className="flex-1">
                <p
                  className={`font-semibold ${
                    milestone.completed ? 'text-gray-500 line-through' : 'text-gray-900'
                  }`}
                >
                  {milestone.name}
                </p>
                <p className="text-sm text-gray-600">
                  Target: {new Date(milestone.date).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProgressView;

