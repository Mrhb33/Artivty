import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, StyleSheet, RefreshControl, TouchableOpacity, TextInput, ScrollView, FlatList, Modal, Alert, KeyboardAvoidingView, SafeAreaView, Keyboard, Platform, TouchableWithoutFeedback, Animated } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import { AppHeader, AppShell, Body, BodySmall, Caption, PrimaryButton, SkeletonCard, Title } from '../components';
import { useOpenRequests } from '../hooks/useRequests';
import { useMyOffers, useCreateOffer } from '../hooks/useOffers';
import { useAuthStore } from '../stores/authStore';
import { COLORS, SPACING, BORDER_RADIUS } from '../theme';

import { Request, OfferWithArtist } from '../types/api';
import { RootStackParamList } from '../types/navigation';

const USE_MOCK = __DEV__;
const nowIso = () => new Date().toISOString();

/** Mock data (only used if API returns empty in dev) */
const MOCK_NEW_ORDERS: Request[] = [
  {
    id: 201,
    customer_id: 2,
    title: 'Modern Portrait Commission',
    category: 'Portrait',
    medium: 'Digital',
    description: 'Contemporary portrait with clean lines and sophisticated color palette.',
    dimensions_width: 30,
    dimensions_height: 40,
    dimensions_unit: 'cm',
    style: 'Modern Minimalist',
    deadline: '21 days',
    budget_min: 500,
    budget_max: 1000,
    usage_rights: 'personal',
    delivery_format: 'digital',
    status: 'open',
    created_at: nowIso(),
    updated_at: nowIso(),
    offers_count: 0,
    reference_images: [],
  },
  {
    id: 202,
    customer_id: 3,
    title: 'Abstract Landscape Series',
    category: 'Landscape',
    medium: 'Oil',
    description: 'Bold expressive landscapes. Focus on emotion over realism. Large scale.',
    style: 'Abstract Expressionism',
    deadline: '30 days',
    budget_min: 1200,
    budget_max: 2500,
    usage_rights: 'commercial',
    delivery_format: 'physical',
    status: 'open',
    created_at: nowIso(),
    updated_at: nowIso(),
    offers_count: 0,
    reference_images: [],
  },
];

const MOCK_ACCEPTED_AND_HISTORY: OfferWithArtist[] = [
  {
    id: 301,
    request_id: 201,
    artist_id: 1,
    price: 750,
    delivery_days: 18,
    message: 'I can deliver a clean minimalist portrait with strong character.',
    revisions_included: 2,
    delivery_format: 'digital',
    expiry_at: undefined,
    status: 'accepted',
    created_at: nowIso(),
    artist_name: 'Alex Rivera',
    artist_username: 'alexrivera',
    artist_profile_picture: undefined,
    artist_rating: 4.9,
    artist_completion_rate: 98,
  },
];

/** Tabs = exactly like your picture */
type ArtistTab = 'new' | 'accepted' | 'history';

const TAB_LABEL: Record<ArtistTab, string> = {
  new: 'New Orders',
  accepted: 'Accepted',
  history: 'History',
};

const tabOrder: ArtistTab[] = ['new', 'accepted', 'history'];

/** ---------- Small UI pieces ---------- */


function SegmentedTabs({
  value,
  onChange,
  counts,
}: {
  value: ArtistTab;
  onChange: (t: ArtistTab) => void;
  counts: Record<ArtistTab, number>;
}) {
  return (
    <View style={styles.tabsContainer}>
      <View style={styles.tabsInner}>
        {tabOrder.map((t) => {
          const active = value === t;
          return (
            <TouchableOpacity
              key={t}
              onPress={() => onChange(t)}
              activeOpacity={0.8}
              style={[styles.tabItem, active && styles.tabItemActive]}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Caption
                  style={[
                    styles.tabItemText,
                    active && styles.tabItemTextActive,
                  ]}
                  numberOfLines={1}
                >
                  {TAB_LABEL[t]}
                </Caption>
                {counts[t] > 0 && (
                  <View style={[styles.badge, active && styles.badgeActive]}>
                    <Caption style={[styles.badgeText, active && styles.badgeTextActive]}>
                      {counts[t]}
                    </Caption>
                  </View>
                )}
              </View>

              {/* Active Indicator Line */}
              {active && <View style={styles.activeIndicator} />}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

function EmptyState({ tab }: { tab: ArtistTab }) {
  const meta =
    tab === 'new'
      ? { icon: 'mail-unread-outline' as const, title: 'No New Orders', sub: 'New client requests will appear here.' }
      : tab === 'accepted'
        ? { icon: 'time-outline' as const, title: 'No Active Work', sub: 'Commissions in progress will be tracked here.' }
        : { icon: 'archive-outline' as const, title: 'No History', sub: 'Completed and past orders will show here.' };

  return (
    <View style={styles.emptyWrap}>
      <View style={styles.emptyIconCircle}>
        <Ionicons name={meta.icon} size={24} color={COLORS.accent.primary} />
      </View>
      <Title style={styles.emptyTitle}>{meta.title}</Title>
      <Body style={styles.emptySub}>{meta.sub}</Body>
    </View>
  );
}

/** ---------- Cards ---------- */

function OrderCard({ request, onPress }: { request: Request; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.9}>
      <View style={styles.cardRow}>
        <View style={styles.thumb}>
          <Ionicons name="image-outline" size={20} color={COLORS.text.tertiary} />
        </View>

        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
            <Title style={styles.cardTitle} numberOfLines={1}>
              {request.title}
            </Title>
            <View style={styles.statusPill}>
              <Caption style={styles.statusPillText}>OPEN</Caption>
            </View>
          </View>

          <Caption style={styles.cardMeta} numberOfLines={1}>
            {request.medium || 'Custom'} • {request.budget_min}-{request.budget_max} • {request.deadline}
          </Caption>
          <BodySmall style={styles.cardDesc} numberOfLines={2}>
            {request.description}
          </BodySmall>
        </View>
      </View>
    </TouchableOpacity>
  );
}

function OfferCard({ offer, onPress }: { offer: OfferWithArtist; onPress: () => void }) {
  const statusLabel = offer.status === 'accepted' ? 'Accepted' : offer.status;

  // Color-code status
  const isAccepted = offer.status === 'accepted';
  const statusAny = offer.status as string;
  const isDelivered = statusAny === 'delivered' || statusAny === 'completed';
  const statusColor = isAccepted ? COLORS.accent.primary : isDelivered ? '#4CAF50' : COLORS.text.tertiary;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.9}>
      <View style={styles.cardRow}>
        <View style={styles.thumb}>
          <Ionicons name="document-text-outline" size={20} color={COLORS.text.tertiary} />
        </View>

        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
            <Title style={styles.cardTitle} numberOfLines={1}>
              Order #{offer.request_id}
            </Title>
            <Caption style={[styles.statusText, { color: statusColor }]}>{statusLabel}</Caption>
          </View>

          <Caption style={styles.cardMeta} numberOfLines={1}>
            ${offer.price} • {offer.delivery_days} days
          </Caption>
          {!!offer.message && (
            <BodySmall style={styles.cardDesc} numberOfLines={2}>
              {offer.message}
            </BodySmall>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

/** ---------- Modal (Send Offer) ---------- */

function SendOfferModal({
  visible,
  onClose,
  request,
}: {
  visible: boolean;
  onClose: () => void;
  request: Request;
}) {
  const createOfferMutation = useCreateOffer(request.id);

  const [offerData, setOfferData] = useState({
    price: '',
    delivery_days: '',
    message: '',
    revisions_included: 2,
    delivery_format: 'digital' as 'digital' | 'physical' | 'both',
  });

  // Keyboard visibility and footer animation
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const footerAnimation = useRef(new Animated.Value(1)).current;

  // Keyboard event listeners
  useEffect(() => {
    const keyboardWillShowListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => {
        setIsKeyboardVisible(true);
        // No animation needed when hiding - footer is not rendered
      }
    );

    const keyboardWillHideListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        setIsKeyboardVisible(false);
        // Start slide-up animation when keyboard hides
        Animated.timing(footerAnimation, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true, // Smooth 60fps animation
        }).start();
      }
    );

    return () => {
      keyboardWillShowListener?.remove();
      keyboardWillHideListener?.remove();
    };
  }, [footerAnimation]);

  const canSubmit = !!offerData.price && !!offerData.delivery_days && !createOfferMutation.isPending;

  const handlePriceChange = useCallback((value: string) => {
    setOfferData(prev => ({ ...prev, price: value }));
  }, []);

  const handleDeliveryDaysChange = useCallback((value: string) => {
    setOfferData(prev => ({ ...prev, delivery_days: value }));
  }, []);

  const handleMessageChange = useCallback((value: string) => {
    setOfferData(prev => ({ ...prev, message: value }));
  }, []);

  const handleSubmit = async () => {
    if (!offerData.price || !offerData.delivery_days) {
      Alert.alert('Missing Info', 'Please add a price and delivery timeline.');
      return;
    }

    try {
      await createOfferMutation.mutateAsync({
        price: parseFloat(offerData.price),
        delivery_days: parseInt(offerData.delivery_days, 10),
        message: offerData.message,
        revisions_included: offerData.revisions_included,
        delivery_format: offerData.delivery_format,
      });

      Alert.alert('Proposal Sent', 'Your proposal has been sent — the client will be notified.');
      onClose();
    } catch {
      Alert.alert('Error', 'Failed to send proposal. Please try again.');
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 40 : 0}
      >
        <SafeAreaView style={{ flex: 1 }}>
          <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
            <View style={styles.modalOverlay}>
              <TouchableWithoutFeedback>
                <View style={styles.modalSheet}>
                  <View style={styles.modalHeader}>
                    <View style={{ flex: 1 }}>
                      <Caption style={styles.modalOverline}>SEND PROPOSAL</Caption>
                      <Title style={styles.modalTitle} numberOfLines={1}>
                        {request.title}
                      </Title>
                      <Caption style={styles.modalMeta} numberOfLines={1}>
                        {request.medium || 'Custom'} • {request.budget_min}-{request.budget_max} • {request.deadline}
                      </Caption>
                    </View>

                    <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.8}>
                      <Ionicons name="close" size={20} color={COLORS.text.primary} />
                    </TouchableOpacity>
                  </View>

                  <ScrollView
                    style={{ flex: 1 }}
                    contentContainerStyle={{ paddingBottom: 24 }}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                  >
                    <View style={styles.formSection}>
                      <View style={styles.formRow}>
                        <View style={{ flex: 1 }}>
                          <Caption style={styles.formLabel}>PRICE ($)</Caption>
                          <TextInput
                            style={styles.formInput}
                            placeholder="e.g. 750"
                            placeholderTextColor={COLORS.text.tertiary}
                            keyboardType="numeric"
                            value={offerData.price}
                            onChangeText={handlePriceChange}
                          />
                        </View>

                        <View style={{ width: SPACING.medium }} />

                        <View style={{ flex: 1 }}>
                          <Caption style={styles.formLabel}>DELIVERY (DAYS)</Caption>
                          <TextInput
                            style={styles.formInput}
                            placeholder="e.g. 14"
                            placeholderTextColor={COLORS.text.tertiary}
                            keyboardType="numeric"
                            value={offerData.delivery_days}
                            onChangeText={handleDeliveryDaysChange}
                          />
                        </View>
                      </View>

                      <View style={{ marginTop: SPACING.large }}>
                        <Caption style={styles.formLabel}>MESSAGE</Caption>
                        <TextInput
                          style={styles.formTextarea}
                          placeholder="Write your proposal message..."
                          placeholderTextColor={COLORS.text.tertiary}
                          multiline
                          numberOfLines={5}
                          textAlignVertical="top"
                          value={offerData.message}
                          onChangeText={handleMessageChange}
                        />
                      </View>
                    </View>
                  </ScrollView>

                  {isKeyboardVisible ? null : (
                    <Animated.View
                      style={[
                        styles.modalFooter,
                        {
                          transform: [{
                            translateY: footerAnimation.interpolate({
                              inputRange: [0, 1],
                              outputRange: [50, 0], // Small slide-up from below
                            }),
                          }],
                          opacity: footerAnimation,
                        },
                      ]}
                    >
                    <PrimaryButton
                      title="Send Proposal"
                      onPress={handleSubmit}
                      fullWidth
                      loading={createOfferMutation.isPending}
                      disabled={!canSubmit}
                    />
                      <Caption style={styles.footerHint}>You can edit this proposal later from your Active tab.</Caption>
                    </Animated.View>
                  )}
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

/** ---------- Main screen ---------- */

export default function ActivityArtistPage() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user } = useAuthStore();

  // If user is not artist → redirect to user activity page
  useEffect(() => {
    if (user?.role && user.role !== 'artist') {
      navigation.replace('ActivityUser' as any);
    }
  }, [user?.role, navigation]);

  const [tab, setTab] = useState<ArtistTab>('new');

  // Data
  const { data: openRequests, isLoading: loadingOpen, isFetching: fetchingOpen, refetch: refetchOpen } = useOpenRequests(true);
  const { data: myOffers, isLoading: loadingOffers, isFetching: fetchingOffers, refetch: refetchOffers } = useMyOffers(true);

  const displayedOpen = (USE_MOCK && (!openRequests || (Array.isArray(openRequests) && openRequests.length === 0))) ? MOCK_NEW_ORDERS : (Array.isArray(openRequests) ? openRequests : []) as Request[];
  const displayedOffers = (USE_MOCK && (!myOffers || (Array.isArray(myOffers) && myOffers.length === 0))) ? MOCK_ACCEPTED_AND_HISTORY : (Array.isArray(myOffers) ? myOffers : []) as OfferWithArtist[];

  // Tab filters (the whole “logic”)
  const newOrders = useMemo(() => displayedOpen, [displayedOpen]);

  const acceptedOrders = useMemo(
    () => displayedOffers.filter((o) => ['accepted', 'in_progress'].includes(o.status as any)),
    [displayedOffers]
  );

  const historyOrders = useMemo(
    () => displayedOffers.filter((o) => ['completed', 'delivered', 'cancelled', 'rejected'].includes(o.status as any)),
    [displayedOffers]
  );

  const counts = useMemo(
    () => ({
      new: newOrders.length,
      accepted: acceptedOrders.length,
      history: historyOrders.length,
    }),
    [newOrders.length, acceptedOrders.length, historyOrders.length]
  );

  const listData = useMemo(() => {
    if (tab === 'new') return newOrders;
    if (tab === 'accepted') return acceptedOrders;
    return historyOrders;
  }, [tab, newOrders, acceptedOrders, historyOrders]);

  // Refresh
  const isLoading = loadingOpen || loadingOffers;
  const isFetching = fetchingOpen || fetchingOffers;

  // Show skeletons only on first load, not during refetch
  const showSkeletons = isLoading && listData.length === 0;

  const onRefresh = useCallback(async () => {
    await Promise.all([refetchOpen(), refetchOffers()]);
  }, [refetchOpen, refetchOffers]);

  // Avoid refetch spam while modal open
  const modalOpenCountRef = useRef(0);
  const [modalOpen, setModalOpen] = useState(false);
  const bumpModal = useCallback((open: boolean) => {
    if (open) modalOpenCountRef.current += 1;
    else modalOpenCountRef.current = Math.max(0, modalOpenCountRef.current - 1);
    setModalOpen(modalOpenCountRef.current > 0);
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (!modalOpen) {
        refetchOpen();
        refetchOffers();
      }
    }, [modalOpen, refetchOpen, refetchOffers])
  );

  // Modal state
  const [sendOfferOpen, setSendOfferOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);

  const openOfferModal = useCallback((r: Request) => {
    setSelectedRequest(r);
    setSendOfferOpen(true);
    bumpModal(true);
  }, [bumpModal]);

  const closeOfferModal = useCallback(() => {
    setSendOfferOpen(false);
    setSelectedRequest(null);
    bumpModal(false);
  }, [bumpModal]);

  return (
    <AppShell noPadding>
      <AppHeader title="Activity" />

      <View style={styles.page}>
        <View style={styles.headerContainer}>
          <Title style={styles.pageTitle}>Artist Dashboard</Title>
          <BodySmall style={styles.pageSub}>Manage your commissions and proposals.</BodySmall>

          <View style={{ height: SPACING.medium }} />
          <SegmentedTabs value={tab} onChange={setTab} counts={counts} />
        </View>

        {/* List */}
        <FlatList
          data={listData}
          keyExtractor={(item: any) => String(item.id)}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isFetching}
              onRefresh={onRefresh}
              tintColor={COLORS.accent.primary}
              colors={[COLORS.accent.primary]}
              progressBackgroundColor={COLORS.background.secondary}
            />
          }
          ListEmptyComponent={isLoading ? null : <EmptyState tab={tab} />}
          ListHeaderComponent={
            showSkeletons ? (
              <View style={{ paddingTop: SPACING.small }}>
                {[1, 2, 3].map((i) => (
                  <SkeletonCard key={i} style={{ marginBottom: 12, height: 110, borderRadius: BORDER_RADIUS.medium }} />
                ))}
              </View>
            ) : isFetching && listData.length > 0 ? (
              <View style={styles.refreshingIndicator}>
                <Caption style={styles.refreshingText}>Refreshing...</Caption>
              </View>
            ) : (
              <View style={{ height: SPACING.small }} />
            )
          }
          renderItem={({ item }) => {
            if (tab === 'new') {
              const r = item as Request;
              return <OrderCard request={r} onPress={() => openOfferModal(r)} />;
            }

            const offer = item as OfferWithArtist;
            return (
              <OfferCard
                offer={offer}
                onPress={() => Alert.alert('Order Details', `Order #${offer.request_id}\nCurrent Status: ${offer.status}`)}
              />
            );
          }}
        />
      </View>

      {selectedRequest && (
        <SendOfferModal
          visible={sendOfferOpen}
          onClose={closeOfferModal}
          request={selectedRequest}
        />
      )}
    </AppShell>
  );
}

/** ---------- Styles ---------- */

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: COLORS.background.primary,
  },

  headerContainer: {
    paddingTop: SPACING.medium,
    paddingHorizontal: SPACING.large,
    paddingBottom: SPACING.medium,
    backgroundColor: COLORS.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },

  pageTitle: {
    fontSize: 22,
    fontWeight: '300',
    color: COLORS.text.primary,
    letterSpacing: -0.5,
  },

  pageSub: {
    marginTop: 4,
    color: COLORS.text.tertiary,
    fontSize: 13,
  },

  // Redesigned Segmented Tabs
  tabsContainer: {
    paddingBottom: 4,
  },

  tabsInner: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },

  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    position: 'relative',
  },

  tabItemActive: {
    // No background change, just the indicator
  },

  tabItemText: {
    fontSize: 11,
    color: COLORS.text.tertiary,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    fontWeight: '600',
  },

  tabItemTextActive: {
    color: COLORS.accent.primary,
  },

  activeIndicator: {
    position: 'absolute',
    bottom: -1, // Overlap the border
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: COLORS.accent.primary,
  },

  badge: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 999,
    paddingHorizontal: 5,
    paddingVertical: 1,
    minWidth: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },

  badgeActive: {
    backgroundColor: COLORS.accent.primary,
  },

  badgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: COLORS.text.secondary,
  },

  badgeTextActive: {
    color: COLORS.background.primary, // Dark text on gold badge
  },

  listContent: {
    paddingHorizontal: SPACING.large,
    paddingBottom: 100,
  },

  // Cards
  card: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: BORDER_RADIUS.medium,
    padding: SPACING.medium,
    marginBottom: SPACING.medium,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },

  cardRow: {
    flexDirection: 'row',
    gap: SPACING.medium,
  },

  thumb: {
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.small,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  cardTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text.primary,
    letterSpacing: 0.2,
    flex: 1,
  },

  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.2)',
  },

  statusPillText: {
    fontSize: 9,
    fontWeight: '700',
    color: COLORS.accent.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  statusText: {
    fontSize: 11,
    fontWeight: '500',
    textTransform: 'capitalize',
  },

  cardMeta: {
    fontSize: 12,
    color: COLORS.text.tertiary,
    marginBottom: 6,
    marginTop: 2,
  },

  cardDesc: {
    fontSize: 13,
    color: COLORS.text.secondary,
    lineHeight: 18,
  },

  // Empty State
  emptyWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    opacity: 0.8,
  },

  emptyIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.03)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },

  emptyTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.text.primary,
    marginBottom: 6,
    letterSpacing: 0.5,
  },

  emptySub: {
    textAlign: 'center',
    color: COLORS.text.tertiary,
    fontSize: 13,
    maxWidth: 240,
    lineHeight: 20,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'flex-end',
  },

  modalSheet: {
    height: '85%',
    backgroundColor: COLORS.background.secondary,
    borderTopLeftRadius: BORDER_RADIUS.large,
    borderTopRightRadius: BORDER_RADIUS.large,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    paddingTop: SPACING.large,
    paddingHorizontal: SPACING.large,
  },

  modalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.medium,
    marginBottom: SPACING.large,
    paddingBottom: SPACING.medium,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },

  modalOverline: {
    color: COLORS.accent.primary,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginBottom: 6,
    textTransform: 'uppercase',
  },

  modalTitle: {
    fontSize: 20,
    color: COLORS.text.primary,
    fontWeight: '400',
    letterSpacing: -0.2,
  },

  modalMeta: {
    marginTop: 4,
    color: COLORS.text.tertiary,
    fontSize: 13,
  },

  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  formSection: {
    // paddingHorizontal: SPACING.small,
  },

  formRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  formLabel: {
    color: COLORS.text.secondary,
    fontSize: 10,
    fontWeight: '700',
    marginBottom: 8,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },

  formInput: {
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: BORDER_RADIUS.small,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: COLORS.text.primary,
    fontSize: 15,
  },

  formTextarea: {
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: BORDER_RADIUS.small,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: COLORS.text.primary,
    fontSize: 15,
    minHeight: 140,
  },

  modalFooter: {
    paddingBottom: SPACING.large + 20,
    paddingTop: SPACING.medium,
  },

  footerHint: {
    marginTop: SPACING.medium,
    textAlign: 'center',
    color: COLORS.text.tertiary,
    fontSize: 11,
  },

  refreshingIndicator: {
    paddingTop: SPACING.small,
    paddingBottom: SPACING.small,
    alignItems: 'center',
  },

  refreshingText: {
    color: COLORS.accent.primary,
    fontSize: 12,
    textAlign: 'center',
  },
});
