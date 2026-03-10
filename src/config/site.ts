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
    {
      id: 'english-german',
      title: 'Small Talk Café',
      subtitle: 'Learn German in Minutes',
      description: 'Learn German in minutes with bite-sized, everyday conversations you can actually use in daily life.',
      artworkUrl: 'images/english-german.jpg',
      platform: 'apple',
      spotifyUrl: 'https://www.youtube.com/redirect?event=channel_description&redir_token=QUFFLUhqbjBoWTZ6cUpQNkJ0cEVVX21sc0VRaVFHME5uZ3xBQ3Jtc0tuWFpDcjF4YjJVcTVzaEZnUjdGV2hBSktmdTdLQ3Z2ZDJBY1Eya2dOQkVCbDQwVWRXdE1VVmwwWWt2Ni1sR21oVU1kbXZlVmoyMWZqV2RlNzJLSE0xc3hFclFFdWJrNWdZWmlYNmppUHJwaDFYU2dtRQ&q=https%3A%2F%2Fopen.spotify.com%2Fshow%2F3FHzjg8sMkL77DdpEkx6uq%3Fsi%3D4rFxu4I4QfaegZfSM45clA',
      applePodcastsUrl: 'https://podcasts.apple.com/us/podcast/small-talk-café-learn-german-in-minutes/id1817982495',
      releaseDate: '2026-02-08',
    },
    {
      id: 'spanish-german',
      title: 'Small Talk Café',
      subtitle: 'Aprende Alemán en Minutos',
      description: 'Aprende alemán rápido con conversaciones prácticas y cotidianas que puedes usar en tu día a día.',
      artworkUrl: 'images/spanish-german.jpg',
      platform: 'apple',
      spotifyUrl: 'https://www.youtube.com/redirect?event=channel_description&redir_token=QUFFLUhqbU8zSmFEaVA2MHlTWlFwWHBEUHBCYXpCMC1EQXxBQ3Jtc0tsdzBxZl9MSFcxVklyZW5sMEhuUzBkaVhLaVpSeExIZnRsbUE1dDZqMDItMlgyRFR5VlhfdDlQV1dMYm52NmM5dTRiNmtvNFhRQ19ROGJxeFoyTGdQRzhMTXJDRmE2SlRuNy05Z0tndXRCaWxzaUdYdw&q=https%3A%2F%2Fopen.spotify.com%2Fshow%2F2B0W15PEDW2iDMFMwTnCpP%3Fsi%3DQ4jKxxV_RK2VDlnBltnB5g',
      applePodcastsUrl: 'https://podcasts.apple.com/us/podcast/small-talk-café-aprende-alemán-en-minutos/id1858063577',
      releaseDate: '2026-02-08',
    },
    {
      id: 'french-german',
      title: 'Small Talk Café',
      subtitle: 'Apprenez L\'Allemand en Minutes',
      description: 'Apprenez l\'allemand rapidement grâce à des conversations pratiques et utiles dans la vie de tous les jours.',
      artworkUrl: 'images/french-german.jpg',
      platform: 'apple',
      spotifyUrl: 'https://open.spotify.com/show/114LIYwyc0gk4wtzd2Ae2b',
      applePodcastsUrl: 'https://podcasts.apple.com/us/podcast/small-talk-caf%C3%A9-apprenez-lallemand-en-minutes/id1883812147',
      releaseDate: '2026-03-07',
    },
    {
      id: 'italian-german',
      title: 'Small Talk Café',
      subtitle: 'Impara il Tedesco in Minuti',
      description: 'Impara il tedesco velocemente con conversazioni pratiche e quotidiane da usare ogni giorno.',
      artworkUrl: 'images/italian-german.jpg',
      platform: 'apple',
      spotifyUrl: 'https://open.spotify.com/show/3LG1xNwsLcBhcLRASRyyhz',
      applePodcastsUrl: 'https://podcasts.apple.com/us/podcast/small-talk-caf%C3%A9-impara-il-tedesco-in-minuti/id1883818414',
      releaseDate: '2026-03-07',
    },
  ],
  
  socialLinks: {
    youtube: 'https://www.youtube.com/@smalltalkcafe.podcasts',
    instagram: 'https://www.instagram.com/smalltalkcafe.podcasts',
    shopify: 'https://smalltalkcafepodcasts-starter.myshopify.com/',
  },
  
  seo: {
    title: 'Small Talk Café Podcasts | Meaningful Conversations',
    description: 'Join us for thoughtful conversations about life, culture, and connection. New episodes weekly on Spotify and Apple Podcasts.',
    keywords: [
      'podcast',
      'conversation',
      'storytelling',
      'culture',
      'small talk cafe',
      'meaningful dialogue',
    ],
    ogImage: 'https://Small-Talk-Cafe-Productions.github.io/smalltalkcafepodcasts/images/og-image.jpg',
    siteUrl: 'Small-Talk-Cafe-Productions.github.io/smalltalkcafepodcasts',
    twitterHandle: 'smalltalkcafe',
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
