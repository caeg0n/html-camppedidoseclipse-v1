(async () => {
  const el = document.getElementById("build-version");
  if (!el) return;
  const base = document.currentScript?.getAttribute("data-base") || "";
  try {
    const res = await fetch(`${base}VERSION.txt?ts=${Date.now()}`, { cache: "no-store" });
    if (!res.ok) return;
    const txt = (await res.text()).trim();
    if (!txt) return;
    const normalized = txt.startsWith("v") ? txt : `v${txt}`;
    el.textContent = normalized;
  } catch {
    // ignore
  }
})();
