import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

/**
 * Generates the combined tender package PDF.
 * @param {object} tender - Tender metadata
 * @param {Array} requirements - Sorted requirements (by order)
 * @param {object} matchMap - { reqId: uploadedFile }
 * @param {object} expiryMap - { reqId: 'YYYY-MM-DD' }
 * @returns {Uint8Array} - PDF bytes
 */
export async function generateTenderPackage(tender, requirements, matchMap, expiryMap) {
  const finalPdf = await PDFDocument.create();
  const helveticaFont = await finalPdf.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await finalPdf.embedFont(StandardFonts.HelveticaBold);

  // ─── Gather sorted matched docs ────────────────────────────────────────────
  const sortedReqs = [...requirements].sort((a, b) => a.order - b.order);
  const includedDocs = sortedReqs.filter(r => matchMap[r.id]);

  // ─── Cover Page ────────────────────────────────────────────────────────────
  const coverPage = finalPdf.addPage([595.28, 841.89]); // A4
  const { width, height } = coverPage.getSize();

  // Header bar
  coverPage.drawRectangle({ x: 0, y: height - 80, width, height: 80, color: rgb(0.13, 0.37, 0.73) });

  coverPage.drawText('TENDER DOCUMENT PACKAGE', {
    x: 40, y: height - 35,
    font: helveticaBold, size: 18, color: rgb(1, 1, 1),
  });
  coverPage.drawText('Official Submission Package', {
    x: 40, y: height - 58,
    font: helveticaFont, size: 11, color: rgb(0.8, 0.88, 1),
  });

  // Tender info block
  let yPos = height - 120;
  const drawField = (label, value, y) => {
    coverPage.drawText(label + ':', { x: 40, y, font: helveticaBold, size: 9, color: rgb(0.4, 0.4, 0.4) });
    coverPage.drawText(String(value || ''), { x: 180, y, font: helveticaFont, size: 10, color: rgb(0.1, 0.1, 0.1) });
  };

  const fields = [
    ['Tender ID', tender.tender_id],
    ['Tender Title', tender.title],
    ['Procuring Entity', tender.procuring_entity],
    ['Bidder', tender.bidder],
    ['Submission Deadline', tender.submission_deadline],
    ['Package Created', new Date().toISOString().slice(0, 10)],
  ];

  coverPage.drawRectangle({ x: 30, y: yPos - fields.length * 22 - 10, width: width - 60, height: fields.length * 22 + 24, color: rgb(0.97, 0.98, 1), borderColor: rgb(0.82, 0.88, 0.97), borderWidth: 1 });

  fields.forEach(([label, value]) => {
    drawField(label, value, yPos);
    yPos -= 22;
  });

  // Included documents section
  yPos -= 30;
  coverPage.drawText('INCLUDED DOCUMENTS', { x: 40, y: yPos, font: helveticaBold, size: 11, color: rgb(0.13, 0.37, 0.73) });
  coverPage.drawLine({ start: { x: 40, y: yPos - 6 }, end: { x: width - 40, y: yPos - 6 }, thickness: 1, color: rgb(0.82, 0.88, 0.97) });
  yPos -= 24;

  includedDocs.forEach((req, idx) => {
    const file = matchMap[req.id];
    const expiry = expiryMap[req.id] || '';
    const line = `${idx + 1}. [${req.id}] ${req.title_en}`;
    const detail = `${file.name}${expiry ? '  |  Expiry: ' + expiry : ''}  |  ${file.pageCount} page(s)`;

    coverPage.drawText(line, { x: 50, y: yPos, font: helveticaBold, size: 9.5, color: rgb(0.1, 0.1, 0.1) });
    yPos -= 14;
    coverPage.drawText(detail, { x: 60, y: yPos, font: helveticaFont, size: 8.5, color: rgb(0.45, 0.45, 0.45) });
    yPos -= 18;
    if (yPos < 60) yPos = 60; // prevent overflow
  });

  // ─── Append document pages ─────────────────────────────────────────────────
  for (const req of includedDocs) {
    const file = matchMap[req.id];
    try {
      const srcPdf = await PDFDocument.load(file.arrayBuffer);
      const pageIndices = srcPdf.getPageIndices();
      const copiedPages = await finalPdf.copyPages(srcPdf, pageIndices);
      copiedPages.forEach(p => finalPdf.addPage(p));
    } catch (e) {
      console.error('Failed to embed PDF:', file.name, e);
    }
  }

  // ─── Add footer to ALL pages ───────────────────────────────────────────────
  const allPages = finalPdf.getPages();
  const totalPages = allPages.length;
  const footerFont = await finalPdf.embedFont(StandardFonts.Helvetica);

  allPages.forEach((page, idx) => {
    const { width: pw } = page.getSize();
    const footerText = `${tender.tender_id} | Page ${idx + 1} of ${totalPages}`;
    const textWidth = footerFont.widthOfTextAtSize(footerText, 8);

    // White background strip
    page.drawRectangle({ x: 0, y: 0, width: pw, height: 18, color: rgb(0.96, 0.97, 0.99) });
    page.drawLine({ start: { x: 0, y: 18 }, end: { x: pw, y: 18 }, thickness: 0.5, color: rgb(0.82, 0.88, 0.97) });
    page.drawText(footerText, {
      x: (pw - textWidth) / 2, y: 5,
      font: footerFont, size: 8, color: rgb(0.35, 0.35, 0.45),
    });
  });

  return finalPdf.save();
}
