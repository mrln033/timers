(function () {

  function initTimers(configUrl, storageKey) {

    const STORAGE_KEY = storageKey;
    let configTimers = [];
    let state = {};
	let rowsMap = {};

    const tableBody = document.getElementById("timersTable");
    const selectionCounter = document.getElementById("selectionCounter");
    const filterCheckbox = document.getElementById("filterSelected");

    if (!tableBody) return;

    fetch(configUrl)
      .then(res => {
        if (!res.ok) {
          throw new Error("Erreur chargement JSON");
        }
        return res.json();
      })
      .then(data => {
        configTimers = data;
        loadState();
        renderTimers();
        updateTimers();
        setInterval(updateTimers, 1000);
      })
      .catch(err => {
        console.error(err);
        tableBody.innerHTML =
          "<tr><td colspan='4'>Erreur chargement JSON</td></tr>";
      });

    function loadState() {
      const saved = localStorage.getItem(STORAGE_KEY);
      state = saved ? JSON.parse(saved) : {};

      configTimers.forEach(timer => {
        if (!state[timer.id]) {
          state[timer.id] = {
            endTime: null,
            selected: false
          };
        }
      });
    }

    function saveState() {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }

function renderTimers() {

  tableBody.innerHTML = "";
  rowsMap = {};

  const showOnlySelected = filterCheckbox.checked;

  // Séparer actifs / inactifs
  const activeTimers = [];
  const inactiveTimers = [];

  configTimers.forEach(timer => {
    if (state[timer.id].endTime) {
      activeTimers.push(timer);
    } else {
      inactiveTimers.push(timer);
    }
  });

  // Tri alphabétique FR insensible casse
  const sortByName = (a, b) =>
    a.name.localeCompare(b.name, "fr", { sensitivity: "base" });

  activeTimers.sort(sortByName);

  inactiveTimers.sort((a, b) => {

    // Sélectionnés en premier
    if (state[a.id].selected !== state[b.id].selected) {
      return state[b.id].selected - state[a.id].selected;
    }

    return sortByName(a, b);
  });

  // Affichage section actifs
  if (activeTimers.length > 0) {
    addSectionHeader("Timers actifs");
    activeTimers.forEach(addRow);
  }

  // Affichage section inactifs
  if (inactiveTimers.length > 0) {
    addSectionHeader("Timers inactifs");

    inactiveTimers.forEach(timer => {
      if (showOnlySelected && !state[timer.id].selected) return;
      addRow(timer);
    });
  }

  updateSelectionCounter();
}

    function addSectionHeader(text) {
      const row = document.createElement("tr");
      const cell = document.createElement("td");
      cell.colSpan = 4;
      cell.textContent = text;
      cell.className = "section-header";
      row.appendChild(cell);
      tableBody.appendChild(row);
    }

function addRow(timer) {

  const s = state[timer.id];
  const isActive = !!s.endTime;

  const row = document.createElement("tr");
  row.dataset.id = timer.id;

  if (isActive) row.classList.add("active-row");

  /* =========================
     COLONNE 1 — Sélection
  ========================= */

  const selectCell = document.createElement("td");
  const selectBox = document.createElement("input");
  selectBox.type = "checkbox";
  selectBox.checked = s.selected;

  selectBox.addEventListener("change", () => {
    s.selected = selectBox.checked;
    saveState();
    renderTimers();
  });

  selectCell.appendChild(selectBox);

  /* =========================
     COLONNE 2 — Nom + Info + Badge
    ========================= */

  const nameCell = document.createElement("td");

  const nameWrapper = document.createElement("div");
  nameWrapper.className = "name-wrapper";

  const nameText = document.createElement("span");
  nameText.textContent = timer.name;
  nameWrapper.appendChild(nameText);

  // Icône info
  if (timer.info) {
    const infoIcon = document.createElement("span");
    infoIcon.className = "info-icon";
    infoIcon.textContent = " 🛈";

    const tooltip = document.createElement("span");
    tooltip.className = "info-tooltip";
    tooltip.textContent = timer.info;

    infoIcon.appendChild(tooltip);
    nameWrapper.appendChild(infoIcon);
  }

  // Badge actif
  if (isActive) {
    const badge = document.createElement("span");
    badge.textContent = "Actif";
    badge.className = "badge-active";
    nameWrapper.appendChild(badge);
  }

  nameCell.appendChild(nameWrapper);

  /* =========================
     COLONNE 3 — Timer
     ========================= */

  const controlCell = document.createElement("td");
  controlCell.className = "control-cell";

  const wrapper = document.createElement("div");
  wrapper.className = "control-wrapper";

  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.checked = isActive;

  const counterSpan = document.createElement("span");
  counterSpan.className = "counter";

  checkbox.addEventListener("change", () => {
    if (checkbox.checked) {
      s.endTime = Date.now() + timer.durationHours * 3600 * 1000;
    } else {
      s.endTime = null;
    }
    saveState();
    renderTimers();
  });

  wrapper.appendChild(checkbox);
  wrapper.appendChild(counterSpan);
  controlCell.appendChild(wrapper);

  /* =========================
     COLONNE 4 — Copier
  ========================= */

  const copyCell = document.createElement("td");
  const copyButton = document.createElement("button");
  copyButton.textContent = "Copier";

  copyButton.addEventListener("click", async () => {

    const text = timer.coords;

    // API moderne
    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(text);
        feedbackSuccess();
        return;
      } catch {}
    }

    // Fallback
    try {
      const tempInput = document.createElement("textarea");
      tempInput.value = text;
      document.body.appendChild(tempInput);
      tempInput.select();
      document.execCommand("copy");
      document.body.removeChild(tempInput);
      feedbackSuccess();
      return;
    } catch {}

    alert("Copie automatique bloquée. Texte sélectionné.");
  });

  function feedbackSuccess() {
    copyButton.textContent = "Copié ✔";
    setTimeout(() => {
      copyButton.textContent = "Copier";
    }, 1500);
  }

  copyCell.appendChild(copyButton);

  /* =========================
     Assemblage
  ========================= */

  row.appendChild(selectCell);
  row.appendChild(nameCell);
  row.appendChild(controlCell);
  row.appendChild(copyCell);
rowsMap[timer.id] = {
  row: row,
  counterSpan: counterSpan
};

  tableBody.appendChild(row);
}

function updateTimers() {

  configTimers.forEach(timer => {

    const cached = rowsMap[timer.id];
    if (!cached) return;

    const counterSpan = cached.counterSpan;
    const totalDuration = timer.durationHours * 3600 * 1000;
    const s = state[timer.id];

    if (!s.endTime) {
      displayTime(counterSpan, totalDuration);
      return;
    }

    const remaining = s.endTime - Date.now();

    if (remaining <= 0) {
      s.endTime = null;
      saveState();
      renderTimers();
      return;
    }

    displayTime(counterSpan, remaining);
  });
}

    function displayTime(element, ms) {
      const totalSeconds = Math.max(0, Math.floor(ms / 1000));
      const h = Math.floor(totalSeconds / 3600);
      const m = Math.floor((totalSeconds % 3600) / 60);
      const s = totalSeconds % 60;

      element.textContent =
        `${h.toString().padStart(2, "0")}h ` +
        `${m.toString().padStart(2, "0")}m ` +
        `${s.toString().padStart(2, "0")}s`;
    }

function updateSelectionCounter() {
  const total = configTimers.length;
  const selected = configTimers.filter(t => state[t.id].selected).length;

  const newText = `Sélectionnés : ${selected} / ${total}`;

  // Premier affichage
  if (!selectionCounter.querySelector(".selection-badge")) {
    selectionCounter.innerHTML =
      `<span class="selection-badge">${newText}</span>`;
    return;
  }

  const badge = selectionCounter.querySelector(".selection-badge");

  // Si la valeur change → animation
  if (badge.textContent !== newText) {
    badge.textContent = newText;

    badge.classList.remove("updated");
    void badge.offsetWidth; // force reflow (important)
    badge.classList.add("updated");
  }
}

    filterCheckbox.addEventListener("change", renderTimers);
  }

  document.addEventListener("DOMContentLoaded", () => {
    const container = document.querySelector("[data-timers-config]");
    if (!container) return;

    initTimers(
      container.dataset.timersConfig,
      container.dataset.storageKey
    );
  });

})();