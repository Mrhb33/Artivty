import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { PrimaryButton, SecondaryButton } from '../components/Button';
import { useAuthStore } from '../stores/authStore';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { COLORS, SPACING, TYPOGRAPHY } from '../theme/design-system';

type WelcomeNavProp = NativeStackNavigationProp<RootStackParamList, 'Welcome'>;
type AuthStackRoute = 'SignIn' | 'CreateAccount';

interface WelcomeScreenProps {
  navigation: WelcomeNavProp;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ navigation }) => {
  const logoFade = useRef(new Animated.Value(0)).current;
  const logoSlide = useRef(new Animated.Value(20)).current;
  const titleFade = useRef(new Animated.Value(0)).current;
  const titleSlide = useRef(new Animated.Value(20)).current;
  const actionsFade = useRef(new Animated.Value(0)).current;
  const markWelcomeSeen = useAuthStore((state) => state.markWelcomeSeen);

  useEffect(() => {
    Animated.stagger(200, [
      Animated.parallel([
        Animated.timing(logoFade, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(logoSlide, { toValue: 0, duration: 800, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(titleFade, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(titleSlide, { toValue: 0, duration: 800, useNativeDriver: true }),
      ]),
      Animated.timing(actionsFade, { toValue: 1, duration: 800, useNativeDriver: true }),
    ]).start();
  }, [actionsFade, logoFade, logoSlide, titleFade, titleSlide]);

  const handleNavigate = (screen: AuthStackRoute) => {
    markWelcomeSeen();
    navigation.navigate(screen);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <LinearGradient
        colors={['#060812', '#0A0D18', '#090B14']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      <View style={styles.content}>
        <Animated.View style={[
          styles.topEdge,
          { opacity: logoFade, transform: [{ translateY: logoSlide }] }
        ]}>
          <Text style={styles.logoText}>ARTIVTY</Text>
          <Text style={styles.pageTitle}>Welcome</Text>
        </Animated.View>

        <Animated.View style={[
          styles.heroSection,
          { opacity: titleFade, transform: [{ translateY: titleSlide }] }
        ]}>
          <Text style={styles.heroTitle}>
            Limitless <Text style={styles.heroAccent}>Artistry.</Text>
          </Text>
          <Text style={styles.tagline}>A private atelier for bold creators and discerning collectors.</Text>
          <Text style={styles.proofLine}>Secure by design. Curated quietly.</Text>
        </Animated.View>

        <Animated.View style={[styles.bottomEdge, { opacity: actionsFade }]}>
          <View style={styles.actions}>
            <PrimaryButton
              title="Start Journey"
              onPress={() => handleNavigate('CreateAccount')}
              style={styles.primaryButton}
            />
            <SecondaryButton
              title="Sign In"
              onPress={() => handleNavigate('SignIn')}
              style={styles.secondaryButton}
            />
          </View>
          <Text style={styles.legal}>By continuing you agree to Terms & Privacy</Text>
        </Animated.View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background.primary,
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.xl,
    paddingTop: 64,
    paddingBottom: 48,
    justifyContent: 'space-between',
  },
  topEdge: {
    gap: 6,
    alignItems: 'flex-start',
  },
  logoText: {
    color: COLORS.text.primary,
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 4,
    textTransform: 'uppercase',
  },
  pageTitle: {
    color: COLORS.text.tertiary,
    fontSize: 12,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  heroSection: {
    gap: 10,
    alignItems: 'flex-start',
    maxWidth: '86%',
    marginTop: SPACING.xl,
  },
  heroTitle: {
    color: COLORS.text.primary,
    fontSize: TYPOGRAPHY.hero.fontSize,
    lineHeight: TYPOGRAPHY.hero.lineHeight,
    fontWeight: TYPOGRAPHY.hero.fontWeight,
    letterSpacing: -1,
  },
  heroAccent: {
    color: COLORS.accent.primary,
  },
  tagline: {
    color: COLORS.text.secondary,
    fontSize: 16,
    lineHeight: 26,
    marginTop: SPACING.small,
    fontWeight: '400',
    maxWidth: '72%',
  },
  proofLine: {
    color: COLORS.text.tertiary,
    fontSize: 12,
    letterSpacing: 0.6,
    marginTop: SPACING.small,
  },
  bottomEdge: {
    width: '100%',
    paddingBottom: 8,
  },
  actions: {
    gap: SPACING.small,
  },
  primaryButton: {},
  secondaryButton: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  legal: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 11,
    letterSpacing: 0.4,
    marginTop: SPACING.small,
    textAlign: 'left',
  },
});
export default WelcomeScreen;
