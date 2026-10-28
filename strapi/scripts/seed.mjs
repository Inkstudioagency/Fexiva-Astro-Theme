/**
 * Seeds the Fexiva demo content into a running Strapi instance.
 *
 *  1. Media files (data/media) are uploaded with the Upload API — the Strapi MCP
 *     server cannot upload new files (see the MCP docs, "Known limitations").
 *  2. Media alt texts are set with the MCP `media_update_asset` tool.
 *  3. Authors, Blog Posts and Integrations are created and published with the
 *     MCP content tools (`create_*`, `publish_*`), then verified with `list_*`.
 *
 * Usage (Strapi must be running):
 *   STRAPI_ADMIN_EMAIL=... STRAPI_ADMIN_PASSWORD=... STRAPI_MCP_TOKEN=... npm run seed
 * The script is idempotent: existing files and entries (matched by name/slug) are skipped.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createMcpClient } from './lib/mcp-client.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const STRAPI_URL = (process.env.STRAPI_URL || 'http://localhost:1337').replace(/\/+$/, '');
const { STRAPI_ADMIN_EMAIL, STRAPI_ADMIN_PASSWORD, STRAPI_MCP_TOKEN } = process.env;

if (!STRAPI_ADMIN_EMAIL || !STRAPI_ADMIN_PASSWORD || !STRAPI_MCP_TOKEN) {
  console.error('Set STRAPI_ADMIN_EMAIL, STRAPI_ADMIN_PASSWORD and STRAPI_MCP_TOKEN (an Admin token, Settings → Admin Tokens).');
  process.exit(1);
}

const seed = JSON.parse(await fs.readFile(path.join(root, 'data', 'seed.json'), 'utf8'));
const mcp = createMcpClient({ url: STRAPI_URL, token: STRAPI_MCP_TOKEN });

/* ---------------------------------------------------------------- */
/* 1. Upload media (admin Upload API)                                */
/* ---------------------------------------------------------------- */
async function adminJwt() {
  const res = await fetch(`${STRAPI_URL}/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: STRAPI_ADMIN_EMAIL, password: STRAPI_ADMIN_PASSWORD }),
  });
  if (!res.ok) throw new Error(`Admin login failed: ${res.status} ${await res.text()}`);
  return (await res.json()).data.token;
}

const MIME = { '.webp': 'image/webp', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg' };

async function uploadMedia(jwt) {
  const headers = { Authorization: `Bearer ${jwt}` };
  const existing = await (await fetch(`${STRAPI_URL}/upload/files?pageSize=500`, { headers })).json();
  const byName = new Map((existing.results ?? existing).map((f) => [f.name, f]));
  const dir = path.join(root, 'data', 'media');
  for (const name of await fs.readdir(dir)) {
    if (byName.has(name)) continue;
    const form = new FormData();
    form.append('files', new Blob([await fs.readFile(path.join(dir, name))], { type: MIME[path.extname(name)] }), name);
    const res = await fetch(`${STRAPI_URL}/upload`, { method: 'POST', headers, body: form });
    if (!res.ok) throw new Error(`Upload ${name} failed: ${res.status} ${await res.text()}`);
    const [file] = await res.json();
    byName.set(name, file);
    console.log(`  uploaded ${name}`);
  }
  return byName;
}

/* ---------------------------------------------------------------- */
/* Helpers                                                           */
/* ---------------------------------------------------------------- */
const items = (result) => result?.data ?? result?.results ?? result?.items ?? [];

/**
 * MCP content tools are named `<operation>_<slug>`. Resolve the exact names from
 * tools/list so the script works whether the slug is `blog_post` or `blog-post`.
 */
let toolNames = [];
function tool(operation, type) {
  const variants = [type, type.replace(/_/g, '-'), type.replace(/-/g, '_')].map((t) => `${operation}_${t}`);
  const name = variants.find((v) => toolNames.includes(v));
  if (!name) throw new Error(`MCP tool "${operation}_${type}" not found. Check the Admin token permissions. Available: ${toolNames.join(', ')}`);
  return name;
}

async function findOne(type, field, value) {
  const result = await mcp.call(tool('list', type), { filters: { [field]: { $eq: value } }, status: 'draft' });
  return items(result)[0];
}

/** Replaces `{ type: 'image', file, alt }` seed blocks with real Strapi image blocks. */
function resolveBlocks(blocks, media) {
  if (!blocks) return blocks;
  return blocks.map((block) => {
    if (block.type !== 'image') return block;
    const file = media.get(block.file);
    const { id, documentId, url, name, mime, width, height, size, ext, hash, formats, provider, createdAt, updatedAt } = file;
    return {
      type: 'image',
      image: { id, documentId, url, name, alternativeText: block.alt, caption: null, mime, width, height, size, ext, hash, formats, provider, createdAt, updatedAt },
      children: [{ type: 'text', text: '' }],
    };
  });
}

async function upsert(type, key, data, { publish = true } = {}) {
  const found = await findOne(type, key, data[key]);
  if (found) {
    console.log(`  exists ${type}: ${data[key]}`);
    return found;
  }
  const created = await mcp.call(tool('create', type), { data });
  const entry = created?.data ?? created;
  if (publish) await mcp.call(tool('publish', type), { documentId: entry.documentId });
  console.log(`  created${publish ? ' + published' : ''} ${type}: ${data[key]}`);
  return entry;
}

/* ---------------------------------------------------------------- */
/* Run                                                               */
/* ---------------------------------------------------------------- */
console.log('→ Uploading media');
const media = await uploadMedia(await adminJwt());
const mediaId = (name) => (name ? media.get(name)?.id : undefined);

console.log('→ Connecting to the Strapi MCP server');
await mcp.initialize();
toolNames = (await mcp.listTools()).map((t) => t.name);
console.log(`  ${toolNames.length} tools: ${toolNames.join(', ')}`);

console.log('→ Setting media alt texts (media_update_asset)');
const alts = new Map();
for (const a of seed.authors) alts.set(a.photo, a.name);
for (const p of seed.blogPosts) alts.set(p.mainImage, p.title);
for (const i of seed.integrations) alts.set(i.logo, i.name);
for (const [file, alt] of alts) {
  const asset = media.get(file);
  if (asset && asset.alternativeText !== alt) {
    await mcp.call('media_update_asset', { id: asset.id, alternativeText: alt });
  }
}

console.log('→ Authors');
const authors = new Map();
for (const a of seed.authors) {
  const entry = await upsert('author', 'name', { name: a.name, role: a.role, bio: a.bio, photo: mediaId(a.photo) }, { publish: false });
  authors.set(a.name, entry.documentId);
}

console.log('→ Blog posts');
for (const p of seed.blogPosts) {
  await upsert('blog_post', 'slug', {
    title: p.title,
    slug: p.slug,
    excerpt: p.excerpt,
    mainImage: mediaId(p.mainImage),
    category: p.category,
    featured: p.featured,
    publishedDate: p.publishedDate,
    readTime: p.readTime,
    author: authors.get(p.author),
    body: resolveBlocks(p.body, media),
    articleImages: p.articleImages.map(mediaId),
    bodyContinued: resolveBlocks(p.bodyContinued, media),
  });
}

console.log('→ Integrations');
for (const i of seed.integrations) {
  await upsert('integration', 'slug', {
    name: i.name,
    slug: i.slug,
    excerpt: i.excerpt,
    logo: mediaId(i.logo),
    category: i.category,
    body: resolveBlocks(i.body, media),
    articleImages: i.articleImages.map(mediaId),
    bodyContinued: resolveBlocks(i.bodyContinued, media),
  });
}

console.log('→ Verifying with list_* tools');
for (const type of ['author', 'blog_post', 'integration']) {
  const result = await mcp.call(tool('list', type), { pagination: { pageSize: 100 } });
  console.log(`  ${type}: ${items(result).length} entries`);
}
console.log('✓ Seed complete');
