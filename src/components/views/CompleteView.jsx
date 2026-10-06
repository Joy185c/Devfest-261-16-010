import React from 'react';
import { CheckCircle2, Download, Home } from 'lucide-react';
import './WorkflowViews.css';

export default function CompleteView({ t, generationResult, downloadPackage, navigate }) {
  if (!generationResult) return null;
  
  return (
    <div className="workflow-page complete-page">
      <div className="success-container">
        <CheckCircle2 size={64} color="#10b981" className="success-icon-lg" />
        <h2>Package Ready</h2>
        <p>Your tender package has been successfully generated.</p>
        
        <div className="success-meta-box">
          <div className="filename">{generationResult.filename}</div>
          <div className="details">{generationResult.totalPages} pages • {generationResult.docsCount} documents</div>
        </div>

        <div className="success-actions">
          <button className="btn-primary btn-lg" onClick={downloadPackage}>
            <Download size={20} /> Download Package
          </button>
          <button className="btn-ghost" onClick={() => navigate('home')}>
            <Home size={18} /> Return to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
