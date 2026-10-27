# 校园互助 · AI Demo

我在这个项目中实现了技能互助、需求对话与辅助匹配的演示流程。前端源码位于 `public/`，AI服务端位于 `lib/ai-service.mjs` 与 `app/api/ai/route.ts`。

我使用 `npm ci` 安装依赖，通过 `npm run dev` 启动本地预览，并用 `npm test` 验证业务与接口规则。

我已公开标注预设交互示例；真实模型将在配置服务端密钥与独立内测码后联调。设计与评测记录见 [AI文档](public/docs/06-AI需求助手与辅助匹配.md)。
