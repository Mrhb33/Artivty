import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Platform,
    KeyboardAvoidingView,
    ScrollView,
    StatusBar,
    TouchableOpacity,
    Animated,
    Dimensions,
    Keyboard,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Input } from '../components/Input';
import { PrimaryButton } from '../components/Button';
import { useRegister } from '../hooks/useAuth';
import { useAuthStore } from '../stores/authStore';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { COLORS, SPACING } from '../theme/design-system';
import { Ionicons } from '@expo/vector-icons';

const EMAIL_REGEX = /\S+@\S+\.\S+/;
const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,20}$/;
const PASSWORD_NUMBER_REGEX = /\d/;
const PASSWORD_LETTER_REGEX = /[A-Za-z]/;
const PASSWORD_SPECIAL_REGEX = /[^A-Za-z0-9]/;
const SEGMENTS = [0, 1, 2, 3];
const isIos = Platform.OS === 'ios';

type CreateNavProp = NativeStackNavigationProp<RootStackParamList, 'CreateAccount'>;

interface CreateAccountScreenProps {
    navigation: CreateNavProp;
}

const evaluatePassword = (value: string) => {
    const lengthValid = value.length >= 8;
    const hasLetters = PASSWORD_LETTER_REGEX.test(value);
    const hasNumber = PASSWORD_NUMBER_REGEX.test(value);
    const hasSpecial = PASSWORD_SPECIAL_REGEX.test(value);
    let score = 0;
    if (lengthValid) score += 1;
    if (hasLetters) score += 1;
    if (hasNumber) score += 1;
    if (hasSpecial) score += 1;

    const label = score >= 3 ? 'Strong' : '';
    const color = score >= 3 ? COLORS.accent.primary : 'rgba(255,255,255,0.25)';

    return { score, label, color, lengthValid, hasLetters, hasNumber, hasSpecial };
};

const CreateAccountScreen: React.FC<CreateAccountScreenProps> = ({ navigation }) => {
    const windowHeight = Dimensions.get('window').height;
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
    const handleBack = () => {
        if (navigation.canGoBack()) {
            navigation.goBack();
        } else {
            navigation.navigate('Welcome');
        }
    };

    useEffect(() => {
        if (isAuthenticated) {
            navigation.replace('MainTabs');
        }
    }, [isAuthenticated, navigation]);

    const [fullName, setFullName] = useState('');
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [touched, setTouched] = useState({
        fullName: false,
        username: false,
        email: false,
        password: false,
        confirmPassword: false,
    });
    const [role, setRole] = useState<'artist' | 'collector'>('collector');
    const [termsAccepted, setTermsAccepted] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showUsername, setShowUsername] = useState(false);
    const warmDrift = useRef(new Animated.Value(0)).current;
    const coolDrift = useRef(new Animated.Value(0)).current;
    const stageShift = useRef(new Animated.Value(-12)).current;
    const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

    const insets = useSafeAreaInsets();
    const registerMutation = useRegister();
    const passwordStrength = useMemo(() => evaluatePassword(password), [password]);

    const fullNameError = touched.fullName && fullName.trim().length < 2 ? 'Full name required' : undefined;
    const usernameError = touched.username && username.trim() && !USERNAME_REGEX.test(username.trim())
        ? '3-20 characters, Alphanumeric/Underscore'
        : undefined;
    const emailError = touched.email && !EMAIL_REGEX.test(email) ? 'Invalid email format' : undefined;
    const passwordMeetsRules = passwordStrength.lengthValid && passwordStrength.hasLetters && passwordStrength.hasNumber;
    const passwordError = touched.password && !passwordMeetsRules
        ? 'Must have 8+ chars, letters & numbers'
        : undefined;
    const confirmError = touched.confirmPassword && confirmPassword !== password ? 'Passwords do not match' : undefined;
    const isPasswordValid = passwordMeetsRules;
    const showConfirmPassword = isPasswordValid;
    const showUsernameField = showUsername || username.trim().length > 0;

    const canSubmit =
        !!fullName.trim()
        && (!username.trim() || (username.trim() && !usernameError))
        && EMAIL_REGEX.test(email)
        && passwordMeetsRules
        && confirmPassword === password
        && termsAccepted
        && !registerMutation.isPending
        && !isSubmitting;

    const handleSubmit = () => {
        if (!canSubmit || isSubmitting) return;

        setIsSubmitting(true);
        setFormError(null);

        const trimmedUsername = username.trim();
        const registrationData = {
            name: fullName.trim(),
            email: email.trim(),
            ...(trimmedUsername && { username: trimmedUsername }),
            password,
            role,
        };

        registerMutation.mutate(registrationData, {
            onSuccess: () => setIsSubmitting(false),
            onError: (error: any) => {
                setIsSubmitting(false);
                const detail = error?.response?.data?.detail || error?.response?.data?.message || 'Registration failed';
                setFormError(typeof detail === 'string' && detail.toLowerCase().includes('email') ? 'Email is already registered' : detail);
            },
        });
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
        const target = isKeyboardVisible ? -40 : -12;
        Animated.timing(stageShift, { toValue: target, duration: 200, useNativeDriver: true }).start();
    }, [isKeyboardVisible, stageShift]);

    useEffect(() => {
        const showSub = Keyboard.addListener('keyboardDidShow', () => setIsKeyboardVisible(true));
        const hideSub = Keyboard.addListener('keyboardDidHide', () => setIsKeyboardVisible(false));
        return () => {
            showSub.remove();
            hideSub.remove();
        };
    }, []);

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" translucent />
            <LinearGradient
                colors={['#0E101D', '#0B0E18', '#090B14']}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            />
            <Animated.View style={[styles.warmAura, { transform: [{ translateY: warmTranslate }] }]} pointerEvents="none" />
            <Animated.View style={[styles.coolAura, { transform: [{ translateY: coolTranslate }] }]} pointerEvents="none" />
            <View style={styles.edgeLine} pointerEvents="none" />

            <SafeAreaView style={[styles.safeArea, { paddingTop: insets.top }]}>
                <KeyboardAvoidingView
                    behavior={isIos ? 'padding' : undefined}
                    style={styles.contentWrapper}
                >
                    <ScrollView
                        style={styles.scrollView}
                        contentContainerStyle={styles.scrollContent}
                        keyboardShouldPersistTaps="handled"
                        showsVerticalScrollIndicator={false}
                    >
                        <Animated.View style={[styles.content, isCompact && styles.contentCompact, { transform: [{ translateY: stageShift }] }]}>
                            <View style={[styles.stage, isCompact && styles.stageCompact]}>
                                <View style={[styles.topEdge, isCompact && styles.topEdgeCompact]}>
                                    <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                                        <Ionicons name="arrow-back" size={22} color={COLORS.text.primary} />
                                    </TouchableOpacity>
                                    <View style={styles.titleBlock}>
                                        <Text style={styles.title}>Create account</Text>
                                        <Text style={styles.subtitle}>Direct access to your private gallery.</Text>
                                    </View>
                                </View>

                                <View style={[styles.accountType, isCompact && styles.accountTypeCompact]}>
                                    <Text style={styles.sectionLabel}>Account type</Text>
                                    <View style={styles.rolePills}>
                                        {(['artist', 'collector'] as const).map((option) => (
                                            <TouchableOpacity
                                                key={option}
                                                style={[
                                                    styles.rolePill,
                                                    role === option && styles.rolePillActive,
                                                ]}
                                                onPress={() => setRole(option)}
                                                activeOpacity={0.85}
                                            >
                                                <Ionicons
                                                    name={option === 'artist' ? 'color-palette' : 'person'}
                                                    size={16}
                                                    color={role === option ? COLORS.text.inverse : COLORS.text.secondary}
                                                />
                                                <Text
                                                    style={[
                                                        styles.roleText,
                                                        role === option && styles.roleTextActive,
                                                    ]}
                                                >
                                                    {option === 'artist' ? 'Artist' : 'Collector'}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </View>

                                <View style={[styles.formSection, isCompact && styles.formSectionCompact]}>
                                    <Input
                                        label="Full Name"
                                        placeholder="Alexa Rivera"
                                        value={fullName}
                                        onChangeText={setFullName}
                                        error={fullNameError}
                                        onBlur={() => setTouched((prev) => ({ ...prev, fullName: true }))}
                                    />

                                    {!showUsernameField && (
                                        <TouchableOpacity
                                            style={styles.addUsername}
                                            onPress={() => setShowUsername(true)}
                                            activeOpacity={0.7}
                                        >
                                            <Ionicons name="add" size={16} color={COLORS.text.secondary} />
                                            <Text style={styles.addUsernameText}>Add username (optional)</Text>
                                        </TouchableOpacity>
                                    )}

                                    {showUsernameField && (
                                        <Input
                                            label="Username (optional)"
                                            placeholder="alexa.art"
                                            value={username}
                                            onChangeText={setUsername}
                                            error={usernameError}
                                            onBlur={() => setTouched((prev) => ({ ...prev, username: true }))}
                                        />
                                    )}

                                    <Input
                                        label="Email Address"
                                        placeholder="studio@example.com"
                                        value={email}
                                        onChangeText={setEmail}
                                        keyboardType="email-address"
                                        autoCapitalize="none"
                                        error={emailError}
                                        onBlur={() => setTouched((prev) => ({ ...prev, email: true }))}
                                    />

                                    <Input
                                        label="Password"
                                        placeholder="********"
                                        value={password}
                                        onChangeText={setPassword}
                                        secureTextEntry
                                        error={passwordError}
                                        onBlur={() => setTouched((prev) => ({ ...prev, password: true }))}
                                    />

                                    {password.length > 0 && (
                                        <View style={styles.strengthRow}>
                                            <View style={styles.strengthSegments}>
                                                {SEGMENTS.map((segment) => (
                                                    <View
                                                        key={segment}
                                                        style={[
                                                            styles.strengthBar,
                                                            {
                                                                backgroundColor:
                                                                    segment < passwordStrength.score
                                                                        ? passwordStrength.color
                                                                        : 'rgba(255,255,255,0.08)',
                                                            },
                                                        ]}
                                                    />
                                                ))}
                                            </View>
                                            {passwordStrength.label ? (
                                                <Text style={[styles.strengthLabel, { color: COLORS.text.primary }]}>
                                                    {passwordStrength.label}
                                                </Text>
                                            ) : null}
                                        </View>
                                    )}

                                    {showConfirmPassword && (
                                        <Input
                                            label="Confirm Password"
                                            placeholder="********"
                                            value={confirmPassword}
                                            onChangeText={setConfirmPassword}
                                            secureTextEntry
                                            error={confirmError}
                                            onBlur={() => setTouched((prev) => ({ ...prev, confirmPassword: true }))}
                                        />
                                    )}
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
                                    title="Create Account"
                                    onPress={handleSubmit}
                                    loading={registerMutation.isPending}
                                    disabled={!canSubmit}
                                    style={styles.submitButton}
                                />
                                <TouchableOpacity
                                    style={styles.termsLine}
                                    onPress={() => setTermsAccepted(!termsAccepted)}
                                    activeOpacity={0.8}
                                >
                                    <View style={[styles.termsDot, termsAccepted && styles.termsDotActive]} />
                                    <Text style={[styles.termsText, !termsAccepted && { opacity: 0.7 }]}>
                                        By creating an account you agree to <Text style={styles.termsLink}>Terms</Text> & <Text style={styles.termsLink}>Privacy</Text>
                                    </Text>
                                </TouchableOpacity>
                                <View style={styles.footerRow}>
                                    <Text style={styles.footerText}>Already have an account?</Text>
                                    <TouchableOpacity onPress={() => navigation.navigate('SignIn')}>
                                        <Text style={styles.footerLink}>SIGN IN</Text>
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
    contentWrapper: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: SPACING.xl,
        paddingBottom: SPACING.large,
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
        marginBottom: SPACING.small,
        minHeight: 88,
    },
    topEdgeCompact: {
        minHeight: 72,
        marginBottom: SPACING.tiny,
    },
    backButton: {
        width: 42,
        height: 42,
        borderRadius: 21,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.18)',
        backgroundColor: 'rgba(255,255,255,0.06)',
    },
    titleBlock: {
        flex: 1,
        gap: 6,
    },
    title: {
        fontSize: 28,
        fontWeight: '700',
        color: COLORS.text.primary,
        letterSpacing: 0.2,
    },
    subtitle: {
        color: COLORS.text.secondary,
        fontSize: 15,
        lineHeight: 22,
        maxWidth: '88%',
    },
    accountType: {
        gap: SPACING.small,
        marginBottom: SPACING.medium,
        minHeight: 108,
    },
    accountTypeCompact: {
        gap: SPACING.tiny,
        marginBottom: SPACING.small,
        minHeight: 92,
    },
    sectionLabel: {
        color: COLORS.text.tertiary,
        fontSize: 11,
        letterSpacing: 1.5,
        textTransform: 'uppercase',
        fontWeight: '700',
    },
    rolePills: {
        flexDirection: 'row',
        gap: 12,
    },
    rolePill: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.12)',
        backgroundColor: 'rgba(255,255,255,0.05)',
    },
    rolePillActive: {
        backgroundColor: COLORS.accent.primary,
        borderColor: COLORS.accent.primary,
    },
    roleText: {
        color: COLORS.text.secondary,
        fontSize: 14,
        fontWeight: '600',
    },
    roleTextActive: {
        color: COLORS.text.inverse,
    },
    formSection: {
        gap: SPACING.medium,
    },
    formSectionCompact: {
        gap: SPACING.sm,
    },
    addUsername: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingVertical: 6,
    },
    addUsernameText: {
        color: COLORS.text.secondary,
        fontSize: 14,
        fontWeight: '600',
    },
    strengthRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginTop: -SPACING.small,
        marginBottom: SPACING.small,
    },
    strengthSegments: {
        flexDirection: 'row',
        flex: 1,
        gap: 4,
    },
    strengthBar: {
        height: 3,
        flex: 1,
        borderRadius: 2,
        backgroundColor: 'rgba(255,255,255,0.08)',
    },
    strengthLabel: {
        fontSize: 12,
        fontWeight: '700',
        letterSpacing: 0.4,
    },
    errorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(207, 102, 121, 0.12)',
        paddingVertical: 10,
        paddingHorizontal: 12,
        marginTop: -4,
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
    termsDotActive: {
        backgroundColor: COLORS.accent.primary,
        borderColor: COLORS.accent.primary,
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
    footerRow: {
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

export default CreateAccountScreen;
