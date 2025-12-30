import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useAuthStore } from '../stores/authStore';
import { useUpdateUser } from '../hooks/useAuth';
import { AppShell, Title, Body, Caption, PrimaryButton } from '../components';
import { useLanguage } from '../contexts/LanguageContext';
import { COLORS, SPACING, BORDER_RADIUS, TYPOGRAPHY } from '../theme';
import { Ionicons } from '@expo/vector-icons';

type RoleType = 'customer' | 'artist';

const USER_FEATURE_KEYS = [
  'auth.roleSelection.userFeatures.createRequests',
  'auth.roleSelection.userFeatures.receiveOffers',
  'auth.roleSelection.userFeatures.hireArtist',
  'auth.roleSelection.userFeatures.trackDelivery',
];

const ARTIST_FEATURE_KEYS = [
  'auth.roleSelection.artistFeatures.viewRequests',
  'auth.roleSelection.artistFeatures.sendOffers',
  'auth.roleSelection.artistFeatures.managePipeline',
  'auth.roleSelection.artistFeatures.portfolio',
];

/**
 * RoleSelectionScreen - Mandatory role selection after sign-in
 * 
 * User must choose their role before accessing the app.
 * This screen cannot be skipped and will reappear on app open until a role is selected.
 */
const RoleSelectionScreen = () => {
  const { user, setActiveMode } = useAuthStore();
  const updateUserMutation = useUpdateUser();
  const [selectedRole, setSelectedRole] = useState<RoleType | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { t } = useLanguage();
  const userFeatures = useMemo(() => USER_FEATURE_KEYS.map((key) => t(key)), [t]);
  const artistFeatures = useMemo(() => ARTIST_FEATURE_KEYS.map((key) => t(key)), [t]);

  const handleRoleSelect = (role: RoleType) => {
    setSelectedRole(role);
  };

  const handleContinue = async () => {
    if (!selectedRole || !user) return;

    setIsSubmitting(true);
    try {
      // Update user role on server
      const updatedUser = await updateUserMutation.mutateAsync({
        role: selectedRole,
      });

      // Update local state
      setActiveMode(selectedRole === 'artist' ? 'ARTIST' : 'USER');
      
      // Mark role as selected in auth store
      useAuthStore.getState().setRoleSelected(true);
      
      // Update user in store with new role
      if (updatedUser) {
        useAuthStore.getState().setUser(updatedUser);
      }
    } catch (error) {
      console.error('Error saving role:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const buttonLabel =
    selectedRole === 'customer'
      ? t('auth.roleSelection.continueAsUser')
      : selectedRole === 'artist'
      ? t('auth.roleSelection.continueAsArtist')
      : t('auth.roleSelection.selectRole');

  return (
    <AppShell noPadding>
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Section */}
        <View style={styles.header}>
          <Title style={styles.title}>{t('auth.roleSelection.title')}</Title>
          <Body style={styles.subtitle} color="secondary">
            {t('auth.roleSelection.subtitle')}
          </Body>
        </View>

        {/* Role Cards */}
        <View style={styles.cardsContainer}>
          {/* User Card */}
          <TouchableOpacity
            activeOpacity={0.9}
            style={[
              styles.roleCard,
              selectedRole === 'customer' && styles.roleCardSelected,
            ]}
            onPress={() => handleRoleSelect('customer')}
          >
            <View style={styles.cardHeader}>
              <View style={[
                styles.iconContainer,
                selectedRole === 'customer' && styles.iconContainerSelected,
              ]}>
                <Ionicons 
                  name="person-outline" 
                  size={32} 
                  color={selectedRole === 'customer' ? COLORS.accent.primary : COLORS.text.secondary} 
                />
              </View>
              <Title style={styles.cardTitle}>{t('auth.roleSelection.userTitle')}</Title>
            </View>

            <Body style={styles.cardBrief} color="secondary">
              {t('auth.roleSelection.userBody')}
            </Body>

            <View style={styles.featuresList}>
              {userFeatures.map((feature) => (
                <View key={feature} style={styles.featureItem}>
                  <Ionicons name="checkmark-circle" size={16} color={COLORS.accent.primary} />
                  <Caption style={styles.featureText}>{feature}</Caption>
                </View>
              ))}
            </View>

            {selectedRole === 'customer' && (
              <View style={styles.selectedIndicator}>
                <Ionicons name="checkmark-circle" size={20} color={COLORS.accent.primary} />
              </View>
            )}
          </TouchableOpacity>

          {/* Artist Card */}
          <TouchableOpacity
            activeOpacity={0.9}
            style={[
              styles.roleCard,
              selectedRole === 'artist' && styles.roleCardSelected,
            ]}
            onPress={() => handleRoleSelect('artist')}
          >
            <View style={styles.cardHeader}>
              <View style={[
                styles.iconContainer,
                selectedRole === 'artist' && styles.iconContainerSelected,
              ]}>
                <Ionicons 
                  name="brush-outline" 
                  size={32} 
                  color={selectedRole === 'artist' ? COLORS.accent.primary : COLORS.text.secondary} 
                />
              </View>
              <Title style={styles.cardTitle}>{t('auth.roleSelection.artistTitle')}</Title>
            </View>

            <Body style={styles.cardBrief} color="secondary">
              {t('auth.roleSelection.artistBody')}
            </Body>

            <View style={styles.featuresList}>
              {artistFeatures.map((feature) => (
                <View key={feature} style={styles.featureItem}>
                  <Ionicons name="checkmark-circle" size={16} color={COLORS.accent.primary} />
                  <Caption style={styles.featureText}>{feature}</Caption>
                </View>
              ))}
            </View>

            {selectedRole === 'artist' && (
              <View style={styles.selectedIndicator}>
                <Ionicons name="checkmark-circle" size={20} color={COLORS.accent.primary} />
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Continue Button */}
        <View style={styles.buttonContainer}>
          <PrimaryButton
            onPress={handleContinue}
            disabled={!selectedRole || isSubmitting}
            style={styles.continueButton}
          >
            <Text style={styles.buttonText}>{buttonLabel}</Text>
          </PrimaryButton>
        </View>
      </ScrollView>
    </AppShell>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    backgroundColor: COLORS.background.primary,
  },
  scrollContent: {
    paddingHorizontal: SPACING.large,
    paddingTop: SPACING.xxl,
    paddingBottom: SPACING.xl,
  },
  header: {
    marginBottom: SPACING.xl,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    lineHeight: 40,
    textAlign: 'center',
    marginBottom: SPACING.medium,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    paddingHorizontal: SPACING.medium,
  },
  cardsContainer: {
    gap: SPACING.large,
    marginBottom: SPACING.xl,
  },
  roleCard: {
    backgroundColor: COLORS.surface.primary,
    borderRadius: BORDER_RADIUS.large,
    padding: SPACING.large,
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
  },
  roleCardSelected: {
    borderColor: COLORS.accent.primary,
    backgroundColor: COLORS.surface.secondary,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.medium,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.background.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.medium,
  },
  iconContainerSelected: {
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
  },
  cardTitle: {
    fontSize: 24,
    lineHeight: 30,
    flex: 1,
  },
  cardBrief: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: SPACING.large,
  },
  featuresList: {
    gap: SPACING.small,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.small,
  },
  featureText: {
    fontSize: 12,
    color: COLORS.text.secondary,
    letterSpacing: 0.5,
    textTransform: 'none',
  },
  selectedIndicator: {
    position: 'absolute',
    top: SPACING.medium,
    right: SPACING.medium,
  },
  buttonContainer: {
    marginTop: SPACING.large,
  },
  continueButton: {
    height: 56,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text.inverse,
    letterSpacing: 0.5,
  },
});

export default RoleSelectionScreen;

