"""把 mini-agent 包成 HTTP 服务，供桌面宠物（Electron）调用。

桌宠前端通过 POST /chat 发消息，后端跑 Agent 并返回回答。
按 session_id 维护多轮对话记忆。

启动：
    source .venv/bin/activate
    uvicorn server:app --host 127.0.0.1 --port 8000
"""

from __future__ import annotations

import base64
import os

from langchain_core.messages import AIMessage, HumanMessage, SystemMessage
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from src.agent import build_agent, BASE_INSTRUCTIONS

app = FastAPI(title="mini-agent desktop pet API")

# 允许 Electron 本地页面跨域访问
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Agent 实例（进程内复用，避免每次请求都重建）
_agent = None

# 每个会话的历史消息：{session_id: [HumanMessage, AIMessage, ...]}
_sessions: dict[str, list] = {}

# rembg 抠图会话（懒加载；首次调用会下载 u2net 模型到 ~/.u2net/）
_rembg_session = None


def get_agent():
    global _agent
    if _agent is None:
        # 不内置系统提示，由每次请求按皮肤注入人设
        _agent = build_agent(system_prompt=None)
    return _agent


def get_rembg_session():
    global _rembg_session
    if _rembg_session is None:
        from rembg import new_session

        # 抠图模型可配置：低内存服务器(如 2G)建议设 REMBG_MODEL=u2netp（约 4MB，省内存）
        model_name = os.getenv("REMBG_MODEL", "u2net")
        _rembg_session = new_session(model_name)
    return _rembg_session


class ChatRequest(BaseModel):
    message: str
    session_id: str = "default"
    persona: str = ""  # 当前皮肤的人设（说话风格/性格），可为空


class ChatResponse(BaseModel):
    reply: str


@app.get("/health")
def health() -> dict:
    """健康检查，前端启动时用来确认后端就绪。"""
    return {"status": "ok"}


@app.post("/chat", response_model=ChatResponse)
def chat(req: ChatRequest) -> ChatResponse:
    """收到一条消息，跑 Agent，返回回答，并更新该会话的记忆。

    history 只存对话本身(Human/AI)；系统提示(基础指令 + 当前皮肤人设)
    每次请求实时拼装并放在最前面，这样切换皮肤即可切换说话风格。
    """
    history = _sessions.setdefault(req.session_id, [])
    history.append(HumanMessage(content=req.message))

    system_text = BASE_INSTRUCTIONS
    if req.persona.strip():
        system_text += "\n\n【你的角色设定】\n" + req.persona.strip()

    messages = [SystemMessage(content=system_text)] + history

    agent = get_agent()
    result = agent.invoke({"messages": messages})
    reply = result["messages"][-1].content

    history.append(AIMessage(content=reply))
    return ChatResponse(reply=reply)


class RemoveBgRequest(BaseModel):
    image: str  # dataURL（data:image/png;base64,xxx）或纯 base64


class RemoveBgResponse(BaseModel):
    image: str  # 抠图后的透明 PNG，dataURL 形式


@app.post("/remove-bg", response_model=RemoveBgResponse)
def remove_bg(req: RemoveBgRequest) -> RemoveBgResponse:
    """对上传的图片做 AI 抠图，返回透明背景的 PNG。

    前端把图片(dataURL)发过来，这里用 rembg(u2net 模型)分割前景，
    去掉背景后再转回 dataURL 返回。首次调用会下载模型，稍慢。
    """
    from rembg import remove

    raw = req.image.strip()
    if raw.startswith("data:") and "," in raw:
        raw = raw.split(",", 1)[1]  # 去掉 data:image/...;base64, 前缀

    img_bytes = base64.b64decode(raw)
    out_bytes = remove(img_bytes, session=get_rembg_session())
    b64 = base64.b64encode(out_bytes).decode("ascii")
    return RemoveBgResponse(image="data:image/png;base64," + b64)


@app.post("/reset")
def reset(session_id: str = "default") -> dict:
    """清空某个会话的记忆。"""
    _sessions.pop(session_id, None)
    return {"status": "reset", "session_id": session_id}
