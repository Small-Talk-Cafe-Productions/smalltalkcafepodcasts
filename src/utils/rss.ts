/**
 * RSS Feed Utilities
 *
 * Fetches and parses Castos podcast RSS feeds at build time.
 * Each show's episodes become individually SEO-indexed pages via getStaticPaths.
 * Returns an empty array on any failure so builds never break.
 */

import Parser from 'rss-parser';

export interface RssEpisode {
  /** URL-safe slug derived from episode title (unique within a show) */
  slug: string;
  /** Episode title */
  title: string;
  /** Short plain-text description (≤ 200 chars) for meta description */
  description: string;
  /** Full HTML show website content rendered on the episode page */
  contentHtml: string;
  /** ISO 8601 publish date */
  pubDate: string;
  /** Direct audio file URL (from RSS <enclosure>) */
  audioUrl?: string;
  /** Audio MIME type, e.g. "audio/mpeg" */
  audioType?: string;
  /** Duration string, e.g. "12:34" or "1:02:45" */
  duration?: string;
  /** Episode number from iTunes namespace */
  episodeNumber?: string;
  /** Season number from iTunes namespace */
  season?: string;
  /** Episode artwork URL */
  artworkUrl?: string;
  /** Original GUID from the RSS feed */
  guid: string;
  /** Castos episode page link */
  link?: string;
}

/** Convert a title string into a URL-safe slug (strips diacritics, lowercases, hyphenates) */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // strip diacritics
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80);
}

type CustomItem = {
  'content:encoded'?: string;
  itunes?: {
    image?: string | { href?: string };
    duration?: string;
    episode?: string | number;
    season?: string | number;
    subtitle?: string;
    summary?: string;
  };
};

/** A single episode paired with the show it belongs to. */
export interface EpisodeWithShow {
  episode: RssEpisode;
  showId: string;
  showTitle: string;
  showSubtitle?: string;
}

/**
 * Fetch the single most recently published episode across all shows that have
 * an RSS URL configured. Used on the homepage to guarantee fresh content.
 */
export async function fetchLatestEpisodeAcrossShows(
  shows: Array<{ id: string; title: string; subtitle?: string; rssUrl?: string }>
): Promise<EpisodeWithShow | null> {
  const showsWithRss = shows.filter((s) => s.rssUrl);
  if (showsWithRss.length === 0) return null;

  const settled = await Promise.allSettled(
    showsWithRss.map(async (show) => {
      const episodes = await fetchEpisodes(show.rssUrl!);
      if (episodes.length === 0) return null;
      // Castos feeds are newest-first in feed order
      return {
        episode: episodes[0],
        showId: show.id,
        showTitle: show.title,
        showSubtitle: show.subtitle,
      } satisfies EpisodeWithShow;
    })
  );

  const candidates: EpisodeWithShow[] = [];
  for (const r of settled) {
    if (r.status === 'fulfilled' && r.value !== null) {
      candidates.push(r.value);
    }
  }

  if (candidates.length === 0) return null;

  return candidates.sort(
    (a, b) =>
      new Date(b.episode.pubDate).getTime() - new Date(a.episode.pubDate).getTime()
  )[0];
}

/**
 * Fetch the most recent episode individually for each show that has an RSS URL.
 * Returns a record keyed by show id. Shows with no RSS or fetch failure map to null.
 * Used on the homepage to display a "latest episode" row per show.
 */
export async function fetchLatestEpisodePerShow(
  shows: Array<{ id: string; title: string; subtitle?: string; rssUrl?: string }>
): Promise<Record<string, EpisodeWithShow | null>> {
  const results: Record<string, EpisodeWithShow | null> = {};

  await Promise.allSettled(
    shows.map(async (show) => {
      if (!show.rssUrl) {
        results[show.id] = null;
        return;
      }
      const episodes = await fetchEpisodes(show.rssUrl);
      results[show.id] =
        episodes.length === 0
          ? null
          : { episode: episodes[0], showId: show.id, showTitle: show.title, showSubtitle: show.subtitle };
    })
  );

  return results;
}

/**
 * Fetch all episodes from a Castos RSS feed URL.
 * Slugs are deduplicated: if two episode titles are identical the second gets a
 * numeric suffix (-2, -3, …).
 */
export async function fetchEpisodes(rssUrl: string): Promise<RssEpisode[]> {
  if (!rssUrl) return [];

  try {
    const parser = new Parser<Record<string, unknown>, CustomItem>({
      customFields: {
        item: [['content:encoded', 'content:encoded']],
      },
    });

    const feed = await parser.parseURL(rssUrl);
    const items = feed.items ?? [];

    const episodes: RssEpisode[] = items.map((item) => {
      const title = item.title?.trim() || 'Untitled Episode';
      const guid = item.guid || item.link || title;
      const contentEncoded = (item as CustomItem)['content:encoded'] ?? '';

      // itunes image can be a string URL or an object with href
      const rawImage = item.itunes?.image as string | { href?: string } | undefined;
      const artworkUrl =
        typeof rawImage === 'string'
          ? rawImage
          : (rawImage as { href?: string } | undefined)?.href ?? undefined;

      const description =
        (item.contentSnippet?.slice(0, 200) || item.itunes?.subtitle || '').trim();

      return {
        slug: slugify(title),
        title,
        description,
        contentHtml: contentEncoded || item.content || '',
        pubDate: item.isoDate ?? item.pubDate ?? new Date().toISOString(),
        audioUrl: item.enclosure?.url,
        audioType: item.enclosure?.type,
        duration: item.itunes?.duration,
        episodeNumber: item.itunes?.episode ? String(item.itunes.episode) : undefined,
        season: item.itunes?.season ? String(item.itunes.season) : undefined,
        artworkUrl,
        guid,
        link: item.link,
      };
    });

    // Deduplicate slugs within this feed
    const slugCount = new Map<string, number>();
    for (const ep of episodes) {
      slugCount.set(ep.slug, (slugCount.get(ep.slug) ?? 0) + 1);
    }
    const slugOccurrence = new Map<string, number>();
    for (const ep of episodes) {
      if ((slugCount.get(ep.slug) ?? 0) > 1) {
        const occ = (slugOccurrence.get(ep.slug) ?? 0) + 1;
        slugOccurrence.set(ep.slug, occ);
        ep.slug = occ === 1 ? ep.slug : `${ep.slug}-${occ}`;
      }
    }

    return episodes;
  } catch (error) {
    console.warn(`[RSS] Failed to fetch "${rssUrl}":`, (error as Error).message);
    return [];
  }
}
