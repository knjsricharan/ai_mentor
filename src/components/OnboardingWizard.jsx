import { useState } from 'react';
import { CheckCircle, ArrowRight, ArrowLeft, Sparkles, Users, Target, Rocket } from 'lucide-react';

const OnboardingWizard = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      icon: <Sparkles className="w-16 h-16 text-primary-500" />,
      title: "Welcome to Your AI Project Mentor",
      description: "Get step-by-step guidance to complete your projects successfully with AI-powered planning and tracking.",
    },
    {
      icon: <Users className="w-16 h-16 text-accent-500" />,
      title: "Collaborate with Your Team",
      description: "Work together seamlessly with shared project plans, progress tracking, and team chat.",
    },
    {
      icon: <Target className="w-16 h-16 text-success-500" />,
      title: "AI-Powered Roadmaps",
      description: "Get personalized project roadmaps generated based on your idea and team size.",
    },
    {
      icon: <Rocket className="w-16 h-16 text-primary-600" />,
      title: "Track Your Progress",
      description: "Update your progress and receive AI feedback and suggestions to keep your project on track.",
    },
  ];

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className="w-full h-full flex flex-col animate-fade-in">
      {/* HEADER - Fixed */}
      <div className="flex-shrink-0 mb-6">
        <div className="flex justify-between items-center mb-4">
          {steps.map((_, index) => (
            <div key={index} className="flex items-center flex-1">
              <div
                className={`flex-1 h-2 rounded-full ${
                  index <= currentStep
                    ? 'bg-gradient-to-r from-primary-500 to-accent-500'
                    : 'bg-gray-200'
                }`}
              />
              {index < steps.length - 1 && (
                <div className="w-4" />
              )}
            </div>
          ))}
        </div>
        <div className="text-center text-sm" style={{ color: '#6b7280' }}>
          Step {currentStep + 1} of {steps.length}
        </div>
      </div>

      {/* CONTENT - Flexible */}
      <div className="flex-1 flex flex-col justify-center items-center text-center animate-slide-up min-h-0">
        <div className="flex justify-center mb-6">
          {steps[currentStep].icon}
        </div>
        <h2 className="text-3xl font-bold mb-4" style={{ color: '#111827' }}>
          {steps[currentStep].title}
        </h2>
        <p className="text-lg max-w-md mx-auto" style={{ color: '#6b7280' }}>
          {steps[currentStep].description}
        </p>
      </div>

      {/* FOOTER - Fixed */}
      <div className="flex-shrink-0 flex justify-between items-center">
        <button
          onClick={prevStep}
          disabled={currentStep === 0}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all ${
            currentStep === 0
              ? 'cursor-not-allowed'
              : 'hover:bg-gray-100'
          }`}
          style={{ 
            color: currentStep === 0 ? '#9ca3af' : '#111827'
          }}
        >
          <ArrowLeft className="w-5 h-5" />
          Previous
        </button>

        <button
          onClick={nextStep}
          className="btn-primary flex items-center gap-2"
        >
          {currentStep === steps.length - 1 ? (
            <>
              Get Started
              <CheckCircle className="w-5 h-5" />
            </>
          ) : (
            <>
              Next
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default OnboardingWizard;

