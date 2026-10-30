#!/usr/bin/env node
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

import { createClient, DEFAULT_BASE_URL, DrawOfferError } from "./client.js";
import { createServer } from "./server.js";

try {
  const client = createClient({
    apiKey: process.env.DRAWOFFER_API_KEY?.trim(),
    baseUrl: process.env.DRAWOFFER_BASE_URL?.trim() || DEFAULT_BASE_URL,
  });
  await createServer(client).connect(new StdioServerTransport());
} catch (error) {
  // stdout carries the MCP protocol; diagnostics go to stderr only.
  console.error(error instanceof DrawOfferError ? error.message : error);
  process.exit(1);
}
