/**
 * SEO Helper Utilities
 * 
 * Functions to generate SEO meta tags and structured data.
 */

import type { SEOConfig, ShowConfig } from './types';

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
