/* ==========================================================================
   CertiVault — script.js
   All interactivity is SIMULATED for demo purposes using localStorage.
   No real AWS calls happen here — the real S3 upload/download/delete flow
   is explained separately in about.html and README.md.
   ========================================================================== */

// ---- Seed / storage helpers -------------------------------------------
const SEED_CERTS = [
  { id: 1, name: "AWS Cloud Practitioner", category: "Achievement", date: "2026-05-12", size: "1.2 MB" },
  { id: 2, name: "IBM Generative AI Internship", category: "Internship", date: "2026-06-02", size: "0.8 MB" },
  { id: 3, name: "B.Tech Semester 3 Marksheet", category: "Academic", date: "2025-12-20", size: "0.6 MB" },
  { id: 4, name: "Hackathon Winner Certificate", category: "Achievement", date: "2026-03-15", size: "1.5 MB" },
  { id: 5, name: "Web Development Bootcamp", category: "Internship", date: "2026-01-10", size: "0.9 MB" },
  { id: 6, name: "Semester 4 Marksheet", category: "Academic", date: "2026-06-25", size: "0.6 MB" },
];

function loadCerts() {
  const stored = localStorage.getItem("certivault_certs");
  if (stored) return JSON.parse(stored);
  localStorage.setItem("certivault_certs", JSON.stringify(SEED_CERTS));
  return SEED_CERTS;
}

function saveCerts(certs) {
  localStorage.setItem("certivault_certs", JSON.stringify(certs));
}

// Note: localStorage here only persists demo data in the *user's own
// browser* while they use the site. This is a UI simulation of a
// database/S3 index — it is NOT the real AWS S3 bucket.

// ---- Mobile nav / sidebar toggle --------------------------------------
function initNavToggle() {
  const toggle = document.querySelector(".nav-toggle");
  const links = document.querySelector(".nav-links");
  if (toggle && links) {
    toggle.addEventListener("click", () => links.classList.toggle("open"));
  }
  const sideToggle = document.querySelector(".sidebar-toggle");
  const sidebar = document.querySelector(".sidebar");
  if (sideToggle && sidebar) {
    sideToggle.addEventListener("click", () => sidebar.classList.toggle("open"));
  }
}

// ---- Login page (simulated auth) --------------------------------------
function initLoginForm() {
  const form = document.getElementById("login-form");
  if (!form) return;
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const btn = form.querySelector("button[type=submit]");
    const original = btn.innerHTML;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Signing in...';
    btn.disabled = true;
    // Simulated authentication delay — real AWS Cognito/IAM auth is not wired up.
    setTimeout(() => {
      window.location.href = "dashboard.html";
    }, 900);
  });
}

// ---- Dashboard stats ----------------------------------------------------
function initDashboard() {
  const totalEl = document.getElementById("stat-total");
  if (!totalEl) return; // not on dashboard page

  const certs = loadCerts();
  const total = certs.length;
  const counts = certs.reduce((acc, c) => {
    acc[c.category] = (acc[c.category] || 0) + 1;
    return acc;
  }, {});

  document.getElementById("stat-total").textContent = total;
  document.getElementById("stat-internship").textContent = counts["Internship"] || 0;
  document.getElementById("stat-academic").textContent = counts["Academic"] || 0;
  document.getElementById("stat-achievement").textContent = counts["Achievement"] || 0;

  // Recent uploads = last 4, most recent first
  const recentList = document.getElementById("recent-uploads");
  if (recentList) {
    const recent = [...certs].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 4);
    recentList.innerHTML = recent.map(c => `
      <li>
        <div class="icon-tile brand"><i class="fa-solid fa-file-shield"></i></div>
        <div>
          <div class="a-name">${c.name}</div>
          <div class="a-meta">${c.category} • ${c.date}</div>
        </div>
      </li>
    `).join("");
  }
}

// ---- Upload page --------------------------------------------------------
function initUploadPage() {
  const zone = document.getElementById("upload-zone");
  if (!zone) return;
  const input = document.getElementById("file-input");
  const chip = document.getElementById("file-chip");
  const chipName = document.getElementById("file-chip-name");
  const form = document.getElementById("upload-form");
  const successBox = document.getElementById("upload-success");

  zone.addEventListener("click", () => input.click());
  zone.addEventListener("dragover", (e) => { e.preventDefault(); zone.classList.add("drag"); });
  zone.addEventListener("dragleave", () => zone.classList.remove("drag"));
  zone.addEventListener("drop", (e) => {
    e.preventDefault();
    zone.classList.remove("drag");
    if (e.dataTransfer.files.length) {
      input.files = e.dataTransfer.files;
      showChip(e.dataTransfer.files[0].name);
    }
  });
  input.addEventListener("change", () => {
    if (input.files.length) showChip(input.files[0].name);
  });

  function showChip(name) {
    chip.style.display = "flex";
    chipName.textContent = name;
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const nameField = document.getElementById("cert-name").value.trim();
    const categoryField = document.getElementById("cert-category").value;
    if (!nameField) return;

    const certs = loadCerts();
    const newCert = {
      id: Date.now(),
      name: nameField,
      category: categoryField,
      date: new Date().toISOString().slice(0, 10),
      size: input.files.length ? (input.files[0].size / (1024 * 1024)).toFixed(1) + " MB" : "0.5 MB",
    };
    certs.push(newCert);
    saveCerts(certs);

    // Simulated upload — in the real AWS version this is where a
    // pre-signed S3 PUT URL would be used to stream the file to the bucket.
    successBox.style.display = "flex";
    form.reset();
    chip.style.display = "none";
    setTimeout(() => { successBox.style.display = "none"; }, 3500);
  });
}

// ---- Gallery page: render, search, filter ------------------------------
const CATEGORY_ICON = {
  Internship: "fa-briefcase",
  Academic: "fa-graduation-cap",
  Achievement: "fa-trophy",
};

function renderGallery(certs) {
  const grid = document.getElementById("cert-grid");
  if (!grid) return;
  if (!certs.length) {
    grid.innerHTML = `<p style="color:var(--text-faint);grid-column:1/-1;text-align:center;padding:40px 0;">No certificates match your search.</p>`;
    return;
  }
  grid.innerHTML = certs.map(c => `
    <div class="glass cert-card">
      <div class="cert-thumb">
        <span class="cat-tag">${c.category}</span>
        <i class="fa-solid ${CATEGORY_ICON[c.category] || "fa-file"}"></i>
      </div>
      <div class="cert-body">
        <h4>${c.name}</h4>
        <div class="cert-meta"><i class="fa-regular fa-calendar"></i> ${c.date} &nbsp;•&nbsp; ${c.size}</div>
        <div class="cert-actions">
          <button class="btn btn-ghost" onclick="alert('Preview: ${c.name.replace(/'/g, "")}\\n\\n(Preview simulated for demo — real version streams the file from a private S3 object URL.)')"><i class="fa-solid fa-eye"></i> View</button>
          <button class="btn btn-ghost" onclick="alert('Downloading ${c.name.replace(/'/g, "")}...\\n\\n(Simulated — real version uses a signed S3 GET URL.)')"><i class="fa-solid fa-download"></i></button>
          <button class="btn btn-danger" onclick="deleteCert(${c.id})"><i class="fa-solid fa-trash"></i></button>
        </div>
      </div>
    </div>
  `).join("");
}

function deleteCert(id) {
  if (!confirm("Delete this certificate? This cannot be undone.")) return;
  let certs = loadCerts();
  certs = certs.filter(c => c.id !== id);
  saveCerts(certs);
  applyGalleryFilters();
}

let activeCategory = "All";

function applyGalleryFilters() {
  const searchInput = document.getElementById("gallery-search");
  const query = searchInput ? searchInput.value.toLowerCase().trim() : "";
  let certs = loadCerts();
  if (activeCategory !== "All") certs = certs.filter(c => c.category === activeCategory);
  if (query) certs = certs.filter(c => c.name.toLowerCase().includes(query));
  renderGallery(certs);
}

function initGalleryPage() {
  const grid = document.getElementById("cert-grid");
  if (!grid) return;

  applyGalleryFilters();

  const searchInput = document.getElementById("gallery-search");
  if (searchInput) searchInput.addEventListener("input", applyGalleryFilters);

  document.querySelectorAll(".chip-filter").forEach(chip => {
    chip.addEventListener("click", () => {
      document.querySelectorAll(".chip-filter").forEach(c => c.classList.remove("active"));
      chip.classList.add("active");
      activeCategory = chip.dataset.category;
      applyGalleryFilters();
    });
  });
}

// ---- Profile page storage bar -------------------------------------------
function initProfilePage() {
  const bar = document.getElementById("storage-fill");
  if (!bar) return;
  const certs = loadCerts();
  const usedMB = certs.reduce((sum, c) => sum + parseFloat(c.size), 0);
  const percent = Math.min(100, Math.round((usedMB / 50) * 100)); // demo cap: 50 MB
  bar.style.width = percent + "%";
  const label = document.getElementById("storage-label");
  if (label) label.textContent = `${usedMB.toFixed(1)} MB of 50 MB used`;
}

// ---- Init on load ---------------------------------------------------------
document.addEventListener("DOMContentLoaded", () => {
  initNavToggle();
  initLoginForm();
  initDashboard();
  initUploadPage();
  initGalleryPage();
  initProfilePage();
});
