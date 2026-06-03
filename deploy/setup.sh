#!/usr/bin/env bash
# ============================================================
#  mini-agent 后端一键部署脚本（Ubuntu / Debian 服务器）
#  作用：建虚拟环境 → 装依赖 → 准备 .env → 预下载抠图模型
#  用法：
#     cd ~/mini-agent
#     bash deploy/setup.sh
# ============================================================
set -e

# 项目根目录（本脚本在 deploy/ 下，上一级就是根目录）
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
echo "📂 项目目录：$ROOT"

# ---------- 1. 检查 / 安装系统依赖 ----------
if ! command -v python3 >/dev/null 2>&1; then
  echo "❌ 没装 python3。请先执行：sudo apt update && sudo apt install -y python3 python3-venv python3-pip"
  exit 1
fi

# ---------- 2. 创建虚拟环境 ----------
if [ ! -d ".venv" ]; then
  echo "🐍 创建虚拟环境 .venv ..."
  python3 -m venv .venv
fi
# shellcheck disable=SC1091
source .venv/bin/activate

# ---------- 3. 安装依赖（清华镜像，国内更快）----------
echo "📦 安装 Python 依赖（首次较慢）..."
pip install --upgrade pip -i https://pypi.tuna.tsinghua.edu.cn/simple
pip install -r requirements.txt -i https://pypi.tuna.tsinghua.edu.cn/simple

# ---------- 4. 准备 .env ----------
if [ ! -f ".env" ]; then
  cp .env.example .env
  echo "📝 已生成 .env —— 请编辑它填入你的 LLM_API_KEY：nano .env"
  echo "    低内存服务器建议在 .env 里加一行： REMBG_MODEL=u2netp"
fi

# ---------- 5. 预下载抠图模型（走 GitHub 镜像，断点续传）----------
REMBG_MODEL="$(grep -E '^REMBG_MODEL=' .env 2>/dev/null | cut -d= -f2 | tr -d ' ')"
REMBG_MODEL="${REMBG_MODEL:-u2netp}"   # 默认轻量版，省内存
MODEL_DIR="$HOME/.u2net"
MODEL_FILE="$MODEL_DIR/${REMBG_MODEL}.onnx"
mkdir -p "$MODEL_DIR"

if [ -s "$MODEL_FILE" ]; then
  echo "✅ 抠图模型已存在：$MODEL_FILE"
else
  echo "⬇️  下载抠图模型 ${REMBG_MODEL}.onnx ..."
  URL_PATH="danielgatis/rembg/releases/download/v0.0.0/${REMBG_MODEL}.onnx"
  for proxy in \
      "https://ghfast.top/https://github.com/" \
      "https://mirror.ghproxy.com/https://github.com/" \
      "https://github.com/"; do
    echo "   尝试镜像：$proxy"
    if curl -L -C - --fail --connect-timeout 15 --retry 5 --retry-delay 3 \
        -o "$MODEL_FILE" "${proxy}${URL_PATH}"; then
      echo "✅ 模型下载完成"
      break
    fi
  done
fi

echo ""
echo "🎉 部署准备完成！"
echo "   手动启动测试：  source .venv/bin/activate && uvicorn server:app --host 0.0.0.0 --port 8000"
echo "   设为开机自启：  见 deploy/README.md 里的 systemd 步骤"
