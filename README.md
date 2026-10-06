# Tender Package Builder

## AI DevFest Hackathon — Tender Document Package Builder

A professional, browser-based frontend application for building compliant tender document packages. Built in 90 minutes as part of the AI DevFest hackathon.

---

## 👤 Author

- **Name:** [Your Name]
- **Registration Number:** [Your Registration Number]

---

## 🔗 Live Link

[Deployed App URL — update after deployment]

---

## 🚀 How to Run Locally

```bash
# Clone the repository
git clone <repo-url>
cd mock_hackathon

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in Chrome.

---

## ✅ Main Features

1. **Requirements Loading** — Load `requirements.json` via file dialog; validates structure and shows tender details.

2. **PDF Upload** — Drag & drop or browse to upload PDFs. Validates file type, limits (30 files / 50 MB total), processes page count.

3. **Matching System** — Assign uploaded PDFs to required documents. One-to-one enforcement. Match / Change / Remove controls.

4. **Duplicate Detection** — Uses `crypto.subtle.digest('SHA-256')` to detect identical PDF content regardless of filename. Blocked from matching.

5. **Expiry Validation** — Date picker for documents with `has_expiry=true`. Validates against submission deadline. Same-day expiry is OK.

6. **Status System** — `Missing` | `Expiry Date Needed` | `Expired` | `Optional` | `OK` | `Duplicate` — shown with icons + text + color.

7. **Readiness Summary** — Donut chart and issue counts update in real time.

8. **Blocking Logic** — Generate button disabled until all mandatory documents are OK.

9. **PDF Generation** — Produces a single ordered PDF using `pdf-lib`:
   - Cover page (Tender ID, title, entity, bidder, deadline, creation date, document list)
   - All matched documents in `requirement.order` order
   - Footer on every page: `<tender_id> | Page X of Y`
   - Filename: `<tender_id>_Package.pdf`

10. **Bilingual UI** — Full English / বাংলা translation with a single language switch.

11. **Empty / Loading / Error / Success states** — Polished UX for every state.

---

## 🎁 Bonus Features

*None implemented (within 90-minute scope)*

---

## ⚠️ Known Problems

- Page count detection for PDFs uses raw byte scanning (`/Type /Page` regex), which is reliable for most PDFs but may under-count pages in rare encrypted/compressed PDFs.
- Very large PDFs (>10 MB each) may cause noticeable processing delay in the browser.

---

## 🤖 AI Tools Used

- **Antigravity (Google DeepMind Advanced Agentic Coding)** — Primary coding agent used for the full implementation.

---

## 💡 Most Useful Prompt

> "Build the AI DevFest Tender Package Builder as a complete, frontend-only React/Vite app. Requirements loading, PDF upload, SHA-256 duplicate detection, expiry validation, exact status system, blocking logic, ordered pdf-lib package generation with cover page and X-of-Y footer, download, bilingual English/Bangla UI. No backend, no auth, no hardcoded data."

---

## 📁 Output

The generated package PDF is saved under:

```
output/<tender_id>_Package.pdf
```

Example: `output/T-2026-0417_Package.pdf`

---

## 📸 Screenshots

See the `screenshots/` folder for at least one screenshot showing document statuses.
