import React, { useState } from 'react';
import { View, Dimensions, TouchableOpacity, ScrollView, StyleSheet, ImageSourcePropType } from 'react-native';
import { RouteProp, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import { User, Artwork } from '../types/api';
import { AppShell, AppHeader, Body, Caption, Title } from '../components';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuthStore } from '../stores/authStore';
import { COLORS, SPACING, BORDER_RADIUS } from '../theme';
import ProgressiveImage from '../components/ProgressiveImage';

const DEFAULT_PROFILE_PLACEHOLDER: ImageSourcePropType = require('../../assets/icon.png');

const resolveImageSource = (value?: string | ImageSourcePropType): ImageSourcePropType => {
  if (typeof value === 'string') {
    return { uri: value };
  }
  return value ?? DEFAULT_PROFILE_PLACEHOLDER;
};

type ArtistProfileScreenRouteProp = RouteProp<RootStackParamList, 'ArtistProfile'>;

interface Props {
  route: ArtistProfileScreenRouteProp;
}

const { width } = Dimensions.get('window');
const GUTTER = 14;
const NUM_COLUMNS = 2;
const ITEM_WIDTH = (width - GUTTER * (NUM_COLUMNS + 1)) / NUM_COLUMNS;

const ArtistProfileScreen: React.FC<Props> = ({ route }) => {
  const { artistId } = route.params;
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user: currentUser } = useAuthStore();
  const { t } = useLanguage();
  const [selectedTab, setSelectedTab] = useState<'grid' | 'tagged'>('grid');
  const [bioExpanded, setBioExpanded] = useState(false);

  // Fetch artist profile
  const { data: artist, isLoading: artistLoading } = useQuery({
    queryKey: ['artist', artistId],
    queryFn: async () => {
      const response = await api.get<User>(`/users/${artistId}`);
      return response.data;
    },
  });

  // Fetch artist portfolio
  const { data: artworks, isLoading: artworksLoading } = useQuery({
    queryKey: ['artworks', 'artist', artistId],
    queryFn: async () => {
      const response = await api.get<Artwork[]>(`/artworks/artist/${artistId}`);
      return response.data;
    },
  });

  const artworksCount = artworks?.length || 0;

  const renderStat = (value: string | number, label: string) => (
    <View style={styles.statItem}>
      <Title style={styles.statValue}>{value}</Title>
      <Caption style={styles.statLabel}>{label}</Caption>
    </View>
  );

  if (artistLoading) {
    return (
      <AppShell>
        <View style={styles.centerContainer}>
          <Body color="secondary">{t('common.loading')}</Body>
        </View>
      </AppShell>
    );
  }

  if (!artist) {
    return (
      <AppShell>
        <View style={styles.centerContainer}>
          <Body color="danger">Artist not found</Body>
        </View>
      </AppShell>
    );
  }

  const isCurrentUser = currentUser?.id === artist.id;

  return (
    <AppShell noPadding>
      {/* Top Bar */}
      {/* Premium Top Bar */}
      <AppHeader
        title={artist.username || artist.name || 'Artist'}
        showBack
        onBackPress={() => navigation.goBack()}
      />

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        <View style={styles.headerSection}>
          <View style={styles.identityRow}>
            <View style={styles.avatarWrapper}>
              <View style={styles.avatarMain}>
                <ProgressiveImage
                  source={resolveImageSource(artist.profile_picture_url)}
                  style={styles.avatarImage}
                  blurRadius={10}
                />
                <View style={styles.avatarGlow} />
              </View>
              {artist.is_artist_verified && (
                <View style={styles.verifiedBadge}>
                  <Ionicons name="star" size={12} color="#FFF" />
                </View>
              )}
            </View>

            <View style={styles.identityColumn}>
              <Title style={styles.artistNameHero}>{artist.name}</Title>
              <Caption style={styles.roleCaption}>{artist.is_artist_verified ? 'Verified Artist' : 'Artist'}</Caption>

              <View style={styles.statsBeam}>
                {renderStat(artworksCount, 'Works')}
                {artist.is_artist_verified && (
                  <View style={styles.verifiedChip}>
                    <Ionicons name="checkmark-circle" size={14} color={COLORS.text.primary} />
                    <Caption style={styles.verifiedLabel}>Verified</Caption>
                  </View>
                )}
              </View>

              {artist.bio && (
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => setBioExpanded((prev) => !prev)}
                  style={styles.bioWrapper}
                >
                  <Body
                    style={styles.bioTextEditorial}
                    align="left"
                    numberOfLines={bioExpanded ? undefined : 2}
                  >
                    {artist.bio}
                  </Body>
                  <Caption style={styles.bioToggle}>{bioExpanded ? 'Show less' : 'More'}</Caption>
                </TouchableOpacity>
              )}
            </View>
          </View>

          <View style={styles.actionsRow}>
            {!isCurrentUser ? (
              <>
                <TouchableOpacity style={styles.primaryAction}>
                  <Caption style={styles.primaryActionText}>Commission</Caption>
                </TouchableOpacity>
                <TouchableOpacity style={styles.secondaryIcon}>
                  <Ionicons name="chatbubble-ellipses-outline" size={18} color={COLORS.text.primary} />
                </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity style={styles.secondaryIcon} onPress={() => navigation.navigate('Profile')}>
                <Ionicons name="settings-outline" size={18} color={COLORS.text.primary} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Highlights / Stories (Optional placeholder) */}
        {/* <View style={{ height: 80, marginBottom: 16 }} /> */}

        {/* Tab Navigator (Grid / Tagged) */}
        {/* Navigation Tabs - Minimalist */}
        <View style={styles.tabBarMinimal}>
          <TouchableOpacity
            style={[styles.tabTrigger, selectedTab === 'grid' && styles.tabTriggerActive]}
            onPress={() => setSelectedTab('grid')}
          >
            <Caption style={[styles.tabTriggerText, selectedTab === 'grid' && styles.tabTriggerTextActive]}>Work</Caption>
            {selectedTab === 'grid' && <View style={styles.tabIndicator} />}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabTrigger, selectedTab === 'tagged' && styles.tabTriggerActive]}
            onPress={() => setSelectedTab('tagged')}
          >
            <Caption style={[styles.tabTriggerText, selectedTab === 'tagged' && styles.tabTriggerTextActive]}>Tagged</Caption>
            {selectedTab === 'tagged' && <View style={styles.tabIndicator} />}
          </TouchableOpacity>
        </View>

        {/* Content Stream */}
        {artworksLoading ? (
          <View style={styles.centerContainer}>
            <Body color="secondary">Loading art...</Body>
          </View>
        ) : (
          <View style={styles.galleryContainer}>
            {selectedTab === 'grid' ? (
              artworks && artworks.length > 0 ? (
                <View style={styles.gridExhibition}>
                  {artworks.map((item, index) => (
                    <TouchableOpacity
                      key={item.id}
                      activeOpacity={0.9}
                      style={[styles.artTile, { width: ITEM_WIDTH }]}
                    >
                      <ProgressiveImage
                        source={resolveImageSource(item.image_url)}
                        style={styles.artImage}
                        blurRadius={15}
                      />
                    </TouchableOpacity>
                  ))}
                </View>
              ) : (
                <View style={styles.emptyState}>
                  <View style={styles.circleIcon}>
                    <Ionicons name="camera-outline" size={32} color={COLORS.text.tertiary} />
                  </View>
                  <Title style={styles.emptyStateTitle}>No Works Curated</Title>
                </View>
              )
            ) : (
              <View style={styles.emptyState}>
                <View style={styles.circleIcon}>
                  <Ionicons name="person-outline" size={32} color={COLORS.text.tertiary} />
                </View>
                <Title style={styles.emptyStateTitle}>Tagged</Title>
                <Body color="secondary" align='center' style={{ marginTop: 12, paddingHorizontal: 40 }}>
                  Collaborations and artist tags will appear in this section.
                </Body>
              </View>
            )}
          </View>
        )}

      </ScrollView>
    </AppShell>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    backgroundColor: COLORS.background.primary,
  },
  centerContainer: {
    paddingTop: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },

  headerSection: {
    paddingTop: 28,
    paddingBottom: 28,
    paddingHorizontal: SPACING.xl,
    gap: SPACING.medium,
    alignItems: 'flex-start',
  },
  identityRow: {
    flexDirection: 'row',
    gap: SPACING.large,
    width: '100%',
    alignItems: 'flex-start',
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatarMain: {
    width: 140,
    height: 140,
    borderRadius: 70,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: COLORS.background.secondary,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarGlow: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 70,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.2)',
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    backgroundColor: COLORS.accent.primary,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: COLORS.background.primary,
  },

  identityColumn: {
    flex: 1,
    alignItems: 'flex-start',
    gap: SPACING.small,
  },
  artistNameHero: {
    fontSize: 34,
    lineHeight: 40,
    textAlign: 'left',
    marginBottom: 2,
    letterSpacing: -1,
  },
  roleCaption: {
    fontSize: 10,
    color: COLORS.accent.primary,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  statsBeam: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.medium,
    marginTop: SPACING.small,
  },
  statItem: {
    alignItems: 'flex-start',
  },
  statValue: {
    fontSize: 18,
    marginBottom: 0,
  },
  statLabel: {
    fontSize: 10,
    color: COLORS.text.tertiary,
    marginTop: 2,
  },
  verifiedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  verifiedLabel: {
    color: COLORS.text.primary,
    fontSize: 11,
    letterSpacing: 0.4,
  },

  // Bio Editorial
  bioWrapper: {
    width: '100%',
    gap: 6,
  },
  bioTextEditorial: {
    fontSize: 15,
    lineHeight: 24,
    color: COLORS.text.secondary,
  },
  bioToggle: {
    color: COLORS.text.primary,
    fontSize: 12,
    letterSpacing: 0.6,
  },

  // Premium Actions
  actionsRow: {
    flexDirection: 'row',
    gap: SPACING.medium,
    width: '100%',
    marginTop: SPACING.medium,
  },
  primaryAction: {
    flex: 1,
    height: 52,
    backgroundColor: COLORS.accent.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryActionText: {
    color: COLORS.background.primary,
    fontWeight: '700',
    fontSize: 12,
    letterSpacing: 1,
  },
  secondaryIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Tab Bar
  tabBarMinimal: {
    flexDirection: 'row',
    height: 54,
    borderBottomWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: SPACING.xl,
  },
  tabTrigger: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  tabTriggerActive: {},
  tabTriggerText: {
    fontSize: 12,
    color: COLORS.text.tertiary,
    letterSpacing: 1.2,
  },
  tabTriggerTextActive: {
    color: COLORS.text.primary,
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    width: 24,
    height: 2,
    backgroundColor: COLORS.accent.primary,
  },

  // Gallery
  galleryContainer: {
    paddingHorizontal: GUTTER,
    paddingTop: SPACING.medium,
    paddingBottom: SPACING.large,
  },
  gridExhibition: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  artTile: {
    backgroundColor: COLORS.background.secondary,
    overflow: 'hidden',
    position: 'relative',
    borderRadius: BORDER_RADIUS.small,
    height: 240,
    marginBottom: GUTTER,
  },
  artImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  artImagePlaceholder: {
    backgroundColor: COLORS.surface.secondary,
  },

  emptyState: {
    paddingVertical: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateTitle: {
    fontSize: 20,
    color: COLORS.text.tertiary,
    marginTop: SPACING.large,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  circleIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },

});

export default ArtistProfileScreen;
