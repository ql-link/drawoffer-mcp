<div align="center">

# DrawOffer MCP Server

**让 Claude、Cursor 等 AI 工具读取你在 DrawOffer 职绘里的简历、岗位和投递记录**

<p>
  <a href="./LICENSE"><img alt="License: MIT" src="https://img.shields.io/badge/License-MIT-3f6fd8?style=flat-square"></a>
  <a href="https://www.drawoffer.com"><img alt="DrawOffer 职绘" src="https://img.shields.io/badge/在线体验-drawoffer.com-3f6fd8?style=flat-square"></a>
</p>

<p>
  <a href="https://www.drawoffer.com"><strong>在线体验</strong></a> ·
  <a href="#快速开始">快速开始</a> ·
  <a href="#工具一览">工具一览</a> ·
  <a href="./README.en.md">English</a>
</p>

</div>

---

[DrawOffer 职绘](https://www.drawoffer.com) 是一个 AI 求职工具：AI 改简历、按岗位 JD 调整简历、AI 模拟面试和求职进度管理。这个 MCP Server 让你在自己常用的 AI 工具里直接用上 DrawOffer 里的数据，例如：

- "读一下我的后端简历，按这个岗位的 JD 帮我改项目经历"
- "我保存的岗位里，哪些和我的简历最匹配？"
- "把这个招聘页面的岗位存进 DrawOffer"
- "我还有哪些投递在等结果？"

它在你的电脑上运行，用你自己的 API Key 调用 DrawOffer 的开放接口，只能访问你自己的数据。

## 快速开始

### 1. 创建 API Key

登录 [DrawOffer](https://www.drawoffer.com)，打开 **账号 → API Key**，点「创建 Key」：

- **只读**（推荐）：只能读取简历、岗位和投递记录。
- **读写**：还能新增岗位和投递记录。

完整的 Key 只在创建时显示一次，请立刻复制保存。Key 以 `dok_` 开头。

### 2. 配置 AI 工具

需要 Node.js 18 或更高版本。

**Claude Code**

```bash
claude mcp add drawoffer --env DRAWOFFER_API_KEY=dok_你的Key -- npx -y drawoffer-mcp
```

**Claude Desktop、Cursor 等**：在 MCP 配置文件（Claude Desktop 为 `claude_desktop_config.json`，Cursor 为 `~/.cursor/mcp.json`）中加入：

```json
{
  "mcpServers": {
    "drawoffer": {
      "command": "npx",
      "args": ["-y", "drawoffer-mcp"],
      "env": { "DRAWOFFER_API_KEY": "dok_你的Key" }
    }
  }
}
```

重启 AI 工具后，问它"列出我在 DrawOffer 的简历"试试。

## 工具一览

| 工具 | 作用 | 权限 |
|---|---|---|
| `list_resumes` | 列出全部简历 | 只读 |
| `get_resume` | 读取一份简历的正文（Markdown） | 只读 |
| `list_jobs` | 列出保存的岗位，支持关键词搜索 | 只读 |
| `get_job` | 读取岗位的完整 JD | 只读 |
| `create_job` | 保存一个岗位，并自动生成「待投递」记录 | 读写 |
| `list_applications` | 列出投递记录和当前阶段 | 只读 |
| `get_application` | 读取一条投递记录 | 只读 |
| `create_application` | 为已保存的岗位新建投递记录 | 读写 |

AI 改简历、匹配分析、模拟面试等会消耗积分的功能，目前不通过 MCP 开放，请在 [DrawOffer](https://www.drawoffer.com) 里使用。

## 配置项

| 环境变量 | 说明 |
|---|---|
| `DRAWOFFER_API_KEY` | 必填，你的 API Key |
| `DRAWOFFER_BASE_URL` | 选填，默认 `https://www.drawoffer.com` |

## 安全

- Key 只放在请求头里发给 DrawOffer，不会写入日志，也不会出现在错误信息里。
- 不要把 Key 提交进代码仓库。不用的 Key 请在账号页删除，删除后立即失效。
- 账号页能看到每把 Key 的最近使用时间，发现异常可以随时删除。
- 每把 Key 每分钟最多调用 60 次。

## 开发

```bash
git clone https://github.com/ql-link/drawoffer-mcp.git
cd drawoffer-mcp
npm install
npm test
DRAWOFFER_API_KEY=dok_你的Key node src/index.js
```

接口说明：所有请求发往 `/api/open/v1/*`，带 `Authorization: Bearer dok_...`。版本内只增加字段，不兼容的变化会放进 `/api/open/v2`。

## 更多 DrawOffer 开源项目

- [drawoffer-skills](https://github.com/ql-link/drawoffer-skills)：简历与求职 Agent Skills
- [drawoffer-prompts](https://github.com/ql-link/drawoffer-prompts)：复制即用的求职提示词
- [chinese-resume-templates](https://github.com/ql-link/chinese-resume-templates)：57 套中文简历模板

## 许可证

[MIT](./LICENSE) © ql-link
