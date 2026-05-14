# English Friend — 英语陪伴 App 设计文档

日期: 2026-05-14
状态: Draft v1

## 1. 产品概述

一款 Android 桌面悬浮宠物 App，通过 AI 驱动的自然英文对话，让用户在不"刻意学习"的情况下沉浸于英语环境。

### 核心体验

- 一只小宠物常驻手机桌面（类似 QQ 宠物）
- 每天随机主动找你搭话，每次聊天 30-60 秒
- 纯英文对话，AI 驱动，话题根据用户兴趣自然变化
- 不需要用户"坚持学习"，英语是顺便吸收的

### 设计原则

- **零意志力**：不需要用户主动打开 App，宠物来找你
- **短而轻**：每次对话 30-60 秒，说几句就结束，不造成心理负担
- **智能化**：自动学习用户兴趣，调整打扰频率，越用越贴心
- **所有数据本地存储**：无后端服务器，API Key 存在本地

## 2. 目标平台

| 维度 | 选择 |
|------|------|
| 平台 | Android 优先 |
| 框架 | React Native（核心逻辑 + UI）|
| 原生层 | Java/Kotlin（FloatingWindowService）|
| 最低 SDK | Android 8.0 (API 26) |

## 3. 整体架构

```
┌────────────────────────────────────────────────────┐
│                  RN App Layer                        │
│  ┌────────────┐ ┌──────────┐ ┌──────────────────┐  │
│  │ 设置页     │ │ 聊天记录  │ │ 宠物配置/个性化  │  │
│  └────────────┘ └──────────┘ └──────────────────┘  │
│                         │                           │
│  ┌──────────────────────▼────────────────────────┐  │
│  │          Global State (React Context)          │  │
│  │  - 宠物状态机                                  │  │
│  │  - 对话队列 & 历史                             │  │
│  │  - 用户画像 (兴趣、冷知识历史)                  │  │
│  │  - API Key / 设置                              │  │
│  └──────────────────────┬────────────────────────┘  │
│                         │                           │
│  ┌──────────────────────▼────────────────────────┐  │
│  │          AI Service Module                     │  │
│  │  - 对话生成 (调用 LLM API)                     │  │
│  │  - 话题方向控制 (System Prompt)                 │  │
│  │  - API Key 管理 / 请求合并                     │  │
│  └──────────────────────┬────────────────────────┘  │
│                         │                           │
│  ┌──────────────────────▼────────────────────────┐  │
│  │      Persistence Layer (AsyncStorage)          │  │
│  │  - chat_history.json                           │  │
│  │  - user_profile.json                           │  │
│  │  - settings.json                               │  │
│  └──────────────────────────────────────────────┘  │
└──────────────────────┬──────────────────────────────┘
                       │ (Native Module Bridge)
┌──────────────────────▼──────────────────────────────┐
│            Native: FloatingWindowService              │
│  - Foreground Service 保活                          │
│  - WindowManager 悬浮窗渲染                         │
│  - 拖拽交互 (onTouch)                               │
│  - 前台 App 检测 (UsageStatsManager)                │
│  - 通知通道                                         │
└─────────────────────────────────────────────────────┘
```

## 4. 悬浮宠物系统

### 4.1 FloatingWindowService

位于原生 Android 层，是 App 的"心脏"。

**职责：**
- 启动 Foreground Service（通知栏显示 "English Friend 运行中"）
- 通过 WindowManager.addView() 在桌面绘制悬浮窗
- 提供一个 SurfaceView/TextureView 作为 RN 的渲染容器
- 处理悬浮窗的拖拽和触摸事件
- 检测当前前台运行的 App，用于智能打扰

**权限需求：**
- `SYSTEM_ALERT_WINDOW` — 悬浮窗权限（需要用户首次手动授权）
- `FOREGROUND_SERVICE` — 前台保活
- `PACKAGE_USAGE_STATS` — 检测前台 App（可选，默认不用）

### 4.2 宠物状态机

宠物在三个状态间切换：

```
SLEEPING ──(唤醒定时器)──→ ACTIVE ──(用户点击)──→ CONVERSING
    ↑                                                  │
    └────────────────(超时/手动关闭)──────────────────┘
```

| 状态 | 视觉表现 | 行为 |
|------|---------|------|
| **SLEEPING** | 半透明小圆点/图标，静止 | 不响应触摸，不消耗资源 |
| **ACTIVE** | 图标变亮，轻微浮动动画 | 显示"有话说"的小提示，等待用户点击 |
| **CONVERSING** | 展开聊天气泡，显示文字 | 可输入回复或关闭 |

### 4.3 智能打扰策略

- **间隔随机化**：每次对话结束后，下次唤醒时间在 45-90 分钟内随机选择
- **每日上限**：默认每天最多主动发起 8-12 次（可配置）
- **深夜模式**：0:00-8:00 不主动唤醒
- **忽略衰减**：用户连续忽略 3 次 → 间隔自动延长 2 倍
- **积极加速**：用户主动回复积极 → 间隔略微缩短

### 4.4 宠物动画

- 使用 Lottie 动画（.json 格式），RN 的 `lottie-react-native` 控制播放
- MVP 阶段提供一个默认卡通宠物动画
- 动画文件通过 URL 加载或打包进 App

## 5. AI 对话系统

### 5.1 System Prompt

每次 API 调用附带以下系统提示词（可根据后续需求调整）：

```
You are a friendly English-speaking companion living on the user's phone.
You chat with them in casual English throughout the day.

Rules:
1. Keep your messages SHORT — under 20 words for greetings, under 40 words for replies.
2. Start every chat with a natural, casual opener. Ask questions, share thoughts, be curious.
3. Topics can come from: time of day, common daily experiences, random interesting facts, tech/coding/gaming if the user seems into those, or follow-ups from previous chats.
4. NEVER correct the user's grammar unless they ask.
5. DO NOT act like a teacher. You are a friend.
6. If the user seems busy or uninterested (short replies), keep it light and wrap up.
```

### 5.2 对话流程

```
[宠物 ACTIVE] ──点击──→ [调用 API 生成开场白]
                           ↓
                     显示气泡: "Hey, ever notice how..."
                           ↓
                     ┌────用户输入────┐
                     │               │
                  打字回复         关闭气泡
                     │               ↓
                     ↓          回到 SLEEPING
               [调用 API:
               (历史+用户回复)→AI 回复]
                     │
                     ↓
              显示 AI 回复 → 继续等待
              或用户关闭 → SLEEPING
```

**API 调用时机：**
- 每次用户回复后，调用一次 API（传入当前对话完整历史）
- 每次宠物主动开口前，调用一次 API（只传系统提示词，不传历史）

### 5.3 API 配置

- **服务商**：兼容 OpenAI API 格式（OpenAI / Anthropic / 其他）
- **模型建议（英文对话）**：gpt-4o-mini 或 claude-3-haiku（低成本，英文质量好）
- **API Key**：用户在设置页手动输入，仅存本地 AsyncStorage
- **上下文长度**：只传当前对话轮次，不跨对话传历史（减少 token 消耗）
- **超时设置**：10 秒超时，超时则进入 SLEEPING（避免卡住）

### 5.4 用户画像（自动积累）

本地维护一个 JSON 文件，每次对话后由 AI 或本地逻辑提取信息：

```json
{
  "interests": ["coding", "gaming", "music"],
  "mentioned_topics": ["react native", "jazz"],
  "conversation_count": 42,
  "preferred_time": "afternoon",
  "cold_knowledge_shared": ["Octopuses have three hearts"],
  "last_chat_time": "2026-05-14T13:30:00Z",
  "average_response_time_seconds": 45
}
```

这份数据在宠物沉睡时被下次 API 调用读取，作为 system prompt 的上下文。

## 6. 数据存储

全部使用 `@react-native-async-storage/async-storage`，本地 JSON 文件：

| Key | 内容 | 频率 |
|-----|------|------|
| `@ef/settings` | API Key、每日上限、是否启用语音 | 读：频繁 / 写：偶尔 |
| `@ef/conversations` | 最近 500 条对话记录 | 读：每次回复 / 写：每次回复 |
| `@ef/profile` | 用户画像对象 | 读：每次醒来 / 写：每次对话后 |
| `@ef/pet_state` | 当前状态、下次唤醒时间 | 读：频繁 / 写：状态切换时 |

## 7. MVP 范围

### 包含（V0.1）

- [x] 悬浮宠物图标（Lottie 动画），可自由拖拽位置
- [x] Foreground Service 保活
- [x] AI 驱动的口语化英文开场白
- [x] 打字回复 + AI 继续对话
- [x] 智能打扰策略（随机间隔、深夜静默、忽略衰减）
- [x] 自动积累用户画像
- [x] 设置页（输入 API Key、启用/停用宠物）
- [x] 所有数据本地存储

### 不包含（后续版本）

- [ ] TTS（文字转语音）
- [ ] STT（语音输入）
- [ ] 多宠物形象/动画
- [ ] 手动设定兴趣标签
- [ ] 聊天历史浏览页面
- [ ] iOS 支持
- [ ] 云端备份/同步

## 8. 技术栈概要

| 组件 | 技术 |
|------|------|
| 框架 | React Native (0.76+) |
| 原生悬浮窗 | Android Foreground Service + WindowManager |
| 动画 | lottie-react-native |
| 存储 | @react-native-async-storage/async-storage |
| 导航 | @react-navigation/native（设置页） |
| AI API | fetch → OpenAI/Anthropic 兼容 API |
| 前台 App 检测 | react-native-usage-stats-manager（可选） |

## 9. 首次启动流程

1. 用户安装 App，打开
2. 显示设置页 → 输入 API Key
3. 请求悬浮窗权限（`SYSTEM_ALERT_WINDOW`）
4. 启动 Foreground Service → 宠物出现在桌面
5. 第一次唤醒：宠物弹出 "Hey! I'm your English buddy. Nice to meet you!"
6. 用户回复 → 后续对话开始

---

本设计文档对应的实施阶段将输出详细的 React Native 项目结构和代码实现计划。
