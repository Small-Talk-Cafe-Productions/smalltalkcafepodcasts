/**
 * SEO Helper Utilities
 *
 * Functions to generate SEO meta tags and structured data.
 */

import type { SEOConfig, ShowConfig } from './types';
import type { RssEpisode } from '@/utils/rss';

/**
 * Generate Schema.org structured data for podcast show
 */
export function generatePodcastSchema(
  show: ShowConfig,
  seo: SEOConfig
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'PodcastSeries',
    name: show.title,
    description: show.description,
    image: show.artworkUrl,
    url: seo.siteUrl,
  };
}

/**
 * Generate Open Graph meta tags
 */
export function generateOGTags(seo: SEOConfig, show?: ShowConfig) {
  return {
    'og:type': 'website',
    'og:title': show?.title || seo.title,
    'og:description': show?.description || seo.description,
    'og:image': seo.ogImage,
    'og:url': seo.siteUrl,
    'og:site_name': 'Small Talk Café Podcasts',
  };
}

/**
 * Generate Twitter Card meta tags
 */
export function generateTwitterTags(seo: SEOConfig, show?: ShowConfig) {
  return {
    'twitter:card': 'summary_large_image',
    'twitter:title': show?.title || seo.title,
    'twitter:description': show?.description || seo.description,
    'twitter:image': seo.ogImage,
    'twitter:site': seo.twitterHandle ? `@${seo.twitterHandle}` : undefined,
  };
}

/**
 * Format duration in seconds to human-readable string
 */
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

/**
 * Format date to localized string
 */
export function formatDate(isoDate: string): string {
  const date = new Date(isoDate);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Generate Schema.org PodcastEpisode structured data for individual episode pages.
 * Injected as JSON-LD — picked up by Google for rich search results.
 */
export function generateEpisodeSchema(
  episode: RssEpisode,
  show: ShowConfig,
  seo: SEOConfig,
  episodeUrl: string,
) {
  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'PodcastEpisode',
    url: episodeUrl,
    name: episode.title,
    description: episode.description,
    datePublished: episode.pubDate,
    partOfSeries: {
      '@type': 'PodcastSeries',
      name: show.subtitle ? `${show.title}: ${show.subtitle}` : show.title,
      url: `${seo.siteUrl}/shows/${show.id}`,
    },
  };
  if (episode.audioUrl) {
    schema.associatedMedia = {
      '@type': 'MediaObject',
      contentUrl: episode.audioUrl,
      encodingFormat: episode.audioType ?? 'audio/mpeg',
    };
  }
  if (episode.duration) {
    schema.timeRequired = episode.duration;
  }
  if (episode.episodeNumber) {
    schema.episodeNumber = episode.episodeNumber;
  }
  if (episode.artworkUrl) {
    schema.image = episode.artworkUrl;
  }
  return schema;
}

/**
 * Generate Schema.org BreadcrumbList structured data.
 * Crumbs appear in Google search result snippets.
 */
export function generateBreadcrumbSchema(crumbs: Array<{ name: string; url: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((crumb, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: crumb.name,
      item: crumb.url,
    })),
  };
}
