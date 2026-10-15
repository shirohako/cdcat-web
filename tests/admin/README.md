# 后台浏览器检查

在 cdcat-web 根目录运行：

```sh
pnpm install --frozen-lockfile
pnpm exec playwright-core install chromium
pnpm test:admin
```

检查会自行启动 Nuxt 和本地模拟 API，使用 4318、4319 端口，结束时关闭服务。不会连接开发或生产数据库。模拟 API 只验证界面交互；实际鉴权、事务和迁移由 cdcat-api 的 Pest 测试验证。

可通过 `ADMIN_TEST_PORT`、`ADMIN_TEST_API_PORT` 改端口，`PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` 指定已有 Chromium。测试涵盖匿名访问、contributor 菜单、移动端导航、角色分配、筛选和浏览历史、待审数量、驳回原因、权限撤销、禁用账号、接口故障及退出登录。
