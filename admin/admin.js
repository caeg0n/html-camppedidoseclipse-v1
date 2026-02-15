const editor = document.getElementById("editor");
const loadBtn = document.getElementById("load-file");
const downloadBtn = document.getElementById("download-file");
const copyBtn = document.getElementById("copy-file");
const saveRemoteBtn = document.getElementById("save-remote");

const ownerInput = document.getElementById("owner");
const repoInput = document.getElementById("repo");
const branchInput = document.getElementById("branch");
const pathInput = document.getElementById("path");

const storageKey = "menuAdminSettings";
const tokenStorageKey = "menuAdminTokenB64";
// Encrypted token blob (AES-GCM). Generate once with the helper script and paste here.
// Format: { saltB64, ivB64, dataB64, iterations }
const embeddedEncryptedToken = { "saltB64": "JyRbzbu/glycFsRcLwB9YQ==", "ivB64": "7gHnqhGZc8MqIBSt", "dataB64": "KDGGPgwPkRWmeo8lN9o8cw3qo9U2PtKclPnO6TMuxZXL2iMzsaV9B2yJ3JZ7Rser7jhJfJ+whaU=", "iterations": 210000 };
const defaultSettings = {
  owner: ownerInput.value,
  repo: repoInput.value,
  branch: branchInput.value,
  path: pathInput.value
};

async function loadFromSite() {
  try {
    const res = await fetch("../menu-data.js", { cache: "no-store" });
    if (!res.ok) throw new Error("Falha ao carregar menu-data.js");
    const text = await res.text();
    editor.value = text;
  } catch (err) {
    if (Array.isArray(window.MENU_DATA)) {
      editor.value = `window.MENU_DATA = ${JSON.stringify(window.MENU_DATA, null, 2)};\n`;
      return;
    }
    editor.value =
      "// NÃ£o foi possÃ­vel carregar menu-data.js automaticamente.\n" +
      "// Cole o conteÃºdo aqui e edite.\n";
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

function decodeTokenFromStorage() {
  const encoded = localStorage.getItem(tokenStorageKey);
  if (!encoded) return "";
  try {
    return atob(encoded).trim();
  } catch (_err) {
    return "";
  }
}

function b64ToBytes(b64) {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

async function deriveKey(passphrase, saltBytes, iterations) {
  const enc = new TextEncoder();
  const baseKey = await crypto.subtle.importKey("raw", enc.encode(passphrase), "PBKDF2", false, [
    "deriveKey"
  ]);
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: saltBytes, iterations, hash: "SHA-256" },
    baseKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["decrypt"]
  );
}

async function decryptEmbeddedToken(passphrase) {
  if (!embeddedEncryptedToken) return "";
  const { saltB64, ivB64, dataB64, iterations } = embeddedEncryptedToken;
  const salt = b64ToBytes(saltB64);
  const iv = b64ToBytes(ivB64);
  const data = b64ToBytes(dataB64);
  const key = await deriveKey(passphrase, salt, iterations || 210000);
  const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, data);
  return new TextDecoder().decode(plain).trim();
}

const keyDialog = document.getElementById("key-dialog");
const keyInput = document.getElementById("key-input");
let cachedPassphrase = "";

async function promptForPassphrase() {
  if (!keyDialog) return "";
  keyInput.value = "";
  keyDialog.showModal();
  const result = await new Promise((resolve) => {
    keyDialog.addEventListener(
      "close",
      () => resolve(keyDialog.returnValue),
      { once: true }
    );
  });
  if (result !== "ok") return "";
  return keyInput.value || "";
}

function encodeBase64(content) {
  const bytes = new TextEncoder().encode(content);
  let binary = "";
  bytes.forEach((b) => (binary += String.fromCharCode(b)));
  return btoa(binary);
}

async function saveToGitHub() {
  const { owner, repo, branch, path } = settings;
  let token = decodeTokenFromStorage();
  if (!token) {
    if (!embeddedEncryptedToken) {
      alert("Token criptografado não configurado no admin/admin.js.");
      return;
    }

    // Ask for the key; if user cancels, stop silently.
    if (!cachedPassphrase) cachedPassphrase = await promptForPassphrase();
    if (!cachedPassphrase) return;

    try {
      token = await decryptEmbeddedToken(cachedPassphrase);
    } catch (_err) {
      cachedPassphrase = "";
      alert("Chave incorreta. Tente novamente.");
      return;
    }
  }

  if (!owner || !repo || !token) {
    alert("Token indisponível.");
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

