<div align="center">

# DrawOffer MCP Server

**Let Claude, Cursor and other AI tools read your resumes, saved jobs and applications in DrawOffer**

<p>
  <a href="./LICENSE"><img alt="License: MIT" src="https://img.shields.io/badge/License-MIT-3f6fd8?style=flat-square"></a>
  <a href="https://www.drawoffer.com/en"><img alt="DrawOffer" src="https://img.shields.io/badge/Try_it-drawoffer.com-3f6fd8?style=flat-square"></a>
</p>

<p>
  <a href="https://www.drawoffer.com/en"><strong>Website</strong></a> ·
  <a href="#quick-start">Quick start</a> ·
  <a href="#tools">Tools</a> ·
  <a href="./README.md">中文</a>
</p>

</div>

---

[DrawOffer](https://www.drawoffer.com/en) is an AI job-search tool: AI resume editing, tailoring to job descriptions, mock interviews and application tracking. This MCP server brings your DrawOffer data into the AI tool you already use, for example:

- "Read my backend resume and rewrite the project section for this job description."
- "Which of my saved jobs fit my resume best?"
- "Save the job on this page to DrawOffer."
- "Which applications are still waiting for a result?"

It runs on your computer, calls the DrawOffer open API with your own API key, and can only access your own data.

## Quick start

### 1. Create an API key

Sign in to [DrawOffer](https://www.drawoffer.com/en), open **Account → API keys** and click **Create key**:

- **Read only** (recommended): read resumes, jobs and applications.
- **Read and write**: also add jobs and applications.

The full key is shown only once, right after you create it. Keys start with `dok_`.

### 2. Configure your AI tool

Requires Node.js 18 or later.

**Claude Code**

```bash
claude mcp add drawoffer --env DRAWOFFER_API_KEY=dok_your_key -- npx -y drawoffer-mcp
```

**Claude Desktop, Cursor and others**: add this to your MCP config (`claude_desktop_config.json` for Claude Desktop, `~/.cursor/mcp.json` for Cursor):

```json
{
  "mcpServers": {
    "drawoffer": {
      "command": "npx",
      "args": ["-y", "drawoffer-mcp"],
      "env": { "DRAWOFFER_API_KEY": "dok_your_key" }
    }
  }
}
```

Restart the tool and ask it to "list my DrawOffer resumes".

## Tools

| Tool | What it does | Access |
|---|---|---|
| `list_resumes` | List all resumes | Read |
| `get_resume` | Read a resume's content as Markdown | Read |
| `list_jobs` | List saved jobs, with keyword search | Read |
| `get_job` | Read a job's full description | Read |
| `create_job` | Save a job and create a "to apply" record | Write |
| `list_applications` | List applications and their current stage | Read |
| `get_application` | Read one application | Read |
| `create_application` | Create an application for a saved job | Write |

Features that spend credits, such as AI resume rewriting, match analysis and mock interviews, are not available through MCP yet. Use them on [DrawOffer](https://www.drawoffer.com/en).

Tool descriptions and error messages are in Chinese, the product's primary language; AI tools read them without trouble.

## Configuration

| Variable | Description |
|---|---|
| `DRAWOFFER_API_KEY` | Required. Your API key |
| `DRAWOFFER_BASE_URL` | Optional. Defaults to `https://www.drawoffer.com` |

## Security

- The key is sent only in the request header to DrawOffer. It is never logged or included in error messages.
- Don't commit the key to a repository. Delete keys you no longer use on the account page; deletion takes effect immediately.
- The account page shows when each key was last used, so you can spot and delete a key you don't recognise.
- Each key is limited to 60 requests per minute.

## Development

```bash
git clone https://github.com/ql-link/drawoffer-mcp.git
cd drawoffer-mcp
npm install
npm test
DRAWOFFER_API_KEY=dok_your_key node src/index.js
```

API: every request goes to `/api/open/v1/*` with `Authorization: Bearer dok_...`. Within a version, fields are only added; incompatible changes go to `/api/open/v2`.

## More open source from DrawOffer

- [drawoffer-skills](https://github.com/ql-link/drawoffer-skills): Agent Skills for resumes and job search
- [drawoffer-prompts](https://github.com/ql-link/drawoffer-prompts): ready-to-use job-search prompts
- [drawoffer-chinese-resume-templates](https://github.com/ql-link/drawoffer-chinese-resume-templates): 57 Chinese resume templates

## License

[MIT](./LICENSE) © ql-link
