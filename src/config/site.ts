/**
 * Site Configuration
 * 
 * Single source of truth for all site content and branding.
 * Update this file to change featured show, social links, and brand identity.
 * 
 * Time to update: < 5 minutes
 */

import type { SiteConfig } from './types';

export const siteConfig: SiteConfig = {
  brand: {
    name: 'Small Talk Café Podcasts',
    colors: {
      primary: '#F5F1E8',    // Light beige
      secondary: '#523E26',  // Dark brown
      accent: '#F39C12',     // Warm orange
      background: '#F5F1E8', // Light beige
      text: '#121212',       // Almost black
    },
    fonts: {
      heading: '"Poppins", "Helvetica Neue", sans-serif',
      body: '"Inter", system-ui, -apple-system, sans-serif',
      showTitle: {
        family: '"Poppins", "Helvetica Neue", sans-serif',
        sizeLarge: '2.2rem',  // Desktop/tablet size
        sizeSmall: '1.8rem',    // Mobile size
      },
    },
  },
  
  featuredShow: {
    showId: 'english-german', // References the first show in the shows array
    displayOptions: {
      showTitle: true,
      showDescription: true,
    },
  },
  
  shows: [
    // ── Learn German ──────────────────────────────────────────────────────────
    {
      id: 'english-german',
      title: 'Small Talk Café',
      subtitle: 'Learn German in Minutes',
      heading: 'Learn German for English Speakers',
      description: 'Learn German in minutes with bite-sized, everyday conversations you can actually use in daily life. Perfect for English speakers who want to pick up German fast — no textbook needed.',
      artworkUrl: 'images/english-german.jpg',
      showWebsiteUrl: 'https://small-talk-cafe-learn-german-in-minutes.castos.com/',
      // Verify this RSS URL in your Castos dashboard under Podcast Settings → Distribution
      rssUrl: 'https://small-talk-cafe-learn-german-in-minutes.castos.com/feed',
      platform: 'apple',
      spotifyUrl: 'https://open.spotify.com/show/3FHzjg8sMkL77DdpEkx6uq',
      applePodcastsUrl: 'https://podcasts.apple.com/us/podcast/small-talk-café-learn-german-in-minutes/id1817982495',
      applePodcastsId: '1817982495',
      language: 'en',
      locale: 'en_US',
      targetLanguage: 'de',
      releaseDate: '2026-02-08',
    },
    {
      id: 'spanish-german',
      title: 'Small Talk Café',
      subtitle: 'Aprende Alemán en Minutos',
      heading: 'Aprender alemán para hispanohablantes',
      description: 'Aprende alemán rápido con conversaciones prácticas y cotidianas que puedes usar en tu día a día. Ideal para hispanohablantes que quieren aprender alemán sin memorizar reglas complicadas.',
      artworkUrl: 'images/spanish-german.jpg',
      showWebsiteUrl: 'https://small-talk-cafe-aprende-aleman-en-minutos.castos.com/',
      // Verify this RSS URL in your Castos dashboard under Podcast Settings → Distribution
      rssUrl: 'https://small-talk-cafe-aprende-aleman-en-minutos.castos.com/feed',
      platform: 'apple',
      spotifyUrl: 'https://open.spotify.com/show/2B0W15PEDW2iDMFMwTnCpP',
      applePodcastsUrl: 'https://podcasts.apple.com/us/podcast/small-talk-café-aprende-alemán-en-minutos/id1858063577',
      applePodcastsId: '1858063577',
      language: 'es',
      locale: 'es_ES',
      targetLanguage: 'de',
      releaseDate: '2026-02-08',
    },
    {
      id: 'french-german',
      title: 'Small Talk Café',
      subtitle: 'Apprenez L\'Allemand en Minutes',
      heading: "Apprendre l'allemand pour les francophones",
      description: 'Apprenez l\'allemand rapidement grâce à des conversations pratiques et utiles dans la vie de tous les jours. Conçu pour les francophones qui veulent parler allemand sans se noyer dans la grammaire.',
      artworkUrl: 'images/french-german.jpg',
      showWebsiteUrl: 'https://small-talk-cafe-apprenez-lallemand-en-minutes.castos.com/',
      // Verify this RSS URL in your Castos dashboard under Podcast Settings → Distribution
      rssUrl: 'https://small-talk-cafe-apprenez-lallemand-en-minutes.castos.com/feed',
      platform: 'apple',
      spotifyUrl: 'https://open.spotify.com/show/114LIYwyc0gk4wtzd2Ae2b',
      applePodcastsUrl: 'https://podcasts.apple.com/us/podcast/small-talk-caf%C3%A9-apprenez-lallemand-en-minutes/id1883812147',
      applePodcastsId: '1883812147',
      language: 'fr',
      locale: 'fr_FR',
      targetLanguage: 'de',
      releaseDate: '2026-03-07',
    },
    {
      id: 'italian-german',
      title: 'Small Talk Café',
      subtitle: 'Impara il Tedesco in Minuti',
      heading: 'Imparare il tedesco per italofoni',
      description: 'Impara il tedesco velocemente con conversazioni pratiche e quotidiane da usare ogni giorno. Perfetto per gli italofoni che vogliono imparare il tedesco in modo naturale e senza stress.',
      artworkUrl: 'images/italian-german.jpg',
      showWebsiteUrl: 'https://small-talk-cafe-impara-il-tedesco-in-minuti.castos.com/',
      // Verify this RSS URL in your Castos dashboard under Podcast Settings → Distribution
      rssUrl: 'https://small-talk-cafe-impara-il-tedesco-in-minuti.castos.com/feed',
      platform: 'apple',
      spotifyUrl: 'https://open.spotify.com/show/3LG1xNwsLcBhcLRASRyyhz',
      applePodcastsUrl: 'https://podcasts.apple.com/us/podcast/small-talk-caf%C3%A9-impara-il-tedesco-in-minuti/id1883818414',
      applePodcastsId: '1883818414',
      language: 'it',
      locale: 'it_IT',
      targetLanguage: 'de',
      releaseDate: '2026-03-07',
    },
    {
      id: 'turkish-german',
      title: 'Small Talk Café',
      subtitle: 'Dakikalar İçinde Almanca Öğren',
      heading: 'Almanca öğrenmek isteyen Türkçe konuşanlar için',
      description: 'Günlük hayatta kullanabileceğin pratik konuşmalarla Almancayı hızla öğren. Karmaşık gramer kurallarına gerek yok — sadece gerçek diyaloglar.',
      artworkUrl: 'images/turkish-german.jpg',
      showWebsiteUrl: 'https://small-talk-cafe-dakikalar-icinde-almanca-ogren.castos.com/',
      rssUrl: 'https://small-talk-cafe-dakikalar-icinde-almanca-ogren.castos.com/feed',
      platform: 'apple',
      spotifyUrl: 'https://open.spotify.com/show/1waIOgnHapzBzlkSrTaQj3?si=d991cd488cfb4674',
      applePodcastsUrl: 'https://podcasts.apple.com/us/podcast/small-talk-caf%C3%A9-dakikalar-i-%C3%A7inde-almanca-%C3%B6%C4%9Fren/id1885334258',
      applePodcastsId: '1885334258',
      language: 'tr',
      locale: 'tr_TR',
      targetLanguage: 'de',
      releaseDate: '2026-04-05',
    },

    // ── Learn Spanish ──────────────────────────────────────────────────────────
    {
      id: 'english-spanish',
      title: 'Small Talk Café',
      subtitle: 'Learn Spanish in Minutes',
      heading: 'Learn Spanish for English Speakers',
      description: 'Learn Spanish in minutes with bite-sized, everyday conversations you can actually use. Perfect for English speakers who want to pick up Spanish fast — real dialogues, no textbook.',
      artworkUrl: 'images/english-spanish.jpg',
      showWebsiteUrl: 'https://small-talk-cafe-learn-spanish-in-minutes.castos.com/',
      rssUrl: 'https://small-talk-cafe-learn-spanish-in-minutes.castos.com/feed',
      platform: 'apple',
      spotifyUrl: 'https://open.spotify.com/show/033q9uqQnjmS9Fr4al2v0k',
      // ⚠️  Verify this Apple Podcasts ID in your Castos dashboard
      applePodcastsUrl: 'https://podcasts.apple.com/us/podcast/small-talk-caf%C3%A9-learn-spanish-in-minutes/id1896853580',
      applePodcastsId: '1896853580',
      language: 'en',
      locale: 'en_US',
      targetLanguage: 'es',
      releaseDate: '2026-06-14',
    },

    // ── Learn French ──────────────────────────────────────────────────────────
    {
      id: 'english-french',
      title: 'Small Talk Café',
      subtitle: 'Learn French in Minutes',
      heading: 'Learn French for English Speakers',
      description: 'Learn French in minutes with bite-sized, everyday conversations you can actually use. Perfect for English speakers who want to pick up French fast — real dialogues, no textbook.',
      artworkUrl: 'images/english-french.jpg',
      showWebsiteUrl: 'https://small-talk-cafe-learn-french-in-minutes.castos.com/',
      rssUrl: 'https://small-talk-cafe-learn-french-in-minutes.castos.com/feed',
      platform: 'apple',
      spotifyUrl: 'https://open.spotify.com/show/033s8jf1cg9DAdbqVWqeQD',
      // ⚠️  Verify this Apple Podcasts ID in your Castos dashboard
      applePodcastsUrl: 'https://podcasts.apple.com/us/podcast/small-talk-caf%C3%A9-learn-french-in-minutes/id1896875454',
      applePodcastsId: '1896875454',
      language: 'en',
      locale: 'en_US',
      targetLanguage: 'fr',
      releaseDate: '2026-06-14',
    },

    // ── Learn Italian ──────────────────────────────────────────────────────────
    {
      id: 'english-italian',
      title: 'Small Talk Café',
      subtitle: 'Learn Italian in Minutes',
      heading: 'Learn Italian for English Speakers',
      description: 'Learn Italian in minutes with bite-sized, everyday conversations you can actually use. Perfect for English speakers who want to pick up Italian fast — real dialogues, no textbook.',
      artworkUrl: 'images/english-italian.jpg',
      showWebsiteUrl: 'https://small-talk-cafe-learn-italian-in-minutes.castos.com/',
      rssUrl: 'https://small-talk-cafe-learn-italian-in-minutes.castos.com/feed',
      platform: 'apple',
      spotifyUrl: 'https://open.spotify.com/show/033s8NJ0tq3PZiLHakcqOW',
      // ⚠️  Verify this Apple Podcasts ID in your Castos dashboard
      applePodcastsUrl: 'https://podcasts.apple.com/us/podcast/small-talk-caf%C3%A9-learn-italian-in-minutes/id1896875603',
      applePodcastsId: '1896875603',
      language: 'en',
      locale: 'en_US',
      targetLanguage: 'it',
      releaseDate: '2026-06-14',
    },

    // ── Learn Swedish ──────────────────────────────────────────────────────────
    {
      id: 'english-swedish',
      title: 'Small Talk Café',
      subtitle: 'Learn Swedish in Minutes',
      heading: 'Learn Swedish for English Speakers',
      description: 'Learn Swedish in minutes with bite-sized, everyday conversations you can actually use. Perfect for English speakers who want to pick up Swedish fast — real dialogues, no textbook.',
      artworkUrl: 'images/english-swedish.jpg',
      showWebsiteUrl: 'https://small-talk-cafe-learn-swedish-in-minutes.castos.com/',
      rssUrl: 'https://small-talk-cafe-learn-swedish-in-minutes.castos.com/feed',
      platform: 'apple',
      spotifyUrl: 'https://open.spotify.com/show/033s9yQd0qTfbBkpVfYYai',
      // ⚠️  Verify this Apple Podcasts ID in your Castos dashboard
      applePodcastsUrl: 'https://podcasts.apple.com/us/podcast/small-talk-caf%C3%A9-learn-swedish-in-minutes/id1896875418',
      applePodcastsId: '1896875418',
      language: 'en',
      locale: 'en_US',
      targetLanguage: 'sv',
      releaseDate: '2026-06-14',
    },
    // ── Learn Portuguese ────────────────────────────────────────────────────────
    {
      id: 'english-portuguese',
      title: 'Small Talk Café',
      subtitle: 'Learn Portuguese in Minutes',
      heading: 'Learn Portuguese for English Speakers',
      description: 'Learn Portuguese in minutes with bite-sized, everyday conversations you can actually use. Perfect for English speakers who want to pick up Portuguese fast — real dialogues, no textbook.',
      artworkUrl: 'images/english-portuguese.jpg',
      showWebsiteUrl: 'https://small-talk-cafe-learn-portuguese-in-minutes.castos.com/',
      rssUrl: 'https://small-talk-cafe-learn-portuguese-in-minutes.castos.com/feed',
      platform: 'apple',
      spotifyUrl: 'https://open.spotify.com/show/033ABk8KMO7B7cwOZn5Mj4',
      applePodcastsUrl: 'https://podcasts.apple.com/us/podcast/small-talk-caf%C3%A9-learn-portuguese-in-minutes/id1896940600',
      applePodcastsId: '1896940600',
      language: 'en',
      locale: 'en_US',
      targetLanguage: 'pt',
      releaseDate: '2026-06-19',
    },
    // ── Learn Dutch ─────────────────────────────────────────────────────────────
    {
      id: 'english-dutch',
      title: 'Small Talk Café',
      subtitle: 'Learn Dutch in Minutes',
      heading: 'Learn Dutch for English Speakers',
      description: 'Learn Dutch in minutes with bite-sized, everyday conversations you can actually use. Perfect for English speakers who want to pick up Dutch fast — real dialogues, no textbook.',
      artworkUrl: 'images/english-dutch.jpg',
      showWebsiteUrl: 'https://small-talk-cafe-learn-dutch-in-minutes.castos.com/',
      rssUrl: 'https://small-talk-cafe-learn-dutch-in-minutes.castos.com/feed',
      platform: 'apple',
      spotifyUrl: 'https://open.spotify.com/show/033ABfu991mlAV34TP8JUI',
      applePodcastsUrl: 'https://podcasts.apple.com/us/podcast/small-talk-caf%C3%A9-learn-dutch-in-minutes/id1896940629',
      applePodcastsId: '1896940629',
      language: 'en',
      locale: 'en_US',
      targetLanguage: 'nl',
      releaseDate: '2026-06-19',
    },
    // ── Learn Japanese ──────────────────────────────────────────────────────────
    {
      id: 'english-japanese',
      title: 'Small Talk Café',
      subtitle: 'Learn Japanese in Minutes',
      heading: 'Learn Japanese for English Speakers',
      description: 'Learn Japanese in minutes with bite-sized, everyday conversations you can actually use. Perfect for English speakers who want to pick up Japanese fast — real dialogues, no textbook.',
      artworkUrl: 'images/english-japanese.jpg',
      showWebsiteUrl: 'https://small-talk-cafe-learn-japanese-in-minutes.castos.com/',
      rssUrl: 'https://small-talk-cafe-learn-japanese-in-minutes.castos.com/feed',
      platform: 'apple',
      spotifyUrl: 'https://open.spotify.com/show/033AytFPeJmcGHNUwawdfE',
      applePodcastsUrl: 'https://podcasts.apple.com/us/podcast/small-talk-caf%C3%A9-learn-japanese-in-minutes/id6781718621',
      applePodcastsId: '6781718621',
      language: 'en',
      locale: 'en_US',
      targetLanguage: 'ja',
      releaseDate: '2026-06-19',
    },
    // ── Learn Korean ────────────────────────────────────────────────────────────
    {
      id: 'english-korean',
      title: 'Small Talk Café',
      subtitle: 'Learn Korean in Minutes',
      heading: 'Learn Korean for English Speakers',
      description: 'Learn Korean in minutes with bite-sized, everyday conversations you can actually use. Perfect for English speakers who want to pick up Korean fast — real dialogues, no textbook.',
      artworkUrl: 'images/english-korean.jpg',
      showWebsiteUrl: 'https://small-talk-cafe-learn-korean-in-minutes.castos.com/',
      rssUrl: 'https://small-talk-cafe-learn-korean-in-minutes.castos.com/feed',
      platform: 'apple',
      spotifyUrl: 'https://open.spotify.com/show/033AywtHgG6oNpNyOxCmud',
      applePodcastsUrl: 'https://podcasts.apple.com/us/podcast/small-talk-caf%C3%A9-learn-korean-in-minutes/id1896940186',
      applePodcastsId: '1896940186',
      language: 'en',
      locale: 'en_US',
      targetLanguage: 'ko',
      releaseDate: '2026-06-19',
    },
    // ── Learn Mandarin ──────────────────────────────────────────────────────────
    {
      id: 'english-mandarin',
      title: 'Small Talk Café',
      subtitle: 'Learn Mandarin in Minutes',
      heading: 'Learn Mandarin for English Speakers',
      description: 'Learn Mandarin in minutes with bite-sized, everyday conversations you can actually use. Perfect for English speakers who want to pick up Mandarin fast — real dialogues, no textbook.',
      artworkUrl: 'images/english-mandarin.jpg',
      showWebsiteUrl: 'https://small-talk-cafe-learn-mandarin-in-minutes.castos.com/',
      rssUrl: 'https://small-talk-cafe-learn-mandarin-in-minutes.castos.com/feed',
      platform: 'apple',
      spotifyUrl: 'https://open.spotify.com/show/033AyoZCWsa1GfJ1XhjWrY',
      applePodcastsUrl: 'https://podcasts.apple.com/us/podcast/small-talk-caf%C3%A9-learn-mandarin-in-minutes/id1896940407',
      applePodcastsId: '1896940407',
      language: 'en',
      locale: 'en_US',
      targetLanguage: 'zh',
      releaseDate: '2026-06-19',
    },
  ],
  
  socialLinks: {
    youtube: 'https://www.youtube.com/@smalltalkcafe.podcasts',
    instagram: 'https://www.instagram.com/smalltalkcafe.podcasts',
    shopify: '/shop/',
  },
  
  seo: {
    title: 'Small Talk Café | Learn Any Language in Minutes — Bite-Sized Podcast',
    description: 'Learn Spanish, French, Italian, German, Swedish, Portuguese, Dutch, Japanese, Korean, or Mandarin with Small Talk Café — bite-sized podcast episodes with real conversations. New episodes every day on Spotify & Apple Podcasts.',
    keywords: [
      'language learning podcast',
      'learn Spanish podcast',
      'learn French podcast',
      'learn Italian podcast',
      'learn German podcast',
      'learn Swedish podcast',
      'learn Portuguese podcast',
      'learn Dutch podcast',
      'learn Japanese podcast',
      'learn Korean podcast',
      'learn Mandarin podcast',
      'Small Talk Café',
      'language learning in minutes',
      'conversational language podcast',
      'bite-sized language lessons',
      'learn languages for beginners',
      'daily language practice',
      'Spanish podcast for beginners',
      'French podcast for beginners',
      'Italian podcast for beginners',
      'German podcast for beginners',
      'Swedish podcast for beginners',
      'Portuguese podcast for beginners',
      'Dutch podcast for beginners',
      'Japanese podcast for beginners',
      'Korean podcast for beginners',
      'Mandarin podcast for beginners',
      'learn German from English',
      'learn German from Spanish',
      'learn German from French',
      'learn German from Italian',
      'learn German from Turkish',
      'Almanca öğren podcast',
      'speak language confidently',
      'language podcast Spotify',
      'language podcast Apple Podcasts',
    ],
    ogImage: 'https://smalltalkcafe.de/images/og-image.jpg',
    siteUrl: 'https://smalltalkcafe.de',
    twitterHandle: 'smalltalkcafe',
    // Google Analytics 4 — replace with your real Measurement ID from:
    // analytics.google.com → Admin → Data Streams → Web → Measurement ID
    // Format: 'G-XXXXXXXXXX'
    googleAnalyticsId: 'G-82VS48MBBM',
    //
    // Google Search Console HTML-tag verification — paste only the `content` value:
    // searchconsole.google.com → Add property → HTML tag → copy content="..."
    // googleSearchConsoleVerification: 'your-verification-code-here',
  },
  
  footer: {
    copyrightText: 'Made in Bayern ❤️ Los Geht\'s!',
    copyrightYear: '2025 - 2026',
  },
};

// Validate configuration in development
if (import.meta.env.DEV) {
  const { validateSiteConfig } = await import('./types');
  try {
    validateSiteConfig(siteConfig);
    console.log('✅ Site configuration validated successfully');
  } catch (error) {
    console.error('❌ Site configuration validation failed:', error);
  }
}
