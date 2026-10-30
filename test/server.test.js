import assert from "node:assert/strict";
import { test } from "node:test";

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";

import { createClient, DrawOfferError } from "../src/client.js";
import { createServer } from "../src/server.js";

const KEY = "dok_" + "t".repeat(43);

function fakeFetch(routes) {
  const calls = [];
  const fetchImpl = async (url, init) => {
    calls.push({ url: new URL(url), init });
    const route = routes[`${init.method} ${new URL(url).pathname}`];
    if (!route) return new Response(JSON.stringify({ error: "NOT_FOUND" }), { status: 404 });
    const { status = 200, body, headers } = typeof route === "function" ? route(new URL(url), init) : route;
    return new Response(JSON.stringify(body), { status, headers });
  };
  return { fetchImpl, calls };
}

async function connect(fetchImpl) {
  const server = createServer(createClient({ apiKey: KEY, baseUrl: "https://example.test/", fetchImpl }));
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  await server.connect(serverTransport);
  const client = new Client({ name: "test", version: "0.0.0" });
  await client.connect(clientTransport);
  return client;
}

const text = (result) => result.content[0].text;

test("exposes the eight tools with read/write hints", async () => {
  const client = await connect(fakeFetch({}).fetchImpl);
  const { tools } = await client.listTools();
  assert.deepEqual(tools.map((tool) => tool.name).sort(), [
    "create_application", "create_job", "get_application", "get_job",
    "get_resume", "list_applications", "list_jobs", "list_resumes",
  ]);
  const writes = tools.filter((tool) => tool.annotations?.readOnlyHint === false).map((tool) => tool.name).sort();
  assert.deepEqual(writes, ["create_application", "create_job"]);
});

test("reads a resume with the key only in the Authorization header", async () => {
  const { fetchImpl, calls } = fakeFetch({
    "GET /api/open/v1/resumes/12": { body: { id: "12", title: "后端简历", content_markdown: "# 张三" } },
  });
  const client = await connect(fetchImpl);
  const result = await client.callTool({ name: "get_resume", arguments: { resume_id: "12" } });
  assert.equal(result.isError, undefined);
  assert.equal(JSON.parse(text(result)).content_markdown, "# 张三");
  assert.equal(calls[0].init.headers.Authorization, `Bearer ${KEY}`);
  assert.equal(calls[0].url.href, "https://example.test/api/open/v1/resumes/12");
  assert.ok(!calls[0].url.href.includes(KEY));
});

test("passes list filters as query parameters and skips empty ones", async () => {
  const { fetchImpl, calls } = fakeFetch({ "GET /api/open/v1/jobs": { body: { items: [], next_cursor: null } } });
  const client = await connect(fetchImpl);
  await client.callTool({ name: "list_jobs", arguments: { keyword: "后端", limit: 5 } });
  assert.equal(calls[0].url.searchParams.get("keyword"), "后端");
  assert.equal(calls[0].url.searchParams.get("limit"), "5");
  assert.equal(calls[0].url.searchParams.has("cursor"), false);
});

test("creates a job with a JSON body", async () => {
  const { fetchImpl, calls } = fakeFetch({
    "POST /api/open/v1/jobs": { status: 201, body: { job: { id: "3" }, application_id: "9", created: true } },
  });
  const client = await connect(fetchImpl);
  const result = await client.callTool({ name: "create_job", arguments: { job_title: "数据工程师", company_name: "虚构公司" } });
  assert.equal(JSON.parse(text(result)).application_id, "9");
  assert.deepEqual(JSON.parse(calls[0].init.body), { job_title: "数据工程师", company_name: "虚构公司" });
});

test("turns API errors into readable Chinese messages without the key", async () => {
  const { fetchImpl } = fakeFetch({
    "POST /api/open/v1/jobs": { status: 403, body: { error: "API_KEY_SCOPE_DENIED" } },
    "GET /api/open/v1/resumes": { status: 401, body: { error: "API_KEY_INVALID" } },
    "GET /api/open/v1/jobs": { status: 429, body: { error: "API_KEY_RATE_LIMITED" }, headers: { "Retry-After": "42" } },
  });
  const client = await connect(fetchImpl);
  const denied = await client.callTool({ name: "create_job", arguments: { job_title: "x", company_name: "y" } });
  assert.equal(denied.isError, true);
  assert.match(text(denied), /只读/);
  const invalid = await client.callTool({ name: "list_resumes", arguments: {} });
  assert.match(text(invalid), /API Key 无效/);
  const limited = await client.callTool({ name: "list_jobs", arguments: {} });
  assert.match(text(limited), /42 秒后重试/);
  for (const result of [denied, invalid, limited]) assert.ok(!text(result).includes(KEY));
});

test("rejects malformed IDs before calling the API", async () => {
  const { fetchImpl, calls } = fakeFetch({});
  const client = await connect(fetchImpl);
  const result = await client.callTool({ name: "get_job", arguments: { job_id: "../admin" } });
  assert.equal(result.isError, true);
  assert.equal(calls.length, 0);
});

test("refuses to start without a dok_ key", () => {
  assert.throws(() => createClient({ apiKey: "" }), (error) => error instanceof DrawOfferError && error.code === "API_KEY_MISSING");
  assert.throws(() => createClient({ apiKey: "sk-something" }), DrawOfferError);
});
