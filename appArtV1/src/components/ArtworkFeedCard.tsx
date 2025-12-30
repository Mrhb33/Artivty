import React from 'react';
import { View, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { Artwork } from '../types/api';
import { Body, Caption, Micro } from './Text';
import { COLORS, BORDER_RADIUS, SPACING } from '../theme';
import ProgressiveImage from './ProgressiveImage';
import { getArtworkImageSource } from '../utils/artworkImages';

interface ArtworkFeedCardProps {
  item: Artwork;
}

export const ArtworkFeedCard: React.FC<ArtworkFeedCardProps> = ({ item }) => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const feedSource = getArtworkImageSource(item, 'feed');
  const thumbSource = getArtworkImageSource(item, 'thumb');
  const displaySource = feedSource ?? thumbSource;
  const placeholderSource = thumbSource ?? displaySource;
  const artworkImageElement = displaySource ? (
    <ProgressiveImage
      source={displaySource}
      placeholderSource={placeholderSource}
      style={styles.artworkImage}
      blurRadius={15}
    />
  ) : (
    <View style={[styles.artworkImage, styles.artworkImagePlaceholder]} />
  );

  return (
    <View style={styles.artworkCard}>
      {/* 1) Header: Artist identity */}
      <View style={styles.cardHeader}>
        <TouchableOpacity 
          style={styles.artistInfo}
          onPress={() => navigation.navigate('ArtistProfile', { artistId: item.artist_id })}
          activeOpacity={0.7}
        >
          <Image
            source={{ uri: 'https://via.placeholder.com/32x32.png?text=👤' }}
            style={styles.artistAvatar}
          />
          <View style={styles.artistNameContainer}>
            <Caption weight="medium" color="primary" numberOfLines={1}>
              Artist Name
            </Caption>
          </View>
          {/* Optional verified badge could go here */}
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuButton} activeOpacity={0.7}>
          <Ionicons name="ellipsis-horizontal" size={20} color={COLORS.text.primary} />
        </TouchableOpacity>
      </View>

      {/* 2) Media: Artwork image */}
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => navigation.navigate('RequestDetails', { requestId: item.id })} // Assuming we go to details
      >
        {artworkImageElement}
      </TouchableOpacity>

      {/* 3) Meta + Actions */}
      <View style={styles.cardMeta}>
        {/* Actions row */}
        <View style={styles.actionRow}>
          <View style={styles.leftActions}>
            <TouchableOpacity style={styles.actionButton} activeOpacity={0.7}>
              <Ionicons name="heart-outline" size={24} color={COLORS.text.primary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} activeOpacity={0.7}>
              <Ionicons name="chatbubble-outline" size={24} color={COLORS.text.primary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} activeOpacity={0.7}>
              <Ionicons name="paper-plane-outline" size={24} color={COLORS.text.primary} />
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.bookmarkButton} activeOpacity={0.7}>
            <Ionicons name="bookmark-outline" size={24} color={COLORS.text.primary} />
          </TouchableOpacity>
        </View>

        {/* Artwork title */}
        <Body weight="medium" color="primary" style={styles.artworkTitle}>
          {item.title || 'Untitled'}
        </Body>

        {/* Caption snippet */}
        {item.style_tags && (
          <Caption color="secondary" style={styles.artworkCaption} numberOfLines={2}>
            {item.style_tags}
          </Caption>
        )}

        {/* View profile shortcut */}
        <TouchableOpacity
          onPress={() => navigation.navigate('ArtistProfile', { artistId: item.artist_id })}
          activeOpacity={0.7}
        >
          <Micro color="tertiary" style={styles.viewProfile}>
            View profile
          </Micro>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  artworkCard: {
    backgroundColor: COLORS.surface.primary,
    marginBottom: SPACING.large,
    borderRadius: BORDER_RADIUS.medium,
    overflow: 'hidden',
    // No shadow on the card itself if it's inside a white surface? 
    // Wait, the requirement says "Each artwork item must be a reusable 'Artwork Card'".
    // But it also says "Feed Surface Logic... Create ONE main surface container for the feed".
    // If the feed is inside a white surface, the cards shouldn't necessarily have their own background unless distinct.
    // However, usually inside a feed, cards are separated. 
    // Let's follow "Post Card must feel like Instagram". Instagram posts are just vertically stacked. 
    // But our container has padding. 
    // Let's stick to the container having the surface, and these being items inside.
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 0, // Header aligns with image? Or indented? "Header is calm and small". 
    // Instagram indents header.
    paddingLeft: 0, 
    paddingRight: 0,
    paddingVertical: SPACING.small,
  },
  artistInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  artistAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: SPACING.small,
    backgroundColor: COLORS.surface.secondary,
  },
  artistNameContainer: {
    flex: 1,
  },
  menuButton: {
    padding: SPACING.micro,
  },
  artworkImage: {
    width: '100%',
    aspectRatio: 4 / 5,
    resizeMode: 'cover',
    backgroundColor: COLORS.surface.secondary,
    borderRadius: BORDER_RADIUS.small,
  },
  artworkImagePlaceholder: {
    backgroundColor: COLORS.surface.secondary,
  },
  cardMeta: {
    paddingTop: SPACING.small,
    paddingBottom: SPACING.medium,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.small,
  },
  leftActions: {
    flexDirection: 'row',
    gap: SPACING.medium,
  },
  actionButton: {
    padding: SPACING.micro,
    marginLeft: -4, // Align first icon strictly with edge if needed, or keeping padding
  },
  bookmarkButton: {
    padding: SPACING.micro,
    marginRight: -4,
  },
  artworkTitle: {
    marginBottom: SPACING.micro,
  },
  artworkCaption: {
    marginBottom: SPACING.small,
  },
  viewProfile: {
    marginTop: SPACING.micro,
  },
});
