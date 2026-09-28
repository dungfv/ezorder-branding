/**
 * Blog helpers: published-post query, tags, reading time, related posts, URLs.
 */
import { getCollection, type CollectionEntry } from 'astro:content';

export type BlogPost = CollectionEntry<'blog'>;

export const POSTS_PER_PAGE = 10;

/** All posts, newest first. Drafts are visible in `astro dev` but never in production builds. */
export async function getPublishedPosts(): Promise<BlogPost[]> {
  const posts = await getCollection('blog', ({ data }) => (import.meta.env.PROD ? !data.draft : true));
  return posts.sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());
}

export const postUrl = (post: BlogPost) => `/blog/${post.id}/`;

export function slugifyTag(tag: string): string {
  return tag
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export const tagUrl = (tag: string) => `/blog/tag/${slugifyTag(tag)}/`;

/** Unique tags with post counts, most used first. */
export function getAllTags(posts: BlogPost[]): { name: string; slug: string; count: number }[] {
  const tags = new Map<string, { name: string; slug: string; count: number }>();
  for (const post of posts) {
    for (const name of post.data.tags) {
      const slug = slugifyTag(name);
      const entry = tags.get(slug) ?? { name, slug, count: 0 };
      entry.count += 1;
      tags.set(slug, entry);
    }
  }
  return [...tags.values()].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

/** Estimated reading time in minutes (≈220 words per minute). */
export function readingTime(markdown = ''): number {
  const words = markdown
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .split(/\s+/)
    .filter(Boolean).length;
  return Math.max(1, Math.round(words / 220));
}

/** Posts sharing the most tags with `post`, then the most recent. */
export function getRelatedPosts(post: BlogPost, posts: BlogPost[], limit = 3): BlogPost[] {
  const tags = new Set(post.data.tags.map(slugifyTag));
  return posts
    .filter((candidate) => candidate.id !== post.id)
    .map((candidate) => ({
      candidate,
      score: candidate.data.tags.filter((tag) => tags.has(slugifyTag(tag))).length,
    }))
    .sort(
      (a, b) =>
        b.score - a.score || b.candidate.data.pubDate.valueOf() - a.candidate.data.pubDate.valueOf(),
    )
    .slice(0, limit)
    .map(({ candidate }) => candidate);
}

const dateFormatter = new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
export const formatDate = (date: Date) => dateFormatter.format(date);
