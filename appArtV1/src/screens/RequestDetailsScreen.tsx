import React, { useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, FlatList, Alert, StyleSheet } from 'react-native';
import { RouteProp, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { useRequestDetails, useSelectArtist } from '../hooks/useRequests';
import { useRequestOffers } from '../hooks/useOffers';
import { useAuthStore } from '../stores/authStore';
import { OfferWithArtist } from '../types/api';
import { AppShell, AppHeader, PrimaryButton, SecondaryButton, SkeletonCard, Title, Body, Caption, Micro } from '../components';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../contexts/LanguageContext';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS, COMPONENT_TOKENS } from '../theme';

type RequestDetailsScreenRouteProp = RouteProp<RootStackParamList, 'RequestDetails'>;

interface Props {
  route: RequestDetailsScreenRouteProp;
}

const RequestDetailsScreen: React.FC<Props> = ({ route }) => {
  const { requestId } = route.params;
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user } = useAuthStore();
  const { t } = useLanguage();

  const { data: request, isLoading: requestLoading } = useRequestDetails(requestId);
  const { data: offers, isLoading: offersLoading } = useRequestOffers(requestId);
  const selectArtistMutation = useSelectArtist();

  const formattedDeadline = useMemo(() => {
    return request?.deadline ? new Date(request.deadline).toLocaleDateString() : null;
  }, [request?.deadline]);

  const handleSelectArtist = (offerId: number) => {
    Alert.alert(
      'Select Artist',
      'Confirming will start the project with this artist.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: () => {
            // Mutation logic
          }
        }
      ]
    );
  };

  const renderOffer = ({ item }: { item: OfferWithArtist }) => {
    const formattedDate = useMemo(() => new Date(item.created_at).toLocaleDateString(), [item.created_at]);

    return (
      <View style={styles.offerCard}>
        <View style={styles.offerHeader}>
          <Image
            source={typeof item.artist_profile_picture === 'string' ? { uri: item.artist_profile_picture } : (item.artist_profile_picture || { uri: 'https://via.placeholder.com/40x40.png?text=👤' })}
            style={styles.offerAvatar}
          />
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Body weight="semibold">{item.artist_name}</Body>
              {item.artist_profile_picture && <Ionicons name="checkmark-circle" size={14} color={COLORS.accent.success} style={{ marginLeft: 4 }} />}
            </View>
            <Caption color="secondary">@{item.artist_username}</Caption>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Title style={{ fontSize: 18 }}>${item.price}</Title>
            <Caption color="tertiary">{item.delivery_days} days</Caption>
          </View>
        </View>

        {item.message && (
          <View style={styles.quoteBox}>
            <Caption style={{ fontStyle: 'italic', color: COLORS.text.secondary }}>"{item.message}"</Caption>
          </View>
        )}

        <View style={styles.offerActions}>
          {request?.status === 'open' && (
            <View style={{ flexDirection: 'row', gap: SPACING.medium }}>
              <View style={{ flex: 1 }}><SecondaryButton title="View Profile" onPress={() => navigation.navigate('ArtistProfile', { artistId: item.artist_id })} size="sm" fullWidth /></View>
              <View style={{ flex: 1 }}><PrimaryButton title="Accept Offer" onPress={() => handleSelectArtist(item.id)} size="sm" fullWidth /></View>
            </View>
          )}
          {request?.status !== 'open' && (
            <View style={[styles.statusBadge, { alignSelf: 'flex-start', marginTop: SPACING.small }, item.status === 'accepted' ? styles.statusAccepted : styles.statusDefault]}>
              <Caption style={item.status === 'accepted' ? { color: COLORS.accent.success } : { color: COLORS.text.secondary }}>{item.status}</Caption>
            </View>
          )}
        </View>
      </View>
    );
  };

  if (requestLoading) {
    return <AppShell><View style={styles.loadingContainer}><SkeletonCard style={{ height: 200 }} /></View></AppShell>;
  }

  if (!request) {
    return <AppShell><View style={styles.loadingContainer}><Body color="danger">Request not found</Body></View></AppShell>;
  }

  const isCustomer = user?.role === 'customer' && user.id === request.customer_id;

  return (
    <AppShell noPadding>
      <AppHeader
        title={request.title}
        showBack
        onBackPress={() => navigation.goBack()}
      />

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

        {/* Hero Details on Paper */}
        <View style={styles.heroSection}>
          <View style={styles.tagsRow}>
            {request.style && <View style={styles.heroTag}><Caption>{request.style}</Caption></View>}
            {formattedDeadline && <View style={styles.heroTag}><Caption>Due {formattedDeadline}</Caption></View>}
            <View style={[styles.heroTag, { backgroundColor: COLORS.surface.primary }]}><Caption style={{ color: COLORS.accent.primary }}>{request.status}</Caption></View>
          </View>

          <Title style={styles.heroTitle}>{request.title}</Title>
          <Body color="secondary" style={styles.heroDesc}>{request.description}</Body>

          {/* Specs */}
          <View style={styles.specsRow}>
            {request.dimensions_width && (
              <View style={styles.specItem}>
                <Ionicons name="resize" size={16} color={COLORS.text.secondary} />
                <Caption style={{ marginLeft: 6 }}>{request.dimensions_width} × {request.dimensions_height} {request.dimensions_unit}</Caption>
              </View>
            )}
          </View>
        </View>

        {/* Reference Images Surface */}
        {request.reference_images.length > 0 && (
          <View style={styles.surfaceSection}>
            <Text style={styles.sectionHeader}>References</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.refScroll}>
              {request.reference_images.map((img, i) => (
                <Image key={i} source={typeof img === 'string' ? { uri: img } : img} style={styles.refImage} />
              ))}
            </ScrollView>
          </View>
        )}

        {/* Offers Surface (Customer Only) */}
        {isCustomer && (
          <View style={[styles.surfaceSection, { minHeight: 400 }]}>
            <View style={styles.offersHeaderRow}>
              <Text style={styles.sectionHeader}>Offers ({offers?.length || 0})</Text>
            </View>

            {offersLoading ? (
              <SkeletonCard style={{ height: 100 }} />
            ) : offers && offers.length > 0 ? (
              <View style={{ gap: SPACING.medium }}>
                {offers.map(offer => (
                  <View key={offer.id}>{renderOffer({ item: offer })}</View>
                ))}
              </View>
            ) : (
              <View style={styles.emptyOffers}>
                <Ionicons name="chatbubbles-outline" size={48} color={COLORS.text.tertiary} />
                <Body color="secondary" style={{ marginTop: SPACING.medium }}>No offers yet</Body>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </AppShell>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background.primary,
  },
  loadingContainer: {
    flex: 1,
    padding: SPACING.medium,
    justifyContent: 'center',
  },

  heroSection: {
    paddingHorizontal: SPACING.large,
    paddingTop: SPACING.small,
    paddingBottom: SPACING.large,
  },
  tagsRow: {
    flexDirection: 'row',
    gap: SPACING.small,
    marginBottom: SPACING.medium,
  },
  heroTag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.border.light,
    backgroundColor: COLORS.surface.secondary,
  },
  heroTitle: {
    fontSize: 28,
    lineHeight: 34,
    marginBottom: SPACING.medium,
  },
  heroDesc: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: SPACING.large,
  },
  specsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.large,
  },
  specItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.5)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: BORDER_RADIUS.medium,
  },

  // Surfaces
  surfaceSection: {
    backgroundColor: COLORS.surface.primary,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingVertical: SPACING.large,
    paddingHorizontal: SPACING.medium,
    marginBottom: SPACING.small,
    ...SHADOWS.subtle,
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: SPACING.medium,
    marginLeft: SPACING.small,
  },
  refScroll: {
    gap: SPACING.medium,
    paddingRight: SPACING.medium,
  },
  refImage: {
    width: 120,
    height: 120,
    borderRadius: BORDER_RADIUS.medium,
    backgroundColor: COLORS.surface.secondary,
  },

  // Offers
  offersHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.medium,
  },
  offerCard: {
    backgroundColor: COLORS.surface.primary,
    borderWidth: 1,
    borderColor: COLORS.border.light,
    borderRadius: BORDER_RADIUS.medium,
    padding: SPACING.medium,
  },
  offerHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.medium,
    marginBottom: SPACING.medium,
  },
  offerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surface.secondary,
  },
  quoteBox: {
    backgroundColor: COLORS.surface.secondary,
    padding: SPACING.medium,
    borderRadius: BORDER_RADIUS.small,
    marginBottom: SPACING.medium,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.border.medium,
  },
  offerActions: {
    marginTop: SPACING.small,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  statusAccepted: {
    backgroundColor: 'rgba(47, 125, 90, 0.1)',
  },
  statusDefault: {
    backgroundColor: COLORS.surface.secondary,
    borderColor: COLORS.border.light,
  },
  emptyOffers: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
  }
});

export default RequestDetailsScreen;