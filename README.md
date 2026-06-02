# mini-agent · 会自己调用工具的 AI Agent

一个用 **LangChain + 大语言模型** 搭建的命令行 AI Agent。给它一句自然语言指令，它会**自主拆解任务、选择并调用工具、多步执行**，最后用中文汇总结果。

> 例如输入：
> *「查一下最近 AI Agent 领域的 3 个热点，中文总结后保存成 report.md」*
>
> Agent 会自动完成：联网搜索 → 读取网页 → 总结 → 写文件，全程无需人工干预。

## ✨ 特性

- 🧠 **自主多步推理**：基于 LangChain 的 tool-calling agent，LLM 自己决定调用哪个工具、何时结束
- 🔧 **5 个内置工具**：联网搜索、读网页、安全计算器、写文件、读文件
- 🔌 **模型可插拔**：兼容 DeepSeek / 通义千问 / 智谱 GLM / OpenAI，改一行配置即可切换
- 💬 **多轮对话记忆**：支持上下文连续追问
- 🛡️ **安全设计**：计算器用 AST 白名单（不用 `eval`），文件操作限制在 `workspace/` 目录内

## 🏗️ 架构

```
用户输入
   │
   ▼
┌─────────────────────────────────────┐
│  AgentExecutor (LangChain)          │
│  ┌───────────────────────────────┐  │
│  │  LLM（DeepSeek / 通义 / ...）   │  │  ← 思考 & 决策
│  └───────────────────────────────┘  │
│            │  选择工具 & 参数         │
│            ▼                         │
│  ┌──────────────────────────────┐   │
│  │ web_search  read_webpage     │   │
│  │ calculator  save_file        │   │  ← 执行
│  │ read_file                    │   │
│  └──────────────────────────────┘   │
│            │  工具结果回填            │
│            └──────► 循环直到完成 ─────┤
└─────────────────────────────────────┘
   │
   ▼
最终中文答案
```

代码结构：

| 文件 | 职责 |
|------|------|
| `src/config.py` | 读取 `.env`，构建供应商无关的 LLM 客户端 |
| `src/tools.py`  | 定义 5 个工具，docstring 即工具说明（喂给 LLM） |
| `src/agent.py`  | 组装 LLM + 工具 + 系统提示词为可执行 Agent |
| `src/cli.py`    | 命令行交互、多轮记忆、富文本输出 |
| `main.py`       | 入口 |

## 🚀 快速开始

```bash
# 1. 创建虚拟环境并安装依赖
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# 2. 配置 API Key（推荐 DeepSeek，便宜且兼容 OpenAI 接口）
cp .env.example .env
# 然后编辑 .env，填入你的 LLM_API_KEY

# 3. 运行
python main.py
```

## 🧪 试一试这些指令

- `北京到上海的高铁大概多少公里，按时速 350 算要开多久？`（触发搜索 + 计算器）
- `搜一下 LangChain 是什么，用三句话解释，存成 langchain.md`（搜索 + 写文件）
- `读一下 langchain.md 里写了什么`（读文件）

## 🔄 切换模型

只需修改 `.env` 里的三个变量（示例见 `.env.example`）：

```ini
LLM_API_KEY=你的key
LLM_BASE_URL=https://api.deepseek.com   # 换成对应供应商地址
LLM_MODEL=deepseek-chat                 # 换成对应模型名
```

## 📦 技术栈

Python · LangChain · OpenAI 兼容接口 · DuckDuckGo Search · BeautifulSoup · Rich

## 🗺️ Roadmap（可继续扩展，体现持续迭代）

- [ ] 增加 Streamlit 网页界面
- [ ] 接入 MCP，支持更多外部工具
- [ ] 多 Agent 协作（规划者 + 执行者）
- [ ] 给工具调用加上结果缓存
