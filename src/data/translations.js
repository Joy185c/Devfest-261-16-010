export const translations = {
  en: {
    // Header
    appTitle: 'Tender Package Builder',
    appSubtitle: 'Tender document validation & package preparation',
    langEn: 'English',
    langBn: 'বাংলা',
    help: 'Help',

    // Tender Overview
    tenderOverview: 'Tender Overview',
    tenderId: 'Tender ID',
    tenderTitle: 'Tender Title',
    procuringEntity: 'Procuring Entity',
    bidder: 'Bidder',
    submissionDeadline: 'Submission Deadline',
    documentReadiness: 'Document Readiness',
    ready: 'Ready',
    readyForSubmission: 'Ready for submission',
    actionRequired: 'Action required',

    // Issues Summary
    issuesSummary: 'Issues Summary',
    missing: 'Missing',
    expiryDateNeeded: 'Expiry date needed',
    expired: 'Expired',
    duplicate: 'Duplicate',
    allReady: 'All required documents are ready.',

    // Required Documents
    requiredDocuments: 'Required Documents',
    requiredDocsSubtitle: 'Match your uploaded files with the required documents. Follow the order and check all statuses.',
    docNo: '#',
    documentName: 'Document Name',
    type: 'Type',
    expiryRequired: 'Expiry Required',
    matchedFile: 'Matched File',
    pages: 'Pages',
    expiryDate: 'Expiry Date',
    status: 'Status',
    action: 'Action',
    mandatory: 'Mandatory',
    optional: 'Optional',
    yes: 'Yes',
    no: 'No',
    notMatched: 'Not matched',
    matchFile: 'Match File',
    change: 'Change',
    remove: 'Remove',
    searchDocuments: 'Search documents...',
    sortOrder: 'Order 1 → 8',

    // Status labels
    statusMissing: 'Missing',
    statusExpiryNeeded: 'Expiry date needed',
    statusExpired: 'Expired',
    statusOptional: 'Not provided',
    statusOK: 'OK',
    statusDuplicate: 'Duplicate',

    // Upload panel
    uploadedPdfFiles: 'Uploaded PDF Files',
    dragDropHere: 'Drag and drop PDF files here or',
    browseFiles: 'Browse Files',
    pdfOnly: 'PDF only • Maximum 30 files • 50 MB total',
    removeFile: 'Remove',
    matched: 'Matched',
    unmatched: 'Unmatched',
    duplicateContent: 'Duplicate',
    processing: 'Processing...',
    checkingDuplicate: 'Checking duplicate content...',
    files: 'files',
    mb: 'MB',

    // Generate bar
    generatePackage: 'Generate Package',
    cannotGenerate: 'Cannot generate package',
    resolveBlocking: 'Resolve all blocking issues before generating the package.',
    clearAll: 'Clear All',

    // Match modal
    selectFileToMatch: 'Select a file to match',
    availableFiles: 'Available Files',
    cancel: 'Cancel',
    confirm: 'Confirm Match',
    noAvailableFiles: 'No unmatched files available.',

    // Empty state
    emptyTitle: 'Start a Tender Package',
    emptySubtitle: 'Load a requirements.json file to begin building your tender document package.',
    openRequirements: 'Open requirements.json',
    loadingRequirements: 'Loading requirements...',

    // Errors
    errorInvalidJson: 'Invalid requirements.json — please check the file format.',
    errorMalformedReqs: 'requirements.json is missing required fields.',
    errorNonPdf: 'Only PDF files are accepted. Non-PDF files were rejected.',
    errorPdfProcessing: 'Failed to process one or more PDF files.',
    errorFileLimitExceeded: 'Maximum 30 files allowed.',
    errorSizeLimitExceeded: 'Total file size exceeds 50 MB limit.',
    errorDuplicateConflict: 'Duplicate content detected between files.',
    errorGenerationFailed: 'Package generation failed. Please try again.',

    // Success state
    successTitle: 'Package Generated Successfully!',
    successFilename: 'Filename',
    successTotalPages: 'Total Pages',
    successDocumentsIncluded: 'Documents Included',
    downloadPackage: 'Download Package',
    generateAnother: 'Generate Another',
    generating: 'Generating package...',

    // Loading states
    loadingPdf: 'Processing PDF...',
    generatingPackage: 'Generating package...',

    // Onboarding
    onboardNext: 'Next',
    onboardSkip: 'Skip',
    onboardStart: 'Get Started',
    onboardStep1Title: 'Start with your tender documents',
    onboardStep1Desc: 'Upload the PDF files related to your tender. The system checks the files and shows their page counts so you can prepare everything in one place.',
    onboardStep2Title: 'Match documents and check everything',
    onboardStep2Desc: 'Match each uploaded PDF with the required document. Add expiry dates when needed. The system automatically identifies missing, expired, and duplicate documents.',
    onboardStep3Title: 'Generate your final package',
    onboardStep3Desc: 'When every required document is ready, generate one correctly ordered PDF package with a cover page and page numbers. Then download it and submit.'
  },
  bn: {
    // Header
    appTitle: 'টেন্ডার প্যাকেজ বিল্ডার',
    appSubtitle: 'টেন্ডার দলিল যাচাই ও প্যাকেজ প্রস্তুতি',
    langEn: 'English',
    langBn: 'বাংলা',
    help: 'সাহায্য',

    // Tender Overview
    tenderOverview: 'টেন্ডার ওভারভিউ',
    tenderId: 'টেন্ডার আইডি',
    tenderTitle: 'টেন্ডার শিরোনাম',
    procuringEntity: 'ক্রয়কারী সংস্থা',
    bidder: 'দরদাতা',
    submissionDeadline: 'জমার শেষ তারিখ',
    documentReadiness: 'দলিল প্রস্তুতি',
    ready: 'প্রস্তুত',
    readyForSubmission: 'জমার জন্য প্রস্তুত',
    actionRequired: 'পদক্ষেপ প্রয়োজন',

    // Issues Summary
    issuesSummary: 'সমস্যার সারসংক্ষেপ',
    missing: 'অনুপস্থিত',
    expiryDateNeeded: 'মেয়াদ তারিখ প্রয়োজন',
    expired: 'মেয়াদোত্তীর্ণ',
    duplicate: 'ডুপ্লিকেট',
    allReady: 'সকল প্রয়োজনীয় দলিল প্রস্তুত।',

    // Required Documents
    requiredDocuments: 'প্রয়োজনীয় দলিলসমূহ',
    requiredDocsSubtitle: 'আপলোড করা ফাইলগুলি প্রয়োজনীয় দলিলের সাথে মেলান। ক্রম অনুসরণ করুন এবং সকল স্ট্যাটাস পরীক্ষা করুন।',
    docNo: '#',
    documentName: 'দলিলের নাম',
    type: 'ধরন',
    expiryRequired: 'মেয়াদ প্রয়োজন',
    matchedFile: 'মেলানো ফাইল',
    pages: 'পৃষ্ঠা',
    expiryDate: 'মেয়াদ তারিখ',
    status: 'স্ট্যাটাস',
    action: 'পদক্ষেপ',
    mandatory: 'বাধ্যতামূলক',
    optional: 'ঐচ্ছিক',
    yes: 'হ্যাঁ',
    no: 'না',
    notMatched: 'মেলানো হয়নি',
    matchFile: 'ফাইল মেলান',
    change: 'পরিবর্তন',
    remove: 'সরান',
    searchDocuments: 'দলিল খুঁজুন...',
    sortOrder: 'ক্রম ১ → ৮',

    // Status labels
    statusMissing: 'অনুপস্থিত',
    statusExpiryNeeded: 'মেয়াদ তারিখ প্রয়োজন',
    statusExpired: 'মেয়াদোত্তীর্ণ',
    statusOptional: 'প্রদান করা হয়নি',
    statusOK: 'ঠিক আছে',
    statusDuplicate: 'ডুপ্লিকেট',

    // Upload panel
    uploadedPdfFiles: 'আপলোড করা PDF ফাইল',
    dragDropHere: 'এখানে PDF ফাইল ড্র্যাগ করুন অথবা',
    browseFiles: 'ফাইল ব্রাউজ করুন',
    pdfOnly: 'শুধু PDF • সর্বোচ্চ ৩০টি ফাইল • মোট ৫০ MB',
    removeFile: 'সরান',
    matched: 'মেলানো',
    unmatched: 'অমেলানো',
    duplicateContent: 'ডুপ্লিকেট',
    processing: 'প্রক্রিয়াকরণ...',
    checkingDuplicate: 'ডুপ্লিকেট কন্টেন্ট পরীক্ষা করা হচ্ছে...',
    files: 'ফাইল',
    mb: 'MB',

    // Generate bar
    generatePackage: 'প্যাকেজ তৈরি করুন',
    cannotGenerate: 'প্যাকেজ তৈরি করা যাচ্ছে না',
    resolveBlocking: 'প্যাকেজ তৈরির আগে সকল ব্লকিং সমস্যা সমাধান করুন।',
    clearAll: 'সব মুছুন',

    // Match modal
    selectFileToMatch: 'মেলানোর জন্য ফাইল নির্বাচন করুন',
    availableFiles: 'উপলব্ধ ফাইল',
    cancel: 'বাতিল',
    confirm: 'মিল নিশ্চিত করুন',
    noAvailableFiles: 'কোনো অমেলানো ফাইল নেই।',

    // Empty state
    emptyTitle: 'টেন্ডার প্যাকেজ শুরু করুন',
    emptySubtitle: 'টেন্ডার দলিল প্যাকেজ তৈরি শুরু করতে একটি requirements.json ফাইল লোড করুন।',
    openRequirements: 'requirements.json খুলুন',
    loadingRequirements: 'প্রয়োজনীয়তা লোড হচ্ছে...',

    // Errors
    errorInvalidJson: 'অবৈধ requirements.json — ফাইল ফরম্যাট পরীক্ষা করুন।',
    errorMalformedReqs: 'requirements.json-এ প্রয়োজনীয় ফিল্ড অনুপস্থিত।',
    errorNonPdf: 'শুধুমাত্র PDF ফাইল গ্রহণযোগ্য। অ-PDF ফাইল প্রত্যাখ্যাত হয়েছে।',
    errorPdfProcessing: 'এক বা একাধিক PDF ফাইল প্রক্রিয়া করতে ব্যর্থ।',
    errorFileLimitExceeded: 'সর্বোচ্চ ৩০টি ফাইল অনুমোদিত।',
    errorSizeLimitExceeded: 'মোট ফাইলের আকার ৫০ MB সীমা অতিক্রম করেছে।',
    errorDuplicateConflict: 'ফাইলের মধ্যে ডুপ্লিকেট কন্টেন্ট পাওয়া গেছে।',
    errorGenerationFailed: 'প্যাকেজ তৈরি ব্যর্থ হয়েছে। আবার চেষ্টা করুন।',

    // Success state
    successTitle: 'প্যাকেজ সফলভাবে তৈরি হয়েছে!',
    successFilename: 'ফাইলের নাম',
    successTotalPages: 'মোট পৃষ্ঠা',
    successDocumentsIncluded: 'অন্তর্ভুক্ত দলিল',
    downloadPackage: 'প্যাকেজ ডাউনলোড করুন',
    generateAnother: 'আরেকটি তৈরি করুন',
    generating: 'প্যাকেজ তৈরি হচ্ছে...',

    // Loading states
    loadingPdf: 'PDF প্রক্রিয়া করা হচ্ছে...',
    generatingPackage: 'প্যাকেজ তৈরি হচ্ছে...',

    // Onboarding
    onboardNext: 'পরবর্তী',
    onboardSkip: 'এড়িয়ে যান',
    onboardStart: 'শুরু করুন',
    onboardStep1Title: 'টেন্ডার ডকুমেন্ট দিয়ে শুরু করুন',
    onboardStep1Desc: 'আপনার টেন্ডারের প্রয়োজনীয় PDF ফাইলগুলো আপলোড করুন। সিস্টেম ফাইলগুলো যাচাই করে প্রতিটি ফাইলের পৃষ্ঠা সংখ্যা দেখাবে।',
    onboardStep2Title: 'ডকুমেন্ট মিলিয়ে দেখুন এবং যাচাই করুন',
    onboardStep2Desc: 'প্রতিটি PDF সঠিক প্রয়োজনীয় ডকুমেন্টের সাথে মিলিয়ে দিন। প্রয়োজন হলে মেয়াদ শেষ হওয়ার তারিখ দিন। সিস্টেম Missing, Expired এবং Duplicate ডকুমেন্ট শনাক্ত করবে।',
    onboardStep3Title: 'চূড়ান্ত প্যাকেজ তৈরি করুন',
    onboardStep3Desc: 'সব প্রয়োজনীয় ডকুমেন্ট প্রস্তুত হলে একটি সঠিক ক্রমে সাজানো PDF package তৈরি করুন। এতে cover page ও page numbers থাকবে। এরপর এটি download করে submit করুন।'
  }
};
