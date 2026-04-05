/**
 * SEO Helper Utilities
 *
 * Functions to generate SEO meta tags and structured data.
 */

import type { SEOConfig, ShowConfig, SocialLinksConfig } from './types';
import type { RssEpisode } from '@/utils/rss';
import type { ShopifyProduct } from '@/utils/shopify';

/**
 * Generate Schema.org PodcastSeries structured data for a show.
 * URL now correctly points to the show's own page.
 */
/** Resolve a potentially-relative asset path to an absolute URL. */
function toAbsoluteUrl(path: string, siteUrl: string): string {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  return `${siteUrl}/${path.replace(/^\//, '')}`;
}

export function generatePodcastSchema(
  show: ShowConfig,
  seo: SEOConfig,
  options?: { numberOfEpisodes?: number }
) {
  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'PodcastSeries',
    name: show.subtitle ? `${show.title}: ${show.subtitle}` : show.title,
    description: show.description,
    image: toAbsoluteUrl(show.artworkUrl, seo.siteUrl),
    url: `${seo.siteUrl}/shows/${show.id}/`,
  };
  // RSS feed URL — lets Google discover and index individual episodes
  if (show.rssUrl) schema.webFeed = show.rssUrl;
  // Language the show is presented in (BCP 47)
  if (show.language) schema.inLanguage = show.language;
  // Launch date — appears in Google knowledge panels
  if (show.releaseDate) schema.startDate = show.releaseDate;
  // Episode count — a strong relevance signal for podcast-specific search
  if (options?.numberOfEpisodes !== undefined) schema.numberOfEpisodes = options.numberOfEpisodes;
  return schema;
}

/**
 * Generate Schema.org Organization structured data.
 * Tells Google who is behind the site and links to social profiles.
 */
export function generateOrganizationSchema(
  seo: SEOConfig,
  socialLinks: SocialLinksConfig
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Small Talk Café Productions',
    url: seo.siteUrl,
    logo: {
      '@type': 'ImageObject',
      url: seo.ogImage,
    },
    sameAs: [socialLinks.youtube, socialLinks.instagram, socialLinks.shopify],
  };
}

/**
 * Generate Schema.org WebSite structured data.
 * Enables Google sitelinks search box eligibility.
 */
export function generateWebSiteSchema(seo: SEOConfig) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Small Talk Café Podcasts',
    url: seo.siteUrl,
    description: seo.description,
  };
}

/**
 * Generate a Schema.org ItemList of Products for the shop page.
 * Enables Google Shopping Free Listings and Product Rich Results.
 */
export function generateProductListSchema(
  products: ShopifyProduct[],
  seo: SEOConfig
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Small Talk Café Merchandise — German Learning Gear',
    url: `${seo.siteUrl}/shop/`,
    itemListElement: products.map((p, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      item: {
        '@type': 'Product',
        name: p.title,
        description: p.teaser || undefined,
        image: p.images[0]?.src,
        url: p.url,
        brand: { '@type': 'Brand', name: p.vendor || 'Small Talk Café' },
        offers: {
          '@type': 'Offer',
          price: p.price,
          priceCurrency: 'EUR',
          availability: p.available
            ? 'https://schema.org/InStock'
            : 'https://schema.org/OutOfStock',
          url: p.url,
        },
      },
    })),
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
      url: `${seo.siteUrl}/shows/${show.id}/`,
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
