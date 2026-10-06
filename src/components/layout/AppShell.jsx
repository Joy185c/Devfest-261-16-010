import React, { useState } from 'react';
import Sidebar from './Sidebar';
import TopHeader from './TopHeader';
import WorkflowStepper from './WorkflowStepper';
import './AppShell.css';

export default function AppShell({ 
  children, 
  t, 
  lang, 
  setLang,
  tenderId,
  currentRoute, 
  navigate,
  workflowStates,
  stepperConfig,
  aiEnabled,
  hideStepper
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => setMobileMenuOpen(!mobileMenuOpen);

  return (
    <div className="app-shell">
      {/* Mobile Drawer Overlay */}
      {mobileMenuOpen && <div className="mobile-overlay" onClick={toggleMobileMenu} />}
      
      {/* Sidebar Container */}
      <div className={`sidebar-container ${mobileMenuOpen ? 'open' : ''}`}>
        <Sidebar 
          t={t} 
          currentRoute={currentRoute} 
          navigate={(route) => { navigate(route); setMobileMenuOpen(false); }} 
          workflowStates={workflowStates}
          aiEnabled={aiEnabled}
        />
      </div>

      {/* Main Content Area */}
      <div className="main-area">
        <TopHeader 
          tenderId={tenderId} 
          lang={lang} 
          setLang={setLang} 
          toggleMobileMenu={toggleMobileMenu} 
        />
        
        <div className="main-content">
          {!hideStepper && stepperConfig && (
            <div className="stepper-wrapper">
              <WorkflowStepper steps={stepperConfig} />
            </div>
          )}
          
          <div className="view-container">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
