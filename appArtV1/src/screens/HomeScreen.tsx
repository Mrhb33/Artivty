import React, { useRef, useState, useCallback, useMemo } from 'react';
import { View, FlatList, TouchableOpacity, StyleSheet, StatusBar, Dimensions, RefreshControl, ListRenderItem, ImageSourcePropType } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { Artwork } from '../types/api';
import { AppShell, AppHeader, PrimaryButton, Title, Body, Caption, ProgressiveImage } from '../components';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';
import { useLanguage } from '../contexts/LanguageContext';
import { useTranslation } from 'react-i18next';
import { COLORS, SPACING } from '../theme';
import { ART_IMAGES } from '../../assets/artImages';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  interpolate,
  Extrapolate
} from 'react-native-reanimated';
import { getArtworkImageSource } from '../utils/artworkImages';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH;
const CARD_MARGIN_BOTTOM = SPACING.xl;
const CARD_HEIGHT = CARD_WIDTH * 1.25; // 4:5 portrait ratio
const ITEM_HEIGHT = CARD_HEIGHT + CARD_MARGIN_BOTTOM;

const CATEGORY_ITEMS: { id: string; translationKey: string }[] = [
  { id: 'all', translationKey: 'home.categories.all' },
  { id: 'paintings', translationKey: 'home.categories.paintings' },
  { id: 'digital', translationKey: 'home.categories.digital' },
  { id: 'sculpture', translationKey: 'home.categories.sculpture' },
  { id: 'photography', translationKey: 'home.categories.photography' },
  { id: 'abstract', translationKey: 'home.categories.abstract' },
];

type CategoryDefinition = {
  id: string;
  translationKey: string;
};

type CategoryData = CategoryDefinition & {
  label: string;
};

const HomeScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { t, isRTL } = useLanguage();
  const { t: homeT } = useTranslation('home');
  const flatListRef = useRef<FlatList>(null);
  const insets = useSafeAreaInsets();
  const [activeCategory, setActiveCategory] = useState(CATEGORY_ITEMS[0].id);

  const categories = useMemo(
    () =>
      CATEGORY_ITEMS.map((item) => ({
        ...item,
        label: homeT(item.translationKey),
      })),
    [homeT]
  );


  const scrollY = useSharedValue(0);

  const onScroll = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  // Header Animation Styles
  const headerBackgroundStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      scrollY.value,
      [0, 50],
      [0, 1],
      Extrapolate.CLAMP
    );
    return {
      backgroundColor: `rgba(5, 5, 5, ${opacity * 0.95})`,
    };
  });

  const headerTitleStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      scrollY.value,
      [10, 40],
      [0, 1],
      Extrapolate.CLAMP
    );
    const translateY = interpolate(
      scrollY.value,
      [0, 50],
      [10, 0],
      Extrapolate.CLAMP
    );
    return {
      opacity,
      transform: [{ translateY }],
    };
  });

  // Scroll to top when Home tab is tapped again
  React.useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      setTimeout(() => {
        flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
      }, 100);
    });
    return unsubscribe;
  }, [navigation]);

  const { data: artworks, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['artworkFeed'],
    queryFn: async () => {
      try {
        const response = await api.get<Artwork[]>('/artworks/feed');
        return response.data;
      } catch (error: any) {
        throw error;
      }
    },
    staleTime: 2 * 60 * 1000,
  });

  // Mock data for development
const createMockArtwork = (
  id: number,
  title: string,
  style: string,
  image: ImageSourcePropType
): Artwork => ({
  id,
  artist_id: id,
  title,
  style_tags: style,
  created_at: new Date().toISOString(),
  images: {
    originalUrl: image,
    feedUrl: image,
    squareUrl: image,
    thumbUrl: image,
  },
});

const mockArtworks: Artwork[] = [
  createMockArtwork(1, 'THE SILENCE OF THE VOID', 'Minimalist', ART_IMAGES.artwork1),
  createMockArtwork(2, 'NEON SYMPHONY NO. 5', 'Cyberpunk', ART_IMAGES.artwork2),
  createMockArtwork(3, 'GOLDEN HOUR MANIFESTO', 'Photography', ART_IMAGES.artwork3),
  createMockArtwork(4, 'ETHEREAL WHISPERS', 'Abstract', ART_IMAGES.artwork4),
];

  const displayArtworks = useMemo(() => {
    return artworks && artworks.length > 0 ? artworks : mockArtworks;
  }, [artworks]);

  // Memoized card component to prevent unnecessary re-renders
  const EditorialCard = React.memo<{ item: Artwork; index: number }>(({ item }) => {
    const handlePress = useCallback(() => {
      // Navigation logic here
    }, []);

    const { t: cardT } = useTranslation('home');

    const tagText = useMemo(() => {
      return item.style_tags?.split(',')[0] || 'FEATURED';
    }, [item.style_tags]);
    const feedSource = getArtworkImageSource(item, 'feed');
    const thumbSource = getArtworkImageSource(item, 'thumb');
    const displaySource = feedSource ?? thumbSource;
    const placeholderSource = thumbSource ?? displaySource;
    const artworkImageElement = displaySource ? (
      <ProgressiveImage
        source={displaySource}
        placeholderSource={placeholderSource}
        style={styles.cardImage}
        blurRadius={15}
      />
    ) : (
      <View style={[styles.cardImage, styles.cardImagePlaceholder]} />
    );

    return (
      <TouchableOpacity
        activeOpacity={0.98}
        onPress={handlePress}
        style={styles.cardContainer}
      >
        {artworkImageElement}

        <View style={styles.cardOverlay} />

        {/* Editorial Content */}
        <View style={styles.cardContent}>
          <View style={styles.contentTop}>
            <View style={styles.tagBadge}>
              <Caption style={styles.tagText}>{tagText}</Caption>
            </View>
            <TouchableOpacity style={styles.saveBtn}>
              <Ionicons name="bookmark-outline" size={20} color={COLORS.text.primary} />
            </TouchableOpacity>
          </View>

          <View style={styles.contentMiddle}>
            <Title style={[styles.cardTitleHero, isRTL && styles.cardTitleHeroRTL]}>
              {item.title}
            </Title>
          </View>

          <View style={styles.cardFooter}>
            <View style={styles.artistInfo}>
              <View style={styles.miniAvatar} />
              <View>
              <Caption style={styles.artistBy}>{cardT('home.curatedBy')}</Caption>
                <Body style={styles.artistName}>Artisan #{item.artist_id}</Body>
              </View>
            </View>

            <TouchableOpacity style={styles.collectAction}>
              <Body style={styles.collectText}>{cardT('home.acquire')}</Body>
              <View style={styles.collectArrow}>
                <Ionicons name="chevron-forward" size={12} color={COLORS.text.primary} />
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  }, (prevProps, nextProps) => {
    // Custom comparison to prevent re-renders when props haven't changed
    return prevProps.item.id === nextProps.item.id &&
           prevProps.item.title === nextProps.item.title &&
           prevProps.item.style_tags === nextProps.item.style_tags &&
           prevProps.item.artist_id === nextProps.item.artist_id &&
           prevProps.item.images?.feedUrl === nextProps.item.images?.feedUrl &&
           prevProps.item.images?.thumbUrl === nextProps.item.images?.thumbUrl;
  });
  EditorialCard.displayName = 'EditorialCard';

  const renderEditorialCard: ListRenderItem<Artwork> = useCallback(({ item, index }) => {
    return <EditorialCard item={item} index={index} />;
  }, []);

  const getItemLayout = useCallback((data: any, index: number) => ({
    length: ITEM_HEIGHT,
    offset: ITEM_HEIGHT * index,
    index,
  }), []);

  const keyExtractor = useCallback((item: Artwork) => item.id.toString(), []);

  // Memoized category item component
  const CategoryItem = React.memo<{ item: CategoryData; isActive: boolean; onPress: (id: string) => void }>(
    ({ item, isActive, onPress }) => {
      const handlePress = useCallback(() => {
        onPress(item.id);
      }, [item.id, onPress]);

      return (
        <TouchableOpacity
          onPress={handlePress}
          style={[
            styles.categoryTab,
            isActive && styles.categoryTabActive
          ]}
        >
          <Caption style={[
            styles.categoryText,
            isActive && styles.categoryTextActive
          ]}>
            {item.label}
          </Caption>
        </TouchableOpacity>
      );
    },
    (prevProps, nextProps) => prevProps.isActive === nextProps.isActive && prevProps.item.id === nextProps.item.id
  );
  CategoryItem.displayName = 'CategoryItem';

  const handleCategoryPress = useCallback((item: string) => {
    setActiveCategory(item);
  }, []);

  const renderCategoryItem = useCallback(({ item }: { item: CategoryData }) => (
    <CategoryItem
      item={item}
      isActive={activeCategory === item.id}
      onPress={handleCategoryPress}
    />
  ), [activeCategory, handleCategoryPress]);

  const categoryKeyExtractor = useCallback((item: CategoryData) => item.id, []);


  const renderHeader = useCallback(() => (
    <View style={styles.listHeader}>
      <View style={styles.preHeader}>
      <Title
        style={[
          styles.homeHeroTitle,
          isRTL && styles.homeHeroTitleRTL,
        ]}
        includeFontPadding={true} // Android Arabic text clipping fix
      >
        {homeT('home.heroTitle')}
      </Title>
      </View>

      <FlatList
        horizontal
        data={categories}
        renderItem={renderCategoryItem}
        keyExtractor={categoryKeyExtractor}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoriesContainer}
        removeClippedSubviews
        initialNumToRender={categories.length}
        maxToRenderPerBatch={categories.length}
        windowSize={1}
      />
    </View>
  ), [renderCategoryItem, categoryKeyExtractor, categories, homeT]);

  const handleCreateRequest = useCallback(() => {
    navigation.navigate('CreateRequest');
  }, [navigation]);

  const renderEmptyState = useCallback(() => (
    <View style={styles.emptyState}>
      <Ionicons name="images-outline" size={48} color={COLORS.text.tertiary} style={{ marginBottom: 24 }} />
      <Title style={styles.emptyTitle}>{homeT('home.emptyTitle')}</Title>
      <Body style={styles.emptySubtitle}>{homeT('home.emptySubtitle')}</Body>
      <PrimaryButton
        title={homeT('home.emptyAction')}
        onPress={handleCreateRequest}
        variant="primary"
        style={{ width: 220, marginTop: 32 }}
      />
    </View>
  ), [handleCreateRequest, homeT]);

  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  const contentContainerStyle = useMemo(() => [
    styles.scrollContent,
    { paddingBottom: insets.bottom + SPACING.xl }
  ], [insets.bottom]);

  return (
    <AppShell noPadding>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <AppHeader title={t('nav.gallery')} titleKey="nav.gallery" />

      <Animated.FlatList
        ref={flatListRef as any}
        data={displayArtworks}
        keyExtractor={keyExtractor}
        renderItem={renderEditorialCard}
        getItemLayout={getItemLayout}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={contentContainerStyle}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isFetching}
            onRefresh={handleRefresh}
            tintColor={COLORS.accent.primary}
            colors={[COLORS.accent.primary]}
            progressBackgroundColor={COLORS.background.primary}
          />
        }
        onScroll={onScroll}
        scrollEventThrottle={16}
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

const styles = StyleSheet.create({
  listContainer: {
    backgroundColor: COLORS.background.primary,
  },

  // List Header
  listHeader: {
    paddingTop: SPACING.medium,
    paddingBottom: SPACING.xl,
  },
  preHeader: {
    paddingHorizontal: SPACING.large,
    marginBottom: SPACING.xl,
    // Additional padding for Arabic text to prevent clipping
    paddingTop: SPACING.small,
    paddingBottom: SPACING.small,
  },
  homeHeroTitle: {
    // Base styles - typography system handles Arabic/Latin differences
    color: COLORS.text.primary,
  },
  homeHeroTitleRTL: {
    // Additional RTL-specific container padding to prevent clipping
    paddingTop: 8,
    paddingBottom: 8,
  },

  // Categories
  categoriesContainer: {
    paddingHorizontal: SPACING.large,
    gap: SPACING.medium,
  },
  categoryTab: {
    paddingVertical: 8,
    paddingHorizontal: 0,
    marginRight: SPACING.large,
    borderBottomWidth: 1,
    borderBottomColor: 'transparent',
  },
  categoryTabActive: {
    borderBottomColor: COLORS.accent.primary,
  },
  categoryText: {
    fontSize: 12,
    letterSpacing: 1,
    color: COLORS.text.tertiary,
  },
  categoryTextActive: {
    color: COLORS.text.primary,
  },

  // FlatList
  scrollContent: {
    paddingHorizontal: 0,
  },

  // Card - Controlled layout with centered, contained image
  cardContainer: {
    height: CARD_HEIGHT,
    width: SCREEN_WIDTH,
    marginBottom: CARD_MARGIN_BOTTOM,
    backgroundColor: COLORS.background.secondary,
    overflow: 'hidden',
    position: 'relative',
  },
  cardImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  cardImagePlaceholder: {
    backgroundColor: COLORS.surface.secondary,
  },
  cardOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)', // Cinematic dimming
  },
  cardContent: {
    position: 'absolute',
    top: SPACING.large,
    left: SPACING.medium,
    right: SPACING.medium,
    bottom: SPACING.large,
    justifyContent: 'space-between',
  },

  contentTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tagBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 4,
  },
  tagText: {
    color: COLORS.text.primary,
    fontSize: 10,
    letterSpacing: 2,
    fontWeight: '700',
  },
  saveBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },

  contentMiddle: {
    flex: 1,
    justifyContent: 'center',
  },
  cardTitleHero: {
    color: COLORS.text.primary,
    fontSize: 52,
    lineHeight: 58,
    fontWeight: '300',
    letterSpacing: -3,
    textTransform: 'uppercase',
  },
  cardTitleHeroRTL: {
    textTransform: 'none',
    letterSpacing: 0,
  },

  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    paddingTop: SPACING.xl,
  },
  artistInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  miniAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: COLORS.accent.primary,
  },
  artistBy: {
    fontSize: 8,
    letterSpacing: 1.5,
    color: COLORS.text.tertiary,
    marginBottom: 2,
  },
  artistName: {
    fontSize: 13,
    letterSpacing: 0.5,
    color: COLORS.text.primary,
    fontWeight: '500',
  },

  collectAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  collectText: {
    fontSize: 12,
    letterSpacing: 3,
    fontWeight: '700',
    color: COLORS.text.primary,
  },
  collectArrow: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.accent.primary,
    alignItems: 'center',
    justifyContent: 'center',
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

});

export default HomeScreen;
