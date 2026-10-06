import React from 'react';
import { ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';
import './WorkflowViews.css';

export default function ReviewView({ 
  t, filteredReqs, getMatchedFile, getReqStatus, expiryMap, 
  setMatchModalReqId, unmatch, setExpiryMap, hasBlockingIssues, issueCounts, navigate, RequirementRow
}) {
  return (
    <div className="workflow-page review-page">
      <div className="page-header">
        <h2>Review Documents</h2>
        <p>Verify all document statuses before generating the final package.</p>
      </div>

      {hasBlockingIssues ? (
        <div className="readiness-banner blocked">
          <div className="banner-icon"><AlertCircle size={24} /></div>
          <div className="banner-content">
            <h3>⚠ Package is not ready</h3>
            <p>Issues need attention before generating.</p>
            <ul className="banner-issues-list">
              {issueCounts.missing > 0 && <li>⛔ {issueCounts.missing} missing documents</li>}
              {issueCounts.expiryNeeded > 0 && <li>⚠ {issueCounts.expiryNeeded} expiry dates required</li>}
              {issueCounts.expired > 0 && <li>🔴 {issueCounts.expired} expired documents</li>}
            </ul>
          </div>
        </div>
      ) : (
        <div className="readiness-banner ready">
          <div className="banner-icon"><CheckCircle2 size={24} /></div>
          <div className="banner-content">
            <h3>✓ Package is ready</h3>
            <p>All required documents have been checked. You can generate the final tender package.</p>
            <button className="btn-primary mt-2" onClick={() => navigate('generate')}>Generate Package <ArrowRight size={16} /></button>
          </div>
        </div>
      )}

      <div className="review-table-container">
        <table className="req-table">
          <thead>
            <tr>
              <th style={{ width: 36 }}>#</th>
              <th>Document</th>
              <th style={{ width: 90 }}>Type</th>
              <th style={{ width: 70 }}>Expiry req.</th>
              <th>Matched File</th>
              <th style={{ width: 55 }}>Pages</th>
              <th style={{ width: 130 }}>Expiry Date</th>
              <th style={{ width: 140 }}>Status</th>
              <th style={{ width: 110 }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredReqs.map(req => (
              <RequirementRow
                key={req.id}
                req={req}
                lang="en" // Simplified for now, or pass from App
                file={getMatchedFile(req.id)}
                status={getReqStatus(req)}
                expiryDate={expiryMap[req.id] || ''}
                onMatchClick={() => setMatchModalReqId(req.id)}
                onChangeClick={() => setMatchModalReqId(req.id)}
                onRemoveMatch={() => unmatch(req.id)}
                onExpiryChange={(val) => setExpiryMap(prev => ({ ...prev, [req.id]: val }))}
                t={t}
              />
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="page-actions mt-4">
        <button className="btn-primary" onClick={() => navigate('generate')} disabled={hasBlockingIssues}>
          Continue to Generate <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}
