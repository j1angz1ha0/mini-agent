# 🚀 部署指南（小白版）

把**后端大脑**部署到你的服务器，让任何人的桌宠都能连上来聊天 / 抠图。

> ⚠️ 先记住一句话：**只有后端 `server.py` 部署到服务器**。桌宠（Electron）是装在每个用户自己电脑上的，不部署到服务器。

---

## 0. 你需要准备什么

- 一台 Linux 服务器（2G 内存够用），知道它的 **公网 IP**、**登录用户名**（常见是 `ubuntu` 或 `root`）、**密码或密钥**
- 一个 LLM 的 API Key（推荐 DeepSeek，便宜）

---

## 1. 连上服务器（在你自己电脑上操作）

Mac 打开「终端」，Windows 打开「PowerShell」，输入（把 IP 换成你的）：

```bash
ssh ubuntu@123.45.67.89
```

第一次会问 `yes/no`，输 `yes`，再输密码。看到命令行变成服务器的，就连上了。

---

## 2. 装基础软件（在服务器上操作）

```bash
sudo apt update
sudo apt install -y git python3 python3-venv python3-pip curl
```

---

## 3. ⭐ 加 2G 虚拟内存 swap（2G 服务器必做）

抠图那一下会吃较多内存，不加 swap 可能崩。一次性设置：

```bash
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
free -h   # 看到 Swap 那行有 2G 就成功了
```

---

## 4. 下载项目 + 一键安装

```bash
cd ~
git clone https://github.com/j1angz1ha0/mini-agent.git
cd mini-agent
bash deploy/setup.sh
```

脚本会自动建环境、装依赖、下载**轻量抠图模型 u2netp**（省内存）。耐心等它跑完。

---

## 5. 填入你的 API Key

```bash
nano .env
```

把 `LLM_API_KEY=sk-xxxx` 那行改成你真实的 key。
（2G 服务器建议确认文件里有一行 `REMBG_MODEL=u2netp`，没有就加上。）
改完按 `Ctrl+O` 回车保存，`Ctrl+X` 退出。

---

## 6. 先手动测一下能不能起来

```bash
source .venv/bin/activate
uvicorn server:app --host 0.0.0.0 --port 8000
```

看到 `Application startup complete` 就成功了。**新开一个终端**，测健康检查：

```bash
curl http://127.0.0.1:8000/health   # 返回 {"status":"ok"} 即可
```

测完回到第一个终端按 `Ctrl+C` 停掉，下一步交给 systemd 托管。

---

## 7. 设为开机自启（systemd 托管，崩溃自动重启）

```bash
# 先按你的实际用户名/路径改一下这个文件（默认是 ubuntu + /home/ubuntu/mini-agent）
nano deploy/petbrain.service

sudo cp deploy/petbrain.service /etc/systemd/system/petbrain.service
sudo systemctl daemon-reload
sudo systemctl enable --now petbrain

sudo systemctl status petbrain      # 看是否 active (running)
journalctl -u petbrain -f           # 实时看日志（Ctrl+C 退出）
```

---

## 8. 开放 8000 端口（很多人卡在这）

要让外网访问，**两道门都要开**：

1. **云厂商安全组**（阿里云/腾讯云/AWS 控制台里）：放行 `TCP 8000` 入站
2. **服务器防火墙**（如果开了 ufw）：

```bash
sudo ufw allow 8000
```

验证：在你**自己电脑**的浏览器打开 `http://你的IP:8000/health`，看到 `{"status":"ok"}` 就全通了。

---

## 9. 让桌宠连到服务器

打开桌宠代码 `desktop-pet/renderer.js`，把第一行的后端地址改成你的服务器：

```js
const BACKEND = "http://123.45.67.89:8000";   // 换成你的 IP
```

然后把 `desktop-pet/` 这个文件夹发给用户（或用 `electron-builder` 打包成安装包），他们运行后就会连到你的服务器。

---

## 🔧 常见问题

| 现象 | 原因 / 解决 |
|------|------|
| 浏览器打不开 `IP:8000/health` | 99% 是**安全组没放行 8000**，去云控制台开 |
| 聊天报错 / 没反应 | `.env` 里 key 没填对，看 `journalctl -u petbrain -f` 的报错 |
| 抠图时服务挂掉 / 自动重启 | 内存不够：确认做了**第 3 步 swap**，且用了 `u2netp` 轻量模型 |
| 模型下载失败 | 重跑 `bash deploy/setup.sh`，脚本会断点续传、自动换镜像 |

---

## 🔒 进阶（可选，以后再说）

- **加 HTTPS + 域名**：用 Nginx 反向代理 + Let's Encrypt 免费证书，把 `http://IP:8000` 变成 `https://pet.你的域名.com`
- **Docker 部署**：打包成镜像，换服务器一键迁移
- **限流 / 鉴权**：用户量大了再加，防止 API Key 被刷
