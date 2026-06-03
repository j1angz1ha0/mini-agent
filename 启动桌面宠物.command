#!/usr/bin/env bash
# 双击我即可启动桌面宠物（macOS 会用「终端」运行本文件）。
# 第一次双击如果提示「无法打开，因为来自身份不明的开发者」，
# 右键本文件 → 打开 → 打开，即可。

cd "$(dirname "$0")"
echo "🐱 正在启动桌面宠物，请稍候…"
bash desktop-pet/start.sh
