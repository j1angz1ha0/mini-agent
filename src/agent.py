"""Agent 核心：把 LLM + 工具 + 提示词组装成一个能自主多步执行的智能体。

用的是 LangChain 1.x 的 create_agent（底层基于 LangGraph）：
LLM 自己决定「要不要调工具、调哪个、传什么参数」，
拿到工具结果后再决定「继续调工具还是给出最终答案」，循环往复，
直到任务完成。这正是 ReAct 式 Agent 的核心循环。
"""

from __future__ import annotations

from langchain.agents import create_agent

from .config import build_llm
from .tools import ALL_TOOLS

# 基础能力指令：无论换成什么皮肤/人设，这部分始终生效
BASE_INSTRUCTIONS = """你是一个桌面宠物 AI 助理，可以使用一系列工具来完成任务。

工作方式：
1. 先理解用户意图，把复杂任务拆解成几个步骤。
2. 需要外部信息时，主动调用 web_search 搜索，再用 read_webpage 看详情。
3. 涉及数字计算时，务必用 calculator，不要自己心算。
4. 用户要求保存/导出结果时，用 save_file 写文件；保存后必须把返回的【完整文件路径】
   告诉用户，绝不要让用户“复制内容自己保存”——文件已经在硬盘上了。
5. 信息要有依据，不要编造事实。"""


def build_agent(system_prompt: str | None = BASE_INSTRUCTIONS):
    """构建并返回一个可执行的 Agent（CompiledStateGraph）。

    - system_prompt 默认用基础指令（命令行 CLI 用这个）。
    - 传 None 时不内置系统提示，由调用方在 messages 里自行注入
      （桌宠后端用这种方式，以便运行时按皮肤切换人设）。

    调用方式：agent.invoke({"messages": [...]})，
    返回结果里 result["messages"][-1] 就是最终回答。
    """
    llm = build_llm()
    if system_prompt:
        return create_agent(model=llm, tools=ALL_TOOLS, system_prompt=system_prompt)
    return create_agent(model=llm, tools=ALL_TOOLS)
