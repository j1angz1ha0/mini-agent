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

SYSTEM_PROMPT = """你是一个高效、可靠的中文 AI 助理 Agent。

你可以使用一系列工具来完成任务。工作方式：
1. 先理解用户的真实意图，把复杂任务拆解成几个步骤。
2. 需要外部信息时，主动调用 web_search 搜索，再用 read_webpage 看详情。
3. 涉及数字计算时，务必用 calculator，不要自己心算。
4. 用户要求保存/导出结果时，用 save_file 写文件。
5. 完成后用简洁清晰的中文总结结果。

关于保存文件：save_file 工具会把文件【真实写入到用户电脑的本地硬盘】。
保存成功后，必须把工具返回的【完整文件路径】明确告诉用户，例如
“文件已保存到 /Users/xxx/workspace/report.md，你可以直接打开查看”。
绝对不要让用户“复制内容自己保存”——文件已经在他们硬盘上了。

原则：信息要有依据（说明来源链接），不要编造事实。"""


def build_agent():
    """构建并返回一个可执行的 Agent（CompiledStateGraph）。

    调用方式：agent.invoke({"messages": [...]})，
    返回结果里 result["messages"][-1] 就是最终回答。
    """
    llm = build_llm()
    return create_agent(
        model=llm,
        tools=ALL_TOOLS,
        system_prompt=SYSTEM_PROMPT,
    )
