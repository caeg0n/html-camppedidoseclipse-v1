async function loadMenuData() {
  // Prefer a fresh copy from the network (GitHub Pages CDN can cache script tags).
  // Fallback to window.MENU_DATA for local file:// usage.
  try {
    const res = await fetch(`menu-data.js?ts=${Date.now()}`, { cache: "no-store" });
    if (!res.ok) throw new Error("Failed to fetch menu-data.js");
    const code = await res.text();
    const sandboxWindow = {};
    const data = new Function("window", `${code}\nreturn window.MENU_DATA;`)(sandboxWindow);
    if (Array.isArray(data)) return data;
  } catch (_err) {
    // ignore
  }
  return Array.isArray(window.MENU_DATA) ? window.MENU_DATA : [];
}

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

function renderMenu(menuData) {
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

async function init() {
  const menuData = await loadMenuData();
  renderMenu(menuData);
  setupReveal();
}

function installCapacitorRootBackToCore() {
  const cap = window.Capacitor;
  const appPlugin = cap?.Plugins?.App;
  if (!appPlugin || typeof appPlugin.addListener !== "function") return;
  const platform = typeof cap?.getPlatform === "function" ? cap.getPlatform() : "";
  if (String(platform).toLowerCase() === "android") return;

  const coreSlug = "html-camppedidoscore-v1";
  const coreUrl = "https://caeg0n.github.io/html-camppedidoscore-v1/";
  const pathParts = () => (window.location.pathname || "/").split("/").filter(Boolean);
  const projectSlug = pathParts()[0] || "";
  const isProjectRoot = () => {
    const parts = pathParts();
    const pagePart = parts[1] || "";
    return parts.length === 1 || (parts.length === 2 && pagePart.toLowerCase() === "index.html");
  };
  const projectRootUrl = `${window.location.origin}/${projectSlug}/`;

  if (!projectSlug || !projectSlug.startsWith("html-") || projectSlug === coreSlug) return;

  let redirected = false;
  const navigateTo = (url) => {
    if (redirected) return;
    redirected = true;
    window.location.href = url;
  };
  const goCore = () => navigateTo(coreUrl);
  const goProjectRoot = () => navigateTo(projectRootUrl);
  const handleBack = () => {
    if (isProjectRoot()) {
      goCore();
      return;
    }
    goProjectRoot();
  };

  try {
    history.replaceState({ ...(history.state || {}), __camppBackBase: true }, document.title, window.location.href);
    history.pushState({ ...(history.state || {}), __camppBackSentinel: true }, document.title, window.location.href);
  } catch (_err) {
    // no-op
  }

  window.addEventListener("popstate", (event) => {
    if (event.state && event.state.__camppBackBase === true) {
      handleBack();
    }
  });

  document.addEventListener(
    "backbutton",
    (event) => {
      event.preventDefault();
      handleBack();
    },
    { passive: false }
  );

  appPlugin.addListener("backButton", ({ canGoBack }) => {
    if (canGoBack && !isProjectRoot()) {
      window.history.back();
      setTimeout(() => {
        if (!isProjectRoot()) goProjectRoot();
      }, 120);
      return;
    }
    handleBack();
  });
}

installCapacitorRootBackToCore();
init();
