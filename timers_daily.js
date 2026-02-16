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
        updateTimers(); // affichage immédiat
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

      // Initialisation état si absent
      configTimers.forEach(timer => {
        if (!state[timer.id]) {
          state[timer.id] = { endTime: null };
        }
      });

      // Tri : actifs d'abord puis alphabétique
      const sortedTimers = [...configTimers].sort((a, b) => {

        const aActive = !!state[a.id].endTime;
        const bActive = !!state[b.id].endTime;

        if (aActive !== bActive) {
          return bActive - aActive;
        }

        return a.name.localeCompare(b.name, "fr", { sensitivity: "base" });
      });

      let activeSectionAdded = false;
      let inactiveSectionAdded = false;

      sortedTimers.forEach(timer => {

        const isActive = !!state[timer.id].endTime;

        if (isActive && !activeSectionAdded) {
          addSectionHeader("Timers actifs");
          activeSectionAdded = true;
        }

        if (!isActive && !inactiveSectionAdded) {
          addSectionHeader("Timers inactifs");
          inactiveSectionAdded = true;
        }

        const row = document.createElement("tr");
        row.setAttribute("data-id", timer.id);

        if (isActive) row.classList.add("active-row");

        // ----- COLONNE NOM -----
        const nameCell = document.createElement("td");
        nameCell.textContent = timer.name;

        if (isActive) {
          const badge = document.createElement("span");
          badge.textContent = "Actif";
          badge.className = "badge-active";
          nameCell.appendChild(badge);
        }

        // ----- COLONNE CONTROLE -----
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

        // ----- COLONNE COPY -----
        const copyCell = document.createElement("td");

        const copyContainer = document.createElement("div");
        copyContainer.className = "copy-container";

        const copyButton = document.createElement("button");
        copyButton.textContent = "Copier";

        copyButton.addEventListener("click", async () => {
          try {
            await navigator.clipboard.writeText(timer.coords);
            copyButton.textContent = "Copié ✔";
            setTimeout(() => {
              copyButton.textContent = "Copier";
            }, 1500);
          } catch (err) {
            alert("Impossible de copier automatiquement.");
          }
        });

        copyContainer.appendChild(copyButton);
        copyCell.appendChild(copyContainer);

        row.appendChild(nameCell);
        row.appendChild(controlCell);
        row.appendChild(copyCell);

        tableBody.appendChild(row);
      });

      saveState();
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

    function updateTimers
