(function () {

  function initTimers(configUrl, storageKey) {

    const STORAGE_KEY = storageKey;
    let configTimers = [];
    let state = {};

    const tableBody = document.getElementById("timersTable");

    if (!tableBody) {
      console.error("Element #timersTable introuvable.");
      return;
    }

    fetch(configUrl)
      .then(res => res.json())
      .then(data => {
        configTimers = data;
        loadState();
        renderTimers();
        setInterval(updateTimers, 1000);
      });

    function loadState() {
      const saved = localStorage.getItem(STORAGE_KEY);
      state = saved ? JSON.parse(saved) : {};
    }

    function saveState() {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }

function renderTimers() {

  tableBody.innerHTML = "";

  configTimers.forEach(timer => {
    if (!state[timer.id]) {
      state[timer.id] = {
        endTime: null,
        selected: false
      };
    }

    if (state[timer.id].selected === undefined) {
      state[timer.id].selected = false;
    }
  });

  const sortedTimers = [...configTimers].sort((a, b) => {

    const aActive = !!state[a.id].endTime;
    const bActive = !!state[b.id].endTime;

    // 🔵 Actifs en premier
    if (aActive !== bActive) {
      return bActive - aActive;
    }

    // 🟢 Si ACTIFS → tri nom uniquement
    if (aActive && bActive) {
      return a.name.localeCompare(b.name, "fr", { sensitivity: "base" });
    }

    // ⚪ Si INACTIFS → tri sélection puis nom
    const aSelected = !!state[a.id].selected;
    const bSelected = !!state[b.id].selected;

    if (aSelected !== bSelected) {
      return bSelected - aSelected;
    }

    return a.name.localeCompare(b.name, "fr", { sensitivity: "base" });
  });

  let activeSectionAdded = false;
  let inactiveSectionAdded = false;

  sortedTimers.forEach(timer => {

    const isActive = !!state[timer.id].endTime;
    const isSelected = !!state[timer.id].selected;

    if (isActive && !activeSectionAdded) {
      addSectionHeader("Timers actifs");
      activeSectionAdded = true;
    }

    if (!isActive && !inactiveSectionAdded) {
      addSectionHeader("Timers inactifs");
      inactiveSectionAdded = true;
    }

    const row = document.createElement("tr");
    if (isActive) row.classList.add("active-row");

    // ✅ COLONNE 1 — Sélection
    const selectCell = document.createElement("td");
    const selectCheckbox = document.createElement("input");
    selectCheckbox.type = "checkbox";
    selectCheckbox.checked = isSelected;

    selectCheckbox.addEventListener("change", () => {
      state[timer.id].selected = selectCheckbox.checked;
      saveState();
      renderTimers(); // re-tri immédiat
    });

    selectCell.appendChild(selectCheckbox);

    // ✅ COLONNE 2 — Nom
    const nameCell = document.createElement("td");
    nameCell.textContent = timer.name;

    if (isActive) {
      const badge = document.createElement("span");
      badge.textContent = " Actif";
      badge.className = "badge-active";
      nameCell.appendChild(badge);
    }

    // ✅ COLONNE 3 — Actif / compteur
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
        state[timer.id].endTime =
          Date.now() + timer.durationHours * 3600 * 1000;
      } else {
        state[timer.id].endTime = null;
      }
      saveState();
      renderTimers();
    });

    wrapper.appendChild(checkbox);
    wrapper.appendChild(counterSpan);
    controlCell.appendChild(wrapper);

    // ✅ COLONNE 4 — Copier
    const copyCell = document.createElement("td");

    const copyContainer = document.createElement("div");
    copyContainer.className = "copy-container";

    const copyButton = document.createElement("button");
    copyButton.textContent = "Copier";

    const hiddenInput = document.createElement("input");
    hiddenInput.type = "text";
    hiddenInput.value = timer.coords;
    hiddenInput.className = "copy-input";
    hiddenInput.style.display = "none";

    copyButton.addEventListener("click", () => {
      hiddenInput.style.display = "block";
      hiddenInput.focus();
      hiddenInput.select();
    });

    copyContainer.appendChild(copyButton);
    copyContainer.appendChild(hiddenInput);
    copyCell.appendChild(copyContainer);

    row.appendChild(selectCell);
    row.appendChild(nameCell);
    row.appendChild(controlCell);
    row.appendChild(copyCell);

    tableBody.appendChild(row);

    timer._elements = { checkbox, counterSpan };
  });

  saveState();
  updateTimers();
}

    function addSectionHeader(text) {
      const row = document.createElement("tr");
      const cell = document.createElement("td");
      cell.colSpan = 3;
      cell.textContent = text;
      cell.className = "section-header";
      row.appendChild(cell);
      tableBody.appendChild(row);
    }

    function updateTimers() {
      configTimers.forEach(timer => {

        const s = state[timer.id];
        const elements = timer._elements;

        const totalDuration = timer.durationHours * 3600 * 1000;

        if (!s.endTime) {
          displayTime(elements.counterSpan, totalDuration);
          return;
        }

        const remaining = s.endTime - Date.now();

        if (remaining <= 0) {
          s.endTime = null;
          saveState();
          displayTime(elements.counterSpan, totalDuration);
          renderTimers();
          return;
        }

        displayTime(elements.counterSpan, remaining);
      });
    }

    function displayTime(element, ms) {
      const hours = Math.floor(ms / (1000 * 60 * 60));
      const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((ms % (1000 * 60)) / 1000);
      element.textContent = `${hours}h ${minutes}m ${seconds}s`;
    }
  }

  // 🔹 Auto-initialisation via data-attributes
  document.addEventListener("DOMContentLoaded", () => {
    const container = document.querySelector("[data-timers-config]");
    if (!container) return;

    const configUrl = container.dataset.timersConfig;
    const storageKey = container.dataset.storageKey;

    initTimers(configUrl, storageKey);
  });

})();
