import React, { useState, useRef } from 'react';
import { translations } from './data/translations';
import {
  validateRequirementsJson, calcStatus, isBlocking,
  hashFileBytes, findDuplicateFileIds, formatBytes, getPdfPageCount
} from './utils/tenderUtils';
import { generateTenderPackage } from './utils/pdfGenerator';
import {
  FileText, Upload, X, CheckCircle2, AlertCircle, AlertTriangle,
  Clock, Copy, Info, Download, RefreshCw, Search,
  FolderOpen, Loader2
} from 'lucide-react';

let fileIdCounter = 0;
const newId = () => ++fileIdCounter;

const MAX_FILES = 30;
const MAX_TOTAL_MB = 50;

export default function App() {
  const [lang, setLang] = useState('en');
  const t = translations[lang];

  // ─── State ───────────────────────────────────────────────────────────────
  const [tenderData, setTenderData] = useState(null);      // { tender, requirements }
  const [loadingReqs, setLoadingReqs] = useState(false);
  const [reqsError, setReqsError] = useState(null);

  const [uploadedFiles, setUploadedFiles] = useState([]);  // array of FileRecord
  const [matchMap, setMatchMap] = useState({});            // { reqId: fileId }
  const [expiryMap, setExpiryMap] = useState({});          // { reqId: 'YYYY-MM-DD' }

  const [searchQuery, setSearchQuery] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [uploadErrors, setUploadErrors] = useState([]);
  const [processingFiles, setProcessingFiles] = useState(false);

  const [matchModalReqId, setMatchModalReqId] = useState(null);

  const [generating, setGenerating] = useState(false);
  const [generationResult, setGenerationResult] = useState(null); // { bytes, filename, totalPages, docsCount }
  const [generationError, setGenerationError] = useState(null);

  const reqsFileRef = useRef(null);
  const pdfFileRef = useRef(null);

  // ─── Derived ─────────────────────────────────────────────────────────────
  const duplicateFileIds = findDuplicateFileIds(uploadedFiles);

  // reverse map: fileId → reqId
  const fileToReqMap = {};
  Object.entries(matchMap).forEach(([reqId, fileId]) => { fileToReqMap[fileId] = reqId; });

  const getMatchedFile = (reqId) => {
    const fileId = matchMap[reqId];
    return fileId ? uploadedFiles.find(f => f.id === fileId) : null;
  };

  const getReqStatus = (req) => {
    const file = getMatchedFile(req.id);
    return calcStatus(req, file, expiryMap[req.id], tenderData?.tender.submission_deadline);
  };

  const sortedReqs = tenderData
    ? [...tenderData.requirements].sort((a, b) => a.order - b.order)
    : [];

  const filteredReqs = sortedReqs.filter(r => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return r.title_en.toLowerCase().includes(q) || r.title_bn.includes(q) || r.id.toLowerCase().includes(q);
  });

  const issueCounts = tenderData ? {
    missing: sortedReqs.filter(r => getReqStatus(r) === 'missing').length,
    expiryNeeded: sortedReqs.filter(r => getReqStatus(r) === 'expiryNeeded').length,
    expired: sortedReqs.filter(r => getReqStatus(r) === 'expired').length,
  } : { missing: 0, expiryNeeded: 0, expired: 0 };

  const readyCount = tenderData ? sortedReqs.filter(r => getReqStatus(r) === 'ok' || getReqStatus(r) === 'optional').length : 0;
  const totalReqs = sortedReqs.length;
  const hasBlockingIssues = Object.values(issueCounts).some(c => c > 0);

  const totalUploadedSize = uploadedFiles.reduce((s, f) => s + f.size, 0);

  // ─── Requirements Loading ────────────────────────────────────────────────
  const handleReqsFile = (file) => {
    if (!file) return;
    setLoadingReqs(true);
    setReqsError(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target.result);
        validateRequirementsJson(json);
        setTenderData(json);
        setMatchMap({});
        setExpiryMap({});
        setUploadedFiles([]);
        setGenerationResult(null);
      } catch (err) {
        const msg = err.message === 'malformed' ? t.errorMalformedReqs : t.errorInvalidJson;
        setReqsError(msg);
      }
      setLoadingReqs(false);
    };
    reader.onerror = () => { setReqsError(t.errorInvalidJson); setLoadingReqs(false); };
    reader.readAsText(file);
    if (reqsFileRef.current) reqsFileRef.current.value = null;
  };

  // ─── PDF Upload ──────────────────────────────────────────────────────────
  const processFiles = async (rawFiles) => {
    const errors = [];
    const pdfs = Array.from(rawFiles).filter(f => {
      if (f.type !== 'application/pdf' && !f.name.toLowerCase().endsWith('.pdf')) {
        errors.push(`"${f.name}" — ${t.errorNonPdf}`);
        return false;
      }
      return true;
    });

    if (uploadedFiles.length + pdfs.length > MAX_FILES) {
      errors.push(t.errorFileLimitExceeded);
      setUploadErrors(errors);
      return;
    }

    const newTotalSize = totalUploadedSize + pdfs.reduce((s, f) => s + f.size, 0);
    if (newTotalSize > MAX_TOTAL_MB * 1024 * 1024) {
      errors.push(t.errorSizeLimitExceeded);
      setUploadErrors(errors);
      return;
    }

    setProcessingFiles(true);
    setUploadErrors(errors);

    const newRecords = [];
    for (const file of pdfs) {
      try {
        const arrayBuffer = await file.arrayBuffer();
        const hash = await hashFileBytes(arrayBuffer);
        const pageCount = await getPdfPageCount(arrayBuffer);
        newRecords.push({
          id: newId(),
          name: file.name,
          size: file.size,
          pageCount,
          hash,
          arrayBuffer,
        });
      } catch (e) {
        errors.push(`"${file.name}" — ${t.errorPdfProcessing}`);
      }
    }

    setUploadedFiles(prev => [...prev, ...newRecords]);
    setUploadErrors(errors);
    setProcessingFiles(false);
    if (pdfFileRef.current) pdfFileRef.current.value = null;
  };

  const handlePdfDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    processFiles(e.dataTransfer.files);
  };

  const handlePdfInput = (e) => processFiles(e.target.files);

  const removeFile = (fileId) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId));
    // Also remove from matchMap
    setMatchMap(prev => {
      const next = { ...prev };
      Object.entries(next).forEach(([rId, fId]) => { if (fId === fileId) delete next[rId]; });
      return next;
    });
  };

  // ─── Matching ────────────────────────────────────────────────────────────
  const doMatch = (reqId, fileId) => {
    setMatchMap(prev => {
      const next = { ...prev };
      // Remove fileId from any other req
      Object.entries(next).forEach(([r, f]) => { if (f === fileId && r !== reqId) delete next[r]; });
      next[reqId] = fileId;
      return next;
    });
    setMatchModalReqId(null);
  };

  const unmatch = (reqId) => {
    setMatchMap(prev => { const n = { ...prev }; delete n[reqId]; return n; });
  };

  const availableForMatch = (reqId) => {
    // Find hashes of files used by OTHER requirements
    const usedHashes = new Set();
    Object.entries(matchMap).forEach(([r, fId]) => {
      if (r !== reqId) {
        const file = uploadedFiles.find(f => f.id === fId);
        if (file && file.hash) usedHashes.add(file.hash);
      }
    });
    
    // Filter out files that share a hash with already-used files
    return uploadedFiles.filter(f => !usedHashes.has(f.hash));
  };

  // ─── Generate Package ────────────────────────────────────────────────────
  const handleGenerate = async () => {
    if (hasBlockingIssues || !tenderData) return;
    setGenerating(true);
    setGenerationError(null);
    try {
      // Build file map with arrayBuffer
      const matchedFileMap = {};
      Object.entries(matchMap).forEach(([reqId, fileId]) => {
        const file = uploadedFiles.find(f => f.id === fileId);
        if (file) matchedFileMap[reqId] = file;
      });

      const bytes = await generateTenderPackage(
        tenderData.tender,
        tenderData.requirements,
        matchedFileMap,
        expiryMap
      );

      const filename = `${tenderData.tender.tender_id}_Package.pdf`;
      const totalPages = countPdfPages(bytes);
      const docsCount = Object.keys(matchedFileMap).length;

      setGenerationResult({ bytes, filename, totalPages, docsCount });
    } catch (e) {
      console.error(e);
      setGenerationError(t.errorGenerationFailed);
    }
    setGenerating(false);
  };

  const countPdfPages = (bytes) => {
    const text = new TextDecoder('latin1').decode(bytes);
    const matches = text.match(/\/Type\s*\/Page[^s]/g);
    return matches ? matches.length : 1;
  };

  const downloadPackage = () => {
    if (!generationResult) return;
    const blob = new Blob([generationResult.bytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = generationResult.filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="tpb-root">
      {/* ── HEADER ── */}
      <header className="tpb-header">
        <div className="header-brand">
          <div className="header-icon"><FileText size={22} /></div>
          <div>
            <h1 className="header-title">{t.appTitle}</h1>
            <p className="header-subtitle">{t.appSubtitle}</p>
          </div>
        </div>
        <div className="header-actions">
          <div className="lang-switcher">
            <button className={`lang-btn ${lang === 'en' ? 'active' : ''}`} onClick={() => setLang('en')}>English</button>
            <button className={`lang-btn ${lang === 'bn' ? 'active' : ''}`} onClick={() => setLang('bn')}>বাংলা</button>
          </div>
        </div>
      </header>

      {/* ── MAIN ── */}
      <main className="tpb-main">
        {!tenderData ? (
          /* EMPTY STATE */
          <div className="empty-state">
            <div className="empty-icon"><FolderOpen size={48} /></div>
            <h2>{t.emptyTitle}</h2>
            <p>{t.emptySubtitle}</p>
            <input type="file" accept=".json" ref={reqsFileRef} onChange={e => handleReqsFile(e.target.files[0])} style={{ display: 'none' }} id="reqs-file-input" />
            {loadingReqs ? (
              <div className="loading-inline"><Loader2 size={18} className="spin" />{t.loadingRequirements}</div>
            ) : (
              <button className="btn-primary btn-lg" onClick={() => reqsFileRef.current.click()}>
                <FolderOpen size={18} /> {t.openRequirements}
              </button>
            )}
            {reqsError && <div className="error-banner"><AlertCircle size={16} />{reqsError}</div>}
          </div>
        ) : (
          <>
            {/* ── TENDER OVERVIEW ── */}
            <section className="overview-section">
              <div className="overview-card">
                <div className="overview-header">
                  <FileText size={18} className="section-icon" />
                  <h2 className="section-title">{t.tenderOverview}</h2>
                  <div className="overview-actions">
                    <input type="file" accept=".json" ref={reqsFileRef} onChange={e => handleReqsFile(e.target.files[0])} style={{ display: 'none' }} id="reqs-file-input2" />
                    <button className="btn-ghost-sm" onClick={() => reqsFileRef.current.click()}><RefreshCw size={14} /> Load New</button>
                  </div>
                </div>
                <div className="overview-grid">
                  <div className="overview-field">
                    <span className="field-label">{t.tenderId}</span>
                    <span className="field-value mono">{tenderData.tender.tender_id}</span>
                  </div>
                  <div className="overview-field">
                    <span className="field-label">{t.tenderTitle}</span>
                    <span className="field-value">{tenderData.tender.title}</span>
                  </div>
                  <div className="overview-field">
                    <span className="field-label">{t.procuringEntity}</span>
                    <span className="field-value">{tenderData.tender.procuring_entity}</span>
                  </div>
                  <div className="overview-field">
                    <span className="field-label">{t.bidder}</span>
                    <span className="field-value">{tenderData.tender.bidder}</span>
                  </div>
                  <div className="overview-field deadline-field">
                    <span className="field-label">{t.submissionDeadline}</span>
                    <span className="field-value deadline-val">📅 {tenderData.tender.submission_deadline}</span>
                  </div>
                </div>
              </div>

              {/* Readiness */}
              <div className="readiness-card">
                <div className="readiness-header">
                  <span className="readiness-label">{t.documentReadiness}</span>
                </div>
                <div className="readiness-circle-area">
                  <div className="readiness-donut">
                    <svg viewBox="0 0 80 80" className="donut-svg">
                      <circle cx="40" cy="40" r="32" fill="none" stroke="#e2e8f0" strokeWidth="8" />
                      <circle cx="40" cy="40" r="32" fill="none"
                        stroke={hasBlockingIssues ? '#f59e0b' : '#10b981'}
                        strokeWidth="8"
                        strokeDasharray={`${(readyCount / (totalReqs || 1)) * 201} 201`}
                        strokeLinecap="round"
                        transform="rotate(-90 40 40)" />
                    </svg>
                    <div className="donut-center">
                      <span className="donut-num">{readyCount}</span>
                      <span className="donut-denom">/ {totalReqs}</span>
                    </div>
                  </div>
                  <div className="readiness-status">
                    <span className={`readiness-badge ${hasBlockingIssues ? 'warn' : 'ok'}`}>
                      {hasBlockingIssues ? t.actionRequired : t.readyForSubmission}
                    </span>
                    <div className="readiness-bar-wrap">
                      <div className="readiness-bar" style={{ width: `${(readyCount / (totalReqs || 1)) * 100}%`, background: hasBlockingIssues ? '#f59e0b' : '#10b981' }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Issues Summary */}
              <div className="issues-card">
                <div className="issues-title">{t.issuesSummary}</div>
                <div className="issues-list">
                  <IssueRow icon="missing" label={t.missing} count={issueCounts.missing} color="danger" />
                  <IssueRow icon="expiry" label={t.expiryDateNeeded} count={issueCounts.expiryNeeded} color="warning" />
                  <IssueRow icon="expired" label={t.expired} count={issueCounts.expired} color="danger" />
                </div>
                {!hasBlockingIssues && (
                  <div className="all-ready-msg"><CheckCircle2 size={14} />{t.allReady}</div>
                )}
              </div>
            </section>

            {/* ── WORKSPACE ── */}
            <section className="workspace">
              {/* LEFT: Required Documents */}
              <div className="req-panel">
                <div className="panel-toolbar">
                  <div className="panel-title-row">
                    <FileText size={18} className="section-icon" />
                    <div>
                      <h2 className="section-title">{t.requiredDocuments}</h2>
                      <p className="section-subtitle">{t.requiredDocsSubtitle}</p>
                    </div>
                  </div>
                  <div className="toolbar-right">
                    <div className="search-box">
                      <Search size={14} className="search-icon" />
                      <input
                        className="search-input"
                        placeholder={t.searchDocuments}
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <div className="req-table-wrap">
                  <table className="req-table">
                    <thead>
                      <tr>
                        <th style={{ width: 36 }}>{t.docNo}</th>
                        <th>{t.documentName}</th>
                        <th style={{ width: 90 }}>{t.type}</th>
                        <th style={{ width: 70 }}>{t.expiryRequired}</th>
                        <th>{t.matchedFile}</th>
                        <th style={{ width: 55 }}>{t.pages}</th>
                        <th style={{ width: 130 }}>{t.expiryDate}</th>
                        <th style={{ width: 140 }}>{t.status}</th>
                        <th style={{ width: 110 }}>{t.action}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredReqs.map(req => {
                        const file = getMatchedFile(req.id);
                        const status = getReqStatus(req);
                        return (
                          <RequirementRow
                            key={req.id}
                            req={req}
                            lang={lang}
                            file={file}
                            status={status}
                            expiryDate={expiryMap[req.id] || ''}
                            onMatchClick={() => setMatchModalReqId(req.id)}
                            onChangeClick={() => setMatchModalReqId(req.id)}
                            onRemoveMatch={() => unmatch(req.id)}
                            onExpiryChange={(val) => setExpiryMap(prev => ({ ...prev, [req.id]: val }))}
                            t={t}
                          />
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* RIGHT: Upload Panel */}
              <div className="upload-panel">
                <div className="panel-toolbar">
                  <div className="panel-title-row">
                    <Upload size={18} className="section-icon" />
                    <h2 className="section-title">{t.uploadedPdfFiles}</h2>
                  </div>
                  <span className="files-count-badge">
                    {uploadedFiles.length} {t.files} • {formatBytes(totalUploadedSize)} / {MAX_TOTAL_MB} {t.mb}
                  </span>
                </div>

                {/* Drop zone */}
                <div
                  className={`drop-zone ${dragOver ? 'drag-active' : ''}`}
                  onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handlePdfDrop}
                >
                  <Upload size={28} className="drop-icon" />
                  <p className="drop-text">{t.dragDropHere}</p>
                  <input type="file" accept=".pdf" multiple ref={pdfFileRef} onChange={handlePdfInput} style={{ display: 'none' }} id="pdf-input" />
                  <button className="btn-primary" onClick={() => pdfFileRef.current.click()}>
                    {t.browseFiles}
                  </button>
                  <p className="drop-hint">{t.pdfOnly}</p>
                </div>

                {processingFiles && (
                  <div className="loading-inline"><Loader2 size={16} className="spin" />{t.loadingPdf}</div>
                )}

                {uploadErrors.length > 0 && (
                  <div className="upload-errors">
                    {uploadErrors.map((e, i) => (
                      <div key={i} className="error-banner sm"><AlertCircle size={13} />{e}</div>
                    ))}
                    <button className="btn-ghost-xs" onClick={() => setUploadErrors([])}>✕</button>
                  </div>
                )}

                {/* File list */}
                <div className="file-list">
                  {uploadedFiles.map(file => {
                    const reqId = fileToReqMap[file.id];
                    const req = reqId ? tenderData?.requirements.find(r => r.id === reqId) : null;
                    const isDup = duplicateFileIds.has(file.id);
                    return (
                      <UploadedFileRow
                        key={file.id}
                        file={file}
                        matchedReq={req}
                        isDuplicate={isDup}
                        onRemove={() => removeFile(file.id)}
                        t={t}
                      />
                    );
                  })}
                </div>

                {uploadedFiles.length > 0 && (
                  <div className="upload-footer-note">
                    <Info size={13} />
                    <span>Each document can be matched with at most one file. Each file can be used for at most one document.</span>
                  </div>
                )}
              </div>
            </section>

            {/* ── GENERATE BAR ── */}
            <div className="generate-bar">
              {hasBlockingIssues ? (
                <div className="generate-blocker">
                  <AlertCircle size={18} />
                  <div>
                    <span className="blocker-title">{t.cannotGenerate}</span>
                    <span className="blocker-sub">{t.resolveBlocking}</span>
                  </div>
                </div>
              ) : (
                <div className="generate-ready">
                  <CheckCircle2 size={18} className="ready-icon" />
                  <span>{t.allReady}</span>
                </div>
              )}
              <div className="generate-bar-right">
                <button className="btn-ghost" onClick={() => {
                  setUploadedFiles([]); setMatchMap({}); setExpiryMap({}); setGenerationResult(null);
                }}>
                  <RefreshCw size={15} /> {t.clearAll}
                </button>
                <button
                  className={`btn-generate ${hasBlockingIssues || generating ? 'disabled' : ''}`}
                  onClick={handleGenerate}
                  disabled={hasBlockingIssues || generating}
                >
                  {generating ? <><Loader2 size={16} className="spin" />{t.generating}</> : <><Download size={16} />{t.generatePackage}</>}
                </button>
              </div>
            </div>

            {generationError && <div className="error-banner"><AlertCircle size={16} />{generationError}</div>}

            {/* ── SUCCESS STATE ── */}
            {generationResult && (
              <div className="success-state">
                <div className="success-icon"><CheckCircle2 size={36} /></div>
                <div className="success-info">
                  <h3>{t.successTitle}</h3>
                  <div className="success-meta">
                    <span><strong>{t.successFilename}:</strong> {generationResult.filename}</span>
                    <span><strong>{t.successTotalPages}:</strong> {generationResult.totalPages}</span>
                    <span><strong>{t.successDocumentsIncluded}:</strong> {generationResult.docsCount}</span>
                  </div>
                </div>
                <button className="btn-download" onClick={downloadPackage}>
                  <Download size={18} /> {t.downloadPackage}
                </button>
              </div>
            )}
          </>
        )}
      </main>

      {/* ── MATCH MODAL ── */}
      {matchModalReqId && (
        <MatchModal
          req={tenderData.requirements.find(r => r.id === matchModalReqId)}
          lang={lang}
          availableFiles={availableForMatch(matchModalReqId)}
          currentFileId={matchMap[matchModalReqId]}
          onConfirm={(fileId) => doMatch(matchModalReqId, fileId)}
          onClose={() => setMatchModalReqId(null)}
          t={t}
        />
      )}
    </div>
  );
}

// ─── IssueRow ──────────────────────────────────────────────────────────────
function IssueRow({ icon, label, count, color }) {
  const icons = {
    missing: <AlertCircle size={14} />,
    expiry: <Clock size={14} />,
    expired: <AlertTriangle size={14} />,
    duplicate: <Copy size={14} />,
  };
  return (
    <div className={`issue-row ${color}`}>
      <span className="issue-icon">{icons[icon]}</span>
      <span className="issue-label">{label}</span>
      <span className="issue-count">{count}</span>
    </div>
  );
}

// ─── StatusBadge ──────────────────────────────────────────────────────────
function StatusBadge({ status, t }) {
  const config = {
    ok: { icon: <CheckCircle2 size={13} />, label: t.statusOK, cls: 'status-ok' },
    missing: { icon: <AlertCircle size={13} />, label: t.statusMissing, cls: 'status-missing' },
    expiryNeeded: { icon: <Clock size={13} />, label: t.statusExpiryNeeded, cls: 'status-expiry' },
    expired: { icon: <AlertTriangle size={13} />, label: t.statusExpired, cls: 'status-expired' },
    optional: { icon: <Info size={13} />, label: t.statusOptional, cls: 'status-optional' },
    duplicate: { icon: <Copy size={13} />, label: t.statusDuplicate, cls: 'status-duplicate' },
  };
  const c = config[status] || config.missing;
  return <span className={`status-badge ${c.cls}`}>{c.icon}{c.label}</span>;
}

// ─── RequirementRow ───────────────────────────────────────────────────────
function RequirementRow({ req, lang, file, status, expiryDate, onMatchClick, onChangeClick, onRemoveMatch, onExpiryChange, t }) {
  return (
    <tr className={`req-row ${isBlocking(status) ? 'row-blocking' : ''}`}>
      <td className="cell-order">{req.order}</td>
      <td className="cell-docname">
        <div className="docname-main">{lang === 'bn' ? req.title_bn : req.title_en}</div>
        <div className="docname-sub">{lang === 'bn' ? req.title_en : req.title_bn}</div>
        <div className="docname-id">{req.id}</div>
      </td>
      <td>
        <span className={`type-badge ${req.mandatory ? 'mandatory' : 'optional'}`}>
          {req.mandatory ? t.mandatory : t.optional}
        </span>
      </td>
      <td className="cell-center">
        {req.has_expiry ? (
          <span className="expiry-yes">📅 {t.yes}</span>
        ) : (
          <span className="expiry-no">✗ {t.no}</span>
        )}
      </td>
      <td className="cell-matched">
        {file ? (
          <div className="matched-file">
            <FileText size={13} className="file-icon" />
            <div>
              <div className="matched-name">{file.name}</div>
              <div className="matched-sub">{file.pageCount} pages</div>
            </div>
          </div>
        ) : (
          <span className="not-matched">{t.notMatched}</span>
        )}
      </td>
      <td className="cell-center cell-pages">
        {file ? file.pageCount : '—'}
      </td>
      <td className="cell-expiry">
        {req.has_expiry && file ? (
          <input
            type="date"
            className={`date-input ${status === 'expired' ? 'date-expired' : status === 'ok' ? 'date-ok' : ''}`}
            value={expiryDate}
            onChange={e => onExpiryChange(e.target.value)}
          />
        ) : (
          <span className="dash">—</span>
        )}
      </td>
      <td><StatusBadge status={status} t={t} /></td>
      <td className="cell-action">
        {file ? (
          <div className="action-btns">
            <button className="btn-action-sm change" onClick={onChangeClick}>{t.change}</button>
            <button className="btn-action-sm remove" onClick={onRemoveMatch}><X size={12} /></button>
          </div>
        ) : (
          <button className="btn-match-file" onClick={onMatchClick}>{t.matchFile}</button>
        )}
      </td>
    </tr>
  );
}

// ─── UploadedFileRow ──────────────────────────────────────────────────────
function UploadedFileRow({ file, matchedReq, isDuplicate, onRemove, t }) {
  return (
    <div className={`file-row ${isDuplicate ? 'file-duplicate' : ''}`}>
      <div className="file-icon-wrap"><FileText size={20} /></div>
      <div className="file-info">
        <div className="file-name">{file.name}</div>
        <div className="file-meta">{formatBytes(file.size)} • {file.pageCount} {t.pages}</div>
      </div>
      <div className="file-status">
        {isDuplicate ? (
          <span className="file-badge duplicate"><Copy size={11} /> {t.duplicateContent}</span>
        ) : matchedReq ? (
          <span className="file-badge matched"><CheckCircle2 size={11} /> {t.matched} ({matchedReq.id})</span>
        ) : (
          <span className="file-badge unmatched">{t.unmatched}</span>
        )}
      </div>
      <button className="file-remove" onClick={onRemove} title={t.removeFile}><X size={14} /></button>
    </div>
  );
}

// ─── MatchModal ────────────────────────────────────────────────────────────
function MatchModal({ req, lang, availableFiles, currentFileId, onConfirm, onClose, t }) {
  const [selected, setSelected] = useState(currentFileId || null);
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{t.selectFileToMatch}</h3>
          <button className="modal-close" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="modal-req-name">
          <strong>{req.id}</strong> — {lang === 'bn' ? req.title_bn : req.title_en}
        </div>
        <div className="modal-files">
          {availableFiles.length === 0 ? (
            <p className="modal-empty">{t.noAvailableFiles}</p>
          ) : (
            availableFiles.map(f => (
              <div
                key={f.id}
                className={`modal-file-row ${selected === f.id ? 'selected' : ''}`}
                onClick={() => setSelected(f.id)}
              >
                <FileText size={16} />
                <div className="modal-file-info">
                  <div>{f.name}</div>
                  <div className="modal-file-meta">{formatBytes(f.size)} • {f.pageCount} pages</div>
                </div>
                {selected === f.id && <CheckCircle2 size={16} className="modal-check" />}
              </div>
            ))
          )}
        </div>
        <div className="modal-footer">
          <button className="btn-ghost" onClick={onClose}>{t.cancel}</button>
          <button className="btn-primary" disabled={!selected} onClick={() => selected && onConfirm(selected)}>
            {t.confirm}
          </button>
        </div>
      </div>
    </div>
  );
}
