# 部署（aiimagedescriber.io）

## 1. 上传代码到 GitHub

创建新 Worker 时指定 GitHub 仓库即可，或者在本地用 wrangler 部署。

- Build 命令：`pnpm cf:build`
- Deploy 命令：`pnpm cf:deploy`

`cf:deploy` 会先加载 `.env.production`、执行 `cf:build`，再运行 `wrangler deploy`。

## 2. 环境变量（.env.production）

- `VITE_APP_URL=https://aiimagedescriber.io`
- `VITE_APP_NAME=AI Image Describer`
- `AUTH_SECRET`：用 `openssl rand -base64 32` 生成，不要提交到仓库
- `GOOGLE_GENERATIVE_AI_API_KEY`：Gemini API key（图片识别用）
- `DAILY_FREE_QUOTA` / `DAILY_FREE_QUOTA_LOGGED_IN`：每日免费额度（默认 50 / 100）

批量写入 Worker 环境变量：

```bash
wrangler secret bulk .env.production
```

## 3. D1 数据库

线上复用现有数据库 `ai_img_describer_db`（database_id: `b166720d-d7e2-42e4-9592-ba9db819c486`），
绑定名 `DB`，已写入 `wrangler.jsonc`，无需重新创建。操作数据库前先 `wrangler login`。

### 生成迁移文件

修改 `src/config/db/schema.ts` 后：

```bash
pnpm db:generate   # 在 drizzle/ 目录生成 SQL 迁移文件
```

生成后检查 SQL，确认没有 DROP COLUMN 等破坏性操作。

### 应用迁移到远程 D1

```bash
wrangler d1 migrations apply --remote
```

`pnpm db:migrate` 仅用于本地调试，远程 D1 用上面这条 wrangler 命令。

## 4. KV 命名空间

每日免费额度计数器存放在 KV 中，绑定名 `KV`
（id: `e7efaa5af5f74cea8812a5ff70c53f4b`），已写入 `wrangler.jsonc`。

## 5. R2 存储

R2 不在 wrangler 里配置。在管理后台 `/admin/settings` 的存储设置里填写
R2 的 bucket / access key 等信息，保存在数据库 `config` 表中
（设置 `CONFIG_ENCRYPTION_KEY` 后加密存储）。

## 6. 初始化管理员（RBAC）

```bash
pnpm rbac:init:d1 --admin-email=admin@example.com --admin-password=your-password
```

超级管理员可以在后台直接修改其他用户的角色，无需再执行 `rbac:assign`。

## 7. 绑定丢失排查

如果注册/登录报 HTTPError，先到 Worker 的 Bindings 选项卡确认以下绑定存在：

| name | value |
|------|-------|
| DB | ai_img_describer_db (D1) |
| KV | 每日配额 KV namespace |

GitHub 自动部署偶尔会掉绑定/环境变量，掉了就手动补一下，或重新执行
`wrangler secret bulk .env.production`。
