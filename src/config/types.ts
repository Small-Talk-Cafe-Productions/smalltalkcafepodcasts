/**
 * Configuration Schema for Small Talk Café Podcasts Website
 * 
 * This file defines the TypeScript interfaces for the site configuration.
 * 
 * Usage:
 *   import type { SiteConfig } from '@/config/types';
 *   
 *   export const siteConfig: SiteConfig = {
 *     // Your configuration here
 *   };
 * 
 * @see ../specs/001-homepage-v1/data-model.md for detailed documentation
 */

/**
 * Brand Configuration
 * 
 * Defines visual identity including colors, fonts, and logo.
 */
export interface BrandConfig {
  /** Site/podcast name */
  name: string;
  
  /** Path to logo image (optional, recommended SVG or PNG with transparent background) 
   * Must be in public/ directory, use absolute path starting with /
   * Example: "/images/logo.svg"
   */
  logo?: string;
  
  /** Brand color palette (hex codes with # or CSS color names) */
  colors: {
    /** Primary brand color (used for headers, CTAs) */
    primary: string;
    
    /** Secondary brand color (used for accents, highlights) */
    secondary: string;
    
    /** Accent color (used for links, interactive elements) */
    accent: string;
    
    /** Background color (default: white or light neutral) */
    background: string;
    
    /** Text color (must meet WCAG AA contrast ratio with background) */
    text: string;
  };
  
  /** Typography configuration */
  fonts: {
    /** Font family for headings with fallbacks */
    heading: string;
    
    /** Font family for body text with fallbacks */
    body: string;
    
    /** Show title typography configuration */
    showTitle?: {
      /** Font family (defaults to heading font if not specified) */
      family?: string;
      
      /** Font size in rem units (default: 2.5rem for desktop, 2rem for mobile) */
      sizeLarge?: string;
      
      /** Font size for mobile in rem units */
      sizeSmall?: string;
    };
  };
}

/**
 * Featured Show Configuration
 * 
 * Defines the featured podcast show on the homepage.
 * References a show from the shows array by ID to avoid data duplication.
 */
export interface FeaturedShowConfig {
  /** ID of the show to feature (must match a show ID in the shows array) */
  showId: string;
  
  /** Display options for the featured show */
  displayOptions?: {
    /** Show the title above the buttons (default: true) */
    showTitle?: boolean;
    
    /** Show the description above the buttons (default: true) */
    showDescription?: boolean;
  };
}

/**
 * Show Configuration (for Shows Page Grid)
 * 
 * Defines individual podcast show data for the Shows page grid and individual show pages.
 * Each show gets its own page at /shows/[id] with an embedded player.
 */
export interface ShowConfig {
  /** Show ID (unique identifier, URL-safe slug) */
  id: string;
  
  /** Show title */
  title: string;
  
  /** Show subtitle (optional second line) */
  subtitle?: string;
  
  /** Show description/summary (100-200 characters recommended) */
  description: string;
  
  /** Path or URL to show artwork image (square aspect ratio recommended) */
  artworkUrl: string;
  
  /** Castos playlist player URL (primary embed player) */
  castosPlaylistUrl?: string;

  /** Castos show website URL (links to the public show page on Castos) */
  showWebsiteUrl?: string;

  /** Castos RSS feed URL — used at build time to generate individual episode pages */
  rssUrl?: string;
  
  /** Embedded player URL (Spotify or Apple Podcasts embed) - fallback if Castos not provided */
  embedUrl?: string;
  
  /** Platform type for embed */
  platform?: 'spotify' | 'apple' | 'castos';
  
  /** Direct link to the show on Spotify (not embed URL) */
  spotifyUrl: string;
  
  /** Direct link to the show on Apple Podcasts (not embed URL) */
  applePodcastsUrl: string;
  
  /** Show release date (ISO 8601 format: YYYY-MM-DD) */
  releaseDate?: string;
}

/**
 * Social Links Configuration
 * 
 * Defines external platform links for social media and e-commerce.
 */
export interface SocialLinksConfig {
  /** YouTube channel URL */
  youtube: string;
  
  /** Instagram profile URL */
  instagram: string;
  
  /** Shopify store URL */
  shopify: string;
}

/**
 * SEO Configuration
 * 
 * Defines search engine optimization and social sharing metadata.
 */
export interface SEOConfig {
  /** Page title (shown in browser tab and search results) */
  title: string;
  
  /** Meta description (shown in search results) */
  description: string;
  
  /** Keywords for search engines */
  keywords: string[];
  
  /** Open Graph image URL for social media previews */
  ogImage: string;
  
  /** Site URL (used for canonical links and sitemap) */
  siteUrl: string;
  
  /** Twitter handle (optional, without @ symbol) */
  twitterHandle?: string;

  /**
   * Google Analytics 4 Measurement ID (optional).
   * Format: "G-XXXXXXXXXX" — get this from your GA4 property settings.
   * When set, adds the GA4 global site tag to every page.
   */
  googleAnalyticsId?: string;

  /**
   * Google Search Console HTML tag verification code (optional).
   * Copy only the `content` value from the HTML tag method, e.g.
   * if GSC gives you <meta name="google-site-verification" content="abc123" />
   * then set this to "abc123".
   */
  googleSearchConsoleVerification?: string;
}

/**
 * Footer Link
 */
export interface FooterLink {
  /** Link text */
  label: string;
  
  /** Link URL (relative or absolute) */
  url: string;
}

/**
 * Footer Configuration
 * 
 * Defines footer content and metadata.
 */
export interface FooterConfig {
  /** Copyright text */
  copyrightText: string;
  
  /** Copyright year (optional, supports single year or range like "2025 - 2026", defaults to current year if not provided) */
  copyrightYear?: number | string;
  
  /** Additional footer links (optional) */
  links?: FooterLink[];
}

/**
 * Site Configuration (Root)
 * 
 * The complete configuration object containing all site-wide settings.
 */
export interface SiteConfig {
  /** Brand identity configuration */
  brand: BrandConfig;
  
  /** Featured podcast show on homepage (represents the show itself, not episodes) */
  featuredShow: FeaturedShowConfig;
  
  /** Array of all podcast shows for Shows page */
  shows: ShowConfig[];
  
  /** Social media and store links */
  socialLinks: SocialLinksConfig;
  
  /** SEO and social sharing metadata */
  seo: SEOConfig;
  
  /** Footer content */
  footer: FooterConfig;
}

/**
 * Type guard to validate URL format
 */
export function isValidHttpsUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Type guard to validate hex color format
 */
export function isValidHexColor(color: string): boolean {
  return /^#[0-9A-Fa-f]{6}$/.test(color);
}

/**
 * Type guard to validate ISO date format (YYYY-MM-DD)
 */
export function isValidISODate(date: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(date) && !isNaN(Date.parse(date));
}

/**
 * Runtime validation helper for SiteConfig
 */
export function validateSiteConfig(config: SiteConfig): void {
  const errors: string[] = [];
  
  // Validate brand
  if (!config.brand.name || config.brand.name.length === 0) {
    errors.push('brand.name is required');
  }
  if (config.brand.logo && !config.brand.logo.startsWith('/')) {
    errors.push('brand.logo must be an absolute path starting with /');
  }
  if (!isValidHexColor(config.brand.colors.primary)) {
    errors.push(`brand.colors.primary "${config.brand.colors.primary}" is not a valid hex color`);
  }
  
  // Validate featured show
  if (!config.featuredShow.showId) {
    errors.push('featuredShow.showId is required');
  } else {
    const referencedShow = config.shows.find(s => s.id === config.featuredShow.showId);
    if (!referencedShow) {
      errors.push(`featuredShow.showId "${config.featuredShow.showId}" does not match any show in the shows array`);
    }
  }
  
  // Validate shows array
  if (!config.shows || config.shows.length === 0) {
    errors.push('shows array must contain at least one show');
  } else {
    config.shows.forEach((show, index) => {
      if (!show.id) {
        errors.push(`shows[${index}].id is required`);
      }
      if (!show.title) {
        errors.push(`shows[${index}].title is required`);
      }
      if (!isValidHttpsUrl(show.spotifyUrl)) {
        errors.push(`shows[${index}].spotifyUrl must be a valid HTTPS URL`);
      }
      if (!isValidHttpsUrl(show.applePodcastsUrl)) {
        errors.push(`shows[${index}].applePodcastsUrl must be a valid HTTPS URL`);
      }
    });
  }
  
  // Validate social links
  if (!isValidHttpsUrl(config.socialLinks.youtube)) {
    errors.push('socialLinks.youtube must be a valid HTTPS URL');
  }
  if (!isValidHttpsUrl(config.socialLinks.instagram)) {
    errors.push('socialLinks.instagram must be a valid HTTPS URL');
  }
  if (!isValidHttpsUrl(config.socialLinks.shopify)) {
    errors.push('socialLinks.shopify must be a valid HTTPS URL');
  }
  
  // Validate SEO
  if (config.seo.title.length > 60) {
    console.warn(`seo.title is ${config.seo.title.length} characters (recommended max 60)`);
  }
  if (config.seo.description.length > 160) {
    console.warn(`seo.description is ${config.seo.description.length} characters (recommended max 160)`);
  }
  if (!isValidHttpsUrl(config.seo.ogImage)) {
    errors.push('seo.ogImage must be a valid HTTPS URL');
  }
  if (!isValidHttpsUrl(config.seo.siteUrl)) {
    errors.push('seo.siteUrl must be a valid HTTPS URL');
  }
  if (config.seo.siteUrl.endsWith('/')) {
    errors.push('seo.siteUrl must not have trailing slash');
  }
  
  // Validate footer
  if (!config.footer.copyrightText) {
    errors.push('footer.copyrightText is required');
  }
  
  if (errors.length > 0) {
    throw new Error(`Site configuration validation failed:\n${errors.map(e => `  - ${e}`).join('\n')}`);
  }
}
