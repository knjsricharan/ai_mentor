import { useState, useEffect } from 'react';
import { CheckCircle, Clock, AlertCircle, TrendingUp, Calendar, Loader } from 'lucide-react';
import { getRoadmap } from '../services/roadmapService';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';

const ProgressView = ({ projectId }) => {
  const [roadmap, setRoadmap] = useState(null);
  const [loading, setLoading] = useState(true);

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

  const calculateProgress = () => {
    if (!roadmap || !roadmap.phases || !Array.isArray(roadmap.phases)) {
      return {
        overall: 0,
        phases: [],
        recentUpdates: [],
        milestones: [],
      };
    }

    // Count all tasks including sub-tasks
    let totalTasks = 0;
    let completedTasks = 0;
    
    roadmap.phases.forEach(phase => {
      const tasks = phase?.tasks || [];
      if (!Array.isArray(tasks)) return;
      
      tasks.forEach(task => {
        if (task == null) return;
        // Count main task
        totalTasks++;
        if (task?.completed) completedTasks++;
        
        // Count sub-tasks if they exist
        if (task.subTasks && Array.isArray(task.subTasks)) {
          task.subTasks.forEach(subTask => {
            if (subTask != null) {
              totalTasks++;
              if (subTask?.completed) completedTasks++;
            }
          });
        }
      });
    });
    
    const overall = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    const phases = roadmap.phases
      .filter(phase => phase != null)
      .map(phase => {
        const phaseTasks = phase?.tasks || [];
        let phaseTotal = 0;
        let phaseCompleted = 0;
        
        if (Array.isArray(phaseTasks)) {
          phaseTasks.forEach(task => {
            if (task == null) return;
            // Count main task
            phaseTotal++;
            if (task?.completed) phaseCompleted++;
            
            // Count sub-tasks if they exist
            if (task.subTasks && Array.isArray(task.subTasks)) {
              task.subTasks.forEach(subTask => {
                if (subTask != null) {
                  phaseTotal++;
                  if (subTask?.completed) phaseCompleted++;
                }
              });
            }
          });
        }
        
        const progress = phaseTotal > 0 ? Math.round((phaseCompleted / phaseTotal) * 100) : 0;
      
      let status = 'pending';
      if (progress === 100) {
        status = 'completed';
      } else if (progress > 0) {
        status = 'in-progress';
      }

      return {
        name: phase?.name || 'Unnamed Phase',
        progress,
        status,
      };
    });

    const convertTimestamp = (timestamp) => {
      if (!timestamp) return null;
      if (timestamp.toDate && typeof timestamp.toDate === 'function') {
        return timestamp.toDate();
      }
      if (timestamp instanceof Date) {
        return timestamp;
      }
      if (typeof timestamp === 'number') {
        return new Date(timestamp);
      }
      if (timestamp.seconds) {
        return new Date(timestamp.seconds * 1000);
      }
      return null;
    };

    // Format timestamp to IST with date and time
    const formatToIST = (date) => {
      if (!date) return 'Not completed yet';
      try {
        return date.toLocaleString('en-IN', {
          timeZone: 'Asia/Kolkata',
          day: 'numeric',
          month: 'short',
          year: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        });
      } catch (error) {
        console.error('Error formatting timestamp:', error);
        return 'Not completed yet';
      }
    };

    const recentUpdates = roadmap.phases
      .filter(phase => phase != null && Array.isArray(phase.tasks))
      .flatMap(phase => 
        phase.tasks.flatMap(task => {
          if (task == null) return [];
          
          const updates = [];
          
          // Add main task if completed
          if (task.completed) {
            const completedAt = task.completedAt ? convertTimestamp(task.completedAt) : null;
            updates.push({
              id: `${phase?.id || 'phase'}-${task?.id || 'task'}`,
              task: task?.name || 'Unnamed Task',
              phase: phase?.name || 'Unnamed Phase',
              status: 'completed',
              timestamp: completedAt,
              timestampIST: formatToIST(completedAt),
              member: 'You',
            });
          }
          
          // Add sub-tasks if completed
          if (task.subTasks && Array.isArray(task.subTasks)) {
            task.subTasks.forEach(subTask => {
              if (subTask != null && subTask.completed) {
                const completedAt = subTask.completedAt ? convertTimestamp(subTask.completedAt) : null;
                updates.push({
                  id: `${phase?.id || 'phase'}-${subTask?.id || 'subtask'}`,
                  task: `${task?.name || 'Task'} → ${subTask?.name || 'Sub-Task'}`,
                  phase: phase?.name || 'Unnamed Phase',
                  status: 'completed',
                  timestamp: completedAt,
                  timestampIST: formatToIST(completedAt),
                  member: 'You',
                });
              }
            });
          }
          
          return updates;
        })
      )
      .sort((a, b) => {
        if (!a.timestamp && !b.timestamp) return 0;
        if (!a.timestamp) return 1;
        if (!b.timestamp) return -1;
        return b.timestamp.getTime() - a.timestamp.getTime();
      })
      .slice(0, 5);

    const milestones = roadmap.phases
      .filter(phase => phase != null)
      .map((phase, index) => ({
        name: `${phase?.name || 'Phase'} Complete`,
        date: null,
        completed: phases[index]?.status === 'completed',
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
        <p className="text-slate-300">Loading progress...</p>
      </div>
    );
  }

  if (!roadmap || !roadmap.phases || !Array.isArray(roadmap.phases) || roadmap.phases.length === 0) {
    return (
      <div className="card text-center py-12">
        <AlertCircle className="w-16 h-16 text-slate-300 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-white mb-2">No Roadmap Yet</h3>
        <p className="text-slate-300">
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
        return <AlertCircle className="w-5 h-5 text-slate-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Enhanced Overall Progress Card */}
      <div className="card bg-gradient-to-br from-primary-500/10 via-dark-800/60 to-accent-500/10 border border-primary-400/20 hover:border-primary-400/40 transition-all group neural-bg">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-3xl font-bold text-white mb-2">Overall Progress</h2>
            <p className="text-slate-300 text-lg">Track your project completion</p>
          </div>
          <div className="text-right">
            <div className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary-300 to-accent-300 animate-gradient-shift">
              {progress.overall}%
            </div>
            <div className="flex items-center justify-end gap-2 text-primary-200 text-base mt-2">
              <TrendingUp className="w-5 h-5" />
              On Track
            </div>
          </div>
        </div>
        <div className="w-full bg-white/10 rounded-full h-8 relative overflow-hidden shadow-inner">
          <div
            className="bg-gradient-to-r from-primary-500 via-primary-400 to-accent-500 h-8 rounded-full transition-all duration-500 flex items-center justify-end pr-4 relative"
            style={{ width: `${progress.overall}%` }}
          >
            <span className="text-white text-sm font-bold">{progress.overall}%</span>
            {/* Animated shimmer effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-gradient" />
          </div>
        </div>
      </div>

      {/* Enhanced Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Phase Progress Card */}
        <div className="card group hover:scale-[1.01] transition-all">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-primary-500/20 to-accent-500/20 rounded-xl flex items-center justify-center glow-ring">
              <BarChart3 className="w-6 h-6 text-primary-300" />
            </div>
            <h3 className="text-2xl font-bold text-white">Phase Progress</h3>
          </div>
          <div className="space-y-5">
            {progress.phases.map((phase, index) => (
              <div key={index} className="animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
                <div className="flex items-center justify-between mb-3">
                  <span className="font-semibold text-white text-lg">{phase.name}</span>
                  <span className={`text-base font-bold ${
                    phase.status === 'completed' ? 'text-primary-300' : 'text-slate-300'
                  }`}>{phase.progress}%</span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-3 relative overflow-hidden">
                  <div
                    className={`h-3 rounded-full transition-all duration-500 relative ${
                      phase.status === 'completed'
                        ? 'bg-gradient-to-r from-primary-400 to-primary-500'
                        : phase.status === 'in-progress'
                        ? 'bg-gradient-to-r from-primary-500 to-accent-500'
                        : 'bg-white/10'
                    }`}
                    style={{ width: `${phase.progress}%` }}
                  >
                    {phase.status === 'in-progress' && (
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-gradient" />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Updates Card */}
        <div className="card group hover:scale-[1.01] transition-all">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-success-500/20 to-success-600/10 rounded-xl flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-success-300" />
            </div>
            <h3 className="text-2xl font-bold text-white">Recent Updates</h3>
          </div>
          <div className="space-y-3">
            {progress.recentUpdates.length > 0 ? (
              progress.recentUpdates.map((update, index) => (
                <div
                  key={update.id}
                  className="flex items-start gap-3 p-4 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 hover:border-primary-400/30 transition-all group/item animate-fade-in"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="flex-shrink-0">
                    {getStatusIcon(update.status)}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-white mb-1">{update.task}</p>
                    <p className="text-sm text-slate-300">
                      {update.member} • {update.timestampIST}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-slate-400">
                <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No completed tasks yet</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Enhanced Milestones Card */}
      <div className="card group hover:scale-[1.01] transition-all neural-bg">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-gradient-to-br from-accent-500/20 to-accent-600/10 rounded-xl flex items-center justify-center">
            <Calendar className="w-6 h-6 text-accent-300" />
          </div>
          <h3 className="text-2xl font-bold text-white">Project Milestones</h3>
        </div>
        <div className="space-y-5">
          {progress.milestones.map((milestone, index) => (
            <div key={index} className="flex items-center gap-5 group/milestone animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
              <div
                className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                  milestone.completed
                    ? 'bg-gradient-to-br from-primary-500 to-accent-500 shadow-lg shadow-primary-500/30 glow-ring'
                    : 'bg-white/10 border-2 border-white/20 group-hover/milestone:border-primary-400/40'
                }`}
              >
                {milestone.completed ? (
                  <CheckCircle className="w-7 h-7 text-white" />
                ) : (
                  <span className="font-bold text-slate-300 text-lg">{index + 1}</span>
                )}
              </div>
              <div className="flex-1">
                <p
                  className={`font-semibold text-lg ${
                    milestone.completed ? 'text-slate-400 line-through' : 'text-white'
                  }`}
                >
                  {milestone.name}
                </p>
                {milestone.date && (
                  <p className="text-sm text-slate-400 mt-1">
                    Target: {milestone.date instanceof Date ? milestone.date.toLocaleDateString() : new Date(milestone.date).toLocaleDateString()}
                  </p>
                )}
              </div>
              {milestone.completed && (
                <div className="flex-shrink-0">
                  <div className="px-3 py-1 rounded-full bg-primary-500/20 text-primary-200 text-xs font-medium border border-primary-500/30">
                    Completed
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProgressView;
