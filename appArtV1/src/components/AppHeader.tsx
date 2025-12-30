import React, { useState, useEffect } from 'react';
import { View, Modal, Pressable, TouchableOpacity, ScrollView, StyleSheet, Dimensions, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../contexts/LanguageContext';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS } from '../theme';
import { Title, Body, Caption, BodySmall } from './Text';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, interpolateColor, withTiming } from 'react-native-reanimated';
import { useAuthStore } from '../stores/authStore';
import { useLogout } from '../hooks/useAuth';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface AppHeaderProps {
    title: string;
    titleKey?: string;
    showBack?: boolean;
    onBackPress?: () => void;
    onSettingsPress?: () => void;
}

interface SettingsModalProps {
    visible: boolean;
    onClose: () => void;
}

const RenderToggle: React.FC<{ active: boolean; onPress: () => void }> = ({ active, onPress }) => {
    const translateX = useSharedValue(active ? 22 : 0);

    useEffect(() => {
        translateX.value = withSpring(active ? 22 : 0, {
            damping: 22,
            stiffness: 180,
            mass: 0.6,
        });
    }, [active]);

    const thumbStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: translateX.value }],
    }));

    const trackStyle = useAnimatedStyle(() => ({
        backgroundColor: interpolateColor(
            translateX.value,
            [0, 22],
            ['rgba(255, 255, 255, 0.05)', 'rgba(212, 175, 55, 0.12)']
        ),
    }));

    return (
        <TouchableOpacity onPress={onPress} activeOpacity={1} style={headerStyles.toggleButton}>
            <Animated.View style={[headerStyles.toggleTrack, trackStyle]}>
                <Animated.View style={[headerStyles.toggleThumb, thumbStyle, {
                    backgroundColor: active ? COLORS.accent.primary : COLORS.text.tertiary
                }]} />
            </Animated.View>
        </TouchableOpacity>
    );
};

export const SettingsModal: React.FC<SettingsModalProps> = ({ visible, onClose }) => {
    const { language, setLanguage, t, isRTL } = useLanguage();
    const { activeMode, setActiveMode } = useAuthStore();
    const logoutMutation = useLogout();
    const [toggles, setToggles] = useState({
        offers: true,
        messages: true,
        updates: false,
        payment: true,
    });

    const toggleSwitch = (key: keyof typeof toggles) => {
        setToggles(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const languages = [
        { code: 'en' as const, label: t('language.english') },
        { code: 'ar' as const, label: t('language.arabic') },
        { code: 'fr' as const, label: t('language.french') },
    ];

    const handleLogout = () => {
        logoutMutation.mutate();
        onClose();
    };

    return (
        <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
            <Pressable style={headerStyles.settingsModalOverlay} onPress={onClose}>
                <Pressable style={headerStyles.settingsModalContent} onPress={() => { }}>
                    <View style={headerStyles.settingsModalHeader}>
                        <View>
                            <Caption style={[headerStyles.modalOverline, isRTL && headerStyles.rtlText]}>{t('settings.preferences')}</Caption>
                            <Title style={headerStyles.settingsModalTitle}>{t('settings.title')}</Title>
                        </View>
                        <TouchableOpacity onPress={onClose} style={headerStyles.closeButton}>
                            <Ionicons name="close" size={20} color={COLORS.text.primary} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
                        {/* Language & Region Section */}
                        <View style={headerStyles.settingsSection}>
                            <Caption style={[headerStyles.settingsSectionTitle, isRTL && headerStyles.rtlText]}>{t('settings.languageRegion')}</Caption>
                            <View style={[headerStyles.languageGrid, isRTL && headerStyles.languageGridRTL]}>
                                {languages.map((lang) => (
                                    <TouchableOpacity
                                        key={lang.code}
                                        style={StyleSheet.flatten([
                                            headerStyles.languageCard,
                                            language === lang.code && headerStyles.languageCardActive,
                                        ])}
                                        onPress={() => {
                                            setLanguage(lang.code);
                                            // Close or keep open for better UX? Keeping open for now.
                                        }}
                                        activeOpacity={0.7}
                                    >
                                        <Body style={StyleSheet.flatten([
                                            headerStyles.languageCardText,
                                            language === lang.code && headerStyles.languageCardTextActive,
                                        ])}>
                                            {lang.label}
                                        </Body>
                                        {language === lang.code && (
                                            <View style={headerStyles.activeIndicator} />
                                        )}
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        {/* Notifications Section */}
                        <View style={headerStyles.settingsSection}>
                            <Caption style={[headerStyles.settingsSectionTitle, isRTL && headerStyles.rtlText]}>{t('settings.notifications')}</Caption>
                            <View style={headerStyles.sectionList}>
                                <Pressable style={({ pressed }) => [headerStyles.luxuryRow, isRTL && headerStyles.rowRTL, pressed && headerStyles.rowPressed]}>
                                    <Body style={[headerStyles.rowLabel, isRTL && headerStyles.rowLabelRTL]}>{t('settings.newOffers')}</Body>
                                    <RenderToggle active={toggles.offers} onPress={() => toggleSwitch('offers')} />
                                </Pressable>
                                <Pressable style={({ pressed }) => [headerStyles.luxuryRow, isRTL && headerStyles.rowRTL, pressed && headerStyles.rowPressed]}>
                                    <Body style={[headerStyles.rowLabel, isRTL && headerStyles.rowLabelRTL]}>{t('settings.messages')}</Body>
                                    <RenderToggle active={toggles.messages} onPress={() => toggleSwitch('messages')} />
                                </Pressable>
                                <Pressable style={({ pressed }) => [headerStyles.luxuryRow, isRTL && headerStyles.rowRTL, pressed && headerStyles.rowPressed]}>
                                    <Body style={[headerStyles.rowLabel, isRTL && headerStyles.rowLabelRTL]}>{t('settings.orderStatusUpdates')}</Body>
                                    <RenderToggle active={toggles.updates} onPress={() => toggleSwitch('updates')} />
                                </Pressable>
                                <Pressable style={({ pressed }) => [headerStyles.luxuryRow, isRTL && headerStyles.rowRTL, { borderBottomWidth: 0 }, pressed && headerStyles.rowPressed]}>
                                    <Body style={[headerStyles.rowLabel, isRTL && headerStyles.rowLabelRTL]}>{t('settings.paymentDelivery')}</Body>
                                    <RenderToggle active={toggles.payment} onPress={() => toggleSwitch('payment')} />
                                </Pressable>
                            </View>
                        </View>

                        {/* Account Section */}
                        <View style={headerStyles.settingsSection}>
                            <Caption style={[headerStyles.settingsSectionTitle, isRTL && headerStyles.rtlText]}>{t('settings.account')}</Caption>
                            <View style={headerStyles.sectionList}>
                                <View style={[headerStyles.luxuryRow, isRTL && headerStyles.rowRTL]}>
                                    <Body style={[headerStyles.rowLabel, isRTL && headerStyles.rowLabelRTL]}>{t('settings.accountMode')}</Body>
                                    <View style={[headerStyles.modeSwitch, isRTL && headerStyles.rowRTL]}>
                                        <TouchableOpacity
                                            activeOpacity={0.85}
                                            onPress={() => setActiveMode('USER')}
                                            style={[headerStyles.modePill, activeMode === 'USER' && headerStyles.modePillActive]}
                                        >
                                            <Caption style={[headerStyles.modePillText, activeMode === 'USER' && headerStyles.modePillTextActive]}>
                                                {t('settings.user')}
                                            </Caption>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            activeOpacity={0.85}
                                            onPress={() => setActiveMode('ARTIST')}
                                            style={[headerStyles.modePill, activeMode === 'ARTIST' && headerStyles.modePillActive]}
                                        >
                                            <Caption style={[headerStyles.modePillText, activeMode === 'ARTIST' && headerStyles.modePillTextActive]}>
                                                {t('settings.artist')}
                                            </Caption>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                                <Pressable style={({ pressed }) => [headerStyles.luxuryRow, isRTL && headerStyles.rowRTL, pressed && headerStyles.rowPressed]}>
                                    <Body style={[headerStyles.rowLabel, isRTL && headerStyles.rowLabelRTL]}>{t('settings.editProfile')}</Body>
                                    <Ionicons name="chevron-forward" size={14} color={COLORS.text.tertiary} />
                                </Pressable>
                                <View style={[headerStyles.luxuryRow, isRTL && headerStyles.rowRTL]}>
                                    <Body style={[headerStyles.rowLabel, isRTL && headerStyles.rowLabelRTL]}>{t('settings.verificationStatus')}</Body>
                                    <View style={headerStyles.verificationBadge}>
                                        <Ionicons name="shield-checkmark" size={10} color={COLORS.accent.success} />
                                        <Caption style={[headerStyles.verificationText, isRTL && headerStyles.rtlText]}>{t('settings.verifiedMember')}</Caption>
                                    </View>
                                </View>
                                <Pressable
                                    style={({ pressed }) => [headerStyles.luxuryRow, isRTL && headerStyles.rowRTL, { borderBottomWidth: 0 }, pressed && headerStyles.rowPressed]}
                                    onPress={handleLogout}
                                >
                                    <Body style={StyleSheet.flatten([headerStyles.rowLabel, isRTL && headerStyles.rowLabelRTL, { color: COLORS.accent.danger }])}>{t('auth.logout')}</Body>
                                    <Ionicons name="log-out-outline" size={16} color={COLORS.accent.danger} />
                                </Pressable>
                            </View>
                        </View>

                        {/* Payments & Legal Section */}
                        <View style={headerStyles.settingsSection}>
                            <Caption style={[headerStyles.settingsSectionTitle, isRTL && headerStyles.rtlText]}>{t('settings.paymentsLegal')}</Caption>
                            <View style={headerStyles.sectionList}>
                                <Pressable style={({ pressed }) => [headerStyles.luxuryRow, isRTL && headerStyles.rowRTL, pressed && headerStyles.rowPressed]}>
                                    <Body style={[headerStyles.rowLabel, isRTL && headerStyles.rowLabelRTL]}>{t('settings.paymentMethods')}</Body>
                                    <Ionicons name={isRTL ? 'chevron-back' : 'chevron-forward'} size={14} color={COLORS.text.tertiary} />
                                </Pressable>
                                <Pressable style={({ pressed }) => [headerStyles.luxuryRow, isRTL && headerStyles.rowRTL, pressed && headerStyles.rowPressed]}>
                                    <Body style={[headerStyles.rowLabel, isRTL && headerStyles.rowLabelRTL]}>{t('settings.transactionHistory')}</Body>
                                    <Ionicons name={isRTL ? 'chevron-back' : 'chevron-forward'} size={14} color={COLORS.text.tertiary} />
                                </Pressable>
                                <Pressable style={({ pressed }) => [headerStyles.luxuryRow, isRTL && headerStyles.rowRTL, { borderBottomWidth: 0 }, pressed && headerStyles.rowPressed]}>
                                    <Body style={[headerStyles.rowLabel, isRTL && headerStyles.rowLabelRTL]}>{t('settings.terms')}</Body>
                                    <Ionicons name="open-outline" size={14} color={COLORS.text.tertiary} />
                                </Pressable>
                            </View>
                        </View>

                        {/* App Metadata */}
                        <View style={headerStyles.metaSection}>
                            <BodySmall style={[headerStyles.metaText, isRTL && headerStyles.rtlText]}>{t('settings.premiumEdition')}</BodySmall>
                            <Caption style={[headerStyles.versionTag, isRTL && headerStyles.rtlText]}>{t('settings.version')}</Caption>
                        </View>
                    </ScrollView>
                </Pressable>
            </Pressable>
        </Modal>
    );
};

export const AppHeader: React.FC<AppHeaderProps> = ({ title, titleKey, showBack, onBackPress, onSettingsPress }) => {
    const [settingsVisible, setSettingsVisible] = useState(false);
    const { t, isRTL } = useLanguage();
    const resolvedTitle = titleKey ? t(titleKey) : title;
    const headerDirectionIcon = isRTL ? 'chevron-forward' : 'chevron-back';

    const handleSettingsPress = () => {
        if (onSettingsPress) {
            onSettingsPress();
            return;
        }
        setSettingsVisible(true);
    };

    return (
        <>
            <View style={[headerStyles.container, isRTL && headerStyles.containerRTL]}>
                <View style={headerStyles.headerLeft}>
                    {showBack ? (
                        <TouchableOpacity
                            style={headerStyles.headerIcon}
                            onPress={onBackPress}
                            activeOpacity={0.7}
                        >
                            <Ionicons name={headerDirectionIcon} size={22} color={COLORS.text.primary} />
                        </TouchableOpacity>
                    ) : (
                        <View style={headerStyles.logoWrapper}>
                            <Text style={headerStyles.logoText}>Artivty</Text>
                            <View style={headerStyles.logoDot} />
                        </View>
                    )}
                </View>

                {/* VISUAL CENTER - Perfectly Centered Title */}
                <View style={headerStyles.headerAbsCenter} pointerEvents="none">
                    <Text style={[headerStyles.headerTitle, isRTL && headerStyles.rtlText]}>
                        {resolvedTitle}
                    </Text>
                </View>

                <View style={headerStyles.headerRight}>
                <TouchableOpacity
                    style={headerStyles.headerIcon}
                    onPress={handleSettingsPress}
                    activeOpacity={0.7}
                >
                    <Ionicons name="settings-outline" size={18} color={COLORS.text.primary} />
                </TouchableOpacity>
            </View>
        </View>

        {!onSettingsPress && (
            <SettingsModal
                visible={settingsVisible}
                onClose={() => setSettingsVisible(false)}
            />
        )}
    </>
);
};

const headerStyles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: COLORS.background.primary,
        paddingLeft: 20,
        paddingRight: 20,
        paddingTop: 20,
        paddingBottom: SPACING.medium,
        height: 60,
        zIndex: 100,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: 'rgba(212, 175, 55, 0.08)',
    },
    headerLeft: {
        flex: 1,
        justifyContent: 'center',
        zIndex: 10,
    },
    headerAbsCenter: {
        position: 'absolute',
        top: 20,
        left: 0,
        right: 0,
        bottom: SPACING.medium,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 0,
    },
    headerRight: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
        zIndex: 10,
    },
    headerIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: 'rgba(212, 175, 55, 0.12)',
    },
    logoWrapper: {
        flexDirection: 'row',
        alignItems: 'baseline',
    },
    logoText: {
        fontSize: 16,
        letterSpacing: 2.5,
        color: COLORS.text.primary,
        fontWeight: '900',
        textTransform: 'uppercase',
        includeFontPadding: false,
    },
    logoDot: {
        width: 3,
        height: 3,
        borderRadius: 1.5,
        backgroundColor: COLORS.accent.primary,
        marginLeft: 2,
    },
    headerTitle: {
        fontSize: 11,
        letterSpacing: 3,
        color: COLORS.text.tertiary,
        fontWeight: '600',
        textTransform: 'uppercase',
    },
    containerRTL: {
        flexDirection: 'row-reverse',
    },
    settingsModalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.88)',
        justifyContent: 'flex-end',
    },
    settingsModalContent: {
        backgroundColor: COLORS.background.secondary,
        width: '100%',
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        paddingHorizontal: SPACING.large,
        paddingTop: SPACING.xl,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: 'rgba(212, 175, 55, 0.1)',
        shadowColor: 'rgba(212, 175, 55, 0.2)',
        shadowOffset: { width: 0, height: -8 },
        shadowOpacity: 0.15,
        shadowRadius: 20,
        elevation: 12,
        maxHeight: '85%',
    },
    settingsModalHeader: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        marginBottom: SPACING.xl,
        paddingHorizontal: SPACING.small,
    },
    modalHeaderRTL: {
        flexDirection: 'row-reverse',
    },
    modalOverline: {
        fontSize: 10,
        textTransform: 'uppercase',
        letterSpacing: 2.2,
        color: COLORS.text.tertiary,
        marginBottom: 6,
        fontWeight: '500',
    },
    rtlText: {
        textTransform: 'none',
        letterSpacing: 0,
        textAlign: 'right',
    },
    settingsModalTitle: {
        fontSize: 28,
        fontWeight: '400',
        color: COLORS.text.primary,
        textTransform: 'none',
        letterSpacing: -0.5,
    },
    closeButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255, 255, 255, 0.04)',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: 'rgba(212, 175, 55, 0.12)',
    },
    settingsSection: {
        marginBottom: SPACING.xl,
    },
    settingsSectionTitle: {
        fontSize: 10,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 1.8,
        color: COLORS.text.tertiary,
        marginBottom: SPACING.large,
        paddingHorizontal: SPACING.small,
    },
    languageGridRTL: {
        flexDirection: 'row-reverse',
    },
    sectionList: {
        backgroundColor: 'rgba(255, 255, 255, 0.008)',
        borderRadius: 20,
        paddingVertical: 0,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: 'rgba(212, 175, 55, 0.08)',
        overflow: 'hidden',
    },
    luxuryRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 16,
        paddingHorizontal: SPACING.large,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: 'rgba(255, 255, 255, 0.02)',
    },
    rowRTL: {
        flexDirection: 'row-reverse',
    },
    rowPressed: {
        backgroundColor: 'rgba(212, 175, 55, 0.04)',
    },
    rowLabel: {
        fontSize: 15,
        fontWeight: '400',
        color: COLORS.text.primary,
        letterSpacing: 0.2,
    },
    rowLabelRTL: {
        letterSpacing: 0,
    },
    languageGrid: {
        flexDirection: 'row',
        gap: SPACING.medium,
        paddingHorizontal: SPACING.small,
    },
    languageCard: {
        flex: 1,
        paddingVertical: 16,
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.02)',
        borderRadius: 16,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: 'rgba(255, 255, 255, 0.04)',
    },
    languageCardActive: {
        backgroundColor: 'rgba(212, 175, 55, 0.08)',
        borderColor: 'rgba(212, 175, 55, 0.3)',
    },
    languageCardText: {
        fontSize: 13,
        color: COLORS.text.secondary,
        fontWeight: '400',
    },
    languageCardTextActive: {
        color: COLORS.accent.primary,
        fontWeight: '500',
    },
    activeIndicator: {
        width: 2.5,
        height: 2.5,
        borderRadius: 1.25,
        backgroundColor: COLORS.accent.primary,
        marginTop: 6,
    },
    toggleButton: {
        padding: SPACING.tiny,
    },
    toggleTrack: {
        width: 50,
        height: 28,
        borderRadius: 14,
        justifyContent: 'center',
        paddingHorizontal: 3,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: 'rgba(212, 175, 55, 0.15)',
    },
    toggleThumb: {
        width: 22,
        height: 22,
        borderRadius: 11,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 3,
    },
    verificationBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: 'rgba(76, 175, 80, 0.06)',
        paddingVertical: 5,
        paddingHorizontal: 10,
        borderRadius: 18,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: 'rgba(76, 175, 80, 0.2)',
    },
    verificationText: {
        color: COLORS.accent.success,
        fontSize: 10,
        fontWeight: '500',
        textTransform: 'uppercase',
        letterSpacing: 0.8,
    },

    // Account Mode (global)
    modeSwitch: {
        flexDirection: 'row',
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: 'rgba(212, 175, 55, 0.15)',
        borderRadius: 999,
        overflow: 'hidden',
        backgroundColor: 'rgba(255, 255, 255, 0.01)',
    },
    modePill: {
        paddingHorizontal: 14,
        paddingVertical: 9,
        minWidth: 80,
        alignItems: 'center',
        justifyContent: 'center',
    },
    modePillActive: {
        backgroundColor: 'rgba(212, 175, 55, 0.1)',
    },
    modePillText: {
        fontSize: 11,
        letterSpacing: 1,
        textTransform: 'uppercase',
        color: COLORS.text.tertiary,
        fontWeight: '400',
    },
    modePillTextRTL: {
        textTransform: 'none',
        letterSpacing: 0,
    },
    modePillTextActive: {
        color: COLORS.accent.primary,
        fontWeight: '600',
    },
    metaSection: {
        alignItems: 'center',
        marginTop: SPACING.xl,
        paddingBottom: SPACING.xl,
    },
    metaText: {
        color: COLORS.text.tertiary,
        fontSize: 11,
        letterSpacing: 0.4,
        fontWeight: '400',
    },
    versionTag: {
        color: 'rgba(255, 255, 255, 0.15)',
        fontSize: 9,
        marginTop: 4,
        letterSpacing: 0.3,
    },
});
