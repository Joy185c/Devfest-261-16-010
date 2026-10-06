import React, { useState, useEffect } from 'react';
import { UploadCloud, CheckCircle, FileText, X, ChevronRight, Download } from 'lucide-react';
import './OnboardingModal.css';

export default function OnboardingModal({ t, onClose }) {
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
            <div className="onboarding-icon-wrapper">
              {steps[step].icon}
            </div>
            <div className="onboarding-indicator-small">
              {step + 1} of 3
            </div>
          </div>

          <div className="onboarding-text">
            <h2 id="onboarding-title">{steps[step].title}</h2>
            <p>{steps[step].desc}</p>
          </div>
        </div>

        <div className="onboarding-footer">
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
            {step === steps.length - 1 ? (
              <>
                {t.onboardStart} <CheckCircle size={16} style={{ marginLeft: 6 }} />
              </>
            ) : (
              <>
                {t.onboardNext} <ChevronRight size={16} style={{ marginLeft: 4 }} />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
