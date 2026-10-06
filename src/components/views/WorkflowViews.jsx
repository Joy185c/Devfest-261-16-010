import React, { useRef } from 'react';
import { 
  FolderOpen, Loader2, AlertCircle, CheckCircle2, 
  Upload, FileText, ArrowRight, Activity, Download, Settings, RefreshCw, AlertTriangle, Copy, Info, Sparkles
} from 'lucide-react';
import './WorkflowViews.css';
import { formatBytes } from '../../utils/tenderUtils';

// ─── HOME VIEW ───────────────────────────────────────────────────────────
export function HomeView({ t, tenderData, navigate, workflowStates }) {
  if (!tenderData) {
    return (
      <div className="home-dashboard empty">
        <div className="hero-section">
          <h1>{t.homeHeroTitle}</h1>
          <p className="hero-subtitle">{t.homeHeroSub}</p>
          <button className="btn-primary btn-xl mt-4 hero-btn" onClick={() => navigate('setup')}>
            <FolderOpen size={20} /> {t.startNewPackage}
          </button>
        </div>

        <div className="features-grid mt-5">
          <div className="feature-card feature-blue">
            <div className="f-icon"><Upload size={24} /></div>
            <h3>{t.feat1Title}</h3>
            <p>{t.feat1Desc}</p>
          </div>
          <div className="feature-card feature-green">
            <div className="f-icon"><CheckCircle2 size={24} /></div>
            <h3>{t.feat2Title}</h3>
            <p>{t.feat2Desc}</p>
          </div>
          <div className="feature-card feature-amber">
            <div className="f-icon"><AlertTriangle size={24} /></div>
            <h3>{t.feat3Title}</h3>
            <p>{t.feat3Desc}</p>
          </div>
          <div className="feature-card feature-purple">
            <div className="f-icon"><Sparkles size={24} /></div>
            <h3>{t.feat4Title}</h3>
            <p>{t.feat4Desc}</p>
          </div>
        </div>

        <div className="how-it-works mt-5">
          <h3>{t.howItWorks}</h3>
          <div className="workflow-steps-visual">
            <div className="w-step"><span>1</span>{t.setup}</div>
            <ArrowRight className="w-arrow" size={16} />
            <div className="w-step"><span>2</span>{t.uploadDocs?.split(' ')[0] || 'Upload'}</div>
            <ArrowRight className="w-arrow" size={16} />
            <div className="w-step"><span>3</span>{t.analyze}</div>
            <ArrowRight className="w-arrow" size={16} />
            <div className="w-step"><span>4</span>{t.review}</div>
            <ArrowRight className="w-arrow" size={16} />
            <div className="w-step"><span>5</span>{t.generate}</div>
          </div>
        </div>
      </div>
    );
  }

  // Calculate progress
  const steps = ['setup', 'upload', 'analyze', 'review', 'generate'];
  const completedCount = steps.filter(s => workflowStates[s] === 'completed').length;
  
  let nextStep = 'upload';
  let nextTitle = t.upNextUpload;
  let nextDesc = t.upNextUploadDesc;
  if (workflowStates.upload === 'completed') {
    nextStep = 'analyze'; nextTitle = t.upNextAnalyze; nextDesc = t.upNextAnalyzeDesc;
  }
  if (workflowStates.analyze === 'completed') {
    nextStep = 'review'; nextTitle = t.upNextReview; nextDesc = t.upNextReviewDesc;
  }
  if (workflowStates.review === 'completed') {
    nextStep = 'generate'; nextTitle = t.upNextGenerate; nextDesc = t.upNextGenerateDesc;
  }

  return (
    <div className="home-dashboard">
      <h1>Welcome back</h1>
      <p className="home-subtitle">{t.appTitle}<br/>{t.appSubtitle}</p>

      <div className="dashboard-grid">
        <div className="dash-card">
          <h3 className="dash-card-title">{t.tenderInformation}</h3>
          <div className="info-grid">
            <div className="info-item"><span>{t.tenderId}</span><strong>{tenderData.tender.tender_id}</strong></div>
            <div className="info-item"><span>{t.procuringEntity}</span><strong>{tenderData.tender.procuring_entity}</strong></div>
            <div className="info-item"><span>{t.bidder}</span><strong>{tenderData.tender.bidder}</strong></div>
            <div className="info-item"><span>{t.submissionDeadline}</span><strong>{tenderData.tender.submission_deadline}</strong></div>
          </div>
        </div>

        <div className="dash-card progress-card">
          <h3 className="dash-card-title">{t.yourProgress}</h3>
          <div className="progress-bar-wrap">
            <div className="progress-bar" style={{ width: `${(completedCount / 5) * 100}%` }}></div>
          </div>
          <p className="progress-text">{completedCount} / 5 {t.stepsCompleted}</p>

          <div className="next-action-box">
            <div className="next-action-header">{t.nextStep}</div>
            <h4>{nextTitle}</h4>
            <p>{nextDesc}</p>
            <button className="btn-primary mt-3" onClick={() => navigate(nextStep)}>
              {t[nextStep] || nextStep} <ArrowRight size={16} />
            </button>
          </div>
        </div>

        <div className="dash-card ai-dash-card">
          <div className="ai-card-content">
            <div className="ai-card-header">
              <Sparkles size={24} className="ai-icon" />
              <h3>{t.aiCardTitle}</h3>
            </div>
            <p>{t.aiCardDesc}</p>
            <div className="ai-brands mt-2">
              <span className="badge">Gemini</span>
              <span className="badge">Groq</span>
              <span className="badge">OpenAI</span>
              <span className="badge">Anthropic</span>
            </div>
          </div>
          <button className="btn-ghost ai-btn" onClick={() => navigate('ai')}>
            {t.openAiAssistant} <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── SETUP VIEW ───────────────────────────────────────────────────────────
export function SetupView({ t, tenderData, loadingReqs, reqsError, handleReqsFile, navigate }) {
  const reqsFileRef = useRef(null);

  return (
    <div className="workflow-page setup-page">
      <div className="page-header">
        <h2>Setup Tender</h2>
        <p>Load your tender requirements to begin the workflow.</p>
      </div>

      <div className="setup-card">
        {tenderData ? (
          <div className="setup-success">
            <CheckCircle2 size={48} color="#10b981" />
            <h3>Requirements Loaded</h3>
            <p><strong>{tenderData.requirements.length}</strong> requirements found for Tender <strong>{tenderData.tender.tender_id}</strong>.</p>
            <div className="setup-actions">
              <input type="file" accept=".json" ref={reqsFileRef} onChange={e => handleReqsFile(e.target.files[0])} style={{ display: 'none' }} />
              <button className="btn-ghost" onClick={() => reqsFileRef.current.click()}>Load Different File</button>
              <button className="btn-primary" onClick={() => navigate('upload')}>Continue to Upload <ArrowRight size={16} /></button>
            </div>
          </div>
        ) : (
          <div className="setup-empty">
            <FolderOpen size={48} color="#94a3b8" />
            <h3>Load requirements.json</h3>
            <p>Select the requirements file provided by the tender authority.</p>
            <input type="file" accept=".json" ref={reqsFileRef} onChange={e => handleReqsFile(e.target.files[0])} style={{ display: 'none' }} />
            
            {loadingReqs ? (
              <button className="btn-primary" disabled><Loader2 className="spin" size={16} /> Loading...</button>
            ) : (
              <button className="btn-primary" onClick={() => reqsFileRef.current.click()}>Browse Files</button>
            )}
            
            {reqsError && <div className="error-banner mt-3"><AlertCircle size={16} /> {reqsError}</div>}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── UPLOAD VIEW ───────────────────────────────────────────────────────────
export function UploadView({ t, uploadedFiles, totalUploadedSize, MAX_TOTAL_MB, dragOver, setDragOver, handlePdfDrop, handlePdfInput, pdfFileRef, processingFiles, uploadErrors, setUploadErrors, removeFile, navigate, duplicateFileIds }) {
  return (
    <div className="workflow-page upload-page">
      <div className="page-header">
        <h2>Upload Documents</h2>
        <p>Upload all PDF files required for your tender submission.</p>
      </div>

      <div className="upload-container">
        <div className="upload-left">
          <div 
            className={`drop-zone large ${dragOver ? 'drag-active' : ''}`}
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handlePdfDrop}
          >
            <Upload size={48} color="#3b82f6" />
            <h3>Drag and drop PDF files here</h3>
            <p>Maximum 30 files • 50 MB total</p>
            <input type="file" accept=".pdf" multiple ref={pdfFileRef} onChange={handlePdfInput} style={{ display: 'none' }} />
            <button className="btn-primary mt-3" onClick={() => pdfFileRef.current.click()}>Browse Files</button>
          </div>

          {processingFiles && <div className="loading-banner mt-3"><Loader2 size={16} className="spin" /> Processing PDFs...</div>}
          {uploadErrors.length > 0 && (
            <div className="error-banner mt-3">
              <ul>{uploadErrors.map((e, i) => <li key={i}>{e}</li>)}</ul>
              <button className="btn-ghost-sm" onClick={() => setUploadErrors([])}>Clear</button>
            </div>
          )}
        </div>

        <div className="upload-right">
          <div className="upload-right-header">
            <h3>Uploaded Files ({uploadedFiles.length})</h3>
            <span className="size-badge">{formatBytes(totalUploadedSize)} / {MAX_TOTAL_MB} MB</span>
          </div>
          
          <div className="file-list-scroll">
            {uploadedFiles.length === 0 ? (
              <div className="empty-files">No files uploaded yet.</div>
            ) : (
              uploadedFiles.map(file => (
                <div key={file.id} className={`file-card ${duplicateFileIds.has(file.id) ? 'duplicate' : ''}`}>
                  <FileText size={20} className="file-card-icon" />
                  <div className="file-card-info">
                    <div className="file-card-name">{file.name}</div>
                    <div className="file-card-meta">{formatBytes(file.size)} • {file.pageCount} pages</div>
                  </div>
                  <button className="file-remove-btn" onClick={() => removeFile(file.id)}>&times;</button>
                </div>
              ))
            )}
          </div>

          <div className="upload-footer">
            <button className="btn-primary w-full" disabled={uploadedFiles.length === 0} onClick={() => navigate('analyze')}>
              Analyze Documents <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── ANALYZE VIEW ───────────────────────────────────────────────────────────
export function AnalyzeView({ t, uploadedFiles, matchMap, fileToReqMap, duplicateFileIds, navigate, aiEnabled, onOpenAiSetup }) {
  const matchedCount = Object.keys(matchMap).length;
  const dupCount = duplicateFileIds.size;
  const unmatchedCount = uploadedFiles.length - matchedCount;

  return (
    <div className="workflow-page analyze-page">
      <div className="page-header">
        <h2>Analyze Documents</h2>
        <p>We've checked your uploaded files against the tender requirements.</p>
      </div>

      <div className="analyze-stats-grid">
        <div className="stat-card">
          <div className="stat-value">{uploadedFiles.length}</div>
          <div className="stat-label">Total Files</div>
        </div>
        <div className="stat-card success">
          <div className="stat-value">{matchedCount}</div>
          <div className="stat-label">Matched</div>
        </div>
        <div className="stat-card warning">
          <div className="stat-value">{unmatchedCount}</div>
          <div className="stat-label">Unmatched</div>
        </div>
        <div className="stat-card danger">
          <div className="stat-value">{dupCount}</div>
          <div className="stat-label">Duplicates</div>
        </div>
      </div>

      <div className="analysis-results">
        <h3>Analysis Results</h3>
        {uploadedFiles.length === 0 ? (
          <p>No files to analyze.</p>
        ) : (
          <div className="results-list">
            {uploadedFiles.map(file => {
              const isDup = duplicateFileIds.has(file.id);
              const matchedReqId = fileToReqMap[file.id];
              
              let icon = <CheckCircle2 size={18} color="#10b981" />;
              let statusText = `Matched with requirement ${matchedReqId}`;
              let className = 'result-ok';

              if (isDup) {
                icon = <Copy size={18} color="#ef4444" />;
                statusText = 'Duplicate detected';
                className = 'result-danger';
              } else if (!matchedReqId) {
                icon = <AlertTriangle size={18} color="#f59e0b" />;
                statusText = 'Unmatched file';
                className = 'result-warning';
              }

              return (
                <div key={file.id} className={`result-row ${className}`}>
                  <div className="result-icon">{icon}</div>
                  <div className="result-file">{file.name}</div>
                  <div className="result-status">{statusText}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {aiEnabled ? (
        <div className="ai-suggestion-box">
          <Sparkles size={20} color="#f59e0b" />
          <div className="ai-box-content">
            <h4>AI Insights Ready</h4>
            <p>Your AI assistant is enabled. You can use it in the sidebar or during review to get intelligent matching suggestions and explanations.</p>
          </div>
        </div>
      ) : (
        <div className="ai-promo-box">
          <div className="ai-promo-content">
            <h4>Supercharge with AI</h4>
            <p>Enable the AI assistant to automatically suggest matches and explain issues.</p>
          </div>
          <button className="btn-ghost" onClick={onOpenAiSetup}>Enable AI</button>
        </div>
      )}

      <div className="page-actions mt-4">
        <button className="btn-primary" onClick={() => navigate('review')}>Review Documents <ArrowRight size={16} /></button>
      </div>
    </div>
  );
}
