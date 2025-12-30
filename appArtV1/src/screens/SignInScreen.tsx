import React, { useEffect, useRef, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Platform,
    KeyboardAvoidingView,
    ScrollView,
    StatusBar,
    TouchableOpacity,
    Alert,
    Animated,
    Dimensions,
    Keyboard,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Input } from '../components/Input';
import { PrimaryButton } from '../components/Button';
import { useLogin } from '../hooks/useAuth';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { COLORS, SPACING } from '../theme/design-system';
import { Ionicons } from '@expo/vector-icons';

const EMAIL_REGEX = /\S+@\S+\.\S+/;

type SignInNavProp = NativeStackNavigationProp<RootStackParamList, 'SignIn'>;

interface SignInScreenProps {
    navigation: SignInNavProp;
}

const SignInScreen: React.FC<SignInScreenProps> = ({ navigation }) => {
    const windowHeight = Dimensions.get('window').height;
    const insets = useSafeAreaInsets();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [formError, setFormError] = useState<string | null>(null);
    const warmDrift = useRef(new Animated.Value(0)).current;
    const coolDrift = useRef(new Animated.Value(0)).current;
    const stageShift = useRef(new Animated.Value(0)).current;
    const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

    const loginMutation = useLogin();

    const canSubmit = EMAIL_REGEX.test(email) && password.length > 0 && !loginMutation.isPending;

    const handleBack = () => {
        if (navigation.canGoBack()) {
            navigation.goBack();
        } else {
            navigation.navigate('Welcome');
        }
    };

    const handleSubmit = () => {
        setFormError(null);

        if (!EMAIL_REGEX.test(email)) {
            setFormError('Enter a valid email to continue.');
            return;
        }

        if (!password) {
            setFormError('Enter your password to continue.');
            return;
        }

        loginMutation.mutate(
            { email: email.trim(), password },
            {
                onError: (error: any) => {
                    if (error?.response?.status === 429) {
                        setFormError('Security lock: Too many attempts.');
                        return;
                    }
                    setFormError('Authentication failed. Please verify credentials.');
                },
            }
        );
    };

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
    const isCompact = isKeyboardVisible || windowHeight < 750;

    useEffect(() => {
        const showSub = Keyboard.addListener('keyboardDidShow', () => setIsKeyboardVisible(true));
        const hideSub = Keyboard.addListener('keyboardDidHide', () => setIsKeyboardVisible(false));
        return () => {
            showSub.remove();
            hideSub.remove();
        };
    }, []);

    useEffect(() => {
        const target = isKeyboardVisible ? -36 : 0;
        Animated.timing(stageShift, { toValue: target, duration: 200, useNativeDriver: true }).start();
    }, [isKeyboardVisible, stageShift]);

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" translucent />

            <LinearGradient
                colors={['#0C0F1A', '#080B14', '#05070D']}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            />

            <Animated.View style={[styles.warmAura, { transform: [{ translateY: warmTranslate }] }]} pointerEvents="none" />
            <Animated.View style={[styles.coolAura, { transform: [{ translateY: coolTranslate }] }]} pointerEvents="none" />
            <View style={styles.edgeLine} pointerEvents="none" />

            <SafeAreaView style={[styles.safeArea, { paddingTop: insets.top }]}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                    style={styles.flex}
                >
                    <ScrollView
                        contentContainerStyle={styles.inner}
                        keyboardShouldPersistTaps="handled"
                        showsVerticalScrollIndicator={false}
                        scrollEnabled={false}
                    >
                        <Animated.View style={[styles.content, isCompact && styles.contentCompact, { transform: [{ translateY: stageShift }] }]}>
                            <View style={[styles.stage, isCompact && styles.stageCompact]}>
                                <View style={[styles.topEdge, isCompact && styles.topEdgeCompact]}>
                                    <TouchableOpacity
                                        style={styles.backButton}
                                        onPress={handleBack}
                                    >
                                        <Ionicons name="arrow-back" size={22} color={COLORS.text.primary} />
                                    </TouchableOpacity>

                                    <View style={styles.titleBlock}>
                                        <Text style={styles.title}>Sign in</Text>
                                        <Text style={styles.subtitle}>Welcome back to your private gallery.</Text>
                                    </View>
                                </View>

                                <View style={[styles.accountTypePlaceholder, isCompact && styles.accountTypePlaceholderCompact]} pointerEvents="none" />

                                <View style={[styles.formSection, isCompact && styles.formSectionCompact]}>
                                    <Input
                                        label="Email Address"
                                        placeholder="name@example.com"
                                        value={email}
                                        onChangeText={setEmail}
                                        keyboardType="email-address"
                                        autoCapitalize="none"
                                        autoCorrect={false}
                                    />

                                    <Input
                                        label="Password"
                                        placeholder="********"
                                        value={password}
                                        onChangeText={setPassword}
                                        secureTextEntry
                                    />

                                    <TouchableOpacity onPress={() => Alert.alert('Password Recovery', 'Instructions will be sent if an account exists.')} style={styles.forgotAction} activeOpacity={0.8}>
                                        <Text style={styles.forgotText}>Forgot password</Text>
                                    </TouchableOpacity>
                                </View>

                                {formError && (
                                    <View style={styles.errorContainer}>
                                        <Ionicons name="alert-circle" size={16} color={COLORS.accent.danger} />
                                        <Text style={styles.formError}>{formError}</Text>
                                    </View>
                                )}
                            </View>

                            <View style={[styles.bottomEdge, isCompact && styles.bottomEdgeCompact]}>
                                <PrimaryButton
                                    title="Sign in"
                                    onPress={handleSubmit}
                                    loading={loginMutation.isPending}
                                    disabled={!canSubmit}
                                    style={styles.submitButton}
                                />
                                <View style={styles.termsLine}>
                                    <View style={styles.termsDot} />
                                    <Text style={styles.termsText}>
                                        By signing in you agree to <Text style={styles.termsLink}>Terms</Text> & <Text style={styles.termsLink}>Privacy</Text>
                                    </Text>
                                </View>
                                <View style={styles.footer}>
                                    <Text style={styles.footerText}>Don't have an account?</Text>
                                    <TouchableOpacity onPress={() => navigation.navigate('CreateAccount')}>
                                        <Text style={styles.footerLink}>CREATE ACCOUNT</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </Animated.View>
                    </ScrollView>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background.primary,
    },
    safeArea: {
        flex: 1,
    },
    flex: {
        flex: 1,
    },
    inner: {
        paddingHorizontal: SPACING.xl,
        paddingBottom: SPACING.xxl,
        flexGrow: 1,
    },
    content: {
        flex: 1,
        minHeight: '100%',
        justifyContent: 'space-between',
        paddingTop: SPACING.xl,
    },
    contentCompact: {
        paddingTop: SPACING.large,
    },
    stage: {
        gap: SPACING.large,
    },
    stageCompact: {
        gap: SPACING.medium,
    },
    topEdge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.medium,
        minHeight: 88,
        marginBottom: SPACING.xxxl,
        paddingTop: SPACING.large,
    },
    topEdgeCompact: {
        minHeight: 72,
        marginBottom: SPACING.xxl / 2,
        paddingTop: SPACING.large,
    },
    backButton: {
        width: 42,
        height: 42,
        borderRadius: 21,
        backgroundColor: 'rgba(255,255,255,0.06)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.18)',
    },
    titleBlock: {
        flex: 1,
        gap: 6,
    },
    title: {
        color: COLORS.text.primary,
        fontSize: 28,
        fontWeight: '700',
        letterSpacing: 0.2,
    },
    subtitle: {
        color: COLORS.text.secondary,
        fontSize: 15,
        lineHeight: 22,
        maxWidth: '88%',
    },
    accountTypePlaceholder: {
        minHeight: 108,
        marginBottom: SPACING.medium,
    },
    accountTypePlaceholderCompact: {
        minHeight: 92,
        marginBottom: SPACING.small,
    },
    formSection: {
        gap: SPACING.medium,
        marginTop: SPACING.small,
    },
    formSectionCompact: {
        gap: SPACING.sm,
        marginTop: SPACING.tiny,
    },
    forgotAction: {
        alignSelf: 'flex-end',
        marginTop: -SPACING.small,
    },
    forgotText: {
        color: COLORS.text.secondary,
        fontSize: 13,
        fontWeight: '600',
    },
    errorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(207, 102, 121, 0.12)',
        paddingVertical: 10,
        paddingHorizontal: 12,
        gap: 8,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: 'rgba(207, 102, 121, 0.3)',
    },
    formError: {
        color: COLORS.accent.danger,
        fontSize: 13,
    },
    bottomEdge: {
        gap: SPACING.small,
        marginTop: SPACING.large,
    },
    bottomEdgeCompact: {
        marginTop: SPACING.medium,
        gap: SPACING.tiny,
    },
    submitButton: {},
    termsLine: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    termsDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.35)',
        backgroundColor: 'transparent',
    },
    termsText: {
        color: COLORS.text.secondary,
        fontSize: 13,
        flex: 1,
        lineHeight: 18,
    },
    termsLink: {
        color: COLORS.text.primary,
        fontWeight: '700',
    },
    footer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: SPACING.medium,
    },
    footerText: {
        color: COLORS.text.tertiary,
        fontSize: 14,
    },
    footerLink: {
        color: COLORS.text.primary,
        fontSize: 14,
        fontWeight: '700',
        marginLeft: 8,
        letterSpacing: 1,
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
});
export default SignInScreen;
