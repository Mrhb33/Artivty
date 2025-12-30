import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, StatusBar, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SPACING } from '../theme/design-system';
import { PrimaryButton } from '../components/Button';

interface SplashScreenProps {
    onContinue?: () => void;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onContinue }) => {
    const warmDrift = useRef(new Animated.Value(0)).current;
    const coolDrift = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const loopDrift = (value: Animated.Value) =>
            Animated.loop(
                Animated.sequence([
                    Animated.timing(value, { toValue: 1, duration: 6000, useNativeDriver: true }),
                    Animated.timing(value, { toValue: 0, duration: 6000, useNativeDriver: true }),
                ])
            ).start();

        loopDrift(warmDrift);
        loopDrift(coolDrift);
    }, [coolDrift, warmDrift]);

    const warmTranslate = warmDrift.interpolate({ inputRange: [0, 1], outputRange: [-6, 6] });
    const coolTranslate = coolDrift.interpolate({ inputRange: [0, 1], outputRange: [8, -8] });

    return (
        <View style={styles.container}>
            <StatusBar barStyle='light-content' translucent />
            <LinearGradient
                colors={['#0E101D', '#0B0E18', '#090B14']}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            />
            <Animated.View style={[styles.warmAura, { transform: [{ translateY: warmTranslate }] }]} pointerEvents="none" />
            <Animated.View style={[styles.coolAura, { transform: [{ translateY: coolTranslate }] }]} pointerEvents="none" />
            <Animated.View style={[styles.edgeLine, { transform: [{ translateY: warmTranslate }] }]} pointerEvents="none" />
            <View style={styles.curveOne} pointerEvents="none" />
            <View style={styles.curveTwo} pointerEvents="none" />

            <SafeAreaView style={styles.safeArea}>
                <View style={styles.content}>
                    <View style={styles.topEdge}>
                        <Text style={styles.logoText}>ARTIVTY</Text>
                        <Text style={styles.pageTitle}>Preparing your space</Text>
                    </View>

                    <View style={styles.heroSection}>
                        <Text style={styles.heroTitle}>Where imagination becomes reality</Text>
                        <Text style={styles.heroSub}>A calm handoff while we ready your gallery.</Text>
                    </View>

                    <View style={styles.bottomEdge}>
                        <PrimaryButton
                            title="Continue"
                            onPress={() => onContinue?.()}
                            style={styles.continueButton}
                        />
                    </View>
                </View>
            </SafeAreaView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    safeArea: {
        flex: 1,
    },
    content: {
        flex: 1,
        paddingHorizontal: SPACING.xl,
        paddingTop: SPACING.medium,
        paddingBottom: SPACING.xxl,
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
        gap: SPACING.small,
        alignItems: 'flex-start',
        maxWidth: '86%',
        marginTop: SPACING.xl,
    },
    heroTitle: {
        color: COLORS.text.primary,
        fontSize: 30,
        lineHeight: 38,
        fontWeight: '700',
        letterSpacing: -0.5,
    },
    heroSub: {
        color: COLORS.text.secondary,
        fontSize: 15,
        lineHeight: 24,
        maxWidth: '80%',
    },
    bottomEdge: {
        paddingBottom: SPACING.small,
        gap: SPACING.small,
    },
    continueButton: {
        marginTop: SPACING.tiny,
    },
    warmAura: {
        position: 'absolute',
        width: 260,
        height: 260,
        borderRadius: 220,
        backgroundColor: 'rgba(240, 185, 75, 0.08)',
        top: -60,
        left: -80,
    },
    coolAura: {
        position: 'absolute',
        width: 280,
        height: 280,
        borderRadius: 240,
        backgroundColor: 'rgba(64, 179, 195, 0.08)',
        bottom: -80,
        right: -90,
    },
    edgeLine: {
        position: 'absolute',
        top: '28%',
        left: -60,
        width: 260,
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.06)',
        transform: [{ rotate: '-8deg' }],
    },
    curveOne: {
        position: 'absolute',
        top: '12%',
        right: -40,
        width: 180,
        height: 180,
        borderRadius: 90,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
        transform: [{ rotate: '24deg' }],
    },
    curveTwo: {
        position: 'absolute',
        bottom: '18%',
        left: -70,
        width: 220,
        height: 220,
        borderRadius: 110,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.03)',
        transform: [{ rotate: '-18deg' }],
    },
});

export default SplashScreen;
