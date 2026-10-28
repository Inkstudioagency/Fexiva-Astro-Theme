import { STRAPI_API_TOKEN, STRAPI_URL } from 'astro:env/server';
import sampleContent from '../data/sample-content.json';

/* ------------------------------------------------------------------ */
/* Types (Strapi 5 REST responses are flat: no `attributes` wrapper)   */
/* ------------------------------------------------------------------ */

export interface StrapiMedia {
  id: number;
  documentId: string;
  url: string;
  alternativeText: string | null;
  width: number | null;
  height: number | null;
  mime: string;
}

/** Strapi "Blocks" rich text. */
export type BlocksContent = Block[];
export type Block =
  | { type: 'paragraph'; children: InlineNode[] }
  | { type: 'heading'; level: 1 | 2 | 3 | 4 | 5 | 6; children: InlineNode[] }
  | { type: 'list'; format: 'ordered' | 'unordered'; children: Block[] }
  | { type: 'list-item'; children: InlineNode[] }
  | { type: 'quote'; children: InlineNode[] }
  | { type: 'code'; children: InlineNode[] }
  | { type: 'image'; image: Omit<StrapiMedia, 'id' | 'documentId'>; children: InlineNode[] };
export type InlineNode =
  | { type: 'text'; text: string; bold?: boolean; italic?: boolean; underline?: boolean; strikethrough?: boolean; code?: boolean }
  | { type: 'link'; url: string; children: InlineNode[] };

export interface Author {
  id: number;
  documentId: string;
  name: string;
  role: string | null;
  bio: string | null;
  photo: StrapiMedia | null;
}

export interface BlogPost {
  id: number;
  documentId: string;
  title: string;
  slug: string;
  excerpt: string | null;
  mainImage: StrapiMedia | null;
  body: BlocksContent | null;
  articleImages: StrapiMedia[] | null;
  bodyContinued: BlocksContent | null;
  readTime: number | null;
  publishedDate: string;
  category: string;
  featured: boolean;
  author: Author | null;
}

export interface Integration {
  id: number;
  documentId: string;
  name: string;
  slug: string;
  excerpt: string | null;
  logo: StrapiMedia | null;
  category: string | null;
  body: BlocksContent | null;
  articleImages: StrapiMedia[] | null;
  bodyContinued: BlocksContent | null;
}

interface StrapiListResponse<T> {
  data: T[];
  meta: { pagination: { page: number; pageCount: number; total: number } };
}

/* ------------------------------------------------------------------ */
/* Client                                                              */
/* ------------------------------------------------------------------ */

/**
 * When STRAPI_URL is not set the theme renders the bundled sample content
 * (src/data/sample-content.json, media in public/cms) so it works out of the box.
 * Set STRAPI_URL (and STRAPI_API_TOKEN) to load live content from Strapi.
 */
export const usingSampleContent = !STRAPI_URL;
const baseUrl = (STRAPI_URL ?? '').replace(/\/+$/, '');

if (usingSampleContent) {
  console.info('[strapi] STRAPI_URL is not set — rendering the bundled sample content.');
}

/** Resolves a Strapi media URL. Local uploads are relative ("/uploads/x.webp"); cloud providers return absolute URLs. */
export function mediaUrl(media: { url: string } | null | undefined): string {
  if (!media?.url) return '';
  return /^https?:\/\//.test(media.url) ? media.url : `${baseUrl}${media.url}`;
}

async function request<T>(path: string, params: URLSearchParams): Promise<T> {
  const url = `${baseUrl}/api/${path}?${params}`;
  let response: Response;
  try {
    response = await fetch(url, {
      headers: STRAPI_API_TOKEN ? { Authorization: `Bearer ${STRAPI_API_TOKEN}` } : {},
    });
  } catch (error) {
    throw new Error(
      `[strapi] Could not reach Strapi at ${baseUrl}. Start the CMS (cd ../Strapi && npm run develop) or set STRAPI_URL in .env.`,
      { cause: error },
    );
  }
  if (!response.ok) {
    throw new Error(`[strapi] ${response.status} ${response.statusText} for ${url}. Check STRAPI_API_TOKEN and the API token permissions.`);
  }
  return response.json() as Promise<T>;
}

/** Fetches every page of a collection type. */
async function findAll<T>(path: string, query: Record<string, string>): Promise<T[]> {
  const items: T[] = [];
  let page = 1;
  let pageCount = 1;
  do {
    const params = new URLSearchParams({ ...query, 'pagination[page]': String(page), 'pagination[pageSize]': '100' });
    const res = await request<StrapiListResponse<T>>(path, params);
    items.push(...res.data);
    pageCount = res.meta.pagination.pageCount;
    page++;
  } while (page <= pageCount);
  return items;
}

/**
 * Memoise per process during `astro build` so every page shares one request per collection.
 * In `astro dev` data is fetched on every request so Strapi edits show up on refresh.
 */
function cached<T>(fn: () => Promise<T>): () => Promise<T> {
  let promise: Promise<T> | undefined;
  return () => {
    if (import.meta.env.DEV) return fn();
    promise ??= fn();
    return promise;
  };
}

/* ------------------------------------------------------------------ */
/* Queries                                                             */
/* ------------------------------------------------------------------ */

/** All published blog posts, newest first. */
export const getBlogPosts = cached(async () =>
  usingSampleContent
    ? (sampleContent.blogPosts as BlogPost[]).toSorted((a, b) => b.publishedDate.localeCompare(a.publishedDate))
    : findAll<BlogPost>('blog-posts', {
        'populate[mainImage]': 'true',
        'populate[articleImages]': 'true',
        'populate[author][populate][photo]': 'true',
        sort: 'publishedDate:desc',
      }),
);

/** All published integrations, A–Z. */
export const getIntegrations = cached(async () =>
  usingSampleContent
    ? (sampleContent.integrations as Integration[]).toSorted((a, b) => a.name.localeCompare(b.name))
    : findAll<Integration>('integrations', {
        'populate[logo]': 'true',
        'populate[articleImages]': 'true',
        sort: 'name:asc',
      }),
);
