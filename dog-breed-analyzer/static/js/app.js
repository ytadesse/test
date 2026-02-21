(() => {
  const dropZone     = document.getElementById("drop-zone");
  const fileInput    = document.getElementById("file-input");
  const previewImg   = document.getElementById("preview-img");
  const placeholder  = document.getElementById("placeholder");
  const analyzeBtn   = document.getElementById("analyze-btn");
  const clearBtn     = document.getElementById("clear-btn");
  const loadingSec   = document.getElementById("loading-section");
  const errorSec     = document.getElementById("error-section");
  const errorMsg     = document.getElementById("error-message");
  const resultsSec   = document.getElementById("results-section");

  let selectedFile = null;

  /* ---------- Drag & Drop ---------- */
  ["dragenter", "dragover"].forEach(evt =>
    dropZone.addEventListener(evt, e => { e.preventDefault(); dropZone.classList.add("dragover"); })
  );
  ["dragleave", "drop"].forEach(evt =>
    dropZone.addEventListener(evt, e => { e.preventDefault(); dropZone.classList.remove("dragover"); })
  );
  dropZone.addEventListener("drop", e => {
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  });

  fileInput.addEventListener("change", () => {
    if (fileInput.files[0]) handleFile(fileInput.files[0]);
  });

  /* ---------- File handling ---------- */
  function handleFile(file) {
    selectedFile = file;
    const reader = new FileReader();
    reader.onload = e => {
      previewImg.src = e.target.result;
      previewImg.classList.remove("hidden");
      placeholder.classList.add("hidden");
    };
    reader.readAsDataURL(file);
    analyzeBtn.disabled = false;
    clearBtn.classList.remove("hidden");
    resultsSec.classList.add("hidden");
    errorSec.classList.add("hidden");
  }

  clearBtn.addEventListener("click", () => {
    selectedFile = null;
    fileInput.value = "";
    previewImg.classList.add("hidden");
    placeholder.classList.remove("hidden");
    analyzeBtn.disabled = true;
    clearBtn.classList.add("hidden");
    resultsSec.classList.add("hidden");
    errorSec.classList.add("hidden");
  });

  /* ---------- Analyze ---------- */
  analyzeBtn.addEventListener("click", async () => {
    if (!selectedFile) return;

    loadingSec.classList.remove("hidden");
    resultsSec.classList.add("hidden");
    errorSec.classList.add("hidden");
    analyzeBtn.disabled = true;

    const formData = new FormData();
    formData.append("image", selectedFile);

    try {
      const res = await fetch("/analyze", { method: "POST", body: formData });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Something went wrong");
      renderResults(data);
    } catch (err) {
      errorMsg.textContent = err.message;
      errorSec.classList.remove("hidden");
    } finally {
      loadingSec.classList.add("hidden");
      analyzeBtn.disabled = false;
    }
  });

  /* ---------- Render ---------- */
  function renderResults(d) {
    // Breed header
    document.getElementById("res-breed").textContent   = d.breed || "Unknown";
    document.getElementById("res-tagline").textContent  = d.tagline || "";

    const confEl = document.getElementById("res-confidence");
    const conf = (d.confidence || "").toLowerCase();
    confEl.textContent = d.confidence || "";
    confEl.className = "self-start inline-block px-4 py-1.5 rounded-full text-sm font-bold ";
    if (conf === "high")        confEl.className += "bg-green-100 text-green-700";
    else if (conf === "medium") confEl.className += "bg-yellow-100 text-yellow-700";
    else                        confEl.className += "bg-red-100 text-red-700";

    // Origin
    document.getElementById("res-country").textContent = d.origin?.country || "";
    document.getElementById("res-history").textContent  = d.origin?.history || "";

    // Temperament chips
    const tempEl = document.getElementById("res-temperament");
    tempEl.innerHTML = "";
    (d.temperament || []).forEach(t => {
      const chip = document.createElement("span");
      chip.className = "px-3 py-1 rounded-full bg-bark-100 text-bark-700 text-sm font-medium";
      chip.textContent = t;
      tempEl.appendChild(chip);
    });

    // Fun facts
    const factsEl = document.getElementById("res-facts");
    factsEl.innerHTML = "";
    (d.fun_facts || []).forEach(f => {
      const li = document.createElement("li");
      li.className = "leading-relaxed";
      li.textContent = f;
      factsEl.appendChild(li);
    });

    // Famous owners
    const famousEl = document.getElementById("res-famous");
    famousEl.innerHTML = "";
    (d.famous_owners || []).forEach(o => {
      const card = document.createElement("div");
      card.className = "bg-bark-50 rounded-xl p-4";
      card.innerHTML = `
        <p class="font-bold text-bark-800">${esc(o.name)}</p>
        ${o.dog_name ? `<p class="text-xs text-bark-400 mt-0.5">Dog: ${esc(o.dog_name)}</p>` : ""}
        <p class="text-sm text-gray-600 mt-1">${esc(o.note)}</p>
      `;
      famousEl.appendChild(card);
    });

    // Pop culture
    document.getElementById("res-popculture").textContent = d.pop_culture || "";

    // Did you know
    document.getElementById("res-dyk").textContent = d.did_you_know || "";

    // Compatibility
    const compatEl = document.getElementById("res-compat");
    compatEl.innerHTML = "";
    const labels = { families: "Families", apartments: "Apartments", active_owners: "Active Owners", first_time_owners: "First-Time Owners" };
    Object.entries(d.compatibility_score || {}).forEach(([key, val]) => {
      const num = parseInt(val) || 0;
      const paws = "&#128062;".repeat(num) + '<span class="opacity-20">' + "&#128062;".repeat(5 - num) + "</span>";
      const row = document.createElement("div");
      row.className = "flex items-center justify-between bg-bark-50 rounded-xl px-4 py-3";
      row.innerHTML = `<span class="font-semibold text-bark-700 text-sm">${labels[key] || key}</span><span class="paw-rating text-lg">${paws}</span>`;
      compatEl.appendChild(row);
    });

    // Care tips
    const careEl = document.getElementById("res-care");
    careEl.innerHTML = "";
    (d.care_tips || []).forEach(tip => {
      const li = document.createElement("li");
      li.className = "leading-relaxed";
      li.textContent = tip;
      careEl.appendChild(li);
    });

    resultsSec.classList.remove("hidden");
    resultsSec.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function esc(str) {
    const d = document.createElement("div");
    d.textContent = str || "";
    return d.innerHTML;
  }
})();
