const { contextBridge, ipcRenderer } = require("electron");

// 只把必要的能力安全地暴露给页面，不开放整个 Node 环境
contextBridge.exposeInMainWorld("petAPI", {
  quit: () => ipcRenderer.send("app-quit"),
  setIgnoreMouse: (ignore) => ipcRenderer.send("set-ignore-mouse", ignore),
  onRecall: (cb) => ipcRenderer.on("recall-pet", cb),
});
