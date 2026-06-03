const { app, BrowserWindow, ipcMain, screen, globalShortcut } = require("electron");
const path = require("path");

let win = null;

function createWindow() {
  // 让窗口铺满整个屏幕工作区，宠物在这个透明层里自由移动
  const display = screen.getPrimaryDisplay();
  const { x, y, width, height } = display.workArea;

  win = new BrowserWindow({
    x,
    y,
    width,
    height,
    transparent: true, // 透明背景，只显示宠物
    frame: false, // 无边框
    resizable: false,
    movable: false, // 窗口本身不动，移动的是里面的宠物
    alwaysOnTop: true, // 始终置顶
    skipTaskbar: true,
    hasShadow: false,
    focusable: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // 浮在全屏/其他窗口之上
  win.setAlwaysOnTop(true, "screen-saver");

  win.loadFile("index.html");

  // 默认让透明区域点击穿透到下层程序；forward 让页面仍能收到 mousemove，
  // 这样渲染进程能检测到鼠标移到宠物上、再临时接管鼠标。
  win.webContents.on("did-finish-load", () => {
    win.setIgnoreMouseEvents(true, { forward: true });
  });
}

app.whenReady().then(() => {
  createWindow();

  // 全局快捷键：把宠物召回到屏幕可见位置（防止它被拖出屏幕后找不回来）
  globalShortcut.register("CommandOrControl+Shift+P", () => {
    if (win) win.webContents.send("recall-pet");
  });

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("will-quit", () => {
  globalShortcut.unregisterAll();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

// 渲染进程请求退出
ipcMain.on("app-quit", () => app.quit());

// 切换“点击穿透”——宠物休息时鼠标可穿过窗口点到下面的程序
ipcMain.on("set-ignore-mouse", (_event, ignore) => {
  if (win) win.setIgnoreMouseEvents(ignore, { forward: true });
});
