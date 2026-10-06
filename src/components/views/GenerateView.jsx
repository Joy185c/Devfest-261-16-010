import React from 'react';
import { Download, Loader2 } from 'lucide-react';
import './WorkflowViews.css';

export default function GenerateView({ 
  tenderData, matchedFileMap, hasBlockingIssues, generating, handleGenerate, issueCounts
}) {
  const docsCount = Object.keys(matchedFileMap).length;
  const totalPages = Object.values(matchedFileMap).reduce((sum, f) => sum + f.pageCount, 0);

  return (
    <div className="workflow-page generate-page">
      <div className="page-header">
        <h2>Generate Package</h2>
        <p>Combine all matched documents into a final, correctly ordered PDF.</p>
      </div>

      <div className="generate-container">
        <div className="generate-summary-panel">
          <h3>Tender Package Summary</h3>
          <div className="summary-meta">
            <div><strong>Tender ID:</strong> {tenderData?.tender.tender_id}</div>
            <div><strong>Procuring Entity:</strong> {tenderData?.tender.procuring_entity}</div>
          </div>
          
          <h4 className="mt-4">Included Documents</h4>
          <ul className="included-docs-list">
            {tenderData?.requirements.filter(r => matchedFileMap[r.id]).sort((a,b) => a.order - b.order).map(r => (
              <li key={r.id}>
                <span className="doc-order">{r.order.toString().padStart(2, '0')}</span>
                <span className="doc-name">{r.title_en}</span>
                <span className="doc-pages">{matchedFileMap[r.id].pageCount} pages</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="generate-action-panel">
          {hasBlockingIssues ? (
            <div className="generate-card blocked">
              <h3>Package cannot be generated yet</h3>
              <p>Please resolve:</p>
              <ul className="blocker-list">
                {issueCounts.missing > 0 && <li>⛔ {issueCounts.missing} missing documents</li>}
                {issueCounts.expiryNeeded > 0 && <li>⚠ {issueCounts.expiryNeeded} expiry dates needed</li>}
                {issueCounts.expired > 0 && <li>🔴 {issueCounts.expired} expired documents</li>}
              </ul>
            </div>
          ) : (
            <div className="generate-card ready">
              <h3>Ready to generate</h3>
              <div className="gen-stats">
                <div><strong>Total documents:</strong> {docsCount}</div>
                <div><strong>Total pages:</strong> {totalPages + 1} (incl. cover)</div>
                <div><strong>Output:</strong> {tenderData?.tender.tender_id}_Package.pdf</div>
              </div>
              
              <button 
                className="btn-primary w-full btn-lg mt-4" 
                onClick={handleGenerate}
                disabled={generating}
              >
                {generating ? (
                  <><Loader2 className="spin" size={20} /> Generating your package...</>
                ) : (
                  <><Download size={20} /> Generate Package</>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
