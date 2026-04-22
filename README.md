# 记账系统

[![Repository](https://img.shields.io/badge/GitHub-freakinaaa%2Fjizhang2-181717?logo=github)](https://github.com/freakinaaa/jizhang2)

一个基于 `React + Vite + Node.js + Express + SQLite` 的一体化记账系统，适合个人、家庭或小团队进行日常记账，也适合部署在 NAS 的 Docker 环境中长期使用。

前端和后端打包为同一个服务，对外只暴露一个端口；SQLite 数据库单独存放在挂载目录中，升级系统镜像不会影响已有数据。

## 项目介绍

- 前端：`React + Vite`
- 后端：`Node.js + Express`
- 数据库：`SQLite`
- 部署方式：本地运行、Docker 镜像、`docker compose`
- 数据持久化：默认保存到 `./data/app.db`

系统首次启动会自动初始化数据库，并创建默认管理员：

- 用户名：`admin`
- 密码：`admin`

首次登录后建议立即修改默认密码。

## 功能概览

- 注册 / 登录
- 快速记账
- 仪表盘
- 记账记录
- 统计分析
- 分期费用管理
- 还款管理
- 预算管理
- 分类管理
- 会钱管理
- 用户管理
- 开放注册开关
- SQLite 数据备份下载

## 从 GitHub 安装

先克隆发布仓库：

```bash
git clone https://github.com/freakinaaa/jizhang2.git
cd jizhang2
```

后续可根据使用场景选择本地运行或 Docker 部署。

## 本地一体化预览

适合快速体验和本机验收，只会启动一个 `3000` 端口服务。

```bash
npm install
npm run quick
```

启动后访问：

```text
http://127.0.0.1:3000
```

说明：

- `npm run quick` 会先构建前端，再启动 Node 一体化服务。
- 前端页面和后端 API 都通过同一个 `3000` 端口访问。
- 停止服务时，在当前终端按 `Ctrl+C`。

## Docker / NAS 部署

推荐在 NAS 或长期运行环境中使用 `docker compose`。

确认 Docker 可用：

```bash
docker --version
docker compose version
```

从 GitHub 拉取代码后启动：

```bash
git clone https://github.com/freakinaaa/jizhang2.git
cd jizhang2
docker compose up -d --build
```

启动后访问：

```text
http://127.0.0.1:3000
```

默认配置：

- 镜像名：`jizhang:latest`
- 容器名：`jizhang`
- 端口映射：`3000:3000`
- 数据挂载：`./data:/data`
- 容器内数据库：`/data/app.db`

常用 Docker 命令：

```bash
docker compose ps
docker compose logs -f
docker compose down
```

只要保留宿主机上的 `./data/app.db`，重新构建或升级容器都不会丢失数据。

## 手动构建 Docker 镜像

如果不使用 `docker compose`，也可以手动构建和运行：

```bash
docker build -t jizhang:latest .
docker run -d \
  --name jizhang \
  -p 3000:3000 \
  -v $(pwd)/data:/data \
  --restart unless-stopped \
  jizhang:latest
```

## 本地开发模式

适合修改代码时使用，前端支持热更新。

```bash
npm install
npm run server
```

新开一个终端：

```bash
npm run dev
```

访问前端开发服务器：

```text
http://127.0.0.1:5173
```

说明：

- 开发模式下，Vite 会将 `/api` 请求代理到本地 `3000` 端口。
- 生产部署不需要 `5173`，只需要 `3000`。

## 从 GitHub 更新

本地或 NAS 上更新代码：

```bash
git pull origin main
```

如果使用 Docker 部署，更新后重新构建并启动：

```bash
docker compose up -d --build
```

数据目录 `./data` 会继续保留，不会因为更新代码或重建容器而被删除。

## 数据与备份

- 本地默认数据库：`./data/app.db`
- Docker 容器内数据库：`/data/app.db`
- 管理员可在“用户管理”页面下载当前 SQLite 数据库备份

手动备份时，直接备份以下文件即可：

```text
./data/app.db
```

恢复时，停止服务后替换该文件，再重新启动服务。

## 常用命令

```bash
# 本地一体化预览
npm install
npm run quick

# 本地开发
npm run server
npm run dev

# Docker 部署
docker compose up -d --build

# Docker 停止
docker compose down
```
