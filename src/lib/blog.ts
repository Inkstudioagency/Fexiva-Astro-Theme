import type { BlogPost } from './strapi';

/**
 * List rules for the blog sections. They reproduce the collection-list
 * settings of the original template (sort, filter and limit per list).
 */

const byDateDesc = (a: BlogPost, b: BlogPost) => b.publishedDate.localeCompare(a.publishedDate);
const byDateAsc = (a: BlogPost, b: BlogPost) => a.publishedDate.localeCompare(b.publishedDate);

/** Home / About "Stay Updated" section: 3 posts, oldest published date first (as in the original). */
export const homePosts = (posts: BlogPost[], limit = 3) => [...posts].sort(byDateAsc).slice(0, limit);

/** Blog hero: the newest featured post is the large card, the next 3 featured posts the side list. */
export function featuredPosts(posts: BlogPost[]) {
  const featured = posts.filter((p) => p.featured).sort(byDateDesc);
  return { main: featured.slice(0, 1), side: featured.slice(1, 4) };
}

/** Blog "Latest News" tab panes. */
export const postsInCategory = (posts: BlogPost[], category?: string) =>
  [...posts].filter((p) => !category || p.category === category).sort(byDateDesc);

/** "More Related Blogs": same category, excluding the current post. */
export const relatedPosts = (posts: BlogPost[], current: BlogPost, limit = 3) =>
  postsInCategory(posts, current.category)
    .filter((p) => p.documentId !== current.documentId)
    .slice(0, limit);

export const postUrl = (post: Pick<BlogPost, 'slug'>) => `/blog/${post.slug}`;
export const readTimeLabel = (post: Pick<BlogPost, 'readTime'>) => (post.readTime ? `${post.readTime} Min` : '');
