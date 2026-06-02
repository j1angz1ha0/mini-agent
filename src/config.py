"""集中管理配置：从 .env 读取并构建 LLM 客户端。

设计成「供应商无关」：只要模型兼容 OpenAI 接口（DeepSeek / 通义 / 智谱 / OpenAI），
改 .env 里的三个变量即可切换，无需改代码。
"""

from __future__ import annotations

import os

from dotenv import load_dotenv
from langchain_openai import ChatOpenAI

load_dotenv()


def _require(key: str) -> str:
    value = os.getenv(key)
    if not value or value.startswith("sk-xxxx"):
        raise RuntimeError(
            f"环境变量 {key} 没有正确配置。\n"
            f"请先复制 .env.example 为 .env，并填入真实的 API Key：\n"
            f"    cp .env.example .env"
        )
    return value


def build_llm(temperature: float = 0.0) -> ChatOpenAI:
    """构建一个兼容 OpenAI 接口的 Chat 模型。

    temperature=0 让 Agent 的工具选择更稳定、可复现。
    """
    return ChatOpenAI(
        api_key=_require("LLM_API_KEY"),
        base_url=os.getenv("LLM_BASE_URL", "https://api.deepseek.com"),
        model=os.getenv("LLM_MODEL", "deepseek-chat"),
        temperature=temperature,
    )
