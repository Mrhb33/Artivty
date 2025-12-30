/**
 * API Configuration
 *
 * Auto-detects the correct backend URL based on:
 * - Android Emulator: uses 10.0.2.2 (emulator's special IP to reach host machine)
 * - iOS Simulator: uses localhost
 * - Physical Device: uses your PC's LAN IP (192.168.0.101)
 *
 * For production: Set PRODUCTION_URL environment variable
 */

import { NativeModules, Platform } from 'react-native';
import * as Device from 'expo-device';

/**
 * Runtime configuration knobs:
 * - EXPO_PUBLIC_API_BASE_URL / APPART_BASE_URL: full override (e.g. https://my-tunnel.trycloudflare.com)
 * - EXPO_PUBLIC_LAN_IP: override the LAN IP for physical devices (e.g. 192.168.1.23)
 * - EXPO_PUBLIC_TUNNEL_URL: optional fallback tunnel for physical devices
 */
const ENV_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || process.env.APPART_BASE_URL;
const LAN_IP = process.env.EXPO_PUBLIC_LAN_IP || '192.168.0.104';
const TUNNEL_URL = process.env.EXPO_PUBLIC_TUNNEL_URL || 'https://query-souls-negotiation-whats.trycloudflare.com';
const USE_TUNNEL =
  (process.env.EXPO_PUBLIC_USE_TUNNEL || '').toLowerCase() === 'true' ||
  process.env.EXPO_PUBLIC_USE_TUNNEL === '1';

const getDevHostFromBundle = () => {
  // Metro bundle URL e.g. http://192.168.0.104:8081/index.bundle?...
  const scriptURL: string | undefined = NativeModules?.SourceCode?.scriptURL;
  if (!scriptURL) return undefined;

  const match = scriptURL.match(/^[a-zA-Z]+:\/\/([^:/]+)(?::\\d+)?/);
  return match?.[1];
};

// Auto-detect the correct base URL
const getBaseURL = (): string => {
  // Hard override when provided
  if (ENV_BASE_URL) {
    return ENV_BASE_URL;
  }

  // TEMPORARY: Hardcode the correct backend IP for development
  if (__DEV__) {
    return 'http://192.168.0.104:8000';
  }

  // Production
  return 'https://your-api-domain.com';
};

export const API_CONFIG = {
  // Auto-detected base URL
  BASE_URL: getBaseURL(),

  // API endpoints
  ENDPOINTS: {
    AUTH: {
      LOGIN: '/auth/login',
      REGISTER: '/auth/register',
      REFRESH: '/auth/refresh',
    },
    USERS: {
      ME: '/users/me',
      SEARCH: '/users/search',
    },
    ARTWORKS: {
      FEED: '/artworks/feed',
      ARTIST_PORTFOLIO: (artistId: number) => `/artworks/artist/${artistId}`,
    },
    REQUESTS: {
      CREATE: '/requests',
      MY_REQUESTS: '/requests/my-requests',
      OPEN_REQUESTS: '/requests/open',
      DETAILS: (id: number) => `/requests/${id}`,
      SELECT_ARTIST: (id: number) => `/requests/${id}/select-artist`,
    },
    OFFERS: {
      CREATE: (requestId: number) => `/offers/request/${requestId}`,
      REQUEST_OFFERS: (requestId: number) => `/offers/request/${requestId}`,
    },
  },
} as const;
