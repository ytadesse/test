const dropZone = document.getElementById("drop-zone");
const fileInput = document.getElementById("file-input");
const browseLink = document.getElementById("browse-link");
const previewWrap = document.getElementById("preview-wrap");
const previewImg = document.getElementById("preview-img");
const changeBtn = document.getElementById("change-btn");
const analyzeBtn = document.getElementById("analyze-btn");
const loader = document.getElementById("loader");
const loaderMsg = document.getElementById("loader-msg");
const results = document.getElementById("results");
const errorBox = document.getElementById("error-box");
const uploadSec = document.getElementById("upload-section");

let selectedFile = null;

const loadingQuips = [
  "Consulting the ancient scrolls of dog breeds\u2026",
  "Sniffing for clues\u2026",
  "Asking Gemini to fetch the answer\u2026",
  "Cross-referencing 400 breeds\u2026",
  "Checking paw prints\u2026",
  "Almost there \u2014 good boy!",
];

let quipInterval;

function showPreview(file) {
  selectedFile = file;
  const url = URL.createObjectURL(file);
  previewImg.src = url;
  previewWrap.style.display = "block";
  dropZone.style.display = "none";
  analyzeBtn.style.display = "block";
  errorBox.style.display = "none";
}

function resetToUpload() {
  selectedFile = null;
  previewWrap.style.display = "none";
  dropZone.style.display = "block";
  analyzeBtn.style.display = "none";
  results.style.display = "none";
  loader.style.display = "none";
  uploadSec.style.display = "block";
  errorBox.style.display = "none";
  fileInput.value = "";
}

browseLink.addEventListener("click", () => fileInput.click());
dropZone.addEventListener("click", () => fileInput.click());

fileInput.addEventListener("change", () => {
  if (fileInput.files[0]) showPreview(fileInput.files[0]);
});

dropZone.addEventListener("dragover", e => {
  e.preventDefault();
  dropZone.classList.add("dragging");
});

dropZone.addEventListener("dragleave", () => dropZone.classList.remove("dragging"));

dropZone.addEventListener("drop", e => {
  e.preventDefault();
  dropZone.classList.remove("dragging");
  const file = e.dataTransfer.files[0];
  if (file && file.type.startsWith("image/")) showPreview(file);
});

changeBtn.addEventListener("click", resetToUpload);
document.getElementById("retry-btn").addEventListener("click", resetToUpload);

analyzeBtn.addEventListener("click", async () => {
  if (!selectedFile) return;

  uploadSec.style.display = "none";
  results.style.display = "none";
  loader.style.display = "block";
  errorBox.style.display = "none";
  analyzeBtn.disabled = true;

  let q = 0;
  loaderMsg.textContent = loadingQuips[q];
  quipInterval = setInterval(() => {
    q = (q + 1) % loadingQuips.length;
    loaderMsg.textContent = loadingQuips[q];
  }, 2200);

  const formData = new FormData();
  formData.append("image", selectedFile);

  try {
    const res = await fetch("/analyze", { method: "POST", body: formData });
    const data = await res.json();
    clearInterval(quipInterval);

    if (!res.ok || data.error) {
      showError(data.error || "Something went wrong.");
      return;
    }

    renderResults(data);
  } catch (err) {
    clearInterval(quipInterval);
    showError("Network error \u2014 please try again.");
  } finally {
    analyzeBtn.disabled = false;
  }
});

function showError(msg) {
  loader.style.display = "none";
  uploadSec.style.display = "block";
  errorBox.textContent = "\u26a0\ufe0f " + msg;
  errorBox.style.display = "block";
  previewWrap.style.display = "block";
  dropZone.style.display = "none";
  analyzeBtn.style.display = "block";
}

function esc(str) {
  const el = document.createElement("div");
  el.textContent = str || "";
  return el.innerHTML;
}

function renderResults(d) {
  loader.style.display = "none";

  // Confidence badge
  const confEl = document.getElementById("confidence-badge");
  confEl.textContent = (d.confidence || "high").toUpperCase() + " CONFIDENCE";
  confEl.className = "confidence-badge conf-" + (d.confidence || "high").toLowerCase();

  // Breed name & tagline
  document.getElementById("breed-name").textContent = d.breed || "Unknown";
  document.getElementById("breed-tagline").textContent = d.tagline || "";

  // Celebrity lookalike
  if (d.celeb_lookalike) {
    document.getElementById("lookalike-text").textContent = "Personality twin: " + d.celeb_lookalike;
    document.getElementById("lookalike-chip").style.display = "inline-flex";
  } else {
    document.getElementById("lookalike-chip").style.display = "none";
  }

  // Origin
  const o = d.origin || {};
  document.getElementById("origin-country").textContent = (o.country || "") + (o.country ? " \ud83c\udf0d" : "");
  document.getElementById("origin-era").textContent = o.era || "";
  document.getElementById("origin-story").textContent = o.story || "";

  // Personality traits
  const traitsEl = document.getElementById("traits");
  traitsEl.innerHTML = (d.personality_traits || [])
    .map(t => '<span class="trait-pill">' + esc(t) + "</span>").join("");

  // Ratings
  const ratingsEl = document.getElementById("ratings");
  const ratingMap = [
    { key: "energy", label: "Energy", emoji: "\u26a1" },
    { key: "friendliness", label: "Friendliness", emoji: "\ud83e\udd1d" },
    { key: "trainability", label: "Trainability", emoji: "\ud83c\udf93" },
    { key: "fluffiness", label: "Fluffiness", emoji: "\u2601\ufe0f" },
  ];

  ratingsEl.innerHTML = ratingMap.map(function (r) {
    const val = (d.ratings || {})[r.key] || 5;
    return '<div class="rating-row">' +
      '<div class="rating-label"><span>' + r.emoji + " " + r.label + "</span><span>" + val + "/10</span></div>" +
      '<div class="bar-track"><div class="bar-fill" data-width="' + (val * 10) + '"></div></div>' +
      "</div>";
  }).join("");

  // Fun facts
  const factsEl = document.getElementById("facts-grid");
  factsEl.innerHTML = (d.fun_facts || []).map(function (f, i) {
    return '<div class="fact-card"><div class="fact-num">' + (i + 1) + '</div><div class="fact-text">' + esc(f) + "</div></div>";
  }).join("");

  // Famous owners
  const ownersEl = document.getElementById("owners-grid");
  ownersEl.innerHTML = (d.famous_owners || []).map(function (o) {
    return '<div class="owner-card"><div class="owner-name">\ud83d\udc51 ' + esc(o.name) + '</div><div class="owner-note">' + esc(o.note) + "</div></div>";
  }).join("");

  results.style.display = "block";
  results.scrollIntoView({ behavior: "smooth", block: "start" });

  // Animate rating bars after a brief delay
  setTimeout(function () {
    document.querySelectorAll(".bar-fill").forEach(function (bar) {
      bar.style.width = bar.dataset.width + "%";
    });
  }, 120);
}
