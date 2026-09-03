# 像素风设计规范（Pixel Style Guide）

> 版本 v1.0（2026-09-04）。全站 UI 的强制视觉规范。
> 实现载体：`src/styles/pixel-theme.css`（全局覆盖）+ `src/styles/pixel-fonts.css`（字体），
> 注入点 `src/components/Layout/AppLayout.tsx`；公开页（Login 等在 AppLayout 之外的路由）
> 需在页面组件内自行 import 这两个 css。

## 1. 色板（CSS 变量，定义于 pixel-theme.css :root）

| 变量 | 值 | 用途 |
|---|---|---|
| `--mario-sky` | `#5c94fc` | 页面/Content 背景（1-1 天空蓝） |
| `--mario-black` | `#000` | 描边、硬阴影、文字强调 |
| `--mario-white` | `#fcfcfc` | 面板底 |
| `--mario-red` | `#d82800` | 危险/马里奥红 |
| `--mario-gold` | `#f8b800` | 主按钮（问号块）/表头/激活块 |
| `--mario-gold-dark` | `#ac7c00` | 金块内凹暗部 |
| `--mario-green` | `#00a800` | 管道绿/成功 |
| `--mario-blue` | `#0058f8` | HUD 蓝/聚焦 |

规则：**描边与阴影只用墨黑**；彩色（红金绿蓝）只用于语义强调（状态、主按钮、按列位轮换的项目卡阴影）。
禁止：圆角、渐变、带模糊的阴影、灰黑单色大面积（会退化为黑白电视）。

## 2. 字体

- 全站：`'Fusion Pixel 12px Monospaced SC'`（中文+拉丁像素字，本地打包于 `src/assets/fonts/`，OFL）
- 标题/数字：`'Press Start 2P'`（纯拉丁 8-bit；中文自动回退 Fusion）
- @font-face 见 `src/styles/pixel-fonts.css`（同族双 unicode-range：latin / zh_hans 分流）
- **antd 组件不继承 body 字体**，必须保留 `[class*='ant-'] { font-family: var(--px-font) }` 覆盖
- 禁止再引入非像素字体（系统字体只作 CJK 回退）

## 3. 几何

- 全站 0 圆角（`* { border-radius: 0 !important }`，勿移除）
- 面板：2-3px 墨黑描边；阴影一律**无模糊偏移实体影**（如 `4px 4px 0 #000`）
- Card/Modal 用**阶梯切角**（clip-path 12 点多边形）+ `filter: drop-shadow()`（阴影跟随切角；
  box-shadow 会被 clip 裁掉，勿用）；内圈 `inset 0 0 0 2px black` 补轮廓
- 主按钮：金底黑字 + 四角铆钉（4 组 linear-gradient 背景定位）+ 按下位移

## 4. 组件规则（已有主题自动生效，新组件遵守）

- **PageIntro**：每个页面顶部必须有引导条（`src/components/common/PageIntro.tsx`，
  storageKey 规范 `page-intro:<page>:v1`；改文案升 v2）
- **HintIcon / TermHint**：概念名词悬停必须有解释；术语优先查表
  `<HintIcon term="lease" />`（common.json `glossary` 段，28 条中英）
- **borderless 卡**（`variant="borderless"`）在天空蓝上会透明成幽灵——主题已强制实底白+黑框，
  新页面照用没问题，但不要新增透明底卡片样式
- **Empty 空状态**：全站自动渲染为问号块（勿在页面内自定义 antd Empty 插画）
- 文案：i18n 双语必填（zh-CN + en 同步）；**提交前跑
  `python3 tools/check_i18n_keys.py`**（启发式审计，定向按命名空间核对其结果最可靠；
  经 props 透传的 key 有盲区，需截图验收兜底）

## 5. 已知地雷（改样式前必读）

1. `.top-navigation` 白底会被 TopNavigation.css（组件内 import，晚于主题加载）反超——
   对导航的覆盖一律 `!important`
2. index.css 遗留 `.project-card { height:140px; overflow:hidden }`——已在主题解除
   （`height:auto!important`），勿删该覆盖
3. 给页面插 PageIntro 时，**同一步必须确认该页 usePageTranslation 解构里有 `tc`**，
   否则整页 `tc is not defined` 白屏（构建门禁抓不到运行时错误，OrganizationDetail 踩过）
4. Login / terms / privacy 等公开路由在 AppLayout 之外，需在页面组件里自行 import
   fonts + theme css
5. `body::before` 已被像素云占用，新增 fixed 装饰用 `#root::after`（地面砖块条所在）

## 6. 工具

- `python3 tools/check_i18n_keys.py [--en]`：i18n 裸 key 审计（启发式，定向最可靠）
- 浏览器自审：改完 → vite build → 打开对应页面截图/DOM 断言 → 自查通过才算完成
