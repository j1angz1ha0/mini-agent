#!/usr/bin/env bash
# 一键启动桌面宠物：先拉起后端(mini-agent)，再启动桌宠窗口。
# 用法：bash desktop-pet/start.sh   （在项目根目录运行）

set -e

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

echo "[1/2] 启动后端 mini-agent 服务 (http://127.0.0.1:8000) ..."
source .venv/bin/activate
uvicorn server:app --host 127.0.0.1 --port 8000 &
BACKEND_PID=$!

# 关闭脚本时一并关掉后端
trap "echo '正在关闭后端...'; kill $BACKEND_PID 2>/dev/null" EXIT

# 等后端就绪
echo "等待后端就绪..."
for i in {1..30}; do
  if curl -s http://127.0.0.1:8000/health >/dev/null 2>&1; then
    echo "后端已就绪 ✅"
    break
  fi
  sleep 1
done

echo "[2/2] 启动桌面宠物窗口 ..."
unset ELECTRON_RUN_AS_NODE
cd "$ROOT_DIR/desktop-pet"
./node_modules/.bin/electron .
