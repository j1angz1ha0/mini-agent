const BACKEND = "http://127.0.0.1:8000";
const SESSION_ID = "desktop-pet";

const petWrap = document.getElementById("petWrap");
const pet = document.getElementById("pet");
const bubble = document.getElementById("bubble");
const input = document.getElementById("msg");
const sendBtn = document.getElementById("send");
const closeBtn = document.getElementById("close");
const menu = document.getElementById("menu");

let bubbleTimer = null;

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
async function send() {
  const text = input.value.trim();
  if (!text) return;
  input.value = "";
  showThinking();
  try {
    const resp = await fetch(`${BACKEND}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: text, session_id: SESSION_ID }),
    });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const data = await resp.json();
    stopThinking();
    showBubble(data.reply);
  } catch (err) {
    stopThinking();
    showBubble("呜…我连不上大脑(后端)了。\n请确认后端服务已启动 😣");
    console.error(err);
  }
}

async function resetMemory() {
  try {
    await fetch(`${BACKEND}/reset?session_id=${SESSION_ID}`, { method: "POST" });
  } catch (_) {}
  showBubble("记忆已清空，我们重新认识一下吧~ ✨");
}

sendBtn.addEventListener("click", send);
input.addEventListener("keydown", (e) => {
  if (e.key === "Enter") send();
});

pet.addEventListener("click", () => {
  if (!bubble.classList.contains("show")) {
    showBubble("喵~ 在呢，有什么可以帮你的？");
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
  menu.classList.remove("open");
});
// 点别处关闭菜单
document.addEventListener("click", (e) => {
  if (!menu.contains(e.target) && e.target !== pet) menu.classList.remove("open");
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
  try {
    const r = await fetch(`${BACKEND}/health`);
    if (r.ok) showBubble("你好呀！我已经准备好啦 ✨", true);
    else throw new Error();
  } catch {
    showBubble("我醒了，但还没连上大脑。\n请先启动后端：\nuvicorn server:app", false);
  }
});
