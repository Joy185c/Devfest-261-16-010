// ─── Requirement Validation ───────────────────────────────────────────────────

export function validateRequirementsJson(json) {
  if (!json || typeof json !== 'object') throw new Error('invalidJson');
  if (!json.tender || !json.requirements) throw new Error('malformed');
  const t = json.tender;
  if (!t.tender_id || !t.title || !t.procuring_entity || !t.bidder || !t.submission_deadline)
    throw new Error('malformed');
  if (!Array.isArray(json.requirements) || json.requirements.length === 0)
    throw new Error('malformed');
  json.requirements.forEach((r, i) => {
    if (!r.id || r.order === undefined || !r.title_en || !r.title_bn || r.mandatory === undefined)
      throw new Error(`malformedReq:${i}`);
  });
  return true;
}

// ─── Status Calculation ───────────────────────────────────────────────────────

/**
 * status: 'missing' | 'expiryNeeded' | 'expired' | 'optional' | 'ok' | 'duplicate'
 */
export function calcStatus(req, matchedFile, expiryDate, submissionDeadline, duplicateFileIds) {
  const isMatched = !!matchedFile;

  // Duplicate conflict — the file's content hash is duplicated elsewhere
  if (isMatched && duplicateFileIds && duplicateFileIds.has(matchedFile.id)) {
    return 'duplicate';
  }

  if (!isMatched) {
    return req.mandatory ? 'missing' : 'optional';
  }

  if (req.has_expiry) {
    if (!expiryDate) return 'expiryNeeded';
    // Compare as date strings YYYY-MM-DD to avoid timezone issues
    if (expiryDate < submissionDeadline) return 'expired';
  }

  return 'ok';
}

export function isBlocking(status) {
  return ['missing', 'expiryNeeded', 'expired', 'duplicate'].includes(status);
}

// ─── Duplicate Hashing ────────────────────────────────────────────────────────

export async function hashFileBytes(arrayBuffer) {
  const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Returns a Set of file IDs that are duplicates (share content hash with another file).
 */
export function findDuplicateFileIds(uploadedFiles) {
  const hashToIds = {};
  uploadedFiles.forEach(f => {
    if (!f.hash) return;
    if (!hashToIds[f.hash]) hashToIds[f.hash] = [];
    hashToIds[f.hash].push(f.id);
  });
  const dupIds = new Set();
  Object.values(hashToIds).forEach(ids => {
    if (ids.length > 1) ids.forEach(id => dupIds.add(id));
  });
  return dupIds;
}

// ─── File size formatting ─────────────────────────────────────────────────────

export function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ─── PDF Page Count ───────────────────────────────────────────────────────────

export async function getPdfPageCount(arrayBuffer) {
  // Minimal PDF page count via raw byte scan — no external lib needed
  const uint8 = new Uint8Array(arrayBuffer);
  const text = new TextDecoder('latin1').decode(uint8);
  const matches = text.match(/\/Type\s*\/Page[^s]/g);
  return matches ? matches.length : 1;
}
