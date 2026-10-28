/**
 * Minimal client for the Strapi MCP server (Streamable HTTP transport, stateless).
 * Docs: https://docs.strapi.io/cms/features/strapi-mcp-server
 *
 * Every call is a JSON-RPC 2.0 POST to /mcp authenticated with an Admin token.
 */
export function createMcpClient({ url, token }) {
  let nextId = 1;

  async function rpc(method, params) {
    const response = await fetch(`${url.replace(/\/+$/, '')}/mcp`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Accept: 'application/json, text/event-stream',
      },
      body: JSON.stringify({ jsonrpc: '2.0', id: nextId++, method, params }),
    });
    const text = await response.text();
    if (!response.ok) throw new Error(`MCP ${method} → HTTP ${response.status}: ${text}`);
    // The server may answer with plain JSON or a one-shot SSE stream.
    const payload = response.headers.get('content-type')?.includes('text/event-stream')
      ? text.split('\n').filter((l) => l.startsWith('data:')).map((l) => l.slice(5).trim()).filter(Boolean).at(-1)
      : text;
    const message = JSON.parse(payload);
    if (message.error) throw new Error(`MCP ${method} → ${message.error.message} ${JSON.stringify(message.error.data ?? '')}`);
    return message.result;
  }

  return {
    initialize: () =>
      rpc('initialize', {
        protocolVersion: '2025-06-18',
        capabilities: {},
        clientInfo: { name: 'fexiva-seed', version: '1.0.0' },
      }),
    listTools: async () => (await rpc('tools/list', {})).tools,
    /** Calls a tool and returns its structured (or JSON-parsed text) result. */
    async call(name, args = {}) {
      const result = await rpc('tools/call', { name, arguments: args });
      if (result.isError) {
        throw new Error(`MCP tool ${name} failed: ${result.content?.map((c) => c.text).join(' ')}`);
      }
      if (result.structuredContent) return result.structuredContent;
      const text = result.content?.find((c) => c.type === 'text')?.text;
      try {
        return text ? JSON.parse(text) : result;
      } catch {
        return text;
      }
    },
  };
}
