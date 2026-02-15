const editor = document.getElementById("editor");
const loadBtn = document.getElementById("load-file");
const downloadBtn = document.getElementById("download-file");
const copyBtn = document.getElementById("copy-file");
const saveRemoteBtn = document.getElementById("save-remote");
const toggleTokenBtn = document.getElementById("toggle-token");

const ownerInput = document.getElementById("owner");
const repoInput = document.getElementById("repo");
const branchInput = document.getElementById("branch");
const pathInput = document.getElementById("path");
const tokenInput = document.getElementById("token");
const tokenField = document.querySelector(".field-token");

const storageKey = "menuAdminSettings";

async function loadFromSite() {
  try {
    const res = await fetch("../menu-data.js", { cache: "no-store" });
    if (!res.ok) throw new Error("Falha ao carregar menu-data.js");
    const text = await res.text();
    editor.value = text;
  } catch (err) {
    editor.value = "// Não foi possível carregar menu-data.js automaticamente.\n" +
      "// Cole o conteúdo aqui e edite.\n";
  }
}

function downloadFile() {
  const content = editor.value.trim() + "\n";
  const blob = new Blob([content], { type: "application/javascript" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "menu-data.js";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

async function copyAll() {
  try {
    await navigator.clipboard.writeText(editor.value);
    copyBtn.textContent = "Copiado";
    setTimeout(() => (copyBtn.textContent = "Copiar tudo"), 1200);
  } catch (err) {
    copyBtn.textContent = "Falha ao copiar";
    setTimeout(() => (copyBtn.textContent = "Copiar tudo"), 1200);
  }
}

function loadSettings() {
  const saved = localStorage.getItem(storageKey);
  if (saved) {
    const data = JSON.parse(saved);
    ownerInput.value = data.owner || "caeg0n";
    repoInput.value = data.repo || "react-eclipsecardapio-v1";
    branchInput.value = data.branch || "main";
    pathInput.value = data.path || "menu-data.js";
    tokenInput.value = data.token || "";
    return;
  }
  ownerInput.value = "caeg0n";
  repoInput.value = "react-eclipsecardapio-v1";
  branchInput.value = "main";
  pathInput.value = "menu-data.js";
}

function saveSettings() {
  localStorage.setItem(
    storageKey,
    JSON.stringify({
      owner: ownerInput.value.trim(),
      repo: repoInput.value.trim(),
      branch: branchInput.value.trim() || "main",
      path: pathInput.value.trim() || "menu-data.js",
      token: tokenInput.value.trim()
    })
  );
}

function encodeBase64(content) {
  const bytes = new TextEncoder().encode(content);
  let binary = "";
  bytes.forEach((b) => (binary += String.fromCharCode(b)));
  return btoa(binary);
}

async function saveToGitHub() {
  const owner = ownerInput.value.trim();
  const repo = repoInput.value.trim();
  const branch = (branchInput.value.trim() || "main");
  const path = (pathInput.value.trim() || "menu-data.js");
  const token = tokenInput.value.trim();

  if (!owner || !repo || !token) {
    alert("Preencha owner, repositório e token.");
    return;
  }

  saveSettings();
  saveRemoteBtn.textContent = "Salvando...";
  saveRemoteBtn.disabled = true;

  const apiBase = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
  try {
    const current = await fetch(`${apiBase}?ref=${branch}`, {
      headers: { Authorization: `token ${token}` }
    });
    let sha = null;
    if (current.ok) {
      const data = await current.json();
      sha = data.sha;
    }

    const content = editor.value.trim() + "\n";
    const body = {
      message: "Atualiza menu-data.js via admin",
      content: encodeBase64(content),
      branch
    };
    if (sha) body.sha = sha;

    const res = await fetch(apiBase, {
      method: "PUT",
      headers: {
        Authorization: `token ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || "Falha ao salvar no GitHub");
    }

    saveRemoteBtn.textContent = "Salvo no GitHub";
    setTimeout(() => (saveRemoteBtn.textContent = "Salvar no GitHub"), 1500);
  } catch (err) {
    alert(`Erro: ${err.message}`);
    saveRemoteBtn.textContent = "Salvar no GitHub";
  } finally {
    saveRemoteBtn.disabled = false;
  }
}

loadBtn.addEventListener("click", loadFromSite);

downloadBtn.addEventListener("click", downloadFile);
copyBtn.addEventListener("click", copyAll);
saveRemoteBtn.addEventListener("click", saveToGitHub);
toggleTokenBtn.addEventListener("click", () => {
  const isHidden = tokenField.style.display === "" || tokenField.style.display === "none";
  tokenField.style.display = isHidden ? "block" : "none";
  toggleTokenBtn.textContent = isHidden ? "Ocultar token" : "Mostrar token";
});

loadFromSite();
loadSettings();
