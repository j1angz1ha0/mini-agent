"""Agent 可调用的工具集合。

每个工具用 @tool 装饰，docstring 会作为「工具说明」喂给 LLM，
LLM 据此决定何时调用、传什么参数。所以 docstring 要写清楚。
"""

from __future__ import annotations

import ast
import operator
from pathlib import Path

import requests
from bs4 import BeautifulSoup
from langchain_core.tools import tool

# 所有文件读写都被限制在这个目录内，避免 Agent 误伤系统文件
WORKSPACE = Path("workspace")
WORKSPACE.mkdir(exist_ok=True)


@tool
def web_search(query: str) -> str:
    """联网搜索。当需要获取最新信息、新闻、事实时使用。
    输入一个搜索关键词，返回前几条结果的标题、摘要和链接。"""
    try:
        from ddgs import DDGS
    except ImportError:  # 兼容旧包名
        from duckduckgo_search import DDGS  # type: ignore

    with DDGS() as ddgs:
        results = list(ddgs.text(query, max_results=5))

    if not results:
        return "没有搜到相关结果。"

    lines = []
    for i, r in enumerate(results, 1):
        title = r.get("title", "")
        body = r.get("body", "")
        href = r.get("href", "")
        lines.append(f"{i}. {title}\n   {body}\n   链接: {href}")
    return "\n".join(lines)


@tool
def read_webpage(url: str) -> str:
    """读取一个网页的正文内容。当 web_search 给出链接、需要看详情时使用。
    输入一个 http/https 链接，返回该页面的纯文本（已去除 HTML 标签，截断到约 3000 字）。"""
    try:
        resp = requests.get(
            url,
            timeout=15,
            headers={"User-Agent": "Mozilla/5.0 (mini-agent)"},
        )
        resp.raise_for_status()
    except requests.RequestException as e:
        return f"抓取网页失败: {e}"

    soup = BeautifulSoup(resp.text, "html.parser")
    for tag in soup(["script", "style", "nav", "footer", "header"]):
        tag.decompose()

    text = " ".join(soup.get_text(separator=" ").split())
    return text[:3000] if text else "页面没有可读取的文本内容。"


# 计算器：用 AST 白名单安全求值，绝不使用 eval()
_ALLOWED_OPS = {
    ast.Add: operator.add,
    ast.Sub: operator.sub,
    ast.Mult: operator.mul,
    ast.Div: operator.truediv,
    ast.Pow: operator.pow,
    ast.Mod: operator.mod,
    ast.USub: operator.neg,
    ast.UAdd: operator.pos,
}


def _safe_eval(node: ast.AST) -> float:
    if isinstance(node, ast.Constant) and isinstance(node.value, (int, float)):
        return node.value
    if isinstance(node, ast.BinOp) and type(node.op) in _ALLOWED_OPS:
        return _ALLOWED_OPS[type(node.op)](_safe_eval(node.left), _safe_eval(node.right))
    if isinstance(node, ast.UnaryOp) and type(node.op) in _ALLOWED_OPS:
        return _ALLOWED_OPS[type(node.op)](_safe_eval(node.operand))
    raise ValueError("表达式包含不被允许的运算。")


@tool
def calculator(expression: str) -> str:
    """做精确的数学计算。当需要算数字时使用（LLM 自己心算容易出错）。
    输入一个数学表达式字符串，如 "(1234 * 56) / 7 + 8 ** 2"。"""
    try:
        tree = ast.parse(expression, mode="eval")
        return str(_safe_eval(tree.body))
    except Exception as e:
        return f"计算失败: {e}"


@tool
def save_file(filename: str, content: str) -> str:
    """把内容保存成文件。当用户要求「保存」「存成文件」「导出报告」时使用。
    filename 是文件名（如 report.md），content 是要写入的文本。文件会存到 workspace/ 目录。"""
    # 只取文件名，防止路径穿越（如 ../../etc/passwd）
    safe_name = Path(filename).name
    path = WORKSPACE / safe_name
    path.write_text(content, encoding="utf-8")
    # 返回绝对路径，让用户一眼知道文件存在硬盘的哪个位置
    return (
        f"文件已成功保存到本地硬盘（共 {len(content)} 字）。\n"
        f"完整路径: {path.resolve()}"
    )


@tool
def read_file(filename: str) -> str:
    """读取 workspace/ 目录下一个已存在的文件内容。"""
    safe_name = Path(filename).name
    path = WORKSPACE / safe_name
    if not path.exists():
        return f"文件不存在: {path}"
    return path.read_text(encoding="utf-8")


# 注册给 Agent 的全部工具
ALL_TOOLS = [web_search, read_webpage, calculator, save_file, read_file]
