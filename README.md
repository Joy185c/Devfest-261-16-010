<div align="center">
  <img src="./public/favicon.svg" alt="Logo" width="80" height="80">
  <h1 align="center">Tender Package Builder</h1>
  
  <p align="center">
    <strong>AI DevFest 2026 Hackathon — Official Submission</strong>
  </p>

  <p align="center">
    A premium, browser-based React application that helps office staff turn a set of scattered PDF files into one complete, checked, and correctly ordered PDF package, ready for tender submission.
  </p>

  <p align="center">
    <a href="#-live-demo">Live Demo</a> •
    <a href="#-core-features">Features</a> •
    <a href="#-how-to-run-locally">Run Locally</a> •
    <a href="#-tech-stack">Tech Stack</a>
  </p>
</div>

<br />

---

## 👤 Author
- **Name:** [Your Name]
- **Registration Number:** [Your Registration Number]

## 🔗 Live Demo
**[Live Application Link — https://mockhackathon-fawn.vercel.app/](https://mockhackathon-fawn.vercel.app/)**

---

## ✨ Core Features

### 📑 1. Dynamic Requirements Loading
- Loads and parses `requirements.json` instantly.
- Dynamically renders Tender ID, Title, Procuring Entity, Bidder, and Submission Deadline.
- Strictly follows document sorting and order defined in the JSON.

### 📁 2. Robust PDF Upload & Management
- Multi-file drag & drop support.
- Strict validation: **PDFs only**, up to **30 files**, and max **50 MB** total.
- Real-time PDF page counting via fast raw byte scanning.

### 🔍 3. Intelligent Duplicate Detection
- Browser-native **SHA-256 content hashing** detects exact duplicate files, even if filenames differ.
- Identifies and visually flags duplicates in the upload list, preventing invalid matches to different documents.

### 🎯 4. Strict One-to-One Matching
- Clean UI to match an uploaded PDF to a required document.
- One requirement → At most one file. One file → At most one requirement.
- Supports changing, removing, and undoing matches effortlessly.

### 📅 5. Expiry Date Validation
- Dynamic expiry date input fields appear only for documents where `has_expiry: true`.
- Compares entered expiry date against the `submission_deadline`.
- *Same-day expiry is validated as OK.*

### 🚦 6. Granular Status Engine & Blocking Logic
Every requirement shows exactly **one** precise status updated in real time:
- 🔴 **Missing** (Blocking)
- 🟠 **Expiry date needed** (Blocking)
- 🔴 **Expired** (Blocking)
- ⚪ **Not provided** (Optional, Non-blocking)
- 🟢 **OK** (Non-blocking)

The **Generate Package** button remains strictly disabled until ZERO blocking issues exist.

### 📄 7. Professional PDF Generation
Generated purely in the frontend using `pdf-lib`:
- **English Cover Page:** Contains Tender ID, Title, Entity, Bidder, Deadline, Made Date, and the ordered index of included documents.
- **Ordered Document Merge:** Compiles all matched PDFs in exact original order, skipping empty optional documents.
- **Smart Footer:** Adds `<tender_id> | Page X of Y` to the bottom of *every* page without obscuring existing document content.
- Downloaded flawlessly as `<tender_id>_Package.pdf`.

### 🌐 8. Complete Bilingual UI
- Instant, seamless toggle between **English** and **বাংলা (Bengali)**.
- Replaces all UI labels, document titles (`title_en` / `title_bn`), error messages, and statuses dynamically.

---

## 🛠️ Tech Stack
- **React 18** — Component-driven UI.
- **Vite** — Lightning-fast development and optimized build.
- **Vanilla CSS** — Premium, customized styling with glass-morphism, flexbox grids, and responsive design.
- **pdf-lib** — Powerful client-side PDF creation, modification, and merging.
- **Lucide React** — Beautiful, consistent SVG iconography.

---

## 🚀 How to Run Locally

Clone the project and start the Vite development server in under a minute:

```bash
# 1. Clone the repository
git clone https://github.com/Joy185c/Devfest-261-16-010.git
cd Devfest-261-16-010

# 2. Install dependencies
npm install

# 3. Start the dev server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your Chrome browser to view the application.

---

## 📁 Output Directory
The generated combined PDF files are intended to be saved in the `output/` directory for record-keeping.
Example: `output/T-2026-0417_Package.pdf`

## 📸 Screenshots
Refer to the `screenshots/` folder for visual references of the application's clean, premium interface and dynamic status updates.

---

<div align="center">
  <sub>Built under 90-minutes constraint for the AI DevFest Hackathon.</sub>
</div>
