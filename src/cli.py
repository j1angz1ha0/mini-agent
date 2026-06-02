"""命令行交互入口：带历史记忆、能实时展示工具调用过程的多轮对话 Agent。"""

from __future__ import annotations

import sys

from langchain_core.messages import AIMessage, HumanMessage, ToolMessage
from rich.console import Console
from rich.markdown import Markdown
from rich.panel import Panel

from .agent import build_agent

console = Console()

BANNER = """[bold cyan]mini-agent[/bold cyan]  ·  一个会自己调用工具的 AI Agent

可用工具：联网搜索 / 读网页 / 计算器 / 读写文件
试试输入：[italic]查一下最近 AI Agent 领域的 3 个热点，中文总结后保存成 report.md[/italic]

输入 [bold]exit[/bold] 或按 Ctrl+C 退出。
"""


def _render_step(message) -> None:
    """实时打印 Agent 每一步：调用了什么工具、工具返回了什么。"""
    if isinstance(message, AIMessage):
        for call in message.tool_calls or []:
            console.print(
                f"[dim]🔧 调用工具[/dim] [yellow]{call['name']}[/yellow]"
                f"[dim]({call['args']})[/dim]"
            )
    elif isinstance(message, ToolMessage):
        preview = str(message.content).replace("\n", " ")[:120]
        console.print(f"[dim]   ↳ 结果: {preview}…[/dim]")


def main() -> None:
    console.print(Panel(BANNER, expand=False, border_style="cyan"))

    try:
        agent = build_agent()
    except RuntimeError as e:
        console.print(f"[bold red]启动失败：[/bold red]\n{e}")
        sys.exit(1)

    # 多轮记忆：累积所有消息
    messages: list = []

    while True:
        try:
            user_input = console.input("\n[bold green]你> [/bold green]").strip()
        except (EOFError, KeyboardInterrupt):
            console.print("\n再见 👋")
            break

        if not user_input:
            continue
        if user_input.lower() in {"exit", "quit", "q"}:
            console.print("再见 👋")
            break

        messages.append(HumanMessage(content=user_input))

        try:
            # stream_mode="updates" 让我们能逐步看到每个节点产出的新消息
            final_state = None
            for chunk in agent.stream({"messages": messages}, stream_mode="updates"):
                for node_output in chunk.values():
                    for msg in node_output.get("messages", []):
                        _render_step(msg)
                    final_state = node_output
        except Exception as e:  # noqa: BLE001
            console.print(f"[bold red]出错了：[/bold red]{e}")
            messages.pop()  # 回滚这轮失败的输入
            continue

        if not final_state:
            continue

        answer = final_state["messages"][-1].content
        console.print("\n[bold cyan]Agent>[/bold cyan]")
        console.print(Markdown(answer))

        # 把本轮 AI 回答存入历史，支持上下文连续追问
        messages.append(AIMessage(content=answer))


if __name__ == "__main__":
    main()
