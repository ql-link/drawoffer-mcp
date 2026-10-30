// HTTP client for the DrawOffer open API (/api/open/v1). The API key only travels in the
// Authorization header and is never logged or echoed back in error messages.

export const DEFAULT_BASE_URL = "https://www.drawoffer.com";

const ERROR_MESSAGES = {
  API_KEY_INVALID: "API Key 无效、已删除，或账号已停用。请在 DrawOffer 账号页重新创建 Key，并更新 DRAWOFFER_API_KEY。",
  API_KEY_SCOPE_DENIED: "这把 API Key 是只读的，不能新增内容。如需写入，请在 DrawOffer 账号页创建一把「读写」Key。",
  API_KEY_RATE_LIMITED: "请求太频繁（每把 Key 每分钟最多 60 次），请稍后再试。",
  NOT_FOUND: "没有找到这条记录，或它不属于当前账号。",
  AUTH_SERVICE_UNAVAILABLE: "DrawOffer 鉴权服务暂时不可用，请稍后再试。",
};

export class DrawOfferError extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export function createClient({ apiKey, baseUrl = DEFAULT_BASE_URL, fetchImpl = globalThis.fetch } = {}) {
  if (!apiKey || !apiKey.startsWith("dok_")) {
    throw new DrawOfferError(0, "API_KEY_MISSING", "缺少 DrawOffer API Key。请在 DrawOffer 账号页创建 Key，并通过环境变量 DRAWOFFER_API_KEY 传给 MCP Server。");
  }
  const root = baseUrl.replace(/\/+$/, "") + "/api/open/v1";

  async function request(method, path, { query, body } = {}) {
    const url = new URL(root + path);
    for (const [key, value] of Object.entries(query ?? {})) {
      if (value !== undefined && value !== null && value !== "") url.searchParams.set(key, String(value));
    }
    let response;
    try {
      response = await fetchImpl(url, {
        method,
        headers: {
          Authorization: `Bearer ${apiKey}`,
          Accept: "application/json",
          ...(body ? { "Content-Type": "application/json" } : {}),
        },
        body: body ? JSON.stringify(body) : undefined,
      });
    } catch (error) {
      throw new DrawOfferError(0, "NETWORK_ERROR", `无法连接 ${new URL(root).origin}：${error?.message ?? "网络错误"}`);
    }
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const code = typeof data?.error === "string" ? data.error : `HTTP_${response.status}`;
      let message = ERROR_MESSAGES[code] ?? `DrawOffer 返回错误 ${response.status}（${code}）。`;
      if (code === "API_KEY_RATE_LIMITED" && response.headers.get("retry-after")) {
        message += `建议 ${response.headers.get("retry-after")} 秒后重试。`;
      }
      throw new DrawOfferError(response.status, code, message);
    }
    return data;
  }

  const id = (value) => encodeURIComponent(String(value));
  return {
    listResumes: () => request("GET", "/resumes"),
    getResume: (resumeId) => request("GET", `/resumes/${id(resumeId)}`),
    listJobs: (query) => request("GET", "/jobs", { query }),
    getJob: (jobId) => request("GET", `/jobs/${id(jobId)}`),
    createJob: (body) => request("POST", "/jobs", { body }),
    listApplications: (query) => request("GET", "/applications", { query }),
    getApplication: (applicationId) => request("GET", `/applications/${id(applicationId)}`),
    createApplication: (body) => request("POST", "/applications", { body }),
  };
}
