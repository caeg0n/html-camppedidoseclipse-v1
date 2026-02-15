const menuData = Array.isArray(window.MENU_DATA) ? window.MENU_DATA : [];

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
        <div class="menu-grid">
          ${section.items
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
