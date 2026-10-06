import React from 'react';
import { Home, Settings, HelpCircle, FileText, Upload, Activity, CheckSquare, Download, Folder, Sparkles } from 'lucide-react';
import './Sidebar.css';

export default function Sidebar({ t, currentRoute, navigate, workflowStates, aiEnabled }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <img src="/logo.png" alt="Logo" className="sidebar-logo" />
        <div>
          <h2 className="sidebar-brand">Tender Package Builder</h2>
          <p className="sidebar-subtitle">Prepare, verify & package</p>
        </div>
      </div>

      <div className="sidebar-nav-group">
        <div className="sidebar-label">WORKFLOW</div>
        <NavItem 
          icon={<Home size={18} />} 
          label="Home" 
          active={currentRoute === 'home'} 
          onClick={() => navigate('home')} 
        />
        
        <StepItem 
          num="01" label={t.setup || "Setup"} 
          state={workflowStates.setup} 
          active={currentRoute === 'setup'} 
          onClick={() => navigate('setup')} 
        />
        <StepItem 
          num="02" label={t.uploadDocs || "Upload Documents"} 
          state={workflowStates.upload} 
          active={currentRoute === 'upload'} 
          onClick={() => navigate('upload')} 
        />
        <StepItem 
          num="03" label={t.analyze || "Analyze"} 
          state={workflowStates.analyze} 
          active={currentRoute === 'analyze'} 
          onClick={() => navigate('analyze')} 
        />
        <StepItem 
          num="04" label={t.review || "Review"} 
          state={workflowStates.review} 
          active={currentRoute === 'review'} 
          onClick={() => navigate('review')} 
        />
        <StepItem 
          num="05" label={t.generate || "Generate"} 
          state={workflowStates.generate} 
          active={currentRoute === 'generate'} 
          onClick={() => navigate('generate')} 
        />
      </div>

      <div className="sidebar-nav-group">
        <div className="sidebar-label">TOOLS</div>
        <NavItem 
          icon={<Folder size={18} />} 
          label={t.documentCenter || "Document Center"} 
          active={currentRoute === 'documents'} 
          onClick={() => navigate('documents')} 
        />
        <NavItem 
          icon={<Sparkles size={18} />} 
          label={t.aiAssistant} 
          active={currentRoute === 'ai'} 
          onClick={() => navigate('ai')} 
          badge={aiEnabled ? "Enabled" : ""}
        />
      </div>

      <div className="sidebar-nav-group mt-auto">
        <NavItem icon={<Settings size={18} />} label="Settings" />
        <NavItem icon={<HelpCircle size={18} />} label="Help" />
      </div>
    </aside>
  );
}

function NavItem({ icon, label, active, onClick, badge }) {
  return (
    <button className={`nav-item ${active ? 'active' : ''}`} onClick={onClick}>
      {icon}
      <span>{label}</span>
      {badge && <span className="nav-badge">{badge}</span>}
    </button>
  );
}

function StepItem({ num, label, state, active, onClick }) {
  // state: 'completed', 'current', 'locked', 'warning'
  const isDisabled = state === 'locked';
  
  return (
    <button className={`step-item ${active ? 'active' : ''} ${state}`} onClick={onClick} disabled={isDisabled}>
      <div className="step-icon">
        {state === 'completed' ? '✓' : state === 'warning' ? '⚠' : num}
      </div>
      <span className="step-label">{label}</span>
    </button>
  );
}
