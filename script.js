const menuData = Array.isArray(window.MENU_DATA) ? window.MENU_DATA : [];

function parsePriceToNumber(price) {
  if (!price) return Number.POSITIVE_INFINITY;
  const normalized = String(price)
    .replace(/[^\d,.-]/g, "")
    .replace(/\./g, "")
    .replace(",", ".");
  const value = Number(normalized);
  return Number.isFinite(value) ? value : Number.POSITIVE_INFINITY;
}

function sortItemsIfNeeded(items, sortByPrice) {
  if (!Array.isArray(items)) return [];
  if (!sortByPrice) return items;
  return [...items].sort((a, b) => parsePriceToNumber(a.price) - parsePriceToNumber(b.price));
}

function renderItems(items, sortByPrice = false) {
  const finalItems = sortItemsIfNeeded(items, sortByPrice);
  return `
    <div class="menu-grid">
      ${finalItems
        .map(
          (item) => `
          <article class="item">
            <div class="item-top">
              <h3 class="item-name">${item.name}</h3>
              ${item.price ? `<span class="price">${item.price}</span>` : ""}
            </div>
            ${item.desc ? `<p class="item-desc">${item.desc}</p>` : ""}
          </article>
        `
        )
        .join("")}
    </div>
  `;
}

function renderSectionContent(section) {
  if (Array.isArray(section.groups) && section.groups.length) {
    return section.groups
      .map(
        (group) => `
        <div class="menu-subgroup">
          <div class="subgroup-head">
            <h3>${group.title}</h3>
            ${group.note ? `<p class="section-note">${group.note}</p>` : ""}
          </div>
          ${renderItems(group.items, section.sortByPrice || group.sortByPrice)}
        </div>
      `
      )
      .join("");
  }
  return renderItems(section.items, section.sortByPrice);
}

function renderMenu() {
  const nav = document.getElementById("menu-nav");
  const root = document.getElementById("menu-root");

  if (!menuData.length) {
    nav.innerHTML = "";
    root.innerHTML = `<section class="menu-section"><div class="section-head"><h2>Cardápio</h2></div><p class="item-desc">Nenhum dado encontrado em <strong>menu-data.js</strong>.</p></section>`;
    return;
  }

  nav.innerHTML = menuData
    .map((section) => `<a class="menu-chip" href="#${section.id}">${section.title}</a>`)
    .join("");

  root.innerHTML = menuData
    .map(
      (section) => `
      <section class="menu-section reveal" id="${section.id}">
        <div class="section-head">
          <h2>${section.title}</h2>
          ${section.note ? `<p class="section-note">${section.note}</p>` : ""}
        </div>
        ${renderSectionContent(section)}
      </section>
    `
    )
    .join("");
}

function setupReveal() {
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("show");
          io.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 }
  );

  document.querySelectorAll(".reveal").forEach((el) => io.observe(el));
}

renderMenu();
setupReveal();
