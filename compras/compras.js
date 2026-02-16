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

  function pickEmoji(name) {
    const n = String(name || "").toLowerCase();
    if (n.includes("pizza")) return "🍕";
    if (n.includes("hamb") || n.includes("x-") || n.includes("x ")) return "🍔";
    if (n.includes("batata")) return "🍟";
    if (n.includes("refrigerante") || n.includes("coca") || n.includes("guaraná")) return "🥤";
    if (n.includes("suco")) return "🧃";
    if (n.includes("cerveja")) return "🍺";
    if (n.includes("porção") || n.includes("porcao")) return "🍗";
    if (n.includes("frango")) return "🍗";
    if (n.includes("caldo")) return "🍲";
    if (n.includes("sandu")) return "🥪";
    if (n.includes("molho")) return "🥫";
    return "🍽️";
  }

  function buildWhatsAppMessage(cart) {
    const keys = Object.keys(cart.items || {});
    if (!keys.length) return "";

    const lines = ["Olá! 👋", "Pedido para Eclipse Lanchonete e Pizzaria", ""];
    keys.sort((a, b) => {
      const ia = cart.items[a];
      const ib = cart.items[b];
      return String(ia?.name || "").localeCompare(String(ib?.name || ""), "pt-BR");
    });

    for (const k of keys) {
      const it = cart.items[k];
      const subtotal = (it.qty || 0) * (it.priceCents || 0);
      const emoji = pickEmoji(it.name);
      lines.push(`${it.qty}x ${it.name} ${emoji} - ${formatCentsBRL(subtotal)}`);
    }

    const totals = cartTotals(cart);
    lines.push("");
    lines.push(`Total: ${formatCentsBRL(totals.totalCents)}`);
    lines.push("");
    lines.push("Endereço:");
    lines.push("Forma de pagamento:");
    lines.push("");
    lines.push("Obrigado!");

    return lines.join("\n");
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
    const waBtn = $("#cart-whatsapp");
    if (waBtn) waBtn.disabled = qty === 0;
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

  function addItemToCart(item, qtyToAdd, overrides = {}) {
    const priceCents =
      Number.isFinite(overrides.priceCents) ? overrides.priceCents : parsePriceToCents(item.price);
    if (!Number.isFinite(priceCents)) return;

    const qty = Math.max(1, Math.min(99, Number(qtyToAdd || 1)));
    const key = overrides.key || item.key;
    const cart = getCart();
    const prev = cart.items[key];
    const nextQty = (prev?.qty || 0) + qty;
    cart.items[key] = {
      name: overrides.name || item.name,
      desc: overrides.desc || item.desc || "",
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

  function renderItems(sectionId, groupTitle, items, sortByPrice) {
    if (!Array.isArray(items) || !items.length) return "";
    const finalItems = sortItemsIfNeeded(items, sortByPrice);
    return `
      <div class="menu-grid">
        ${finalItems
          .map((it) => {
            const cents = parsePriceToCents(it.price);
            const hasPrice = Number.isFinite(cents);
            const key = itemKey(sectionId, groupTitle, it.name || "");
            const desc = it.desc ? `<p class="item-desc">${escapeHtml(it.desc)}</p>` : "";
            const price = hasPrice && it.price ? `<span class="price">${escapeHtml(it.price)}</span>` : "";

            return `
              <article class="item" data-item-key="${escapeAttr(key)}">
                <div class="item-top">
                  <h3 class="item-name">${escapeHtml(it.name || "")}</h3>
                  ${price}
                </div>
                ${desc}
                ${hasPrice ? "" : `<p class="item-desc">Sem preço</p>`}
              </article>
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
                ${renderItems(section.id, g.title || "", g.items, section.sortByPrice || g.sortByPrice)}
              </div>
            `;
          })
          .join("")
      : renderItems(section.id, "", items || [], section.sortByPrice);

    return `
      <section class="menu-section reveal" id="${escapeAttr(section.id)}">
        <div class="section-head">
          <h2>${escapeHtml(section.title || "")}</h2>
          ${section.note ? `<p class="section-note">${escapeHtml(section.note)}</p>` : ""}
        </div>
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

  function wireEvents(itemIndex, menuData) {
    const dlg = $("#item-dialog");
    const titleEl = $("#item-title");
    const descEl = $("#item-desc");
    const priceEl = $("#item-price");
    const totalEl = $("#item-total");
    const sizeWrap = $("#item-size-wrap");
    const sizeList = $("#item-sizes");
    const flavorWrap = $("#item-flavor-wrap");
    const flavorPrimaryEl = $("#item-flavor-primary");
    const halfToggle = $("#item-half-toggle");
    const flavorSecondWrap = $("#item-flavor-second");
    const flavorSelect = $("#item-flavor-select");
    const qtyEl = $("#item-qty");
    const addBtn = $("#item-add");
    let currentItem = null;
    let currentQty = 1;
    let currentPriceCents = null;
    let currentName = null;
    let currentKey = null;
    let currentSizeLabel = null;
    let currentFlavorPrimary = null;
    let currentFlavorSecond = null;
    let isHalf = false;

    const pizzaSection = Array.isArray(menuData)
      ? menuData.find((s) => s && s.id === "pizzas")
      : null;
    const sizeGroup = pizzaSection?.groups?.find((g) => /tamanho/i.test(g.title || ""));
    const pizzaSizes = Array.isArray(sizeGroup?.items) ? sizeGroup.items : [];
    const flavorGroup = pizzaSection?.groups?.find((g) => /sabor/i.test(g.title || ""));
    const pizzaFlavors = Array.isArray(flavorGroup?.items) ? flavorGroup.items : [];

    function showDialogSafe(dialogEl) {
      if (!dialogEl) return;
      if (typeof dialogEl.showModal === "function") {
        try {
          dialogEl.showModal();
          return;
        } catch (_err) {
          // fallback below
        }
      }
      dialogEl.setAttribute("open", "");
    }

    function closeDialogSafe(dialogEl) {
      if (!dialogEl) return;
      if (typeof dialogEl.close === "function") {
        dialogEl.close();
        return;
      }
      dialogEl.removeAttribute("open");
    }

    function setQty(next) {
      const q = Math.max(1, Math.min(99, Number(next || 1)));
      currentQty = q;
      qtyEl.textContent = String(q);
      if (currentItem && Number.isFinite(currentPriceCents)) {
        totalEl.textContent = formatCentsBRL(currentPriceCents * currentQty);
      } else {
        totalEl.textContent = "Sem preço";
      }
    }

    function setPriceFromSize(size) {
      const cents = parsePriceToCents(size?.price);
      if (!Number.isFinite(cents)) {
        currentPriceCents = null;
        priceEl.textContent = "Sem preço";
        totalEl.textContent = "Sem preço";
        addBtn.disabled = true;
        addBtn.textContent = "Indisponível";
        return;
      }
      currentPriceCents = cents;
      priceEl.textContent = size.price;
      totalEl.textContent = formatCentsBRL(cents * currentQty);
      addBtn.disabled = false;
      addBtn.textContent = "Adicionar ao carrinho";
      currentSizeLabel = size.name || "Tamanho";
      const isBroto = /broto/i.test(currentSizeLabel);
      if (halfToggle) {
        halfToggle.checked = false;
        halfToggle.disabled = isBroto;
      }
      isHalf = false;
      if (flavorSecondWrap) flavorSecondWrap.style.display = "none";
      updatePizzaNameKey();
    }

    function updatePizzaNameKey() {
      if (currentItem?.sectionId !== "pizzas") return;
      const sizeLabel = currentSizeLabel || "Tamanho";
      const primary = currentFlavorPrimary || currentItem?.name || "Sabor";
      const second = isHalf ? currentFlavorSecond : null;
      const flavorLabel = second ? `${primary} + ${second}` : primary;
      currentName = `Pizza ${sizeLabel} - ${flavorLabel}`;
      currentKey = `pizza::${sizeLabel}::${flavorLabel}`;
    }

    function renderFlavorOptions(primaryName) {
      if (!flavorSelect) return;
      const options = pizzaFlavors
        .map((f) => f.name || "")
        .filter((n) => n && n !== primaryName);
      flavorSelect.innerHTML = options
        .map((n) => `<option value="${escapeAttr(n)}">${escapeHtml(n)}</option>`)
        .join("");
      currentFlavorSecond = options[0] || null;
      if (flavorSelect.value) currentFlavorSecond = flavorSelect.value;
    }

    document.addEventListener("click", (e) => {
      const itemEl = e.target.closest(".item[data-item-key]");
      if (!itemEl) return;
      const key = itemEl.getAttribute("data-item-key");
      const item = itemIndex.get(key);
      if (!item) return;
      if (item.sectionId === "pizzas" && /tamanho/i.test(item.groupTitle || "")) {
        return;
      }
      currentItem = item;
      setQty(1);

      titleEl.textContent = item.name || "Item";
      descEl.textContent = item.desc || "";
      currentName = item.name || "Item";
      currentKey = item.key;
      currentSizeLabel = null;
      currentFlavorPrimary = item.name || null;
      currentFlavorSecond = null;
      isHalf = false;
      if (halfToggle) halfToggle.checked = false;

      if (item.sectionId === "pizzas" && Array.isArray(pizzaSizes) && pizzaSizes.length) {
        if (sizeWrap) sizeWrap.style.display = "";
        if (sizeList) {
          sizeList.innerHTML = pizzaSizes
          .map((s, idx) => {
            const label = escapeHtml(s.name || "");
            const price = escapeHtml(s.price || "");
            const active = idx === 0 ? "is-active" : "";
            return `
              <button class="size-chip ${active}" type="button" data-idx="${idx}">
                <span class="size-name">${label}</span>
                <span class="size-price">${price}</span>
              </button>
            `;
          })
          .join("");
        }
        const firstSize = pizzaSizes[0];
        setPriceFromSize(firstSize);
        if (flavorWrap) flavorWrap.style.display = "";
        if (flavorPrimaryEl) flavorPrimaryEl.textContent = currentFlavorPrimary || "";
        if (flavorSecondWrap) flavorSecondWrap.style.display = "none";
        renderFlavorOptions(currentFlavorPrimary);
      } else {
        if (sizeWrap) sizeWrap.style.display = "none";
        if (flavorWrap) flavorWrap.style.display = "none";
        const cents = parsePriceToCents(item.price);
        currentPriceCents = Number.isFinite(cents) ? cents : null;
        if (Number.isFinite(cents) && item.price) {
          priceEl.textContent = item.price;
          totalEl.textContent = formatCentsBRL(cents * currentQty);
          addBtn.disabled = false;
          addBtn.textContent = "Adicionar ao carrinho";
        } else {
          priceEl.textContent = "Sem preço";
          totalEl.textContent = "Sem preço";
          addBtn.disabled = true;
          addBtn.textContent = "Indisponível";
        }
      }

      showDialogSafe(dlg);
    });

    $("#item-inc").addEventListener("click", () => setQty(currentQty + 1));
    $("#item-dec").addEventListener("click", () => setQty(currentQty - 1));

    if (sizeList) {
      sizeList.addEventListener("click", (e) => {
        const btn = e.target.closest("button.size-chip");
        if (!btn) return;
        const idx = Number(btn.getAttribute("data-idx"));
        if (!Number.isFinite(idx)) return;
        const size = pizzaSizes[idx];
        if (!size) return;
        sizeList.querySelectorAll(".size-chip").forEach((el) => el.classList.remove("is-active"));
        btn.classList.add("is-active");
        setPriceFromSize(size);
      });
    }

    if (halfToggle) {
      halfToggle.addEventListener("change", () => {
        isHalf = !!halfToggle.checked;
        if (flavorSecondWrap) flavorSecondWrap.style.display = isHalf ? "grid" : "none";
        if (isHalf) {
          renderFlavorOptions(currentFlavorPrimary);
        }
        updatePizzaNameKey();
      });
    }

    if (flavorSelect) {
      flavorSelect.addEventListener("change", () => {
        currentFlavorSecond = flavorSelect.value || null;
        updatePizzaNameKey();
      });
    }

    addBtn.addEventListener("click", () => {
      if (!currentItem) return;
      if (!Number.isFinite(currentPriceCents)) return;
      addItemToCart(currentItem, currentQty, {
        priceCents: currentPriceCents,
        name: currentName,
        key: currentKey
      });
      closeDialogSafe(dlg);
    });

    $("#cart-open").addEventListener("click", () => {
      renderCartModal();
      showDialogSafe($("#cart-dialog"));
    });

    $("#cart-whatsapp").addEventListener("click", () => {
      const cart = getCart();
      const msg = buildWhatsAppMessage(cart);
      if (!msg) return;
      const phone = "5566992120997";
      const url = `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
      window.open(url, "_blank");
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

    $("#item-dialog").addEventListener("close", () => {
      currentItem = null;
      currentQty = 1;
      currentPriceCents = null;
      currentName = null;
      currentKey = null;
      currentSizeLabel = null;
      currentFlavorPrimary = null;
      currentFlavorSecond = null;
      isHalf = false;
      if (sizeList) sizeList.innerHTML = "";
      if (flavorSelect) flavorSelect.innerHTML = "";
    });

    // Keyboard shortcut: "c" opens cart.
    document.addEventListener("keydown", (e) => {
      if (e.key.toLowerCase() === "c" && !e.metaKey && !e.ctrlKey && !e.altKey) {
        const dlg = $("#cart-dialog");
        const isOpen = dlg && (dlg.open || dlg.hasAttribute("open"));
        if (dlg && !isOpen) {
          renderCartModal();
          showDialogSafe(dlg);
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
    wireEvents(itemIndex, menuData);
    updateCartUI();
    initReveal();
  }

  main();
})();
