document.addEventListener("DOMContentLoaded", () => {

  const container = document.querySelector("[data-timers-config]");
  if (!container) return;

  const configUrl = container.dataset.timersConfig;
  const storageKey = container.dataset.storageKey;

  initTimers(configUrl, storageKey, container);
});

function initTimers(configUrl, storageKey, container) {

  const STORAGE_KEY = storageKey;

  const tableBody = container.querySelector("#timersTable");
  const filterCheckbox = container.querySelector("#filterSelected");
  const counterDisplay = container.querySelector("#selectionCounter");

  let configTimers = [];
  let state = {};

  fetch(configUrl)
    .then(response => response.json())
    .then(data => {
      configTimers = data;
      loadState();
      renderTimers();
    });

  function loadState() {
    const saved = localStorage.getItem(STORAGE_KEY);
    state = saved ? JSON.parse(saved) : {};

    configTimers.forEach(timer => {
      if (!state[timer.id]) {
        state[timer.id] = {
          active: false,
          selected: false
        };
      }
    });

    if (state._filterSelected === undefined) {
      state._filterSelected = false;
    }

    if (filterCheckbox) {
      filterCheckbox.checked = state._filterSelected;
    }
  }

  function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  if (filterCheckbox) {
    filterCheckbox.addEventListener("change", () => {
      state._filterSelected = filterCheckbox.checked;
      saveState();
      renderTimers();
    });
  }

  function renderTimers() {

    tableBody.innerHTML = "";

    const showOnlySelected = !!state._filterSelected;

    const activeTimers = configTimers
      .filter(t => state[t.id].active)
      .sort((a, b) => {
        if (state[a.id].selected !== state[b.id].selected) {
          return state[b.id].selected - state[a.id].selected;
        }
        return a.name.localeCompare(b.name);
      });

    const inactiveTimers = configTimers
      .filter(t => !state[t.id].active)
      .sort((a, b) => {
        if (state[a.id].selected !== state[b.id].selected) {
          return state[b.id].selected - state[a.id].selected;
        }
        return a.name.localeCompare(b.name);
      });

    if (activeTimers.length > 0) {
      addSectionTitle("ACTIFS");
      activeTimers.forEach(timer => addRow(timer));
    }

    const filteredInactive = showOnlySelected
      ? inactiveTimers.filter(t => state[t.id].selected)
      : inactiveTimers;

    if (filteredInactive.length > 0) {
      addSectionTitle("INACTIFS");
      filteredInactive.forEach(timer => addRow(timer));
    }

    updateCounter();
    saveState();
  }

  function addSectionTitle(title) {
    const row = document.createElement("tr");
    row.className = "section-title";

    const cell = document.createElement("td");
    cell.colSpan = 4;
    cell.textContent = title;

    row.appendChild(cell);
    tableBody.appendChild(row);
  }

  function addRow(timer) {

    const tr = document.createElement("tr");

    const tdSelect = document.createElement("td");
    const selectBox = document.createElement("input");
    selectBox.type = "checkbox";
    selectBox.checked = state[timer.id].selected;

    selectBox.addEventListener("change", () => {
      state[timer.id].selected = selectBox.checked;
      renderTimers();
    });

    tdSelect.appendChild(selectBox);

    const tdName = document.createElement("td");
    tdName.textContent = timer.name;

    const tdActive = document.createElement("td");
    const activeBox = document.createElement("input");
    activeBox.type = "checkbox";
    activeBox.checked = state[timer.id].active;

    activeBox.addEventListener("change", () => {
      state[timer.id].active = activeBox.checked;
      renderTimers();
    });

    tdActive.appendChild(activeBox);

    const tdCoords = document.createElement("td");
    tdCoords.textContent = timer.coordinates || "";

    tr.appendChild(tdSelect);
    tr.appendChild(tdName);
    tr.appendChild(tdActive);
    tr.appendChild(tdCoords);

    tableBody.appendChild(tr);
  }

  function updateCounter() {
    const total = configTimers.length;
    const selectedCount = configTimers.filter(t => state[t.id].selected).length;

    if (counterDisplay) {
      counterDisplay.textContent =
        `Sélectionnés : ${selectedCount} / ${total}`;
    }
  }
}
