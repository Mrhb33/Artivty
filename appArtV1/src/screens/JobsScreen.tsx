import React from 'react';
import { View, FlatList, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { useAuthStore } from '../stores/authStore';
import { useMyRequests, useOpenRequests } from '../hooks/useRequests';
import { Request } from '../types/api';
import { AppShell, AppHeader, SkeletonCard, Title, Body, Caption } from '../components';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../contexts/LanguageContext';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS, COMPONENT_TOKENS } from '../theme';

const JobsScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user } = useAuthStore();
  const { t } = useLanguage();

  const isArtist = user?.role === 'artist';
  const { data: requests, isLoading, error, refetch } = isArtist
    ? useOpenRequests()
    : useMyRequests();

  const renderRequest = ({ item }: { item: Request }) => (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={() => navigation.navigate('RequestDetails', { requestId: item.id })}
      style={styles.card}
    >
      <View style={styles.cardHeader}>
        <View style={styles.titleContainer}>
          <Body weight="semibold" numberOfLines={1}>{item.title}</Body>
          <Caption color="secondary" numberOfLines={2} style={{ marginTop: 2 }}>{item.description}</Caption>
        </View>
        <View style={[styles.statusBadge, getStatusStyle(item.status)]}>
          <Caption weight="bold" style={[styles.statusText, getStatusTextStyle(item.status)]}>{item.status}</Caption>
        </View>
      </View>

      <View style={styles.cardFooter}>
        <View style={styles.metaRow}>
          {item.dimensions_width && (
            <View style={styles.metaItem}>
              <Ionicons name="resize" size={12} color={COLORS.text.tertiary} />
              <Caption color="secondary" style={{ marginLeft: 4 }}>{item.dimensions_width}×{item.dimensions_height}</Caption>
            </View>
          )}
          <View style={styles.metaItem}>
            <Ionicons name="chatbubbles-outline" size={12} color={COLORS.text.tertiary} />
            <Caption color="secondary" style={{ marginLeft: 4 }}>{item.offers_count} offers</Caption>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={16} color={COLORS.border.medium} />
      </View>
    </TouchableOpacity>
  );

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'open': return { backgroundColor: 'rgba(47, 125, 90, 0.1)' };
      case 'selected': return { backgroundColor: 'rgba(30, 42, 68, 0.1)' };
      default: return { backgroundColor: COLORS.surface.secondary };
    }
  }

  const getStatusTextStyle = (status: string) => {
    switch (status) {
      case 'open': return { color: COLORS.accent.success };
      case 'selected': return { color: COLORS.accent.primary };
      default: return { color: COLORS.text.secondary };
    }
  }

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <View style={styles.emptyIconCircle}>
        <Ionicons name="document-text-outline" size={32} color={COLORS.text.tertiary} />
      </View>
      <Title align="center" style={{ marginTop: SPACING.medium, marginBottom: SPACING.small }}>
        {isArtist ? 'No Active Jobs' : 'No Requests'}
      </Title>
      <Body color="secondary" align="center" style={{ paddingHorizontal: SPACING.xl }}>
        {isArtist
          ? 'New opportunities will appear here.'
          : 'Create your first request to commission artwork.'}
      </Body>
    </View>
  );

  return (
    <AppShell noPadding>
      <AppHeader title={isArtist ? 'Jobs Board' : 'My Collection'} />

      <View style={styles.container}>

        {isLoading ? (
          <View style={{ paddingHorizontal: SPACING.medium }}>
            {[1, 2, 3].map(i => <SkeletonCard key={i} style={{ marginBottom: 16, height: 100 }} />)}
          </View>
        ) : (
            <FlatList
              data={requests ?? []}
            renderItem={renderRequest}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={renderEmptyState}
            showsVerticalScrollIndicator={false}
            refreshing={isLoading}
            onRefresh={refetch}
          />
        )}
      </View>
    </AppShell>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background.primary,
  },
  listContent: {
    paddingHorizontal: SPACING.medium,
    paddingBottom: SPACING.xl,
  },
  card: {
    backgroundColor: COLORS.surface.primary,
    borderRadius: BORDER_RADIUS.medium,
    padding: SPACING.medium,
    marginBottom: SPACING.medium,
    ...SHADOWS.subtle,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.medium,
  },
  titleContainer: {
    flex: 1,
    marginRight: SPACING.small,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.full,
  },
  statusText: {
    textTransform: 'uppercase',
    fontSize: 10,
    letterSpacing: 0.5,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: COLORS.border.light,
    paddingTop: SPACING.small,
  },
  metaRow: {
    flexDirection: 'row',
    gap: SPACING.medium,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  emptyState: {
    backgroundColor: COLORS.surface.primary,
    margin: SPACING.medium,
    borderRadius: BORDER_RADIUS.medium,
    padding: SPACING.large,
    alignItems: 'center',
    ...SHADOWS.subtle,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.surface.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  }
});

export default JobsScreen;
