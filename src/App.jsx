import React, { useState, useRef } from 'react';
import { translations } from './data/translations';
import {
  validateRequirementsJson, calcStatus, isBlocking,
  hashFileBytes, findDuplicateFileIds, formatBytes, getPdfPageCount
} from './utils/tenderUtils';
import { generateTenderPackage } from './utils/pdfGenerator';
import OnboardingModal from './components/OnboardingModal';
import AIAssistant from './components/AIAssistant';
import AISetupModal from './components/AISetupModal';
import { RequirementRow, MatchModal } from './components/common/TableComponents';
import AppShell from './components/layout/AppShell';

import { HomeView, SetupView, UploadView, AnalyzeView } from './components/views/WorkflowViews';
import ReviewView from './components/views/ReviewView';
import GenerateView from './components/views/GenerateView';
import CompleteView from './components/views/CompleteView';

const MAX_FILES = 30;
const MAX_TOTAL_MB = 50;
let fileIdCounter = 0;
const newId = () => ++fileIdCounter;

export default function App() {
  const [lang, setLang] = useState('en');
  const t = translations[lang];

  const [showOnboarding, setShowOnboarding] = useState(() => {
    return localStorage.getItem('tenderPackageBuilder_onboarding_completed') !== 'true';
  });

  const handleCloseOnboarding = () => {
    localStorage.setItem('tenderPackageBuilder_onboarding_completed', 'true');
    setShowOnboarding(false);
  };

  const [aiConfig, setAiConfig] = useState(null);
  const [showAiSetup, setShowAiSetup] = useState(false);

  // Core State
  const [tenderData, setTenderData] = useState(null);
  const [loadingReqs, setLoadingReqs] = useState(false);
  const [reqsError, setReqsError] = useState(null);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [matchMap, setMatchMap] = useState({});
  const [expiryMap, setExpiryMap] = useState({});
  const [uploadErrors, setUploadErrors] = useState([]);
  const [processingFiles, setProcessingFiles] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [matchModalReqId, setMatchModalReqId] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [generationResult, setGenerationResult] = useState(null);

  // Navigation State
  const [currentRoute, setCurrentRoute] = useState('home');

  // Derived Values
  const duplicateFileIds = findDuplicateFileIds(uploadedFiles);
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

  const sortedReqs = tenderData ? [...tenderData.requirements].sort((a, b) => a.order - b.order) : [];
  
  const issueCounts = tenderData ? {
    missing: sortedReqs.filter(r => getReqStatus(r) === 'missing').length,
    expiryNeeded: sortedReqs.filter(r => getReqStatus(r) === 'expiryNeeded').length,
    expired: sortedReqs.filter(r => getReqStatus(r) === 'expired').length,
  } : { missing: 0, expiryNeeded: 0, expired: 0 };

  const hasBlockingIssues = Object.values(issueCounts).some(c => c > 0);
  const totalUploadedSize = uploadedFiles.reduce((s, f) => s + f.size, 0);

  // Workflow Logic
  const getWorkflowStates = () => {
    return {
      setup: tenderData ? 'completed' : 'current',
      upload: tenderData ? (uploadedFiles.length > 0 ? 'completed' : 'current') : 'locked',
      analyze: tenderData && uploadedFiles.length > 0 ? 'completed' : 'locked', // Auto-complete for now when viewed
      review: tenderData && uploadedFiles.length > 0 ? (!hasBlockingIssues ? 'completed' : 'warning') : 'locked',
      generate: generationResult ? 'completed' : (!hasBlockingIssues && tenderData ? 'current' : 'locked'),
      complete: generationResult ? 'completed' : 'locked'
    };
  };

  const workflowStates = getWorkflowStates();

  const stepperConfig = [
    { id: 'setup', label: 'Setup', state: workflowStates.setup },
    { id: 'upload', label: 'Upload', state: workflowStates.upload },
    { id: 'analyze', label: 'Analyze', state: workflowStates.analyze },
    { id: 'review', label: 'Review', state: workflowStates.review },
    { id: 'generate', label: 'Generate', state: workflowStates.generate },
  ];

  // Requirements Loading
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
        setCurrentRoute('setup');
      } catch (err) {
        setReqsError(err.message === 'malformed' ? t.errorMalformedReqs : t.errorInvalidJson);
      }
      setLoadingReqs(false);
    };
    reader.onerror = () => { setReqsError(t.errorInvalidJson); setLoadingReqs(false); };
    reader.readAsText(file);
  };

  // PDF Upload Processing
  const pdfFileRef = useRef(null);
  const processFiles = async (rawFiles) => {
    const errors = [];
    const pdfs = Array.from(rawFiles).filter(f => {
      if (f.type !== 'application/pdf' && !f.name.toLowerCase().endsWith('.pdf')) {
        errors.push(`"${f.name}" — ${t.errorNonPdf}`); return false;
      }
      return true;
    });

    if (uploadedFiles.length + pdfs.length > MAX_FILES) {
      errors.push(t.errorFileLimitExceeded); setUploadErrors(errors); return;
    }

    const newTotalSize = totalUploadedSize + pdfs.reduce((s, f) => s + f.size, 0);
    if (newTotalSize > MAX_TOTAL_MB * 1024 * 1024) {
      errors.push(t.errorSizeLimitExceeded); setUploadErrors(errors); return;
    }

    setProcessingFiles(true);
    setUploadErrors(errors);

    const newRecords = [];
    for (const file of pdfs) {
      try {
        const arrayBuffer = await file.arrayBuffer();
        const hash = await hashFileBytes(arrayBuffer);
        const pageCount = await getPdfPageCount(arrayBuffer);
        newRecords.push({ id: newId(), name: file.name, size: file.size, pageCount, hash, arrayBuffer });
      } catch (e) {
        errors.push(`"${file.name}" — ${t.errorPdfProcessing}`);
      }
    }

    setUploadedFiles(prev => [...prev, ...newRecords]);
    setUploadErrors(errors);
    setProcessingFiles(false);
    if (pdfFileRef.current) pdfFileRef.current.value = null;
  };

  const handlePdfDrop = (e) => { e.preventDefault(); setDragOver(false); processFiles(e.dataTransfer.files); };
  const handlePdfInput = (e) => processFiles(e.target.files);
  const removeFile = (fileId) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId));
    setMatchMap(prev => {
      const next = { ...prev };
      Object.entries(next).forEach(([rId, fId]) => { if (fId === fileId) delete next[rId]; });
      return next;
    });
  };

  // Matching Logic
  const doMatch = (reqId, fileId) => {
    setMatchMap(prev => {
      const next = { ...prev };
      Object.entries(next).forEach(([r, f]) => { if (f === fileId && r !== reqId) delete next[r]; });
      next[reqId] = fileId;
      return next;
    });
    setMatchModalReqId(null);
  };

  const availableForMatch = (reqId) => {
    const usedHashes = new Set();
    Object.entries(matchMap).forEach(([r, fId]) => {
      if (r !== reqId) {
        const file = uploadedFiles.find(f => f.id === fId);
        if (file && file.hash) usedHashes.add(file.hash);
      }
    });
    return uploadedFiles.filter(f => !usedHashes.has(f.hash));
  };

  // Generate Package
  const handleGenerate = async () => {
    if (hasBlockingIssues || !tenderData) return;
    setGenerating(true);
    try {
      const matchedFileMap = {};
      Object.entries(matchMap).forEach(([reqId, fileId]) => {
        const file = uploadedFiles.find(f => f.id === fileId);
        if (file) matchedFileMap[reqId] = file;
      });

      const bytes = await generateTenderPackage(tenderData.tender, tenderData.requirements, matchedFileMap, expiryMap);
      const text = new TextDecoder('latin1').decode(bytes);
      const matches = text.match(/\/Type\s*\/Page[^s]/g);
      const totalPages = matches ? matches.length : 1;

      setGenerationResult({ 
        bytes, 
        filename: `${tenderData.tender.tender_id}_Package.pdf`, 
        totalPages, 
        docsCount: Object.keys(matchedFileMap).length 
      });
      setCurrentRoute('complete');
    } catch (e) {
      console.error(e);
      alert(t.errorGenerationFailed);
    }
    setGenerating(false);
  };

  const downloadPackage = () => {
    if (!generationResult) return;
    const blob = new Blob([generationResult.bytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = generationResult.filename;
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
  };

  const navigate = (route) => setCurrentRoute(route);

  // Compute matchedFileMap for GenerateView
  const matchedFileMap = {};
  Object.entries(matchMap).forEach(([reqId, fileId]) => {
    const file = uploadedFiles.find(f => f.id === fileId);
    if (file) matchedFileMap[reqId] = file;
  });

  return (
    <AppShell 
      t={t} lang={lang} setLang={setLang}
      tenderId={tenderData?.tender?.tender_id}
      currentRoute={currentRoute}
      navigate={navigate}
      workflowStates={workflowStates}
      stepperConfig={stepperConfig}
      aiEnabled={!!aiConfig}
      hideStepper={currentRoute === 'home' || currentRoute === 'complete'}
    >
      {showOnboarding && <OnboardingModal t={t} onClose={handleCloseOnboarding} onSetupAi={() => setShowAiSetup(true)} />}
      {showAiSetup && <AISetupModal t={t} onClose={() => setShowAiSetup(false)} onConnect={(provider, apiKey) => { setAiConfig({ provider, apiKey }); setShowAiSetup(false); }} />}

      {currentRoute === 'home' && <HomeView t={t} tenderData={tenderData} navigate={navigate} workflowStates={workflowStates} />}
      {currentRoute === 'setup' && <SetupView t={t} tenderData={tenderData} loadingReqs={loadingReqs} reqsError={reqsError} handleReqsFile={handleReqsFile} navigate={navigate} />}
      {currentRoute === 'upload' && <UploadView t={t} uploadedFiles={uploadedFiles} totalUploadedSize={totalUploadedSize} MAX_TOTAL_MB={MAX_TOTAL_MB} dragOver={dragOver} setDragOver={setDragOver} handlePdfDrop={handlePdfDrop} handlePdfInput={handlePdfInput} pdfFileRef={pdfFileRef} processingFiles={processingFiles} uploadErrors={uploadErrors} setUploadErrors={setUploadErrors} removeFile={removeFile} navigate={navigate} duplicateFileIds={duplicateFileIds} />}
      {currentRoute === 'analyze' && <AnalyzeView t={t} uploadedFiles={uploadedFiles} matchMap={matchMap} fileToReqMap={fileToReqMap} duplicateFileIds={duplicateFileIds} navigate={navigate} aiEnabled={!!aiConfig} onOpenAiSetup={() => setShowAiSetup(true)} />}
      {currentRoute === 'review' && <ReviewView t={t} tenderData={tenderData} filteredReqs={sortedReqs} getMatchedFile={getMatchedFile} getReqStatus={getReqStatus} expiryMap={expiryMap} setMatchModalReqId={setMatchModalReqId} unmatch={(id) => setMatchMap(p => {const n={...p}; delete n[id]; return n;})} setExpiryMap={setExpiryMap} hasBlockingIssues={hasBlockingIssues} issueCounts={issueCounts} navigate={navigate} RequirementRow={RequirementRow} />}
      {currentRoute === 'generate' && <GenerateView t={t} tenderData={tenderData} matchedFileMap={matchedFileMap} hasBlockingIssues={hasBlockingIssues} generating={generating} handleGenerate={handleGenerate} issueCounts={issueCounts} />}
      {currentRoute === 'complete' && <CompleteView t={t} generationResult={generationResult} downloadPackage={downloadPackage} navigate={navigate} />}
      
      {/* Expose AI Assistant Sidebar implicitly or explicitly in 'ai' route */}
      {currentRoute === 'ai' && (
        <div style={{ maxWidth: 400, margin: '0 auto', background: 'white', borderRadius: 12, overflow: 'hidden', border: '1px solid #e2e8f0' }}>
          <AIAssistant t={t} onOpenSetup={() => setShowAiSetup(true)} aiConfig={aiConfig} onClearConfig={() => setAiConfig(null)} requirements={sortedReqs} uploadedFiles={uploadedFiles} matches={matchMap} statuses={sortedReqs.reduce((acc, req) => ({ ...acc, [req.id]: { status: getReqStatus(req) } }), {})} onApplyMatch={doMatch} />
        </div>
      )}

      {currentRoute === 'documents' && (
         <div className="workflow-page"><div className="page-header"><h2>Document Center</h2><p>View all uploaded documents. Switch to Upload to add more.</p></div></div>
      )}

      {matchModalReqId && (
        <MatchModal
          req={tenderData.requirements.find(r => r.id === matchModalReqId)}
          lang={lang} availableFiles={availableForMatch(matchModalReqId)}
          currentFileId={matchMap[matchModalReqId]}
          onConfirm={(fileId) => doMatch(matchModalReqId, fileId)}
          onClose={() => setMatchModalReqId(null)} t={t}
        />
      )}
    </AppShell>
  );
}
