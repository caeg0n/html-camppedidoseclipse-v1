/* eslint-disable no-new-func */
(() => {
  const MENU_URL = "../menu-data.js";
  const CART_KEY = "eclipse_cart_v1";

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  function parsePriceToCents(price) {
    if (!price) return null;
    const s = String(price).trim();
    // Accept: "R$ 25,00", "R$ 18", "25", "25,50"
    const cleaned = s
      .replace(/[R$\s]/g, "")
      .replace(/\./g, "")
      .replace(",", ".");
    if (!cleaned) return null;
    const v = Number(cleaned);
    if (!Number.isFinite(v)) return null;
    return Math.round(v * 100);
  }

  function formatCentsBRL(cents) {
    const v = (cents || 0) / 100;
    return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  }

  async function loadMenuData() {
    // Cache-bust to avoid CDN surprises after admin edits.
    const url = `${MENU_URL}?ts=${Date.now()}`;
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error(`Falha ao carregar ${MENU_URL}`);
    const js = await res.text();

    // Evaluate isolated and read window.MENU_DATA set by the script.
    // We keep this page static-only (no backend).
    const prev = window.MENU_DATA;
    try {
      new Function(js)();
      const data = window.MENU_DATA;
      if (!Array.isArray(data)) throw new Error("MENU_DATA inválido");
      return data;
    } finally {
      // Keep MENU_DATA available for debugging; don't restore prev.
      void prev;
    }
  }

  function getCart() {
    try {
      const raw = sessionStorage.getItem(CART_KEY);
      if (!raw) return { items: {} };
      const data = JSON.parse(raw);
      if (!data || typeof data !== "object") return { items: {} };
      if (!data.items || typeof data.items !== "object") return { items: {} };
      return data;
    } catch {
      return { items: {} };
    }
  }

  function setCart(cart) {
    sessionStorage.setItem(CART_KEY, JSON.stringify(cart));
  }

  function cartTotals(cart) {
    let qty = 0;
    let total = 0;
    for (const k of Object.keys(cart.items || {})) {
      const it = cart.items[k];
      if (!it || !Number.isFinite(it.qty) || !Number.isFinite(it.priceCents)) continue;
      qty += it.qty;
      total += it.qty * it.priceCents;
    }
    return { qty, totalCents: total };
  }

  function bump(el, cls) {
    if (!el) return;
    el.classList.remove(cls);
    // Force reflow to restart animation.
    void el.offsetWidth;
    el.classList.add(cls);
  }

  function updateCartUI() {
    const cart = getCart();
    const { qty, totalCents } = cartTotals(cart);
    const badge = $("#cart-badge");
    badge.textContent = String(qty);
    badge.style.display = qty > 0 ? "grid" : "none";
    $("#cart-total").textContent = formatCentsBRL(totalCents);
  }

  function renderCartModal() {
    const cart = getCart();
    const body = $("#cart-body");
    const keys = Object.keys(cart.items || {});

    if (!keys.length) {
      body.innerHTML =
        '<div class="empty-cart">Seu carrinho está vazio.<br/>Adicione itens no cardápio abaixo.</div>';
      updateCartUI();
      return;
    }

    keys.sort((a, b) => {
      const ia = cart.items[a];
      const ib = cart.items[b];
      return String(ia?.name || "").localeCompare(String(ib?.name || ""), "pt-BR");
    });

    body.innerHTML = keys
      .map((k) => {
        const it = cart.items[k];
        const subtotal = (it.qty || 0) * (it.priceCents || 0);
        const desc = it.desc ? `<p>${escapeHtml(it.desc)}</p>` : "";
        return `
          <div class="cart-item" data-key="${escapeAttr(k)}">
            <div>
              <h3>${escapeHtml(it.name || "")}</h3>
              ${desc}
            </div>
            <div class="cart-line">
              <div class="cart-qty">
                <button type="button" data-act="dec" aria-label="Diminuir">-</button>
                <span aria-label="Quantidade">${Number(it.qty || 0)}</span>
                <button type="button" data-act="inc" aria-label="Aumentar">+</button>
              </div>
              <div class="cart-subtotal">${formatCentsBRL(subtotal)}</div>
            </div>
          </div>
        `;
      })
      .join("");

    updateCartUI();
  }

  function addItemToCart(item, qtyToAdd) {
    const priceCents = parsePriceToCents(item.price);
    if (!Number.isFinite(priceCents)) return;

    const qty = Math.max(1, Math.min(99, Number(qtyToAdd || 1)));
    const key = item.key;
    const cart = getCart();
    const prev = cart.items[key];
    const nextQty = (prev?.qty || 0) + qty;
    cart.items[key] = {
      name: item.name,
      desc: item.desc || "",
      priceCents,
      qty: nextQty
    };
    setCart(cart);

    bump($("#cart-open"), "is-bump");
    bump($("#cart-badge"), "is-pop");
    updateCartUI();
  }

  function setCartQty(key, qty) {
    const cart = getCart();
    const it = cart.items[key];
    if (!it) return;
    const q = Number(qty);
    if (!Number.isFinite(q)) return;
    if (q <= 0) {
      delete cart.items[key];
    } else {
      it.qty = Math.min(99, q);
    }
    setCart(cart);
    renderCartModal();
  }

  function clearCart() {
    sessionStorage.removeItem(CART_KEY);
    renderCartModal();
    updateCartUI();
  }

  function escapeHtml(s) {
    return String(s)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function escapeAttr(s) {
    return escapeHtml(s).replaceAll("`", "&#096;");
  }

  function itemKey(sectionId, groupTitle, itemName) {
    return `${sectionId}::${groupTitle || ""}::${itemName}`;
  }

  function renderItems(sectionId, groupTitle, items) {
    if (!Array.isArray(items) || !items.length) return "";
    return `
      <div class="buy-grid">
        ${items
          .map((it) => {
            const cents = parsePriceToCents(it.price);
            const hasPrice = Number.isFinite(cents);
            const key = itemKey(sectionId, groupTitle, it.name || "");
            const desc = it.desc ? `<p class="buy-desc">${escapeHtml(it.desc)}</p>` : "";
            const price = hasPrice
              ? `<span class="buy-price">${escapeHtml(it.price)}</span>`
              : `<span class="buy-price" style="opacity:.65">Sem preço</span>`;

            return `
              <div class="buy-row" data-item-key="${escapeAttr(key)}">
                <div class="buy-main">
                  <p class="buy-name">${escapeHtml(it.name || "")}</p>
                  ${desc}
                  <div class="buy-meta">${price}</div>
                </div>
                <div class="buy-controls">
                  <button
                    class="qty-btn"
                    type="button"
                    data-act="qty"
                    title="Clique para mudar a quantidade"
                  >
                    Qtd: <span class="qty-val">1</span>
                  </button>
                  <button
                    class="add-btn"
                    type="button"
                    data-act="add"
                    ${hasPrice ? "" : "disabled"}
                    aria-label="Adicionar ao carrinho"
                    title="${hasPrice ? "Adicionar ao carrinho" : "Item sem preço"}"
                  >
                    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                      <path
                        fill="currentColor"
                        d="M7.3 18.3a1.7 1.7 0 1 0 0 3.4 1.7 1.7 0 0 0 0-3.4Zm10 0a1.7 1.7 0 1 0 0 3.4 1.7 1.7 0 0 0 0-3.4ZM6.2 5.2H21a1 1 0 0 1 .98 1.2l-1.1 5.2h2.1a1 1 0 1 1 0 2h-2.6a2 2 0 0 1-1.96 1.6H9a2 2 0 0 1-1.96-1.6L5.2 3.9H2.8a1 1 0 1 1 0-2H6a1 1 0 0 1 .98.8l.22 1.5ZM8.5 12.6h10.1l.8-3.6H7.9l.6 3.6Zm9-9.1a1 1 0 0 1 1 1V6h1.6a1 1 0 1 1 0 2H18.5v1.6a1 1 0 1 1-2 0V8H15a1 1 0 1 1 0-2h1.5V4.5a1 1 0 0 1 1-1Z"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            `;
          })
          .join("")}
      </div>
    `;
  }

  function renderSection(section) {
    const groups = Array.isArray(section.groups) ? section.groups : null;
    const items = Array.isArray(section.items) ? section.items : null;

    const inner = groups
      ? groups
          .map((g) => {
            const note = g.note ? `<p class="section-note">${escapeHtml(g.note)}</p>` : "";
            const title = g.title ? `<div class="subgroup-head"><h3>${escapeHtml(g.title)}</h3></div>` : "";
            return `
              <div class="menu-subgroup">
                ${title}
                ${note}
                ${renderItems(section.id, g.title || "", g.items)}
              </div>
            `;
          })
          .join("")
      : renderItems(section.id, "", items || []);

    return `
      <section class="menu-section reveal" id="${escapeAttr(section.id)}">
        <div class="section-head">
          <h2>${escapeHtml(section.title || "")}</h2>
        </div>
        ${section.note ? `<p class="section-note">${escapeHtml(section.note)}</p>` : ""}
        ${inner}
      </section>
    `;
  }

  function buildItemIndex(menuData) {
    const map = new Map();
    for (const section of menuData) {
      if (!section || !section.id) continue;
      if (Array.isArray(section.groups)) {
        for (const g of section.groups) {
          for (const it of g.items || []) {
            const key = itemKey(section.id, g.title || "", it.name || "");
            map.set(key, { ...it, key, sectionId: section.id, groupTitle: g.title || "" });
          }
        }
      } else if (Array.isArray(section.items)) {
        for (const it of section.items) {
          const key = itemKey(section.id, "", it.name || "");
          map.set(key, { ...it, key, sectionId: section.id, groupTitle: "" });
        }
      }
    }
    return map;
  }

  function wireEvents(itemIndex) {
    document.addEventListener("click", (e) => {
      const btn = e.target.closest("button[data-act]");
      if (!btn) return;
      const act = btn.getAttribute("data-act");

      if (act === "qty") {
        const row = btn.closest(".buy-row");
        if (!row) return;
        const valEl = $(".qty-val", btn);
        const cur = Number(valEl?.textContent || 1);
        const next = cur >= 9 ? 1 : cur + 1;
        valEl.textContent = String(next);
        return;
      }

      if (act === "add") {
        const row = btn.closest(".buy-row");
        if (!row) return;
        const key = row.getAttribute("data-item-key");
        const item = itemIndex.get(key);
        if (!item) return;
        const qty = Number($(".qty-val", row)?.textContent || 1);
        addItemToCart(item, qty);
        return;
      }
    });

    $("#cart-open").addEventListener("click", () => {
      renderCartModal();
      $("#cart-dialog").showModal();
    });

    $("#cart-clear").addEventListener("click", () => {
      clearCart();
    });

    $("#cart-body").addEventListener("click", (e) => {
      const btn = e.target.closest("button[data-act]");
      if (!btn) return;
      const itemEl = e.target.closest(".cart-item");
      if (!itemEl) return;
      const key = itemEl.getAttribute("data-key");
      const cart = getCart();
      const it = cart.items[key];
      if (!it) return;

      const act = btn.getAttribute("data-act");
      if (act === "inc") setCartQty(key, (it.qty || 0) + 1);
      if (act === "dec") setCartQty(key, (it.qty || 0) - 1);
    });

    // Escape closes; clicking outside also closes. Keep UI in sync after close.
    $("#cart-dialog").addEventListener("close", () => {
      updateCartUI();
    });

    // Keyboard shortcut: "c" opens cart.
    document.addEventListener("keydown", (e) => {
      if (e.key.toLowerCase() === "c" && !e.metaKey && !e.ctrlKey && !e.altKey) {
        const dlg = $("#cart-dialog");
        if (!dlg.open) {
          renderCartModal();
          dlg.showModal();
          e.preventDefault();
        }
      }
    });
  }

  function initReveal() {
    const els = $$(".reveal");
    if (!els.length) return;
    if (!("IntersectionObserver" in window)) {
      els.forEach((el) => el.classList.add("show"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add("show");
            io.unobserve(e.target);
          }
        }
      },
      { threshold: 0.12 }
    );
    els.forEach((el) => io.observe(el));
  }

  async function main() {
    updateCartUI();

    let menuData;
    try {
      menuData = await loadMenuData();
    } catch (err) {
      $("#menu-root").innerHTML = `
        <section class="menu-section">
          <div class="section-head"><h2>Compras</h2></div>
          <p class="item-desc">Não foi possível carregar o cardápio agora.</p>
        </section>
      `;
      // eslint-disable-next-line no-console
      console.error(err);
      return;
    }

    const nav = $("#menu-nav");
    nav.innerHTML = menuData
      .map((s) => `<a class="menu-chip" href="#${escapeAttr(s.id)}">${escapeHtml(s.title || s.id)}</a>`)
      .join("");

    const root = $("#menu-root");
    root.innerHTML = menuData.map(renderSection).join("");

    const itemIndex = buildItemIndex(menuData);
    wireEvents(itemIndex);
    updateCartUI();
    initReveal();
  }

  main();
})();
