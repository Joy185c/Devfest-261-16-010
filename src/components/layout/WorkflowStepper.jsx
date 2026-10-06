import React from 'react';
import { Check, CircleDot, Circle } from 'lucide-react';
import './WorkflowStepper.css';

export default function WorkflowStepper({ steps }) {
  // steps: array of { id, label, state, statusText }
  // state: 'completed', 'current', 'locked', 'warning'
  
  return (
    <div className="stepper-container">
      {steps.map((step, idx) => (
        <React.Fragment key={step.id}>
          <div className={`stepper-item ${step.state}`}>
            <div className="stepper-icon">
              {step.state === 'completed' ? <Check size={14} /> : 
               step.state === 'current' ? <CircleDot size={14} /> : 
               <Circle size={14} />}
            </div>
            <div className="stepper-text">
              <span className="stepper-label">{step.label}</span>
              <span className="stepper-status">{step.statusText}</span>
            </div>
          </div>
          {idx < steps.length - 1 && (
            <div className={`stepper-connector ${step.state === 'completed' ? 'active' : ''}`} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}
