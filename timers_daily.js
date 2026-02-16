(function () {

  function initTimers(configUrl, storageKey) {

    const STORAGE_KEY = storageKey;
    let configTimers = [];
    let state = {};

    const tableBody = document.getElementById("timersTable");
    const selectionCounter = document.getElementById("selectionCounter");
    const filterCheckbox = document.getElementById("filterSelected");

    if (!tableBody) return;

    fetch(configUrl)
      .then(res => res.json())
      .then(data => {
        configTimers = data;
        loadState();
        renderTimers();
        updateTimers();
        setInterval(updateTimers, 1000);
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

      const showOnlySelected = filterCheckbox.checked;

      const activeTimers = configTimers
        .filter(t => !!state[t.id].endTime)
        .sort((a, b) =>
          a.name.localeCompare(b.name, "fr", { sensitivity: "base" })
        );

      const inactiveTimers = configTimers
        .filter(t => !state[t.id].endTime)
        .sort((a, b) => {

          if (state[a.id].selected !== state[b.id].selected) {
            return state[b.id].selected - state[a.id].selected;
          }

          return a.name.localeCompare(b.name, "fr", { sensitivity: "base" });
        });

      if (activeTimers.length > 0) {
        addSectionHeader("Timers actifs");
        activeTimers.forEach(timer => addRow(timer, false));
      }

      if (inactiveTimers.length > 0) {
        addSectionHeader("Timers inactifs");
        inactiveTimers.forEach(timer => {

          if (showOnlySelected && !state[timer.id].selected) return;

          addRow(timer, true);
        });
      }

      updateSelectionCounter();
      saveState();
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

    function addRow(timer, isInactiveSection) {

      const isActive = !!state[timer.id].endTime;

      const row = document.createElement("tr");
      row.setAttribute("data-id", timer.id);

      if (isActive) row.classList.add("active-row");

      // ----- Sélection
      const selectCell = document.createElement("td");
      const selectBox = document.createElement("input");
      selectBox.type = "checkbox";
      selectBox.checked = state[timer.id].selected;

      selectBox.addEventListener("change", () => {
        state[timer.id].selected = selectBox.checked;
        saveState();
        renderTimers();
      });

      selectCell.appendChild(selectBox);

      // ----- Nom
      const nameCell = document.createElement("td");
      nameCell.textContent = timer.name;

      if (isActive) {
        const badge = document.createElement("span");
        badge.textContent = "Actif";
        badge.className = "badge-active";
        nameCell.appendChild(badge);
      }

      // ----- Timer
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

      // ----- Copier
      const copyCell = document.createElement("td");
      const copyButton = document.createElement("button");
      copyButton.textContent = "Copier";

      copyButton.addEventListener("click", async () => {
        try {
          await navigator.clipboard.writeText(timer.coords);
          copyButton.textContent = "Copié ✔";
          setTimeout(() => copyButton.textContent = "Copier", 1500);
        } catch {
          alert("Impossible de copier.");
        }
      });

      copyCell.appendChild(copyButton);

      row.appendChild(selectCell);
      row.appendChild(nameCell);
      row.appendChild(controlCell);
      row.appendChild(copyCell);

      tableBody.appendChild(row);
    }

    function updateTimers() {

      configTimers.forEach(timer => {

        const row = tableBody.querySelector(`tr[data-id="${timer.id}"]`);
        if (!row) return;

        const counterSpan = row.querySelector(".counter");
        if (!counterSpan) return;

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
      selectionCounter.textContent = `Sélectionnés : ${selected} / ${total}`;
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
