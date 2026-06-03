const BACKEND = "http://127.0.0.1:8000";
const SESSION_ID = "desktop-pet";

const petWrap = document.getElementById("petWrap");
const pet = document.getElementById("pet");
const bubble = document.getElementById("bubble");
const input = document.getElementById("msg");
const sendBtn = document.getElementById("send");
const closeBtn = document.getElementById("close");
const menu = document.getElementById("menu");
const chatPanel = document.getElementById("chatPanel");
const chatLog = document.getElementById("chatLog");
const chatClose = document.getElementById("chatClose");
const chatInput = document.getElementById("chatInput");
const chatSend = document.getElementById("chatSend");
const skinPicker = document.getElementById("skinPicker");

let bubbleTimer = null;

/* ---------- 对话记录（保存到本地，重启后仍在） ---------- */
const HISTORY_KEY = "petChatHistory";
let history = [];
try {
  history = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
} catch (_) {
  history = [];
}

function saveHistory() {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
}

function renderLog() {
  chatLog.innerHTML = "";
  for (const m of history) {
    const div = document.createElement("div");
    div.className = "msg " + m.role;
    div.textContent = m.text;
    chatLog.appendChild(div);
  }
  chatLog.scrollTop = chatLog.scrollHeight;
}

function addMsg(role, text) {
  history.push({ role, text });
  saveHistory();
  if (chatPanel.classList.contains("open")) renderLog();
}

/* ---------- 皮肤（外观 + 人设 + 反应） ---------- */
const SKIN_KEY = "petSkinId";
const CUSTOM_SKINS_KEY = "petCustomSkins";

// 用户自创皮肤（存本地，重启仍在）
let customSkins = [];
try {
  customSkins = JSON.parse(localStorage.getItem(CUSTOM_SKINS_KEY) || "[]");
} catch (_) {
  customSkins = [];
}
function saveCustomSkins() {
  localStorage.setItem(CUSTOM_SKINS_KEY, JSON.stringify(customSkins));
}

// 内置皮肤 + 自定义皮肤
function allSkins() {
  return [...SKINS, ...customSkins];
}
function findSkin(id) {
  return allSkins().find((s) => s.id === id) || SKINS[0];
}

let currentSkin = findSkin(localStorage.getItem(SKIN_KEY) || DEFAULT_SKIN_ID);

// 根据皮肤类型渲染外观：图片 / SVG / emoji
function renderAppearance(skin) {
  const type = skin.appearanceType || (skin.svg ? "svg" : skin.image ? "image" : "emoji");
  if (type === "image" && skin.image) {
    pet.innerHTML = `<img src="${skin.image}" alt="${skin.name}" style="width:100%;height:100%;object-fit:contain;pointer-events:none;" />`;
  } else if (type === "svg" && skin.svg) {
    pet.innerHTML = skin.svg;
  } else {
    pet.innerHTML = `<div style="font-size:96px;line-height:130px;text-align:center;pointer-events:none;">${skin.emoji || "🐾"}</div>`;
  }
}

function applySkin(skin, greet = true) {
  currentSkin = skin;
  localStorage.setItem(SKIN_KEY, skin.id);
  renderAppearance(skin);
  buildSkinPicker(); // 刷新选中态
  if (greet) showBubble(skin.reactions.greeting);
}

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function deleteCustomSkin(id) {
  customSkins = customSkins.filter((s) => s.id !== id);
  saveCustomSkins();
  if (currentSkin.id === id) applySkin(SKINS[0]); // 删的是当前皮肤就切回默认
  else buildSkinPicker();
}

function buildSkinPicker() {
  skinPicker.innerHTML = "";
  for (const s of allSkins()) {
    const item = document.createElement("div");
    item.className = "skinItem" + (s.id === currentSkin.id ? " active" : "");
    item.innerHTML = `<span class="emo">${s.emoji || "🐾"}</span><span>${s.name}</span>`;
    item.addEventListener("click", () => {
      applySkin(s);
      skinPicker.classList.remove("open");
    });
    // 自定义皮肤可删除
    if (!SKINS.includes(s)) {
      const del = document.createElement("span");
      del.className = "del";
      del.textContent = "✕";
      del.title = "删除";
      del.addEventListener("click", (e) => {
        e.stopPropagation();
        deleteCustomSkin(s.id);
      });
      item.appendChild(del);
    }
    skinPicker.appendChild(item);
  }
  // 末尾加“创建皮肤”入口
  const add = document.createElement("div");
  add.className = "skinItem";
  add.innerHTML = `<span class="emo">➕</span><span class="addnew">创建新皮肤</span>`;
  add.addEventListener("click", () => {
    skinPicker.classList.remove("open");
    openSkinForm();
  });
  skinPicker.appendChild(add);
}

/* ---------- 创建 / 编辑皮肤表单 ---------- */
const skinForm = document.getElementById("skinForm");
const fName = document.getElementById("fName");
const fPersona = document.getElementById("fPersona");
const fGreeting = document.getElementById("fGreeting");
const fClicks = document.getElementById("fClicks");
const fImage = document.getElementById("fImage");
const fSave = document.getElementById("fSave");
const fCancel = document.getElementById("fCancel");
const fImport = document.getElementById("fImport");
const fExport = document.getElementById("fExport");
const fImportFile = document.getElementById("fImportFile");
const avatarPreview = document.getElementById("avatarPreview");
const bgStatus = document.getElementById("bgStatus");

let pendingImage = null; // 当前表单里上传的头像(dataURL)

function showPreview(dataUrl) {
  if (dataUrl) {
    avatarPreview.src = dataUrl;
    avatarPreview.style.display = "block";
  } else {
    avatarPreview.style.display = "none";
  }
}

function openSkinForm() {
  fName.value = "";
  fPersona.value = "";
  fGreeting.value = "";
  fClicks.value = "";
  fImage.value = "";
  pendingImage = null;
  showPreview(null);
  setBgStatus("");
  skinForm.classList.add("open");
  setIgnore(false); // 表单期间确保能交互
}

function closeSkinForm() {
  skinForm.classList.remove("open");
}

function setBgStatus(text) {
  if (bgStatus) bgStatus.textContent = text || "";
}

// 读文件为 dataURL
function fileToDataURL(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.readAsDataURL(file);
  });
}

// 把 dataURL 缩放到最大边 max，返回新的 dataURL（保留透明度）
function resizeDataURL(dataUrl, max) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;
      if (width > max || height > max) {
        if (width >= height) {
          height = Math.round((height * max) / width);
          width = max;
        } else {
          width = Math.round((width * max) / height);
          height = max;
        }
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      canvas.getContext("2d").drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL("image/png"));
    };
    img.src = dataUrl;
  });
}

// 方案 B：调后端 rembg AI 抠图
async function removeBgViaBackend(dataUrl) {
  const res = await fetch(`${BACKEND}/remove-bg`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ image: dataUrl }),
  });
  if (!res.ok) throw new Error("remove-bg failed: " + res.status);
  const data = await res.json();
  return data.image;
}

// 方案 A 兜底：从四条边“漫水”，把与左上角同色（白底/纯色）的连通区域抹成透明
function removeBgByEdges(dataUrl, tol = 38) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const w = img.width;
      const h = img.height;
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0);
      const id = ctx.getImageData(0, 0, w, h);
      const d = id.data;
      const r0 = d[0];
      const g0 = d[1];
      const b0 = d[2];
      const visited = new Uint8Array(w * h);
      const stack = [];
      for (let x = 0; x < w; x++) {
        stack.push(x);
        stack.push((h - 1) * w + x);
      }
      for (let y = 0; y < h; y++) {
        stack.push(y * w);
        stack.push(y * w + w - 1);
      }
      const tol2 = tol * tol;
      while (stack.length) {
        const p = stack.pop();
        if (visited[p]) continue;
        visited[p] = 1;
        const i = p * 4;
        const dr = d[i] - r0;
        const dg = d[i + 1] - g0;
        const db = d[i + 2] - b0;
        if (dr * dr + dg * dg + db * db > tol2) continue; // 颜色差太大，认为是主体，停
        d[i + 3] = 0; // 设为透明
        const x = p % w;
        const y = (p / w) | 0;
        if (x > 0) stack.push(p - 1);
        if (x < w - 1) stack.push(p + 1);
        if (y > 0) stack.push(p - w);
        if (y < h - 1) stack.push(p + w);
      }
      ctx.putImageData(id, 0, 0);
      resolve(canvas.toDataURL("image/png"));
    };
    img.src = dataUrl;
  });
}

fImage.addEventListener("change", async () => {
  const file = fImage.files[0];
  if (!file) return;
  setBgStatus("正在读取图片…");
  const raw = await fileToDataURL(file);
  const sized = await resizeDataURL(raw, 512); // 抠图前先压到 512，省带宽
  showPreview(sized);

  let result;
  setBgStatus("正在 AI 抠图，首次较慢…");
  try {
    result = await removeBgViaBackend(sized);
    setBgStatus("已用 AI 抠图 ✨");
  } catch (_) {
    setBgStatus("AI 不可用，改用本地去背(纯色底)…");
    try {
      result = await removeBgByEdges(sized, 38);
      setBgStatus("已用本地去背(纯色底)");
    } catch (_) {
      result = sized;
      setBgStatus("去背失败，保留原图");
    }
  }
  pendingImage = await resizeDataURL(result, 256); // 存储用 256，保留透明
  showPreview(pendingImage);
});

// 用表单内容构造一张皮肤卡
function buildSkinFromForm() {
  const clicks = fClicks.value
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
  return {
    id: "custom_" + Date.now(),
    name: fName.value.trim() || "我的皮肤",
    emoji: pendingImage ? "🖼️" : "🎨",
    appearanceType: pendingImage ? "image" : "emoji",
    image: pendingImage || null,
    persona: fPersona.value.trim(),
    reactions: {
      greeting: fGreeting.value.trim() || "你好呀~",
      click: clicks.length ? clicks : ["..."],
    },
    builtin: false,
  };
}

fSave.addEventListener("click", () => {
  const skin = buildSkinFromForm();
  customSkins.push(skin);
  saveCustomSkins();
  applySkin(skin);
  closeSkinForm();
});

fCancel.addEventListener("click", closeSkinForm);

// 导出当前表单内容为 .json 卡片（便于分享）
fExport.addEventListener("click", () => {
  const skin = buildSkinFromForm();
  const blob = new Blob([JSON.stringify(skin, null, 2)], {
    type: "application/json",
  });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = (skin.name || "skin") + ".json";
  a.click();
});

// 导入 .json 卡片到表单（可再确认后保存）
fImport.addEventListener("click", () => fImportFile.click());
fImportFile.addEventListener("change", () => {
  const file = fImportFile.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const s = JSON.parse(e.target.result);
      fName.value = s.name || "";
      fPersona.value = s.persona || "";
      fGreeting.value = (s.reactions && s.reactions.greeting) || "";
      fClicks.value = ((s.reactions && s.reactions.click) || []).join("\n");
      pendingImage = s.image || null;
      showPreview(pendingImage);
    } catch (_) {
      showBubble("导入失败：这不是有效的皮肤卡 JSON 😣");
    }
  };
  reader.readAsText(file);
  fImportFile.value = "";
});

/* ---------- 气泡 ---------- */
function showBubble(text, autoHide = true) {
  bubble.textContent = text;
  bubble.classList.add("show");
  if (bubbleTimer) clearTimeout(bubbleTimer);
  if (autoHide) {
    bubbleTimer = setTimeout(() => bubble.classList.remove("show"), 12000);
  }
}

function showThinking() {
  bubble.innerHTML =
    '<span class="dot">●</span><span class="dot">●</span><span class="dot">●</span>';
  bubble.classList.add("show");
  pet.classList.add("thinking");
}

function stopThinking() {
  pet.classList.remove("thinking");
}

/* ---------- 与后端对话 ---------- */
async function doSend(text) {
  text = (text || "").trim();
  if (!text) return;
  addMsg("user", text);
  showThinking();
  try {
    const resp = await fetch(`${BACKEND}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: text,
        session_id: SESSION_ID,
        persona: currentSkin.persona,
      }),
    });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const data = await resp.json();
    stopThinking();
    addMsg("assistant", data.reply);
    showBubble(data.reply);
  } catch (err) {
    stopThinking();
    const msg = "呜…我连不上大脑(后端)了。\n请确认后端服务已启动 😣";
    addMsg("assistant", msg);
    showBubble(msg);
    console.error(err);
  }
}

// 宠物身上的快捷输入框
function sendFromHover() {
  const t = input.value;
  input.value = "";
  doSend(t);
}
// 面板内的输入框
function sendFromPanel() {
  const t = chatInput.value;
  chatInput.value = "";
  doSend(t);
}

async function resetMemory() {
  try {
    await fetch(`${BACKEND}/reset?session_id=${SESSION_ID}`, { method: "POST" });
  } catch (_) {}
  history = [];
  saveHistory();
  renderLog();
  showBubble("记忆已清空，我们重新认识一下吧~ ✨");
}

sendBtn.addEventListener("click", sendFromHover);
input.addEventListener("keydown", (e) => {
  if (e.key === "Enter") sendFromHover();
});
chatSend.addEventListener("click", sendFromPanel);
chatInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") sendFromPanel();
});
chatClose.addEventListener("click", () => chatPanel.classList.remove("open"));

function toggleChatPanel() {
  const willOpen = !chatPanel.classList.contains("open");
  chatPanel.classList.toggle("open", willOpen);
  if (willOpen) {
    renderLog();
    setTimeout(() => chatInput.focus(), 50);
  }
}

pet.addEventListener("click", () => {
  if (!bubble.classList.contains("show")) {
    showBubble(pickRandom(currentSkin.reactions.click));
  }
});

closeBtn.addEventListener("click", () => window.petAPI.quit());

/* ---------- 右键菜单 ---------- */
pet.addEventListener("contextmenu", (e) => {
  e.preventDefault();
  menu.classList.add("open");
});
menu.addEventListener("click", (e) => {
  const action = e.target.dataset.action;
  if (action === "quit") window.petAPI.quit();
  if (action === "reset") resetMemory();
  if (action === "history") toggleChatPanel();
  if (action === "skins") skinPicker.classList.toggle("open");
  if (action === "create") openSkinForm();
  menu.classList.remove("open");
});

// 双击宠物 → 打开/关闭对话记录
pet.addEventListener("dblclick", toggleChatPanel);
// 点别处关闭菜单 / 皮肤选择器
document.addEventListener("click", (e) => {
  if (!menu.contains(e.target) && e.target !== pet) menu.classList.remove("open");
  if (!skinPicker.contains(e.target) && !menu.contains(e.target)) {
    skinPicker.classList.remove("open");
  }
});

/* ---------- 位置 & 拖拽 ----------
   窗口铺满全屏，宠物在透明层里用 JS 自由移动，因此能跑到屏幕任意位置。 */
function placePet(left, top) {
  // 限制在窗口范围内（给下方控制区留 60px）
  const w = petWrap.offsetWidth || 130;
  const h = petWrap.offsetHeight || 130;
  left = Math.max(0, Math.min(left, window.innerWidth - w));
  top = Math.max(0, Math.min(top, window.innerHeight - h - 60));
  petWrap.style.left = left + "px";
  petWrap.style.top = top + "px";
}

// 初始放在右下角附近
function initPosition() {
  placePet(window.innerWidth - 180, window.innerHeight - 240);
}

// 召回：被全局快捷键 Cmd/Ctrl+Shift+P 触发，把宠物拉回可见位置
window.petAPI.onRecall(() => {
  initPosition();
  showBubble("我回来啦~ ✨");
});

let dragging = false;
let dragOffsetX = 0;
let dragOffsetY = 0;

pet.addEventListener("mousedown", (e) => {
  dragging = true;
  petWrap.classList.add("dragging");
  const rect = petWrap.getBoundingClientRect();
  dragOffsetX = e.clientX - rect.left;
  dragOffsetY = e.clientY - rect.top;
  e.preventDefault();
});

document.addEventListener("mouseup", () => {
  if (dragging) {
    dragging = false;
    petWrap.classList.remove("dragging");
  }
});

/* ---------- 悬停检测 + 点击穿透 ----------
   默认整窗忽略鼠标(点击穿透到下层程序)；
   当鼠标移到宠物组合上时临时接管鼠标，并显示关闭键 / 输入框。 */
let ignoring = true;
function setIgnore(v) {
  if (v !== ignoring) {
    ignoring = v;
    window.petAPI.setIgnoreMouse(v);
  }
}

document.addEventListener("mousemove", (e) => {
  if (dragging) {
    // 拖拽时强制接管鼠标并移动宠物
    setIgnore(false);
    petWrap.classList.add("active");
    placePet(e.clientX - dragOffsetX, e.clientY - dragOffsetY);
    return;
  }

  const el = document.elementFromPoint(e.clientX, e.clientY);
  const overInteractive = el && el.closest(".interactive");
  const overPet =
    (el && el.closest("#petWrap") && !el.closest("#bubble")) ||
    menu.classList.contains("open");

  setIgnore(!overInteractive);
  petWrap.classList.toggle("active", !!overPet);
});

/* ---------- 启动检查后端 ---------- */
window.addEventListener("DOMContentLoaded", async () => {
  initPosition();
  applySkin(currentSkin, false); // 注入上次选择的皮肤外观
  try {
    const r = await fetch(`${BACKEND}/health`);
    if (r.ok) showBubble(currentSkin.reactions.greeting, true);
    else throw new Error();
  } catch {
    showBubble("我醒了，但还没连上大脑。\n请先启动后端：\nuvicorn server:app", false);
  }
});
