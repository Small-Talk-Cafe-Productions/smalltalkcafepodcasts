/**
 * Episode Transcript & Vocabulary Utilities
 *
 * Loads and caches pre-imported transcript and vocabulary data for episodes.
 * Data is imported from external sources and committed to src/data/transcripts/
 * so builds (including GitHub Pages CI/CD) run fast and standalone.
 */

import fs from 'node:fs';
import path from 'node:path';

export interface VocabularyItem {
  target: string;
  pos: 'noun' | 'verb' | 'adjective' | 'phrase' | 'other' | string;
  meaning: string;
  example?: string;
}

export interface EpisodeTranscriptData {
  season: number;
  episode: number;
  key: string;
  title?: string;
  cefrLevel?: string;
  transcript: string;
  vocabulary: VocabularyItem[];
}

export interface ShowTranscripts {
  showId: string;
  totalTranscripts: number;
  updatedAt: string;
  episodes: Record<string, EpisodeTranscriptData>;
}

// In-memory cache keyed by showId
const showCache = new Map<string, ShowTranscripts | null>();

/**
 * Load all transcripts for a show from src/data/transcripts/<showId>.json
 */
export function getShowTranscripts(showId: string): ShowTranscripts | null {
  const isDev = import.meta.env?.DEV;
  if (!isDev && showCache.has(showId)) {
    return showCache.get(showId) ?? null;
  }

  try {
    const filePath = path.resolve(process.cwd(), 'src/data/transcripts', `${showId}.json`);
    if (!fs.existsSync(filePath)) {
      showCache.set(showId, null);
      return null;
    }
    const raw = fs.readFileSync(filePath, 'utf-8');
    const data = JSON.parse(raw) as ShowTranscripts;
    showCache.set(showId, data);
    return data;
  } catch (err) {
    console.warn(`[Transcripts] Failed to load transcripts for show "${showId}":`, (err as Error).message);
    showCache.set(showId, null);
    return null;
  }
}

/**
 * Match and retrieve the transcript & vocabulary data for a specific episode.
 *
 * Resolution strategy:
 * 1. Explicit season + episodeNumber: "s{season}e{episode}"
 * 2. Regex from slug: e.g. "s1e90-zuhause-alles-dunkel" -> s1e90
 * 3. Regex from title: e.g. "S1E90 - Zuhause: Alles dunkel!" -> s1e90
 * 4. Fallback: match by episode number in season 1: "s1e{episodeNumber}"
 */
export function getTranscriptForEpisode(
  showId: string,
  episode: {
    episodeNumber?: string;
    season?: string;
    slug?: string;
    title?: string;
  }
): EpisodeTranscriptData | null {
  const showData = getShowTranscripts(showId);
  if (!showData || !showData.episodes) return null;

  const episodes = showData.episodes;

  // 1. Direct s{season}e{episode} key
  if (episode.season && episode.episodeNumber) {
    const key = `s${parseInt(episode.season, 10)}e${parseInt(episode.episodeNumber, 10)}`;
    if (episodes[key]) return episodes[key];
  }

  // 2. Extract S{season}E{episode} from slug (e.g. s1e90-...)
  if (episode.slug) {
    const match = episode.slug.match(/s(\d+)e(\d+)/i);
    if (match) {
      const key = `s${parseInt(match[1], 10)}e${parseInt(match[2], 10)}`;
      if (episodes[key]) return episodes[key];
    }
  }

  // 3. Extract S{season}E{episode} from title
  if (episode.title) {
    const match = episode.title.match(/s(\d+)e(\d+)/i);
    if (match) {
      const key = `s${parseInt(match[1], 10)}e${parseInt(match[2], 10)}`;
      if (episodes[key]) return episodes[key];
    }
  }

  // 4. Fallback by episodeNumber alone (default season 1)
  if (episode.episodeNumber) {
    const epNum = parseInt(episode.episodeNumber, 10);
    const keyS1 = `s1e${epNum}`;
    if (episodes[keyS1]) return episodes[keyS1];

    // Check across all seasons for matching episode number
    for (const item of Object.values(episodes)) {
      if (item.episode === epNum) return item;
    }
  }

  return null;
}
