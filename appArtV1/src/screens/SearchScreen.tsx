import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  View,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Keyboard,
  Modal,
  Pressable,
  Switch,
  Alert,
  Share,
  Text,
  TextInput,
  StatusBar,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../types/navigation';
import { User } from '../types/api';
import api from '../services/api';
import { AppShell, AppHeader, SkeletonCard, Body, Caption, Title } from '../components';
import ProgressiveImage from '../components/ProgressiveImage';
import { useLanguage } from '../contexts/LanguageContext';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS } from '../theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedScrollHandler,
  withTiming,
  interpolateColor,
} from 'react-native-reanimated';

// =============================================================================
// Constants & Types
// =============================================================================

type TabKey = 'artists' | 'styles' | 'collections' | 'recent';

const HISTORY_STORAGE_KEY = '@artivty_search_history';
const MIN_QUERY_LENGTH = 2;
const MAX_HISTORY = 10;

const TAB_DEFINITIONS = [
  { key: 'artists', labelKey: 'Artists' },
  { key: 'styles', labelKey: 'Styles' },
  { key: 'collections', labelKey: 'Studios' },
  { key: 'recent', labelKey: 'Recent' },
] as const;

// Professional Dummy Data
const TRENDING_STYLES = [
  { id: '1', name: 'Baroque Digital', count: '8.2k' },
  { id: '2', name: 'Neo-Noir', count: '5.1k' },
  { id: '3', name: 'Ethereal Oil', count: '3.4k' },
  { id: '4', name: 'Tech Noir', count: '2.9k' },
  { id: '5', name: 'Minimal Line', count: '2.1k' },
];

// Mock search data generators
const MOCK_ARTISTS = [
  { id: 1001, name: 'Ivy Harper', username: 'ivyharper', profile_picture_url: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=160&q=80', bio: 'Painter blending renaissance lighting with modern vibes.', is_artist_verified: true },
  { id: 1002, name: 'Leon Kato', username: 'leonkato', profile_picture_url: 'https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=160&q=80', bio: 'Digital sculptor exploring light and metallic textures.', is_artist_verified: true },
  { id: 1003, name: 'Selene Ortiz', username: 'seleneart', profile_picture_url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=160&q=80', bio: 'Color field studies for premium editorial campaigns.', is_artist_verified: false },
  { id: 1004, name: 'Marcus Chen', username: 'marcuschen', profile_picture_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=160&q=80', bio: 'Contemporary abstract expressionist with bold color palettes.', is_artist_verified: true },
  { id: 1005, name: 'Luna Rivera', username: 'lunarivera', profile_picture_url: 'https://images.unsplash.com/photo-1494790108755-2616b612b5bc?auto=format&fit=crop&w=160&q=80', bio: 'Street art meets surrealism in urban landscapes.', is_artist_verified: false },
];

const MOCK_STYLES = [
  { id: '1', name: 'Baroque Digital', count: '8.2k' },
  { id: '2', name: 'Neo-Noir', count: '5.1k' },
  { id: '3', name: 'Ethereal Oil', count: '3.4k' },
  { id: '4', name: 'Tech Noir', count: '2.9k' },
  { id: '5', name: 'Minimal Line', count: '2.1k' },
  { id: '6', name: 'Cyberpunk', count: '4.7k' },
  { id: '7', name: 'Surreal Digital', count: '3.8k' },
  { id: '8', name: 'Abstract Geometric', count: '2.4k' },
];

const MOCK_COLLECTIONS = [
  { id: 2001, name: 'Digital Renaissance', description: 'Modern takes on classical art techniques', image_url: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?auto=format&fit=crop&w=400&q=80' },
  { id: 2002, name: 'Urban Noir', description: 'Dark, moody cityscapes and street art', image_url: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?auto=format&fit=crop&w=400&q=80' },
  { id: 2003, name: 'Ethereal Dreams', description: 'Surreal and dreamlike compositions', image_url: 'https://images.unsplash.com/photo-1541961017774-22349e4a1262?auto=format&fit=crop&w=400&q=80' },
  { id: 2004, name: 'Tech Fusion', description: 'Where technology meets traditional art', image_url: 'https://images.unsplash.com/photo-1558655146-364adaf1fcc9?auto=format&fit=crop&w=400&q=80' },
];

// Generate mock search results based on query
const generateMockSearchResults = (query: string) => {
  const lowerQuery = query.toLowerCase();

  const matchingArtists = MOCK_ARTISTS.filter(artist =>
    artist.name.toLowerCase().includes(lowerQuery) ||
    artist.username.toLowerCase().includes(lowerQuery) ||
    artist.bio.toLowerCase().includes(lowerQuery)
  );

  const matchingStyles = MOCK_STYLES.filter(style =>
    style.name.toLowerCase().includes(lowerQuery)
  );

  const matchingCollections = MOCK_COLLECTIONS.filter(collection =>
    collection.name.toLowerCase().includes(lowerQuery) ||
    collection.description.toLowerCase().includes(lowerQuery)
  );

  return {
    artists: matchingArtists,
    styles: matchingStyles,
    collections: matchingCollections,
  };
};

const SUGGESTED_ARTISTS: User[] = [
  {
    id: 1001,
    email: 'ivy@artivty.com',
    name: 'Ivy Harper',
    username: 'ivyharper',
    role: 'artist',
    is_active: true,
    profile_picture_url: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=160&q=80',
    bio: 'Painter blending renaissance lighting with modern vibes.',
    is_artist_verified: true,
    created_at: '2024-01-15T00:00:00Z',
  },
  {
    id: 1002,
    email: 'leon@artivty.com',
    name: 'Leon Kato',
    username: 'leonkato',
    role: 'artist',
    is_active: true,
    profile_picture_url: 'https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=160&q=80',
    bio: 'Digital sculptor exploring light and metallic textures.',
    is_artist_verified: true,
    created_at: '2023-11-05T00:00:00Z',
  },
  {
    id: 1003,
    email: 'selene@artivty.com',
    name: 'Selene Ortiz',
    username: 'seleneart',
    role: 'artist',
    is_active: true,
    profile_picture_url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=160&q=80',
    bio: 'Color field studies for premium editorial campaigns.',
    is_artist_verified: false,
    created_at: '2024-03-20T00:00:00Z',
  },
];

// =============================================================================
// Search Header Component
// =============================================================================

interface SearchHeaderProps {
  activeTab: TabKey;
  onTabPress: (tab: TabKey) => void;
  isEditing?: boolean;
  onSearchPlaceholderPress?: () => void;
  onSearchInputFocus?: () => void;
  onSearchInputBlur?: () => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  onSearchSubmit?: () => void;
  onClearSearch?: () => void;
  inputRef?: React.RefObject<TextInput | null>;
}

const SearchHeader: React.FC<SearchHeaderProps> = ({
  activeTab,
  onTabPress,
  isEditing = false,
  onSearchPlaceholderPress,
  onSearchInputFocus,
  onSearchInputBlur,
  searchQuery = '',
  onSearchChange,
  onSearchSubmit,
  onClearSearch,
  inputRef
}) => {
  const shouldShowInput = isEditing || searchQuery.length > 0;

  return (
    <View style={styles.searchHeaderContainer}>
      {/* Search Bar - Same design, different content */}
      <View style={styles.searchBar}>
        <Ionicons
          name="search"
          size={16}
          color={COLORS.text.tertiary}
          style={styles.searchIcon}
        />

        {shouldShowInput ? (
          <TextInput
            ref={inputRef}
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={onSearchChange}
            onSubmitEditing={onSearchSubmit}
            onBlur={onSearchInputBlur}
            onFocus={onSearchInputFocus}
            placeholder=""
            placeholderTextColor={COLORS.text.tertiary}
            returnKeyType="search"
            autoCapitalize="none"
            autoCorrect={false}
            blurOnSubmit={false}
            autoFocus={shouldShowInput}
            showSoftInputOnFocus={true}
          />
        ) : (
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={onSearchPlaceholderPress}
            style={styles.searchPlaceholderTouchable}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.searchPlaceholder}>
              Discover extraordinary art...
            </Text>
          </TouchableOpacity>
        )}

        {shouldShowInput && searchQuery.length > 0 && (
          <TouchableOpacity
            onPress={onClearSearch}
            style={styles.clearButton}
            activeOpacity={0.7}
          >
            <Ionicons name="close-circle" size={18} color={COLORS.text.tertiary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Tabs Row */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabsScrollContent}
        bounces={false}
      >
        {TAB_DEFINITIONS.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              onPress={() => onTabPress(tab.key as TabKey)}
              style={styles.tabItem}
              activeOpacity={0.7}
            >
              <Caption style={[
                styles.tabText,
                isActive && styles.tabTextActive
              ]}>
                {tab.labelKey}
              </Caption>
              {isActive && (
                <View style={styles.tabUnderline} />
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
      <View style={styles.tabsDivider} />
    </View>
  );
};

// =============================================================================
// Luxury Tab Component (kept for potential future use)
// =============================================================================

interface LuxuryTabProps {
  tab: typeof TAB_DEFINITIONS[number];
  isActive: boolean;
  onPress: () => void;
}

const SimpleTab: React.FC<LuxuryTabProps> = ({ tab, isActive, onPress }) => {
  const textColor = useSharedValue(isActive ? 1 : 0);

  // Smooth color transition
  React.useEffect(() => {
    textColor.value = withTiming(isActive ? 1 : 0, { duration: 200 });
  }, [isActive]);

  const textStyle = useAnimatedStyle(() => ({
    color: interpolateColor(
      textColor.value,
      [0, 1],
      ['rgba(255, 255, 255, 0.5)', COLORS.accent.primary]
    ),
  }));

  return (
    <View style={styles.tabItem}>
      <TouchableOpacity
        onPress={onPress}
        style={styles.tabTouchable}
        activeOpacity={0.7} // X-style subtle press feedback
      >
        <Animated.Text style={[styles.tabText, textStyle]}>
          {tab.labelKey}
        </Animated.Text>
      </TouchableOpacity>
    </View>
  );
};

// =============================================================================
// SearchScreen Component
// =============================================================================

const SearchScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();

  // Core search state
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [activeTab, setActiveTab] = useState<TabKey>('artists');
  const [isInputFocused, setInputFocused] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<any>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  // Input ref for focus management
  const inputRef = useRef<TextInput | null>(null);

  // Performance optimizations
  const didDismissOnThisDrag = useRef(false);
  const currentSearchId = useRef(0);
  const searchCache = useRef<Map<string, any>>(new Map());

  // Professional tab caching with metadata
  const [tabCache, setTabCache] = useState<Record<TabKey, {
    data: any;
    lastFetchedAt: number | null;
    isFetching: boolean;
    error: string | null;
  }>>({
    artists: { data: MOCK_ARTISTS, lastFetchedAt: Date.now(), isFetching: false, error: null },
    styles: { data: TRENDING_STYLES, lastFetchedAt: Date.now(), isFetching: false, error: null },
    collections: { data: MOCK_COLLECTIONS, lastFetchedAt: Date.now(), isFetching: false, error: null },
    recent: { data: [], lastFetchedAt: null, isFetching: false, error: null },
  });

  // Separate loading states for better UX
  const [isSearching, setIsSearching] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Scroll handler for smooth scrolling - NO STATE CHANGES DURING SCROLL
  const scrollY = useSharedValue(0);
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  const handleScrollBeginDrag = useCallback(() => {
    if (isInputFocused && !didDismissOnThisDrag.current) {
      Keyboard.dismiss();
      didDismissOnThisDrag.current = true;
    }
  }, [isInputFocused]);

  const handleScrollEndDrag = useCallback(() => {
    didDismissOnThisDrag.current = false;
  }, []);

  // Load recent searches on mount
  useEffect(() => {
    loadRecentSearches();
  }, []);

  // Derived states
  const hasQuery = searchQuery.length > 0;
  const isInSearchMode = hasQuery || isInputFocused;

  // Race-safe search results with caching - MOCK DATA FOR DEVELOPMENT
  const getSearchResults = useCallback(async (query: string, requestId: number) => {
    if (query.length < MIN_QUERY_LENGTH) return;

    // Check cache first for instant results
    if (searchCache.current.has(query)) {
      if (requestId === currentSearchId.current) {
        setSearchResults(searchCache.current.get(query));
        setSearchError(null);
        setIsSearching(false);
      }
      return;
    }

    try {
      setIsSearching(true);
      // DON'T clear error state immediately - keep old results visible while loading
      setSearchError(null);

      // Simulate API delay for realistic UX
      await new Promise(resolve => setTimeout(resolve, 800));

      // Mock search results based on query
      const mockResults = generateMockSearchResults(query);

      // Only apply results if this is still the latest request (race condition safety)
      if (requestId === currentSearchId.current) {
        searchCache.current.set(query, mockResults);
        setSearchResults(mockResults);
      }
    } catch (error) {
      console.error('Search error:', error);
      if (requestId === currentSearchId.current) {
        setSearchError('Something went wrong. Tap to retry.');
        // DON'T clear results on error - keep old results visible
      }
    } finally {
      if (requestId === currentSearchId.current) {
        setIsSearching(false);
      }
    }
  }, []);

  const runSearchNow = useCallback(async (query: string) => {
    if (query.length < MIN_QUERY_LENGTH) return;
    currentSearchId.current += 1;
    const requestId = currentSearchId.current;
    await getSearchResults(query, requestId);
  }, [getSearchResults]);

  // Load recent searches from storage
  const loadRecentSearches = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem(HISTORY_STORAGE_KEY);
      if (stored) {
        const searches = JSON.parse(stored);
        setRecentSearches(searches);
        setTabCache(prev => ({
          ...prev,
          recent: { ...prev.recent, data: searches }
        }));
      }
    } catch (error) {
      console.error('Failed to load recent searches:', error);
    }
  }, []);

  // Save recent search
  const saveRecentSearch = useCallback(async (query: string) => {
    try {
      const updated = [query, ...recentSearches.filter(s => s !== query)].slice(0, MAX_HISTORY);
      setRecentSearches(updated);
      await AsyncStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(updated));
      setTabCache(prev => ({
        ...prev,
        recent: { ...prev.recent, data: updated }
      }));
    } catch (error) {
      console.error('Failed to save recent search:', error);
    }
  }, [recentSearches]);

  // Clear all recent searches
  const clearRecentSearches = useCallback(async () => {
    try {
      setRecentSearches([]);
      await AsyncStorage.removeItem(HISTORY_STORAGE_KEY);
      setTabCache(prev => ({
        ...prev,
        recent: { ...prev.recent, data: [] }
      }));
    } catch (error) {
      console.error('Failed to clear recent searches:', error);
    }
  }, []);

  // Remove single recent search
  const removeRecentSearch = useCallback(async (query: string) => {
    try {
      const updated = recentSearches.filter(s => s !== query);
      setRecentSearches(updated);
      await AsyncStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(updated));
      setTabCache(prev => ({
        ...prev,
        recent: { ...prev.recent, data: updated }
      }));
    } catch (error) {
      console.error('Failed to remove recent search:', error);
    }
  }, [recentSearches]);

  // Handle recent search tap
  const handleRecentSearchTap = useCallback((query: string) => {
    setSearchQuery(query);
    setIsEditing(true);
    inputRef.current?.focus();
    runSearchNow(query);
  }, [runSearchNow]);

  const handleRetrySearch = useCallback(() => {
    if (debouncedQuery.length >= MIN_QUERY_LENGTH) {
      runSearchNow(debouncedQuery);
    }
  }, [debouncedQuery, runSearchNow]);

  // Flattened FlatList data for proper virtualization (performance critical)
  const flatListData = React.useMemo(() => {
    const items: any[] = [];

    if (isInSearchMode) {
      if (searchQuery.length < MIN_QUERY_LENGTH) {
        items.push({
          id: 'search-min-length',
          type: 'search-min-length',
          message: 'Type at least 2 characters'
        });
        return items;
      }

      if (isSearching) {
        items.push({
          id: 'search-loading',
          type: 'search-loading',
          query: searchQuery
        });
        return items;
      }

      if (searchError) {
        items.push({
          id: 'search-error',
          type: 'search-error',
          query: searchQuery,
          error: searchError
        });
        return items;
      }

      if (searchResults) {
        // Flatten multi-type search results for proper virtualization
        if (searchResults.artists?.length > 0) {
          items.push({
            id: 'search-artists-header',
            type: 'section-header',
            title: 'ARTISTS',
            showViewAll: searchResults.artists.length > 5
          });
          searchResults.artists.slice(0, 5).forEach((artist: any, index: number) => {
            items.push({
              id: `search-artist-${artist.id}`,
              type: 'search-artist',
              data: artist
            });
          });
        }

        if (searchResults.styles?.length > 0) {
          items.push({
            id: 'search-styles-header',
            type: 'section-header',
            title: 'STYLES',
            showViewAll: searchResults.styles.length > 5
          });
          items.push({
            id: 'search-styles-row',
            type: 'search-styles',
            data: searchResults.styles.slice(0, 5)
          });
        }

        if (searchResults.collections?.length > 0) {
          items.push({
            id: 'search-collections-header',
            type: 'section-header',
            title: 'STUDIOS',
            showViewAll: searchResults.collections.length > 5
          });
          searchResults.collections.slice(0, 5).forEach((collection: any, index: number) => {
            items.push({
              id: `search-collection-${collection.id}`,
              type: 'search-collection',
              data: collection
            });
          });
        }

        if (items.length === 0) {
          items.push({
            id: 'search-no-results',
            type: 'search-no-results',
            query: searchQuery
          });
        }

        return items;
      }

      items.push({
        id: 'search-empty',
        type: 'search-empty'
      });
      return items;
    }

    // Flatten tab content for proper virtualization
    const activeTabData = tabCache[activeTab]?.data || [];

    if (activeTab === 'artists') {
      items.push({
        id: 'artists-header',
        type: 'section-header',
        title: 'FEATURED ARTISTS',
        showViewAll: true
      });
      activeTabData.forEach((artist: any) => {
        items.push({
          id: `artist-${artist.id}`,
          type: 'artist',
          data: artist
        });
      });
    } else if (activeTab === 'styles') {
      items.push({
        id: 'styles-header',
        type: 'section-header',
        title: 'TRENDING NOW'
      });
      items.push({
        id: 'styles-row',
        type: 'trending',
        data: activeTabData
      });
    } else if (activeTab === 'collections') {
      items.push({
        id: 'collections-header',
        type: 'section-header',
        title: 'STUDIOS & COLLECTIONS'
      });
      activeTabData.forEach((collection: any) => {
        items.push({
          id: `collection-${collection.id}`,
          type: 'search-collection',
          data: collection
        });
      });
      if (activeTabData.length === 0) {
        items.push({
          id: 'collections-empty',
          type: 'collections-empty'
        });
      }
    } else if (activeTab === 'recent') {
      items.push({
        id: 'recent-header',
        type: 'section-header',
        title: 'RECENT SEARCHES',
        showViewAll: activeTabData.length > 0
      });
      activeTabData.forEach((query: string, index: number) => {
        items.push({
          id: `recent-${index}`,
          type: 'recent',
          data: query
        });
      });
      if (activeTabData.length === 0) {
        items.push({
          id: 'recent-empty',
          type: 'recent-empty'
        });
      }
    }

    return items;
  }, [isInSearchMode, searchQuery, isSearching, searchError, searchResults, activeTab, tabCache]);

  // Render item for FlatList (flattened for proper virtualization)
  const renderItem = React.useCallback(({ item }: any) => {
    switch (item.type) {
      case 'section-header':
        return (
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{item.title}</Text>
            {item.showViewAll && (
              <TouchableOpacity activeOpacity={0.7}>
                <Text style={styles.linkText}>View All</Text>
              </TouchableOpacity>
            )}
          </View>
        );

      case 'search-min-length':
        return (
          <View style={styles.searchState}>
            <Text style={styles.searchStateText}>{item.message}</Text>
          </View>
        );

      case 'search-loading':
        return (
          <View style={styles.searchState}>
            <Text style={styles.searchStateText}>Searching...</Text>
            <View style={styles.skeletonContainer}>
              {Array.from({ length: 3 }).map((_, index) => (
                <View key={index} style={styles.skeletonRow}>
                  <View style={styles.skeletonAvatar} />
                  <View style={styles.skeletonText}>
                    <View style={styles.skeletonLine} />
                    <View style={[styles.skeletonLine, styles.skeletonLineShort]} />
                  </View>
                </View>
              ))}
            </View>
          </View>
        );

      case 'search-error':
        return (
          <View style={styles.searchState}>
            <Text style={styles.searchStateText}>{item.error}</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={handleRetrySearch}
              activeOpacity={0.7}
            >
              <Text style={styles.retryButtonText}>Tap to retry</Text>
            </TouchableOpacity>
          </View>
        );

      case 'search-no-results':
        return (
          <View style={styles.searchState}>
            <Text style={styles.searchStateText}>
              No results for "{item.query}"
            </Text>
          </View>
        );

      case 'search-empty':
        return (
          <View style={styles.searchState}>
            <Text style={styles.searchStateText}>Start typing to search...</Text>
          </View>
        );

      case 'search-artist':
        const artist = item.data;
        return (
          <TouchableOpacity
            style={styles.artistRow}
            activeOpacity={0.7}
            onPress={() => {
              saveRecentSearch(searchQuery);
              navigation.navigate('ArtistProfile', { artistId: artist.id });
            }}
          >
            <ProgressiveImage
              source={{ uri: artist.profile_picture_url || '' }}
              style={styles.avatarLarge}
            />
            <View style={styles.artistInfo}>
              <View style={styles.nameRow}>
                <Text style={styles.artistName}>{artist.name}</Text>
                {artist.is_artist_verified && (
                  <Ionicons name="checkmark-circle" size={14} color={COLORS.accent.primary} style={styles.verifiedBadge} />
                )}
              </View>
              <Text style={styles.artistHandle}>@{artist.username}</Text>
            </View>
            <TouchableOpacity
              style={styles.followButton}
              activeOpacity={0.8}
              onPress={(e) => {
                e.stopPropagation(); // Prevent row press
                console.log('Follow', artist.id);
              }}
            >
              <Text style={styles.followText}>Follow</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        );

      case 'search-styles':
        return (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.trendingScroll}>
            {item.data.map((style: any, index: number) => (
              <TouchableOpacity
                key={style.id}
                style={styles.trendCard}
                activeOpacity={0.8}
                onPress={() => saveRecentSearch(searchQuery)}
              >
                <View style={styles.trendNumberOverlay}>
                  <Text style={styles.trendRank}>{index + 1}</Text>
                </View>
                <View style={styles.trendContent}>
                  <Text style={styles.trendName}>{style.name}</Text>
                  <Text style={styles.trendCount}>{style.count} results</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        );

      case 'search-collection':
        const collection = item.data;
        return (
          <TouchableOpacity
            style={styles.collectionRow}
            activeOpacity={0.7}
            onPress={() => saveRecentSearch(searchQuery)}
          >
            <ProgressiveImage
              source={{ uri: collection.image_url || '' }}
              style={styles.collectionImage}
            />
            <View style={styles.collectionInfo}>
              <Text style={styles.collectionName}>{collection.name}</Text>
              <Text style={styles.collectionDescription}>{collection.description}</Text>
            </View>
          </TouchableOpacity>
        );

      case 'artist':
        const artistData = item.data;
        return (
          <TouchableOpacity
            style={styles.artistRow}
            activeOpacity={0.7}
            onPress={() => navigation.navigate('ArtistProfile', { artistId: artistData.id })}
          >
            <ProgressiveImage
              source={{ uri: artistData.profile_picture_url || '' }}
              style={styles.avatarLarge}
            />
            <View style={styles.artistInfo}>
              <View style={styles.nameRow}>
                <Text style={styles.artistName}>{artistData.name}</Text>
                {artistData.is_artist_verified && (
                  <Ionicons name="checkmark-circle" size={14} color={COLORS.accent.primary} style={styles.verifiedBadge} />
                )}
              </View>
              <Text style={styles.artistHandle}>@{artistData.username}</Text>
            </View>
            <TouchableOpacity
              style={styles.followButton}
              activeOpacity={0.8}
              onPress={(e) => {
                e.stopPropagation();
                console.log('Follow', artistData.id);
              }}
            >
              <Text style={styles.followText}>Follow</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        );

      case 'trending':
        return (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.trendingScroll}>
            {item.data.map((style: any, index: number) => (
              <TouchableOpacity key={style.id} style={styles.trendCard} activeOpacity={0.8}>
                <View style={styles.trendNumberOverlay}>
                  <Text style={styles.trendRank}>{index + 1}</Text>
                </View>
                <View style={styles.trendContent}>
                  <Text style={styles.trendName}>{style.name}</Text>
                  <Text style={styles.trendCount}>{style.count} searches</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        );

      case 'collections-empty':
        return (
          <View style={styles.section}>
            <Text style={styles.emptyText}>Coming soon...</Text>
          </View>
        );

      case 'recent':
        return (
          <TouchableOpacity
            style={styles.recentRow}
            activeOpacity={0.7}
            onPress={() => handleRecentSearchTap(item.data)}
            onLongPress={() => removeRecentSearch(item.data)}
          >
            <Ionicons name="time-outline" size={16} color={COLORS.text.tertiary} />
            <Text style={styles.recentQueryText}>{item.data}</Text>
            <Ionicons name="chevron-forward" size={14} color={COLORS.text.tertiary} />
          </TouchableOpacity>
        );

      case 'recent-empty':
        return (
          <Text style={styles.emptyText}>No recent searches</Text>
        );

      default:
        return null;
    }
  }, [navigation, searchQuery, saveRecentSearch, handleRecentSearchTap, removeRecentSearch, handleRetrySearch]);

  // Key extractor for FlatList
  const keyExtractor = React.useCallback((item: any) => {
    return item.id;
  }, []);

  // PERFORMANCE: Temporarily remove expensive getItemLayout - will optimize later
  const getItemLayout = undefined;

  // Professional debounced search with race safety
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
      if (searchQuery.length >= MIN_QUERY_LENGTH) {
        runSearchNow(searchQuery);
      } else if (searchQuery.length === 0) {
        setSearchResults(null);
        setSearchError(null);
        setIsSearching(false);
        // Don't clear cache on empty query - keep it for backspace performance
      }
    }, 150); // X-style fast debounce

    return () => clearTimeout(timer);
  }, [searchQuery, runSearchNow]);

  // Handlers
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      // Refresh tab data or search results
      if (debouncedQuery.length >= MIN_QUERY_LENGTH) {
        await runSearchNow(debouncedQuery);
      } else {
        // Refresh current tab data
        // Implementation would refresh the current tab's data
      }
    } finally {
      setIsRefreshing(false);
    }
  }, [debouncedQuery, runSearchNow]);

  const handleSearchSubmit = useCallback(() => {
    if (searchQuery.length >= MIN_QUERY_LENGTH) {
      Keyboard.dismiss();
      saveRecentSearch(searchQuery);
      runSearchNow(searchQuery);
    }
  }, [searchQuery, saveRecentSearch, runSearchNow]);

  const handleSearchFocus = useCallback(() => {
    setIsEditing(true);
    // Immediate keyboard focus
    setTimeout(() => {
      inputRef.current?.focus();
    }, 50); // Small delay to ensure component is ready
  }, []);

  const handleSearchInputFocus = useCallback(() => {
    setInputFocused(true);
    setIsEditing(true);
  }, []);

  const handleSearchInputBlur = useCallback(() => {
    setInputFocused(false);
    if (searchQuery.length === 0) {
      setIsEditing(false);
    }
  }, [searchQuery]);

  const handleClearSearch = useCallback(() => {
    setSearchQuery('');
    setSearchResults(null);
    setSearchError(null);
    setIsSearching(false);
    // Keep focus for better UX
    inputRef.current?.focus();
  }, []);

  const contentContainerStyle = useMemo(() => [
    styles.scrollContent,
    { paddingBottom: insets.bottom + SPACING.xl }
  ], [insets.bottom]);


  const renderEmptyState = useCallback(() => (
    <View style={styles.emptyState}>
      <Ionicons name="search-outline" size={48} color={COLORS.text.tertiary} style={{ marginBottom: 24 }} />
      <Title style={styles.emptyTitle}>{t('search.noResults')}</Title>
      <Body style={styles.emptySubtitle}>{t('search.tryDifferentQuery')}</Body>
    </View>
  ), [t]);

  // Handlers


  return (
    <AppShell noPadding>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <AppHeader title={t('nav.explore')} titleKey="nav.explore" />

      <SearchHeader
        activeTab={activeTab}
        onTabPress={setActiveTab}
        isEditing={isEditing}
        onSearchPlaceholderPress={handleSearchFocus}
        onSearchInputFocus={handleSearchInputFocus}
        onSearchInputBlur={handleSearchInputBlur}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onSearchSubmit={handleSearchSubmit}
        onClearSearch={handleClearSearch}
        inputRef={inputRef}
      />

      <Animated.FlatList
        data={flatListData}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        getItemLayout={getItemLayout}
        contentContainerStyle={contentContainerStyle}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={COLORS.accent.primary}
            colors={[COLORS.accent.primary]}
            progressBackgroundColor={COLORS.background.primary}
          />
        }
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        onScrollBeginDrag={handleScrollBeginDrag}
        onScrollEndDrag={handleScrollEndDrag}
        ListEmptyComponent={renderEmptyState}
        style={styles.listContainer}
        scrollsToTop
        decelerationRate="normal"
        removeClippedSubviews
        initialNumToRender={3}
        maxToRenderPerBatch={2}
        updateCellsBatchingPeriod={50}
        windowSize={5}
        maintainVisibleContentPosition={null}
      />
    </AppShell>
  );
};

// =============================================================================
// Styles
// =============================================================================

const styles = StyleSheet.create({
  listContainer: {
    backgroundColor: COLORS.background.primary,
  },


  // Search Header Styles
  searchHeaderContainer: {
    backgroundColor: COLORS.background.primary,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(212, 175, 55, 0.08)',
  },
  searchBar: {
    height: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(212, 175, 55, 0.08)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingHorizontal: 12,
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchPlaceholder: {
    fontSize: 14,
    color: COLORS.text.tertiary,
    flex: 1,
    textAlignVertical: 'center',
    includeFontPadding: false,
  },
  tabsScrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 4,
    gap: 32,
  },
  tabItem: {
    paddingVertical: 6,
    position: 'relative',
    minWidth: 80,
  },
  tabTouchable: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabText: {
    fontSize: 12,
    letterSpacing: 0.5,
    color: COLORS.text.tertiary,
    fontWeight: '400',
    textAlign: 'center',
  },
  tabTextActive: {
    color: COLORS.text.primary,
    fontWeight: '500',
  },
  tabUnderline: {
    position: 'absolute',
    bottom: -2,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: COLORS.accent.primary,
    borderRadius: 1,
  },
  tabsDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    marginHorizontal: 16,
  },

  // FlatList
  scrollContent: {
    paddingHorizontal: 0,
  },

  // Search States - TIGHT LAYOUT
  searchState: {
    paddingTop: SPACING.large,
    paddingBottom: SPACING.xl,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.large,
  },
  searchStateText: {
    color: COLORS.text.tertiary,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.accent.primary,
  },
  retryButtonText: {
    color: COLORS.accent.primary,
    fontSize: 14,
    fontWeight: '600',
  },

  // Skeleton Loading
  skeletonContainer: {
    width: '100%',
    paddingHorizontal: SPACING.large,
  },
  skeletonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: SPACING.large,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  skeletonAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  skeletonText: {
    flex: 1,
    marginLeft: 14,
    gap: 4,
  },
  skeletonLine: {
    height: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 6,
  },
  skeletonLineShort: {
    width: '60%',
  },

  // Recent Searches
  recentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: SPACING.large,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  recentQueryText: {
    flex: 1,
    color: COLORS.text.primary,
    fontSize: 16,
    marginLeft: 12,
  },

  // Collections
  collectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: SPACING.large,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  collectionImage: {
    width: 56,
    height: 56,
    borderRadius: 8,
    backgroundColor: COLORS.background.tertiary,
  },
  collectionInfo: {
    flex: 1,
    marginLeft: 14,
  },
  collectionName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 2,
  },
  collectionDescription: {
    fontSize: 14,
    color: COLORS.text.tertiary,
  },

  // Search Input
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text.primary,
    paddingVertical: 0,
    paddingHorizontal: 0,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  searchPlaceholderTouchable: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  clearButton: {
    padding: 4,
    marginLeft: 8,
  },

  // Empty State
  emptyState: {
    paddingTop: 100,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xl,
  },
  emptyTitle: {
    color: COLORS.text.primary,
    fontSize: 20,
    letterSpacing: 4,
    marginBottom: 12,
    textAlign: 'center',
  },
  emptySubtitle: {
    color: COLORS.text.tertiary,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
  },
  emptyText: {
    color: COLORS.text.tertiary,
    fontSize: 14,
    textAlign: 'center',
    marginTop: 20,
  },


  // Sections
  section: {
    marginTop: 24, // Reduced section spacing
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text.primary,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  linkText: {
    fontSize: 12,
    color: COLORS.accent.primary,
    fontWeight: '600',
    letterSpacing: 0.5,
  },

  // Trending
  trendingScroll: {
    paddingLeft: 20,
    paddingRight: 8,
  },
  trendCard: {
    width: 150,
    height: 110,
    backgroundColor: COLORS.background.secondary,
    borderRadius: BORDER_RADIUS.large,
    padding: SPACING.small,
    marginRight: 12,
    justifyContent: 'flex-end',
    borderWidth: 1,
    borderColor: COLORS.border.light,
  },
  trendNumberOverlay: {
    position: 'absolute',
    top: 10,
    right: 12,
  },
  trendRank: {
    fontSize: 40,
    fontWeight: '900',
    color: 'rgba(255,255,255,0.03)',
  },
  trendContent: {
    gap: 2,
  },
  trendName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  trendCount: {
    fontSize: 11,
    color: COLORS.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Artist List
  artistRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14, // Reduced from 16
    paddingHorizontal: 20,
    borderBottomWidth: StyleSheet.hairlineWidth, // Thinner divider
    borderBottomColor: 'rgba(255, 255, 255, 0.05)', // Lower opacity
  },
  avatarLarge: {
    width: 56, // Slightly smaller
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.background.tertiary,
  },
  artistInfo: {
    flex: 1,
    marginLeft: 14, // Slightly reduced
    justifyContent: 'center',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  artistName: {
    fontSize: 15, // Slightly smaller
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 2,
  },
  verifiedBadge: {
    marginLeft: 6,
  },
  artistHandle: {
    fontSize: 12, // Slightly smaller
    color: COLORS.text.tertiary,
  },
  followButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)', // Very subtle background
    paddingHorizontal: 12, // Reduced padding
    paddingVertical: 6, // Reduced padding
    borderRadius: 16, // Less rounded
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  followText: {
    fontSize: 11, // Smaller text
    fontWeight: '600', // Less bold
    color: COLORS.accent.primary, // Use accent color instead of inverse
    letterSpacing: 0.5,
  },

  // Categories
  tagGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    gap: 12,
  },
  categoryChip: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: COLORS.background.secondary,
    borderRadius: BORDER_RADIUS.medium,
    borderWidth: 1,
    borderColor: COLORS.border.light,
  },
  categoryText: {
    color: COLORS.text.secondary,
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: 0.3,
  },

  emptySearch: {
    alignItems: 'center',
  },
});

export default SearchScreen;
