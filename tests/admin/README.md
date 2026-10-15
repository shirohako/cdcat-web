# 后台浏览器检查

在 cdcat-web 根目录运行：

```sh
pnpm install --frozen-lockfile
pnpm exec playwright-core install chromium
pnpm test:admin
```

检查会自行启动 Nuxt 和本地模拟 API，使用 4318、4319 端口，结束时关闭服务。不会连接开发或生产数据库。模拟 API 只验证界面交互；实际鉴权、事务和迁移由 cdcat-api 的 Pest 测试验证。

可通过 `ADMIN_TEST_PORT`、`ADMIN_TEST_API_PORT` 改端口，`PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` 指定已有 Chromium。测试涵盖匿名访问、contributor 菜单、移动端导航、角色分配、筛选和浏览历史、待审数量、驳回原因、权限撤销、禁用账号、接口故障及退出登录。


M1 后共 18 项检查，新增四类编辑器的 schema 与基线提交、作品 JSON 往返保留曲目及制作人员 ID、元数据和价格、系列 JSON 类型和排序、移除最后一首曲目的影响确认及原因、旧快照重新编辑提示、过期基线错误和删除审核权限。编辑器测试使用模拟数据；不会批准真实内容或删除业务数据。

不要与 `pnpm build`、`pnpm typecheck` 同时运行，Nuxt 生成目录由这些命令共用。


M2 后当前共 26 项：补充工作台趋势与敏感分区权限、用户状态 / 排序筛选及历史、资料编辑、启禁用原因、会话作废、重置验证码和清限流、角色权限矩阵增改、受保护角色只读、删除角色的替代角色确认，以及受保护账号不可操作。测试通过模拟 API 验证交互，密码重置不会发送真实邮件。
