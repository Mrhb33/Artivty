import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Pressable,
  StyleSheet,
  TextInput,
  Animated,
  Dimensions,
  Image,
  StatusBar,
  Share,
} from 'react-native';
import { useAuthStore } from '../stores/authStore';
import { useCurrentUser, useUpdateUser } from '../hooks/useAuth';
import { useLogout } from '../hooks/useAuth';
import { useLanguage, Language } from '../contexts/LanguageContext';
import { User } from '../types/api';
import { AppShell, AppHeader, Body, Caption, Title } from '../components';
import ProgressiveImage from '../components/ProgressiveImage';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS } from '../theme';
import { LinearGradient } from 'expo-linear-gradient';

const USE_MOCK = __DEV__;
const HEADER_SCROLL_RANGE = 160;
const MAX_BIO_LENGTH = 220;
const TAB_KEYS: Array<'gallery' | 'saved'> = ['gallery', 'saved'];
const LUX_BORDER_COLOR = 'rgba(255, 255, 255, 0.04)';
const LUX_BORDER_WIDTH = 1;

const MOCK_USER: User = {
  id: 999,
  email: 'influencer@artivty.dev',
  name: 'Amina Laurent',
  username: 'amina.laurent',
  role: 'artist',
  is_active: true,
  profile_picture_url: 'https://via.placeholder.com/512x512.png?text=Portrait',
  bio: 'Portrait artist. Minimal, calm, expensive.\nAvailable for commissions in Paris and Rome.',
  is_artist_verified: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

const MOCK_GALLERY_WORKS = [
  { id: 'hero-1', url: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?auto=format&fit=crop&w=900&q=80', year: '2025', title: 'Nocturne Dunes', hero: true },
  { id: 'gallery-2', url: 'https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?auto=format&fit=crop&w=700&q=80', year: '2024', title: 'Silver Dew' },
  { id: 'gallery-3', url: 'https://images.unsplash.com/photo-1541963463532-d68292c34b19?auto=format&fit=crop&w=700&q=80', year: '2024', title: 'Quiet Alloy' },
  { id: 'gallery-4', url: 'https://images.unsplash.com/photo-1582555172866-f73bb12a2ab3?auto=format&fit=crop&w=700&q=80', year: '2023', title: 'North Light' },
  { id: 'gallery-5', url: 'https://images.unsplash.com/photo-1576133030447-405cb02b701e?auto=format&fit=crop&w=700&q=80', year: '2023', title: 'Lucent Field' },
  { id: 'gallery-6', url: 'https://images.unsplash.com/photo-1605721911516-3dfd4a270453?auto=format&fit=crop&w=700&q=80', year: '2022', title: 'Quiet Bloom' },
];

const MOCK_SAVED_WORKS = [
  { id: 'saved-1', url: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=700&q=80', year: '2024', title: 'Monochrome Coast' },
  { id: 'saved-2', url: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=700&q=80', year: '2023', title: 'Ceramic Clouds' },
  { id: 'saved-3', url: 'https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?auto=format&fit=crop&w=700&q=80', year: '2022', title: 'Helios' },
  { id: 'saved-4', url: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=700&q=80', year: '2021', title: 'Soft Horizon' },
  { id: 'saved-5', url: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=700&q=80', year: '2020', title: 'Cloud Line' },
  { id: 'saved-6', url: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=700&q=80', year: '2020', title: 'Midnight Bloom' },
];


const formatStatValue = (value: number | string) => (typeof value === 'number' ? value.toLocaleString() : value);

interface BioEditorProps {
  bio?: string | null;
  isEditing: boolean;
  onSubmit: (value: string) => void;
  isSaving: boolean;
}

const BioEditor: React.FC<BioEditorProps> = React.memo(({ bio, isEditing, onSubmit, isSaving }) => {
  const [draft, setDraft] = useState(bio ?? '');

  useEffect(() => {
    if (!isEditing) {
      setDraft(bio ?? '');
    }
  }, [bio, isEditing]);

  const hasContent = draft.trim().length > 0;
  const hasChanges = draft.trim() !== (bio ?? '').trim();
  const canSave = hasChanges && hasContent;

  if (isEditing) {
    return (
      <View style={[styles.bioSection, styles.bioEditingBackground]}>
        <TextInput
          value={draft}
          onChangeText={(text) => setDraft(text.slice(0, MAX_BIO_LENGTH))}
          style={styles.bioInput}
          placeholder="Draft your editorial statement…"
          placeholderTextColor="rgba(255,255,255,0.3)"
          multiline
          textAlignVertical="top"
          autoFocus
        />
        <TouchableOpacity
          onPress={() => onSubmit(draft.trim())}
          disabled={!canSave || isSaving}
          activeOpacity={0.8}
          style={[styles.bioSaveButton, canSave && styles.bioSaveButtonActive]}
        >
          <Caption style={[styles.bioSaveText, (!canSave || isSaving) && styles.bioSaveTextDisabled]}>
            {isSaving ? 'Updating...' : 'Publish Statement'}
          </Caption>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.bioSection}>
      {bio ? (
        <Body style={styles.bioText} align="center">
          {bio}
        </Body>
      ) : (
        <Body style={styles.bioPlaceholder} align="center">
          Write your story here…
        </Body>
      )}
    </View>
  );
});
BioEditor.displayName = 'BioEditor';

interface AvatarActionSheetProps {
  visible: boolean;
  onClose: () => void;
  onChangePhoto: () => Promise<void> | void;
  onRemovePhoto: () => void;
}

const AvatarActionSheet: React.FC<AvatarActionSheetProps> = ({ visible, onClose, onChangePhoto, onRemovePhoto }) => (
  <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
    <Pressable style={styles.sheetOverlay} onPress={onClose}>
      <Pressable style={styles.sheetCard} onPress={() => { }}>
        <Caption style={styles.sheetTitle}>Profile photo</Caption>
        <TouchableOpacity style={styles.sheetOption} onPress={() => { onChangePhoto(); onClose(); }}>
          <Text style={styles.sheetOptionText}>Change photo</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.sheetOption} onPress={() => { onRemovePhoto(); onClose(); }}>
          <Text style={[styles.sheetOptionText, styles.sheetDangerText]}>Remove</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.sheetOption} onPress={onClose}>
          <Text style={styles.sheetOptionText}>Cancel</Text>
        </TouchableOpacity>
      </Pressable>
    </Pressable>
  </Modal>
);


const ProfileScreen = () => {
  const { user } = useAuthStore();
  const { data: currentUser } = useCurrentUser();
  const updateUserMutation = useUpdateUser();
  const logoutMutation = useLogout();
  const { language, setLanguage, t } = useLanguage();

  const [selectedTab, setSelectedTab] = useState<'gallery' | 'saved'>('gallery');
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [avatarOverrideUri, setAvatarOverrideUri] = useState<string | null>(null);
  const [avatarSheetVisible, setAvatarSheetVisible] = useState(false);
  const [isSavingBio, setIsSavingBio] = useState(false);
  const [headerTitle, setHeaderTitle] = useState(t('nav.profile'));

  const scrollY = useRef(new Animated.Value(0)).current;
  const indicatorAnim = useRef(new Animated.Value(0)).current;

  const displayUser = currentUser ?? user;
  const effectiveUser = useMemo(() => displayUser ?? (USE_MOCK ? MOCK_USER : null), [displayUser]);

  useEffect(() => {
    const listener = scrollY.addListener(({ value }) => {
      const nextTitle = value > 80 ? effectiveUser?.name ?? t('nav.profile') : t('nav.profile');
      setHeaderTitle((prev) => (prev === nextTitle ? prev : nextTitle));
    });
    return () => scrollY.removeListener(listener);
  }, [effectiveUser?.name, scrollY, t]);

  useEffect(() => {
    const target = selectedTab === 'gallery' ? 0 : 1;
    Animated.spring(indicatorAnim, {
      toValue: target,
      useNativeDriver: true,
      damping: 18,
      stiffness: 120,
      mass: 0.8,
    }).start();
  }, [selectedTab, indicatorAnim]);

  useEffect(() => {
    const images = [...MOCK_GALLERY_WORKS, ...MOCK_SAVED_WORKS].map((art) => art.url);
    images.forEach((uri) => Image.prefetch(uri));
  }, []);


  const stats = useMemo(() => {
    if (USE_MOCK) {
      return { works: 48, collectors: '18.4K', following: 312, saved: 22, likes: '3.1K' };
    }
    return { works: 12, collectors: 980, following: 142, saved: 7, likes: '244' };
  }, []);

  const statLabels = useMemo(() => (
    effectiveUser?.role === 'artist'
      ? ['Works', 'Collectors', 'Following']
      : ['Saved', 'Following', 'Likes']
  ), [effectiveUser?.role]);

  const statValues = useMemo(() => (
    effectiveUser?.role === 'artist'
      ? [stats.works, stats.collectors, stats.following]
      : [stats.saved, stats.following, stats.likes]
  ), [effectiveUser?.role, stats]);

  const statEntries = statLabels.map((label, index) => ({
    label,
    value: formatStatValue(statValues[index]),
  }));

  const screenWidth = Dimensions.get('window').width;
  const tabWidth = screenWidth / TAB_KEYS.length;
  const indicatorWidth = screenWidth * 0.15;
  const indicatorTranslate = indicatorAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [screenWidth * 0.25 - indicatorWidth / 2, screenWidth * 0.75 - indicatorWidth / 2],
  });

  const avatarScale = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_RANGE],
    outputRange: [1, 0.65],
    extrapolate: 'clamp',
  });

  const avatarTranslateY = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_RANGE],
    outputRange: [0, -18],
    extrapolate: 'clamp',
  });

  const statsOpacity = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_RANGE * 0.4, HEADER_SCROLL_RANGE],
    outputRange: [1, 0.6, 0],
    extrapolate: 'clamp',
  });

  const bioOpacity = scrollY.interpolate({
    inputRange: [HEADER_SCROLL_RANGE * 0.2, HEADER_SCROLL_RANGE * 0.9, HEADER_SCROLL_RANGE + 20],
    outputRange: [1, 0.5, 0],
    extrapolate: 'clamp',
  });

  const heroTitleOpacity = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_RANGE * 0.4],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });



  const handleLogout = useCallback(() => {
    logoutMutation.mutate();
  }, [logoutMutation]);

  const handleShareProfile = useCallback(() => {
    if (!effectiveUser) return;
    Share.share({
      title: effectiveUser.name,
      message: `Discover ${effectiveUser.name}'s work on Artivty.`,
    });
  }, [effectiveUser]);

  const handleChangePhoto = useCallback(async () => {
    setAvatarSheetVisible(false);
    try {
      const ImagePicker = await import('expo-image-picker');
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') return;
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.85,
      });
      if (result.canceled || !result.assets?.[0]?.uri) return;
      const uri = result.assets[0].uri;
      setAvatarOverrideUri(uri);
      updateUserMutation.mutate({ profile_picture_url: uri });
    } catch (error) {
      console.error('Avatar update failed', error);
    }
  }, [updateUserMutation]);

  const handleRemovePhoto = useCallback(() => {
    setAvatarOverrideUri(null);
    updateUserMutation.mutate({ profile_picture_url: null });
  }, [updateUserMutation]);

  const handleToggleEditProfile = useCallback(() => {
    setIsEditingProfile((prev) => !prev);
  }, []);

  const handleBioSubmit = useCallback((draft: string) => {
    if (!effectiveUser) return;
    const trimmed = draft.trim();
    const current = (effectiveUser.bio ?? '').trim();
    if (trimmed === current) {
      setIsEditingProfile(false);
      return;
    }
    setIsSavingBio(true);
    updateUserMutation.mutate({ bio: trimmed }, {
      onSettled: () => {
        setIsSavingBio(false);
        setIsEditingProfile(false);
      },
    });
  }, [effectiveUser, updateUserMutation]);

  if (!effectiveUser) {
    return (
      <AppShell noPadding>
        <AppHeader title={t('nav.profile')} />
        <View style={styles.skeletonContainer}>
          <View style={styles.skeletonCircle} />
          <View style={styles.skeletonLine} />
          <View style={styles.skeletonLineShort} />
          <View style={styles.skeletonRow}>
            <View style={styles.skeletonBar} />
            <View style={styles.skeletonBar} />
            <View style={styles.skeletonBar} />
          </View>
        </View>
      </AppShell>
    );
  }

  const actions = [
    {
      label: 'Edit profile',
      onPress: handleToggleEditProfile,
      primary: true,
      active: isEditingProfile,
    },
    {
      label: 'Share',
      onPress: handleShareProfile,
      primary: false,
    },
  ];

  const renderGrid = (tiles: typeof MOCK_GALLERY_WORKS) => (
    <View style={styles.galleryContainer}>
      <View style={styles.gridExhibition}>
        {tiles.map((art, index) => (
          <TouchableOpacity
            key={art.id}
            activeOpacity={0.9}
            style={[
              styles.artFrame,
              index === 0 ? styles.artFrameHero :
                index % 3 === 0 ? styles.artFrameMedium :
                  styles.artFrameSmall,
            ]}
            onPress={() => console.log('Artwork tapped', art.id)}
          >
            <ProgressiveImage source={{ uri: art.url }} style={styles.artImage} />
            <View style={styles.artOverlay}>
              <Caption style={styles.artYear}>{art.year}</Caption>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  return (
    <AppShell noPadding>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <AppHeader title={headerTitle} />

      <Animated.ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
      >
        <View style={styles.headerWrapper}>
          <LinearGradient
            colors={['rgba(212, 175, 55, 0.05)', 'rgba(0,0,0,0.3)', 'transparent']}
            style={StyleSheet.absoluteFill}
          />
          <Animated.View
            style={[
              styles.avatarContainer,
              { transform: [{ scale: avatarScale }, { translateY: avatarTranslateY }] },
            ]}
          >
            <TouchableOpacity activeOpacity={0.85} onPress={() => setAvatarSheetVisible(true)}>
              <View style={styles.avatarRingsOuter}>
                <View style={styles.avatarRingsInner}>
                  <ProgressiveImage
                    source={{ uri: avatarOverrideUri || effectiveUser.profile_picture_url || '' }}
                    style={styles.avatarImage}
                  />
                </View>
              </View>
            </TouchableOpacity>
            <View style={styles.cameraBadge}>
              <Ionicons name="camera-outline" size={14} color={COLORS.text.primary} />
            </View>
          </Animated.View>

          {/* BIO DIRECTLY UNDER PICTURE */}
          <Animated.View style={[styles.bioUnderAvatar, { opacity: bioOpacity }]}>
            <BioEditor
              bio={effectiveUser.bio}
              isEditing={isEditingProfile}
              onSubmit={handleBioSubmit}
              isSaving={isSavingBio}
            />
          </Animated.View>

          <Animated.View style={[styles.identityBlock, { opacity: heroTitleOpacity }]}>
            <Title style={styles.artistName}>{effectiveUser.name}</Title>
            <View style={styles.metaRow}>
              <Caption style={styles.roleCaption}>{effectiveUser.role === 'artist'
                ? (effectiveUser.is_artist_verified ? 'Curation • Verified Artist' : 'Artist')
                : 'Collector • Art Patron'
              }</Caption>
            </View>
          </Animated.View>

          <Animated.View style={[styles.statsRow, { opacity: statsOpacity }]}>
            {statEntries.map((stat, index) => (
              <React.Fragment key={stat.label}>
                <View style={styles.statItem}>
                  <Title style={styles.statValue}>{stat.value}</Title>
                  <Caption style={styles.statLabel}>{stat.label}</Caption>
                </View>
                {index < statEntries.length - 1 && <View style={styles.statDivider} />}
              </React.Fragment>
            ))}
          </Animated.View>
        </View>

        <View style={styles.actionRow}>
          {actions.map((action) => (
            <TouchableOpacity
              key={action.label}
              onPress={action.onPress}
              activeOpacity={0.8}
              style={[
                styles.actionButtonBase,
                action.primary ? styles.actionButtonPrimary : styles.actionButtonSecondary,
                action.primary && action.active && styles.actionButtonPrimaryActive,
              ]}
            >
              <Text style={[styles.actionLabel, action.primary ? styles.actionLabelPrimary : styles.actionLabelSecondary]}>
                {action.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.tabBar}>
          {TAB_KEYS.map((tab) => {
            const isActive = selectedTab === tab;
            return (
              <TouchableOpacity
                key={tab}
                style={styles.tabTrigger}
                activeOpacity={0.8}
                onPress={() => setSelectedTab(tab)}
              >
                <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>{tab === 'gallery' ? 'Gallery' : 'Saved'}</Text>
              </TouchableOpacity>
            );
          })}
          <Animated.View
            style={[
              styles.tabIndicator,
              {
                width: indicatorWidth,
                transform: [{ translateX: indicatorTranslate }],
              },
            ]}
          />
        </View>

        {selectedTab === 'gallery' ? renderGrid(MOCK_GALLERY_WORKS) : renderGrid(MOCK_SAVED_WORKS)}
      </Animated.ScrollView>

      <AvatarActionSheet
        visible={avatarSheetVisible}
        onClose={() => setAvatarSheetVisible(false)}
        onChangePhoto={handleChangePhoto}
        onRemovePhoto={handleRemovePhoto}
      />

    </AppShell>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    backgroundColor: COLORS.background.primary,
  },
  scrollContent: {
    paddingBottom: SPACING.xl * 1.5,
  },
  headerWrapper: {
    paddingTop: SPACING.xxl,
    paddingBottom: SPACING.xl,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  avatarContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.large,
  },
  avatarRingsOuter: {
    borderRadius: 75,
    borderWidth: 1.5,
    borderColor: 'rgba(212, 175, 55, 0.4)',
    padding: 6,
    ...SHADOWS.glow,
  },
  avatarRingsInner: {
    borderRadius: 65,
    overflow: 'hidden',
    backgroundColor: COLORS.background.secondary,
  },
  avatarImage: {
    width: 130,
    height: 130,
    borderRadius: 65,
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: COLORS.accent.primary,
    borderRadius: 14,
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.background.primary,
  },
  identityBlock: {
    alignItems: 'center',
    marginBottom: SPACING.medium,
  },
  artistName: {
    fontSize: 28,
    letterSpacing: -0.5,
    color: COLORS.text.primary,
    fontWeight: '300',
    textTransform: 'uppercase',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.tiny,
  },
  roleCaption: {
    fontSize: 10,
    letterSpacing: 3,
    color: COLORS.accent.primary,
    textTransform: 'uppercase',
  },
  verifiedIcon: {
    marginLeft: 6,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    paddingVertical: SPACING.small,
    width: '100%',
    marginTop: SPACING.xl,
  },
  statItem: {
    alignItems: 'center',
    paddingHorizontal: SPACING.large,
  },
  statValue: {
    fontSize: 20,
    color: COLORS.text.primary,
    fontWeight: '300',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 9,
    color: COLORS.text.tertiary,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  bioUnderAvatar: {
    marginTop: SPACING.medium,
    alignItems: 'center',
  },
  bioSection: {
    marginHorizontal: SPACING.large,
    marginTop: SPACING.large * 1.2,
  },
  bioText: {
    color: COLORS.text.secondary,
    fontSize: 15,
    lineHeight: 26,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  bioPlaceholder: {
    color: COLORS.text.secondary,
    fontSize: 14,
    lineHeight: 22,
    fontStyle: 'normal',
  },
  bioEditingBackground: {
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderRadius: 0,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    padding: SPACING.medium,
    marginHorizontal: SPACING.large,
  },
  bioInput: {
    minHeight: 110,
    color: COLORS.text.primary,
    fontSize: 15,
    lineHeight: 22,
    borderWidth: 0,
    padding: 0,
    marginBottom: SPACING.small,
  },
  bioSaveButton: {
    alignSelf: 'center',
    paddingVertical: SPACING.small,
    paddingHorizontal: SPACING.large,
    borderRadius: 0,
    borderWidth: 1,
    borderColor: COLORS.accent.primary,
  },
  bioSaveButtonActive: {
    backgroundColor: COLORS.accent.primary,
  },
  bioSaveText: {
    color: COLORS.text.primary,
    fontSize: 12,
    letterSpacing: 1.4,
  },
  bioSaveTextDisabled: {
    opacity: 0.4,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.large,
    marginTop: SPACING.large * 1.2,
  },
  actionButtonBase: {
    flex: 1,
    height: 56,
    borderRadius: 0,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 4,
  },
  actionButtonPrimary: {
    backgroundColor: COLORS.accent.primary,
  },
  actionButtonPrimaryActive: {
    backgroundColor: 'rgba(212, 175, 55, 0.8)',
  },
  actionButtonSecondary: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: LUX_BORDER_WIDTH,
    borderColor: LUX_BORDER_COLOR,
  },
  actionLabel: {
    fontSize: 12,
    letterSpacing: 2,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  actionLabelPrimary: {
    color: COLORS.background.primary,
  },
  actionLabelSecondary: {
    color: COLORS.text.primary,
  },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderColor: 'rgba(255,255,255,0.04)',
    marginTop: SPACING.xl,
    position: 'relative',
    height: 60,
  },
  tabTrigger: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: SPACING.small,
  },
  tabLabel: {
    fontSize: 11,
    letterSpacing: 2,
    color: COLORS.text.tertiary,
    textTransform: 'uppercase',
  },
  tabLabelActive: {
    color: COLORS.text.primary,
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    height: 2,
    borderRadius: 1,
    backgroundColor: COLORS.accent.primary,
  },
  galleryContainer: {
    paddingTop: SPACING.medium,
  },
  gridExhibition: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: SPACING.tiny,
  },
  artFrame: {
    backgroundColor: COLORS.background.secondary,
    overflow: 'hidden',
    position: 'relative',
    margin: 2,
  },
  artFrameHero: {
    width: '100%',
    height: 380,
    marginHorizontal: 0,
    marginBottom: 4,
  },
  artFrameMedium: {
    width: '65.5%',
    height: 240,
  },
  artFrameSmall: {
    flex: 1,
    height: 120,
    minWidth: '30%',
  },
  artFramePressed: {
    transform: [{ scale: 0.98 }],
  },
  artImage: {
    width: '100%',
    height: '100%',
  },
  artOverlay: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    borderRadius: BORDER_RADIUS.small,
  },
  artYear: {
    fontSize: 10,
    letterSpacing: 1.5,
    color: '#FFF',
  },
  sheetOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  sheetCard: {
    backgroundColor: COLORS.background.secondary,
    padding: SPACING.large,
    borderTopLeftRadius: BORDER_RADIUS.large * 3,
    borderTopRightRadius: BORDER_RADIUS.large * 3,
    borderWidth: LUX_BORDER_WIDTH,
    borderColor: LUX_BORDER_COLOR,
  },
  sheetTitle: {
    fontSize: 20,
    letterSpacing: 1,
    marginBottom: SPACING.medium,
    color: COLORS.text.primary,
  },
  sheetOption: {
    paddingVertical: SPACING.small,
  },
  sheetOptionText: {
    color: COLORS.text.primary,
    fontSize: 16,
  },
  sheetDangerText: {
    color: COLORS.accent.danger,
  },
  skeletonContainer: {
    paddingTop: SPACING.xxl,
    alignItems: 'center',
    gap: SPACING.medium,
  },
  skeletonCircle: {
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.1)',
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  skeletonLine: {
    width: '50%',
    height: 20,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  skeletonLineShort: {
    width: '30%',
    height: 10,
    backgroundColor: 'rgba(255,255,255,0.02)',
    marginTop: -8,
  },
  skeletonRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: SPACING.xl,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    paddingVertical: SPACING.medium,
  },
  skeletonBar: {
    width: '20%',
    height: 14,
    backgroundColor: 'rgba(255,255,255,0.02)',
    marginHorizontal: SPACING.medium,
  },
});

export default ProfileScreen;
