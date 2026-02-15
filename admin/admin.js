const editor = document.getElementById("editor");
const loadBtn = document.getElementById("load-file");
const downloadBtn = document.getElementById("download-file");
const copyBtn = document.getElementById("copy-file");
const saveRemoteBtn = document.getElementById("save-remote");

const ownerInput = document.getElementById("owner");
const repoInput = document.getElementById("repo");
const branchInput = document.getElementById("branch");
const pathInput = document.getElementById("path");
const tokenInput = document.getElementById("token");

const storageKey = "menuAdminSettings";
const defaultSettings = {
  owner: ownerInput.value,
  repo: repoInput.value,
  branch: branchInput.value,
  path: pathInput.value,
  token: ""
};

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
    return { ...defaultSettings, ...JSON.parse(saved) };
  }
  return { ...defaultSettings };
}

function saveSettings() {
  localStorage.setItem(storageKey, JSON.stringify(settings));
}

function encodeBase64(content) {
  const bytes = new TextEncoder().encode(content);
  let binary = "";
  bytes.forEach((b) => (binary += String.fromCharCode(b)));
  return btoa(binary);
}

async function saveToGitHub() {
  const { owner, repo, branch, path, token } = settings;

  if (!owner || !repo || !token) {
    alert("Token não encontrado. Defina o token no localStorage antes de salvar.");
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

loadFromSite();
const settings = loadSettings();
