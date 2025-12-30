import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { View, ScrollView, StyleSheet, RefreshControl, TouchableOpacity, Modal, Pressable, Alert, TextInput, KeyboardAvoidingView, Platform, Keyboard, Image, TextStyle } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Title, Body, Caption, SkeletonCard, PrimaryButton, BodySmall, AppShell, AppHeader } from '../components';
import { useMyRequests, useCreateRequest } from '../hooks/useRequests';
import { COLORS, SPACING, SHADOWS, BORDER_RADIUS } from '../theme';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { Request, RequestStatus, CreateRequestData } from '../types/api';
import Animated, { FadeInDown, Layout } from 'react-native-reanimated';
import { useLanguage } from '../contexts/LanguageContext';
import { getFlexDirection, getTextAlign } from '../utils/direction';

// Arabic Typography Configuration
const ARABIC_FONT_FAMILY = Platform.OS === 'ios' ? 'Tajawal' : 'sans-serif-medium';
const LATIN_FONT_FAMILY = 'System'; // Or your luxury font

// Typography utilities for RTL support
const getTypographyStyle = (isRTL: boolean, fontSize: number, isHeadline: boolean = false): TextStyle => {
    if (isRTL) {
        // Arabic typography rules
        return {
            fontFamily: ARABIC_FONT_FAMILY,
            fontSize,
            fontWeight: isHeadline ? ('600' as TextStyle['fontWeight']) : ('400' as TextStyle['fontWeight']), // Slightly heavier for Arabic headlines
            lineHeight: fontSize * 1.3, // More breathing room for Arabic
            letterSpacing: 0, // No tracking for Arabic
            textTransform: 'none' as const, // No uppercase for Arabic
            includeFontPadding: true, // Android fix
            textAlign: 'right' as const,
        };
    } else {
        // Latin typography rules
        return {
            fontFamily: LATIN_FONT_FAMILY,
            fontSize,
            fontWeight: isHeadline ? ('700' as TextStyle['fontWeight']) : ('500' as TextStyle['fontWeight']),
            lineHeight: isHeadline ? fontSize * 1.1 : fontSize * 1.2,
            letterSpacing: isHeadline ? 1.5 : 0, // Luxury tracking for headlines
            textTransform: isHeadline ? ('uppercase' as const) : ('none' as const),
            includeFontPadding: false,
            textAlign: 'left' as const,
        };
    }
};

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
    {
        id: 103,
        customer_id: 1,
        title: 'Abstract Landscape',
        category: 'Landscape',
        medium: 'Oil',
        description: 'Bold abstract interpretation of natural landscapes with dramatic color contrasts.',
        style: 'Abstract Expressionism',
        deadline: '21 days',
        budget_min: 600,
        budget_max: 1200,
        usage_rights: 'personal',
        delivery_format: 'physical',
        status: 'delivered',
        created_at: nowIso(),
        updated_at: nowIso(),
        offers_count: 8,
        reference_images: [],
    },
];

// =============================================================================
// Internal Components for Activity User Page
// =============================================================================

interface MyRequestsFeedProps {
    requests: Request[];
    userRole: 'customer';
    bucketType?: 'waiting' | 'offers' | 'progress' | 'delivered' | 'history';
    onLocalStatusChange?: (requestId: number, status: RequestStatus) => void;
    onModalStateChange?: (isOpen: boolean) => void;
    emptyVariant?: 'full' | 'none';
}

const MyRequestsFeed: React.FC<MyRequestsFeedProps> = ({ requests, userRole, bucketType, onLocalStatusChange, onModalStateChange, emptyVariant = 'full' }: MyRequestsFeedProps) => {
    const { t, isRTL } = useLanguage();
    const headlineTypography = getTypographyStyle(isRTL, 11, true);
    const bodyTypography = getTypographyStyle(isRTL, 14, false);
    const activityT = useCallback((key: string, options?: Record<string, unknown>) => t(`activity:${key}`, options), [t]);
    if (requests.length === 0) {
        if (emptyVariant === 'none') return null;
        const emptyTitle = activityT('empty.default.title');
        const emptyText = activityT('empty.default.text');
        return (
            <View style={activityStyles.emptyContainer}>
                <View style={activityStyles.emptyIconCircle}>
                    <Ionicons
                        name="document-text-outline"
                        size={28}
                        color={COLORS.accent.primary}
                    />
                </View>
                <Title style={[activityStyles.emptyTitle, headlineTypography, { textAlign: 'center' }]}>
                    {emptyTitle}
                </Title>
                <Body style={[activityStyles.emptyText, bodyTypography, { textAlign: 'center' }]}>
                    {emptyText}
                </Body>
            </View>
        );
    }

    return (
        <View style={activityStyles.feedContainer}>
            {requests.map((request: Request) => (
                <RequestCard key={request.id} request={request} userRole={userRole} bucketType={bucketType} onLocalStatusChange={onLocalStatusChange} onModalStateChange={onModalStateChange} />
            ))}
        </View>
    );
};

interface RequestCardProps {
    request: Request;
    userRole: 'customer';
    bucketType?: 'waiting' | 'offers' | 'progress' | 'delivered' | 'history';
    onLocalStatusChange?: (requestId: number, status: RequestStatus) => void;
    onModalStateChange?: (isOpen: boolean) => void;
}

const RequestCard: React.FC<RequestCardProps> = ({ request, userRole, bucketType, onLocalStatusChange, onModalStateChange }: RequestCardProps) => {
    const [showDetails, setShowDetails] = useState(false);
    const { t, isRTL } = useLanguage();
    const activityT = useCallback(
        (key: string, options?: Record<string, unknown>) => t(`activity:${key}`, options),
        [t]
    );

    const statusColor = useMemo(() => {
        switch (request.status) {
            case 'draft': return COLORS.text.tertiary;
            case 'open': return request.offers_count > 0 ? COLORS.accent.secondary : COLORS.accent.warning;
            case 'in_progress': return COLORS.accent.primary;
            case 'delivered': return COLORS.accent.success;
            case 'cancelled': return COLORS.accent.danger;
            default: return COLORS.text.secondary;
        }
    }, [request.status, request.offers_count]);

    const statusText = useMemo(() => {
        switch (request.status) {
            case 'draft': return activityT('status.draft');
            case 'open':
                return request.offers_count > 0
                    ? activityT('status.offers', { count: request.offers_count })
                    : activityT('status.waiting');
            case 'in_progress': return activityT('status.in_progress');
            case 'delivered': return activityT('status.delivered');
            case 'cancelled': return activityT('status.cancelled');
            default: return request.status;
        }
    }, [request.status, request.offers_count, activityT]);

    const handlePress = useCallback(() => {
        setShowDetails(!showDetails);
    }, [showDetails]);
    const requestCardTitleTypography = getTypographyStyle(isRTL, 18, false);

    return (
        <TouchableOpacity
            style={activityStyles.requestCard}
            onPress={handlePress}
            activeOpacity={0.9}
        >
            <View style={activityStyles.requestCardHeader}>
                <View style={activityStyles.requestCardTitleRow}>
                    <View style={activityStyles.titleContainer}>
                        <BodySmall style={activityStyles.requestCardCategory}>
                            {(request.category || 'General').toUpperCase()} • {(request.medium || 'Mixed Media').toUpperCase()}
                        </BodySmall>
                        <Title style={[activityStyles.requestCardTitle, requestCardTitleTypography]} numberOfLines={1}>
                            {request.title}
                        </Title>
                    </View>
                    <View style={[activityStyles.statusIndicator, { borderColor: statusColor, shadowColor: statusColor }]}>
                        <Caption style={[
                            activityStyles.statusText,
                            isRTL && activityStyles.rtlTextReset,
                            { color: statusColor }
                        ]}>{statusText}</Caption>
                    </View>
                </View>
            </View>

            <View style={activityStyles.requestCardContent}>
                <Body style={activityStyles.requestCardDescription} numberOfLines={showDetails ? undefined : 3}>
                    {request.description}
                </Body>

                {showDetails && (
                    <Animated.View entering={FadeInDown.duration(300)} style={activityStyles.requestCardDetails}>
                        <View style={activityStyles.divider} />
                        <View style={activityStyles.requestCardSpecs}>
                            <View style={activityStyles.specItem}>
                                <Caption style={activityStyles.specLabel}>DIMENSIONS</Caption>
                                <BodySmall style={activityStyles.specValue}>
                                    {request.dimensions_width} × {request.dimensions_height} {request.dimensions_unit}
                                </BodySmall>
                            </View>
                            <View style={activityStyles.specItem}>
                                <Caption style={activityStyles.specLabel}>BUDGET</Caption>
                                <BodySmall style={activityStyles.specValue}>
                                    ${request.budget_min} - ${request.budget_max}
                                </BodySmall>
                            </View>
                            <View style={activityStyles.specItem}>
                                <Caption style={activityStyles.specLabel}>DEADLINE</Caption>
                                <BodySmall style={activityStyles.specValue}>{request.deadline}</BodySmall>
                            </View>
                        </View>

                        <View style={activityStyles.requestCardActions}>
                            {bucketType === 'waiting' && (
                                <TouchableOpacity style={activityStyles.actionButton} onPress={() => { }}>
                                    <Ionicons name="pencil-outline" size={14} color={COLORS.text.primary} />
                                <BodySmall style={[
                                    activityStyles.actionButtonText,
                                    isRTL && activityStyles.rtlTextReset
                                ]}>{activityT('actions.editDetails')}</BodySmall>
                                </TouchableOpacity>
                            )}
                            {bucketType === 'offers' && (
                                <TouchableOpacity style={[activityStyles.actionButton, activityStyles.primaryActionButton]} onPress={() => { }}>
                                    <Ionicons name="chatbubble-outline" size={14} color={COLORS.accent.primary} />
                                    <BodySmall style={[
                                        activityStyles.actionButtonText,
                                        isRTL && activityStyles.rtlTextReset,
                                        activityStyles.primaryActionText
                                    ]}>{activityT('actions.reviewOffers')}</BodySmall>
                                </TouchableOpacity>
                            )}
                            {bucketType === 'progress' && (
                                <TouchableOpacity style={[activityStyles.actionButton, activityStyles.primaryActionButton]} onPress={() => { }}>
                                    <Ionicons name="eye-outline" size={14} color={COLORS.accent.primary} />
                                    <BodySmall style={[
                                        activityStyles.actionButtonText,
                                        isRTL && activityStyles.rtlTextReset,
                                        activityStyles.primaryActionText
                                    ]}>{activityT('actions.viewProgress')}</BodySmall>
                                </TouchableOpacity>
                            )}
                            {bucketType === 'delivered' && (
                                <TouchableOpacity style={[activityStyles.actionButton, activityStyles.primaryActionButton]} onPress={() => { }}>
                                    <Ionicons name="checkmark-circle-outline" size={14} color={COLORS.accent.primary} />
                                    <BodySmall style={[
                                        activityStyles.actionButtonText,
                                        isRTL && activityStyles.rtlTextReset,
                                        activityStyles.primaryActionText
                                    ]}>{activityT('actions.reviewDelivery')}</BodySmall>
                                </TouchableOpacity>
                            )}
                            {bucketType === 'history' && (
                                <TouchableOpacity style={activityStyles.actionButton} onPress={() => { }}>
                                    <Ionicons name="refresh-outline" size={14} color={COLORS.text.primary} />
                                    <BodySmall style={[
                                        activityStyles.actionButtonText,
                                        isRTL && activityStyles.rtlTextReset
                                    ]}>{activityT('actions.reorder')}</BodySmall>
                                </TouchableOpacity>
                            )}
                            {(!bucketType || bucketType === 'waiting' || bucketType === 'offers') && (
                                <TouchableOpacity style={activityStyles.actionButton} onPress={() => { }}>
                                    <Ionicons name="eye-outline" size={14} color={COLORS.text.primary} />
                                    <BodySmall style={[
                                        activityStyles.actionButtonText,
                                        isRTL && activityStyles.rtlTextReset
                                    ]}>{activityT('actions.viewDetails')}</BodySmall>
                                </TouchableOpacity>
                            )}
                        </View>
                    </Animated.View>
                )}
            </View>

            <View style={activityStyles.requestCardFooter}>
                <Caption style={activityStyles.requestCardDate}>
                    POSTED ON {new Date(request.created_at).toLocaleDateString().toUpperCase()}
                </Caption>
                <View style={activityStyles.expandButton}>
                    <Ionicons
                        name={showDetails ? "chevron-up" : "chevron-down"}
                        size={16}
                        color={COLORS.accent.primary}
                    />
                </View>
            </View>
        </TouchableOpacity>
    );
};

interface CreateOrderFormProps {
    onSubmitted?: () => void;
}

interface SelectionModalProps {
    visible: boolean;
    onClose: () => void;
    title: string;
    label: string;
    options: string[];
    selectedValue: string;
    onSelect: (value: string) => void;
}

const SelectionModal: React.FC<SelectionModalProps> = ({
    visible,
    onClose,
    title,
    label,
    options,
    selectedValue,
    onSelect,
}: SelectionModalProps) => {
    const { isRTL } = useLanguage();
    return (
        <Modal visible={visible} transparent animationType="fade">
            <Pressable style={activityStyles.formSelectionModalOverlay} onPress={onClose}>
                <Pressable style={activityStyles.formSelectionModalSheet} onPress={() => { }}>
                    <View style={activityStyles.formSelectionModalHeader}>
                        <View>
                            <Caption style={[
                                activityStyles.overline,
                                isRTL && activityStyles.rtlTextReset
                            ]}>{label}</Caption>
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
};

const CreateOrderForm: React.FC<CreateOrderFormProps> = ({ onSubmitted }: CreateOrderFormProps) => {
    const createRequestMutation = useCreateRequest();
    const { t } = useLanguage();
    const activityT = useCallback(
        (key: string, options?: Record<string, unknown>) => t(`activity:${key}`, options),
        [t]
    );
    const [focusedField, setFocusedField] = useState<string | null>(null);
    const [modalConfig, setModalConfig] = useState<{ visible: boolean; title: string; label: string; field: keyof CreateRequestData; options: string[] }>({
        visible: false,
        title: '',
        label: '',
        field: 'category',
        options: [],
    });
    const scrollViewRef = useRef<ScrollView>(null);
    const widthInputRef = useRef<TextInput>(null);
    const heightInputRef = useRef<TextInput>(null);

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

    // Keyboard handling
    const [keyboardVisible, setKeyboardVisible] = useState(false);

    useEffect(() => {
        const keyboardDidShowListener = Keyboard.addListener(
            Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
            () => setKeyboardVisible(true)
        );
        const keyboardDidHideListener = Keyboard.addListener(
            Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
            () => setKeyboardVisible(false)
        );

        return () => {
            keyboardDidShowListener?.remove();
            keyboardDidHideListener?.remove();
        };
    }, []);

    const artTypes = ['Portrait', 'Pet', 'Landscape', 'Character', 'Abstract', 'Logo', 'Painting', 'Digital', 'Sketch', 'Other'];
    const artStyles = ['Realistic', 'Anime', 'Minimal', 'Abstract', 'Cartoon', 'Impressionist', 'Other'];
    const units = ['cm', 'in', 'px'];

    // Load draft
    useEffect(() => {
        const loadDraft = async () => {
            if (!USE_MOCK) return;
            try {
                const draft = await AsyncStorage.getItem('order_draft');
                if (draft) {
                    setFormData(JSON.parse(draft));
                }
            } catch (error) {
                console.log('Error loading draft:', error);
            }
        };
        loadDraft();
    }, []);

    // Save draft
    const saveDraft = useCallback(async (data: CreateRequestData) => {
        if (!USE_MOCK) return;
        try {
            await AsyncStorage.setItem('order_draft', JSON.stringify(data));
        } catch (error) {
            console.log('Error saving draft:', error);
        }
    }, []);

    const updateFormData = useCallback((updates: Partial<CreateRequestData>) => {
        setFormData(prev => {
            const newData = { ...prev, ...updates };
            saveDraft(newData);
            return newData;
        });
    }, [saveDraft]);

    const openModal = useCallback((field: keyof CreateRequestData, title: string, options: string[], label: string) => {
        setModalConfig({ visible: true, title, label, field, options });
    }, []);

    const closeModal = useCallback(() => {
        setModalConfig(prev => ({ ...prev, visible: false }));
    }, []);

    const handleModalSelect = useCallback((value: string) => {
        updateFormData({ [modalConfig.field]: value });
    }, [modalConfig.field, updateFormData]);

    const handleImagePick = useCallback(async () => {
        try {
            // Request permissions
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert(activityT('alerts.permissionTitle'), activityT('alerts.permissionMessage'));
                return;
            }

            // Launch image picker
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [4, 3],
                quality: 0.8,
            });

            if (!result.canceled && result.assets && result.assets.length > 0) {
                const selectedImage = result.assets[0];

                // Compress and resize the image
                const manipulatedImage = await ImageManipulator.manipulateAsync(
                    selectedImage.uri,
                    [{ resize: { width: 1200 } }],
                    { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
                );

                // Add to form data
                const currentImages = formData.reference_images || [];
                if (currentImages.length < 5) { // Limit to 5 images
                    updateFormData({
                        reference_images: [...currentImages, manipulatedImage.uri]
                    });
                } else {
                    Alert.alert(activityT('alerts.limitTitle'), activityT('alerts.limitMessage'));
                }
            }
        } catch (error) {
            console.error('Image picker error:', error);
            Alert.alert(t('common.error'), activityT('alerts.imageGeneric'));
        }
    }, [formData.reference_images, updateFormData]);

    const removeImage = useCallback((index: number) => {
        const currentImages = formData.reference_images || [];
        const updatedImages = currentImages.filter((_, i) => i !== index);
        updateFormData({ reference_images: updatedImages });
    }, [formData.reference_images, updateFormData]);

    const handleSubmit = useCallback(async () => {
        try {
            await createRequestMutation.mutateAsync(formData);
            await AsyncStorage.removeItem('order_draft'); // Clear draft on success
            Alert.alert(t('common.success'), activityT('alerts.requestSuccess'), [
                { text: t('common.ok'), onPress: () => onSubmitted?.() }
            ]);
        } catch (error) {
            Alert.alert(t('common.error'), activityT('alerts.requestError'));
        }
    }, [formData, createRequestMutation, onSubmitted]);

    const canSubmit = useMemo(() => {
        return formData.category &&
            formData.style &&
            formData.description.trim() &&
            formData.dimensions_width &&
            formData.dimensions_height;
    }, [formData]);

    const unitHint = useMemo(() => {
        const unit = formData.dimensions_unit ?? 'cm';
        return unit === 'px'
            ? activityT('form.unitHint.digital')
            : activityT('form.unitHint.print');
    }, [formData.dimensions_unit, activityT]);

    return (
        <KeyboardAvoidingView
            style={activityStyles.createOrderContainer}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 40 : 0}
        >
            <ScrollView
                ref={scrollViewRef}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={activityStyles.formScrollContent}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="interactive"
                automaticallyAdjustKeyboardInsets={true}
            >
                {/* Header Section */}
                <View style={activityStyles.formHeaderGroup}>
                    <View style={activityStyles.formRow}>
                        {/* Type of Art */}
                        <View style={activityStyles.formFieldHalf}>
                            <Caption style={activityStyles.formLabel}>{activityT('form.typeOfArt')}</Caption>
                            <TouchableOpacity
                                style={activityStyles.formSelect}
                        onPress={() =>
                            openModal(
                                'category',
                                activityT('form.modal.category'),
                                artTypes,
                                activityT('form.modalLabel.category')
                            )
                        }
                            >
                                <Body style={[activityStyles.formSelectText, !formData.category && activityStyles.formSelectPlaceholder]}>
                                    {formData.category || activityT('form.selectTypePlaceholder')}
                                </Body>
                                <Ionicons name="chevron-down" size={14} color={COLORS.text.tertiary} />
                            </TouchableOpacity>
                        </View>

                        {/* Style */}
                        <View style={activityStyles.formFieldHalf}>
                            <Caption style={activityStyles.formLabel}>{activityT('form.style')}</Caption>
                            <TouchableOpacity
                                style={activityStyles.formSelect}
                        onPress={() =>
                            openModal(
                                'style',
                                activityT('form.modal.style'),
                                artStyles,
                                activityT('form.modalLabel.style')
                            )
                        }
                            >
                                <Body style={[activityStyles.formSelectText, !formData.style && activityStyles.formSelectPlaceholder]}>
                                    {formData.style || activityT('form.selectStylePlaceholder')}
                                </Body>
                                <Ionicons name="chevron-down" size={14} color={COLORS.text.tertiary} />
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>

                {/* Main Details */}
                <View style={activityStyles.formGroup}>
                    <Caption style={activityStyles.formLabel}>{activityT('form.details')}</Caption>
                    <TextInput
                        style={[activityStyles.formTextarea, focusedField === 'description' && activityStyles.formTextareaFocused]}
                        value={formData.description}
                        onChangeText={(text) => updateFormData({ description: text })}
                        placeholder={activityT('form.placeholder')}
                        placeholderTextColor={COLORS.text.tertiary}
                        multiline
                        numberOfLines={8}
                        textAlignVertical="top"
                        returnKeyType="default"
                        blurOnSubmit={false}
                        onFocus={() => {
                            setFocusedField('description');
                            // Scroll to make textarea visible when keyboard appears
                            setTimeout(() => {
                                scrollViewRef.current?.scrollTo({ y: 200, animated: true });
                            }, 100);
                        }}
                        onBlur={() => setFocusedField(null)}
                    />
                </View>

                {/* Reference Images */}
                <View style={activityStyles.formGroup}>
                    <Caption style={activityStyles.formLabel}>{activityT('form.referenceImages')}</Caption>
                    <TouchableOpacity
                        style={activityStyles.imageUploadArea}
                        onPress={handleImagePick}
                        activeOpacity={0.8}
                    >
                        <View style={activityStyles.imageUploadContent}>
                            <Ionicons
                                name="images-outline"
                                size={24}
                                color={COLORS.accent.primary}
                                style={activityStyles.imageUploadIcon}
                            />
                            <BodySmall style={activityStyles.imageUploadText}>
                                {activityT('form.addReference')}
                            </BodySmall>
                            <BodySmall style={activityStyles.imageUploadSubtext}>
                                {activityT('form.referenceHint')}
                            </BodySmall>
                        </View>
                    </TouchableOpacity>

                    {/* Display selected images */}
                    {formData.reference_images && formData.reference_images.length > 0 && (
                        <View style={activityStyles.selectedImagesContainer}>
                            {formData.reference_images.map((imageUri, index) => (
                                <View key={index} style={activityStyles.imagePreviewContainer}>
                                    <Image
                                        source={{ uri: imageUri }}
                                        style={activityStyles.imagePreview}
                                        resizeMode="cover"
                                    />
                                    <TouchableOpacity
                                        style={activityStyles.imageRemoveButton}
                                        onPress={() => removeImage(index)}
                                        activeOpacity={0.8}
                                    >
                                        <Ionicons
                                            name="close-circle"
                                            size={20}
                                            color={COLORS.text.primary}
                                        />
                                    </TouchableOpacity>
                                </View>
                            ))}
                        </View>
                    )}
                </View>

                {/* Specs Row */}
                <View style={activityStyles.formGroup}>
                    <Caption style={activityStyles.formLabel}>{activityT('form.specifications')}</Caption>
                    <View style={activityStyles.formRow}>
                        {/* Width Input */}
                        <View style={activityStyles.formFieldThird}>
                            <Caption style={activityStyles.formSubLabel}>{activityT('form.width')}</Caption>
                            <View style={activityStyles.dimensionInputContainer}>
                                <TextInput
                                    ref={widthInputRef}
                                    style={[activityStyles.dimensionInput, focusedField === 'width' && activityStyles.dimensionInputFocused]}
                                    value={formData.dimensions_width?.toString() || ''}
                                    onChangeText={(text) => {
                                        const numValue = text ? parseInt(text) || undefined : undefined;
                                        updateFormData({ dimensions_width: numValue });
                                    }}
                                    placeholder="0"
                                    placeholderTextColor={COLORS.text.tertiary}
                                    keyboardType="numeric"
                                    maxLength={4}
                                    returnKeyType="next"
                                    blurOnSubmit={false}
                                    onFocus={() => setFocusedField('width')}
                                    onBlur={() => setFocusedField(null)}
                                    onSubmitEditing={() => {
                                        heightInputRef.current?.focus();
                                    }}
                                />
                            </View>
                        </View>

                        {/* Height Input */}
                        <View style={activityStyles.formFieldThird}>
                            <Caption style={activityStyles.formSubLabel}>{activityT('form.height')}</Caption>
                            <View style={activityStyles.dimensionInputContainer}>
                                <TextInput
                                    ref={heightInputRef}
                                    style={[activityStyles.dimensionInput, focusedField === 'height' && activityStyles.dimensionInputFocused]}
                                    value={formData.dimensions_height?.toString() || ''}
                                    onChangeText={(text) => {
                                        const numValue = text ? parseInt(text) || undefined : undefined;
                                        updateFormData({ dimensions_height: numValue });
                                    }}
                                    placeholder="0"
                                    placeholderTextColor={COLORS.text.tertiary}
                                    keyboardType="numeric"
                                    maxLength={4}
                                    returnKeyType="done"
                                    onFocus={() => setFocusedField('height')}
                                    onBlur={() => setFocusedField(null)}
                                    onSubmitEditing={() => {
                                        Keyboard.dismiss();
                                    }}
                                />
                            </View>
                        </View>

                        {/* Unit Selection */}
                        <View style={activityStyles.formFieldThird}>
                            <Caption style={activityStyles.formSubLabel}>{activityT('form.unit')}</Caption>
                            <TouchableOpacity
                                style={activityStyles.unitSelectContainer}
                                onPress={() =>
                                    openModal(
                                        'dimensions_unit',
                                        activityT('form.modal.unit'),
                                        units,
                                        activityT('form.modalLabel.unit')
                                    )
                                }
                            >
                                <Body style={activityStyles.unitSelectValue}>
                                    {(formData.dimensions_unit ?? 'cm').toUpperCase()}
                                </Body>
                            </TouchableOpacity>
                        </View>
                    </View>
                    {formData.dimensions_width && formData.dimensions_height && (
                        <BodySmall style={activityStyles.unitHint}>
                            {unitHint}
                        </BodySmall>
                    )}
                </View>
            </ScrollView>

            {/* Submit Button - Fixed at bottom right */}
            {!keyboardVisible && (
                <View style={activityStyles.formSubmitContainer}>
                    <PrimaryButton
                        title="Submit"
                        onPress={handleSubmit}
                        disabled={!canSubmit || createRequestMutation.isPending}
                        loading={createRequestMutation.isPending}
                        style={activityStyles.formSubmitButton}
                    />
                </View>
            )}

            <SelectionModal
                visible={modalConfig.visible}
                onClose={closeModal}
                title={modalConfig.title}
                label={modalConfig.label}
                options={modalConfig.options}
                selectedValue={formData[modalConfig.field] as string}
                onSelect={handleModalSelect}
            />
        </KeyboardAvoidingView>
    );
};

// =============================================================================
// Main ActivityUserPage Component
// =============================================================================

const ActivityUserPage = () => {
    const { t, isRTL } = useLanguage();
    const activityT = useCallback(
        (key: string, options?: Record<string, unknown>) => t(`activity:${key}`, options),
        [t]
    );
    const tabDirection = getFlexDirection(isRTL);
    const textAlignment = getTextAlign(isRTL);

    // Typography styles based on RTL
    const headlineTypography = getTypographyStyle(isRTL, 11, true);
    const titleTypography = getTypographyStyle(isRTL, 18, false);
    const bodyTypography = getTypographyStyle(isRTL, 14, false);
    const stepKeys = ['waiting', 'offers', 'progress', 'delivered'] as const;
    // =============================================================================
    // Tab State - 3 Tab System
    // =============================================================================
    const [activeTab, setActiveTab] = useState<'place' | 'orders' | 'history'>('orders');

    // =============================================================================
    // My Orders Stepper State - 4 Steps within My Orders tab
    // =============================================================================
    const [activeStep, setActiveStep] = useState<0 | 1 | 2 | 3>(0);

    // =============================================================================
    // Data Fetching - User Mode Only
    // =============================================================================
    const { data: myRequests, isLoading, isFetching, refetch } = useMyRequests(true);
    const [localStatus, setLocalStatus] = useState<Record<number, RequestStatus>>({});

    // Calculate filtered sections based on tab and stepper
    const sections = useMemo(() => {
        const all = USE_MOCK ? MOCK_MY_REQUESTS : (myRequests || []);
        const requests = all.map(r => ({ ...r, status: localStatus[r.id] || r.status }));

        // My Orders buckets (4 steps)
        const waiting = requests.filter(r =>
            r.status === 'open' && (r.offers_count || 0) === 0
        );

        const offers = requests.filter(r =>
            r.status === 'open' && (r.offers_count || 0) > 0
        );

        const progress = requests.filter(r =>
            ['hired', 'in_progress', 'pending_payment'].includes(r.status)
        );

        const delivered = requests.filter(r =>
            ['delivered', 'completed'].includes(r.status)
        );

        // History tab (completed/cancelled/refunded orders)
        const history = requests.filter(r =>
            ['cancelled', 'refunded'].includes(r.status)
        );

        return { waiting, offers, progress, delivered, history };
    }, [myRequests, localStatus]);

    const stepperTitles = useMemo(() => stepKeys.map(key => activityT(`stepper.titles.${key}`)), [activityT]);
    const stepperSubtitles = useMemo(() => stepKeys.map(key => activityT(`stepper.subtitles.${key}`)), [activityT]);
    const stepperLabels = useMemo(() => stepKeys.map(key => activityT(`stepper.labels.${key}`)), [activityT]);

    // Tab Configuration
    const tabs = [
        { key: 'place' as const, label: activityT('tab.place'), count: 0 },
        { key: 'orders' as const, label: activityT('tab.orders'), count: sections.waiting.length + sections.offers.length + sections.progress.length + sections.delivered.length },
        { key: 'history' as const, label: activityT('tab.history'), count: sections.history.length },
    ];

    // Current content based on active tab and stepper step
    const currentContent = useMemo<Request[]>(() => {
        switch (activeTab) {
            case 'place': return []; // Form handled separately
            case 'orders':
                switch (activeStep) {
                    case 0: return sections.waiting;
                    case 1: return sections.offers;
                    case 2: return sections.progress;
                    case 3: return sections.delivered;
                    default: return [];
                }
            case 'history': return sections.history;
            default: return [];
        }
    }, [activeTab, activeStep, sections]);

    // Section info for headers
    const sectionInfo = useMemo(() => {
        switch (activeTab) {
            case 'place':
                return {
                    title: activityT('section.place.title'),
                    subtitle: activityT('section.place.subtitle'),
                };
            case 'orders':
                return {
                    title: stepperTitles[activeStep],
                    subtitle: stepperSubtitles[activeStep],
                };
            case 'history':
                return {
                    title: activityT('section.history.title'),
                    subtitle: activityT('section.history.subtitle'),
                };
            default:
                return { title: '', subtitle: '' };
        }
    }, [activeTab, activeStep, stepperTitles, stepperSubtitles, activityT]);

    // Stepper Configuration for My Orders tab
    const stepperSteps = [
        { label: stepperLabels[0], count: sections.waiting.length },
        { label: stepperLabels[1], count: sections.offers.length },
        { label: stepperLabels[2], count: sections.progress.length },
        { label: stepperLabels[3], count: sections.delivered.length },
    ];

    const [refreshing, setRefreshing] = useState(false);

    const onRefresh = React.useCallback(async () => {
        setRefreshing(true);
        await refetch();
        setRefreshing(false);
    }, [refetch]);

    const onLocalStatusChange = (requestId: number, status: RequestStatus) => {
        setLocalStatus((prev) => ({ ...prev, [requestId]: status }));
    };

    const handleTabSwitch = useCallback((tab: 'place' | 'orders' | 'history') => {
        setActiveTab(tab);
    }, []);

    const activeEmptyKey = activeTab === 'orders' ? stepKeys[activeStep] : 'history';
    const emptyTitleText = activityT(`empty.${activeEmptyKey}.title`);
    const emptyBodyText = activityT(`empty.${activeEmptyKey}.text`);

    // =============================================================================
    // Render
    // =============================================================================
    return (
        <AppShell noPadding>
            <AppHeader title="Activity" />

            {/* Tab Control */}
            <View style={[activityStyles.tabWrapper, { flexDirection: tabDirection }]}>
                {tabs.map((tab) => (
                    <TouchableOpacity
                        key={tab.key}
                        style={[
                            activityStyles.tab,
                            activeTab === tab.key && activityStyles.tabActive
                        ]}
                        onPress={() => handleTabSwitch(tab.key)}
                        activeOpacity={0.7}
                    >
                        <Body style={[
                            activityStyles.tabText,
                            isRTL && activityStyles.rtlTextReset,
                            activeTab === tab.key && activityStyles.tabTextActive
                        ]}>
                            {tab.label}
                        </Body>
                        {tab.count > 0 && (
                            <View style={[
                                activityStyles.tabBadge,
                                activeTab === tab.key && activityStyles.tabBadgeActive
                            ]}>
                                <Caption style={activityStyles.tabBadgeText}>{tab.count}</Caption>
                            </View>
                        )}
                    </TouchableOpacity>
                ))}
            </View>

            {/* Stepper for My Orders tab */}
            {activeTab === 'orders' && (
                <View style={[activityStyles.stepperWrapper, { flexDirection: tabDirection }]}>
                    <View style={activityStyles.stepperLineContainer}>
                        <View style={activityStyles.stepperLineBack} />
                        <View style={[activityStyles.stepperLineProgress, { width: `${(activeStep / (stepperSteps.length - 1)) * 100}%` }]} />
                    </View>
                    {stepperSteps.map((step, index) => (
                        <TouchableOpacity
                            key={step.label}
                            style={activityStyles.stepperItem}
                            onPress={() => setActiveStep(index as 0 | 1 | 2 | 3)}
                            activeOpacity={0.7}
                        >
                            <View style={[
                                activityStyles.stepperCircle,
                                activeStep === index && activityStyles.stepperCircleActive,
                                activeStep > index && activityStyles.stepperCircleCompleted
                            ]}>
                                {activeStep > index ? (
                                    <Ionicons name="checkmark" size={12} color={COLORS.background.primary} />
                                ) : (
                                    <View style={[
                                        activityStyles.stepperDot,
                                        activeStep === index && activityStyles.stepperDotActive
                                    ]} />
                                )}
                            </View>
                            <Body style={[
                                activityStyles.stepperLabel,
                                isRTL && activityStyles.rtlTextReset,
                                activeStep === index && activityStyles.stepperLabelActive
                            ]}>
                                {step.label}
                            </Body>
                        </TouchableOpacity>
                    ))}
                </View>
            )}

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
                {/* Subtle updating indicator */}
                {isFetching && !isLoading && (
                    <View style={activityStyles.updatingIndicator}>
                        <View style={activityStyles.updatingDot} />
                        <Caption style={[
                            activityStyles.updatingText,
                            isRTL && activityStyles.rtlTextReset
                        ]}>Refreshing</Caption>
                    </View>
                )}

                {/* Main Content Feed */}
                <Animated.View
                    style={activityStyles.workZone}
                    entering={FadeInDown.duration(300)}
                    layout={Layout.duration(300)}
                >
                    {isLoading ? (
                        <View style={{ paddingVertical: SPACING.medium }}>
                            {[1, 2].map((i: number) => <SkeletonCard key={i} style={{ marginBottom: 16, height: 160, borderRadius: 0 }} />)}
                        </View>
                    ) : activeTab === 'place' ? (
                        // Place Order Tab - Create Order Form
                        <View style={activityStyles.sectionBlock}>
                            <View style={activityStyles.sectionTitleRow}>
                                <Caption style={[activityStyles.sectionTitle, headlineTypography, { textAlign: textAlignment }]}>
                                    {sectionInfo.title.toUpperCase()}
                                </Caption>
                            </View>
                            <BodySmall style={[activityStyles.sectionSubtitle, bodyTypography, { textAlign: textAlignment }]}>{sectionInfo.subtitle}</BodySmall>
                            <CreateOrderForm onSubmitted={() => handleTabSwitch('orders')} />
                        </View>
                    ) : (
                        // My Orders / History Tabs - List View
                        <View style={activityStyles.sectionBlock}>
                            <View style={activityStyles.sectionTitleRow}>
                                <Caption style={[activityStyles.sectionTitle, headlineTypography, { textAlign: textAlignment }]}>{sectionInfo.title.toUpperCase()}</Caption>
                                <View style={activityStyles.sectionCountPill}>
                                    <Caption style={activityStyles.sectionCountText}>{currentContent.length}</Caption>
                                </View>
                            </View>
                            <BodySmall style={[activityStyles.sectionSubtitle, bodyTypography, { textAlign: textAlignment }]}>{sectionInfo.subtitle}</BodySmall>

                            <MyRequestsFeed
                                requests={currentContent}
                                userRole="customer"
                                bucketType={activeTab === 'orders'
                                    ? ['waiting', 'offers', 'progress', 'delivered'][activeStep] as 'waiting' | 'offers' | 'progress' | 'delivered'
                                    : activeTab === 'history' ? 'history' : undefined
                                }
                                onLocalStatusChange={onLocalStatusChange}
                                emptyVariant="none"
                            />

                            {currentContent.length === 0 && (
                                <View style={activityStyles.emptyContainer}>
                                    <View style={activityStyles.emptyIconCircle}>
                                        <Ionicons
                                            name={activeTab === 'orders' ? "time-outline" : "document-text-outline"}
                                            size={28}
                                            color={COLORS.accent.primary}
                                        />
                                    </View>
                            <Title style={[activityStyles.emptyTitle, titleTypography, { textAlign: textAlignment }]}>
                                {emptyTitleText}
                            </Title>
                            <Body style={[activityStyles.emptyText, bodyTypography, { textAlign: textAlignment }]}>
                                {emptyBodyText}
                            </Body>
                                </View>
                            )}
                        </View>
                    )}
                </Animated.View>
            </ScrollView>
        </AppShell>
    );
};

// =============================================================================
// Styles
// =============================================================================

const activityStyles = StyleSheet.create({
    // Main container
    container: {
        backgroundColor: COLORS.background.primary,
    },
    scrollContent: {
        flexGrow: 1,
        paddingBottom: SPACING.xxl,
    },

    // Tab System
    tabWrapper: {
        flexDirection: 'row',
        backgroundColor: COLORS.background.primary,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border.light,
        paddingTop: SPACING.medium,
    },
    tab: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
    },
    tabActive: {
        borderBottomColor: COLORS.accent.primary,
    },
    tabText: {
        fontSize: 11,
        fontWeight: '600',
        color: COLORS.text.tertiary,
        textTransform: 'uppercase',
        letterSpacing: 1.5,
    },
    rtlTextReset: {
        textTransform: 'none',
        letterSpacing: 0,
    },
    tabTextActive: {
        color: COLORS.text.primary,
    },
    tabBadge: {
        position: 'absolute',
        top: 4,
        right: 20, // Approximate based on text width
        backgroundColor: COLORS.accent.primary,
        borderRadius: 6,
        width: 6,
        height: 6,
        // Simple dot for cleaner look, or keep number if essential
    },
    // If we want numbers, we need a different badge style
    // Let's keep the number but make it small and floating
    tabBadgeActive: {
        backgroundColor: COLORS.accent.primary,
    },
    tabBadgeText: {
        display: 'none', // Hide text for cleaner look? Or keep it? 
        // The user said "professional". A red/gold dot is often cleaner than a number 0.
        // But the previous code showed numbers. Let's keep numbers but style appropriately.
    },

    stepperWrapper: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        paddingHorizontal: SPACING.large,
        paddingVertical: 24,
        backgroundColor: COLORS.background.primary,
        marginBottom: SPACING.small,
        position: 'relative',
    },
    stepperLineContainer: {
        position: 'absolute',
        top: 36, // Center of 24px circle + padding (24 + 12)
        left: SPACING.large + 20,
        right: SPACING.large + 20,
        height: 1, // Thinner line
        zIndex: 0,
    },
    stepperLineBack: {
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(255, 255, 255, 0.1)', // Very subtle
    },
    stepperLineProgress: {
        position: 'absolute',
        left: 0,
        height: '100%',
        backgroundColor: COLORS.accent.primary,
    },
    stepperItem: {
        alignItems: 'center',
        width: 60,
        zIndex: 1,
        gap: 8,
    },
    stepperCircle: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: COLORS.background.primary,
        borderWidth: 1.5, // Thinner border
        borderColor: COLORS.border.medium,
        alignItems: 'center',
        justifyContent: 'center',
    },
    stepperCircleActive: {
        borderColor: COLORS.accent.primary,
        backgroundColor: COLORS.background.primary,
        shadowColor: COLORS.accent.primary,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.6,
        shadowRadius: 10,
        elevation: 6,
    },
    stepperCircleCompleted: {
        backgroundColor: COLORS.background.primary,
        borderColor: COLORS.accent.primary,
    },
    stepperDot: {
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: COLORS.text.tertiary,
    },
    stepperDotActive: {
        backgroundColor: COLORS.accent.primary,
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    stepperLabel: {
        fontSize: 9,
        color: COLORS.text.tertiary,
        textAlign: 'center',
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    stepperLabelActive: {
        color: COLORS.text.primary,
        fontWeight: '700',
    },
    stepperBadge: {
        position: 'absolute',
        top: -6,
        right: -6,
        backgroundColor: COLORS.background.secondary,
        borderRadius: 7,
        minWidth: 14,
        height: 14,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: COLORS.border.medium,
    },
    stepperBadgeActive: {
        backgroundColor: COLORS.accent.primary,
        borderColor: COLORS.accent.primary,
    },
    stepperBadgeText: {
        fontSize: 8,
        fontWeight: '700',
        color: COLORS.background.primary,
    },

    // Content areas
    workZone: {
        paddingHorizontal: SPACING.large,
        paddingTop: SPACING.small,
    },
    sectionBlock: {
        gap: SPACING.large,
    },
    sectionTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: SPACING.tiny,
        paddingHorizontal: SPACING.small, // Extra horizontal padding
    },
    sectionTitle: {
        color: COLORS.accent.primary,
    },
    sectionCountPill: {
        backgroundColor: 'rgba(212, 175, 55, 0.1)',
        borderRadius: 12,
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderWidth: 1,
        borderColor: 'rgba(212, 175, 55, 0.2)',
    },
    sectionCountText: {
        fontSize: 10,
        fontWeight: '700',
        color: COLORS.accent.primary,
    },
    sectionSubtitle: {
        color: COLORS.text.secondary,
        lineHeight: 22,
        fontSize: 13,
        marginBottom: SPACING.small,
    },

    // Feed components
    feedContainer: {
        gap: SPACING.large,
    },
    emptyContainer: {
        alignItems: 'center',
        paddingVertical: SPACING.xxl,
        paddingHorizontal: SPACING.large,
        gap: SPACING.large,
    },
    emptyIconCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        borderWidth: 1,
        borderColor: COLORS.border.light,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyTitle: {
        textAlign: 'center',
        color: COLORS.text.primary,
    },
    emptyText: {
        textAlign: 'center',
        color: COLORS.text.tertiary,
        maxWidth: 280,
    },

    // Request cards (Redesigned)
    requestCard: {
        backgroundColor: COLORS.background.secondary,
        borderRadius: 0, // Sharper corners for luxury feel
        borderWidth: 1,
        borderColor: COLORS.border.light,
        padding: 0, // Reset padding to handle inner layout
        overflow: 'hidden',
    },
    requestCardHeader: {
        padding: SPACING.large,
        paddingBottom: SPACING.small,
        paddingTop: SPACING.medium, // Extra padding for Arabic text
    },
    requestCardTitleRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: SPACING.medium,
    },
    titleContainer: {
        flex: 1,
        gap: SPACING.micro,
    },
    requestCardTitle: {
        color: COLORS.text.primary,
    },
    statusIndicator: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 100,
        borderWidth: 1,
        backgroundColor: 'transparent',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 2,
    },
    statusText: {
        fontSize: 9,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    requestCardCategory: {
        color: COLORS.accent.primary,
        fontSize: 10,
        letterSpacing: 1.5,
        fontWeight: '600',
    },
    requestCardContent: {
        paddingHorizontal: SPACING.large,
        paddingBottom: SPACING.medium,
    },
    requestCardDescription: {
        color: COLORS.text.secondary,
        lineHeight: 24,
        fontSize: 14,
        marginBottom: SPACING.small,
    },
    requestCardDetails: {
        gap: SPACING.medium,
        marginTop: SPACING.small,
    },
    divider: {
        height: 1,
        backgroundColor: COLORS.border.light,
        marginVertical: SPACING.small,
    },
    requestCardSpecs: {
        flexDirection: 'row',
        gap: SPACING.large,
        flexWrap: 'wrap',
    },
    specItem: {
        minWidth: 80,
    },
    specLabel: {
        fontSize: 9,
        letterSpacing: 1.5,
        color: COLORS.text.tertiary,
        marginBottom: 4,
        fontWeight: '600',
    },
    specValue: {
        color: COLORS.text.primary,
        fontWeight: '500',
        fontSize: 13,
    },
    requestCardActions: {
        flexDirection: 'row',
        gap: SPACING.medium,
        marginTop: SPACING.small,
        flexWrap: 'wrap',
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 0,
        borderWidth: 1,
        borderColor: COLORS.border.light,
        backgroundColor: 'transparent',
    },
    primaryActionButton: {
        borderColor: COLORS.accent.primary,
        backgroundColor: 'rgba(212, 175, 55, 0.05)',
    },
    actionButtonText: {
        color: COLORS.text.primary,
        fontWeight: '600',
        fontSize: 11,
        letterSpacing: 1,
        textTransform: 'uppercase',
    },
    primaryActionText: {
        color: COLORS.accent.primary,
    },
    requestCardFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: SPACING.large,
        paddingVertical: 12,
        backgroundColor: 'rgba(0, 0, 0, 0.2)', // Slightly darker footer
        borderTopWidth: 1,
        borderTopColor: COLORS.border.light,
    },
    requestCardDate: {
        fontSize: 10,
        color: COLORS.text.tertiary,
        letterSpacing: 1,
        fontWeight: '500',
    },
    expandButton: {
        padding: 4,
    },

    // Updating indicator
    updatingIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: SPACING.medium,
        gap: SPACING.small,
    },
    updatingDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: COLORS.accent.primary,
        opacity: 0.8,
    },
    updatingText: {
        fontSize: 10,
        letterSpacing: 2,
        color: COLORS.accent.primary,
        textTransform: 'uppercase',
        fontWeight: '600',
    },

    // Empty states
    inlineEmpty: {
        textAlign: 'center',
        color: COLORS.text.tertiary,
        fontStyle: 'italic',
        paddingVertical: SPACING.xl,
    },

    // Reuse form styles    // Create Order Form Styles
    createOrderContainer: {
        flex: 1,
        marginTop: SPACING.medium,
    },
    formScrollContent: {
        paddingBottom: 100, // Space for FAB
    },
    formHeaderGroup: {
        marginBottom: SPACING.large,
    },
    formGroup: {
        marginBottom: SPACING.large,
        gap: SPACING.small,
    },
    formField: {
        gap: SPACING.tiny,
    },
    formFieldHalf: {
        flex: 1,
        gap: SPACING.tiny,
    },
    formFieldThird: {
        flex: 1,
        gap: SPACING.tiny,
    },
    formRow: {
        flexDirection: 'row',
        gap: SPACING.large,
        alignItems: 'flex-start',
    },
    formLabel: {
        fontSize: 10,
        letterSpacing: 2,
        color: COLORS.text.tertiary,
        fontWeight: '700',
        marginBottom: 4,
    },
    formSubLabel: {
        fontSize: 9,
        letterSpacing: 1.5,
        color: COLORS.text.tertiary,
        fontWeight: '600',
        marginBottom: 6,
    },
    formInput: {
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border.light,
        paddingVertical: 12,
        paddingHorizontal: 0,
        color: COLORS.text.primary,
        fontSize: 15,
        backgroundColor: 'transparent',
        textAlign: 'center',
    },
    formInputFocused: {
        borderBottomColor: COLORS.accent.primary,
    },
    dimensionInputContainer: {
        borderWidth: 1,
        borderColor: COLORS.border.light,
        borderRadius: 0,
        backgroundColor: 'rgba(255, 255, 255, 0.02)',
        overflow: 'hidden',
    },
    dimensionInput: {
        paddingVertical: 14,
        paddingHorizontal: SPACING.medium,
        color: COLORS.text.primary,
        fontSize: 16,
        fontWeight: '500',
        textAlign: 'center',
        backgroundColor: 'transparent',
    },
    dimensionInputFocused: {
        backgroundColor: 'rgba(212, 175, 55, 0.03)',
    },
    unitSelectContainer: {
        borderWidth: 1,
        borderColor: COLORS.border.light,
        borderRadius: 0,
        backgroundColor: 'rgba(255, 255, 255, 0.02)',
        overflow: 'hidden',
    },
    unitSelectValue: {
        paddingVertical: 14,
        paddingHorizontal: SPACING.medium,
        color: COLORS.text.primary,
        fontSize: 16,
        fontWeight: '500',
        textAlign: 'center',
        letterSpacing: 0.5,
    },
    formTextarea: {
        borderWidth: 1,
        borderColor: COLORS.border.light,
        borderRadius: 0, // Sharp
        padding: SPACING.medium,
        color: COLORS.text.primary,
        fontSize: 15,
        backgroundColor: 'rgba(255, 255, 255, 0.02)',
        minHeight: 140,
        lineHeight: 22,
    },
    formTextareaFocused: {
        borderColor: COLORS.accent.primary,
        backgroundColor: 'rgba(212, 175, 55, 0.02)',
    },
    formSelect: {
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border.light,
        paddingVertical: 12,
        paddingHorizontal: 0, // Left-align with label
        backgroundColor: 'transparent',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    formSelectText: {
        color: COLORS.text.primary,
        fontSize: 15,
        flex: 1,
    },
    formSelectPlaceholder: {
        color: COLORS.text.tertiary,
    },
    unitHint: {
        marginTop: SPACING.tiny,
        color: COLORS.accent.primary,
        fontSize: 11,
    },
    formSubmitContainer: {
        position: 'absolute',
        bottom: SPACING.large,
        right: SPACING.large,
    },
    formSubmitButton: {
        minWidth: 160,
        height: 48, // Customized button height
        borderRadius: 0,
    },

    // Modal UI specific
    formSelectionModalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        justifyContent: 'flex-end',
    },
    formSelectionModalSheet: {
        backgroundColor: COLORS.background.secondary,
        borderTopLeftRadius: 0,
        borderTopRightRadius: 0,
        paddingTop: SPACING.large,
        maxHeight: '60%',
        borderTopWidth: 1,
        borderTopColor: COLORS.accent.primary, // Gold top border
    },
    formSelectionModalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: SPACING.large,
        marginBottom: SPACING.medium,
    },
    offerCloseButton: {
        padding: SPACING.small,
    },
    formSelectionModalTitle: {
        color: COLORS.text.primary,
        fontSize: 16,
        letterSpacing: 1,
        fontWeight: '600',
    },
    formSelectionModalList: {
        paddingHorizontal: SPACING.large,
        paddingBottom: SPACING.xl,
    },
    formSelectionModalItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.05)',
    },
    formSelectionModalItemActive: {
        backgroundColor: 'rgba(212, 175, 55, 0.05)',
        marginHorizontal: -SPACING.large,
        paddingHorizontal: SPACING.large,
    },
    selectedDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: COLORS.accent.primary,
    },

    // Image Upload Styles
    imageUploadArea: {
        borderWidth: 1,
        borderColor: COLORS.border.light,
        borderRadius: 0,
        backgroundColor: 'rgba(255, 255, 255, 0.02)',
        padding: SPACING.large,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 120,
    },
    imageUploadContent: {
        alignItems: 'center',
        gap: SPACING.tiny,
    },
    imageUploadIcon: {
        marginBottom: SPACING.small,
    },
    imageUploadText: {
        color: COLORS.text.primary,
        fontWeight: '500',
        textAlign: 'center',
    },
    imageUploadSubtext: {
        color: COLORS.text.tertiary,
        fontSize: 12,
        textAlign: 'center',
        marginTop: SPACING.micro,
    },
    selectedImagesContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: SPACING.medium,
        marginTop: SPACING.medium,
    },
    imagePreviewContainer: {
        position: 'relative',
        width: 80,
        height: 80,
        borderRadius: 0,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: COLORS.border.light,
    },
    imagePreview: {
        width: '100%',
        height: '100%',
    },
    imageRemoveButton: {
        position: 'absolute',
        top: -8,
        right: -8,
        backgroundColor: COLORS.background.secondary,
        borderRadius: 10,
        width: 20,
        height: 20,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: COLORS.border.light,
    },

    overline: {
        fontSize: 10,
        letterSpacing: 2,
        color: COLORS.text.tertiary,
        fontWeight: '600',
        textTransform: 'uppercase',
    },
});

export default ActivityUserPage;
