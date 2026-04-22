# 记账系统

[![Repository](https://img.shields.io/badge/GitHub-freakinaaa%2Fjizhang2-181717?logo=github)](https://github.com/freakinaaa/jizhang2)

这是一个可以直接用 Docker 部署的记账系统，适合个人、家庭或放在 NAS 上长期使用。

你不需要安装额外数据库，这个项目内部直接使用 `SQLite`，数据会保存在你自己的 `data` 目录里。

## 最简单的部署方式

如果你会用 Docker，那么只需要准备一个 `docker-compose.yml` 文件。

新建一个空文件夹，比如：

```bash
mkdir jizhang
cd jizhang
```

然后新建文件 `docker-compose.yml`，把下面内容完整复制进去：

```yaml
services:
  jizhang:
    container_name: jizhang
    hostname: jizhang
    image: ghcr.io/freakinaaa/jizhang2:latest
    environment:
      - NODE_ENV=production
      - DATA_DIR=/data
      - PORT=3133
      - HOST=0.0.0.0
    ports:
      - "3133:3133"
    volumes:
      - "./data:/data"
    restart: unless-stopped
```

保存后，在这个目录里执行：

```bash
docker compose up -d
```

启动成功后，浏览器访问：

```text
http://你的服务器IP:3133
```

如果你是在本机运行，也可以直接访问：

```text
http://127.0.0.1:3133
```

## 默认账号

系统第一次启动时会自动创建管理员账号：

- 用户名：`admin`
- 密码：`admin`

第一次登录后建议马上修改密码。

## 数据保存在哪里

上面的配置里这一行：

```yaml
- "./data:/data"
```

意思是：

- 你当前目录里的 `data` 文件夹
- 会映射到容器里的 `/data`

数据库文件会保存在：

```text
./data/app.db
```

所以只要你的 `data` 文件夹还在：

- 删除容器没关系
- 重建容器没关系
- 更新镜像没关系

数据都不会丢。

## 常用命令

### 启动

```bash
docker compose up -d
```

### 查看运行状态

```bash
docker compose ps
```

### 查看日志

```bash
docker compose logs -f
```

### 停止服务

```bash
docker compose down
```

### 更新到最新镜像

```bash
docker compose pull
docker compose up -d
```

如果你希望强制重建容器，也可以用：

```bash
docker compose up -d --force-recreate
```

## 备份方法

最简单的备份方式，就是备份这个文件：

```text
./data/app.db
```

如果想更稳一点，也可以直接备份整个 `data` 目录。

恢复数据时：

1. 先停止服务
2. 用备份文件替换 `./data/app.db`
3. 再重新启动容器

对应命令：

```bash
docker compose down
docker compose up -d
```

## 常见问题

### 1. 需要额外装 MySQL 或 PostgreSQL 吗？

不需要。

这个项目直接使用 `SQLite`，数据库文件就是 `./data/app.db`。

### 2. 更新后数据会丢吗？

不会，只要你没有删掉 `data` 目录。

### 3. 可以部署到 NAS 吗？

可以，这个项目就是按 Docker / NAS 场景整理的。

### 4. 为什么端口是 `3133`？

因为 `3133` 相对更不容易和其他常见服务冲突。

### 5. 如果我想改端口怎么办？

改这里这一行左边的数字就可以：

```yaml
- "3133:3133"
```

比如你想改成 `8080`，可以写成：

```yaml
- "8080:3133"
```

这样浏览器就访问：

```text
http://你的服务器IP:8080
```
