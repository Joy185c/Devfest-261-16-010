import { calcStatus } from './tenderUtils';

export function buildAIContext(tenderData, uploadedFiles, matchMap, expiryMap, duplicateFileIds, workflowStates) {
  if (!tenderData) {
    return {
      tender: null,
      workflow: { currentStates: workflowStates },
      summary: {
        totalRequirements: 0,
        uploadedDocuments: 0,
        matchedDocuments: 0,
        duplicates: 0,
        missingMandatory: 0,
        expiryNeeded: 0,
        expired: 0,
        readyToGenerate: false
      },
      requirements: [],
      documents: []
    };
  }

  const requirements = tenderData.requirements.map(req => {
    const statusObj = calcStatus(req, matchMap[req.id], expiryMap, uploadedFiles, duplicateFileIds, tenderData.tender.submission_deadline);
    const matchedFile = uploadedFiles.find(f => f.id === matchMap[req.id]);
    return {
      id: req.id,
      title: req.title_en,
      mandatory: req.mandatory,
      hasExpiry: req.has_expiry,
      status: statusObj.status,
      isBlocking: statusObj.isBlocking,
      matchedFilename: matchedFile ? matchedFile.name : null
    };
  });

  const documents = uploadedFiles.map(f => {
    const matchedReqId = Object.keys(matchMap).find(reqId => matchMap[reqId] === f.id);
    return {
      id: f.id,
      filename: f.name,
      pages: f.pageCount,
      isDuplicate: duplicateFileIds.has(f.id),
      matchedRequirementId: matchedReqId || null,
      expiryDate: expiryMap[f.id] || null
    };
  });

  let missingCount = 0;
  let expiryNeededCount = 0;
  let expiredCount = 0;
  let readyToGenerate = true;

  requirements.forEach(r => {
    if (r.status === 'Missing' && r.mandatory) missingCount++;
    if (r.status === 'Expiry date needed') expiryNeededCount++;
    if (r.status === 'Expired') expiredCount++;
    if (r.isBlocking) readyToGenerate = false;
  });

  return {
    tender: {
      id: tenderData.tender.tender_id,
      title: tenderData.tender.title_en,
      submissionDeadline: tenderData.tender.submission_deadline
    },
    workflow: {
      currentStates: workflowStates
    },
    summary: {
      totalRequirements: requirements.length,
      uploadedDocuments: documents.length,
      matchedDocuments: Object.keys(matchMap).length,
      duplicates: duplicateFileIds.size,
      missingMandatory: missingCount,
      expiryNeeded: expiryNeededCount,
      expired: expiredCount,
      readyToGenerate: readyToGenerate
    },
    requirements,
    documents
  };
}
