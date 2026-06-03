# 桌面宠物（Desktop Pet）

一只能聊天的透明桌面宠物。对话内核**复用了 mini-agent**——所以它不只是会闲聊,还能联网搜索、计算、读写文件(Agent 工具调用能力)。

```
┌─────────────────────────────────────────────┐
│  Electron 桌宠 (透明置顶窗口)                  │
│   - 默认皮肤: SVG 小猫(可拖拽)                │
│   - 点击/输入 → 气泡显示回复                   │
└───────────────┬─────────────────────────────┘
                │ HTTP (POST /chat)
                ▼
┌─────────────────────────────────────────────┐
│  FastAPI 后端 (server.py)                     │
│   - 复用 mini-agent 的 Agent + 工具           │
│   - 按 session 维护多轮对话记忆                │
└─────────────────────────────────────────────┘
```

## 运行前准备

1. 后端依赖(在**项目根目录**):
   ```bash
   source .venv/bin/activate
   pip install -r requirements.txt   # 已包含 fastapi / uvicorn
   ```
   并确保根目录的 `.env` 里填好了 LLM_API_KEY(和 mini-agent 用的是同一个)。

2. 桌宠依赖(在 `desktop-pet/` 目录):
   ```bash
   cd desktop-pet
   # 国内推荐用镜像，速度快
   ELECTRON_MIRROR="https://npmmirror.com/mirrors/electron/" npm install --registry=https://registry.npmmirror.com
   ```

## 启动

**方式一:一键启动(推荐)** —— 在项目根目录:

```bash
bash desktop-pet/start.sh
```

它会自动先拉起后端、等就绪、再打开桌宠窗口;关闭时自动收尾。

**方式二:手动分两步**

```bash
# 终端 1：启动后端
source .venv/bin/activate
uvicorn server:app --host 127.0.0.1 --port 8000

# 终端 2：启动桌宠
cd desktop-pet
npm start
```

## 怎么玩

- **拖动小猫**:移动它在屏幕上的位置
- **点击小猫**:打个招呼
- **底部输入框**:输入文字 + 回车 / 点 ➤ 发送,气泡会显示它的回复
- **右上角 ✕**:退出

## 换皮肤(下一步要做的核心功能)

目前的小猫是写死在 `index.html` 里的默认 SVG 皮肤。后续计划:
- 定义**统一皮肤格式**(JSON manifest + 多状态图片)
- 支持**上传图片 → AI 生成皮肤**
- 做**社区**让用户分享皮肤

## 技术栈

Electron · FastAPI · LangChain(mini-agent)· 原生 JS/HTML/CSS
