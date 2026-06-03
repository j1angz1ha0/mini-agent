"""把 mini-agent 包成 HTTP 服务，供桌面宠物（Electron）调用。

桌宠前端通过 POST /chat 发消息，后端跑 Agent 并返回回答。
按 session_id 维护多轮对话记忆。

启动：
    source .venv/bin/activate
    uvicorn server:app --host 127.0.0.1 --port 8000
"""

from __future__ import annotations

from langchain_core.messages import AIMessage, HumanMessage
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from src.agent import build_agent

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


def get_agent():
    global _agent
    if _agent is None:
        _agent = build_agent()
    return _agent


class ChatRequest(BaseModel):
    message: str
    session_id: str = "default"


class ChatResponse(BaseModel):
    reply: str


@app.get("/health")
def health() -> dict:
    """健康检查，前端启动时用来确认后端就绪。"""
    return {"status": "ok"}


@app.post("/chat", response_model=ChatResponse)
def chat(req: ChatRequest) -> ChatResponse:
    """收到一条消息，跑 Agent，返回回答，并更新该会话的记忆。"""
    history = _sessions.setdefault(req.session_id, [])
    history.append(HumanMessage(content=req.message))

    agent = get_agent()
    result = agent.invoke({"messages": history})
    reply = result["messages"][-1].content

    history.append(AIMessage(content=reply))
    return ChatResponse(reply=reply)


@app.post("/reset")
def reset(session_id: str = "default") -> dict:
    """清空某个会话的记忆。"""
    _sessions.pop(session_id, None)
    return {"status": "reset", "session_id": session_id}
