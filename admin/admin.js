const initialData = Array.isArray(window.MENU_DATA) ? window.MENU_DATA : [];
let state = JSON.parse(JSON.stringify(initialData));

const editor = document.getElementById("editor");
const saveDraftBtn = document.getElementById("save-draft");
const loadDraftBtn = document.getElementById("load-draft");
const exportBtn = document.getElementById("export-file");

function render() {
  editor.innerHTML = state
    .map((section, sectionIndex) => {
      const hasGroups = Array.isArray(section.groups);
      return `
      <section class="section-card">
        <div class="section-head">
          <h2>${section.title}</h2>
          <div class="section-controls">
            <label class="toggle">
              <input type="checkbox" data-action="toggle-sort" data-section="${sectionIndex}" ${
                section.sortByPrice ? "checked" : ""
              } />
              Ordenar por preço
            </label>
          </div>
        </div>
        <div class="field-row">
          <input type="text" value="${section.title}" placeholder="Título" data-action="section-title" data-section="${sectionIndex}" />
          <input type="text" value="${section.note || ""}" placeholder="Observação" data-action="section-note" data-section="${sectionIndex}" />
          <input type="text" value="${section.id}" placeholder="ID" data-action="section-id" data-section="${sectionIndex}" />
        </div>
        <div class="items">
          ${hasGroups ? renderGroups(section, sectionIndex) : renderItems(section.items || [], sectionIndex)}
        </div>
        <div class="item-actions">
          <button class="btn" data-action="add-item" data-section="${sectionIndex}">Adicionar item</button>
        </div>
      </section>
    `;
    })
    .join("");
}

function renderGroups(section, sectionIndex) {
  return section.groups
    .map((group, groupIndex) => {
      return `
      <div class="group-card">
        <div class="group-head">
          <h3>${group.title}</h3>
          <button class="btn btn-ghost" data-action="remove-group" data-section="${sectionIndex}" data-group="${groupIndex}">Remover grupo</button>
        </div>
        <div class="field-row">
          <input type="text" value="${group.title}" placeholder="Título do grupo" data-action="group-title" data-section="${sectionIndex}" data-group="${groupIndex}" />
          <input type="text" value="${group.note || ""}" placeholder="Observação" data-action="group-note" data-section="${sectionIndex}" data-group="${groupIndex}" />
          <span></span>
        </div>
        ${renderItems(group.items || [], sectionIndex, groupIndex)}
        <div class="item-actions">
          <button class="btn" data-action="add-item" data-section="${sectionIndex}" data-group="${groupIndex}">Adicionar item</button>
        </div>
      </div>
    `;
    })
    .join("");
}

function renderItems(items, sectionIndex, groupIndex = null) {
  return items
    .map((item, itemIndex) => {
      return `
      <div class="item-row">
        <div class="field-row">
          <input type="text" value="${item.name || ""}" placeholder="Nome" data-action="item-name" data-section="${sectionIndex}" data-group="${groupIndex}" data-item="${itemIndex}" />
          <input type="text" value="${item.price || ""}" placeholder="Preço" data-action="item-price" data-section="${sectionIndex}" data-group="${groupIndex}" data-item="${itemIndex}" />
          <textarea placeholder="Descrição" data-action="item-desc" data-section="${sectionIndex}" data-group="${groupIndex}" data-item="${itemIndex}">${item.desc || ""}</textarea>
        </div>
        <div class="item-actions">
          <button class="btn btn-ghost" data-action="remove-item" data-section="${sectionIndex}" data-group="${groupIndex}" data-item="${itemIndex}">Remover</button>
        </div>
      </div>
    `;
    })
    .join("");
}

function getTarget(sectionIndex, groupIndex) {
  const section = state[sectionIndex];
  if (groupIndex !== null && groupIndex !== "null") {
    return section.groups[groupIndex].items;
  }
  return section.items;
}

function handleInput(event) {
  const target = event.target;
  const action = target.dataset.action;
  const sectionIndex = Number(target.dataset.section);
  const groupIndex = target.dataset.group !== undefined ? target.dataset.group : null;
  const itemIndex = target.dataset.item !== undefined ? Number(target.dataset.item) : null;

  if (action === "toggle-sort") {
    state[sectionIndex].sortByPrice = target.checked;
    return;
  }

  if (action === "section-title") {
    state[sectionIndex].title = target.value;
  }
  if (action === "section-note") {
    state[sectionIndex].note = target.value;
  }
  if (action === "section-id") {
    state[sectionIndex].id = target.value;
  }

  if (action === "group-title") {
    state[sectionIndex].groups[groupIndex].title = target.value;
  }
  if (action === "group-note") {
    state[sectionIndex].groups[groupIndex].note = target.value;
  }

  if (action === "item-name") {
    getTarget(sectionIndex, groupIndex)[itemIndex].name = target.value;
  }
  if (action === "item-price") {
    getTarget(sectionIndex, groupIndex)[itemIndex].price = target.value;
  }
  if (action === "item-desc") {
    getTarget(sectionIndex, groupIndex)[itemIndex].desc = target.value;
  }
}

function handleClick(event) {
  const action = event.target.dataset.action;
  if (!action) return;

  const sectionIndex = Number(event.target.dataset.section);
  const groupIndex = event.target.dataset.group !== undefined ? event.target.dataset.group : null;
  const itemIndex = event.target.dataset.item !== undefined ? Number(event.target.dataset.item) : null;

  if (action === "add-item") {
    const list = getTarget(sectionIndex, groupIndex);
    list.push({ name: "", price: "", desc: "" });
    render();
  }

  if (action === "remove-item") {
    const list = getTarget(sectionIndex, groupIndex);
    list.splice(itemIndex, 1);
    render();
  }

  if (action === "remove-group") {
    state[sectionIndex].groups.splice(groupIndex, 1);
    render();
  }
}

function exportFile() {
  const content = `window.MENU_DATA = ${JSON.stringify(state, null, 2)};\n`;
  const blob = new Blob([content], { type: "application/javascript" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "menu-data.js";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function saveDraft() {
  localStorage.setItem("menuDataDraft", JSON.stringify(state));
}

function loadDraft() {
  const draft = localStorage.getItem("menuDataDraft");
  if (!draft) return;
  state = JSON.parse(draft);
  render();
}

editor.addEventListener("input", handleInput);
editor.addEventListener("click", handleClick);

exportBtn.addEventListener("click", exportFile);
saveDraftBtn.addEventListener("click", saveDraft);
loadDraftBtn.addEventListener("click", loadDraft);

render();
