import React, { useState, useEffect } from 'react';
import { UploadCloud, CheckCircle, FileText, X, ChevronRight, Sparkles } from 'lucide-react';
import './OnboardingModal.css';

export default function OnboardingModal({ t, onClose, onSetupAi }) {
  const [step, setStep] = useState(0);

  // Accessible keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const steps = [
    {
      icon: <UploadCloud size={64} color="#3b82f6" strokeWidth={1.5} />,
      title: t.onboardStep1Title,
      desc: t.onboardStep1Desc
    },
    {
      icon: <CheckCircle size={64} color="#10b981" strokeWidth={1.5} />,
      title: t.onboardStep2Title,
      desc: t.onboardStep2Desc
    },
    {
      icon: <FileText size={64} color="#8b5cf6" strokeWidth={1.5} />,
      title: t.onboardStep3Title,
      desc: t.onboardStep3Desc
    },
    {
      icon: <Sparkles size={64} color="#f59e0b" strokeWidth={1.5} />,
      title: t.onboardStep4Title,
      desc: t.onboardStep4Desc,
      isAiStep: true
    }
  ];

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      onClose();
    }
  };

  return (
    <div className="onboarding-backdrop" role="dialog" aria-modal="true" aria-labelledby="onboarding-title">
      <div className="onboarding-card">
        <button 
          className="onboarding-close" 
          onClick={onClose} 
          aria-label="Close onboarding"
        >
          <X size={20} />
        </button>

        <div className="onboarding-content-layout">
          <div className="onboarding-visual">
            <div className="onboarding-icon-wrapper" style={steps[step].isAiStep ? { background: '#fef3c7', borderColor: '#fde68a' } : {}}>
              {steps[step].icon}
            </div>
            <div className="onboarding-indicator-small" style={steps[step].isAiStep ? { background: '#f59e0b', color: '#fff' } : {}}>
              {step + 1} of {steps.length}
            </div>
          </div>

          <div className="onboarding-text">
            <h2 id="onboarding-title">{steps[step].title}</h2>
            <p>{steps[step].desc}</p>
          </div>
        </div>

        <div className="onboarding-footer">
          {steps[step].isAiStep ? (
            <>
              <button className="onboarding-btn-skip" onClick={onClose} style={{ color: '#64748b' }}>
                {t.onboardMaybeLater}
              </button>
              
              <div className="onboarding-dots">
                {steps.map((_, idx) => (
                  <span 
                    key={idx} 
                    className={`onboarding-dot ${idx === step ? 'active' : ''}`}
                    style={idx === step ? { background: '#f59e0b' } : {}}
                  />
                ))}
              </div>

              <button className="onboarding-btn-next" onClick={() => { onClose(); onSetupAi(); }} style={{ background: '#f59e0b', color: '#fff', border: 'none' }}>
                <Sparkles size={16} style={{ marginRight: 6 }} /> {t.onboardSetupAI}
              </button>
            </>
          ) : (
            <>
              <button className="onboarding-btn-skip" onClick={onClose}>
                {t.onboardSkip}
              </button>
              
              <div className="onboarding-dots">
                {steps.map((_, idx) => (
                  <span 
                    key={idx} 
                    className={`onboarding-dot ${idx === step ? 'active' : ''}`}
                  />
                ))}
              </div>

              <button className="onboarding-btn-next" onClick={handleNext}>
                {t.onboardNext} <ChevronRight size={16} style={{ marginLeft: 4 }} />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
