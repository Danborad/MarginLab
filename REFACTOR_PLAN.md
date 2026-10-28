# 留白集 MarginLab 重构施工计划（v2 · 2026-10-28）

> 依据 `1028 留白集重构.md`（PRD）拆解。参考 即梦 AI / 可灵 Kling 的大厂官网视觉语言。
> 基线快照：Git 标签 `v0.9.0-pre-refactor`，物理备份在 `/vol1/1000/share1/AI/codex/拼图-backups/`。

## 施工原则

1. **功能骨架不动**：左中右三栏、模块划分、业务流程保持原样，只换皮 + 补业务。
2. **先地基后楼层**：设计 token 先行，所有页面复用同一套变量，禁止页面里写死颜色。
3. **每阶段可独立上线**：每完成一个阶段 → `tsc + vite build` → 浏览器自测 → 提交。
4. **数据向后兼容**：老用户 JSON 缺字段时按默认值补齐，不破坏已有账号与作品。

---

## 阶段 1 · 设计系统基座（Dark UI + 极光氛围）

**目标**：把 `--studio-*` 从「白底灰框」改为「曜石黑 + 磨砂玻璃 + 极光绿」。

| 项 | 规格 |
| --- | --- |
| 主背景 | `#0A0B0E` → `#12141A` 渐变 |
| 容器 | `rgba(255,255,255,0.04~0.08)` + `backdrop-blur(16px)` |
| 描边 | `1px rgba(255,255,255,0.08)`，hover 转 `rgba(255,255,255,0.18)` |
| 强调色 | 极光绿 `#22C55E` / `#00E676` |
| 氛围光 | 顶部大面积径向渐变（深海蓝 `#0D254C` + 幻影紫 + 青绿），`blur(120px)` |
| 圆角 | 面板 `16px`、内部控件 `12px`、胶囊 `full` |

产出：
- `tailwind.config.js` 新增 `aurora.*` 色板、`glass` 阴影、`glow` 工具类
- `src/index.css` 重写 token（同时保留 `.light` 兜底以支持后续浅色主题）
- 新增 `AuroraBackdrop` 组件（全站背景光）

> 注：PRD 明确要求毛玻璃，**覆盖** 2026-10 之前「禁止 backdrop-blur」的旧约定；
> AGENTS.md 需同步更新该条。

## 阶段 2 · 登录 / 注册视图

- 全屏深色卡片，左图右表 `5.5 : 4.5`
- 左侧：视觉轮播（3~5 张），底部渐变遮罩 + Slogan + 「注册即享 50 算力 + 5GB 云图库」
- 右侧：Logo、欢迎标题、深灰无边框输入框、验证码胶囊、主按钮通栏、第三方登录位、协议勾选
- 忘记密码流程：邮箱 → 验证码 → 新密码

## 阶段 3 · 积分与云存储（业务核心）

**数据模型**（`users.json` 每条记录扩展）
```
points: number            // 当前积分
storageQuota: number      // 字节，默认 5GB
lastCheckInDate: string   // YYYY-MM-DD
pointsLog: [{ ts, delta, reason, balance }]
```

**全局默认值**（`server_data/system_config.json`）
```
registerPoints: 50
checkInPoints: 10
costPerImage: 1
defaultStorageGB: 5
```

**接口**
- `POST /api/user/:id/check-in` 签到（自然日去重）
- `GET  /api/user/:id/points/log` 积分明细
- `POST /api/admin/user/:id/points` 管理员加减积分（带备注）
- `POST /api/admin/user/:id/quota` 修改存储上限
- `GET  /api/user/:id/storage` 已用/总量（扫描 user_media + ai_history_assets）
- `GET  /api/admin/overview` 看板指标

**扣费与退还**
- `/api/ai/generate` 前置校验：积分 ≥ costPerImage、存储未满
- 先预扣 → 成功确认 → 失败/超时**自动退还**并记日志
- 上传接口前置校验存储配额

## 阶段 4 · 管理后台独立全屏

- 路由 `/admin`，`App.tsx` 按 `location.pathname` 分流
- 左侧固定导航 + 右侧宽屏工作区，复用阶段 1 设计系统
- 模块：数据概览 / 用户与资源 / 模板与风格库 / AI 模型与网关 / 全局规则与系统设置

## 阶段 5 · 前台工作台深色化

- Header：签到胶囊 + 积分 `✨ 60` + 头像菜单内存储进度条
- 左侧导航：线性发光图标 + 选中胶囊高光
- 模板卡片：底部渐变遮罩叠文字，hover `scale(1.04)`
- 画布区：深色磨砂卡 + 暗色虚线上传框 + 极光绿悬停光晕
- 右侧历史：深色卡 + 「本次生成消耗：1 积分」

## 阶段 6 · 个人中心

- 自定义头像上传（JPG/PNG/WebP + 圆形预览）
- 昵称 / 签名 / 职业标签编辑
- 改密：原密码校验 或 邮箱验证码校验

---

## 验收清单

- [ ] 全站无白底遗留（含所有 Modal / 抽屉 / 弹卡）
- [ ] 登录页左右分栏 + 轮播 + 协议勾选
- [ ] 注册 → 50 积分 → 签到 +10 → 生成 -1 → 失败退还
- [ ] 存储 90% 黄色预警、100% 拦截上传与生成
- [ ] `/admin` 五大模块可用，用户积分/配额可调
- [ ] 移动端（<768px）可用
- [ ] `npx tsc -b && npx vite build` 零报错
