import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

// Polyfill for crypto.subtle for Node.js
if (!globalThis.crypto) {
  globalThis.crypto = crypto.webcrypto;
}

import { 
  validateRequirementsJson, 
  calcStatus, 
  isBlocking,
  hashFileBytes, 
  findDuplicateFileIds 
} from '../src/utils/tenderUtils.js';

async function runTest() {
  console.log("--- Starting Unit Tests ---");

  // 1. Test validation
  const reqPath = 'D:/Vibe_Code_upay/sample-pack/requirements.json';
  const reqJson = JSON.parse(fs.readFileSync(reqPath, 'utf-8'));
  
  try {
    validateRequirementsJson(reqJson);
    console.log("✅ requirements.json validation passed.");
  } catch (e) {
    console.error("❌ validation failed", e);
  }

  // 2. Test File Hashing & Duplicate Detection
  const docDir = 'D:/Vibe_Code_upay/sample-pack/documents';
  const file1 = fs.readFileSync(path.join(docDir, 'experience_cert.pdf'));
  const file2 = fs.readFileSync(path.join(docDir, 'experience_cert (1).pdf'));
  const file3 = fs.readFileSync(path.join(docDir, 'trade_license_2026.pdf'));

  const hash1 = await hashFileBytes(file1.buffer.slice(file1.byteOffset, file1.byteOffset + file1.byteLength));
  const hash2 = await hashFileBytes(file2.buffer.slice(file2.byteOffset, file2.byteOffset + file2.byteLength));
  const hash3 = await hashFileBytes(file3.buffer.slice(file3.byteOffset, file3.byteOffset + file3.byteLength));

  if (hash1 === hash2 && hash1 !== hash3) {
    console.log("✅ Content Hashing passed. Duplicates detected correctly.");
  } else {
    console.error("❌ Content Hashing failed.");
  }

  const uploadedFiles = [
    { id: 1, name: 'experience_cert.pdf', hash: hash1 },
    { id: 2, name: 'experience_cert (1).pdf', hash: hash2 },
    { id: 3, name: 'trade_license_2026.pdf', hash: hash3 },
  ];

  const duplicates = findDuplicateFileIds(uploadedFiles);
  if (duplicates.has(1) && duplicates.has(2) && !duplicates.has(3)) {
    console.log("✅ Duplicate IDs logic passed.");
  } else {
    console.error("❌ Duplicate IDs logic failed.", duplicates);
  }

  // 3. Test Status Calculation
  const req = reqJson.requirements[0]; // Trade License, mandatory, has_expiry
  const deadline = reqJson.tender.submission_deadline; // 2026-10-20

  // Missing
  let status = calcStatus(req, null, null, deadline, duplicates);
  console.log(`Test Missing: Expected missing, Got ${status} -> ${status === 'missing' ? '✅' : '❌'}`);

  // Expiry Needed
  status = calcStatus(req, uploadedFiles[2], null, deadline, duplicates);
  console.log(`Test Expiry Needed: Expected expiryNeeded, Got ${status} -> ${status === 'expiryNeeded' ? '✅' : '❌'}`);

  // Expired
  status = calcStatus(req, uploadedFiles[2], '2025-12-31', deadline, duplicates);
  console.log(`Test Expired: Expected expired, Got ${status} -> ${status === 'expired' ? '✅' : '❌'}`);

  // OK (Valid expiry)
  status = calcStatus(req, uploadedFiles[2], '2026-12-31', deadline, duplicates);
  console.log(`Test OK: Expected ok, Got ${status} -> ${status === 'ok' ? '✅' : '❌'}`);

  // Duplicate assigned
  status = calcStatus(req, uploadedFiles[0], '2026-12-31', deadline, duplicates);
  console.log(`Test Duplicate Match: Expected duplicate, Got ${status} -> ${status === 'duplicate' ? '✅' : '❌'}`);

}

runTest();
