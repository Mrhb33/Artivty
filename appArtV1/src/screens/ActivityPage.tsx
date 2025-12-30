import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, ScrollView, StyleSheet, RefreshControl, TouchableOpacity, Modal, Pressable, Image, Alert, ScrollView as ScrollViewRN, TextInput, FlatList } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Title, Body, Caption, SkeletonCard, PrimaryButton, BodySmall, AppShell, AppHeader, Stepper, Step } from '../components';
import { useMyRequests, useCreateRequest, useOpenRequests } from '../hooks/useRequests';
import { useRequestOffers, useCreateOffer, useMyOffers } from '../hooks/useOffers';
import { useSelectArtist } from '../hooks/useRequests';
import { COLORS, SPACING, SHADOWS, BORDER_RADIUS } from '../theme';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Request, RequestStatus, OfferWithArtist, CreateRequestData } from '../types/api';
import { useAuthStore } from '../stores/authStore';
import Animated, { FadeInDown, FadeInUp, Layout, ZoomIn } from 'react-native-reanimated';

const USE_MOCK = __DEV__;

const nowIso = () => new Date().toISOString();

const MOCK_MY_REQUESTS: Request[] = [
    {
        id: 101,
        customer_id: 1,
        title: 'Minimalist Portrait Study',
        category: 'Portrait',
        medium: 'Digital',
        description: 'A refined, high-contrast portrait with sophisticated tonal balance. Emphasize clean edges, soft atmospheric shadows, and subtle gold highlights for museum-quality finish.',
        dimensions_width: 50,
        dimensions_height: 70,
        dimensions_unit: 'cm',
        style: 'Contemporary Minimal',
        deadline: '14 days',
        budget_min: 400,
        budget_max: 800,
        usage_rights: 'personal',
        delivery_format: 'digital',
        status: 'open',
        created_at: nowIso(),
        updated_at: nowIso(),
        offers_count: 5,
        reference_images: [],
    },
    {
        id: 102,
        customer_id: 1,
        title: 'Commissioned Pet Portrait',
        category: 'Pet',
        medium: 'Digital',
        description: 'Gallery-quality pet portrait with careful attention to character and form. Soft natural lighting, rich color palette, and archival-ready composition.',
        style: 'Classical Realism',
        deadline: '10 days',
        budget_min: 300,
        budget_max: 600,
        usage_rights: 'personal',
        delivery_format: 'digital',
        status: 'in_progress',
        created_at: nowIso(),
        updated_at: nowIso(),
        offers_count: 3,
        reference_images: [],
    },
];

const MOCK_OPEN_REQUESTS: Request[] = [
    {
        id: 201,
        customer_id: 77,
        title: 'Music Album Cover Design',
        category: 'Abstract',
        medium: 'Digital',
        description: 'Premium album artwork with sophisticated abstract composition. Refined geometric elements in gold against deep charcoal, with space for professional typography integration.',
        style: 'Contemporary Abstract',
        deadline: '7 days',
        budget_min: 600,
        budget_max: 1500,
        usage_rights: 'commercial',
        delivery_format: 'digital',
        status: 'open',
        created_at: nowIso(),
        updated_at: nowIso(),
        offers_count: 12,
        reference_images: [],
    },
    {
        id: 202,
        customer_id: 88,
        title: 'Character Design Concept',
        category: 'Character',
        medium: 'Digital',
        description: 'Original character concept art with elegant restraint. Clear silhouette definition, sophisticated color palette, and professional illustration standards.',
        style: 'Contemporary Illustration',
        deadline: '12 days',
        budget_min: 450,
        budget_max: 1100,
        usage_rights: 'personal',
        delivery_format: 'digital',
        status: 'open',
        created_at: nowIso(),
        updated_at: nowIso(),
        offers_count: 7,
        reference_images: [],
    },
];

// =============================================================================
// Internal Components for Activity Page
// =============================================================================

interface StatusOverviewCardProps {
    title: string;
    count: number;
    status: 'waiting' | 'offers' | 'progress' | 'delivered';
    selected: boolean;
    onPress: (status: 'waiting' | 'offers' | 'progress' | 'delivered') => void;
}

const StatusOverviewCard: React.FC<StatusOverviewCardProps> = ({ title, count, status, selected, onPress }) => {
    const handlePress = useCallback(() => {
        onPress(status);
    }, [status, onPress]);

    return (
        <TouchableOpacity
            onPress={handlePress}
            style={[
                activityStyles.statusOverviewCard,
                selected && activityStyles.statusOverviewCardSelected
            ]}
            activeOpacity={0.7}
        >
            <View style={activityStyles.statusOverviewContent}>
                <Title style={[activityStyles.statusOverviewCount, selected && activityStyles.statusOverviewCountSelected]}>
                    {count}
                </Title>
                <Caption style={[activityStyles.statusOverviewTitle, selected && activityStyles.statusOverviewTitleSelected]}>
                    {title}
                </Caption>
            </View>
            {selected && (
                <View style={activityStyles.activeGlowDot} />
            )}
        </TouchableOpacity>
    );
};

interface MyRequestsFeedProps {
    requests: Request[];
    userRole: 'customer' | 'artist' | 'admin';
    onLocalStatusChange?: (requestId: number, status: RequestStatus) => void;
    onModalStateChange?: (isOpen: boolean) => void;
    emptyVariant?: 'full' | 'none';
}

const MyRequestsFeed: React.FC<MyRequestsFeedProps> = ({ requests, userRole, onLocalStatusChange, onModalStateChange, emptyVariant = 'full' }: MyRequestsFeedProps) => {
    const isCustomer = userRole === 'customer';

    if (requests.length === 0) {
        if (emptyVariant === 'none') return null;
        return (
            <View style={activityStyles.emptyContainer}>
                <View style={activityStyles.emptyIconCircle}>
                    <Ionicons
                        name={isCustomer ? "document-text-outline" : "briefcase-outline"}
                        size={28}
                        color={COLORS.accent.primary}
                    />
                </View>
                <Title style={activityStyles.emptyTitle}>
                    {isCustomer ? 'No briefs yet' : 'No open briefs'}
                </Title>
                <Body style={activityStyles.emptyText}>
                    {isCustomer
                        ? 'Create a brief to receive offers from artists.'
                        : 'Check back soon for new requests.'
                    }
                </Body>
            </View>
        );
    }

    return (
        <View style={activityStyles.feedContainer}>
            {requests.map((request: Request) => (
                <RequestCard key={request.id} request={request} userRole={userRole} onLocalStatusChange={onLocalStatusChange} onModalStateChange={onModalStateChange} />
            ))}
        </View>
    );
};

interface RequestCardProps {
    request: Request;
    userRole: 'customer' | 'artist' | 'admin';
    onLocalStatusChange?: (requestId: number, status: RequestStatus) => void;
    onModalStateChange?: (isOpen: boolean) => void;
}

type SortOption = 'recommended' | 'fastest' | 'cheapest' | 'rated';

const RequestCard: React.FC<RequestCardProps> = ({ request, userRole, onLocalStatusChange, onModalStateChange }: RequestCardProps) => {
    const isCustomer = userRole === 'customer';
    const isArtist = userRole === 'artist';

    // =============================================================================
    // Helper: Status to Step Mapping
    // =============================================================================

    const CUSTOMER_STEPS: Step[] = [
        { label: 'Posted' },
        { label: 'Offers' },
        { label: 'Selected' },
        { label: 'Delivered' },
    ];

    const ARTIST_STEPS: Step[] = [
        { label: 'Found' },
        { label: 'Offer Sent' },
        { label: 'Hired' },
        { label: 'Delivered' },
    ];

    const getStepIndex = (status: RequestStatus, role: 'customer' | 'artist', offersCount = 0): number => {
        if (role === 'customer') {
            switch (status) {
                case 'open':
                    // If open and has offers, show step 2 (Offers), otherwise step 1 (Posted)
                    return offersCount > 0 ? 1 : 0;
                case 'pending_payment':
                    return 2; // Selected - waiting for payment
                case 'hired':
                case 'in_progress':
                    return 2; // Selected - in progress
                case 'delivered':
                case 'completed':
                    return 3; // Delivered/Completed
                case 'cancelled':
                case 'refunded':
                    return 0; // Show as posted but with cancelled state
                default:
                    return 0;
            }
        } else {
            // Artist
            switch (status) {
                case 'open': return 0; // Found
                // If artist has sent offer? Need to check My Offers vs Request
                // For now assuming this is driven by the Request status context
                case 'pending_payment': return 2; // Hired wait
                case 'hired':
                case 'in_progress': return 2; // Hired
                case 'delivered': return 3; // Delivered
                case 'completed': return 4;
                default: return 0;
            }
        }
    };

    const getStatusConfig = (status: RequestStatus) => {
        switch (status) {
            case 'draft': return { label: 'Draft', color: COLORS.text.tertiary, action: 'Finish Brief' };
            case 'open': return { label: 'Open', color: COLORS.accent.success, action: 'View offers' };
            case 'pending_payment': return { label: 'Payment Pending', color: COLORS.accent.warning, action: 'Pay securely' };
            case 'hired': return { label: 'Artist selected', color: COLORS.accent.primary, action: 'View project' };
            case 'in_progress': return { label: 'In progress', color: COLORS.accent.primary, action: 'View project' };
            case 'delivered': return { label: 'Delivered', color: COLORS.accent.success, action: 'Review delivery' };
            case 'completed': return { label: 'Completed', color: COLORS.text.secondary, action: 'View details' };
            case 'cancelled': return { label: 'Cancelled', color: COLORS.text.tertiary, action: 'View details' };
            case 'refunded': return { label: 'Refunded', color: COLORS.accent.warning, action: 'View details' };
            default: return { label: (status || 'Unknown'), color: COLORS.text.tertiary, action: 'View' };
        }
    };

    // Derived State
    const statusConfig = getStatusConfig(request.status);

    // Calculate Step Index
    // Refinement: If status is 'open' but offers > 0, for Customer it might be step 2 (index 1)
    let activeStepIndex = getStepIndex(request.status, isCustomer ? 'customer' : 'artist');
    if (isCustomer && request.status === 'open' && (request.offers_count || 0) > 0) {
        activeStepIndex = 1; // Move to 'Offers' step
    }

    // Checking if artist has sent an offer (would need specific prop or lookup usually)
    // For this list item context, we fallback to status 

    const steps = isCustomer ? CUSTOMER_STEPS : ARTIST_STEPS;

    const handleActionPress = () => {
        // Expand card logic or nav
        if (isCustomer) {
            if (activeStepIndex === 1) {
                // Open offers sheet
                onModalStateChange?.(true);
            }
        }
    };

    const getActionText = () => {
        if (isArtist && request.status === 'open') return 'Send offer';
        return statusConfig.action;
    };

    return (
        <Animated.View entering={FadeInDown.springify().damping(20).delay(100)}>
            <View style={activityStyles.orderCard}>
                {/* Header: Img + Status */}
                <View style={activityStyles.orderHeader}>
                    <View style={activityStyles.orderThumbWrapper}>
                        {/* Placeholder for now - normally request reference img */}
                        <View style={[activityStyles.orderThumb, { backgroundColor: COLORS.background.secondary }]}>
                            <Ionicons name="image-outline" size={24} color={COLORS.text.tertiary} />
                        </View>
                        {/* Status Badge */}
                        <View style={[activityStyles.statusBadge, { backgroundColor: statusConfig.color + '20' }]}>
                            <View style={[activityStyles.statusDot, { backgroundColor: statusConfig.color }]} />
                            <Caption weight="bold" style={{ color: statusConfig.color, fontSize: 10, letterSpacing: 0.5, textTransform: 'uppercase' }}>
                                {statusConfig.label}
                            </Caption>
                        </View>
                    </View>
                    <View style={{ flex: 1, marginLeft: SPACING.small }}>
                        <Title style={activityStyles.orderTitle} numberOfLines={1}>{request.title}</Title>
                        <Caption style={activityStyles.orderDate}>{new Date(request.created_at).toLocaleDateString()}</Caption>
                    </View>
                    <TouchableOpacity onPress={handleActionPress} style={activityStyles.viewBtn}>
                        <Caption style={{ color: COLORS.accent.primary, fontWeight: '600' }}>Details</Caption>
                    </TouchableOpacity>
                </View>

                {/* Stepper */}
                <View style={activityStyles.stepperContainer}>
                    <Stepper
                        steps={steps}
                        activeIndex={activeStepIndex}
                        activeColor={statusConfig.color}
                    />
                </View>

                {/* Dynamic Footer Action based on step */}
                {isCustomer && activeStepIndex === 1 && (
                    <View style={activityStyles.cardFooter}>
                        <BodySmall style={{ color: COLORS.text.secondary }}>
                            {request.offers_count} artists have sent proposals.
                        </BodySmall>
                        <TouchableOpacity onPress={() => onModalStateChange?.(true)}>
                            <BodySmall weight="bold" style={{ color: COLORS.accent.primary }}>View Offers</BodySmall>
                        </TouchableOpacity>
                    </View>
                )}

                {isCustomer && activeStepIndex === 0 && (
                    <View style={activityStyles.cardFooter}>
                        <BodySmall style={{ color: COLORS.text.secondary }}>
                            Your request is live. Waiting for artists...
                        </BodySmall>
                    </View>
                )}
            </View>
        </Animated.View>
    );
};

interface OfferCardProps {
    offer: OfferWithArtist;
    requestId: number;
}

const OfferCard: React.FC<OfferCardProps> = ({ offer, requestId }: OfferCardProps) => {
    const [showDetails, setShowDetails] = useState(false);

    return (
        <View style={activityStyles.offerContainer}>
            <View style={activityStyles.offerCard}>
                <View style={activityStyles.topRow}>
                    <View style={activityStyles.artistSection}>
                        {offer.artist_profile_picture ? (
                            <Image source={{ uri: offer.artist_profile_picture }} style={activityStyles.avatar} />
                        ) : (
                            <View style={activityStyles.avatarPlaceholder}>
                                <Ionicons name="person-outline" size={16} color={COLORS.text.tertiary} />
                            </View>
                        )}
                        <View>
                            <Body weight="medium" style={activityStyles.artistName}>{offer.artist_name}</Body>
                            <View style={activityStyles.artistMetrics}>
                                <Ionicons name="star" size={9} color={COLORS.accent.primary} />
                                <Caption style={activityStyles.metricText}>{(offer.artist_rating || 4.8).toFixed(1)}</Caption>
                                <Caption style={activityStyles.separator}>•</Caption>
                                <Caption style={activityStyles.metricText}>{(offer.artist_completion_rate || 98)}% completion</Caption>
                            </View>
                        </View>
                    </View>
                    <View style={activityStyles.priceSection}>
                        <Body weight="medium" style={activityStyles.priceLabel}>OFFER</Body>
                        <Title style={activityStyles.price}>${offer.price}</Title>
                    </View>
                </View>

                {offer.message && (
                    <BodySmall numberOfLines={2} style={activityStyles.messagePreview}>
                        {offer.message}
                    </BodySmall>
                )}

                <View style={activityStyles.offerActions}>
                    <View style={activityStyles.detailsRow}>
                        <View style={activityStyles.detailItem}>
                            <Ionicons name="time-outline" size={12} color={COLORS.text.tertiary} />
                            <Caption style={activityStyles.detailText}>{offer.delivery_days}d</Caption>
                        </View>
                        <View style={activityStyles.detailItem}>
                            <Ionicons name="refresh-outline" size={12} color={COLORS.text.tertiary} />
                            <Caption style={activityStyles.detailText}>{offer.revisions_included || 0} revisions</Caption>
                        </View>
                    </View>

                    <TouchableOpacity
                        onPress={() => setShowDetails(true)}
                        style={activityStyles.premiumViewBtn}
                        activeOpacity={0.7}
                    >
                        <Body weight="semibold" style={{ color: COLORS.accent.primary, fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase' }}>VIEW</Body>
                    </TouchableOpacity>
                </View>
            </View>

            <OfferDetailsModal
                visible={showDetails}
                onClose={() => setShowDetails(false)}
                offer={offer}
                requestId={requestId}
            />
        </View>
    );
};

interface OfferDetailsModalProps {
    visible: boolean;
    onClose: () => void;
    offer: OfferWithArtist;
    requestId: number;
}

const OfferDetailsModal: React.FC<OfferDetailsModalProps> = ({ visible, onClose, offer, requestId }: OfferDetailsModalProps) => {
    const selectArtistMutation = useSelectArtist();

    const handleHire = async () => {
        Alert.alert(
            'Confirm Selection',
            `You are selecting ${offer.artist_name} for this project. This will lock the order and notify other artists.`,
            [
                { text: 'Review again', style: 'cancel' },
                {
                    text: 'Select & Proceed',
                    onPress: async () => {
                        try {
                            await selectArtistMutation.mutateAsync({ requestId, offerId: offer.id });
                            Alert.alert('Order locked', 'This commission is now locked. Please proceed to payment to start.');
                            onClose();
                        } catch (error) {
                            Alert.alert('Error', 'Failed to lock selection.');
                        }
                    }
                }
            ]
        );
    };

    return (
        <Modal visible={visible} animationType="slide" transparent>
            <View style={activityStyles.offerModalOverlay}>
                <View style={activityStyles.offerModal}>
                    <View style={activityStyles.offerModalHeader}>
                        <View>
                            <Caption style={activityStyles.offerModalOverline}>Proposal Details</Caption>
                            <Title style={activityStyles.offerModalTitle}>The Artist Plan</Title>
                        </View>
                        <TouchableOpacity onPress={onClose} style={activityStyles.offerCloseButton}>
                            <Ionicons name="close" size={24} color={COLORS.text.primary} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={activityStyles.offerModalContent} showsVerticalScrollIndicator={false}>
                        <View style={activityStyles.offerArtistSection}>
                            <View style={activityStyles.offerArtistMeta}>
                                <Title style={activityStyles.offerArtistName}>{offer.artist_name}</Title>
                                <View style={activityStyles.offerRatingRow}>
                                    <Ionicons name="star" size={14} color={COLORS.accent.warning} />
                                    <Body weight="semibold">{(offer.artist_rating || 4.8).toFixed(1)}</Body>
                                    <Caption color="secondary">Rating</Caption>
                                </View>
                            </View>
                        </View>

                        <View style={activityStyles.offerPricingGrid}>
                            <View style={activityStyles.offerPriceItem}>
                                <Caption style={activityStyles.offerGridLabel}>Investment</Caption>
                                <Title style={activityStyles.offerGridValue}>${offer.price}</Title>
                            </View>
                            <View style={[activityStyles.offerPriceItem, activityStyles.offerGridBorder]}>
                                <Caption style={activityStyles.offerGridLabel}>Timeline</Caption>
                                <Title style={activityStyles.offerGridValue}>{offer.delivery_days} Days</Title>
                            </View>
                            <View style={activityStyles.offerPriceItem}>
                                <Caption style={activityStyles.offerGridLabel}>Revisions</Caption>
                                <Title style={activityStyles.offerGridValue}>{offer.revisions_included || 0}</Title>
                            </View>
                        </View>

                        <View style={activityStyles.offerModalSection}>
                            <Caption weight="bold" style={activityStyles.offerSectionLabel}>Execution Strategy</Caption>
                            <Body style={activityStyles.offerMessage}>{offer.message || 'The artist has not provided a specific plan message.'}</Body>
                        </View>

                        <View style={activityStyles.offerModalSection}>
                            <Caption weight="bold" style={activityStyles.offerSectionLabel}>Guarantees</Caption>
                            <View style={activityStyles.offerGuaranteeRow}>
                                <Ionicons name="shield-checkmark-outline" size={20} color={COLORS.accent.primary} />
                                <View>
                                    <Body weight="medium">Escrow Protection</Body>
                                    <BodySmall color="secondary">Funds are only released when you approve the final artwork.</BodySmall>
                                </View>
                            </View>
                        </View>
                    </ScrollView>

                    <View style={activityStyles.offerModalFooter}>
                        <TouchableOpacity
                            style={activityStyles.premiumHireBtn}
                            onPress={handleHire}
                            disabled={selectArtistMutation.isPending}
                        >
                            <Body weight="bold" style={activityStyles.premiumHireBtnText}>
                                {selectArtistMutation.isPending ? 'PROCESSING...' : 'SELECT THIS PROPOSAL'}
                            </Body>
                        </TouchableOpacity>
                        <BodySmall style={activityStyles.offerFooterNote} align="center">
                            Selecting this proposal will set your order to 'Pending Payment'.
                        </BodySmall>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

interface ProjectTimelineProps {
    request: Request;
    onLocalStatusChange?: (requestId: number, status: RequestStatus) => void;
}

const ProjectTimeline: React.FC<ProjectTimelineProps> = ({ request, onLocalStatusChange }: ProjectTimelineProps) => {
    // Simulated milestones based on status
    const milestones = [
        { id: 1, title: 'Project Initiation', status: 'completed', date: 'Oct 12' },
        { id: 2, title: 'Work in progress', status: request.status === 'hired' ? 'pending' : 'completed', date: 'Oct 15' },
        { id: 3, title: 'Mid-Review Gallery', status: (request.status === 'hired' || request.status === 'in_progress') ? 'pending' : 'completed', date: 'Oct 18' },
        { id: 4, title: 'Delivery', status: request.status === 'delivered' ? 'submitted' : request.status === 'completed' ? 'completed' : 'pending', date: 'Oct 22' },
    ];

    const getStatusIcon = (status: string): { name: string; color: string } => {
        switch (status) {
            case 'completed': return { name: 'ellipse', color: COLORS.accent.primary };
            case 'submitted': return { name: 'ellipse', color: COLORS.accent.warning };
            case 'pending': return { name: 'ellipse-outline', color: 'rgba(255, 255, 255, 0.1)' };
            default: return { name: 'ellipse-outline', color: 'rgba(255, 255, 255, 0.1)' };
        }
    };

    return (
        <View style={activityStyles.timelineContainer}>
            <View style={activityStyles.timelineHeader}>
                <Caption style={activityStyles.timelineOverline}>PROJECT TIMELINE</Caption>
                <Title style={activityStyles.timelineTitle}>Milestones</Title>
            </View>

            <View style={activityStyles.timeline}>
                {milestones.map((m: { id: number; title: string; status: string; date: string }, i: number) => {
                    const icon = getStatusIcon(m.status);
                    return (
                        <View key={m.id} style={activityStyles.milestoneRow}>
                            <View style={activityStyles.indicatorCol}>
                                <Ionicons name={icon.name as any} size={14} color={icon.color} />
                                {i < milestones.length - 1 && <View style={activityStyles.connector} />}
                            </View>
                            <View style={activityStyles.contentCol}>
                                <View style={activityStyles.milestoneHeader}>
                                    <View>
                                        <Body weight={m.status === 'pending' ? 'medium' : 'bold'} style={{ fontSize: 13, color: m.status === 'pending' ? COLORS.text.tertiary : COLORS.text.primary }}>
                                            {m.title}
                                        </Body>
                                        <Caption style={activityStyles.date}>{m.date}</Caption>
                                    </View>
                                </View>
                                {m.status === 'submitted' && (
                                    <View style={activityStyles.actionCard}>
                                        <BodySmall style={{ color: COLORS.text.secondary }}>Visual assets have been uploaded for your review.</BodySmall>
                                        <TouchableOpacity style={activityStyles.timelineViewBtn}>
                                            <Caption style={{ color: COLORS.accent.primary, fontWeight: '600' }}>View files</Caption>
                                        </TouchableOpacity>
                                    </View>
                                )}
                            </View>
                        </View>
                    );
                })}
            </View>

            <View style={activityStyles.timelineFooter}>
                {request.status === 'delivered' ? (
                    <View style={activityStyles.buttonRow}>
                        <TouchableOpacity style={activityStyles.revisionBtn}>
                            <Body weight="medium" style={{ color: COLORS.text.primary, fontSize: 13 }}>Request revision</Body>
                        </TouchableOpacity>
                        <PrimaryButton
                            title="Approve & release"
                            onPress={() => {
                                if (__DEV__ && onLocalStatusChange) {
                                    onLocalStatusChange(request.id, 'completed');
                                }
                            }}
                            style={activityStyles.approveBtn}
                            size="sm"
                        />
                    </View>
                ) : (
                    <TouchableOpacity style={activityStyles.chatEntry}>
                        <Ionicons name="chatbubble-outline" size={18} color={COLORS.accent.primary} />
                        <Body weight="medium" style={{ fontSize: 13 }}>Chat</Body>
                        <Ionicons name="chevron-forward" size={14} color={COLORS.text.tertiary} style={{ marginLeft: 'auto' }} />
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
};

// =============================================================================
// SendOfferModal Component (Artist-Only)
// =============================================================================

interface SendOfferModalProps {
    visible: boolean;
    onClose: () => void;
    request: Request;
}

// Memoized modal header to prevent re-renders
const ModalHeader = React.memo<{ onClose: () => void }>(({ onClose }) => (
    <View style={activityStyles.modalHeader}>
        <View style={{ flex: 1 }}>
            <Caption style={activityStyles.modalOverline}>OFFER</Caption>
            <Title style={activityStyles.modalTitle}>Send offer</Title>
        </View>
        <TouchableOpacity onPress={onClose} style={activityStyles.closeBtn} activeOpacity={0.8}>
            <Ionicons name="close" size={20} color={COLORS.text.primary} />
        </TouchableOpacity>
    </View>
));
ModalHeader.displayName = 'ModalHeader';

// Memoized modal hero to prevent re-renders
const ModalHero = React.memo<{ request: Request }>(({ request }) => (
    <View style={activityStyles.modalHero}>
        <Caption style={activityStyles.modalHeroOverline}>REQUEST</Caption>
        <Title style={activityStyles.modalHeroTitle}>{request.title}</Title>
        <View style={activityStyles.modalHeroMetaRow}>
            <View style={activityStyles.modalHeroChip}>
                <Ionicons name="brush-outline" size={14} color={COLORS.text.secondary} />
                <Caption style={activityStyles.modalHeroChipText}>{request.medium || 'Custom'}</Caption>
            </View>
            <View style={activityStyles.modalHeroChip}>
                <Ionicons name="sparkles-outline" size={14} color={COLORS.text.secondary} />
                <Caption style={activityStyles.modalHeroChipText}>{request.style || 'Signature style'}</Caption>
            </View>
        </View>
    </View>
));
ModalHero.displayName = 'ModalHero';

// Memoized footer summary - only recalculates when price/delivery_days change
const ModalFooterSummary = React.memo<{ price: string; delivery_days: string }>(({ price, delivery_days }) => (
    <View style={{ flex: 1 }}>
        <Caption style={activityStyles.footerOverline}>Summary</Caption>
        <Body weight="medium" style={activityStyles.footerSummary}>
            {price ? `$${price}` : '—'} • {delivery_days ? `${delivery_days} days` : '—'}
        </Body>
        <Caption style={activityStyles.footerHint}>Submit once. Edit later from your offers.</Caption>
    </View>
));
ModalFooterSummary.displayName = 'ModalFooterSummary';

const SendOfferModal: React.FC<SendOfferModalProps> = ({ visible, onClose, request }) => {
    const createOfferMutation = useCreateOffer(request.id);
    const [offerData, setOfferData] = useState({
        price: '',
        delivery_days: '',
        message: '',
        revisions_included: 2,
        delivery_format: 'digital' as 'digital' | 'physical' | 'both',
    });

    const handleSubmit = async () => {
        if (!offerData.price || !offerData.delivery_days) {
            Alert.alert('Missing Information', 'Please provide both price and delivery time.');
            return;
        }

        try {
            await createOfferMutation.mutateAsync({
                price: parseFloat(offerData.price),
                delivery_days: parseInt(offerData.delivery_days),
                message: offerData.message,
                revisions_included: offerData.revisions_included,
                delivery_format: offerData.delivery_format,
            });
            Alert.alert('Success', 'Your offer has been submitted successfully!');
            onClose();
        } catch (error) {
            Alert.alert('Error', 'Failed to submit offer. Please try again.');
        }
    };

    const setDeliveryFormat = (format: 'digital' | 'physical' | 'both') =>
        setOfferData((p) => ({ ...p, delivery_format: format }));

    const bumpRevisions = (delta: number) => {
        setOfferData((p) => {
            const next = Math.max(0, Math.min(10, p.revisions_included + delta));
            return { ...p, revisions_included: next };
        });
    };

    const canSubmit = !!offerData.price && !!offerData.delivery_days && !createOfferMutation.isPending;

    return (
        <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
            {/* Separate backdrop - only handles tap to close */}
            <Pressable style={activityStyles.modalOverlay} onPress={onClose} />
            {/* Sheet - separate, no close handler, allows clean scroll ownership */}
            <View style={activityStyles.modalSheet} pointerEvents="box-none">
                <View style={activityStyles.modalSheetInner} pointerEvents="box-none">
                    <ScrollViewRN
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={activityStyles.modalScrollContent}
                        keyboardShouldPersistTaps="handled"
                        nestedScrollEnabled
                        scrollEnabled
                        bounces={false}
                    >
                        <ModalHeader onClose={onClose} />

                        <View style={activityStyles.modalBody}>
                            <ModalHero request={request} />

                            <View style={activityStyles.offerFormCard}>
                                <View style={activityStyles.offerFormHeaderRow}>
                                    <Caption style={activityStyles.offerFormOverline}>YOUR OFFER</Caption>
                                    <Caption style={activityStyles.offerFormHint}>Escrow-protected</Caption>
                                </View>

                                <View style={activityStyles.offerFormRow}>
                                    <View style={activityStyles.offerFormField}>
                                        <Caption style={activityStyles.offerLabel}>Price (USD)</Caption>
                                        <View style={activityStyles.offerInputShell}>
                                            <Caption style={activityStyles.offerPrefix}>$</Caption>
                                            <TextInput
                                                style={activityStyles.offerInput}
                                                placeholder="500"
                                                placeholderTextColor={COLORS.text.tertiary}
                                                keyboardType="numeric"
                                                value={offerData.price}
                                                onChangeText={(v) => setOfferData({ ...offerData, price: v })}
                                            />
                                        </View>
                                    </View>
                                    <View style={activityStyles.offerFormField}>
                                        <Caption style={activityStyles.offerLabel}>Delivery (days)</Caption>
                                        <View style={activityStyles.offerInputShell}>
                                            <Ionicons name="time-outline" size={16} color={COLORS.text.tertiary} style={{ marginRight: 6 }} />
                                            <TextInput
                                                style={activityStyles.offerInput}
                                                placeholder="7"
                                                placeholderTextColor={COLORS.text.tertiary}
                                                keyboardType="numeric"
                                                value={offerData.delivery_days}
                                                onChangeText={(v) => setOfferData({ ...offerData, delivery_days: v })}
                                            />
                                        </View>
                                    </View>
                                </View>

                                <View style={activityStyles.offerFormField}>
                                    <Caption style={activityStyles.offerLabel}>Delivery format</Caption>
                                    <View style={activityStyles.segmented}>
                                        <TouchableOpacity
                                            activeOpacity={0.85}
                                            onPress={() => setDeliveryFormat('digital')}
                                            style={[activityStyles.segment, offerData.delivery_format === 'digital' && activityStyles.segmentActive]}
                                        >
                                            <Caption style={[activityStyles.segmentText, offerData.delivery_format === 'digital' && activityStyles.segmentTextActive]}>
                                                Digital
                                            </Caption>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            activeOpacity={0.85}
                                            onPress={() => setDeliveryFormat('physical')}
                                            style={[activityStyles.segment, offerData.delivery_format === 'physical' && activityStyles.segmentActive]}
                                        >
                                            <Caption style={[activityStyles.segmentText, offerData.delivery_format === 'physical' && activityStyles.segmentTextActive]}>
                                                Physical
                                            </Caption>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            activeOpacity={0.85}
                                            onPress={() => setDeliveryFormat('both')}
                                            style={[activityStyles.segment, offerData.delivery_format === 'both' && activityStyles.segmentActive]}
                                        >
                                            <Caption style={[activityStyles.segmentText, offerData.delivery_format === 'both' && activityStyles.segmentTextActive]}>
                                                Both
                                            </Caption>
                                        </TouchableOpacity>
                                    </View>
                                </View>

                                <View style={activityStyles.offerFormField}>
                                    <Caption style={activityStyles.offerLabel}>Revisions</Caption>
                                    <View style={activityStyles.revisionsRow}>
                                        <TouchableOpacity
                                            activeOpacity={0.85}
                                            style={activityStyles.revisionStepperBtn}
                                            onPress={() => bumpRevisions(-1)}
                                        >
                                            <Ionicons name="remove" size={18} color={COLORS.text.primary} />
                                        </TouchableOpacity>
                                        <View style={activityStyles.revisionStepperValue}>
                                            <Title style={activityStyles.revisionValueText}>{offerData.revisions_included}</Title>
                                            <Caption style={activityStyles.revisionValueSub}>included</Caption>
                                        </View>
                                        <TouchableOpacity
                                            activeOpacity={0.85}
                                            style={activityStyles.revisionStepperBtn}
                                            onPress={() => bumpRevisions(1)}
                                        >
                                            <Ionicons name="add" size={18} color={COLORS.text.primary} />
                                        </TouchableOpacity>
                                    </View>
                                </View>

                                <View style={activityStyles.offerFormField}>
                                    <Caption style={activityStyles.offerLabel}>Message (optional)</Caption>
                                    <TextInput
                                        style={activityStyles.offerTextarea}
                                        placeholder="Short intro + your approach + what the client will receive."
                                        placeholderTextColor={COLORS.text.tertiary}
                                        multiline
                                        numberOfLines={5}
                                        value={offerData.message}
                                        onChangeText={(v) => setOfferData({ ...offerData, message: v })}
                                        textAlignVertical="top"
                                    />
                                </View>
                            </View>
                        </View>

                        <View style={activityStyles.modalFooter}>
                            <ModalFooterSummary price={offerData.price} delivery_days={offerData.delivery_days} />
                            <View style={{ width: 160 }}>
                                <PrimaryButton
                                    title="Submit"
                                    onPress={handleSubmit}
                                    fullWidth
                                    loading={createOfferMutation.isPending}
                                    disabled={!canSubmit}
                                />
                            </View>
                        </View>
                    </ScrollViewRN>
                </View>
            </View>
        </Modal>
    );
};

interface CreateOrderFormProps {
    onSubmitted?: () => void;
}

interface SelectionModalProps {
    visible: boolean;
    onClose: () => void;
    title: string;
    options: string[];
    selectedValue: string;
    onSelect: (value: string) => void;
}

const SelectionModal: React.FC<SelectionModalProps> = ({
    visible,
    onClose,
    title,
    options,
    selectedValue,
    onSelect,
}: SelectionModalProps) => (
    <Modal visible={visible} transparent animationType="fade">
        <Pressable style={activityStyles.formSelectionModalOverlay} onPress={onClose}>
            <Pressable style={activityStyles.formSelectionModalSheet} onPress={() => { }}>
                <View style={activityStyles.formSelectionModalHeader}>
                    <View>
                        <Caption style={activityStyles.overline}>CATEGORY</Caption>
                        <Title style={activityStyles.formSelectionModalTitle}>{title}</Title>
                    </View>
                    <TouchableOpacity onPress={onClose} style={activityStyles.offerCloseButton}>
                        <Ionicons name="close-outline" size={20} color={COLORS.text.primary} />
                    </TouchableOpacity>
                </View>

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={activityStyles.formSelectionModalList}>
                    {options.map((option: string) => (
                        <TouchableOpacity
                            key={option}
                            style={[
                                activityStyles.formSelectionModalItem,
                                selectedValue === option && activityStyles.formSelectionModalItemActive,
                            ]}
                            onPress={() => {
                                onSelect(option);
                                onClose();
                            }}
                            activeOpacity={0.7}
                        >
                            <Body style={{ color: selectedValue === option ? COLORS.accent.primary : COLORS.text.secondary, fontWeight: selectedValue === option ? '600' : '300' }}>
                                {option}
                            </Body>
                            {selectedValue === option && (
                                <View style={activityStyles.selectedDot} />
                            )}
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </Pressable>
        </Pressable>
    </Modal>
);

const CreateOrderForm: React.FC<CreateOrderFormProps> = ({ onSubmitted }: CreateOrderFormProps) => {
    const createRequestMutation = useCreateRequest();
    const [step, setStep] = useState(1);
    const [focusedField, setFocusedField] = useState<string | null>(null);
    const [modalConfig, setModalConfig] = useState<{ visible: boolean; title: string; field: keyof CreateRequestData; options: string[] }>({
        visible: false,
        title: '',
        field: 'category',
        options: [],
    });

    const [formData, setFormData] = useState<CreateRequestData>({
        title: '',
        category: '',
        medium: '',
        description: '',
        dimensions_width: undefined,
        dimensions_height: undefined,
        dimensions_unit: 'cm',
        style: '',
        deadline: '',
        budget_min: undefined,
        budget_max: undefined,
        usage_rights: 'personal',
        delivery_format: 'digital',
        reference_images: [],
    });

    const categories = ['Portrait', 'Pet', 'Landscape', 'Character', 'Abstract', 'Logo', 'Other'];
    const mediums = ['Oil', 'Acrylic', 'Watercolor', 'Digital', 'Graphite', 'Ink', 'Other'];

    // Load draft
    useEffect(() => {
        const loadDraft = async () => {
            try {
                const saved = await AsyncStorage.getItem('@artivty:request_draft');
                if (saved) {
                    setFormData(JSON.parse(saved));
                    Alert.alert('Draft Restored', 'We found an unfinished brief from your last session.');
                }
            } catch (e) {
                console.error('Failed to load draft');
            }
        };
        loadDraft();
    }, []);

    // Save draft
    useEffect(() => {
        const saveDraft = async () => {
            try {
                await AsyncStorage.setItem('@artivty:request_draft', JSON.stringify(formData));
            } catch (e) {
                console.error('Failed to save draft');
            }
        };
        saveDraft();
    }, [formData]);

    const handleInputChange = (field: keyof CreateRequestData, value: string | number | undefined | string[]) => {
        setFormData((prev: CreateRequestData) => ({ ...prev, [field]: value }));
    };

    const openSelector = (title: string, field: keyof CreateRequestData, options: string[]) => {
        setModalConfig({ visible: true, title, field, options });
        setFocusedField(field);
    };

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsMultipleSelection: true,
            quality: 0.8,
        });

        if (!result.canceled) {
            const uris = result.assets.map((asset: { uri: string }) => asset.uri);
            setFormData((prev: CreateRequestData) => ({
                ...prev,
                reference_images: [...(prev.reference_images || []), ...uris]
            }));
        }
    };

    const calculateQuality = () => {
        let score = 0;
        if (formData.title) score += 10;
        if (formData.category) score += 10;
        if (formData.medium) score += 10;
        if (formData.dimensions_width && formData.dimensions_height) score += 20;
        if (formData.description && formData.description.length >= 60) score += 30;
        if (formData.deadline) score += 10;
        if (formData.reference_images && formData.reference_images.length > 0) score += 10;
        return score;
    };

    const getQualityLabel = () => {
        const q = calculateQuality();
        if (q < 40) return { label: 'Needs work', color: COLORS.accent.danger };
        if (q < 80) return { label: 'Good', color: COLORS.accent.warning };
        return { label: 'Excellent', color: COLORS.accent.success };
    };

    const nextStep = () => {
        if (step === 1 && (!formData.title || !formData.category || !formData.medium)) {
            Alert.alert('Incomplete', 'Please fill basics to continue.');
            return;
        }
        if (step === 2 && (formData.description.length < 60)) {
            Alert.alert('Add more details', 'Add a bit more detail so artists understand your request.');
            return;
        }
        setStep((s: number) => s + 1);
    };

    const handleSubmit = async () => {
        try {
            await createRequestMutation.mutateAsync(formData);
            await AsyncStorage.removeItem('@artivty:request_draft');
            Alert.alert('Success', "Your brief is live. You'll start receiving offers soon.");
            onSubmitted?.();
        } catch (error) {
            Alert.alert('Error', 'Failed to publish brief.');
        }
    };

    const quality = getQualityLabel();

    const renderSelectField = (
        label: string,
        value: string,
        placeholder: string,
        onPress: () => void,
        fieldKey: string
    ) => {
        const isFocused = focusedField === fieldKey;
        const hasValue = !!value;

        const boxStyleArray: any[] = [
            activityStyles.selectField,
        ];
        if (isFocused) boxStyleArray.push(activityStyles.selectFieldFocused);
        if (hasValue && !isFocused) boxStyleArray.push(activityStyles.selectFieldFilled);
        const boxStyle = StyleSheet.flatten(boxStyleArray);

        const labelStyleArray: any[] = [activityStyles.fieldLabel];
        if (isFocused) labelStyleArray.push({ color: COLORS.accent.primary });
        const labelStyle = StyleSheet.flatten(labelStyleArray);

        return (
            <View style={activityStyles.fieldContainer}>
                <Caption
                    style={labelStyle}
                >
                    {label}
                </Caption>

                <TouchableOpacity
                    style={boxStyle}
                    onPress={onPress}
                    activeOpacity={0.8}
                >
                    <Body style={{ color: hasValue ? COLORS.text.primary : COLORS.text.tertiary }}>
                        {value || placeholder}
                    </Body>

                    <View style={activityStyles.selectRight}>
                        {hasValue && (
                            <View style={activityStyles.selectedDot} />
                        )}
                        <Ionicons
                            name="chevron-down"
                            size={16}
                            color={isFocused ? COLORS.accent.primary : COLORS.text.tertiary}
                        />
                    </View>
                </TouchableOpacity>
            </View>
        );
    };

    return (
        <View style={activityStyles.formContainer}>
            <View style={activityStyles.createFormHeader}>
                <View>
                    <Caption style={{ letterSpacing: 2, color: COLORS.text.tertiary, marginBottom: 4 }}>STEP {step} OF 4</Caption>
                    <Title style={activityStyles.stepTitle}>
                        {step === 1 && 'Basics'}
                        {step === 2 && 'Details'}
                        {step === 3 && 'Timeline & budget'}
                        {step === 4 && 'References'}
                    </Title>
                </View>
                <View style={activityStyles.qualityMeter}>
                    <Caption style={activityStyles.qualityLabel}>BRIEF QUALITY</Caption>
                    <View style={[activityStyles.qualityPill, { backgroundColor: quality.color }]}>
                        <Caption weight="bold" style={activityStyles.qualityText}>{quality.label}</Caption>
                    </View>
                </View>
            </View>

            <View style={activityStyles.formContent}>
                {step === 1 && (
                    <View style={activityStyles.stepContent}>
                        <TextInput
                            style={activityStyles.editorialInput}
                            placeholder="Victorian era pet portrait"
                            value={formData.title}
                            onChangeText={(v: string) => handleInputChange('title', v)}
                            onFocus={() => setFocusedField('title')}
                            onBlur={() => setFocusedField(null)}
                        />

                        {renderSelectField(
                            "Category",
                            formData.category || '',
                            "Select artwork type...",
                            () => openSelector("Select Category", "category", categories),
                            "category"
                        )}

                        {renderSelectField(
                            "Medium",
                            formData.medium || '',
                            "Select medium (Oil, Digital...)",
                            () => openSelector("Select Medium", "medium", mediums),
                            "medium"
                        )}

                        <View style={activityStyles.row}>
                            <View style={{ flex: 1 }}>
                                <TextInput
                                    style={activityStyles.editorialInput}
                                    placeholder="Width"
                                    keyboardType="numeric"
                                    value={formData.dimensions_width?.toString()}
                                    onChangeText={(v: string) => handleInputChange('dimensions_width', parseFloat(v))}
                                    onFocus={() => setFocusedField('width')}
                                    onBlur={() => setFocusedField(null)}
                                />
                            </View>
                            <View style={{ flex: 1 }}>
                                <TextInput
                                    style={activityStyles.editorialInput}
                                    placeholder="Height"
                                    keyboardType="numeric"
                                    value={formData.dimensions_height?.toString()}
                                    onChangeText={(v: string) => handleInputChange('dimensions_height', parseFloat(v))}
                                    onFocus={() => setFocusedField('height')}
                                    onBlur={() => setFocusedField(null)}
                                />
                            </View>
                            <View style={{ flex: 0.5 }}>
                                <TextInput
                                    style={activityStyles.editorialInput}
                                    placeholder="Unit"
                                    value={formData.dimensions_unit}
                                    onChangeText={(v: string) => handleInputChange('dimensions_unit', v)}
                                    onFocus={() => setFocusedField('unit')}
                                    onBlur={() => setFocusedField(null)}
                                />
                            </View>
                        </View>
                    </View>
                )}

                {step === 2 && (
                    <View style={activityStyles.stepContent}>
                        <TextInput
                            style={activityStyles.editorialInput}
                            placeholder="Tell the artist exactly what you want..."
                            multiline
                            numberOfLines={6}
                            textAlignVertical="top"
                            value={formData.description}
                            onChangeText={(v: string) => handleInputChange('description', v)}
                            onFocus={() => setFocusedField('description')}
                            onBlur={() => setFocusedField(null)}
                        />
                        <TextInput
                            style={activityStyles.editorialInput}
                            placeholder="e.g. Impressionist / Hyper-realistic"
                            value={formData.style}
                            onChangeText={(v: string) => handleInputChange('style', v)}
                            onFocus={() => setFocusedField('style')}
                            onBlur={() => setFocusedField(null)}
                        />
                    </View>
                )}

                {step === 3 && (
                    <View style={activityStyles.stepContent}>
                        <TextInput
                            style={activityStyles.editorialInput}
                            placeholder="e.g. within 14 days"
                            value={formData.deadline}
                            onChangeText={(v: string) => handleInputChange('deadline', v)}
                            onFocus={() => setFocusedField('deadline')}
                            onBlur={() => setFocusedField(null)}
                        />
                        <View style={activityStyles.row}>
                            <View style={{ flex: 1 }}>
                                <TextInput
                                    style={activityStyles.editorialInput}
                                    placeholder="Min Budget ($)"
                                    keyboardType="numeric"
                                    value={formData.budget_min?.toString()}
                                    onChangeText={(v: string) => handleInputChange('budget_min', parseFloat(v))}
                                    onFocus={() => setFocusedField('budget_min')}
                                    onBlur={() => setFocusedField(null)}
                                />
                            </View>
                            <View style={{ flex: 1 }}>
                                <TextInput
                                    style={activityStyles.editorialInput}
                                    placeholder="Max Budget ($)"
                                    keyboardType="numeric"
                                    value={formData.budget_max?.toString()}
                                    onChangeText={(v: string) => handleInputChange('budget_max', parseFloat(v))}
                                    onFocus={() => setFocusedField('budget_max')}
                                    onBlur={() => setFocusedField(null)}
                                />
                            </View>
                        </View>
                        {renderSelectField(
                            "Usage",
                            formData.usage_rights || '',
                            "How will you use the art?",
                            () => openSelector("Usage", "usage_rights", ['personal', 'commercial']),
                            "usage_rights"
                        )}
                    </View>
                )}

                {step === 4 && (
                    <View style={activityStyles.stepContent}>
                        <Caption style={activityStyles.label}>References</Caption>
                        <TouchableOpacity style={activityStyles.uploadCard} onPress={pickImage} activeOpacity={0.6}>
                            <Ionicons name="attach-outline" size={32} color={COLORS.accent.primary} />
                            <Body weight="medium">Upload Visual Assets</Body>
                            <Caption color="secondary">Sketches, color palettes, or moodboards</Caption>
                        </TouchableOpacity>

                        {formData.reference_images && formData.reference_images.length > 0 && (
                            <ScrollViewRN horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={activityStyles.imageScroll}>
                                {formData.reference_images.map((uri: string, i: number) => (
                                    <View key={i} style={activityStyles.imageWrapper}>
                                        <Image source={{ uri }} style={activityStyles.prevImg} />
                                    </View>
                                ))}
                            </ScrollViewRN>
                        )}
                        <BodySmall color="secondary" style={activityStyles.finalNote}>
                            Your brief will be live. You'll start receiving offers soon.
                        </BodySmall>
                    </View>
                )}
            </View>

            <View style={activityStyles.formFooter}>
                {step > 1 && (
                    <TouchableOpacity onPress={() => setStep((s: number) => s - 1)} style={activityStyles.backButton}>
                        <Ionicons name="arrow-back" size={24} color={COLORS.text.secondary} />
                    </TouchableOpacity>
                )}
                <View style={{ flex: 1 }}>
                    <PrimaryButton
                        title={step < 4 ? 'Continue' : 'Publish My Brief'}
                        onPress={step < 4 ? nextStep : handleSubmit}
                        loading={createRequestMutation.isPending}
                        fullWidth
                        size="lg"
                        style={activityStyles.actionBtn}
                    />
                </View>
            </View>

            <SelectionModal
                visible={modalConfig.visible}
                onClose={() => {
                    setModalConfig((prev: { visible: boolean; title: string; field: keyof CreateRequestData; options: string[] }) => ({ ...prev, visible: false }));
                    setFocusedField(null);
                }}
                title={modalConfig.title}
                options={modalConfig.options}
                selectedValue={(formData[modalConfig.field] as string) || ''}
                onSelect={(value: string) => handleInputChange(modalConfig.field, value)}
            />
        </View>
    );
};

// =============================================================================
// Main Activity Screen Component
// =============================================================================

const ActivityPage = () => {
    // =============================================================================
    // 1. MODE DETECTION (Foundation) — one account, two operating modes
    // =============================================================================
    const { user, activeMode } = useAuthStore();
    const isUserMode = activeMode === 'USER';
    const isArtistMode = activeMode === 'ARTIST';
    const [localStatus, setLocalStatus] = useState<Record<number, RequestStatus>>({});

    // =============================================================================
    // Dashboard State - Stepper Control
    // =============================================================================
    const [activeStep, setActiveStep] = useState(0);

    // =============================================================================
    // 2. DATA FETCHING (Mode-Based)
    // =============================================================================
    // USER mode: fetch their own requests
    const { data: myRequests, isLoading: myRequestsLoading, isFetching: myRequestsFetching, refetch: refetchMyRequests } = useMyRequests(isUserMode);

    // ARTIST mode: fetch available requests
    const canUseArtistData = isArtistMode && user?.role === 'artist';
    const { data: openRequests, isLoading: openRequestsLoading, isFetching: openRequestsFetching, refetch: refetchOpenRequests } = useOpenRequests(canUseArtistData);
    const { data: myOffers, isLoading: myOffersLoading } = useMyOffers(canUseArtistData);

    const isLoading = isUserMode ? myRequestsLoading : (openRequestsLoading || myOffersLoading);
    const isFetching = isUserMode ? myRequestsFetching : openRequestsFetching;
    const refetch = isUserMode ? refetchMyRequests : refetchOpenRequests;

    const [refreshing, setRefreshing] = useState(false);

    const onLocalStatusChange = (requestId: number, status: RequestStatus) => {
        setLocalStatus((prev) => ({ ...prev, [requestId]: status }));
    };

    type ActivityBucketList = Request[] | OfferWithArtist[];
    interface ActivitySections {
        waiting: Request[];
        offers: ActivityBucketList;
        progress: ActivityBucketList;
        delivered: ActivityBucketList;
    }

    // Calculate Sections (Buckets)
    const sections = useMemo<ActivitySections>(() => {
        if (isUserMode) {
            // Customer Buckets
            const all = (myRequests || []).map(r => ({ ...r, status: localStatus[r.id] || r.status }));

            const waiting = all.filter(r =>
                (r.status === 'draft') ||
                (r.status === 'open' && (r.offers_count || 0) === 0)
            );

            const offers = all.filter(r =>
                r.status === 'open' && (r.offers_count || 0) > 0
            );

            const progress = all.filter(r =>
                ['hired', 'in_progress', 'pending_payment'].includes(r.status)
            );

            const delivered = all.filter(r =>
                ['delivered', 'completed', 'cancelled', 'refunded'].includes(r.status)
            );

            return { waiting, offers, progress, delivered };
        } else {
            // Artist Buckets
            // 0: Waiting (Open Briefs)
            // 1: Offers (My Submitted Offers)
            // 2: Progress (My Hired Jobs)
            // 3: Delivered (My Completed Jobs)

            const available = (openRequests || []); // These are open briefs
            const offers = (myOffers || []); // These are my offers

            // For progress/delivered, we need to fetch orders where I am the artist.
            // Assumption: 'myOffers' contains offers, but we might need 'myJobs' for hired/progress?
            // "openRequests" are just public ones. "myOffers" tracks offers.
            // A "hired" offer acts as a job in progress.

            const myHired = offers.filter(o => ['accepted', 'hired', 'in_progress'].includes(o.status));
            const myDelivered = offers.filter(o => ['delivered', 'completed'].includes(o.status));
            const myPending = offers.filter(o => ['pending', 'viewed'].includes(o.status));

            return {
                waiting: available, // Needs mapping? These are Requests, others are Offers/Requests. 
                // The Type MyRequestsFeed expects 'Request[]'.
                // 'openRequests' are Request[]. 'myOffers' is OfferWithArtist[].
                // This is a type mismatch issue. We might need to fetch the Request for the offer.
                // For now, let's use what we have. API constraints might apply.

                offers: myPending as any, // Cast for now, will fix renders
                progress: myHired as any,
                delivered: myDelivered as any
            };
        }
    }, [isUserMode, myRequests, openRequests, myOffers, localStatus]);

    // Stepper Config
    const steps: Step[] = [
        { label: 'Waiting', count: sections.waiting.length },
        { label: 'Offers', count: sections.offers.length },
        { label: 'Progress', count: sections.progress.length },
        { label: 'Delivered', count: sections.delivered.length },
    ];

    // Current List
    const currentList = useMemo(() => {
        switch (activeStep) {
            case 0: return sections.waiting;
            case 1: return sections.offers;
            case 2: return sections.progress;
            case 3: return sections.delivered;
            default: return [];
        }
    }, [activeStep, sections]);

    // Section Info for Header
    const sectionInfo = useMemo(() => {
        const titles = ['Waiting List', 'New Offers', 'In Progress', 'Delivered'];
        const subtitles = [
            isUserMode ? 'Waiting for artists to respond.' : 'Browse open briefs to bid on.',
            isUserMode ? 'Review proposals.' : 'Offers you have sent.',
            isUserMode ? 'Track milestones.' : 'Jobs you are working on.',
            isUserMode ? 'Review final files.' : 'Jobs you have delivered.'
        ];
        return {
            title: titles[activeStep],
            subtitle: subtitles[activeStep]
        };
    }, [activeStep, isUserMode]);

    const onRefresh = React.useCallback(async () => {
        setRefreshing(true);
        await refetch();
        setRefreshing(false);
    }, [refetch]);

    // Track if any modal is open to pause refetching (use ref counter to handle multiple modals)
    const modalOpenCountRef = React.useRef(0);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleModalStateChange = useCallback((isOpen: boolean) => {
        if (isOpen) {
            modalOpenCountRef.current += 1;
        } else {
            modalOpenCountRef.current = Math.max(0, modalOpenCountRef.current - 1);
        }
        setIsModalOpen(modalOpenCountRef.current > 0);
    }, []);

    // Refetch on screen focus instead of polling (but not if modal is open)
    useFocusEffect(
        useCallback(() => {
            // Refetch when screen comes into focus, but skip if modal is open
            if (!isModalOpen) {
                refetch();
            }
        }, [refetch, isModalOpen])
    );

    // =============================================================================
    // 3. RENDER (Role-Aware UI)
    // =============================================================================
    return (
        <AppShell noPadding>
            <AppHeader title="Activity" />

            <ScrollView
                style={activityStyles.container}
                contentContainerStyle={activityStyles.scrollContent}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={COLORS.accent.primary}
                        colors={[COLORS.accent.primary]}
                        progressBackgroundColor={COLORS.background.primary}
                        title="Refreshing"
                        titleColor={COLORS.text.tertiary}
                    />
                }
            >
                {/* Context Zone - Mode banner (separated surface) */}
                <View style={activityStyles.contextZone}>
                    <View style={activityStyles.modeBanner}>
                        <Title style={activityStyles.modeTitle}>
                            {isUserMode ? 'Your briefs' : 'Open briefs'}
                        </Title>
                        <BodySmall style={activityStyles.modeSubtitle}>
                            {isUserMode
                                ? 'Post a brief, review offers, and track delivery.'
                                : (user?.role === 'artist'
                                    ? 'Send offers and manage your active projects.'
                                    : 'Artist mode requires an Artist account. Switch back to Customer mode or enable mock data in development.'
                                )}
                        </BodySmall>
                    </View>
                </View>

                {/* Subtle updating indicator - only show when refetching, not initial load */}
                {isFetching && !isLoading && (
                    <View style={activityStyles.updatingIndicator}>
                        <View style={activityStyles.updatingDot} />
                        <Caption style={activityStyles.updatingText}>Refreshing</Caption>
                    </View>
                )}

                {/* Stepper Control */}
                <View style={activityStyles.stepperWrapper}>
                    <Stepper
                        steps={steps}
                        activeIndex={activeStep}
                        onStepPress={setActiveStep}
                        activeColor={COLORS.accent.primary}
                        completedColor={COLORS.accent.secondary || '#888'}
                    />
                </View>

                {/* Main Content Feed */}
                <View style={activityStyles.workZone}>
                    {isLoading ? (
                        <View style={{ paddingVertical: SPACING.medium }}>
                            {[1, 2].map((i: number) => <SkeletonCard key={i} style={{ marginBottom: 16, height: 160, borderRadius: 0 }} />)}
                        </View>
                    ) : (
                        <View style={activityStyles.sectionBlock}>
                            <View style={activityStyles.sectionTitleRow}>
                                <Caption style={activityStyles.sectionTitle}>{sectionInfo.title.toUpperCase()}</Caption>
                                <View style={activityStyles.sectionCountPill}>
                                    <Caption style={activityStyles.sectionCountText}>{currentList.length}</Caption>
                                </View>
                            </View>
                            <BodySmall style={activityStyles.sectionSubtitle}>{sectionInfo.subtitle}</BodySmall>

                            {/* Render Logic - Handles both Request[] and Offer[] (if artist) */}
                            {/* For Artist "Waiting" (Open Briefs), we use MyRequestsFeed which expects Requests. */}
                            {/* For Artist "Offers" (My Offers), we render OfferSummaryCard manually or create a new feed component. */}

                            {isUserMode || activeStep === 0 ? (
                                <MyRequestsFeed
                                    requests={currentList as Request[]}
                                    userRole={isUserMode ? "customer" : "artist"}
                                    onLocalStatusChange={onLocalStatusChange}
                                    onModalStateChange={handleModalStateChange}
                                    emptyVariant="none"
                                />
                            ) : (
                                // Render Offers List for Artist (activeStep > 0)
                                <View style={{ gap: 12 }}>
                                    {(currentList as any[]).map((o) => (
                                        <View key={o.id} style={activityStyles.offerSummaryCard}>
                                            <View style={activityStyles.offerSummaryTop}>
                                                <Caption style={activityStyles.offerSummaryOverline}>OFFER #{o.id}</Caption>
                                                <Caption style={activityStyles.offerSummaryOverline}>{o.status}</Caption>
                                            </View>
                                            <View style={activityStyles.offerSummaryBottom}>
                                                <Title style={activityStyles.offerSummaryPrice}>${o.price}</Title>
                                                <Caption style={activityStyles.offerSummaryMeta}>{o.delivery_days} days</Caption>
                                            </View>
                                        </View>
                                    ))}
                                </View>
                            )}

                            {currentList.length === 0 && (
                                <Caption style={activityStyles.inlineEmpty}>Nothing here yet.</Caption>
                            )}
                        </View>
                    )}
                </View>

                {/* Create Brief - Moved to separate dedicated flow */}
            </ScrollView>
        </AppShell>
    );
};

// =============================================================================
// Styles
// =============================================================================

const activityStyles = StyleSheet.create({
    // Main container - Page Background Layer (Midnight Gallery)
    container: {
        backgroundColor: COLORS.background.primary,
    },
    scrollContent: {
        flexGrow: 1,
        paddingBottom: SPACING.xxl,
    },

    // Updating indicator
    updatingIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: SPACING.small,
        gap: SPACING.small,
    },
    updatingDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: COLORS.accent.primary,
        opacity: 0.6,
    },
    updatingText: {
        fontSize: 10,
        letterSpacing: 2,
        color: COLORS.text.tertiary,
        textTransform: 'uppercase',
    },

    // Context Zone - Mode banner
    contextZone: {
        paddingTop: SPACING.xl,
        paddingBottom: SPACING.xl,
        paddingHorizontal: SPACING.large,
        marginBottom: SPACING.medium,
    },
    modeBanner: {
        backgroundColor: 'rgba(255, 255, 255, 0.02)',
        borderRadius: 0,
        padding: SPACING.large,
        borderLeftWidth: 2,
        borderLeftColor: COLORS.accent.primary,
    },
    modeOverline: {
        fontSize: 9,
        letterSpacing: 3,
        color: COLORS.accent.primary,
        marginBottom: 8,
        textTransform: 'uppercase',
        fontWeight: '600',
    },
    modeTitle: {
        fontSize: 32,
        lineHeight: 40,
        fontWeight: '300',
        letterSpacing: -0.5,
        color: COLORS.text.primary,
        marginBottom: 8,
        textTransform: 'none',
    },
    modeSubtitle: {
        color: COLORS.text.secondary,
        lineHeight: 22,
        opacity: 0.7,
        fontWeight: '300',
        fontSize: 14,
    },

    // Status Overview - Dashboard stats
    statusOverviewContainer: {
        paddingHorizontal: SPACING.large,
        paddingVertical: SPACING.medium,
        gap: 12,
        flexDirection: 'row',
        marginBottom: SPACING.large,
    },
    statusOverviewCard: {
        flex: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.02)',
        borderRadius: 12,
        paddingVertical: 16,
        paddingHorizontal: 12,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 80,
    },
    statusOverviewCardSelected: {
        backgroundColor: 'rgba(212, 175, 55, 0.08)',
        borderColor: 'rgba(212, 175, 55, 0.3)',
    },
    statusOverviewContent: {
        alignItems: 'center',
        gap: 6,
    },
    statusOverviewCount: {
        fontSize: 20,
        fontWeight: '400',
        color: COLORS.text.secondary,
        letterSpacing: -0.5,
    },
    statusOverviewCountSelected: {
        color: COLORS.accent.primary,
        fontWeight: '600',
    },
    statusOverviewTitle: {
        fontSize: 8,
        letterSpacing: 1.5,
        textTransform: 'uppercase',
        color: COLORS.text.tertiary,
        fontWeight: '600',
        opacity: 0.7,
    },
    statusOverviewTitleSelected: {
        color: COLORS.accent.primary,
        opacity: 1,
    },
    activeGlowDot: {
        position: 'absolute',
        bottom: 8,
        width: 3,
        height: 3,
        borderRadius: 1.5,
        backgroundColor: COLORS.accent.primary,
        shadowColor: COLORS.accent.primary,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 4,
    },

    // Work Zone
    workZone: {
        paddingHorizontal: SPACING.large,
        paddingTop: SPACING.small,
        paddingBottom: SPACING.xl,
    },
    overline: {
        fontSize: 10,
        letterSpacing: 3,
        color: COLORS.accent.primary,
        marginBottom: 8,
        textTransform: 'uppercase',
    },

    // Sections
    sectionsStack: {
        gap: SPACING.xxl,
    },
    sectionBlock: {
        marginBottom: SPACING.xl,
    },
    sectionTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
        paddingHorizontal: 4,
    },
    sectionTitle: {
        fontSize: 10,
        letterSpacing: 2,
        color: COLORS.text.tertiary,
        textTransform: 'uppercase',
        fontWeight: '600',
    },
    sectionCountPill: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
    },
    sectionCountText: {
        fontSize: 10,
        color: COLORS.text.secondary,
        fontWeight: '600',
    },
    sectionSubtitle: {
        color: COLORS.text.tertiary,
        opacity: 0.8,
        lineHeight: 20,
        marginBottom: 20,
        fontSize: 13,
        paddingHorizontal: 4,
    },
    inlineEmpty: {
        color: COLORS.text.tertiary,
        fontSize: 12,
        paddingTop: SPACING.large,
        textAlign: 'center',
        opacity: 0.5,
        fontStyle: 'italic',
    },

    // Artist: offers summary cards
    offerSummaryCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.08)',
        padding: SPACING.large,
        borderRadius: 12,
        marginBottom: SPACING.medium,
        borderLeftWidth: 2,
        borderLeftColor: COLORS.accent.success,
    },
    offerSummaryTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    offerSummaryOverline: {
        fontSize: 9,
        letterSpacing: 2.5,
        textTransform: 'uppercase',
        color: COLORS.accent.success,
        fontWeight: '600',
    },
    offerSummaryBottom: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'baseline',
    },
    offerSummaryPrice: {
        fontSize: 24,
        fontWeight: '300',
        color: COLORS.text.primary,
        textTransform: 'none',
        letterSpacing: -0.5,
    },
    offerSummaryMeta: {
        fontSize: 10,
        letterSpacing: 1.5,
        color: COLORS.text.secondary,
        textTransform: 'uppercase',
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: SPACING.large,
        gap: SPACING.medium,
        paddingHorizontal: 4,
    },
    sectionLabel: {
        letterSpacing: 2,
        color: COLORS.text.tertiary,
        fontSize: 10,
        textTransform: 'uppercase',
        fontWeight: '600',
    },
    goldDivider: {
        flex: 1,
        height: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },

    // LUXURY REQUEST CARD (New Design)
    simpleCard: {
        backgroundColor: '#0F1115',
        borderRadius: 4,
        marginBottom: 16,
        overflow: 'hidden',
        flexDirection: 'row',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.06)',
    },
    cardAccentStrip: {
        width: 3,
        height: '100%',
        opacity: 0.8,
    },
    cardContentPadding: {
        flex: 1,
        padding: 20,
    },
    cardTopRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    statusRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    statusDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    simpleCardTitle: {
        fontSize: 18,
        lineHeight: 26,
        fontWeight: '300',
        letterSpacing: -0.3,
        color: COLORS.text.primary,
        marginBottom: 8,
    },
    cardMetaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 20,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255, 255, 255, 0.05)',
    },
    metaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    simpleMetaText: {
        fontSize: 11,
        color: COLORS.text.tertiary,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    metaDivider: {
        width: 1,
        height: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        marginHorizontal: 12,
    },
    budgetBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.08)',
    },
    budgetRange: {
        fontSize: 11,
        color: COLORS.accent.primary,
        fontWeight: '600',
        letterSpacing: 0.5,
    },
    simpleActionText: {
        fontSize: 10,
        color: COLORS.accent.primary,
        letterSpacing: 1,
        textTransform: 'uppercase',
        fontWeight: '600',
    },
    miniActionBtn: {
        marginLeft: 'auto',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingVertical: 4,
    },

    // Legacy/Unused (kept for safety if referred elsewhere)
    simpleActionButton: { display: 'none' },
    statusPill: { display: 'none' },
    statusIndicator: { display: 'none' },
    simpleMetaChip: { display: 'none' },

    // Timeline
    timelineSection: { marginTop: SPACING.large },
    timelineContainer: { paddingTop: SPACING.medium },
    timelineHeader: { marginBottom: SPACING.large },
    timelineOverline: { fontSize: 10, letterSpacing: 2, color: COLORS.text.tertiary, marginBottom: 4 },
    timelineTitle: { fontSize: 20, fontWeight: '300' },
    timeline: { paddingLeft: 4 },
    milestoneRow: { flexDirection: 'row', minHeight: 64, gap: SPACING.medium },
    indicatorCol: { alignItems: 'center', width: 14 },
    connector: { width: 1, flex: 1, backgroundColor: 'rgba(255, 255, 255, 0.1)', marginVertical: 4 },
    contentCol: { flex: 1, paddingBottom: SPACING.large },
    milestoneHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    date: { fontSize: 11, color: COLORS.text.tertiary },
    actionCard: {
        marginTop: SPACING.medium,
        backgroundColor: 'rgba(212, 175, 55, 0.03)',
        padding: SPACING.large,
        borderRadius: 4,
        borderWidth: 1,
        borderColor: 'rgba(212, 175, 55, 0.15)',
        borderLeftWidth: 2,
        borderLeftColor: COLORS.accent.primary,
    },
    timelineViewBtn: { marginTop: SPACING.small },
    timelineFooter: { marginTop: SPACING.medium, borderTopWidth: 1, borderTopColor: 'rgba(255, 255, 255, 0.05)', paddingTop: SPACING.large },
    buttonRow: { flexDirection: 'row', gap: SPACING.medium },
    revisionBtn: { flex: 1, height: 52, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORS.text.tertiary },
    approveBtn: { flex: 1.5, height: 52 },
    chatEntry: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.medium,
        backgroundColor: 'rgba(255, 255, 255, 0.04)',
        padding: SPACING.large,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.08)',
    },
    premiumAction: {
        backgroundColor: COLORS.accent.primary,
        height: 48,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 2,
    },
    premiumActionSecondary: {
        backgroundColor: 'rgba(255, 255, 255, 0.02)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.08)',
    },
    premiumActionText: {
        color: COLORS.background.primary,
        fontSize: 13,
        letterSpacing: 1.5,
        textTransform: 'uppercase',
    },
    premiumActionTextSecondary: {
        color: COLORS.text.primary,
    },

    // Offers Section
    offersSection: {
        marginTop: SPACING.large,
        paddingTop: SPACING.large,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255, 255, 255, 0.05)',
    },
    sortTabs: {
        flexDirection: 'row',
        marginBottom: SPACING.large,
        gap: 8,
    },
    sortTab: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        backgroundColor: 'rgba(255, 255, 255, 0.02)',
    },
    sortTabActive: {
        backgroundColor: 'rgba(212, 175, 55, 0.1)',
        borderColor: COLORS.accent.primary,
    },
    sortTabText: {
        fontSize: 11,
        color: COLORS.text.tertiary,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    sortTabTextActive: {
        color: COLORS.accent.primary,
        fontWeight: '600',
    },
    offersList: {
        gap: SPACING.medium,
    },
    loadingText: {
        paddingVertical: 40,
        textAlign: 'center',
        color: COLORS.text.tertiary,
        fontStyle: 'italic',
    },
    emptyOffers: {
        paddingVertical: 40,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)',
        borderStyle: 'dashed',
        borderRadius: 12,
    },

    // Offer Card
    offerContainer: {
        marginBottom: 16,
    },
    offerCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        borderRadius: 12,
        padding: 20,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.08)',
    },
    topRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 16,
    },
    artistSection: {
        flexDirection: 'row',
        gap: 12,
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#2A2A2A',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    avatarPlaceholder: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#1A1A1A',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    artistName: {
        fontSize: 15,
        color: COLORS.text.primary,
        fontWeight: '500',
    },
    artistMetrics: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 2,
        gap: 6,
    },
    metricText: {
        fontSize: 10,
        color: COLORS.text.tertiary,
    },
    separator: {
        width: 1,
        height: 8,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
    },
    priceSection: {
        alignItems: 'flex-end',
    },
    price: {
        fontSize: 18,
        color: COLORS.accent.primary,
        fontWeight: '600',
        letterSpacing: -0.5,
    },
    priceLabel: {
        fontSize: 9,
        color: COLORS.text.tertiary,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    messagePreview: {
        fontSize: 13,
        lineHeight: 20,
        color: COLORS.text.secondary,
        marginBottom: 16,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.05)',
    },
    offerActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    detailsRow: {
        flexDirection: 'row',
        gap: 16,
    },
    detailItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    detailText: {
        fontSize: 11,
        color: COLORS.text.tertiary,
    },
    premiumViewBtn: {
        paddingVertical: 6,
        paddingHorizontal: 16,
        borderWidth: 1,
        borderColor: COLORS.accent.primary,
        borderRadius: 4,
        backgroundColor: 'rgba(212, 175, 55, 0.05)',
    },

    // Offer Modal (Details)
    offerModalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.85)',
        justifyContent: 'flex-end',
    },
    offerModal: {
        backgroundColor: '#0F1115',
        height: '90%',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 0,
        overflow: 'hidden',
    },
    offerModalHeader: {
        padding: 24,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.05)',
    },
    offerModalOverline: {
        fontSize: 10,
        color: COLORS.text.tertiary,
        letterSpacing: 2,
        textTransform: 'uppercase',
        marginBottom: 8,
    },
    offerModalTitle: {
        fontSize: 24,
        color: COLORS.text.primary,
        fontWeight: '300',
        letterSpacing: -0.5,
    },
    offerCloseButton: {
        position: 'absolute',
        top: 24,
        right: 24,
        padding: 8,
    },
    offerModalContent: {
        flex: 1,
        padding: 24,
    },
    offerArtistSection: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        marginBottom: 32,
    },
    offerArtistMeta: {
        flex: 1,
    },
    offerArtistName: {
        fontSize: 20,
        color: COLORS.text.primary,
        marginBottom: 4,
    },
    offerRatingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    offerPricingGrid: {
        flexDirection: 'row',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 12,
        marginBottom: 32,
        backgroundColor: 'rgba(255, 255, 255, 0.02)',
    },
    offerPriceItem: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 16,
    },
    offerGridBorder: {
        borderRightWidth: 1,
        borderRightColor: 'rgba(255, 255, 255, 0.1)',
    },
    offerGridLabel: {
        fontSize: 10,
        color: COLORS.text.tertiary,
        letterSpacing: 1,
        textTransform: 'uppercase',
        marginBottom: 4,
    },
    offerGridValue: {
        fontSize: 16,
        color: COLORS.text.primary,
        fontWeight: '600',
    },
    offerModalSection: {
        marginBottom: 32,
    },
    offerSectionLabel: {
        fontSize: 12,
        color: COLORS.accent.primary,
        letterSpacing: 2,
        textTransform: 'uppercase',
        marginBottom: 12,
        fontWeight: '600',
    },
    offerMessage: {
        fontSize: 15,
        color: COLORS.text.secondary,
        lineHeight: 24,
    },
    offerGuaranteeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        padding: 16,
        backgroundColor: 'rgba(212, 175, 55, 0.05)',
        borderRadius: 8,
        marginBottom: 24,
    },
    offerModalFooter: {
        padding: 24,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255, 255, 255, 0.05)',
        backgroundColor: '#0F1115',
    },
    premiumHireBtn: {
        backgroundColor: COLORS.accent.primary,
        height: 56,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 2,
    },
    premiumHireBtnText: {
        color: '#000',
        fontSize: 14,
        fontWeight: '600',
        letterSpacing: 1,
        textTransform: 'uppercase',
    },
    offerFooterNote: {
        fontSize: 10,
        color: COLORS.text.tertiary,
        textAlign: 'center',
        marginTop: 12,
    },

    // Form Selection Modal (Keep similar to Offer Modal)
    formSelectionModalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        justifyContent: 'flex-end',
    },
    formSelectionModalSheet: {
        backgroundColor: '#1A1A1A',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        maxHeight: '80%',
    },
    formSelectionModalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    formSelectionModalTitle: {
        fontSize: 20,
        color: COLORS.text.primary,
        fontWeight: '300',
        letterSpacing: -0.5,
    },
    formSelectionModalList: {
        paddingBottom: 40,
    },
    formSelectionModalItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.05)',
    },
    formSelectionModalItemActive: {
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
    },
    selectedDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: COLORS.accent.primary,
    },

    // Create Order Form
    formContainer: {
        paddingTop: 0,
    },
    createFormHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        marginBottom: 32,
    },
    stepTitle: {
        fontSize: 24,
        color: COLORS.text.primary,
        fontWeight: '300',
        letterSpacing: -0.5,
    },
    qualityMeter: {
        alignItems: 'flex-end',
    },
    qualityLabel: {
        fontSize: 9,
        color: COLORS.text.tertiary,
        letterSpacing: 1,
        textTransform: 'uppercase',
        marginBottom: 4,
    },
    qualityPill: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
    qualityText: {
        fontSize: 10,
        color: COLORS.text.primary,
        fontWeight: '600',
    },
    formContent: {
        minHeight: 300,
    },
    stepContent: {
        gap: 24,
    },
    fieldContainer: {
        marginBottom: 0,
    },
    fieldLabel: {
        fontSize: 11,
        color: COLORS.text.tertiary,
        letterSpacing: 1.5,
        textTransform: 'uppercase',
        marginBottom: 8,
    },
    selectField: {
        height: 56,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 8,
        paddingHorizontal: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: 'rgba(255, 255, 255, 0.02)',
    },
    selectFieldFocused: {
        borderColor: COLORS.accent.primary,
        backgroundColor: 'rgba(212, 175, 55, 0.05)',
    },
    selectFieldFilled: {
        borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    selectRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    editorialInput: {
        backgroundColor: 'rgba(255, 255, 255, 0.02)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 8,
        padding: 16,
        fontSize: 15,
        color: COLORS.text.primary,
        minHeight: 56,
    },
    label: {
        fontSize: 11,
        color: COLORS.text.tertiary,
        letterSpacing: 1.5,
        textTransform: 'uppercase',
        marginBottom: 8,
    },
    row: {
        flexDirection: 'row',
        gap: 16,
    },
    uploadCard: {
        height: 100,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderStyle: 'dashed',
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.02)',
    },
    imageScroll: {
        marginTop: 16,
    },
    imageWrapper: {
        marginRight: 12,
        position: 'relative',
    },
    prevImg: {
        width: 64,
        height: 64,
        borderRadius: 4,
    },
    finalNote: {
        marginTop: 24,
        fontSize: 13,
        color: COLORS.text.tertiary,
        textAlign: 'center',
        lineHeight: 20,
    },
    formFooter: {
        flexDirection: 'row',
        gap: 16,
        marginTop: 40,
    },
    backButton: {
        width: 56,
        height: 56,
        borderRadius: 28,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    actionBtn: {
        flex: 1,
        height: 56,
        borderRadius: 28,
        backgroundColor: COLORS.accent.primary,
        alignItems: 'center',
        justifyContent: 'center',
    },

    // Feed Layout
    feedContainer: {
        flex: 1,
    },
    emptyContainer: {
        padding: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyIconCircle: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    emptyTitle: {
        fontSize: 18,
        color: COLORS.text.primary,
        marginBottom: 8,
    },
    emptyText: {
        fontSize: 14,
        color: COLORS.text.tertiary,
        textAlign: 'center',
        lineHeight: 22,
    },
    cueArrow: {
        marginTop: 32,
        opacity: 0.5,
    },

    // Structure
    separatorZone: {
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    zoneDivider: {
        width: '100%',
        height: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
    creationZone: {
        paddingTop: 40,
    },
    bottomFormHeader: {
        marginBottom: 32,
        paddingHorizontal: SPACING.large,
    },
    formTitle: {
        fontSize: 28,
        fontWeight: '300',
        color: COLORS.text.primary,
        marginBottom: 8,
    },
    formCard: {
        backgroundColor: '#121418',
        borderRadius: 16,
        padding: 24,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)',
    },

    // Send Offer Modal (Artist Side)
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.85)',
    },
    modalSheet: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    modalSheetInner: {
        backgroundColor: '#0F1115',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: '90%',
        borderTopWidth: 1,
        borderTopColor: 'rgba(212, 175, 55, 0.1)',
    },
    modalScrollContent: {
        paddingBottom: 40,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 24,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.05)',
    },
    modalOverline: {
        fontSize: 10,
        color: COLORS.accent.primary,
        letterSpacing: 2,
        textTransform: 'uppercase',
        marginBottom: 4,
    },
    modalTitle: {
        fontSize: 24,
        color: COLORS.text.primary,
        fontWeight: '300',
    },
    closeBtn: {
        width: 32,
        height: 32,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 16,
    },
    modalBody: {
        padding: 24,
        gap: 24,
    },
    modalHero: {
        padding: 16,
        backgroundColor: 'rgba(212, 175, 55, 0.05)',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(212, 175, 55, 0.1)',
    },
    modalHeroOverline: {
        fontSize: 10,
        color: COLORS.text.tertiary,
        letterSpacing: 2,
        textTransform: 'uppercase',
        marginBottom: 8,
    },
    modalHeroTitle: {
        fontSize: 18,
        color: COLORS.text.primary,
        marginBottom: 12,
    },
    modalHeroMetaRow: {
        flexDirection: 'row',
        gap: 8,
    },
    modalHeroChip: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 4,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    modalHeroChipText: {
        fontSize: 11,
        color: COLORS.text.secondary,
    },
    offerFormCard: {
        gap: 24,
    },
    offerFormHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    offerFormOverline: {
        fontSize: 11,
        color: COLORS.text.tertiary,
        letterSpacing: 1.5,
        textTransform: 'uppercase',
    },
    offerFormHint: {
        fontSize: 10,
        color: COLORS.accent.primary,
    },
    offerFormRow: {
        flexDirection: 'row',
        gap: 16,
    },
    offerFormField: {
        flex: 1,
        gap: 8,
    },
    offerLabel: {
        fontSize: 11,
        color: COLORS.text.secondary,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    offerInputShell: {
        height: 52,
        backgroundColor: 'rgba(255, 255, 255, 0.02)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 8,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
    },
    offerPrefix: {
        color: COLORS.text.tertiary,
        marginRight: 4,
        fontSize: 16,
    },
    offerInput: {
        flex: 1,
        color: COLORS.text.primary,
        fontSize: 16,
    },
    segmented: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 8,
        padding: 2,
    },
    segment: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        borderRadius: 6,
    },
    segmentActive: {
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
    segmentText: {
        fontSize: 12,
        color: COLORS.text.tertiary,
    },
    segmentTextActive: {
        color: COLORS.text.primary,
        fontWeight: '600',
    },
    revisionsRow: {
        height: 60,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: 'rgba(255, 255, 255, 0.02)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 8,
        paddingHorizontal: 16,
    },
    revisionStepperBtn: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    revisionStepperValue: {
        alignItems: 'center',
    },
    revisionValueText: {
        fontSize: 18,
        color: COLORS.text.primary,
        fontWeight: '600',
    },
    revisionValueSub: {
        fontSize: 9,
        color: COLORS.text.tertiary,
        textTransform: 'uppercase',
    },
    offerTextarea: {
        backgroundColor: 'rgba(255, 255, 255, 0.02)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 8,
        padding: 16,
        color: COLORS.text.primary,
        minHeight: 100,
        textAlignVertical: 'top',
    },
    modalFooter: {
        padding: 24,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255, 255, 255, 0.05)',
        gap: 16,
    },
    footerOverline: {
        fontSize: 10,
        color: COLORS.text.tertiary,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    footerSummary: {
        fontSize: 14,
        color: COLORS.text.primary,
        fontWeight: '500',
    },
    footerHint: {
        fontSize: 11,
        color: COLORS.text.tertiary,
    },

    // New Luxury Card Styles
    orderCard: {
        backgroundColor: '#0F1115',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.08)',
        marginBottom: 20,
        overflow: 'hidden',
    },
    orderHeader: {
        flexDirection: 'row',
        padding: 16,
        alignItems: 'center',
    },
    orderThumbWrapper: {
        position: 'relative',
    },
    orderThumb: {
        width: 48,
        height: 48,
        borderRadius: 4,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#1A1A1A',
    },
    statusBadge: {
        position: 'absolute',
        bottom: -6,
        left: -6,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        borderWidth: 1,
        borderColor: '#0F1115', // blend with bg
    },
    orderTitle: {
        fontSize: 16,
        fontWeight: '400',
        color: COLORS.text.primary,
        marginBottom: 2,
    },
    orderDate: {
        fontSize: 11,
        color: COLORS.text.tertiary,
    },
    viewBtn: {
        paddingVertical: 6,
        paddingHorizontal: 12,
        backgroundColor: 'rgba(212, 175, 55, 0.05)',
        borderRadius: 4,
        borderWidth: 1,
        borderColor: 'rgba(212, 175, 55, 0.2)',
    },
    stepperWrapper: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        backgroundColor: 'rgba(255, 255, 255, 0.02)',
        borderTopWidth: 1,
        borderTopColor: 'rgba(255, 255, 255, 0.05)',
    },
    stepperContainer: {
        paddingHorizontal: 16,
        paddingBottom: 4,
    },
    cardFooter: {
        backgroundColor: 'rgba(255, 255, 255, 0.02)',
        padding: 12,
        paddingHorizontal: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: 'rgba(255, 255, 255, 0.05)',
    },

});

export default ActivityPage;
