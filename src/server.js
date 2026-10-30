import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

import { DrawOfferError } from "./client.js";

export const SERVER_NAME = "drawoffer";
export const SERVER_VERSION = "1.0.0";

const id = z.string().regex(/^[1-9][0-9]{0,19}$/, "ID 是正整数字符串");

function ok(data) {
  return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
}

function fail(error) {
  const message = error instanceof DrawOfferError ? error.message : `调用失败：${error?.message ?? "未知错误"}`;
  return { isError: true, content: [{ type: "text", text: message }] };
}

const READ = { readOnlyHint: true, openWorldHint: true };
const WRITE = { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true };

/** Builds the MCP server. `client` is the object returned by createClient. */
export function createServer(client) {
  const server = new McpServer({ name: SERVER_NAME, version: SERVER_VERSION });
  const tool = (name, config, handler) =>
    server.registerTool(name, config, async (args) => {
      try { return ok(await handler(args ?? {})); }
      catch (error) { return fail(error); }
    });

  tool("list_resumes", {
    title: "列出简历",
    description: "列出当前 DrawOffer 账号里的全部简历（ID、标题、是否默认简历、更新时间），按最近更新排序。",
    annotations: READ,
  }, () => client.listResumes());

  tool("get_resume", {
    title: "读取简历",
    description: "读取一份简历的正文（Markdown）。适合用来按岗位改简历、准备面试或写求职信。",
    inputSchema: { resume_id: id.describe("简历 ID，来自 list_resumes") },
    annotations: READ,
  }, ({ resume_id }) => client.getResume(resume_id));

  tool("list_jobs", {
    title: "列出岗位",
    description: "列出账号里保存的岗位 JD，支持关键词搜索和分页。",
    inputSchema: {
      keyword: z.string().max(200).optional().describe("按岗位名、公司、城市、描述等搜索"),
      cursor: z.string().max(4096).optional().describe("上一页返回的 next_cursor"),
      limit: z.number().int().min(1).max(100).optional().describe("每页条数，默认 20"),
    },
    annotations: READ,
  }, (args) => client.listJobs(args));

  tool("get_job", {
    title: "读取岗位",
    description: "读取一个岗位的完整 JD：职责描述、技能要求、城市、薪资、学历与经验要求和备注。",
    inputSchema: { job_id: id.describe("岗位 ID，来自 list_jobs") },
    annotations: READ,
  }, ({ job_id }) => client.getJob(job_id));

  tool("create_job", {
    title: "新增岗位",
    description: "把一个岗位 JD 保存到 DrawOffer，并自动生成一条「待投递」记录。同一岗位已存在时返回已有记录。需要读写权限的 Key。",
    inputSchema: {
      job_title: z.string().min(1).max(200).describe("岗位名称"),
      company_name: z.string().min(1).max(200).describe("公司名称"),
      description: z.string().max(200000).optional().describe("JD 正文：职责与要求"),
      skills: z.array(z.string().max(100)).max(100).optional().describe("技能关键词"),
      work_city: z.string().max(100).optional().describe("工作城市"),
      salary_text: z.string().max(128).optional().describe("薪资原文，例如「25-35K·15薪」"),
      source_url: z.string().url().max(2048).optional().describe("岗位原始链接"),
      notes: z.string().max(16000).optional().describe("个人备注"),
    },
    annotations: WRITE,
  }, (args) => client.createJob(args));

  tool("list_applications", {
    title: "列出投递记录",
    description: "列出求职进度：每条记录对应一个岗位，包含当前阶段、状态、投递时间和备注。",
    inputSchema: {
      scope: z.enum(["active", "archived", "all"]).optional().describe("active 进行中（默认）、archived 已归档、all 全部"),
      keyword: z.string().max(200).optional().describe("按公司或岗位名搜索"),
      cursor: z.string().max(4096).optional().describe("上一页返回的 next_cursor"),
      limit: z.number().int().min(1).max(200).optional().describe("每页条数，默认 50"),
    },
    annotations: READ,
  }, (args) => client.listApplications(args));

  tool("get_application", {
    title: "读取投递记录",
    description: "读取一条投递记录的当前阶段、状态、关联岗位与简历。",
    inputSchema: { application_id: id.describe("投递记录 ID，来自 list_applications") },
    annotations: READ,
  }, ({ application_id }) => client.getApplication(application_id));

  tool("create_application", {
    title: "新建投递记录",
    description: "为已保存的岗位新建投递记录。不填 applied_at 时记为「待投递」，填了则记为已投递、进入「筛选中」。岗位已有「待投递」记录时直接沿用并更新它；已经投递过的岗位会返回冲突。需要读写权限的 Key。",
    inputSchema: {
      job_description_id: id.describe("岗位 ID，来自 list_jobs 或 create_job"),
      resume_id: id.optional().describe("投递使用的简历 ID"),
      applied_at: z.string().datetime({ offset: true }).optional().describe("投递时间，ISO 8601，必须带时区，例如 2026-10-30T10:00:00+08:00"),
      notes: z.string().max(16000).optional().describe("备注，例如投递渠道"),
    },
    annotations: WRITE,
  }, (args) => client.createApplication(args));

  return server;
}
