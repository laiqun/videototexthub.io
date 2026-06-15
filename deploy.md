# 部署
## 将你的项目上传到 github
创建新 worker 时，指定 github 仓库即可。

配置 build 命令为：pnpm cf:build

配置 deploy 命令为：pnpm cf:deploy 

## 部署环境变量 .env.production
- VITE_APP_URL 改成你的 worker 的 url
- 生成 AUTH_SECRET ，使用命令 `Generate with: openssl rand -base64 32`来生成

配置环境变量到 worker
```bash
wrangler secret bulk .env.production
```
## 部署数据库 d1
操作数据库之前，先执行一下 `wrangler login `。
### 1. 创建一个 d1数据库
创建 d1数据库`npx wrangler d1 create db_name`，得到 `db-id`
### 2. 将数据库参数写入 `wrangler.jsonc`
将 `db_name`和 `db_id`的真实值写入 wrangler.json
```json
{
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "db_name",
      "database_id": "db-id",
      "remote": true,
      "migrations_dir": "drizzle"
    }
  ]
}
```
###  3. D1 数据库 Schema 创建

在 drizzle 目录生成 sql 迁移文件 `pnpm db:generate`

### 4. 在远程数据库上应用迁移文件 
`wrangler d1 migrations apply DB --remote`
   - 可以省略DB参数 `wrangler d1 migrations apply --remote`
   - 忽略 `pnpm db:migrate`，这条命令是无效的，仅用于本地调试

## 2. D1数据库初始化
```bash
pnpm rbac:init:d1 --admin-email=admin@example.com --admin-password=your-password
```
忽略`pnpm rbac:assign`，这条命令就不需要了，因为超级管理员在后台就可以修改其他用户的身份。

## 添加DB 绑定
当我使用的时候，注册和登录都报 HTTPError， 然后去 worker 里的 bindings 选项卡查看，没看到有名字为 DB 的绑定，于是手动添加了一下绑定。

查了一下，当执行 wrangler deploy 时，会解析 wrangler.jsonc来进行绑定，不太清楚为啥没有绑定成功。